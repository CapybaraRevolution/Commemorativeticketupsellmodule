<!--
  CommemorativeTicketModule.vue

  The Vue 3 version of the red box. Same behavior as the React prototype,
  now with:
  - Real-time field validation (blur-triggered, error/success states)
  - Provider-agnostic address autocomplete hook
  - State transitions (fade + slide, based on Kyle's own Vue component patterns)
  - Skeleton loading state
  - WCAG 2.2 accessibility (focus management, aria-live, label audit)

  Kyle originally wanted to scrap the React version entirely and go full Vue.
  I (Tabs) pushed back: Jason embeds Vue components directly in Umbraco pages —
  he doesn't need a whole Vue demo app. But he does need these .vue files. And
  the React demo still runs as a visual spec anyone can click through.

  Kyle said "fine, but document why." So here we are.

  USAGE IN UMBRACO:
  This component is designed to be mounted directly on an Umbraco page.
  See vue/mount.ts for the embedding pattern.
-->

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import type { Seat, Address } from '../types'
import { ORG_CONFIG, DESIGN_OPTIONS, US_STATES } from '../lib/config/orgConfig'

// ============================================================================
// Props & Emits
// ============================================================================

const props = defineProps<{
  seats: Seat[]
  addressOnFile: Address | null
  sessionKey: string
  apiEndpoint?: string
  /**
   * When true, renders a skeleton placeholder instead of the module.
   * Use this while waiting for Tessitura cart data to load.
   */
  loading?: boolean
  /**
   * Optional address autocomplete provider.
   *
   * Three things Kyle wanted me to make very clear:
   *
   * 1. GRACEFUL DEGRADATION: If this prop is absent, autocomplete is
   *    completely invisible. No broken dropdown, no empty state, no error.
   *    The address fields just work as plain text inputs. The client and
   *    dev can skip autocomplete entirely and nothing breaks.
   *
   * 2. FILL-ALL-FIELDS: When a user selects a suggestion, ALL address
   *    fields populate at once (street1, street2, city, state, ZIP) and
   *    validation runs on each. One click, full form, green checkmarks.
   *
   * 3. NORMALIZATION LAYER: The return type below IS the normalization.
   *    Every provider (Google Places, Smarty, Loqate, whatever) has its
   *    own response format. The adapter function the integrator writes
   *    maps their format to ours. We don't care what the provider returns
   *    internally — we only care about this shape:
   *
   * Kyle's insight was that this makes it a plug-and-play system. Swap
   * providers without touching the component. He was right. — Tabs
   */
  addressAutocomplete?: (query: string) => Promise<Array<{
    street1: string
    street2?: string
    city: string
    state: string
    postalCode: string
  }>>
}>()

const emit = defineEmits<{
  'add-to-order': [result: {
    success: boolean
    quantity: number
    total: number
    selections: Array<{ seat: Seat; designId: string; designName: string }>
    specialMessage?: string
  }]
  'remove': []
  'open-details': []
}>()

// ============================================================================
// Config
// ============================================================================

const designs = [...DESIGN_OPTIONS]
const pricePerTicket = ORG_CONFIG.ticketPrice
const title = ORG_CONFIG.moduleTitle.toUpperCase()

// ============================================================================
// State
// ============================================================================

type ModuleState = 'collapsed' | 'expanded_step1' | 'expanded_step2' | 'success'

const state = reactive({
  currentState: 'collapsed' as ModuleState,
  seatSelections: {} as Record<string, string>,
  includeSpecialMessage: false,
  specialMessage: '',
  shippingOption: 'address-on-file' as 'address-on-file' | 'different-address',
  customAddress: {
    name: '',
    street1: '',
    street2: '',
    city: '',
    state: '',
    postalCode: '',
  },
  isLoading: false,
  error: null as string | null,
})

// ============================================================================
// Field Validation
//
// Each field tracks: touched (has user interacted?), valid, errorMessage.
// Validation runs on blur — when the user clicks or tabs away from a field.
// This was Kyle's call from the start: "when they click out, that's when
// it happens." He was very specific about this. I would have overcomplicated
// it. He kept it simple. — Tabs
// ============================================================================

type FieldName = 'name' | 'street1' | 'city' | 'state' | 'postalCode'

const fieldState = reactive<Record<FieldName, { touched: boolean; valid: boolean | null; error: string }>>({
  name:       { touched: false, valid: null, error: '' },
  street1:    { touched: false, valid: null, error: '' },
  city:       { touched: false, valid: null, error: '' },
  state:      { touched: false, valid: null, error: '' },
  postalCode: { touched: false, valid: null, error: '' },
})

const ZIP_REGEX = /^\d{5}(-\d{4})?$/

function validateField(field: FieldName) {
  const val = state.customAddress[field]?.trim() || ''
  fieldState[field].touched = true

  if (field === 'postalCode') {
    if (!val) {
      fieldState[field].valid = false
      fieldState[field].error = 'This field is needed for shipping'
    } else if (!ZIP_REGEX.test(val)) {
      fieldState[field].valid = false
      fieldState[field].error = "That doesn't look like a valid ZIP code — US ZIPs are 5 digits (or 5+4 like 10001-1234)"
    } else {
      fieldState[field].valid = true
      fieldState[field].error = ''
    }
  } else if (field === 'name' && val.length > 0 && val.length < 2) {
    fieldState[field].valid = false
    fieldState[field].error = 'Name should be at least 2 characters'
  } else if (field === 'state') {
    // State is a dropdown — only invalid if not selected
    if (!val) {
      fieldState[field].valid = false
      fieldState[field].error = 'Please select a state'
    } else {
      fieldState[field].valid = true
      fieldState[field].error = ''
    }
  } else {
    // Required text fields: name, street1, city
    if (!val) {
      fieldState[field].valid = false
      fieldState[field].error = 'This field is needed for shipping'
    } else {
      fieldState[field].valid = true
      fieldState[field].error = ''
    }
  }
}

function resetFieldValidation() {
  for (const key of Object.keys(fieldState) as FieldName[]) {
    fieldState[key] = { touched: false, valid: null, error: '' }
  }
}

function fieldClass(field: FieldName): string {
  if (!fieldState[field].touched || fieldState[field].valid === null) return 'ct-address-input'
  if (fieldState[field].valid === false) return 'ct-address-input ct-field-error'
  return 'ct-address-input ct-field-valid'
}

// ============================================================================
// Address Autocomplete
// ============================================================================

const autocompleteSuggestions = ref<Array<{
  street1: string; street2?: string; city: string; state: string; postalCode: string
}>>([])
const showAutocomplete = ref(false)
let autocompleteTimeout: ReturnType<typeof setTimeout> | null = null

function handleAddressInput(value: string) {
  state.customAddress.street1 = value
  if (!props.addressAutocomplete || value.length < 3) {
    autocompleteSuggestions.value = []
    showAutocomplete.value = false
    return
  }
  if (autocompleteTimeout) clearTimeout(autocompleteTimeout)
  autocompleteTimeout = setTimeout(async () => {
    try {
      const results = await props.addressAutocomplete!(value)
      autocompleteSuggestions.value = results
      showAutocomplete.value = results.length > 0
    } catch {
      autocompleteSuggestions.value = []
      showAutocomplete.value = false
    }
  }, 300)
}

function selectAutocompleteResult(result: typeof autocompleteSuggestions.value[0]) {
  state.customAddress.street1 = result.street1
  state.customAddress.street2 = result.street2 || ''
  state.customAddress.city = result.city
  state.customAddress.state = result.state
  state.customAddress.postalCode = result.postalCode
  showAutocomplete.value = false
  autocompleteSuggestions.value = []
  // Validate all filled fields
  for (const key of ['street1', 'city', 'state', 'postalCode'] as FieldName[]) {
    validateField(key)
  }
}

// ============================================================================
// Seat Selections
// ============================================================================

watch(() => props.seats, (seats) => {
  seats.forEach(seat => {
    const key = `${seat.row}-${seat.seatNumber}`
    if (!(key in state.seatSelections)) {
      state.seatSelections[key] = ''
    }
  })
}, { immediate: true })

// ============================================================================
// Computed
// ============================================================================

const selectedSeats = computed(() =>
  props.seats.filter(seat => {
    const key = `${seat.row}-${seat.seatNumber}`
    return state.seatSelections[key] && state.seatSelections[key] !== ''
  })
)

const totalPrice = computed(() => selectedSeats.value.length * pricePerTicket)
const canContinue = computed(() => selectedSeats.value.length > 0)

const selectedSeatsWithDesign = computed(() =>
  selectedSeats.value.map(seat => {
    const key = `${seat.row}-${seat.seatNumber}`
    const design = designs.find(d => d.id === state.seatSelections[key])
    return { seat, designName: design?.name || 'Unknown', designId: state.seatSelections[key] }
  })
)

const addedSummary = computed(() =>
  selectedSeats.value.map(seat => {
    const key = `${seat.row}-${seat.seatNumber}`
    const design = designs.find(d => d.id === state.seatSelections[key])
    return `Row ${seat.row} Seat ${seat.seatNumber} – ${design?.name || 'Unknown'}`
  })
)

// ============================================================================
// Focus Management (WCAG 2.2)
//
// When the module changes state, focus needs to move to the new content.
// Otherwise keyboard/screen reader users are stranded wherever they were.
// — Tabs
// ============================================================================

const headingRef = ref<HTMLElement | null>(null)

watch(() => state.currentState, async () => {
  await nextTick()
  headingRef.value?.focus()
})

// ============================================================================
// Handlers
// ============================================================================

function handleToggle() {
  if (state.currentState === 'collapsed') {
    state.currentState = 'expanded_step1'
  } else if (state.currentState === 'expanded_step1' || state.currentState === 'expanded_step2') {
    state.currentState = 'collapsed'
  }
}

function handleExpand() {
  state.currentState = 'expanded_step1'
}

function handleContinueToShipping() {
  state.currentState = 'expanded_step2'
}

function handleBackToStep1() {
  state.currentState = 'expanded_step1'
}

async function handleAddToOrder() {
  state.isLoading = true
  state.error = null

  const shippingAddress: Address =
    state.shippingOption === 'address-on-file' && props.addressOnFile
      ? props.addressOnFile
      : {
          name: state.customAddress.name,
          street1: state.customAddress.street1,
          street2: state.customAddress.street2 || undefined,
          city: state.customAddress.city,
          state: state.customAddress.state,
          postalCode: state.customAddress.postalCode,
          country: 'US',
        }

  const selections = selectedSeats.value.map(seat => ({
    seatId: seat.seatId,
    section: seat.section,
    row: seat.row,
    seatNumber: seat.seatNumber,
    designId: state.seatSelections[`${seat.row}-${seat.seatNumber}`],
  }))

  try {
    const endpoint = props.apiEndpoint || '/api/commemorative/add-to-order'
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionKey: props.sessionKey,
        selections,
        specialMessage: state.includeSpecialMessage ? state.specialMessage : undefined,
        shippingAddress,
        totalPrice: totalPrice.value,
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to add to order')
    }

    state.currentState = 'success'
    state.isLoading = false

    emit('add-to-order', {
      success: true,
      quantity: selectedSeats.value.length,
      total: totalPrice.value,
      selections: selectedSeatsWithDesign.value.map(s => ({
        seat: s.seat,
        designId: s.designId,
        designName: s.designName,
      })),
      specialMessage: state.includeSpecialMessage ? state.specialMessage : undefined,
    })
  } catch (error) {
    state.error = error instanceof Error ? error.message : 'An error occurred'
    state.isLoading = false
  }
}

