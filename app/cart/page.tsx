'use client';

/**
 * Cart Page
 * 
 * Demo page showing a fake cart with the CommemorativeTicketModule
 */

import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { CommemorativeTicketModule } from '@/components/CommemorativeTicketModule';
import { DetailsModal } from '@/components/DetailsModal';
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
  
  // Data from API
  const [seats, setSeats] = useState<Seat[]>([]);
  const [addressOnFile, setAddressOnFile] = useState<Address | null>(null);
  const [sessionKey, setSessionKey] = useState('');
  const [eventName, setEventName] = useState('');
  const [performanceDate, setPerformanceDate] = useState('');
  const [venue, setVenue] = useState('');
  const [ticketTotal, setTicketTotal] = useState(0);

  // Fetch cart data on mount
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
        console.error('Failed to fetch cart:', error);
        // Use fallback data for demo
        setSeats([
          { section: 'Orchestra', row: 'B', seatNumber: '13', price: 99 },
          { section: 'Orchestra', row: 'B', seatNumber: '14', price: 99 },
          { section: 'Orchestra', row: 'B', seatNumber: '15', price: 99 },
        ]);
        setAddressOnFile({
          name: 'Kyle Lastname',
          street1: '123 Main St',
          street2: 'Apt 4B',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
        });
        setSessionKey('demo-session-12345');
        setEventName('ULYSSES');
        setPerformanceDate('Friday, January 23 | 7:30 PM');
        setVenue('Martinson Hall');
        setTicketTotal(297);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCart();
  }, []);

  // Handle commemorative ticket added
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

  // Handle remove commemorative tickets
  const handleRemove = () => {
    setCommemorativeItem(null);
  };

  // Calculate totals
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
      {/* Timer Banner */}
      <div className={styles.timerBanner}>
        <div className={styles.timerContent}>
          <AlertCircle className={styles.timerIcon} />
          <span className={styles.timerText}>
            ⏱ 19:26 remaining until your tickets expire.
          </span>
        </div>
      </div>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>PUBLIC.</div>
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

          {/* Ticket Line Item */}
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

          {/* Commemorative Ticket Upsell */}
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

          {/* Cart Summary */}
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

      {/* Bottom Bar */}
      <div className={styles.bottomBar}>
        <div className={styles.bottomBarInner}>
          <div className={styles.bottomTotal}>
            CART TOTAL: <span>${total}</span>
          </div>
          <div className={styles.bottomButtons}>
            <button className={styles.continueButton}>Continue Shopping</button>
            <button className={styles.checkoutButton}>
              CHECKOUT
              <span className={styles.checkoutArrow}>→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      <DetailsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
