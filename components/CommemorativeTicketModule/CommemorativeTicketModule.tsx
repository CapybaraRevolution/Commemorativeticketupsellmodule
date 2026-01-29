'use client';

/**
 * CommemorativeTicketModule
 * 
 * A reusable React component that renders the commemorative ticket upsell flow.
 * Features:
 * - Collapsed state (default)
 * - Expanded Step 1: Choose designs
 * - Expanded Step 2: Shipping
 * - Success state
 */

import { useState, useCallback, useReducer } from 'react';
import { ChevronDown, ChevronUp, Image as ImageIcon, Check } from 'lucide-react';
import type { Seat, Address, Design, ModuleState, AVAILABLE_DESIGNS } from '@/types';
import styles from './CommemorativeTicketModule.module.css';

// ============================================================================
// Types
// ============================================================================

interface CommemorativeTicketModuleProps {
  /** Seats available for commemorative tickets */
  seats: Seat[];
  /** Address on file from Tessitura */
  addressOnFile: Address | null;
  /** Session key for API calls */
  sessionKey: string;
  /** Callback when tickets are added to order */
  onAddToOrder?: (result: AddToOrderResult) => void;
  /** Callback when tickets are removed */
  onRemove?: () => void;
  /** Callback to open details modal */
  onOpenDetails?: () => void;
}

interface AddToOrderResult {
  success: boolean;
  quantity: number;
  total: number;
  selections: Array<{
    seat: Seat;
    designId: string;
    designName: string;
  }>;
  specialMessage?: string;
}

// Design options
const DESIGNS: Design[] = [
  { id: 'design-a', name: 'Design A', description: 'Season design', available: true },
  { id: 'design-b', name: 'Design B', description: 'Classic', available: true },
  { id: 'design-c', name: 'Design C', description: 'Limited edition', available: true },
];

const PRICE_PER_TICKET = 20;

// ============================================================================
// State Reducer
// ============================================================================

interface ModuleStateData {
  currentState: ModuleState;
  seatSelections: Record<string, string>; // key: "row-seatNumber", value: designId or ""
  includeSpecialMessage: boolean;
  specialMessage: string;
  shippingOption: 'address-on-file' | 'different-address';
  customAddress: {
    name: string;
    street1: string;
    street2: string;
    city: string;
    state: string;
    postalCode: string;
  };
  isLoading: boolean;
  error: string | null;
}

type ModuleAction =
  | { type: 'EXPAND' }
  | { type: 'COLLAPSE' }
  | { type: 'GO_TO_STEP_1' }
  | { type: 'GO_TO_STEP_2' }
  | { type: 'SET_SEAT_DESIGN'; seatKey: string; designId: string }
  | { type: 'TOGGLE_SPECIAL_MESSAGE' }
  | { type: 'SET_SPECIAL_MESSAGE'; message: string }
  | { type: 'SET_SHIPPING_OPTION'; option: 'address-on-file' | 'different-address' }
  | { type: 'SET_CUSTOM_ADDRESS'; field: keyof ModuleStateData['customAddress']; value: string }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_SUCCESS' }
  | { type: 'RESET' };

function createInitialState(seats: Seat[]): ModuleStateData {
  const seatSelections: Record<string, string> = {};
  seats.forEach(seat => {
    seatSelections[`${seat.row}-${seat.seatNumber}`] = '';
  });

  return {
    currentState: 'collapsed',
    seatSelections,
    includeSpecialMessage: false,
    specialMessage: '',
    shippingOption: 'address-on-file',
    customAddress: {
      name: '',
      street1: '',
      street2: '',
      city: '',
      state: '',
      postalCode: '',
    },
    isLoading: false,
    error: null,
  };
}

