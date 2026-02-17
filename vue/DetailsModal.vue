<!--
  DetailsModal.vue

  Vue 3 port of the policy/details modal.

  Kyle was insistent about the "not valid for admission" yellow box being
  impossible to miss. I wanted to put it inline. He wanted it to hit you
  in the face. He was right — the last thing you want is someone showing
  up to the theater waving a commemorative ticket at an usher. — Tabs

  All org-specific copy comes from lib/config/orgConfig.ts.
-->

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { ORG_CONFIG } from '../lib/config/orgConfig'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  'close': []
}>()

const modalRef = ref<HTMLElement | null>(null)

const { orgName, seasonLabel, supportEmail } = ORG_CONFIG

// ESC key handler
function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.isOpen) {
    emit('close')
  }
}

onMounted(() => document.addEventListener('keydown', handleKeyDown))
onUnmounted(() => document.removeEventListener('keydown', handleKeyDown))

// Focus trap + body scroll lock
watch(() => props.isOpen, async (open) => {
  if (open) {
    document.body.style.overflow = 'hidden'
    await nextTick()
    if (modalRef.value) {
      const focusable = modalRef.value.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      focusable?.focus()
    }
  } else {
    document.body.style.overflow = ''
  }
})

onUnmounted(() => { document.body.style.overflow = '' })
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="dm-overlay" role="dialog" aria-modal="true" aria-labelledby="dm-title">
      <div class="dm-backdrop" @click="emit('close')" aria-hidden="true" />

      <div class="dm-modal" ref="modalRef">
        <!-- Header -->
        <div class="dm-header">
          <h2 id="dm-title" class="dm-title">Commemorative Ticket Details &amp; Policies</h2>
          <button class="dm-close-btn" aria-label="Close modal" @click="emit('close')">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <!-- Content -->
        <div class="dm-content">
          <div class="dm-important-box">
            <p class="dm-important-text">
              IMPORTANT: This commemorative ticket is a keepsake and is not valid for admission.
              You will still need your regular ticket for entry.
            </p>
          </div>

          <section class="dm-section">
            <h3 class="dm-section-title">What You Get</h3>
            <p class="dm-section-text">
              A physical commemorative ticket for the {{ seasonLabel }}, featuring
              exclusive artwork celebrating the season. This beautiful keepsake will be
              professionally printed and mailed to your specified address.
            </p>
          </section>

          <section class="dm-section">
            <h3 class="dm-section-title">Supporting {{ orgName }}</h3>
            <p class="dm-section-text">
              Your commemorative ticket purchase includes a donation to support {{ orgName }}.
              As a nonprofit organization, your contribution helps continue producing
              world-class programming and serving the community.
            </p>
          </section>

          <section class="dm-section">
            <h3 class="dm-section-title">Refund Policy</h3>
            <p class="dm-section-text">
              Commemorative tickets are non-refundable as they constitute a charitable donation
              to {{ orgName }}. All sales are final once your order is processed.
            </p>
            <p class="dm-section-text-secondary">
              Commemorative tickets are souvenirs only and are not valid for admission.
            </p>
          </section>

          <section class="dm-section">
            <h3 class="dm-section-title">Shipping &amp; Fulfillment</h3>
            <p class="dm-section-text">
              Your commemorative ticket will be printed and mailed within 2–3 weeks of purchase.
              Please allow an additional 5–7 business days for delivery within the United States.
              International shipping may take longer.
            </p>
            <p class="dm-section-text" style="margin-top: 0.5rem">
              Tickets will be shipped to the address you specify during checkout. Please ensure
              your shipping address is correct, as we cannot redirect shipments once they have
              been sent.
            </p>
            <!-- V1: Single address only. Multi-address is roadmap. — Tabs -->
          </section>

          <section class="dm-section">
            <h3 class="dm-section-title">Fulfillment Partner</h3>
            <p class="dm-section-text">
              Commemorative tickets are fulfilled by WWL (World Wide Logistics). For questions
              about your order or shipping status, please contact our support team at
              <a :href="`mailto:${supportEmail}`" class="dm-link">{{ supportEmail }}</a>.
            </p>
          </section>

          <section class="dm-section">
            <h3 class="dm-section-title">Design Selection</h3>
            <p class="dm-section-text">
              Choose from exclusive designs celebrating the {{ seasonLabel }}. Each design
              features original artwork commissioned specifically for this commemorative series.
              Limited edition designs may sell out and become unavailable.
            </p>
          </section>
        </div>

        <!-- Footer -->
        <div class="dm-footer">
          <button class="dm-footer-btn" @click="emit('close')">Close</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.dm-overlay { position: fixed; inset: 0; z-index: 50; display: flex; align-items: center; justify-content: center; }
.dm-backdrop { position: absolute; inset: 0; background-color: rgba(0,0,0,0.6); }
.dm-modal { position: relative; background-color: #fff; width: 100%; max-width: 672px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
.dm-header { position: sticky; top: 0; background-color: #fff; border-bottom: 2px solid #000; padding: 1.5rem; display: flex; justify-content: space-between; align-items: flex-start; }
.dm-title { font-size: 1.5rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.025em; }
.dm-close-btn { color: #000; flex-shrink: 0; margin-left: 1rem; padding: 0.25rem; background: none; border: none; cursor: pointer; transition: color 150ms ease; }
.dm-close-btn:hover { color: var(--color-primary, #3D5A80); }
.dm-content { padding: 1.5rem; }
.dm-important-box { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 0.75rem; margin-bottom: 1.5rem; border-radius: 0.375rem; }
.dm-important-text { font-size: 0.875rem; font-weight: 700; color: #92400e; }
.dm-section { margin-bottom: 1.5rem; }
.dm-section:last-child { margin-bottom: 0; }
.dm-section-title { font-weight: 700; text-transform: uppercase; font-size: 1.125rem; margin-bottom: 0.5rem; }
.dm-section-text { font-size: 0.875rem; line-height: 1.6; }
.dm-section-text-secondary { font-size: 0.875rem; line-height: 1.6; margin-top: 0.5rem; color: #4b5563; }
.dm-link { text-decoration: underline; transition: color 150ms ease; }
.dm-link:hover { color: var(--color-primary, #3D5A80); }
.dm-footer { position: sticky; bottom: 0; background-color: #fff; border-top: 2px solid #000; padding: 1.5rem; }
.dm-footer-btn { background-color: var(--color-primary, #3D5A80); color: #fff; padding: 0.75rem 2rem; font-weight: 700; text-transform: uppercase; border: none; cursor: pointer; transition: background-color 150ms ease; }
.dm-footer-btn:hover { background-color: var(--color-primary-dark, #2B4162); }
</style>