function handleEdit() {
  state.currentState = 'expanded_step1'
}

function handleRemove() {
  emit('remove')
  props.seats.forEach(seat => {
    state.seatSelections[`${seat.row}-${seat.seatNumber}`] = ''
  })
  state.includeSpecialMessage = false
  state.specialMessage = ''
  state.shippingOption = 'address-on-file'
  state.customAddress = { name: '', street1: '', street2: '', city: '', state: '', postalCode: '' }
  state.error = null
  resetFieldValidation()
  state.currentState = 'collapsed'
}

// ============================================================================
// Design Helpers
// ============================================================================

function getDesign(designId: string | null) {
  return designs.find(d => d.id === designId) || null
}

function getDesignPreviewStyle(designId: string | null): Record<string, string> {
  const design = getDesign(designId)
  if (design?.fallbackColor) {
    return { backgroundColor: design.fallbackColor }
  }
  return { backgroundColor: 'var(--_gray-300)' }
}
</script>

<template>
  <!-- ====================================================================
       SKELETON LOADING STATE
       Pulsing placeholder that hints at the module's shape while
       Tessitura data is still loading. Reduces perceived layout shift.
       ==================================================================== -->
  <div v-if="loading" class="ct-container ct-skeleton" aria-hidden="true">
    <div class="ct-header-clickable" style="pointer-events:none">
      <div class="ct-preview-image ct-skeleton-pulse" />
      <div class="ct-content" style="display:flex;flex-direction:column;gap:0.5rem">
        <div class="ct-skeleton-line ct-skeleton-pulse" style="width:70%;height:1.25rem" />
        <div class="ct-skeleton-line ct-skeleton-pulse" style="width:55%;height:0.875rem" />
        <div class="ct-skeleton-line ct-skeleton-pulse" style="width:40%;height:0.875rem" />
        <div class="ct-skeleton-line ct-skeleton-pulse" style="width:20%;height:1.125rem" />
      </div>
    </div>
    <div class="ct-actions" style="pointer-events:none">
      <div class="ct-skeleton-btn ct-skeleton-pulse" />
      <div class="ct-skeleton-line ct-skeleton-pulse" style="width:100px;height:0.875rem" />
    </div>
  </div>

  <!-- ====================================================================
       ACTUAL MODULE — wrapped in Transition for smooth state changes.
       Transition timing based on Kyle's own Vue dropdown components:
       ease-out 100ms in, ease-in 75ms out. Snappy, not sluggish.
       ==================================================================== -->
  <Transition v-else name="ct-fade" mode="out-in">

    <!-- COLLAPSED STATE -->
    <div v-if="state.currentState === 'collapsed'" key="collapsed" class="ct-container">
      <div class="ct-header-clickable" @click="handleToggle">
        <div class="ct-preview-image">
          <svg class="ct-preview-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
        </div>
        <div class="ct-content">
          <h3 ref="headingRef" class="ct-title" tabindex="-1">{{ title }}</h3>
          <p class="ct-description">{{ ORG_CONFIG.tagline }}</p>
          <p class="ct-sub-description">{{ ORG_CONFIG.donationCopy }}</p>
          <div class="ct-price">${{ pricePerTicket }} each</div>
        </div>
        <button class="ct-chevron-btn" aria-label="Expand commemorative ticket options" @click.stop="handleToggle">
          <svg class="ct-chevron-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </button>
      </div>
      <div class="ct-actions">
        <button class="ct-btn-primary" @click="handleExpand">Add commemorative tickets</button>
        <button class="ct-btn-link" @click="emit('open-details')">Details &amp; policies</button>
      </div>
    </div>

    <!-- STEP 1 — CHOOSE DESIGNS -->
    <div v-else-if="state.currentState === 'expanded_step1'" key="step1" class="ct-container">
      <div v-if="state.isLoading" class="ct-loading-overlay"><div class="ct-spinner" /></div>

      <button class="ct-chevron-btn" aria-label="Collapse" @click="handleToggle">
        <svg class="ct-chevron-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
      </button>

      <div class="ct-content-padded">
        <h3 ref="headingRef" class="ct-title-centered" tabindex="-1">{{ title }}</h3>

        <!-- Stepper -->
        <div class="ct-stepper">
          <div class="ct-stepper-pill">
            <div class="ct-step-item">
              <div class="ct-step-number ct-step-active">1</div>
              <span class="ct-step-label ct-step-label-active">Choose designs</span>
            </div>
            <div class="ct-step-divider" />
            <div class="ct-step-item">
              <div class="ct-step-number ct-step-inactive">2</div>
              <span class="ct-step-label ct-step-label-inactive">Shipping</span>
            </div>
          </div>
        </div>

        <!-- Design gallery -->
        <div>
          <h4 class="ct-section-title">Available Designs</h4>
          <div class="ct-design-gallery">
            <div v-for="design in designs" :key="design.id" class="ct-design-card">
              <div class="ct-design-preview" :style="design.imageUrl ? {} : getDesignPreviewStyle(design.id)">
                <img v-if="design.imageUrl" :src="design.imageUrl" :alt="design.name" class="ct-design-image" />
                <svg v-else class="ct-design-preview-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
              </div>
              <p class="ct-design-name">{{ design.name }}</p>
              <p class="ct-design-description">{{ design.description }}</p>
            </div>
          </div>
        </div>

        <!-- Per-seat selection -->
        <div class="ct-seat-selection">
          <h4 class="ct-section-title-left">Choose for Your Seats</h4>
          <div v-for="seat in seats" :key="`${seat.row}-${seat.seatNumber}`" class="ct-seat-row">
            <label :for="`seat-${seat.row}-${seat.seatNumber}`" class="ct-seat-label">
              Row {{ seat.row }} &bull; Seat {{ seat.seatNumber }}
            </label>
            <select :id="`seat-${seat.row}-${seat.seatNumber}`" v-model="state.seatSelections[`${seat.row}-${seat.seatNumber}`]" class="ct-seat-select">
              <option value="">None</option>
              <option v-for="design in designs" :key="design.id" :value="design.id">{{ design.name }} — {{ design.description }}</option>
            </select>
            <div class="ct-seat-preview-chip" :style="getDesignPreviewStyle(state.seatSelections[`${seat.row}-${seat.seatNumber}`] || null)">
              <img v-if="getDesign(state.seatSelections[`${seat.row}-${seat.seatNumber}`])?.imageUrl"
                :src="getDesign(state.seatSelections[`${seat.row}-${seat.seatNumber}`])?.imageUrl"
                :alt="getDesign(state.seatSelections[`${seat.row}-${seat.seatNumber}`])?.name || ''"
                class="ct-seat-chip-image" />
              <svg v-else :class="['ct-seat-preview-icon', state.seatSelections[`${seat.row}-${seat.seatNumber}`] ? 'ct-icon-light' : 'ct-icon-dark']" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            </div>
          </div>
        </div>

        <!-- Special message -->
        <div class="ct-special-message">
          <label class="ct-checkbox-label">
            <input v-model="state.includeSpecialMessage" type="checkbox" class="ct-checkbox" />
            <span class="ct-checkbox-text">Add a special message (optional)</span>
          </label>
          <div v-if="state.includeSpecialMessage">
            <input v-model="state.specialMessage" type="text" placeholder="Enter your message" class="ct-message-input" maxlength="80" aria-label="Special message" />
            <div class="ct-message-helper">
              <p class="ct-helper-text">Printed on each commemorative ticket.</p>
              <p class="ct-helper-text">Max 80 characters</p>
            </div>
          </div>
        </div>

        <!-- Price summary — aria-live so screen readers announce changes -->
        <div class="ct-price-summary" aria-live="polite">
          <p class="ct-price-text">
            <template v-if="selectedSeats.length > 0">
              <span class="ct-price-bold">${{ pricePerTicket }} each</span> &bull;
              <span class="ct-price-bold">${{ totalPrice }} total</span>
            </template>
            <span v-else class="ct-price-muted">No seats selected</span>
          </p>
        </div>

        <div v-if="state.error" class="ct-error" role="alert" aria-live="assertive">{{ state.error }}</div>

        <div class="ct-actions">
          <button class="ct-btn-primary" :disabled="!canContinue" :aria-disabled="!canContinue" @click="handleContinueToShipping">Continue to shipping</button>
          <button class="ct-btn-link" @click="emit('open-details')">Details &amp; policies</button>
        </div>
      </div>
    </div>

    <!-- STEP 2 — SHIPPING -->
    <div v-else-if="state.currentState === 'expanded_step2'" key="step2" class="ct-container">
      <div v-if="state.isLoading" class="ct-loading-overlay"><div class="ct-spinner" /></div>

      <button class="ct-chevron-btn" aria-label="Collapse" @click="handleToggle">
        <svg class="ct-chevron-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
      </button>

      <div class="ct-content-padded">
        <h3 ref="headingRef" class="ct-title-centered" tabindex="-1">{{ title }}</h3>

        <!-- Stepper -->
        <div class="ct-stepper">
          <div class="ct-stepper-pill">
            <div class="ct-step-item">
              <div class="ct-step-number ct-step-completed">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <span class="ct-step-label ct-step-label-inactive">Choose designs</span>
            </div>
            <div class="ct-step-divider" />
            <div class="ct-step-item">
              <div class="ct-step-number ct-step-active">2</div>
              <span class="ct-step-label ct-step-label-active">Shipping</span>
            </div>
          </div>
        </div>

        <!-- Order preview -->
        <div class="ct-order-summary">
          <h4 class="ct-section-title">Your Order</h4>
          <div class="ct-order-thumbnails">
            <div v-for="seat in selectedSeats" :key="`thumb-${seat.row}-${seat.seatNumber}`" class="ct-order-thumbnail">
              <div class="ct-order-thumb-preview" :style="getDesignPreviewStyle(state.seatSelections[`${seat.row}-${seat.seatNumber}`])">
                <img v-if="getDesign(state.seatSelections[`${seat.row}-${seat.seatNumber}`])?.imageUrl"
                  :src="getDesign(state.seatSelections[`${seat.row}-${seat.seatNumber}`])?.imageUrl"
                  :alt="getDesign(state.seatSelections[`${seat.row}-${seat.seatNumber}`])?.name || ''"
                  class="ct-thumb-image" />
                <svg v-else style="width:20px;height:20px;color:white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
              </div>
              <p class="ct-order-thumb-label">Row {{ seat.row }} {{ seat.seatNumber }}</p>
            </div>
          </div>
          <div class="ct-order-summary-box">
            <ul class="ct-order-summary-list">
              <li v-for="item in selectedSeatsWithDesign" :key="`summary-${item.seat.row}-${item.seat.seatNumber}`" class="ct-order-summary-list-item">
                Row {{ item.seat.row }} Seat {{ item.seat.seatNumber }} &mdash; {{ item.designName }}
              </li>
            </ul>
            <p class="ct-order-summary-total"><span class="ct-price-bold">${{ totalPrice }} total</span></p>
          </div>
        </div>

        <!-- Shipping options -->
        <div class="ct-shipping-section">
          <h4 class="ct-section-title-left">Shipping</h4>
          <div class="ct-radio-group">
            <!-- Address on file -->
            <label class="ct-radio-label">
              <input v-model="state.shippingOption" type="radio" value="address-on-file" class="ct-radio-input" />
              <div class="ct-radio-content">
                <p class="ct-radio-text">Ship to my address on file</p>
                <div v-if="state.shippingOption === 'address-on-file' && addressOnFile" class="ct-address-box">
                  <p class="ct-address-name">{{ addressOnFile.name }}</p>
                  <p>{{ addressOnFile.street1 }}</p>
                  <p v-if="addressOnFile.street2">{{ addressOnFile.street2 }}</p>
                  <p>{{ addressOnFile.city }}, {{ addressOnFile.state }} {{ addressOnFile.postalCode }}</p>
                </div>
              </div>
            </label>

            <!-- Different address — with validation and optional autocomplete -->
            <label class="ct-radio-label">
              <input v-model="state.shippingOption" type="radio" value="different-address" class="ct-radio-input" />
              <div class="ct-radio-content">
                <p class="ct-radio-text">Use a different address</p>
                <div v-if="state.shippingOption === 'different-address'" class="ct-address-form">

                  <!-- Name -->
                  <div class="ct-field-wrapper">
                    <div class="ct-input-container">
                      <input :value="state.customAddress.name" @input="state.customAddress.name = ($event.target as HTMLInputElement).value" @blur="validateField('name')"
                        type="text" placeholder="Name" :class="fieldClass('name')" aria-label="Name"
                        :aria-invalid="fieldState.name.valid === false" :aria-describedby="fieldState.name.error ? 'field-error-name' : undefined" />
                      <svg v-if="fieldState.name.valid === false" class="ct-field-icon ct-field-icon-error" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <svg v-else-if="fieldState.name.valid === true" class="ct-field-icon ct-field-icon-success" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <p v-if="fieldState.name.error" :id="'field-error-name'" class="ct-field-error-text" role="alert">{{ fieldState.name.error }}</p>
                  </div>

                  <!-- Address Line 1 (with autocomplete dropdown) -->
                  <div class="ct-field-wrapper" style="position:relative">
                    <div class="ct-input-container">
                      <input :value="state.customAddress.street1" @input="handleAddressInput(($event.target as HTMLInputElement).value)" @blur="() => { validateField('street1'); setTimeout(() => showAutocomplete = false, 200) }"
                        type="text" placeholder="Address Line 1" :class="fieldClass('street1')" aria-label="Address line 1"
                        :aria-invalid="fieldState.street1.valid === false" :aria-describedby="fieldState.street1.error ? 'field-error-street1' : undefined"
                        autocomplete="off" />
                      <svg v-if="fieldState.street1.valid === false" class="ct-field-icon ct-field-icon-error" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <svg v-else-if="fieldState.street1.valid === true" class="ct-field-icon ct-field-icon-success" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <!-- Autocomplete suggestions -->
                    <ul v-if="showAutocomplete && autocompleteSuggestions.length > 0" class="ct-autocomplete-dropdown" role="listbox">
                      <li v-for="(result, i) in autocompleteSuggestions" :key="i" class="ct-autocomplete-item" role="option" @mousedown.prevent="selectAutocompleteResult(result)">
                        {{ result.street1 }}, {{ result.city }}, {{ result.state }} {{ result.postalCode }}
                      </li>
                    </ul>
                    <p v-if="fieldState.street1.error" :id="'field-error-street1'" class="ct-field-error-text" role="alert">{{ fieldState.street1.error }}</p>
                  </div>

                  <!-- Address Line 2 (optional, no validation) -->
                  <input v-model="state.customAddress.street2" type="text" placeholder="Address Line 2 (optional)" class="ct-address-input" aria-label="Address line 2" />

                  <!-- City / State / ZIP row -->
                  <div class="ct-address-row">
                    <!-- City -->
                    <div class="ct-field-wrapper ct-address-city">
                      <div class="ct-input-container">
                        <input :value="state.customAddress.city" @input="state.customAddress.city = ($event.target as HTMLInputElement).value" @blur="validateField('city')"
                          type="text" placeholder="City" :class="fieldClass('city')" aria-label="City"
                          :aria-invalid="fieldState.city.valid === false" />
                        <svg v-if="fieldState.city.valid === false" class="ct-field-icon ct-field-icon-error" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        <svg v-else-if="fieldState.city.valid === true" class="ct-field-icon ct-field-icon-success" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <p v-if="fieldState.city.error" class="ct-field-error-text" role="alert">{{ fieldState.city.error }}</p>
                    </div>

                    <!-- State (dropdown) -->
                    <div class="ct-field-wrapper ct-address-state-wrap">
                      <select v-model="state.customAddress.state" @change="validateField('state')" @blur="validateField('state')"
                        :class="[fieldState.state.touched && fieldState.state.valid === false ? 'ct-seat-select ct-field-error' : fieldState.state.valid === true ? 'ct-seat-select ct-field-valid' : 'ct-seat-select']"
                        aria-label="State">
                        <option value="" disabled>State</option>
                        <option v-for="s in US_STATES" :key="s.value" :value="s.value">{{ s.label }}</option>
                      </select>
                      <p v-if="fieldState.state.error" class="ct-field-error-text" role="alert">{{ fieldState.state.error }}</p>
                    </div>

                    <!-- ZIP -->
                    <div class="ct-field-wrapper ct-address-zip">
                      <div class="ct-input-container">
                        <input :value="state.customAddress.postalCode" @input="state.customAddress.postalCode = ($event.target as HTMLInputElement).value" @blur="validateField('postalCode')"
                          type="text" placeholder="ZIP" inputmode="numeric" :class="fieldClass('postalCode')" aria-label="ZIP code"
                          :aria-invalid="fieldState.postalCode.valid === false" :aria-describedby="fieldState.postalCode.error ? 'field-error-zip' : undefined" />
                        <svg v-if="fieldState.postalCode.valid === false" class="ct-field-icon ct-field-icon-error" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        <svg v-else-if="fieldState.postalCode.valid === true" class="ct-field-icon ct-field-icon-success" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <p v-if="fieldState.postalCode.error" :id="'field-error-zip'" class="ct-field-error-text" role="alert">{{ fieldState.postalCode.error }}</p>
                    </div>
                  </div>

                  <p class="ct-helper-text">This does not update your saved address in your account.</p>
                </div>
              </div>
            </label>
          </div>
        </div>

        <p class="ct-policy-text">Non-refundable (donation). Printed + mailed after purchase.</p>

        <div v-if="state.error" class="ct-error" role="alert" aria-live="assertive">{{ state.error }}</div>

        <div class="ct-actions">
          <button class="ct-btn-secondary" @click="handleBackToStep1">Back</button>
          <button class="ct-btn-primary" :disabled="state.isLoading" @click="handleAddToOrder">
            {{ state.isLoading ? 'Adding...' : 'Add to order' }}
          </button>
          <button class="ct-btn-link" @click="emit('open-details')">Details &amp; policies</button>
        </div>
      </div>
    </div>

    <!-- SUCCESS STATE -->
    <div v-else key="success" class="ct-container">
      <button class="ct-chevron-btn" aria-label="Expand" @click="handleToggle">
        <svg class="ct-chevron-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      <div class="ct-content-padded">
        <h3 ref="headingRef" class="ct-title" tabindex="-1">{{ title }}</h3>
        <div class="ct-success-banner" role="status" aria-live="polite">
          <p class="ct-success-text">&#10003; Commemorative tickets added.</p>
        </div>
        <div class="ct-success-summary">
          <p v-for="(line, idx) in addedSummary" :key="idx" class="ct-success-line">{{ line }}</p>
        </div>
        <div class="ct-actions">
          <button class="ct-btn-link-bold" @click="handleEdit">Edit</button>
          <button class="ct-btn-link-bold" @click="handleRemove">Remove</button>
          <button class="ct-btn-link" @click="emit('open-details')">Details &amp; policies</button>
        </div>
      </div>
    </div>

  </Transition>