function moduleReducer(state: ModuleStateData, action: ModuleAction): ModuleStateData {
  switch (action.type) {
    case 'EXPAND':
      return { ...state, currentState: 'expanded_step1' };
    case 'COLLAPSE':
      return { ...state, currentState: 'collapsed' };
    case 'GO_TO_STEP_1':
      return { ...state, currentState: 'expanded_step1' };
    case 'GO_TO_STEP_2':
      return { ...state, currentState: 'expanded_step2' };
    case 'SET_SEAT_DESIGN':
      return {
        ...state,
        seatSelections: { ...state.seatSelections, [action.seatKey]: action.designId },
      };
    case 'TOGGLE_SPECIAL_MESSAGE':
      return { ...state, includeSpecialMessage: !state.includeSpecialMessage };
    case 'SET_SPECIAL_MESSAGE':
      return { ...state, specialMessage: action.message };
    case 'SET_SHIPPING_OPTION':
      return { ...state, shippingOption: action.option };
    case 'SET_CUSTOM_ADDRESS':
      return {
        ...state,
        customAddress: { ...state.customAddress, [action.field]: action.value },
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };
    case 'SET_ERROR':
      return { ...state, error: action.error };
    case 'SET_SUCCESS':
      return { ...state, currentState: 'success', isLoading: false, error: null };
    case 'RESET':
      return createInitialState(
        Object.keys(state.seatSelections).map(key => {
          const [row, seatNumber] = key.split('-');
          return { section: '', row, seatNumber, price: 0 };
        })
      );
    default:
      return state;
  }
}

// ============================================================================
// Component
// ============================================================================

