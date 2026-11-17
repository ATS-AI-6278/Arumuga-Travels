import {
  CheckCircle2,
  Info,
  MessageCircle,
  Minus,
  PhoneCall,
  Plus,
  ReceiptText,
} from 'lucide-react';
import { useState } from 'react';
import {
  DESK_PHONE_ALT_DISPLAY,
  DESK_PHONE_ALT_HREF,
  DESK_PHONE_DISPLAY,
  DESK_PHONE_HREF,
  FLEET_VEHICLES,
  PICKUP_PRESETS,
  ROUTE_CORRIDORS,
} from '../data/heritageData';
import type { InquiryDraft, TripDispatch } from '../types/travel';
import {
  buildWhatsAppDispatchUrl,
  calculateOutstationFare,
  isValidIndianPhone,
} from '../utils/fareCalculator';

interface FareEstimatorProps {
  draft: InquiryDraft;
  onDraftChange: (patch: Partial<InquiryDraft>) => void;
  onSaveDispatch: (draft: InquiryDraft) => TripDispatch;
  onOpenDispatchLog: () => void;
}

export function FareEstimator({
  draft,
  onDraftChange,
  onSaveDispatch,
  onOpenDispatchLog,
}: FareEstimatorProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lockedDispatch, setLockedDispatch] = useState<TripDispatch | null>(null);

  const selectedVehicle =
    FLEET_VEHICLES.find((v) => v.id === draft.vehicleId) ?? FLEET_VEHICLES[0];

  const breakdown = calculateOutstationFare(
    selectedVehicle,
    draft.distanceKm,
    draft.tripType,
    draft.days
  );

  const handleLockQuote = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!draft.travelerName.trim() || draft.travelerName.trim().length < 2) {
      nextErrors.travelerName = 'Enter traveler name to prepare enquiry';
    }
    if (!isValidIndianPhone(draft.phone)) {
      nextErrors.phone = 'Enter a valid 10-digit Indian mobile number';
    }
    if (!draft.pickupLocation.trim()) {
      nextErrors.pickupLocation = 'Enter pickup point';
    }
    if (!draft.dropDestination.trim()) {
      nextErrors.dropDestination = 'Enter drop destination';
    }
    if (!draft.pickupDate) {
      nextErrors.pickupDate = 'Select departure date';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    const saved = onSaveDispatch(draft);
    setLockedDispatch(saved);
  };

  return (
    <section
      id="estimator-section"
      className="py-14 lg:py-20 border-b border-[#E4DBCF] ambient-champagne"
    >
      <div className="max-w-[1240px] mx-auto px-5 sm:px-8">
        <div className="max-w-2xl mb-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#8F4529] mb-2">
            Journey Planner &amp; Enquiry Builder
          </p>
          <h2 className="font-serif text-[30px] leading-[36px] sm:text-[40px] sm:leading-[46px] font-semibold tracking-[-0.015em] text-[#1F1A17] [text-wrap:balance]">
            Plan your route &amp; send your trip details on WhatsApp
          </h2>
          <p className="text-[16px] leading-[24px] text-[#3D342E] mt-2">
            Sri Arumuga Travels does not publish fixed fares online. Share your route, dates, and
            preferred car below to prepare a WhatsApp message — final fares are confirmed clearly
            upfront by call or WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Configuration Column */}
          <div className="lg:col-span-7 rounded-3xl glass-ivory p-6 sm:p-8 space-y-6">
            {/* Step 1: Trip Type & Corridor Presets */}
            <div className="space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-[#1F1A17]">
                  1. Journey Mode &amp; Destination
                </span>
                <div className="inline-flex p-1 rounded-full bg-[#F3EDE3] border border-[#E4DBCF]">
                  {(['round-trip', 'one-way'] as const).map((mode) => {
                    const active = draft.tripType === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setLockedDispatch(null);
                          onDraftChange({
                            tripType: mode,
                            days: mode === 'one-way' ? 1 : draft.days,
                          });
                        }}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                          active
                            ? 'bg-[#FFFDF9] text-[#1F1A17] shadow-xs'
                            : 'text-[#3D342E] hover:text-[#1F1A17]'
                        }`}
                      >
                        {mode === 'round-trip' ? 'Round Trip' : 'One-Way Drop'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {ROUTE_CORRIDORS.map((route) => {
                  const selected =
                    draft.dropDestination.toLowerCase().includes(route.shortLabel.toLowerCase());
                  return (
                    <button
                      key={route.id}
                      type="button"
                      onClick={() => {
                        setLockedDispatch(null);
                        onDraftChange({
                          dropDestination: route.destination,
                          distanceKm: route.distanceKm,
                        });
                      }}
                      className={`px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all whitespace-nowrap ${
                        selected
                          ? 'bg-[#B85C38] border-[#B85C38] text-white shadow-xs'
                          : 'bg-[#FFFDF9] border-[#E4DBCF] text-[#3D342E] hover:border-[#B85C38]'
                      }`}
                    >
                      {route.shortLabel} ({route.distanceKm} km)
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Distance & Duration Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-5 border-t border-[#E4DBCF]">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="est-distance"
                    className="text-sm font-semibold text-[#1F1A17]"
                  >
                    Approx. One-Way Distance
                  </label>
                  <span className="font-mono text-sm font-semibold text-[#8F4529] tabular-nums">
                    {draft.distanceKm} km
                  </span>
                </div>
                <input
                  id="est-distance"
                  type="range"
                  min={40}
                  max={800}
                  step={5}
                  value={Math.min(800, Math.max(40, draft.distanceKm))}
                  onChange={(e) => {
                    setLockedDispatch(null);
                    onDraftChange({ distanceKm: Number(e.target.value) });
                  }}
                  className="w-full accent-[#B85C38] cursor-pointer"
                />
                <div className="flex items-center justify-between text-[11px] font-mono text-[#6B635B] mt-1.5">
                  <span>40 km</span>
                  <span>Custom km:</span>
                  <input
                    aria-label="Custom one-way distance in kilometres"
                    type="number"
                    min={20}
                    max={2500}
                    value={draft.distanceKm}
                    onChange={(e) => {
                      setLockedDispatch(null);
                      onDraftChange({ distanceKm: Number(e.target.value) || 20 });
                    }}
                    className="w-20 px-2.5 py-1 rounded-xl bg-[#FFFDF9] border border-[#E4DBCF] text-right font-mono text-xs tabular-nums text-[#1F1A17]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1F1A17] mb-1.5">
                  Trip Duration (Days)
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={draft.tripType === 'one-way' || draft.days <= 1}
                    onClick={() => {
                      setLockedDispatch(null);
                      onDraftChange({ days: Math.max(1, draft.days - 1) });
                    }}
                    aria-label="Decrease days"
                    className="w-10 h-10 rounded-full border border-[#E4DBCF] bg-[#FFFDF9] flex items-center justify-center text-[#1F1A17] disabled:opacity-40 hover:border-[#B85C38] transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="flex-1 py-2 px-3 rounded-2xl bg-[#FFFDF9] border border-[#E4DBCF] text-center font-mono text-base font-semibold tabular-nums">
                    {draft.tripType === 'one-way' ? 1 : draft.days}{' '}
                    {(draft.tripType === 'one-way' ? 1 : draft.days) === 1 ? 'Day' : 'Days'}
                  </div>
                  <button
                    type="button"
                    disabled={draft.tripType === 'one-way' || draft.days >= 14}
                    onClick={() => {
                      setLockedDispatch(null);
                      onDraftChange({ days: Math.min(14, draft.days + 1) });
                    }}
                    aria-label="Increase days"
                    className="w-10 h-10 rounded-full border border-[#E4DBCF] bg-[#FFFDF9] flex items-center justify-center text-[#1F1A17] disabled:opacity-40 hover:border-[#B85C38] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-[#6B635B] mt-1.5">
                  {draft.tripType === 'one-way'
                    ? 'Single-day point transfer.'
                    : 'Used to plan round-trip dates and driver halt schedule.'}
                </p>
              </div>
            </div>

            {/* Step 3: Select Vehicle */}
            <div className="pt-5 border-t border-[#E4DBCF] space-y-3">
              <span className="block text-sm font-semibold text-[#1F1A17]">
                2. Choose Vehicle Option
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FLEET_VEHICLES.map((vehicle) => {
                  const active = vehicle.id === draft.vehicleId;

                  return (
                    <button
                      key={vehicle.id}
                      type="button"
                      onClick={() => {
                        setLockedDispatch(null);
                        onDraftChange({ vehicleId: vehicle.id });
                      }}
                      className={`text-left p-4 rounded-2xl border transition-all ${
                        active
                          ? 'bg-[#F3E0D6]/70 border-[#B85C38] ring-1 ring-[#B85C38]'
                          : 'bg-[#FFFDF9] border-[#E4DBCF] hover:border-[#B85C38]/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm text-[#1F1A17]">{vehicle.name}</p>
                          <p className="font-mono text-[11px] text-[#6B635B]">
                            {vehicle.registrationCode} · {vehicle.seats} Seater · {vehicle.fuelType}
                          </p>
                        </div>
                        <span className="font-mono text-[11px] font-semibold text-[#8F4529]">
                          {vehicle.luggageCount} bags
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Traveler Details */}
            <form
              onSubmit={handleLockQuote}
              className="pt-5 border-t border-[#E4DBCF] space-y-4"
              noValidate
            >
              <span className="block text-sm font-semibold text-[#1F1A17]">
                3. Traveler &amp; Pickup Details
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="est-pickup"
                    className="block text-xs font-semibold text-[#3D342E] mb-1"
                  >
                    Pickup Location
                  </label>
                  <input
                    id="est-pickup"
                    list="est-pickup-presets"
                    type="text"
                    value={draft.pickupLocation}
                    onChange={(e) => onDraftChange({ pickupLocation: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#E4DBCF] text-sm text-[#1F1A17] focus:outline-none focus:border-[#B85C38]"
                  />
                  <datalist id="est-pickup-presets">
                    {PICKUP_PRESETS.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                  {errors.pickupLocation ? (
                    <p className="text-xs text-[#B42318] mt-1">{errors.pickupLocation}</p>
                  ) : null}
                </div>

                <div>
                  <label
                    htmlFor="est-drop"
                    className="block text-xs font-semibold text-[#3D342E] mb-1"
                  >
                    Drop Destination
                  </label>
                  <input
                    id="est-drop"
                    type="text"
                    value={draft.dropDestination}
                    onChange={(e) => onDraftChange({ dropDestination: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#E4DBCF] text-sm text-[#1F1A17] focus:outline-none focus:border-[#B85C38]"
                  />
                  {errors.dropDestination ? (
                    <p className="text-xs text-[#B42318] mt-1">{errors.dropDestination}</p>
                  ) : null}
                </div>

                <div>
                  <label
                    htmlFor="est-name"
                    className="block text-xs font-semibold text-[#3D342E] mb-1"
                  >
                    Traveler Name
                  </label>
                  <input
                    id="est-name"
                    type="text"
                    value={draft.travelerName}
                    onChange={(e) => onDraftChange({ travelerName: e.target.value })}
                    placeholder="Full name"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#E4DBCF] text-sm text-[#1F1A17] focus:outline-none focus:border-[#B85C38]"
                  />
                  {errors.travelerName ? (
                    <p className="text-xs text-[#B42318] mt-1">{errors.travelerName}</p>
                  ) : null}
                </div>

                <div>
                  <label
                    htmlFor="est-phone"
                    className="block text-xs font-semibold text-[#3D342E] mb-1"
                  >
                    Mobile Number (+91)
                  </label>
                  <input
                    id="est-phone"
                    type="tel"
                    inputMode="numeric"
                    value={draft.phone}
                    onChange={(e) => onDraftChange({ phone: e.target.value })}
                    placeholder="10-digit mobile number"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#E4DBCF] text-sm font-mono text-[#1F1A17] focus:outline-none focus:border-[#B85C38]"
                  />
                  {errors.phone ? (
                    <p className="text-xs text-[#B42318] mt-1">{errors.phone}</p>
                  ) : null}
                </div>

                <div>
                  <label
                    htmlFor="est-date"
                    className="block text-xs font-semibold text-[#3D342E] mb-1"
                  >
                    Pickup Date
                  </label>
                  <input
                    id="est-date"
                    type="date"
                    value={draft.pickupDate}
                    onChange={(e) => onDraftChange({ pickupDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#E4DBCF] text-sm font-mono text-[#1F1A17] focus:outline-none focus:border-[#B85C38]"
                  />
                  {errors.pickupDate ? (
                    <p className="text-xs text-[#B42318] mt-1">{errors.pickupDate}</p>
                  ) : null}
                </div>

                <div>
                  <label
                    htmlFor="est-time"
                    className="block text-xs font-semibold text-[#3D342E] mb-1"
                  >
                    Pickup Time
                  </label>
                  <input
                    id="est-time"
                    type="time"
                    value={draft.pickupTime}
                    onChange={(e) => onDraftChange({ pickupTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#E4DBCF] text-sm font-mono text-[#1F1A17] focus:outline-none focus:border-[#B85C38]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="est-notes"
                  className="block text-xs font-semibold text-[#3D342E] mb-1"
                >
                  Passengers, Luggage &amp; Special Notes (Optional)
                </label>
                <input
                  id="est-notes"
                  type="text"
                  value={draft.notes}
                  onChange={(e) => onDraftChange({ notes: e.target.value })}
                  placeholder="e.g., 4 passengers, 3 bags, elder passenger, Madurai Airport terminal"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#E4DBCF] text-sm text-[#1F1A17] focus:outline-none focus:border-[#B85C38]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-full bg-[#B85C38] hover:bg-[#9A4A2C] text-white text-[15px] font-semibold shadow-[0_10px_24px_rgba(184,92,56,0.26)] transition-all"
              >
                Save Enquiry to Desk Log
              </button>
            </form>
          </div>

          {/* Right Column: Luxury Obsidian Glass Route Summary & WhatsApp Handoff */}
          <div className="lg:col-span-5 space-y-5">
            <div className="rounded-3xl glass-obsidian text-[#F6F1E8] p-6 sm:p-8 space-y-5">
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#E4DBCF]/15">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#F3E0D6]">
                    Trip Enquiry Summary
                  </p>
                  <h3 className="font-serif text-[26px] leading-[32px] font-semibold text-[#FFFDF9] mt-0.5">
                    {selectedVehicle.name}
                  </h3>
                  <p className="font-mono text-xs text-[#E4DBCF]/80 mt-1">
                    {selectedVehicle.registrationCode} · {selectedVehicle.seats} Seater ·{' '}
                    {selectedVehicle.acLabel}
                  </p>
                </div>
                <ReceiptText className="w-6 h-6 text-[#F3E0D6] shrink-0" aria-hidden="true" />
              </div>

              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[#E4DBCF]">Pickup</dt>
                  <dd className="font-medium text-[#FFFDF9] text-right max-w-[60%] truncate">
                    {draft.pickupLocation}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[#E4DBCF]">Destination</dt>
                  <dd className="font-medium text-[#FFFDF9] text-right max-w-[60%] truncate">
                    {draft.dropDestination}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[#E4DBCF]">Journey Type</dt>
                  <dd className="font-medium text-[#FFFDF9]">
                    {breakdown.tripType === 'round-trip'
                      ? `Round Trip (${breakdown.days} Day${breakdown.days > 1 ? 's' : ''})`
                      : 'One-Way Point Drop'}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[#E4DBCF]">Approx. One-Way Distance</dt>
                  <dd className="font-mono tabular-nums text-[#FFFDF9]">
                    {breakdown.oneWayDistanceKm} km
                  </dd>
                </div>

                <div className="pt-4 border-t border-[#E4DBCF]/15 flex items-baseline justify-between gap-4">
                  <dt className="font-serif text-xl text-[#FFFDF9]">Fare Confirmation</dt>
                  <dd className="font-mono text-sm font-semibold text-[#F3E0D6]">
                    Confirmed Upfront on Call
                  </dd>
                </div>
              </dl>

              <div className="rounded-2xl bg-white/5 border border-[#E4DBCF]/20 p-3.5 flex items-start gap-2.5 text-xs text-[#E4DBCF]">
                <Info className="w-4 h-4 text-[#F3E0D6] shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  Sri Arumuga Travels does not publish automated online tariffs. Share this trip
                  plan via WhatsApp or call us directly for your exact upfront fare.
                </span>
              </div>

              <div className="pt-2 space-y-2.5">
                <a
                  href={buildWhatsAppDispatchUrl({
                    travelerName: draft.travelerName || 'Traveler',
                    phone: draft.phone || 'Callback requested',
                    pickupLocation: draft.pickupLocation,
                    dropDestination: draft.dropDestination,
                    tripType: draft.tripType,
                    pickupDate: draft.pickupDate,
                    pickupTime: draft.pickupTime,
                    days: draft.days,
                    distanceKm: draft.distanceKm,
                    vehicleName: selectedVehicle.name,
                    vehicleReg: selectedVehicle.registrationCode,
                    estimatedFare: breakdown.estimatedTotal,
                    notes: draft.notes,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-full bg-[#1F8470] hover:bg-[#18735E] text-white text-sm font-semibold transition-colors"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Open WhatsApp with Trip Details</span>
                </a>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <a
                    href={DESK_PHONE_HREF}
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full border border-[#E4DBCF]/30 hover:border-[#F3E0D6] text-[#FFFDF9] text-xs font-semibold transition-colors font-mono tabular-nums"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-[#F3E0D6] shrink-0" aria-hidden="true" />
                    <span>{DESK_PHONE_DISPLAY}</span>
                  </a>
                  <a
                    href={DESK_PHONE_ALT_HREF}
                    className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-full border border-[#E4DBCF]/30 hover:border-[#F3E0D6] text-[#FFFDF9] text-xs font-semibold transition-colors font-mono tabular-nums"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-[#F3E0D6] shrink-0" aria-hidden="true" />
                    <span>{DESK_PHONE_ALT_DISPLAY}</span>
                  </a>
                </div>
              </div>
            </div>

            {lockedDispatch ? (
              <div className="rounded-3xl glass-ivory border-[#B85C38] p-6 space-y-3">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2
                    className="w-5 h-5 text-[#1F8470] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-mono text-xs uppercase text-[#8F4529]">
                      Saved to Enquiries · {lockedDispatch.id}
                    </p>
                    <p className="text-sm font-semibold text-[#1F1A17] mt-0.5">
                      Enquiry ready for {lockedDispatch.travelerName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onOpenDispatchLog}
                  className="w-full py-2.5 px-4 rounded-full bg-[#1F1A17] text-white text-sm font-semibold hover:bg-[#3D342E] transition-colors"
                >
                  Open Saved Enquiries
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