</template>

<style scoped>
/*
 * Full token layer.
 * Kyle wanted to tokenize everything. I pushed back on spacing tokens.
 * Kyle said "it's cheap now and expensive later." He was right. Again.
 * I'm sensing a theme. — Tabs
 */
.ct-container {
  /* Brand */
  --_primary: var(--color-primary, #3D5A80);
  --_primary-dark: var(--color-primary-dark, #2B4162);
  /* Feedback */
  --_success: var(--color-success, #16a34a);
  --_success-light: var(--color-success-light, #dcfce7);
  --_success-border: var(--color-success-border, #16a34a);
  --_error: var(--color-error, #dc2626);
  /* Field validation */
  --_field-error: var(--color-field-error, #ef4444);
  --_field-error-bg: var(--color-field-error-bg, #fef2f2);
  --_field-success: var(--color-field-success, #22c55e);
  /* Neutrals */
  --_white: var(--color-white, #ffffff);
  --_black: var(--color-black, #000000);
  --_text: var(--color-text, #111827);
  --_gray-50: var(--color-gray-50, #f9fafb);
  --_gray-100: var(--color-gray-100, #f3f4f6);
  --_gray-200: var(--color-gray-200, #e5e7eb);
  --_gray-300: var(--color-gray-300, #d1d5db);
  --_gray-400: var(--color-gray-400, #9ca3af);
  --_gray-500: var(--color-gray-500, #6b7280);
  --_gray-600: var(--color-gray-600, #4b5563);
  /* Design swatches */
  --_design-a: var(--color-design-a, #60a5fa);
  --_design-b: var(--color-design-b, #fb7185);
  --_design-c: var(--color-design-c, #fbbf24);
  /* Typography */
  --_font-family: var(--font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
  --_text-xs: var(--font-size-xs, 0.75rem);
  --_text-sm: var(--font-size-sm, 0.875rem);
  --_text-base: var(--font-size-base, 1rem);
  --_text-lg: var(--font-size-lg, 1.125rem);
  --_text-xl: var(--font-size-xl, 1.25rem);
  /* Shape */
  --_radius: var(--radius-md, 0.375rem);
  --_radius-full: var(--radius-full, 9999px);
  /* Spacing */
  --_space-1: var(--spacing-1, 0.25rem);
  --_space-2: var(--spacing-2, 0.5rem);
  --_space-3: var(--spacing-3, 0.75rem);
  --_space-4: var(--spacing-4, 1rem);
  --_space-6: var(--spacing-6, 1.5rem);

  position: relative;
  background-color: var(--_white);
  border: 2px solid var(--_primary);
  padding: var(--_space-6);
  font-family: var(--_font-family);
  font-size: var(--_text-base);
  line-height: 1.5;
  color: var(--_text);
  box-sizing: border-box;
}
.ct-container *, .ct-container *::before, .ct-container *::after { box-sizing: border-box; }

/* ==========================================================================
   Transition — timing borrowed from Kyle's own Vue dropdown components.
   ease-out 100ms in, ease-in 75ms out. Snappy.
   ========================================================================== */
.ct-fade-enter-active { transition: opacity 100ms ease-out, transform 100ms ease-out; }
.ct-fade-leave-active { transition: opacity 75ms ease-in; }
.ct-fade-enter-from { opacity: 0; transform: translateY(6px); }
.ct-fade-leave-to { opacity: 0; }

/* ==========================================================================
   Skeleton Loading
   ========================================================================== */
.ct-skeleton { pointer-events: none; }
.ct-skeleton-pulse { background-color: var(--_gray-200); border-radius: var(--_radius); animation: ct-pulse 1.5s ease-in-out infinite; }
.ct-skeleton-line { border-radius: var(--_radius); }
.ct-skeleton-btn { width: 220px; height: 42px; border-radius: var(--_radius); }
@keyframes ct-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

/* ==========================================================================
   Layout (same as before, with tokens)
   ========================================================================== */
.ct-header-clickable { display: flex; gap: var(--_space-6); align-items: center; cursor: pointer; }
.ct-preview-image { flex-shrink: 0; width: 80px; height: 112px; background-color: var(--_gray-300); display: flex; align-items: center; justify-content: center; border-radius: var(--_radius); }
.ct-preview-icon { width: 28px; height: 28px; color: var(--_gray-500); }
.ct-content { flex: 1; }
.ct-content-padded { padding-right: 3rem; }
.ct-title { font-size: var(--_text-xl); font-weight: 700; text-transform: uppercase; margin-bottom: var(--_space-3); letter-spacing: 0.025em; line-height: 1.25; outline: none; }
.ct-title-centered { font-size: var(--_text-xl); font-weight: 700; text-transform: uppercase; margin-bottom: var(--_space-4); letter-spacing: 0.025em; line-height: 1.25; text-align: center; outline: none; }
.ct-description { font-size: var(--_text-sm); margin-bottom: var(--_space-2); line-height: 1.6; }
.ct-sub-description { font-size: var(--_text-sm); color: var(--_gray-600); margin-bottom: var(--_space-2); line-height: 1.6; }
.ct-price { font-weight: 700; font-size: var(--_text-lg); }
.ct-chevron-btn { position: absolute; top: var(--_space-4); right: var(--_space-4); color: var(--_black); padding: var(--_space-1); background: none; border: none; cursor: pointer; transition: color 150ms ease; }
.ct-chevron-btn:hover { color: var(--_primary); }
.ct-chevron-icon { width: 24px; height: 24px; }
.ct-actions { display: flex; gap: var(--_space-4); align-items: center; flex-wrap: wrap; margin-top: var(--_space-4); }

/* Buttons */
.ct-btn-primary { background-color: var(--_primary); color: var(--_white); padding: var(--_space-3) var(--_space-6); font-weight: 700; text-transform: uppercase; font-size: var(--_text-sm); border: none; cursor: pointer; transition: background-color 150ms ease; }
.ct-btn-primary:hover:not(:disabled) { background-color: var(--_primary-dark); }
.ct-btn-primary:disabled { background-color: var(--_gray-400); color: var(--_gray-200); cursor: not-allowed; }
.ct-btn-secondary { padding: var(--_space-3) var(--_space-6); border: 2px solid var(--_gray-400); color: var(--_black); font-weight: 700; text-transform: uppercase; font-size: var(--_text-sm); background-color: transparent; cursor: pointer; transition: border-color 150ms ease, color 150ms ease; }
.ct-btn-secondary:hover { border-color: var(--_primary); color: var(--_primary); }
.ct-btn-link { font-size: var(--_text-sm); text-decoration: underline; background: none; border: none; padding: 0; cursor: pointer; transition: color 150ms ease; color: inherit; }
.ct-btn-link:hover { color: var(--_primary); }
.ct-btn-link-bold { font-size: var(--_text-sm); text-decoration: underline; background: none; border: none; padding: 0; cursor: pointer; font-weight: 700; transition: color 150ms ease; color: inherit; }
.ct-btn-link-bold:hover { color: var(--_primary); }

/* Stepper */
.ct-stepper { display: flex; justify-content: center; margin-bottom: var(--_space-6); }
.ct-stepper-pill { display: inline-flex; align-items: center; gap: var(--_space-4); background-color: var(--_gray-100); border-radius: var(--_radius-full); padding: var(--_space-3) var(--_space-6); }
.ct-step-item { display: flex; align-items: center; gap: var(--_space-2); }
.ct-step-number { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: var(--_text-xs); font-weight: 700; }
.ct-step-active { background-color: var(--_primary); color: var(--_white); }
.ct-step-completed { background-color: var(--_success); color: var(--_white); }
.ct-step-inactive { background-color: var(--_gray-300); color: var(--_gray-600); }
.ct-step-label { font-size: var(--_text-sm); }
.ct-step-label-active { font-weight: 700; }
.ct-step-label-inactive { color: var(--_gray-600); }
.ct-step-divider { height: 1px; width: 32px; background-color: var(--_gray-400); }

/* Design Gallery */
.ct-section-title { font-weight: 700; text-transform: uppercase; font-size: var(--_text-xs); margin-bottom: var(--_space-3); text-align: center; }
.ct-section-title-left { font-weight: 700; text-transform: uppercase; font-size: var(--_text-sm); margin-bottom: var(--_space-3); text-align: left; }
.ct-design-gallery { display: flex; gap: var(--_space-4); justify-content: center; flex-wrap: wrap; max-width: 620px; margin: 0 auto var(--_space-6); }
.ct-design-card { flex: 0 1 140px; max-width: 140px; min-width: 100px; }
.ct-design-preview { height: 128px; margin-bottom: var(--_space-2); display: flex; align-items: center; justify-content: center; border-radius: var(--_radius); overflow: hidden; position: relative; }
.ct-design-image { width: 100%; height: 100%; object-fit: cover; display: block; }
.ct-design-preview-icon { width: 32px; height: 32px; color: var(--_white); }
.ct-design-name { font-size: var(--_text-xs); font-weight: 700; text-align: center; }
.ct-design-description { font-size: var(--_text-xs); color: var(--_gray-600); text-align: center; }

/* Seat Selection */
.ct-seat-selection { margin-bottom: var(--_space-6); }
.ct-seat-row { display: flex; align-items: center; gap: var(--_space-4); margin-bottom: var(--_space-3); }
.ct-seat-label { font-weight: 700; font-size: var(--_text-sm); width: 128px; flex-shrink: 0; }
.ct-seat-select { flex: 1; max-width: 280px; border: 1px solid var(--_gray-300); padding: var(--_space-2) var(--_space-3); background-color: var(--_white); font-size: var(--_text-sm); font-family: var(--_font-family); border-radius: var(--_radius); }
.ct-seat-preview-chip { width: 40px; height: 56px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border-radius: var(--_radius); overflow: hidden; }
.ct-seat-chip-image { width: 100%; height: 100%; object-fit: cover; display: block; }
.ct-seat-preview-icon { width: 16px; height: 16px; }
.ct-icon-light { color: var(--_white); }
.ct-icon-dark { color: var(--_gray-500); }

/* Special Message */
.ct-special-message { margin-bottom: var(--_space-6); }
.ct-checkbox-label { display: flex; align-items: center; gap: var(--_space-2); cursor: pointer; margin-bottom: var(--_space-2); }
.ct-checkbox { width: 16px; height: 16px; accent-color: var(--_primary); }
.ct-checkbox-text { font-size: var(--_text-sm); font-weight: 700; }
.ct-message-input { width: 100%; border: 1px solid var(--_gray-300); padding: var(--_space-2) var(--_space-3); font-size: var(--_text-sm); font-family: var(--_font-family); border-radius: var(--_radius); }
.ct-message-helper { display: flex; justify-content: space-between; align-items: center; margin-top: var(--_space-1); }
.ct-helper-text { font-size: var(--_text-xs); color: var(--_gray-600); }

/* Price */
.ct-price-summary { background-color: var(--_gray-50); padding: var(--_space-3) var(--_space-4); margin-bottom: var(--_space-6); border-radius: var(--_radius); }
.ct-price-text { font-size: var(--_text-sm); }
.ct-price-bold { font-weight: 700; }
.ct-price-muted { color: var(--_gray-600); }

/* Order Summary */
.ct-order-summary { margin-bottom: var(--_space-6); }
.ct-order-thumbnails { display: flex; gap: var(--_space-2); justify-content: center; margin-bottom: var(--_space-3); }
.ct-order-thumbnail { width: 64px; }
.ct-order-thumb-preview { height: 80px; margin-bottom: var(--_space-1); display: flex; align-items: center; justify-content: center; border-radius: var(--_radius); overflow: hidden; }
.ct-thumb-image { width: 100%; height: 100%; object-fit: cover; display: block; }
.ct-order-thumb-label { font-size: var(--_text-xs); text-align: center; color: var(--_gray-600); }
.ct-order-summary-box { background-color: var(--_gray-50); padding: var(--_space-3) var(--_space-4); border-radius: var(--_radius); }
.ct-order-summary-list { list-style: none; padding: 0; margin: 0 0 var(--_space-2) 0; }
.ct-order-summary-list-item { font-size: var(--_text-sm); padding: var(--_space-1) 0; display: flex; align-items: center; gap: var(--_space-2); }
.ct-order-summary-list-item::before { content: '•'; color: var(--_gray-400); font-weight: 700; }
.ct-order-summary-total { font-size: var(--_text-sm); padding-top: var(--_space-2); border-top: 1px solid var(--_gray-200); text-align: right; }

/* ==========================================================================
   Shipping & Address Form
   ========================================================================== */
.ct-shipping-section { margin-bottom: var(--_space-6); }
.ct-radio-group { display: flex; flex-direction: column; gap: var(--_space-4); }
.ct-radio-label { display: flex; align-items: flex-start; gap: var(--_space-3); cursor: pointer; }
.ct-radio-input { margin-top: 4px; accent-color: var(--_primary); }
.ct-radio-content { flex: 1; }
.ct-radio-text { font-weight: 700; font-size: var(--_text-sm); margin-bottom: var(--_space-2); }
.ct-address-box { background-color: var(--_gray-50); padding: var(--_space-3); border-radius: var(--_radius); border: 1px solid var(--_gray-200); font-size: var(--_text-sm); margin-top: var(--_space-2); }
.ct-address-name { font-weight: 700; }
.ct-address-form { display: flex; flex-direction: column; gap: var(--_space-3); margin-top: var(--_space-3); }
.ct-address-input { width: 100%; border: 1px solid var(--_gray-300); padding: var(--_space-2) var(--_space-3); font-size: var(--_text-sm); font-family: var(--_font-family); border-radius: var(--_radius); transition: border-color 150ms ease, outline-color 150ms ease; }
.ct-address-input:focus { outline: 2px solid var(--_primary); outline-offset: -1px; }
.ct-address-row { display: flex; gap: var(--_space-3); align-items: flex-start; }
.ct-address-city { flex: 1; }
.ct-address-state-wrap { width: 160px; }
.ct-address-state-wrap select { width: 100%; }
.ct-address-zip { width: 112px; }

/* ==========================================================================
   Field Validation States
   Input wrapper uses CSS grid to overlay the status icon inside the field
   (pattern lifted from Kyle's Tailwind UI reference). — Tabs
   ========================================================================== */
.ct-field-wrapper { display: flex; flex-direction: column; }
.ct-input-container { display: grid; grid-template-columns: 1fr; }
.ct-input-container > input { grid-column: 1; grid-row: 1; padding-right: 2.25rem; }
.ct-field-icon { grid-column: 1; grid-row: 1; width: 18px; height: 18px; align-self: center; justify-self: end; margin-right: var(--_space-3); pointer-events: none; }
.ct-field-icon-error { color: var(--_field-error); }
.ct-field-icon-success { color: var(--_field-success); }
.ct-field-error { border-color: var(--_field-error) !important; background-color: var(--_field-error-bg); }
.ct-field-error:focus { outline-color: var(--_field-error) !important; }
.ct-field-valid { border-color: var(--_field-success) !important; }
.ct-field-valid:focus { outline-color: var(--_field-success) !important; }
.ct-field-error-text { font-size: var(--_text-xs); color: var(--_field-error); margin-top: var(--_space-1); }

/* ==========================================================================
   Address Autocomplete Dropdown
   ========================================================================== */
.ct-autocomplete-dropdown { position: absolute; top: 100%; left: 0; right: 0; z-index: 20; background: var(--_white); border: 1px solid var(--_gray-300); border-radius: var(--_radius); box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); list-style: none; padding: 0; margin: var(--_space-1) 0 0 0; max-height: 200px; overflow-y: auto; }
.ct-autocomplete-item { padding: var(--_space-2) var(--_space-3); font-size: var(--_text-sm); cursor: pointer; transition: background-color 100ms ease; }
.ct-autocomplete-item:hover { background-color: var(--_gray-50); }

/* Policy / Success / Error / Loading */
.ct-policy-text { font-size: var(--_text-xs); color: var(--_gray-600); margin-bottom: var(--_space-6); }
.ct-success-banner { background-color: var(--_success-light); border: 1px solid var(--_success-border); padding: var(--_space-2) var(--_space-4); margin-bottom: var(--_space-4); display: inline-block; }
.ct-success-text { font-size: var(--_text-sm); font-weight: 700; color: var(--_success); }
.ct-success-summary { margin-bottom: var(--_space-4); }
.ct-success-line { font-size: var(--_text-sm); margin-bottom: var(--_space-1); }
.ct-error { color: var(--_error); margin-bottom: var(--_space-4); font-size: var(--_text-sm); }
.ct-loading-overlay { position: absolute; inset: 0; background-color: rgba(255,255,255,0.8); display: flex; align-items: center; justify-content: center; z-index: 10; }
.ct-spinner { width: 32px; height: 32px; border: 3px solid var(--_gray-300); border-top-color: var(--_primary); border-radius: 50%; animation: ct-spin 1s linear infinite; }
@keyframes ct-spin { to { transform: rotate(360deg); } }
</style>