export default function CommemorativeTicketModule({
  seats,
  addressOnFile,
  sessionKey,
  onAddToOrder,
  onRemove,
  onOpenDetails,
}: CommemorativeTicketModuleProps) {
  const [state, dispatch] = useReducer(moduleReducer, seats, createInitialState);

  // Computed values
  const selectedSeats = seats.filter(seat => {
    const key = `${seat.row}-${seat.seatNumber}`;
    return state.seatSelections[key] && state.seatSelections[key] !== '';
  });
  const totalPrice = selectedSeats.length * PRICE_PER_TICKET;
  const canContinue = selectedSeats.length > 0;

  // Handlers
  const handleToggle = useCallback(() => {
    if (state.currentState === 'collapsed') {
      dispatch({ type: 'EXPAND' });
    } else if (state.currentState === 'expanded_step1' || state.currentState === 'expanded_step2') {
      dispatch({ type: 'COLLAPSE' });
    }
  }, [state.currentState]);

  const handleAddClick = useCallback(() => {
    dispatch({ type: 'EXPAND' });
  }, []);

  const handleContinueToShipping = useCallback(() => {
    dispatch({ type: 'GO_TO_STEP_2' });
  }, []);

  const handleBackToStep1 = useCallback(() => {
    dispatch({ type: 'GO_TO_STEP_1' });
  }, []);

  const handleAddToOrder = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', isLoading: true });
    dispatch({ type: 'SET_ERROR', error: null });

    // Build shipping address
    const shippingAddress: Address =
      state.shippingOption === 'address-on-file' && addressOnFile
        ? addressOnFile
        : {
            name: state.customAddress.name,
            street1: state.customAddress.street1,
            street2: state.customAddress.street2 || undefined,
            city: state.customAddress.city,
            state: state.customAddress.state,
            postalCode: state.customAddress.postalCode,
            country: 'US',
          };

    // Build selections payload
    const selections = selectedSeats.map(seat => ({
      seatId: seat.seatId,
      section: seat.section,
      row: seat.row,
      seatNumber: seat.seatNumber,
      designId: state.seatSelections[`${seat.row}-${seat.seatNumber}`],
    }));

    try {
      const response = await fetch('/api/commemorative/add-to-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionKey,
          selections,
          specialMessage: state.includeSpecialMessage ? state.specialMessage : undefined,
          shippingAddress,
          totalPrice,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to add to order');
      }

      dispatch({ type: 'SET_SUCCESS' });

      // Notify parent
      if (onAddToOrder) {
        onAddToOrder({
          success: true,
          quantity: selectedSeats.length,
          total: totalPrice,
          selections: selectedSeats.map(seat => {
            const designId = state.seatSelections[`${seat.row}-${seat.seatNumber}`];
            const design = DESIGNS.find(d => d.id === designId);
            return {
              seat,
              designId,
              designName: design?.name || 'Unknown',
            };
          }),
          specialMessage: state.includeSpecialMessage ? state.specialMessage : undefined,
        });
      }
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        error: error instanceof Error ? error.message : 'An error occurred',
      });
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }
  }, [
    state,
    selectedSeats,
    totalPrice,
    sessionKey,
    addressOnFile,
    onAddToOrder,
  ]);

  const handleEdit = useCallback(() => {
    dispatch({ type: 'GO_TO_STEP_1' });
  }, []);

  const handleRemove = useCallback(() => {
    if (onRemove) {
      onRemove();
    }
    dispatch({ type: 'RESET' });
  }, [onRemove]);

  // Get design preview class
  const getDesignClass = (designId: string | null) => {
    switch (designId) {
      case 'design-a':
        return styles.designPreviewA;
      case 'design-b':
        return styles.designPreviewB;
      case 'design-c':
        return styles.designPreviewC;
      default:
        return styles.designPreview;
    }
  };

  const getSeatPreviewClass = (designId: string) => {
    switch (designId) {
      case 'design-a':
        return styles.seatPreviewChipA;
      case 'design-b':
        return styles.seatPreviewChipB;
      case 'design-c':
        return styles.seatPreviewChipC;
      default:
        return styles.seatPreviewChipNone;
    }
  };

  // ============================================================================
  // Render: Collapsed State
  // ============================================================================
  if (state.currentState === 'collapsed') {
    return (
      <div className={styles.container}>
        <div className={styles.headerClickable} onClick={handleToggle}>
          <div className={styles.previewImage}>
            <ImageIcon className={styles.previewImageIcon} />
          </div>
          <div className={styles.content}>
            <h3 className={styles.title}>2025–26 PUBLIC THEATER COMMEMORATIVE TICKET</h3>
            <p className={styles.description}>Get a physical souvenir ticket mailed to you.</p>
            <p className={styles.subDescription}>Includes a donation to support Public Theater.</p>
            <div className={styles.price}>$20 each</div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleToggle(); }}
            className={styles.chevronButton}
            aria-label="Expand"
          >
            <ChevronDown className={styles.chevronIcon} />
          </button>
        </div>
        <div className={styles.actions}>
          <button onClick={handleAddClick} className={styles.primaryButton}>
            Add commemorative tickets
          </button>
          <button onClick={onOpenDetails} className={styles.linkButton}>
            Details & policies
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Render: Step 1 - Choose Designs
  // ============================================================================
  if (state.currentState === 'expanded_step1') {
    return (
      <div className={styles.container}>
        {state.isLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingSpinner} />
          </div>
        )}
        <button
          onClick={handleToggle}
          className={styles.chevronButton}
          aria-label="Collapse"
        >
          <ChevronUp className={styles.chevronIcon} />
        </button>
        <div className={styles.contentPadded}>
          <h3 className={styles.titleCentered}>2025–26 PUBLIC THEATER COMMEMORATIVE TICKET</h3>

          {/* Stepper */}
          <div className={styles.stepper}>
            <div className={styles.stepperPill}>
              <div className={styles.stepItem}>
                <div className={styles.stepNumberActive}>1</div>
                <span className={styles.stepLabelActive}>Choose designs</span>
              </div>
              <div className={styles.stepDivider} />
              <div className={styles.stepItem}>
                <div className={styles.stepNumberInactive}>2</div>
                <span className={styles.stepLabelInactive}>Shipping</span>
              </div>
            </div>
          </div>

          {/* Available Designs */}
          <div>
            <h4 className={styles.sectionTitle}>Available Designs</h4>
            <div className={styles.designGallery}>
              {DESIGNS.map(design => (
                <div key={design.id} className={styles.designCard}>
                  <div className={getDesignClass(design.id)}>
                    <ImageIcon className={styles.designPreviewIcon} />
                  </div>
                  <p className={styles.designName}>{design.name}</p>
                  <p className={styles.designDescription}>{design.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Seat Selection */}
          <div className={styles.seatSelection}>
            <h4 className={styles.sectionTitleLeft}>Choose for Your Seats</h4>
            {seats.map(seat => {
              const key = `${seat.row}-${seat.seatNumber}`;
              const selectedDesign = state.seatSelections[key];
              return (
                <div key={key} className={styles.seatRow}>
                  <label htmlFor={`seat-${key}`} className={styles.seatLabel}>
                    Row {seat.row} • Seat {seat.seatNumber}
                  </label>
                  <select
                    id={`seat-${key}`}
                    value={selectedDesign}
                    onChange={(e) =>
                      dispatch({ type: 'SET_SEAT_DESIGN', seatKey: key, designId: e.target.value })
                    }
                    className={styles.seatSelect}
                  >
                    <option value="">None</option>
                    {DESIGNS.map(design => (
                      <option key={design.id} value={design.id}>
                        {design.name} — {design.description}
                      </option>
                    ))}
                  </select>
                  <div className={getSeatPreviewClass(selectedDesign)}>
                    <ImageIcon
                      className={
                        selectedDesign
                          ? styles.seatPreviewIconLight
                          : styles.seatPreviewIconDark
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Special Message */}
          <div className={styles.specialMessage}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={state.includeSpecialMessage}
                onChange={() => dispatch({ type: 'TOGGLE_SPECIAL_MESSAGE' })}
                className={styles.checkbox}
              />
              <span className={styles.checkboxText}>Add a special message (optional)</span>
            </label>
            {state.includeSpecialMessage && (
              <div>
                <input
                  type="text"
                  value={state.specialMessage}
                  onChange={(e) =>
                    dispatch({ type: 'SET_SPECIAL_MESSAGE', message: e.target.value })
                  }
                  placeholder="Enter your message"
                  className={styles.messageInput}
                  maxLength={80}
                  aria-label="Special message"
                />
                <div className={styles.messageHelper}>
                  <p className={styles.helperText}>Printed on each commemorative ticket.</p>
                  <p className={styles.helperText}>Max 80 characters</p>
                </div>
              </div>
            )}
          </div>

          {/* Price Summary */}
          <div className={styles.priceSummary}>
            <p className={styles.priceText}>
              {selectedSeats.length > 0 ? (
                <>
                  <span className={styles.priceTextBold}>${PRICE_PER_TICKET} each</span>
                  {' • '}
                  <span className={styles.priceTextBold}>${totalPrice} total</span>
                </>
              ) : (
                <span className={styles.priceTextMuted}>No seats selected</span>
              )}
            </p>
          </div>

          {/* Error message */}
          {state.error && (
            <p style={{ color: 'red', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {state.error}
            </p>
          )}

          {/* Actions */}
          <div className={styles.actions}>
            <button
              onClick={handleContinueToShipping}
              disabled={!canContinue}
              className={styles.primaryButton}
            >
              Continue to shipping
            </button>
            <button onClick={onOpenDetails} className={styles.linkButton}>
              Details & policies
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Render: Step 2 - Shipping
  // ============================================================================
  if (state.currentState === 'expanded_step2') {
    const selectedSeatsSummary = selectedSeats
      .map(seat => {
        const key = `${seat.row}-${seat.seatNumber}`;
        const design = DESIGNS.find(d => d.id === state.seatSelections[key]);
        return `Row ${seat.row} ${seat.seatNumber} (${design?.name})`;
      })
      .join(', ');

    return (
      <div className={styles.container}>
        {state.isLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingSpinner} />
          </div>
        )}
        <button
          onClick={handleToggle}
          className={styles.chevronButton}
          aria-label="Collapse"
        >
          <ChevronUp className={styles.chevronIcon} />
        </button>
        <div className={styles.contentPadded}>
          <h3 className={styles.titleCentered}>2025–26 PUBLIC THEATER COMMEMORATIVE TICKET</h3>

          {/* Stepper */}
          <div className={styles.stepper}>
            <div className={styles.stepperPill}>
              <div className={styles.stepItem}>
                <div className={styles.stepNumberCompleted}>
                  <Check size={14} />
                </div>
                <span className={styles.stepLabelInactive}>Choose designs</span>
              </div>
              <div className={styles.stepDivider} />
              <div className={styles.stepItem}>
                <div className={styles.stepNumberActive}>2</div>
                <span className={styles.stepLabelActive}>Shipping</span>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className={styles.orderSummary}>
            <h4 className={styles.sectionTitle}>Your Order</h4>
            <div className={styles.orderThumbnails}>
              {selectedSeats.map(seat => {
                const key = `${seat.row}-${seat.seatNumber}`;
                const designId = state.seatSelections[key];
                return (
                  <div key={key} className={styles.orderThumbnail}>
                    <div
                      className={`${styles.orderThumbnailPreview} ${getDesignClass(designId)}`}
                    >
                      <ImageIcon style={{ width: 20, height: 20, color: 'white' }} />
                    </div>
                    <p className={styles.orderThumbnailLabel}>
                      Row {seat.row} {seat.seatNumber}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className={styles.orderSummaryBox}>
              <p className={styles.orderSummaryText}>
                Seats: {selectedSeatsSummary} •{' '}
                <span className={styles.priceTextBold}>${totalPrice} total</span>
              </p>
            </div>
          </div>

          {/* Shipping Section */}
          <div className={styles.shippingSection}>
            <h4 className={styles.sectionTitleLeft}>Shipping</h4>
            <div className={styles.radioGroup}>
              {/* Address on file */}
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="shippingOption"
                  value="address-on-file"
                  checked={state.shippingOption === 'address-on-file'}
                  onChange={() =>
                    dispatch({ type: 'SET_SHIPPING_OPTION', option: 'address-on-file' })
                  }
                  className={styles.radioInput}
                />
                <div className={styles.radioContent}>
                  <p className={styles.radioText}>Ship to my address on file</p>
                  {state.shippingOption === 'address-on-file' && addressOnFile && (
                    <div className={styles.addressBox}>
                      <p className={styles.addressName}>{addressOnFile.name}</p>
                      <p>{addressOnFile.street1}</p>
                      {addressOnFile.street2 && <p>{addressOnFile.street2}</p>}
                      <p>
                        {addressOnFile.city}, {addressOnFile.state} {addressOnFile.postalCode}
                      </p>
                    </div>
                  )}
                </div>
              </label>

              {/* Different address */}
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="shippingOption"
                  value="different-address"
                  checked={state.shippingOption === 'different-address'}
                  onChange={() =>
                    dispatch({ type: 'SET_SHIPPING_OPTION', option: 'different-address' })
                  }
                  className={styles.radioInput}
                />
                <div className={styles.radioContent}>
                  <p className={styles.radioText}>Ship to a different address</p>
                  {state.shippingOption === 'different-address' && (
                    <div className={styles.addressForm}>
                      <input
                        type="text"
                        placeholder="Name"
                        value={state.customAddress.name}
                        onChange={(e) =>
                          dispatch({
                            type: 'SET_CUSTOM_ADDRESS',
                            field: 'name',
                            value: e.target.value,
                          })
                        }
                        className={styles.addressInput}
                        aria-label="Name"
                      />
                      <input
                        type="text"
                        placeholder="Address Line 1"
                        value={state.customAddress.street1}
                        onChange={(e) =>
                          dispatch({
                            type: 'SET_CUSTOM_ADDRESS',
                            field: 'street1',
                            value: e.target.value,
                          })
                        }
                        className={styles.addressInput}
                        aria-label="Address line 1"
                      />
                      <input
                        type="text"
                        placeholder="Address Line 2 (optional)"
                        value={state.customAddress.street2}
                        onChange={(e) =>
                          dispatch({
                            type: 'SET_CUSTOM_ADDRESS',
                            field: 'street2',
                            value: e.target.value,
                          })
                        }
                        className={styles.addressInput}
                        aria-label="Address line 2"
                      />
                      <div className={styles.addressRow}>
                        <input
                          type="text"
                          placeholder="City"
                          value={state.customAddress.city}
                          onChange={(e) =>
                            dispatch({
                              type: 'SET_CUSTOM_ADDRESS',
                              field: 'city',
                              value: e.target.value,
                            })
                          }
                          className={`${styles.addressInput} ${styles.addressCity}`}
                          aria-label="City"
                        />
                        <input
                          type="text"
                          placeholder="State"
                          value={state.customAddress.state}
                          onChange={(e) =>
                            dispatch({
                              type: 'SET_CUSTOM_ADDRESS',
                              field: 'state',
                              value: e.target.value,
                            })
                          }
                          className={`${styles.addressInput} ${styles.addressState}`}
                          aria-label="State"
                        />
                        <input
                          type="text"
                          placeholder="ZIP"
                          value={state.customAddress.postalCode}
                          onChange={(e) =>
                            dispatch({
                              type: 'SET_CUSTOM_ADDRESS',
                              field: 'postalCode',
                              value: e.target.value,
                            })
                          }
                          className={`${styles.addressInput} ${styles.addressZip}`}
                          aria-label="ZIP code"
                        />
                      </div>
                      <p className={styles.helperText}>
                        This does not update your saved address in your account.
                      </p>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Policy text */}
          <p className={styles.policyText}>
            Non-refundable (donation). Printed + mailed after purchase.
          </p>

          {/* Error message */}
          {state.error && (
            <p style={{ color: 'red', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {state.error}
            </p>
          )}

          {/* Actions */}
          <div className={styles.actions}>
            <button onClick={handleBackToStep1} className={styles.secondaryButton}>
              Back
            </button>
            <button
              onClick={handleAddToOrder}
              disabled={state.isLoading}
              className={styles.primaryButton}
            >
              {state.isLoading ? 'Adding...' : 'Add to order'}
            </button>
            <button onClick={onOpenDetails} className={styles.linkButton}>
              Details & policies
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Render: Success State
  // ============================================================================
  const addedSummary = selectedSeats.map(seat => {
    const key = `${seat.row}-${seat.seatNumber}`;
    const design = DESIGNS.find(d => d.id === state.seatSelections[key]);
    return `Row ${seat.row} Seat ${seat.seatNumber} – ${design?.name || 'Unknown'}`;
  });

  return (
    <div className={styles.container}>
      <button
        onClick={handleToggle}
        className={styles.chevronButton}
        aria-label="Expand"
      >
        <ChevronDown className={styles.chevronIcon} />
      </button>
      <div className={styles.contentPadded}>
        <h3 className={styles.title}>2025–26 PUBLIC THEATER COMMEMORATIVE TICKET</h3>

        <div className={styles.successBanner}>
          <p className={styles.successText}>✓ Commemorative tickets added.</p>
        </div>

        <div className={styles.successSummary}>
          {addedSummary.map((line, idx) => (
            <p key={idx} className={styles.successLine}>
              {line}
            </p>
          ))}
        </div>

        <div className={styles.actions}>
          <button onClick={handleEdit} className={styles.linkButtonBold}>
            Edit
          </button>
          <button onClick={handleRemove} className={styles.linkButtonBold}>
            Remove
          </button>
          <button onClick={onOpenDetails} className={styles.linkButton}>
            Details & policies
          </button>
        </div>
      </div>
    </div>
  );
}
