import { X } from 'lucide-react';

interface DetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DetailsModal({ isOpen, onClose }: DetailsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b-2 border-black p-6 flex justify-between items-start">
          <h2 className="text-2xl font-bold uppercase tracking-wide">
            Commemorative Ticket Details & Policies
          </h2>
          <button
            onClick={onClose}
            className="text-black hover:text-[#DC143C] transition-colors flex-shrink-0 ml-4"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <section>
            <h3 className="font-bold uppercase text-lg mb-2">What You Get</h3>
            <p className="text-sm leading-relaxed">
              A physical commemorative ticket for the 2025–26 Public Theater season, featuring
              exclusive artwork celebrating our productions. This beautiful keepsake will be
              professionally printed and mailed to your specified address.
            </p>
          </section>

          <section>
            <h3 className="font-bold uppercase text-lg mb-2">Not Valid for Admission</h3>
            <p className="text-sm leading-relaxed">
              Commemorative tickets are keepsakes and cannot be used to enter the venue. You'll still need your regular ticket (mobile or print-at-home) for entry.
            </p>
          </section>

          <section>
            <h3 className="font-bold uppercase text-lg mb-2">Supporting The Public</h3>
            <p className="text-sm leading-relaxed">
              Your commemorative ticket purchase includes a donation to support Public Theater.
              As a nonprofit organization, your contribution helps us continue producing
              world-class theater and serving our community.
            </p>
          </section>

          <section>
            <h3 className="font-bold uppercase text-lg mb-2">Refund Policy</h3>
            <p className="text-sm leading-relaxed">
              Commemorative tickets are non-refundable as they constitute a charitable donation
              to Public Theater. All sales are final once your order is processed.
            </p>
            <p className="text-sm leading-relaxed mt-2 text-gray-600">
              Commemorative tickets are souvenirs only and are not valid for admission.
            </p>
          </section>

          <section>
            <h3 className="font-bold uppercase text-lg mb-2">Shipping & Fulfillment</h3>
            <p className="text-sm leading-relaxed mb-2">
              Your commemorative ticket will be printed and mailed within 2–3 weeks of purchase.
              Please allow an additional 5–7 business days for delivery within the United States.
              International shipping may take longer.
            </p>
            <p className="text-sm leading-relaxed mb-2">
              Tickets will be shipped to the address you specify during checkout. Please ensure
              your shipping address is correct, as we cannot redirect shipments once they have
              been sent.
            </p>
            <p className="text-sm leading-relaxed font-bold">
              Need to ship to multiple addresses? You must place separate orders for each shipping address.
            </p>
          </section>

          <section>
            <h3 className="font-bold uppercase text-lg mb-2">Fulfillment Partner</h3>
            <p className="text-sm leading-relaxed">
              Commemorative tickets are fulfilled by WWL (World Wide Logistics). For questions
              about your order or shipping status, please contact our support team at{' '}
              <a
                href="mailto:support@publictheater.org"
                className="underline hover:text-[#DC143C]"
              >
                support@publictheater.org
              </a>
              .
            </p>
          </section>

          <section>
            <h3 className="font-bold uppercase text-lg mb-2">Design Selection</h3>
            <p className="text-sm leading-relaxed">
              Choose from three exclusive designs celebrating the 2025–26 season. Each design
              features original artwork commissioned specifically for this commemorative series.
              Limited edition designs may sell out and become unavailable.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t-2 border-black p-6">
          <button
            onClick={onClose}
            className="bg-[#DC143C] text-white px-8 py-3 font-bold uppercase hover:bg-[#B8102F] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}