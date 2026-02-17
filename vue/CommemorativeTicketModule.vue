<!--
  CommemorativeTicketModule.vue

  The Vue 3 version of the red box. Same behavior as the React prototype,
  translated into idiomatic Vue 3 Composition API with <script setup>.

  Kyle originally wanted to scrap the React version entirely and go full Vue.
  I (Tabs) pushed back: Jason embeds Vue components directly in Umbraco pages —
  he doesn't need a whole Vue demo app. But he does need these .vue files. And
  the React demo still runs as a visual spec anyone can click through. So now
  both exist, each doing what it's good at.

  Kyle said "fine, but document why." So here we are.

  USAGE IN UMBRACO:
  This component is designed to be mounted directly on an Umbraco page.
  See vue/mount.ts for the embedding pattern. It expects props passed
  from whatever system populates the cart page.

  All org-specific values come from lib/config/orgConfig.ts.
  All types come from types/index.ts.
  Both are pure TypeScript — no framework dependencies.
-->

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import type { Seat, Address } from '../types'
import { ORG_CONFIG, DESIGN_OPTIONS } from '../lib/config/orgConfig'

// ============================================================================
// Props & Emits
// ============================================================================

const props = defineProps<{
  /** Seats currently in the cart (from Tessitura via parent page) */
  seats: Seat[]
  /** User's primary address from Tessitura. Null if none on file. */
  addressOnFile: Address | null
  /** Tessitura session key for API calls */
  sessionKey: string
  /** URL for the add-to-order API endpoint */
  apiEndpoint?: string
}>()

const emit = defineEmits<{
  /** Fired when commemorative tickets are successfully added to order */
  'add-to-order': [result: {
    success: boolean
    quantity: number
    total: number
    selections: Array<{ seat: Seat; designId: string; designName: string }>
    specialMessage?: string
  }]
  /** Fired when commemorative tickets are removed */
  'remove': []
  /** Fired when "Details & policies" is clicked */
  'open-details': []
}>()

// ============================================================================
// Config
// ============================================================================

// Pull from the central config so org-specific values aren't hardcoded here.
const designs = [...DESIGN_OPTIONS]
const pricePerTicket = ORG_CONFIG.ticketPrice
const title = ORG_CONFIG.moduleTitle.toUpperCase()

// ============================================================================
// State
//
// In React we used a reducer because 8+ pieces of interdependent state
// get messy with individual useState calls. In Vue, reactive() gives us
// a single reactive object that's naturally what a reducer provides —
// except we don't need the dispatch/action boilerplate. Kyle asked if
// this was "cheating." No, Kyle. It's just Vue being Vue. — Tabs
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

// Initialize seat selections when seats prop arrives
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

  // Build shipping address — "Use a different address" does NOT update Tessitura.
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
  // Reset all state
  props.seats.forEach(seat => {
    state.seatSelections[`${seat.row}-${seat.seatNumber}`] = ''
  })
  state.includeSpecialMessage = false
  state.specialMessage = ''
  state.shippingOption = 'address-on-file'
  state.customAddress = { name: '', street1: '', street2: '', city: '', state: '', postalCode: '' }
  state.error = null
  state.currentState = 'collapsed'
}

// ============================================================================
// Design color helpers
// ============================================================================

function getDesignColorClass(designId: string | null): string {
  switch (designId) {
    case 'design-a': return 'ct-design-a'
    case 'design-b': return 'ct-design-b'
    case 'design-c': return 'ct-design-c'
    default: return 'ct-design-none'
  }
}
</script>

