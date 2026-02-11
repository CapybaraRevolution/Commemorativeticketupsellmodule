'use client';

/**
 * DetailsModal
 *
 * The "Details & policies" modal. This is the fine print that covers:
 * - This is a keepsake, NOT a ticket for entry (critical callout)
 * - What you get (a pretty printed thing in the mail)
 * - It's a donation (non-refundable)
 * - Shipping details
 * - WWL is the fulfillment partner
 *
 * All org-specific copy pulls from orgConfig so this stays generic.
 *
 * Kyle was insistent about the "not valid for admission" warning being
 * prominent. Fair concern — you don't want someone showing up to the
 * theater waving a commemorative ticket at the usher. Hence the yellow
 * box at the top. — Tabs
 */

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { ORG_CONFIG } from '@/lib/config/orgConfig';
import styles from './DetailsModal.module.css';

interface DetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DetailsModal({ isOpen, onClose }: DetailsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // ESC key closes the modal — basic accessibility pattern
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap — when modal opens, focus the first interactive element
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

  // Lock body scroll while modal is open
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

  const { orgName, seasonLabel, supportEmail } = ORG_CONFIG;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />

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
          {/* The big yellow box. Kyle wanted this impossible to miss. */}
          <div className={styles.importantBox}>
            <p className={styles.importantText}>
              IMPORTANT: This commemorative ticket is a keepsake and is not valid for admission.
              You will still need your regular ticket for entry.
            </p>
          </div>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>What You Get</h3>
            <p className={styles.sectionText}>
              A physical commemorative ticket for the {seasonLabel}, featuring
              exclusive artwork celebrating the season. This beautiful keepsake will be
              professionally printed and mailed to your specified address.
            </p>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Supporting {orgName}</h3>
            <p className={styles.sectionText}>
              Your commemorative ticket purchase includes a donation to support {orgName}.
              As a nonprofit organization, your contribution helps continue producing
              world-class programming and serving the community.
            </p>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Refund Policy</h3>
            <p className={styles.sectionText}>
              Commemorative tickets are non-refundable as they constitute a charitable donation
              to {orgName}. All sales are final once your order is processed.
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
              <a href={`mailto:${supportEmail}`} className={styles.link}>
                {supportEmail}
              </a>
              .
            </p>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Design Selection</h3>
            <p className={styles.sectionText}>
              Choose from exclusive designs celebrating the {seasonLabel}. Each design
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
