import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  MessageCircle,
  Mic,
  PhoneCall,
} from 'lucide-react';
import { useState } from 'react';
import {
  DESK_ADDRESS,
  DESK_GOOGLE_MAPS_URL,
  DESK_PHONE_ALT_DISPLAY,
  DESK_PHONE_ALT_HREF,
  DESK_PHONE_DISPLAY,
  DESK_PHONE_HREF,
  FLEET_VEHICLES,
  HERO_FALLBACK_IMAGE_PATH,
  HERO_IMAGE_PATH,
  PICKUP_PRESETS,
  ROUTE_CORRIDORS,
} from '../data/heritageData';
import type { InquiryDraft, RouteCorridor, TripDispatch } from '../types/travel';
import {
  buildWhatsAppDispatchUrl,
  calculateOutstationFare,
  isValidIndianPhone,
} from '../utils/fareCalculator';

interface HeroDeskProps {
  draft: InquiryDraft;
  onDraftChange: (patch: Partial<InquiryDraft>) => void;
  onSelectRoutePreset: (route: RouteCorridor) => void;
  onSubmitDispatch: (draft: InquiryDraft) => TripDispatch;
  onOpenEstimator: () => void;
  onOpenDispatchLog: () => void;
  onOpenConcierge: (tab: 'chat' | 'voice') => void;
}