<template>
  <!-- ====================================================================
       COLLAPSED STATE
       The invitation. Sits in the cart, doesn't demand attention.
       ==================================================================== -->
  <div v-if="state.currentState === 'collapsed'" class="ct-container">
    <div class="ct-header-clickable" @click="handleToggle">
      <div class="ct-preview-image">
        <!-- Placeholder image icon (SVG inline to avoid icon library dependency) -->
        <svg class="ct-preview-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
      </div>
      <div class="ct-content">
        <h3 class="ct-title">{{ title }}</h3>
        <p class="ct-description">{{ ORG_CONFIG.tagline }}</p>
        <p class="ct-sub-description">{{ ORG_CONFIG.donationCopy }}</p>
        <div class="ct-price">${{ pricePerTicket }} each</div>
      </div>
      <button
        class="ct-chevron-btn"
        aria-label="Expand"
        @click.stop="handleToggle"
      >
        <svg class="ct-chevron-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </button>
    </div>
    <div class="ct-actions">
      <button class="ct-btn-primary" @click="handleExpand">
        Add commemorative tickets
      </button>
      <button class="ct-btn-link" @click="emit('open-details')">
        Details &amp; policies
      </button>
    </div>
  </div>

  <!-- ====================================================================
       STEP 1 — CHOOSE DESIGNS
       The fun step. Per-seat design assignment.
       ==================================================================== -->
  <div v-else-if="state.currentState === 'expanded_step1'" class="ct-container">
    <div v-if="state.isLoading" class="ct-loading-overlay"><div class="ct-spinner" /></div>

    <button class="ct-chevron-btn" aria-label="Collapse" @click="handleToggle">
      <svg class="ct-chevron-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
    </button>

    <div class="ct-content-padded">
      <h3 class="ct-title-centered">{{ title }}</h3>

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
            <div :class="['ct-design-preview', getDesignColorClass(design.id)]">
              <svg class="ct-design-preview-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
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
          <select
            :id="`seat-${seat.row}-${seat.seatNumber}`"
            v-model="state.seatSelections[`${seat.row}-${seat.seatNumber}`]"
            class="ct-seat-select"
          >
            <option value="">None</option>
            <option v-for="design in designs" :key="design.id" :value="design.id">
              {{ design.name }} — {{ design.description }}
            </option>
          </select>
          <div :class="['ct-seat-preview-chip', getDesignColorClass(state.seatSelections[`${seat.row}-${seat.seatNumber}`])]">
            <svg :class="['ct-seat-preview-icon', state.seatSelections[`${seat.row}-${seat.seatNumber}`] ? 'ct-icon-light' : 'ct-icon-dark']" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
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
          <input
            v-model="state.specialMessage"
            type="text"
            placeholder="Enter your message"
            class="ct-message-input"
            maxlength="80"
            aria-label="Special message"
          />
          <div class="ct-message-helper">
            <p class="ct-helper-text">Printed on each commemorative ticket.</p>
            <p class="ct-helper-text">Max 80 characters</p>
          </div>
        </div>
      </div>

      <!-- Price summary -->
      <div class="ct-price-summary">
        <p class="ct-price-text">
          <template v-if="selectedSeats.length > 0">
            <span class="ct-price-bold">${{ pricePerTicket }} each</span>
            &bull;
            <span class="ct-price-bold">${{ totalPrice }} total</span>
          </template>
          <span v-else class="ct-price-muted">No seats selected</span>
        </p>
      </div>

      <p v-if="state.error" class="ct-error">{{ state.error }}</p>

      <div class="ct-actions">
        <button class="ct-btn-primary" :disabled="!canContinue" @click="handleContinueToShipping">
          Continue to shipping
        </button>
        <button class="ct-btn-link" @click="emit('open-details')">Details &amp; policies</button>
      </div>
    </div>
  </div>

  <!-- ====================================================================
       STEP 2 — SHIPPING
       V1: Single address only. Multi-address is roadmap.
       ==================================================================== -->
  <div v-else-if="state.currentState === 'expanded_step2'" class="ct-container">
    <div v-if="state.isLoading" class="ct-loading-overlay"><div class="ct-spinner" /></div>

    <button class="ct-chevron-btn" aria-label="Collapse" @click="handleToggle">
      <svg class="ct-chevron-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
    </button>

    <div class="ct-content-padded">
      <h3 class="ct-title-centered">{{ title }}</h3>

      <!-- Stepper: Step 1 completed, Step 2 active -->
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
            <div :class="['ct-order-thumb-preview', getDesignColorClass(state.seatSelections[`${seat.row}-${seat.seatNumber}`])]">
              <svg style="width:20px;height:20px;color:white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
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
          <p class="ct-order-summary-total">
            <span class="ct-price-bold">${{ totalPrice }} total</span>
          </p>
        </div>
      </div>

      <!-- Shipping options -->
      <div class="ct-shipping-section">
        <h4 class="ct-section-title-left">Shipping</h4>
        <div class="ct-radio-group">
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

          <label class="ct-radio-label">
            <input v-model="state.shippingOption" type="radio" value="different-address" class="ct-radio-input" />
            <div class="ct-radio-content">
              <!-- "Use a different address" — not "Edit address". Per Jason's Tessitura guidance. -->
              <p class="ct-radio-text">Use a different address</p>
              <div v-if="state.shippingOption === 'different-address'" class="ct-address-form">
                <input v-model="state.customAddress.name" type="text" placeholder="Name" class="ct-address-input" aria-label="Name" />
                <input v-model="state.customAddress.street1" type="text" placeholder="Address Line 1" class="ct-address-input" aria-label="Address line 1" />
                <input v-model="state.customAddress.street2" type="text" placeholder="Address Line 2 (optional)" class="ct-address-input" aria-label="Address line 2" />
                <div class="ct-address-row">
                  <input v-model="state.customAddress.city" type="text" placeholder="City" class="ct-address-input ct-address-city" aria-label="City" />
                  <input v-model="state.customAddress.state" type="text" placeholder="State" class="ct-address-input ct-address-state" aria-label="State" />
                  <input v-model="state.customAddress.postalCode" type="text" placeholder="ZIP" class="ct-address-input ct-address-zip" aria-label="ZIP code" />
                </div>
                <p class="ct-helper-text">This does not update your saved address in your account.</p>
              </div>
            </div>
          </label>
        </div>
      </div>

      <p class="ct-policy-text">Non-refundable (donation). Printed + mailed after purchase.</p>

      <p v-if="state.error" class="ct-error">{{ state.error }}</p>

      <div class="ct-actions">
        <button class="ct-btn-secondary" @click="handleBackToStep1">Back</button>
        <button class="ct-btn-primary" :disabled="state.isLoading" @click="handleAddToOrder">
          {{ state.isLoading ? 'Adding...' : 'Add to order' }}
        </button>
        <button class="ct-btn-link" @click="emit('open-details')">Details &amp; policies</button>
      </div>
    </div>
  </div>

  <!-- ====================================================================
       SUCCESS STATE
       ==================================================================== -->
  <div v-else class="ct-container">
    <button class="ct-chevron-btn" aria-label="Expand" @click="handleToggle">
      <svg class="ct-chevron-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
    </button>
    <div class="ct-content-padded">
      <h3 class="ct-title">{{ title }}</h3>
      <div class="ct-success-banner">
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
</template>

