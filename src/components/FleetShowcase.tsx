import { Car, Check, Users, Briefcase, PhoneCall, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { DESK_PHONE_HREF, FLEET_VEHICLES } from '../data/heritageData';
import type { FleetCategory, Vehicle } from '../types/travel';
import { buildWhatsAppDispatchUrl } from '../utils/fareCalculator';

interface FleetShowcaseProps {
  selectedVehicleId: string;
  onSelectVehicle: (vehicle: Vehicle, openEstimator?: boolean) => void;
}

const FILTER_OPTIONS: { id: FleetCategory; label: string }[] = [
  { id: 'all', label: 'All Cars (4)' },
  { id: 'sedan', label: 'Sedans (4-Seater)' },
  { id: 'suv', label: 'Toyota Innova (7S)' },
  { id: 'hatchback', label: 'Hatchback (4S)' },
];

export function FleetShowcase({ selectedVehicleId, onSelectVehicle }: FleetShowcaseProps) {
  const [filter, setFilter] = useState<FleetCategory>('all');
  const [useFallback, setUseFallback] = useState<Record<string, boolean>>({});
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const filteredVehicles =
    filter === 'all'
      ? FLEET_VEHICLES
      : FLEET_VEHICLES.filter((vehicle) => vehicle.category === filter);

  return (
    <section
      id="fleet-section"
      className="py-14 lg:py-20 border-b border-[#E4DBCF] ambient-champagne"
    >
      <div className="max-w-[1240px] mx-auto px-5 sm:px-8">
        {/* Section Heading & Filter Tabs */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#8F4529] mb-2">
              Sri Arumuga Travels Fleet Lineup
            </p>
            <h2 className="font-serif text-[30px] leading-[36px] sm:text-[40px] sm:leading-[46px] font-semibold tracking-[-0.015em] text-[#1F1A17] [text-wrap:balance]">
              A clear conversation before every journey
            </h2>
            <p className="text-[15px] leading-[24px] text-[#3D342E] mt-2">
              Matched to your family size and luggage requirements — Toyota Etios GD (TN 84 F 6278),
              Toyota Innova, Hyundai Verna, and Hyundai Grand i10. We do not run a tempo or a bus.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Filter vehicles by class"
            className="inline-flex flex-wrap items-center gap-1 p-1.5 rounded-full bg-[#F3EDE3] border border-[#E4DBCF] self-start shadow-xs"
          >
            {FILTER_OPTIONS.map((option) => {
              const active = filter === option.id;
              return (
                <button
                  key={option.id}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => setFilter(option.id)}
                  className={`px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all ${
                    active
                      ? 'bg-[#FFFDF9] text-[#1F1A17] shadow-xs'
                      : 'text-[#3D342E] hover:text-[#1F1A17]'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Vehicle Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
          {filteredVehicles.map((vehicle) => {
            const isSelected = vehicle.id === selectedVehicleId;
            const imgFailed = failedImages[vehicle.id];
            const imgSrc = useFallback[vehicle.id]
              ? vehicle.fallbackImagePath
              : vehicle.imagePath;

            const directWhatsApp = buildWhatsAppDispatchUrl({
              travelerName: 'Traveler',
              phone: 'Callback requested',
              pickupLocation: 'Srivilliputtur',
              dropDestination: 'Outstation / Airport Enquiry',
              tripType: 'round-trip',
              pickupDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
              pickupTime: '06:00',
              days: 1,
              distanceKm: 78,
              vehicleName: vehicle.name,
              vehicleReg: vehicle.registrationCode,
              estimatedFare: 0,
            });

            return (
              <article
                key={vehicle.id}
                className={`rounded-3xl glass-ivory transition-all duration-300 overflow-hidden flex flex-col justify-between hover:-translate-y-0.5 ${
                  isSelected
                    ? 'ring-2 ring-[#B85C38]/75 border-[#B85C38]'
                    : 'hover:shadow-[0_22px_52px_rgba(31,26,23,0.12)]'
                }`}
              >
                <div>
                  {/* Framed 4:3 Vehicle Profile Image */}
                  <div className="relative aspect-[4/3] m-3 mb-0 rounded-2xl bg-[#EFE8DC] border border-[#E4DBCF] overflow-hidden">
                    {!imgFailed ? (
                      <img
                        src={imgSrc}
                        alt={`${vehicle.name} — ${vehicle.modelSubtitle}`}
                        referrerPolicy="no-referrer"
                        onError={() => {
                          if (!useFallback[vehicle.id]) {
                            setUseFallback((prev) => ({ ...prev, [vehicle.id]: true }));
                          } else {
                            setFailedImages((prev) => ({ ...prev, [vehicle.id]: true }));
                          }
                        }}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#EFE8DC] to-[#F6F1E8]">
                        <Car className="w-10 h-10 text-[#B85C38] mb-2" aria-hidden="true" />
                        <p className="font-serif text-lg font-semibold text-[#1F1A17]">
                          {vehicle.name}
                        </p>
                        <p className="font-mono text-xs text-[#3D342E] mt-1">
                          {vehicle.registrationCode}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-6 sm:p-7 space-y-4">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-[11px] uppercase tracking-[0.06em] text-[#3D342E]">
                      <span className="font-semibold text-[#8F4529]">
                        {vehicle.registrationCode}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{vehicle.seats} Seater</span>
                      <span aria-hidden="true">·</span>
                      <span>{vehicle.acLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{vehicle.fuelType}</span>
                    </div>

                    <div>
                      <h3 className="font-serif text-[24px] leading-[30px] font-semibold text-[#1F1A17]">
                        {vehicle.name}
                      </h3>
                      <p className="text-[15px] text-[#3D342E] mt-0.5">{vehicle.bestFor}</p>
                    </div>

                    {/* Honest Capacity & Upfront Confirmation Strip */}
                    <div className="grid grid-cols-3 gap-3 py-3.5 px-4 rounded-2xl bg-[#F3EDE3] border border-[#E4DBCF] text-sm">
                      <div>
                        <span className="block text-xs text-[#6B635B]">Seating</span>
                        <span className="font-mono font-semibold text-[#1F1A17] tabular-nums">
                          {vehicle.seats} Passengers
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs text-[#6B635B]">Fuel</span>
                        <span className="font-mono font-semibold text-[#1F1A17]">
                          {vehicle.fuelType}
                        </span>
                      </div>
                      <div>
                        <span className="block text-xs text-[#6B635B]">Tariff</span>
                        <span className="font-mono font-semibold text-[#8F4529]">
                          Call / WhatsApp
                        </span>
                      </div>
                    </div>

                    {/* Seating & Luggage Specs + Highlights */}
                    <div className="flex flex-wrap items-center gap-5 text-sm text-[#3D342E]">
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-[#8F4529]" aria-hidden="true" />
                        <span>Up to {vehicle.seats} Passengers</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-[#8F4529]" aria-hidden="true" />
                        <span>{vehicle.luggageCount} Suitcases</span>
                      </span>
                    </div>

                    <ul className="space-y-1.5 text-[14px] text-[#3D342E]">
                      {vehicle.highlights.map((point) => (
                        <li key={point} className="flex items-start gap-2">
                          <Check
                            className="w-4 h-4 text-[#B85C38] shrink-0 mt-0.5"
                            aria-hidden="true"
                          />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-6 sm:px-7 pb-6 sm:pb-7 pt-1 flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => onSelectVehicle(vehicle, false)}
                    className={`flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-[14px] font-semibold whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-[#1F1A17] text-white shadow-sm'
                        : 'bg-[#B85C38] hover:bg-[#9A4A2C] text-white shadow-[0_8px_20px_rgba(184,92,56,0.22)]'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>Selected</span>
                      </>
                    ) : (
                      <span>Select Car</span>
                    )}
                  </button>

                  <a
                    href={directWhatsApp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#1F8470] hover:bg-[#18735E] text-white text-[13px] font-semibold whitespace-nowrap transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>WhatsApp</span>
                  </a>

                  <a
                    href={DESK_PHONE_HREF}
                    aria-label={`Call Sri Arumuga Travels for ${vehicle.name}`}
                    className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#D2C4B3] bg-[#FFFDF9] text-[#1F1A17] hover:border-[#B85C38] transition-colors"
                  >
                    <PhoneCall className="w-4 h-4 text-[#8F4529]" aria-hidden="true" />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