export function HeroDesk({
  draft,
  onDraftChange,
  onSelectRoutePreset,
  onSubmitDispatch,
  onOpenEstimator,
  onOpenDispatchLog,
  onOpenConcierge,
}: HeroDeskProps) {
  const [heroSrc, setHeroSrc] = useState(HERO_IMAGE_PATH);
  const [heroImgError, setHeroImgError] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submittedDispatch, setSubmittedDispatch] = useState<TripDispatch | null>(null);

  const selectedVehicle =
    FLEET_VEHICLES.find((v) => v.id === draft.vehicleId) ?? FLEET_VEHICLES[0];

  const liveBreakdown = calculateOutstationFare(
    selectedVehicle,
    draft.distanceKm,
    draft.tripType,
    draft.days
  );

  const handleHeroImgError = () => {
    if (heroSrc !== HERO_FALLBACK_IMAGE_PATH) {
      setHeroSrc(HERO_FALLBACK_IMAGE_PATH);
    } else {
      setHeroImgError(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!draft.travelerName.trim() || draft.travelerName.trim().length < 2) {
      errors.travelerName = 'Enter traveler or family name';
    }
    if (!isValidIndianPhone(draft.phone)) {
      errors.phone = 'Enter a valid 10-digit Indian mobile number';
    }
    if (!draft.pickupLocation.trim()) {
      errors.pickupLocation = 'Enter pickup point in or near Srivilliputtur';
    }
    if (!draft.dropDestination.trim()) {
      errors.dropDestination = 'Enter drop destination or select a route chip';
    }
    if (!draft.pickupDate) {
      errors.pickupDate = 'Select travel date';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    const created = onSubmitDispatch(draft);
    setSubmittedDispatch(created);
  };

  const handleRouteChipClick = (route: RouteCorridor) => {
    setSubmittedDispatch(null);
    onSelectRoutePreset(route);
  };

  const quickWhatsAppUrl = buildWhatsAppDispatchUrl({
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
    estimatedFare: liveBreakdown.estimatedTotal,
    notes: draft.notes,
  });

  return (
    <section
      className="relative overflow-hidden bg-[#1F1A17] text-[#F6F1E8] border-b border-[#E4DBCF]/20"
      style={{
        backgroundImage:
          'radial-gradient(circle at 14% 18%, rgba(184, 92, 56, 0.22), transparent 46%), radial-gradient(circle at 86% 82%, rgba(31, 132, 112, 0.16), transparent 48%)',
      }}
    >
      <div className="max-w-[1240px] mx-auto px-5 sm:px-8 py-9 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* Left Narrative & Fleet Visual Column */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-6">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-[0.1em] text-[#F3E0D6]">
                <span>Based in Srivilliputtur, Tamil Nadu</span>
                <span aria-hidden="true">·</span>
                <span>Outstation &amp; Airport Cab Desk</span>
              </div>

              <h1 className="font-serif text-[36px] leading-[42px] sm:text-[50px] sm:leading-[56px] font-semibold tracking-[-0.02em] text-[#FFFDF9] [text-wrap:balance]">
                Travel from Srivilliputtur to <em>anywhere in India</em>.
              </h1>

              <p className="text-[16px] sm:text-[17px] leading-[27px] text-[#E4DBCF] max-w-2xl">
                Tamil Nadu cab service from one desk in Srivilliputtur (Srivilliputhur) — sedan
                and Innova outstation taxis across Tamil Nadu and beyond. Madurai airport links,
                temple trips, and family roads — planned clearly by phone or WhatsApp.
              </p>

              {/* Verified Contact Row */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href={DESK_PHONE_HREF}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#B85C38] hover:bg-[#9A4A2C] text-white text-[14px] sm:text-[15px] font-semibold whitespace-nowrap shadow-[0_10px_28px_rgba(184,92,56,0.34)] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F3E0D6]"
                >
                  <PhoneCall className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Call {DESK_PHONE_DISPLAY}</span>
                </a>

                <a
                  href={DESK_PHONE_ALT_HREF}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-white/10 hover:bg-white/18 border border-white/20 text-[#FFFDF9] text-[14px] font-semibold whitespace-nowrap backdrop-blur-md transition-all"
                >
                  <PhoneCall className="w-4 h-4 text-[#F3E0D6] shrink-0" aria-hidden="true" />
                  <span>{DESK_PHONE_ALT_DISPLAY}</span>
                </a>

                <a
                  href={quickWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#1F8470] hover:bg-[#18735E] text-white text-[14px] sm:text-[15px] font-semibold whitespace-nowrap shadow-md transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F8470]"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={() => onOpenConcierge('voice')}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-white/10 hover:bg-white/18 border border-[#F3E0D6]/35 text-[#F3E0D6] text-[14px] font-semibold whitespace-nowrap backdrop-blur-md transition-all"
                >
                  <Mic className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Voice Assistant</span>
                </button>
              </div>
            </div>

            {/* 16:9 Fleet Banner Photography Frame + Address Strip */}
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-3xl border border-[#E4DBCF]/25 bg-[#2A231F] aspect-[16/9] shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
                {!heroImgError ? (
                  <img
                    src={heroSrc}
                    alt="Sri Arumuga Travels fleet in Srivilliputtur: Toyota Innova, Toyota Etios, Hyundai Verna, Hyundai Grand i10"
                    referrerPolicy="no-referrer"
                    onError={handleHeroImgError}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#3D342E] to-[#1F1A17]">
                    <MapPin className="w-8 h-8 text-[#B85C38] mb-2" />
                    <p className="font-serif text-lg text-[#FFFDF9]">
                      Sri Arumuga Travels · Srivilliputtur
                    </p>
                    <p className="text-sm text-[#E4DBCF]">{DESK_ADDRESS}</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1F1A17]/85 via-[#1F1A17]/15 to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-3 right-3 glass-obsidian rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-[#FFFDF9]">
                  <span className="truncate max-w-md">{DESK_ADDRESS}</span>
                  <a
                    href={DESK_GOOGLE_MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#F3E0D6] hover:text-white font-semibold shrink-0"
                  >
                    <span>Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>

              {/* Popular Destination Route Strip */}
              <div className="pt-1">
                <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#E4DBCF]/80 mb-2.5">
                  Familiar destinations — tap to pre-fill your enquiry:
                </p>
                <div className="flex flex-wrap gap-2">
                  {ROUTE_CORRIDORS.map((route) => {
                    const isSelected =
                      draft.dropDestination.toLowerCase().includes(route.shortLabel.toLowerCase());
                    return (
                      <button
                        key={route.id}
                        type="button"
                        onClick={() => handleRouteChipClick(route)}
                        className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap transition-all border backdrop-blur-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B85C38] ${
                          isSelected
                            ? 'bg-[#B85C38] border-[#B85C38] text-white shadow-md'
                            : 'bg-white/10 border-white/15 text-[#F6F1E8] hover:border-[#F3E0D6]/50 hover:bg-white/15'
                        }`}
                      >
                        {route.shortLabel}{' '}
                        <span className="font-mono text-[11px] opacity-80 tabular-nums">
                          {route.distanceKm} km
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Luxury Frosted Glass Quick Enquiry Card */}
          <div id="quick-inquiry-card" className="lg:col-span-5 flex">
            <div className="w-full rounded-3xl glass-ivory text-[#1F1A17] p-6 sm:p-8 flex flex-col justify-between shadow-[0_28px_68px_rgba(0,0,0,0.42)]">
              <div>
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#E4DBCF]">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#8F4529]">
                      Direct Desk Enquiry
                    </p>
                    <h2 className="font-serif text-[26px] leading-[32px] font-semibold text-[#1F1A17] mt-0.5">
                      Tell us where you are headed
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenEstimator}
                    className="text-xs font-semibold text-[#8F4529] hover:text-[#B85C38] underline underline-offset-4 whitespace-nowrap shrink-0 pt-1"
                  >
                    Route Planner
                  </button>
                </div>

                {submittedDispatch ? (
                  <div className="mt-5 rounded-2xl border border-[#B85C38]/40 bg-white/85 p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2
                        className="w-5 h-5 text-[#1F8470] shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="font-mono text-xs uppercase tracking-[0.06em] text-[#8F4529]">
                          Enquiry Saved · {submittedDispatch.id}
                        </p>
                        <h3 className="font-serif text-xl font-semibold text-[#1F1A17] mt-0.5">
                          Ready for {submittedDispatch.travelerName}
                        </h3>
                        <p className="text-sm text-[#3D342E] mt-1">
                          {submittedDispatch.pickupLocation} to {submittedDispatch.dropDestination}{' '}
                          on{' '}
                          <span className="font-mono tabular-nums">
                            {submittedDispatch.pickupDate} ({submittedDispatch.pickupTime})
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-[#E4DBCF] pt-3 flex items-center justify-between text-sm">
                      <span className="text-[#3D342E]">
                        {submittedDispatch.vehicleName} ({submittedDispatch.vehicleReg})
                      </span>
                      <span className="font-mono text-xs font-semibold text-[#8F4529]">
                        Confirm on Call / WhatsApp
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <a
                        href={buildWhatsAppDispatchUrl(submittedDispatch)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#1F8470] hover:bg-[#18735E] text-white font-semibold text-sm transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>Open WhatsApp</span>
                      </a>
                      <button
                        type="button"
                        onClick={onOpenDispatchLog}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#1F1A17] hover:bg-[#3D342E] text-white font-semibold text-sm transition-colors"
                      >
                        <span>Saved Enquiries</span>
                        <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSubmittedDispatch(null)}
                      className="text-xs font-semibold text-[#8F4529] hover:underline"
                    >
                      Create another enquiry
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="mt-4 space-y-3.5" noValidate>
                    {/* Trip Type Segmented Control */}
                    <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-[#F3EDE3] border border-[#E4DBCF]">
                      {(['round-trip', 'one-way'] as const).map((type) => {
                        const active = draft.tripType === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() =>
                              onDraftChange({
                                tripType: type,
                                days: type === 'one-way' ? 1 : draft.days,
                              })
                            }
                            className={`py-2 px-3 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                              active
                                ? 'bg-[#FFFDF9] text-[#1F1A17] shadow-xs'
                                : 'text-[#3D342E] hover:text-[#1F1A17]'
                            }`}
                          >
                            {type === 'round-trip' ? 'Round Trip' : 'One-Way Drop'}
                          </button>
                        );
                      })}
                    </div>

                    {/* Pickup & Drop */}
                    <div className="space-y-3">
                      <div>
                        <label
                          htmlFor="hero-pickup"
                          className="block text-[13px] font-semibold text-[#3D342E] mb-1"
                        >
                          Pickup Point
                        </label>
                        <input
                          id="hero-pickup"
                          list="srivilliputtur-pickups"
                          type="text"
                          value={draft.pickupLocation}
                          onChange={(e) => onDraftChange({ pickupLocation: e.target.value })}
                          placeholder="e.g., Srivilliputtur, Rajapalayam, or Madurai"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#E4DBCF] text-[15px] text-[#1F1A17] placeholder:text-[#6B635B] focus:outline-none focus:border-[#B85C38] focus:ring-2 focus:ring-[#B85C38]/20"
                        />
                        <datalist id="srivilliputtur-pickups">
                          {PICKUP_PRESETS.map((preset) => (
                            <option key={preset} value={preset} />
                          ))}
                        </datalist>
                        {formErrors.pickupLocation ? (
                          <p className="text-xs text-[#B42318] mt-1">{formErrors.pickupLocation}</p>
                        ) : null}
                      </div>

                      <div>
                        <label
                          htmlFor="hero-drop"
                          className="block text-[13px] font-semibold text-[#3D342E] mb-1"
                        >
                          Destination (Tamil Nadu or Anywhere in India)
                        </label>
                        <input
                          id="hero-drop"
                          type="text"
                          value={draft.dropDestination}
                          onChange={(e) => onDraftChange({ dropDestination: e.target.value })}
                          placeholder="e.g., Madurai Airport (IXM), Chennai, Rameswaram"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFDF9] border border-[#E4DBCF] text-[15px] text-[#1F1A17] placeholder:text-[#6B635B] focus:outline-none focus:border-[#B85C38] focus:ring-2 focus:ring-[#B85C38]/20"
                        />
                        {formErrors.dropDestination ? (
                          <p className="text-xs text-[#B42318] mt-1">
                            {formErrors.dropDestination}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {/* Date, Time & Vehicle */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="hero-date"
                          className="flex items-center gap-1 text-[13px] font-semibold text-[#3D342E] mb-1"
                        >
                          <Calendar className="w-3.5 h-3.5 text-[#8F4529]" aria-hidden="true" />
                          <span>Pickup Date</span>
                        </label>
                        <input
                          id="hero-date"
                          type="date"
                          value={draft.pickupDate}
                          onChange={(e) => onDraftChange({ pickupDate: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-[#FFFDF9] border border-[#E4DBCF] text-[14px] font-mono text-[#1F1A17] focus:outline-none focus:border-[#B85C38] focus:ring-2 focus:ring-[#B85C38]/20"
                        />
                        {formErrors.pickupDate ? (
                          <p className="text-xs text-[#B42318] mt-1">{formErrors.pickupDate}</p>
                        ) : null}
                      </div>

                      <div>
                        <label
                          htmlFor="hero-time"
                          className="flex items-center gap-1 text-[13px] font-semibold text-[#3D342E] mb-1"
                        >
                          <Clock className="w-3.5 h-3.5 text-[#8F4529]" aria-hidden="true" />
                          <span>Pickup Time</span>
                        </label>
                        <input
                          id="hero-time"
                          type="time"
                          value={draft.pickupTime}
                          onChange={(e) => onDraftChange({ pickupTime: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-[#FFFDF9] border border-[#E4DBCF] text-[14px] font-mono text-[#1F1A17] focus:outline-none focus:border-[#B85C38] focus:ring-2 focus:ring-[#B85C38]/20"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="hero-vehicle"
                          className="block text-[13px] font-semibold text-[#3D342E] mb-1"
                        >
                          Preferred Car
                        </label>
                        <select
                          id="hero-vehicle"
                          value={draft.vehicleId}
                          onChange={(e) => onDraftChange({ vehicleId: e.target.value })}
                          className="w-full px-3 py-2 rounded-xl bg-[#FFFDF9] border border-[#E4DBCF] text-[14px] text-[#1F1A17] focus:outline-none focus:border-[#B85C38] focus:ring-2 focus:ring-[#B85C38]/20"
                        >
                          {FLEET_VEHICLES.map((vehicle) => (
                            <option key={vehicle.id} value={vehicle.id}>
                              {vehicle.name} ({vehicle.seats}S)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="hero-distance"
                          className="block text-[13px] font-semibold text-[#3D342E] mb-1"
                        >
                          Approx. One-Way km
                        </label>
                        <input
                          id="hero-distance"
                          type="number"
                          min={20}
                          max={2500}
                          value={draft.distanceKm}
                          onChange={(e) =>
                            onDraftChange({ distanceKm: Number(e.target.value) || 20 })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-[#FFFDF9] border border-[#E4DBCF] text-[14px] font-mono tabular-nums text-[#1F1A17] focus:outline-none focus:border-[#B85C38] focus:ring-2 focus:ring-[#B85C38]/20"
                        />
                      </div>
                    </div>

                    {/* Traveler Name & Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="hero-name"
                          className="block text-[13px] font-semibold text-[#3D342E] mb-1"
                        >
                          Your Name
                        </label>
                        <input
                          id="hero-name"
                          type="text"
                          value={draft.travelerName}
                          onChange={(e) => onDraftChange({ travelerName: e.target.value })}
                          placeholder="e.g., Ramesh Natarajan"
                          className="w-full px-3 py-2 rounded-xl bg-[#FFFDF9] border border-[#E4DBCF] text-[14px] text-[#1F1A17] placeholder:text-[#6B635B] focus:outline-none focus:border-[#B85C38] focus:ring-2 focus:ring-[#B85C38]/20"
                        />
                        {formErrors.travelerName ? (
                          <p className="text-xs text-[#B42318] mt-1">{formErrors.travelerName}</p>
                        ) : null}
                      </div>

                      <div>
                        <label
                          htmlFor="hero-phone"
                          className="block text-[13px] font-semibold text-[#3D342E] mb-1"
                        >
                          Mobile Number (+91)
                        </label>
                        <input
                          id="hero-phone"
                          type="tel"
                          inputMode="numeric"
                          value={draft.phone}
                          onChange={(e) => onDraftChange({ phone: e.target.value })}
                          placeholder="98942 20028"
                          className="w-full px-3 py-2 rounded-xl bg-[#FFFDF9] border border-[#E4DBCF] text-[14px] font-mono text-[#1F1A17] placeholder:text-[#6B635B] focus:outline-none focus:border-[#B85C38] focus:ring-2 focus:ring-[#B85C38]/20"
                        />
                        {formErrors.phone ? (
                          <p className="text-xs text-[#B42318] mt-1">{formErrors.phone}</p>
                        ) : null}
                      </div>
                    </div>

                    {/* Honest Upfront Fare Note */}
                    <div className="rounded-2xl bg-[#F3EDE3] border border-[#E4DBCF] px-4 py-3 flex items-center justify-between gap-3">
                      <div className="text-xs text-[#3D342E]">
                        <span className="font-semibold text-[#1F1A17]">
                          {selectedVehicle.name}
                        </span>{' '}
                        · {selectedVehicle.registrationCode}
                      </div>
                      <span className="font-mono text-[11px] font-semibold text-[#8F4529]">
                        Upfront Quote by Call / WhatsApp
                      </span>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 px-5 rounded-full bg-[#B85C38] hover:bg-[#9A4A2C] text-white text-[15px] font-semibold shadow-[0_10px_24px_rgba(184,92,56,0.26)] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B85C38]"
                    >
                      Save Enquiry &amp; Prepare WhatsApp Message
                    </button>
                  </form>
                )}
              </div>

              <p className="mt-4 pt-3 border-t border-[#E4DBCF] text-xs text-[#3D342E] leading-relaxed">
                No app cart or hidden rates — speak directly with Sri Arumuga Travels to confirm
                timing and upfront fare before you travel.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