<style scoped>
/*
 * Scoped styles for the Commemorative Ticket Module.
 *
 * Uses CSS custom properties from the host page for theming.
 * If the host doesn't define them, the fallbacks here keep it looking decent.
 * When embedded in Umbraco, the host page's CSS custom properties take precedence.
 *
 * The class names are prefixed with ct- (commemorative ticket) to avoid
 * collisions with the host page's styles. Scoped styles handle most of
 * that, but the prefix is extra insurance for Umbraco embedding.
 */

/*
 * Design token layer.
 *
 * Every color used in this component resolves through a CSS custom property.
 * If the Umbraco host page defines --color-primary (or any of these), it wins.
 * If not, the fallback values here keep things looking presentable.
 *
 * This is the tokenization strategy Kyle wanted: swap the host page's
 * custom properties and the whole module rebrands. No digging through
 * individual style rules. — Tabs
 *
 * What IS tokenized: everything visual.
 * Colors, font family, border radius, spacing, and font sizes all resolve
 * through custom properties. Kyle wanted this from the start. I pushed back
 * on spacing tokens, said no client would ever ask for different padding.
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

  /* Border radius */
  --_radius: var(--radius-md, 0.375rem);
  --_radius-full: var(--radius-full, 9999px);

  /* Spacing scale — 4px base, geometric progression.
     These are the same values from the React prototype's globals.css.
     If the host page has its own spacing scale, it takes precedence. */
  --_space-1: var(--spacing-1, 0.25rem);   /* 4px  — tight: helper text margins */
  --_space-2: var(--spacing-2, 0.5rem);    /* 8px  — small: input padding, checkbox gap */
  --_space-3: var(--spacing-3, 0.75rem);   /* 12px — medium: section margins, button padding */
  --_space-4: var(--spacing-4, 1rem);      /* 16px — default: action gaps, chevron offset */
  --_space-6: var(--spacing-6, 1.5rem);    /* 24px — large: container padding, section spacing */

  /* Font sizes */
  --_text-xs: var(--font-size-xs, 0.75rem);   /* 12px — helper text, labels */
  --_text-sm: var(--font-size-sm, 0.875rem);  /* 14px — body text, inputs */
  --_text-base: var(--font-size-base, 1rem);   /* 16px — root */
  --_text-lg: var(--font-size-lg, 1.125rem);   /* 18px — price display */
  --_text-xl: var(--font-size-xl, 1.25rem);    /* 20px — module title */

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

