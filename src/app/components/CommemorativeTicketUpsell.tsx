import { useState } from 'react';
import { ChevronDown, ChevronUp, Image } from 'lucide-react';

interface SeatInfo {
  row: string;
  seat: string;
}

interface CommemorativeTicketUpsellProps {
  seats: SeatInfo[];
  onAddToCart?: (selections: { seat: SeatInfo; design: string }[], specialMessage?: string) => void;
  onRemoveFromCart?: () => void;
  onOpenDetails?: () => void;
}

type UpsellState = 'collapsed' | 'expanded_step1' | 'expanded_step2' | 'added';

interface DesignOption {
  id: string;
  name: string;
  description: string;
}

interface SeatSelection {
  seat: SeatInfo;
  design: string;
}

const designOptions: DesignOption[] = [
  {
    id: 'design-a',
    name: 'Design A',
    description: 'Season design',
  },
  {
    id: 'design-b',
    name: 'Design B',
    description: 'Classic',
  },
  {
    id: 'design-c',
    name: 'Design C',
    description: 'Limited edition',
  },
];

const getDesignColor = (designId: string) => {
  switch (designId) {
    case 'design-a':
      return 'bg-blue-400';
    case 'design-b':
      return 'bg-rose-400';
    case 'design-c':
      return 'bg-amber-400';
    default:
      return 'bg-gray-300';
  }
};

