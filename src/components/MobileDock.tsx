import { MessageCircle, PhoneCall } from 'lucide-react';
import { DESK_PHONE_HREF, FLEET_VEHICLES } from '../data/heritageData';
import type { InquiryDraft } from '../types/travel';
import { buildWhatsAppDispatchUrl, calculateOutstationFare } from '../utils/fareCalculator';

interface MobileDockProps {
  draft: InquiryDraft;
}

export function MobileDock({ draft }: MobileDockProps) {
  const vehicle =
    FLEET_VEHICLES.find((v) => v.id === draft.vehicleId) ?? FLEET_VEHICLES[0];
  const breakdown = calculateOutstationFare(
    vehicle,
    draft.distanceKm,
    draft.tripType,
    draft.days
  );

  const whatsappUrl = buildWhatsAppDispatchUrl({
    travelerName: draft.travelerName || 'Traveler',
    phone: draft.phone || 'Callback requested',
    pickupLocation: draft.pickupLocation,
    dropDestination: draft.dropDestination,
    tripType: draft.tripType,
    pickupDate: draft.pickupDate,
    pickupTime: draft.pickupTime,
    days: draft.days,
    distanceKm: draft.distanceKm,
    vehicleName: vehicle.name,
    vehicleReg: vehicle.registrationCode,
    estimatedFare: breakdown.estimatedTotal,
    notes: draft.notes,
  });

  return (
    <div
      aria-label="Quick contact dock"
      className="md:hidden fixed bottom-3 left-3 right-3 z-40 rounded-full glass-ivory p-2 shadow-[0_14px_34px_rgba(31,26,23,0.22)]"
    >
      <div className="grid grid-cols-2 gap-2.5">
        <a
          href={DESK_PHONE_HREF}
          className="h-11 inline-flex items-center justify-center gap-2 rounded-full bg-[#1F1A17] text-white text-sm font-semibold whitespace-nowrap"
        >
          <PhoneCall className="w-4 h-4 text-[#F3E0D6] shrink-0" aria-hidden="true" />
          <span>Call Desk</span>
        </a>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="h-11 inline-flex items-center justify-center gap-2 rounded-full bg-[#1F8470] hover:bg-[#18735E] text-white text-sm font-semibold whitespace-nowrap"
        >
          <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>WhatsApp Us</span>
        </a>
      </div>
    </div>
  );
}