/* Header */
.ct-header-clickable { display: flex; gap: var(--_space-6); align-items: center; cursor: pointer; }
.ct-preview-image { flex-shrink: 0; width: 80px; height: 112px; background-color: var(--_gray-300); display: flex; align-items: center; justify-content: center; border-radius: var(--_radius); }
.ct-preview-icon { width: 28px; height: 28px; color: var(--_gray-500); }
.ct-content { flex: 1; }
.ct-content-padded { padding-right: 3rem; }
.ct-title { font-size: var(--_text-xl); font-weight: 700; text-transform: uppercase; margin-bottom: var(--_space-3); letter-spacing: 0.025em; line-height: 1.25; }
.ct-title-centered { font-size: var(--_text-xl); font-weight: 700; text-transform: uppercase; margin-bottom: var(--_space-4); letter-spacing: 0.025em; line-height: 1.25; text-align: center; }
.ct-description { font-size: var(--_text-sm); margin-bottom: var(--_space-2); line-height: 1.6; }
.ct-sub-description { font-size: var(--_text-sm); color: var(--_gray-600); margin-bottom: var(--_space-2); line-height: 1.6; }
.ct-price { font-weight: 700; font-size: var(--_text-lg); }

/* Chevron */
.ct-chevron-btn { position: absolute; top: var(--_space-4); right: var(--_space-4); color: var(--_black); padding: var(--_space-1); background: none; border: none; cursor: pointer; transition: color 150ms ease; }
.ct-chevron-btn:hover { color: var(--_primary); }
.ct-chevron-icon { width: 24px; height: 24px; }

/* Actions */
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
.ct-design-gallery { display: flex; gap: var(--_space-4); justify-content: center; max-width: 500px; margin: 0 auto var(--_space-6); }
.ct-design-card { flex: 1; max-width: 140px; }
.ct-design-preview { height: 128px; margin-bottom: var(--_space-2); display: flex; align-items: center; justify-content: center; border-radius: var(--_radius); }
.ct-design-a { background-color: var(--_design-a); }
.ct-design-b { background-color: var(--_design-b); }
.ct-design-c { background-color: var(--_design-c); }
.ct-design-none { background-color: var(--_gray-300); }
.ct-design-preview-icon { width: 32px; height: 32px; color: var(--_white); }
.ct-design-name { font-size: var(--_text-xs); font-weight: 700; text-align: center; }
.ct-design-description { font-size: var(--_text-xs); color: var(--_gray-600); text-align: center; }

/* Seat Selection */
.ct-seat-selection { margin-bottom: var(--_space-6); }
.ct-seat-row { display: flex; align-items: center; gap: var(--_space-4); margin-bottom: var(--_space-3); }
.ct-seat-label { font-weight: 700; font-size: var(--_text-sm); width: 128px; flex-shrink: 0; }
.ct-seat-select { flex: 1; max-width: 280px; border: 1px solid var(--_gray-300); padding: var(--_space-2) var(--_space-3); background-color: var(--_white); font-size: var(--_text-sm); font-family: var(--_font-family); }
.ct-seat-preview-chip { width: 40px; height: 56px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border-radius: var(--_radius); }
.ct-seat-preview-icon { width: 16px; height: 16px; }
.ct-icon-light { color: var(--_white); }
.ct-icon-dark { color: var(--_gray-500); }

/* Special Message */
.ct-special-message { margin-bottom: var(--_space-6); }
.ct-checkbox-label { display: flex; align-items: center; gap: var(--_space-2); cursor: pointer; margin-bottom: var(--_space-2); }
.ct-checkbox { width: 16px; height: 16px; accent-color: var(--_primary); }
.ct-checkbox-text { font-size: var(--_text-sm); font-weight: 700; }
.ct-message-input { width: 100%; border: 1px solid var(--_gray-300); padding: var(--_space-2) var(--_space-3); font-size: var(--_text-sm); font-family: var(--_font-family); }
.ct-message-helper { display: flex; justify-content: space-between; align-items: center; margin-top: var(--_space-1); }
.ct-helper-text { font-size: var(--_text-xs); color: var(--_gray-600); }