export default function CommemorativeTicketUpsell({
  seats,
  onAddToCart,
  onRemoveFromCart,
  onOpenDetails,
}: CommemorativeTicketUpsellProps) {
  const [state, setState] = useState<UpsellState>('collapsed');
  const [seatSelections, setSeatSelections] = useState<{ [key: string]: string }>(
    seats.reduce((acc, seat) => {
      const key = `${seat.row}-${seat.seat}`;
      acc[key] = '';
      return acc;
    }, {} as { [key: string]: string })
  );
  const [includeMessage, setIncludeMessage] = useState(false);
  const [specialMessage, setSpecialMessage] = useState('');
  const [shippingOption, setShippingOption] = useState<'on-file' | 'different'>('on-file');
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
  });

  const handleToggle = () => {
    if (state === 'collapsed') {
      setState('expanded_step1');
    } else if (state === 'expanded_step1' || state === 'expanded_step2') {
      setState('collapsed');
    }
  };

  const handleAddClick = () => {
    setState('expanded_step1');
  };

  const handleContinueToShipping = () => {
    setState('expanded_step2');
  };

  const handleBackToStep1 = () => {
    setState('expanded_step1');
  };

  const handleAddToOrder = () => {
    const selections: SeatSelection[] = seats
      .filter(seat => {
        const key = `${seat.row}-${seat.seat}`;
        return seatSelections[key] && seatSelections[key] !== '';
      })
      .map(seat => ({
        seat,
        design: seatSelections[`${seat.row}-${seat.seat}`],
      }));

    if (onAddToCart) {
      onAddToCart(selections, includeMessage ? specialMessage : undefined);
    }
    setState('added');
  };

  const handleEdit = () => {
    setState('expanded_step1');
  };

  const handleRemove = () => {
    if (onRemoveFromCart) {
      onRemoveFromCart();
    }
    setSeatSelections(
      seats.reduce((acc, seat) => {
        const key = `${seat.row}-${seat.seat}`;
        acc[key] = '';
        return acc;
      }, {} as { [key: string]: string })
    );
    setIncludeMessage(false);
    setSpecialMessage('');
    setState('collapsed');
  };

  const handleSeatDesignChange = (seat: SeatInfo, design: string) => {
    const key = `${seat.row}-${seat.seat}`;
    setSeatSelections(prev => ({
      ...prev,
      [key]: design,
    }));
  };

  const selectedSeats = seats.filter(seat => {
    const key = `${seat.row}-${seat.seat}`;
    return seatSelections[key] && seatSelections[key] !== '';
  });

  const totalPrice = selectedSeats.length * 20;
  const canContinue = selectedSeats.length > 0;

  // COLLAPSED STATE
  if (state === 'collapsed') {
    return (
      <div className="relative bg-white border-2 border-[#DC143C] p-6">
        {/* Header row - clickable */}
        <div 
          className="flex gap-6 items-center cursor-pointer"
          onClick={handleToggle}
        >
          {/* Small placeholder preview with icon */}
          <div className="relative flex-shrink-0 w-20 h-28 bg-gray-300 flex items-center justify-center rounded">
            <Image className="w-7 h-7 text-gray-500" />
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="text-xl font-bold uppercase mb-3 tracking-wide leading-tight">
              2025–26 PUBLIC THEATER COMMEMORATIVE TICKET
            </h3>
            <p className="text-sm mb-2 leading-relaxed">
              Get a physical souvenir ticket mailed to you.
            </p>
            <p className="text-sm text-gray-600 mb-2 leading-relaxed">
              Includes a donation to support Public Theater.
            </p>
            <div className="flex items-center gap-4">
              <span className="font-bold text-lg">$20 each</span>
            </div>
          </div>

          {/* Chevron button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
            className="absolute top-4 right-4 text-black hover:text-[#DC143C] transition-colors"
            aria-label="Expand"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>

        {/* CTA buttons - not part of clickable header */}
        <div className="flex gap-4 items-center flex-wrap mt-4">
          <button
            onClick={handleAddClick}
            className="bg-[#DC143C] text-white px-6 py-3 font-bold uppercase text-sm hover:bg-[#B8102F] transition-colors"
          >
            Add commemorative tickets
          </button>
          <button
            onClick={onOpenDetails}
            className="text-sm underline hover:text-[#DC143C] transition-colors"
          >
            Details & policies
          </button>
        </div>
      </div>
    );
  }

  // EXPANDED STEP 1: CHOOSE DESIGNS
  if (state === 'expanded_step1') {
    return (
      <div className="relative bg-white border-2 border-[#DC143C] p-6">
        {/* Chevron button */}
        <button
          onClick={handleToggle}
          className="absolute top-4 right-4 text-black hover:text-[#DC143C] transition-colors"
          aria-label="Collapse"
        >
          <ChevronUp className="w-6 h-6" />
        </button>

        <div className="pr-12">
          <h3 className="text-xl font-bold uppercase mb-4 tracking-wide text-center">
            2025–26 PUBLIC THEATER COMMEMORATIVE TICKET
          </h3>
          
          {/* Stepper - centered in pill */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-4 bg-gray-100 rounded-full px-6 py-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#DC143C] text-white flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <span className="font-bold text-sm">Choose designs</span>
              </div>
              <div className="h-px bg-gray-400 w-8"></div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <span className="text-sm text-gray-600">Shipping</span>
              </div>
            </div>
          </div>

          {/* Available designs gallery - smaller and centered */}
          <div className="mb-6">
            <h4 className="font-bold uppercase text-xs mb-3 text-center">Available Designs</h4>
            <div className="flex gap-4 justify-center max-w-lg mx-auto">
              {designOptions.map(design => (
                <div key={design.id} className="flex-1 max-w-[140px]">
                  <div className={`${getDesignColor(design.id)} h-32 mb-2 flex items-center justify-center rounded`}>
                    <Image className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-xs font-bold text-center">{design.name}</p>
                  <p className="text-xs text-gray-600 text-center">{design.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Choose for your seats */}
          <div className="mb-6">
            <h4 className="font-bold uppercase text-sm mb-3">Choose for Your Seats</h4>
            <div className="space-y-3">
              {seats.map(seat => {
                const key = `${seat.row}-${seat.seat}`;
                const selectedDesign = seatSelections[key];
                return (
                  <div key={key} className="flex items-center gap-4">
                    <label className="font-bold text-sm w-32">
                      Row {seat.row} • Seat {seat.seat}
                    </label>
                    <select
                      value={selectedDesign}
                      onChange={(e) => handleSeatDesignChange(seat, e.target.value)}
                      className="flex-1 max-w-xs border border-gray-300 px-3 py-2 bg-white text-sm"
                    >
                      <option value="">None</option>
                      {designOptions.map((design) => (
                        <option key={design.id} value={design.id}>
                          {design.name} — {design.description}
                        </option>
                      ))}
                    </select>
                    {/* Preview placeholder with icon */}
                    <div className={`w-10 h-14 flex items-center justify-center flex-shrink-0 rounded ${selectedDesign ? getDesignColor(selectedDesign) : 'bg-gray-300'}`}>
                      <Image className={`w-4 h-4 ${selectedDesign ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Optional special message */}
          <div className="mb-6">
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={includeMessage}
                onChange={(e) => setIncludeMessage(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-bold">Add a special message (optional)</span>
            </label>
            {includeMessage && (
              <div>
                <input
                  type="text"
                  value={specialMessage}
                  onChange={(e) => setSpecialMessage(e.target.value)}
                  placeholder="Enter your message"
                  className="w-full border border-gray-300 px-3 py-2 text-sm"
                  maxLength={80}
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-600">Printed on each commemorative ticket.</p>
                  <p className="text-xs text-gray-600">Max 80 characters</p>
                </div>
              </div>
            )}
          </div>

          {/* Price summary with visual separation */}
          <div className="bg-gray-50 px-4 py-3 mb-6 rounded">
            <p className="text-sm">
              {selectedSeats.length > 0 ? (
                <>
                  <span className="font-bold">${20} each</span> • <span className="font-bold">${totalPrice} total</span>
                </>
              ) : (
                <span className="text-gray-600">No seats selected</span>
              )}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4 items-center">
            <button
              onClick={handleContinueToShipping}
              disabled={!canContinue}
              className={`px-6 py-3 font-bold uppercase text-sm transition-colors ${
                !canContinue
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-[#DC143C] text-white hover:bg-[#B8102F]'
              }`}
            >
              Continue to shipping
            </button>
            <button
              onClick={onOpenDetails}
              className="text-sm underline hover:text-[#DC143C] transition-colors"
            >
              Details & policies
            </button>
          </div>
        </div>
      </div>
    );
  }

  // EXPANDED STEP 2: SHIPPING
  if (state === 'expanded_step2') {
    const selectedSeatsSummary = selectedSeats.map(seat => {
      const key = `${seat.row}-${seat.seat}`;
      const design = designOptions.find(d => d.id === seatSelections[key]);
      return `Row ${seat.row} ${seat.seat} (${design?.name})`;
    }).join(', ');

    return (
      <div className="relative bg-white border-2 border-[#DC143C] p-6">
        {/* Chevron button */}
        <button
          onClick={handleToggle}
          className="absolute top-4 right-4 text-black hover:text-[#DC143C] transition-colors"
          aria-label="Collapse"
        >
          <ChevronUp className="w-6 h-6" />
        </button>

        <div className="pr-12">
          <h3 className="text-xl font-bold uppercase mb-4 tracking-wide text-center">
            2025–26 PUBLIC THEATER COMMEMORATIVE TICKET
          </h3>
          
          {/* Stepper - centered in pill */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-4 bg-gray-100 rounded-full px-6 py-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                  ✓
                </div>
                <span className="text-sm text-gray-600">Choose designs</span>
              </div>
              <div className="h-px bg-gray-400 w-8"></div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#DC143C] text-white flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <span className="font-bold text-sm">Shipping</span>
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="mb-6">
            <h4 className="font-bold uppercase text-xs mb-2 text-center text-gray-600">Your Order</h4>
            <div className="flex gap-2 justify-center mb-3">
              {selectedSeats.map(seat => {
                const key = `${seat.row}-${seat.seat}`;
                const designId = seatSelections[key];
                return (
                  <div key={key} className="w-16">
                    <div className={`${getDesignColor(designId)} h-20 mb-1 flex items-center justify-center rounded`}>
                      <Image className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-xs text-center text-gray-600">Row {seat.row} {seat.seat}</p>
                  </div>
                );
              })}
            </div>
            <div className="bg-gray-50 p-3 rounded text-center">
              <p className="text-sm">
                Seats: {selectedSeatsSummary} • <span className="font-bold">${totalPrice} total</span>
              </p>
            </div>
          </div>

          {/* Shipping section */}
          <div className="mb-6">
            <h4 className="font-bold uppercase text-sm mb-4">Shipping</h4>
            
            <div className="space-y-4">
              {/* Radio 1: Address on file */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="shippingOption"
                  value="on-file"
                  checked={shippingOption === 'on-file'}
                  onChange={() => setShippingOption('on-file')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-bold text-sm mb-2">Ship to my address on file</p>
                  {shippingOption === 'on-file' && (
                    <div className="ml-0 mt-2 bg-gray-50 p-3 rounded border border-gray-200 text-sm">
                      <p className="font-bold">Kyle Lastname</p>
                      <p>123 Main St</p>
                      <p>Apt 4B</p>
                      <p>New York, NY 10001</p>
                    </div>
                  )}
                </div>
              </label>

              {/* Radio 2: Different address */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="shippingOption"
                  value="different"
                  checked={shippingOption === 'different'}
                  onChange={() => setShippingOption('different')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="font-bold text-sm mb-2">Ship to a different address</p>
                  {shippingOption === 'different' && (
                    <div className="ml-0 mt-3 space-y-3">
                      <input
                        type="text"
                        placeholder="Name"
                        value={shippingAddress.name}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full border border-gray-300 px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Address Line 1"
                        value={shippingAddress.address1}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, address1: e.target.value }))}
                        className="w-full border border-gray-300 px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Address Line 2 (optional)"
                        value={shippingAddress.address2}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, address2: e.target.value }))}
                        className="w-full border border-gray-300 px-3 py-2 text-sm"
                      />
                      <div className="flex gap-3">
                        <input
                          type="text"
                          placeholder="City"
                          value={shippingAddress.city}
                          onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                          className="flex-1 border border-gray-300 px-3 py-2 text-sm"
                        />
                        <input
                          type="text"
                          placeholder="State"
                          value={shippingAddress.state}
                          onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
                          className="w-24 border border-gray-300 px-3 py-2 text-sm"
                        />
                        <input
                          type="text"
                          placeholder="ZIP"
                          value={shippingAddress.zip}
                          onChange={(e) => setShippingAddress(prev => ({ ...prev, zip: e.target.value }))}
                          className="w-28 border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <p className="text-xs text-gray-600">This does not update your saved address in your account.</p>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Policy microcopy */}
          <p className="text-xs text-gray-600 mb-6">
            Non-refundable (donation). Printed + mailed after purchase.
          </p>

          {/* Actions */}
          <div className="flex gap-4 items-center">
            <button
              onClick={handleBackToStep1}
              className="px-6 py-3 border-2 border-gray-400 text-black font-bold uppercase text-sm hover:border-[#DC143C] hover:text-[#DC143C] transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleAddToOrder}
              className="px-6 py-3 bg-[#DC143C] text-white font-bold uppercase text-sm hover:bg-[#B8102F] transition-colors"
            >
              Add to order
            </button>
            <button
              onClick={onOpenDetails}
              className="text-sm underline hover:text-[#DC143C] transition-colors"
            >
              Details & policies
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ADDED STATE
  const addedSummary = selectedSeats.map(seat => {
    const key = `${seat.row}-${seat.seat}`;
    const design = designOptions.find(d => d.id === seatSelections[key]);
    return `Row ${seat.row} Seat ${seat.seat} – ${design?.name || 'Unknown'}`;
  });

  return (
    <div className="relative bg-white border-2 border-[#DC143C] p-6">
      {/* Chevron button */}
      <button
        onClick={handleToggle}
        className="absolute top-4 right-4 text-black hover:text-[#DC143C] transition-colors"
        aria-label="Expand"
      >
        <ChevronDown className="w-6 h-6" />
      </button>

      <div className="pr-12">
        <h3 className="text-xl font-bold uppercase mb-3 tracking-wide">
          2025–26 PUBLIC THEATER COMMEMORATIVE TICKET
        </h3>
        
        <div className="bg-green-50 border border-green-600 px-4 py-2 mb-4 inline-block">
          <p className="text-sm font-bold text-green-800">
            ✓ Commemorative tickets added.
          </p>
        </div>

        <div className="mb-4 space-y-1">
          {addedSummary.map((line, idx) => (
            <p key={idx} className="text-sm">{line}</p>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-4 items-center">
          <button
            onClick={handleEdit}
            className="text-sm font-bold underline hover:text-[#DC143C] transition-colors"
          >
            Edit
          </button>
          <button
            onClick={handleRemove}
            className="text-sm font-bold underline hover:text-[#DC143C] transition-colors"
          >
            Remove
          </button>
          <button
            onClick={onOpenDetails}
            className="text-sm underline hover:text-[#DC143C] transition-colors"
          >
            Details & policies
          </button>
        </div>
      </div>
    </div>
  );
}