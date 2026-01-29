'use client';

/**
 * DetailsModal
 * 
 * Modal displaying details and policies for commemorative tickets
 */

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import styles from './DetailsModal.module.css';

interface DetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DetailsModal({ isOpen, onClose }: DetailsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      {/* Backdrop */}
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />

      {/* Modal */}
      <div className={styles.modal} ref={modalRef}>
        {/* Header */}
        <div className={styles.header}>
          <h2 id="modal-title" className={styles.title}>
            Commemorative Ticket Details & Policies
          </h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close modal"
          >
            <X className={styles.closeIcon} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* Important Notice */}
          <div className={styles.importantBox}>
            <p className={styles.importantText}>
              IMPORTANT: This commemorative ticket is a keepsake and is not valid for admission.
              You will still need your regular ticket for entry.
            </p>
          </div>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>What You Get</h3>
            <p className={styles.sectionText}>
              A physical commemorative ticket for the 2025–26 Public Theater season, featuring
              exclusive artwork celebrating our productions. This beautiful keepsake will be
              professionally printed and mailed to your specified address.
            </p>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Supporting The Public</h3>
            <p className={styles.sectionText}>
              Your commemorative ticket purchase includes a donation to support Public Theater.
              As a nonprofit organization, your contribution helps us continue producing
              world-class theater and serving our community.
            </p>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Refund Policy</h3>
            <p className={styles.sectionText}>
              Commemorative tickets are non-refundable as they constitute a charitable donation
              to Public Theater. All sales are final once your order is processed.
            </p>
            <p className={styles.sectionTextSecondary}>
              Commemorative tickets are souvenirs only and are not valid for admission.
            </p>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Shipping & Fulfillment</h3>
            <p className={styles.sectionText}>
              Your commemorative ticket will be printed and mailed within 2–3 weeks of purchase.
              Please allow an additional 5–7 business days for delivery within the United States.
              International shipping may take longer.
            </p>
            <p className={styles.sectionText} style={{ marginTop: '0.5rem' }}>
              Tickets will be shipped to the address you specify during checkout. Please ensure
              your shipping address is correct, as we cannot redirect shipments once they have
              been sent.
            </p>
            <p className={styles.sectionTextBold} style={{ marginTop: '0.5rem' }}>
              Need to ship to multiple addresses? You must place separate orders for each shipping address.
            </p>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Fulfillment Partner</h3>
            <p className={styles.sectionText}>
              Commemorative tickets are fulfilled by WWL (World Wide Logistics). For questions
              about your order or shipping status, please contact our support team at{' '}
              <a href="mailto:support@publictheater.org" className={styles.link}>
                support@publictheater.org
              </a>
              .
            </p>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Design Selection</h3>
            <p className={styles.sectionText}>
              Choose from three exclusive designs celebrating the 2025–26 season. Each design
              features original artwork commissioned specifically for this commemorative series.
              Limited edition designs may sell out and become unavailable.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button onClick={onClose} className={styles.footerButton}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