/* Price Summary */
.ct-price-summary { background-color: var(--_gray-50); padding: var(--_space-3) var(--_space-4); margin-bottom: var(--_space-6); border-radius: var(--_radius); }
.ct-price-text { font-size: var(--_text-sm); }
.ct-price-bold { font-weight: 700; }
.ct-price-muted { color: var(--_gray-600); }

/* Order Summary */
.ct-order-summary { margin-bottom: var(--_space-6); }
.ct-order-thumbnails { display: flex; gap: var(--_space-2); justify-content: center; margin-bottom: var(--_space-3); }
.ct-order-thumbnail { width: 64px; }
.ct-order-thumb-preview { height: 80px; margin-bottom: var(--_space-1); display: flex; align-items: center; justify-content: center; border-radius: var(--_radius); }
.ct-order-thumb-label { font-size: var(--_text-xs); text-align: center; color: var(--_gray-600); }
.ct-order-summary-box { background-color: var(--_gray-50); padding: var(--_space-3) var(--_space-4); border-radius: var(--_radius); }
.ct-order-summary-list { list-style: none; padding: 0; margin: 0 0 var(--_space-2) 0; }
.ct-order-summary-list-item { font-size: var(--_text-sm); padding: var(--_space-1) 0; display: flex; align-items: center; gap: var(--_space-2); }
.ct-order-summary-list-item::before { content: '•'; color: var(--_gray-400); font-weight: 700; }
.ct-order-summary-total { font-size: var(--_text-sm); padding-top: var(--_space-2); border-top: 1px solid var(--_gray-200); text-align: right; }

/* Shipping */
.ct-shipping-section { margin-bottom: var(--_space-6); }
.ct-radio-group { display: flex; flex-direction: column; gap: var(--_space-4); }
.ct-radio-label { display: flex; align-items: flex-start; gap: var(--_space-3); cursor: pointer; }
.ct-radio-input { margin-top: 4px; accent-color: var(--_primary); }
.ct-radio-content { flex: 1; }
.ct-radio-text { font-weight: 700; font-size: var(--_text-sm); margin-bottom: var(--_space-2); }
.ct-address-box { background-color: var(--_gray-50); padding: var(--_space-3); border-radius: var(--_radius); border: 1px solid var(--_gray-200); font-size: var(--_text-sm); margin-top: var(--_space-2); }
.ct-address-name { font-weight: 700; }
.ct-address-form { display: flex; flex-direction: column; gap: var(--_space-3); margin-top: var(--_space-3); }
.ct-address-input { width: 100%; border: 1px solid var(--_gray-300); padding: var(--_space-2) var(--_space-3); font-size: var(--_text-sm); font-family: var(--_font-family); }
.ct-address-row { display: flex; gap: var(--_space-3); }
.ct-address-city { flex: 1; }
.ct-address-state { width: 96px; }
.ct-address-zip { width: 112px; }

/* Policy */
.ct-policy-text { font-size: var(--_text-xs); color: var(--_gray-600); margin-bottom: var(--_space-6); }

/* Success */
.ct-success-banner { background-color: var(--_success-light); border: 1px solid var(--_success-border); padding: var(--_space-2) var(--_space-4); margin-bottom: var(--_space-4); display: inline-block; }
.ct-success-text { font-size: var(--_text-sm); font-weight: 700; color: var(--_success); }
.ct-success-summary { margin-bottom: var(--_space-4); }
.ct-success-line { font-size: var(--_text-sm); margin-bottom: var(--_space-1); }

/* Error */
.ct-error { color: var(--_error); margin-bottom: var(--_space-4); font-size: var(--_text-sm); }

/* Loading */
.ct-loading-overlay { position: absolute; inset: 0; background-color: rgba(255,255,255,0.8); display: flex; align-items: center; justify-content: center; z-index: 10; }
.ct-spinner { width: 32px; height: 32px; border: 3px solid var(--_gray-300); border-top-color: var(--_primary); border-radius: 50%; animation: ct-spin 1s linear infinite; }
@keyframes ct-spin { to { transform: rotate(360deg); } }
</style>
