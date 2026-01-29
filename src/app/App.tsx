import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import CommemorativeTicketUpsell from '@/app/components/CommemorativeTicketUpsell';
import DetailsModal from '@/app/components/DetailsModal';

interface SeatInfo {
  row: string;
  seat: string;
}

interface CommemorativeItem {
  selections: { seat: SeatInfo; design: string }[];
  specialMessage?: string;
  price: number;
}

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [commemorativeItem, setCommemorativeItem] = useState<CommemorativeItem | null>(null);

  const handleAddToCart = (selections: { seat: SeatInfo; design: string }[], specialMessage?: string) => {
    setCommemorativeItem({
      selections,
      specialMessage,
      price: 20 * selections.length,
    });
  };

  const handleRemoveFromCart = () => {
    setCommemorativeItem(null);
  };

  const seats: SeatInfo[] = [
    { row: 'B', seat: '13' },
    { row: 'B', seat: '14' },
    { row: 'B', seat: '15' },
  ];

  const ticketCount = 3;
  const ticketPrice = 99;
  const ticketsTotal = ticketCount * ticketPrice; // 297
  const serviceFee = 10;
  const commemorativePrice = commemorativeItem?.price || 0;
  const total = ticketsTotal + serviceFee + commemorativePrice;

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Top banner */}
      <div className="bg-[#DC143C] text-white text-center py-2">
        <div className="flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-bold">⏱ 19:26 remaining until your tickets expire.</span>
        </div>
      </div>

      {/* Header */}
      <header className="bg-black text-white">
        <div className="max-w-[1440px] mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold tracking-tight">PUBLIC.</h1>
          </div>
          <nav className="flex gap-6 text-xs">
            <span className="text-gray-400">1. Choose Your Seats</span>
            <span className="font-bold">2. Your Cart</span>
            <span className="text-gray-400">3. Delivery Method</span>
            <span className="text-gray-400">4. Payment</span>
            <span className="text-gray-400">5. Confirmation</span>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-[1440px] mx-auto px-8 py-12">
        <div className="max-w-[1040px] mx-auto">
          <h2 className="text-4xl font-bold uppercase tracking-wide mb-8">YOUR CART</h2>

          {/* Ticket line item */}
          <div className="bg-gray-50 p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="font-bold text-xl mb-2">ULYSSES</h3>
                <p className="text-sm mb-1">
                  <span className="font-bold">Friday, January 23</span> | 7:30 PM
                </p>
                <p className="text-sm mb-3">Martinson Hall</p>
                
                {/* Three seat lines */}
                <div className="space-y-1">
                  {seats.map((seat, idx) => (
                    <p key={idx} className="text-sm">
                      Row: <span className="font-bold">{seat.row}</span> | Seat: <span className="font-bold">{seat.seat}</span>
                    </p>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <button className="text-sm underline text-[#DC143C] hover:text-[#B8102F]">
                  Remove
                </button>
                <button className="text-sm underline text-[#DC143C] hover:text-[#B8102F]">
                  Choose New Seats
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-300">
              <span className="font-bold">{ticketCount} x Full</span>
              <span className="font-bold text-xl">${ticketsTotal}</span>
            </div>
          </div>

          {/* Commemorative ticket upsell */}
          <div className="mb-6">
            <CommemorativeTicketUpsell
              seats={seats}
              onAddToCart={handleAddToCart}
              onRemoveFromCart={handleRemoveFromCart}
              onOpenDetails={() => setIsModalOpen(true)}
            />
          </div>

          {/* Cart summary */}
          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center py-3 border-b border-gray-300">
              <span className="font-bold">Ticket Service Fee:</span>
              <span className="font-bold">${serviceFee}</span>
            </div>

            {commemorativeItem && (
              <div className="flex justify-between items-center py-3 border-b border-gray-300">
                <div className="flex-1">
                  <span className="font-bold">
                    Commemorative tickets x{commemorativeItem.selections.length}
                  </span>
                  <div className="text-sm text-gray-600 mt-1">
                    {commemorativeItem.selections.map((selection, idx) => {
                      const designName = selection.design === 'design-a' ? 'Design A' : 
                                        selection.design === 'design-b' ? 'Design B' : 
                                        selection.design === 'design-c' ? 'Design C' : 'Unknown';
                      return <div key={idx}>Ticket {idx + 1}: {designName}</div>;
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold">${commemorativeItem.price}</span>
                  <button
                    onClick={() => {
                      // In a real app, this would trigger edit mode in the upsell component
                    }}
                    className="text-sm underline text-[#DC143C] hover:text-[#B8102F]"
                  >
                    Edit
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={handleRemoveFromCart}
                    className="text-sm underline text-[#DC143C] hover:text-[#B8102F]"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center py-4 border-t-2 border-black">
              <span className="font-bold uppercase text-xl">Cart Total:</span>
              <span className="font-bold text-2xl">${total}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#DC143C] text-white">
        <div className="max-w-[1440px] mx-auto px-8 py-4 flex items-center justify-between">
          <div className="text-xl font-bold">
            CART TOTAL: <span className="ml-2">${total}</span>
          </div>
          <div className="flex gap-4">
            <button className="px-6 py-3 border-2 border-white text-white font-bold uppercase hover:bg-white hover:text-[#DC143C] transition-colors">
              Continue Shopping
            </button>
            <button className="px-8 py-3 bg-black text-white font-bold uppercase hover:bg-gray-900 transition-colors flex items-center gap-2">
              CHECKOUT
              <span className="text-xl">→</span>
            </button>
          </div>
        </div>
      </div>

      {/* Details modal */}
      <DetailsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}