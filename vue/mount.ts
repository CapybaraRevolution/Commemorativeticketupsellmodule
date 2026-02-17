/**
 * Umbraco Embedding Example
 *
 * This file shows how to mount the CommemorativeTicketModule on an Umbraco page.
 * Jason — this is the pattern. The component is self-contained; you just need
 * a div to mount it on and the data to pass as props.
 *
 * The data (seats, address, sessionKey) would come from whatever Tessitura
 * integration you already have on the cart page. The module doesn't care
 * how you get it — it just needs the props.
 *
 * Kyle wanted me (Tabs) to point out: the import paths below assume you've
 * copied the relevant files into your project. Adjust to match your actual
 * directory structure. The vue/ components import from ../types and
 * ../lib/config/orgConfig — make sure those paths resolve in your build.
 *
 * — Tabs
 */

import { createApp, ref } from 'vue'
import CommemorativeTicketModule from './CommemorativeTicketModule.vue'
import DetailsModal from './DetailsModal.vue'

/**
 * Mount the Commemorative Ticket Module onto a page.
 *
 * Call this from your Umbraco page's script once the cart data is available.
 *
 * @param selector - CSS selector for the mount target (e.g., '#commemorative-ticket-module')
 * @param data - Cart data from Tessitura
 */
export function mountCommemorativeTicketModule(
  selector: string,
  data: {
    seats: Array<{
      section: string
      row: string
      seatNumber: string
      price: number
      seatId?: number
    }>
    addressOnFile: {
      name: string
      street1: string
      street2?: string
      city: string
      state: string
      postalCode: string
      country: string
    } | null
    sessionKey: string
    /** Override the API endpoint URL if needed */
    apiEndpoint?: string
  }
) {
  const el = document.querySelector(selector)
  if (!el) {
    console.error(`[CommemorativeTicket] Mount target "${selector}" not found`)
    return
  }

  // Create a wrapper app that manages both the module and the modal
  const app = createApp({
    setup() {
      const isModalOpen = ref(false)

      function handleAddToOrder(result: unknown) {
        console.log('[CommemorativeTicket] Added to order:', result)
        // INTEGRATION NOTE: Update the parent page's cart display here.
        // This might mean dispatching a custom event, calling a global
        // function, or updating a shared state store — depends on
        // how the Umbraco page is structured.
        el.dispatchEvent(new CustomEvent('commemorative-added', { detail: result, bubbles: true }))
      }

      function handleRemove() {
        console.log('[CommemorativeTicket] Removed')
        el.dispatchEvent(new CustomEvent('commemorative-removed', { bubbles: true }))
      }

      return {
        isModalOpen,
        handleAddToOrder,
        handleRemove,
        seats: data.seats,
        addressOnFile: data.addressOnFile,
        sessionKey: data.sessionKey,
        apiEndpoint: data.apiEndpoint,
      }
    },
    components: { CommemorativeTicketModule, DetailsModal },
    template: `
      <CommemorativeTicketModule
        :seats="seats"
        :address-on-file="addressOnFile"
        :session-key="sessionKey"
        :api-endpoint="apiEndpoint"
        @add-to-order="handleAddToOrder"
        @remove="handleRemove"
        @open-details="isModalOpen = true"
      />
      <DetailsModal
        :is-open="isModalOpen"
        @close="isModalOpen = false"
      />
    `,
  })

  app.mount(el)

  // Return the app instance in case you need to unmount later
  return app
}

/**
 * Usage example (paste into your Umbraco page or its script):
 *
 * <div id="commemorative-ticket-module"></div>
 *
 * <script>
 *   // After your Tessitura cart data is loaded:
 *   mountCommemorativeTicketModule('#commemorative-ticket-module', {
 *     seats: [
 *       { section: 'Orchestra', row: 'B', seatNumber: '13', price: 99, seatId: 100001 },
 *       { section: 'Orchestra', row: 'B', seatNumber: '14', price: 99, seatId: 100002 },
 *     ],
 *     addressOnFile: {
 *       name: 'Jane Doe',
 *       street1: '123 Main St',
 *       city: 'New York',
 *       state: 'NY',
 *       postalCode: '10001',
 *       country: 'US',
 *     },
 *     sessionKey: 'tessitura-session-from-cookie',
 *   });
 *
 *   // Listen for events:
 *   document.querySelector('#commemorative-ticket-module')
 *     .addEventListener('commemorative-added', (e) => {
 *       console.log('Tickets added:', e.detail);
 *       // Update cart total, show line item, etc.
 *     });
 * </script>
 */
