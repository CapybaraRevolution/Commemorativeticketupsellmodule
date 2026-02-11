'use client';

/**
 * Cart Page (DEMO ONLY)
 *
 * This page is scaffolding. It exists to give the CommemorativeTicketModule
 * a realistic-looking home so you can see how it behaves inside a checkout flow.
 *
 * If you're integrating the module into a real site, ignore this file entirely.
 * The module doesn't care what page it lives on — it just needs seats, an
 * address, and a session key passed as props.
 *
 * The logo says "VENUE." because this is a generic demo that could represent
 * any performing arts organization. Kyle didn't want anyone squinting at the
 * screen during a client meeting and going "wait, is this a different org's
 * website?" It's nobody's website. It's a prototype. — Tabs
 */

import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { CommemorativeTicketModule } from '@/components/CommemorativeTicketModule';
import { DetailsModal } from '@/components/DetailsModal';
import { DEMO_CART } from '@/lib/config/orgConfig';
import type { Seat, Address, GetCartResponse } from '@/types';
import styles from './page.module.css';

interface CommemorativeItem {
  selections: Array<{
    seat: Seat;
    designId: string;
    designName: string;
  }>;
  specialMessage?: string;
  price: number;
}

export default function CartPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [commemorativeItem, setCommemorativeItem] = useState<CommemorativeItem | null>(null);

  // Data from API (or fallback)
  const [seats, setSeats] = useState<Seat[]>([]);
  const [addressOnFile, setAddressOnFile] = useState<Address | null>(null);
  const [sessionKey, setSessionKey] = useState('');
  const [eventName, setEventName] = useState('');
  const [performanceDate, setPerformanceDate] = useState('');
  const [venue, setVenue] = useState('');
  const [ticketTotal, setTicketTotal] = useState(0);

  // Fetch cart data on mount.
  // In the real world, this comes from Tessitura via the API route.
  // If that fails (or we're just running the demo locally), fall back
  // to the generic demo data from orgConfig.
  useEffect(() => {
    async function fetchCart() {
      try {
        const response = await fetch('/api/cart');
        const data: GetCartResponse = await response.json();

        setSeats(data.cart.seats);
        setAddressOnFile(data.addressOnFile);
        setSessionKey(data.cart.sessionKey);
        setEventName(data.cart.eventName);
        setPerformanceDate(data.cart.performanceDate);
        setVenue(data.cart.venue);
        setTicketTotal(data.cart.ticketTotal);
      } catch (error) {
        console.error('Failed to fetch cart, using demo fallback:', error);
        setSeats(DEMO_CART.seats.map(s => ({ ...s })));
        setAddressOnFile({ ...DEMO_CART.address });
        setSessionKey('demo-session-12345');
        setEventName(DEMO_CART.eventName);
        setPerformanceDate(DEMO_CART.performanceDate);
        setVenue(DEMO_CART.venue);
        setTicketTotal(DEMO_CART.ticketTotal);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCart();
  }, []);

  const handleAddToOrder = (result: {
    success: boolean;
    quantity: number;
    total: number;
    selections: Array<{ seat: Seat; designId: string; designName: string }>;
    specialMessage?: string;
  }) => {
    if (result.success) {
      setCommemorativeItem({
        selections: result.selections,
        specialMessage: result.specialMessage,
        price: result.total,
      });
    }
  };

  const handleRemove = () => {
    setCommemorativeItem(null);
  };

  // Cart math (the demo scaffolding, not the module's concern)
  const serviceFee = 10;
  const commemorativePrice = commemorativeItem?.price || 0;
  const total = ticketTotal + serviceFee + commemorativePrice;

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Timer banner — demo chrome, the module doesn't know about this */}
      <div className={styles.timerBanner}>
        <div className={styles.timerContent}>
          <AlertCircle className={styles.timerIcon} />
          <span className={styles.timerText}>
            19:26 remaining until your tickets expire.
          </span>
        </div>
      </div>

      {/* Header — generic "VENUE." placeholder logo */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>VENUE.</div>
          <nav className={styles.steps}>
            <span className={styles.stepInactive}>1. Choose Your Seats</span>
            <span className={styles.stepActive}>2. Your Cart</span>
            <span className={styles.stepInactive}>3. Delivery Method</span>
            <span className={styles.stepInactive}>4. Payment</span>
            <span className={styles.stepInactive}>5. Confirmation</span>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.mainInner}>
          <h2 className={styles.pageTitle}>YOUR CART</h2>

          {/* Ticket line item — static demo scaffolding */}
          <div className={styles.ticketSection}>
            <div className={styles.ticketHeader}>
              <div className={styles.ticketInfo}>
                <h3 className={styles.eventTitle}>{eventName}</h3>
                <p className={styles.eventDate}>
                  <span className={styles.eventDateBold}>{performanceDate.split(' | ')[0]}</span>
                  {' | '}
                  {performanceDate.split(' | ')[1]}
                </p>
                <p className={styles.eventVenue}>{venue}</p>
                <div className={styles.seatList}>
                  {seats.map((seat, idx) => (
                    <p key={idx} className={styles.seatLine}>
                      Row: <span className={styles.seatLineBold}>{seat.row}</span>
                      {' | '}
                      Seat: <span className={styles.seatLineBold}>{seat.seatNumber}</span>
                    </p>
                  ))}
                </div>
              </div>
              <div className={styles.ticketActions}>
                <button className={styles.ticketLink}>Remove</button>
                <button className={styles.ticketLink}>Choose New Seats</button>
              </div>
            </div>
            <div className={styles.ticketFooter}>
              <span className={styles.ticketQuantity}>{seats.length} x Full</span>
              <span className={styles.ticketPrice}>${ticketTotal}</span>
            </div>
          </div>

          {/* ============================================================
              THE MODULE — this is the only real thing on this page.
              Everything above and below is just context for the demo.
              ============================================================ */}
          <div className={styles.upsellSection}>
            <CommemorativeTicketModule
              seats={seats}
              addressOnFile={addressOnFile}
              sessionKey={sessionKey}
              onAddToOrder={handleAddToOrder}
              onRemove={handleRemove}
              onOpenDetails={() => setIsModalOpen(true)}
            />
          </div>

          {/* Cart summary — demo scaffolding */}
          <div className={styles.cartSummary}>
            <div className={styles.summaryLine}>
              <span className={styles.summaryLabel}>Ticket Service Fee:</span>
              <span className={styles.summaryValue}>${serviceFee}</span>
            </div>

            {commemorativeItem && (
              <div className={styles.commemorativeLine}>
                <div className={styles.commemorativeDetails}>
                  <span className={styles.commemorativeLabel}>
                    Commemorative tickets x{commemorativeItem.selections.length}
                  </span>
                  <div className={styles.commemorativeItems}>
                    {commemorativeItem.selections.map((selection, idx) => (
                      <div key={idx} className={styles.commemorativeItem}>
                        Ticket {idx + 1}: {selection.designName}
                      </div>
                    ))}
                  </div>
                </div>
                <div className={styles.commemorativeActions}>
                  <span className={styles.commemorativePrice}>${commemorativeItem.price}</span>
                  <button className={styles.editLink}>Edit</button>
                  <span className={styles.separator}>|</span>
                  <button onClick={handleRemove} className={styles.editLink}>
                    Remove
                  </button>
                </div>
              </div>
            )}

            <div className={styles.totalLine}>
              <span className={styles.totalLabel}>Cart Total:</span>
              <span className={styles.totalValue}>${total}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom bar — demo chrome */}
      <div className={styles.bottomBar}>
        <div className={styles.bottomBarInner}>
          <div className={styles.bottomTotal}>
            CART TOTAL: <span>${total}</span>
          </div>
          <div className={styles.bottomButtons}>
            <button className={styles.continueButton}>Continue Shopping</button>
            <button className={styles.checkoutButton}>
              CHECKOUT
              <span className={styles.checkoutArrow}>&rarr;</span>
            </button>
          </div>
        </div>
      </div>

      {/* Details Modal — part of the module, not the demo */}
      <DetailsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
