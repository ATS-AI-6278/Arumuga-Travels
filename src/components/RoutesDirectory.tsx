import {
  ArrowRight,
  Car,
  CheckCircle2,
  Compass,
  Landmark,
  Plane,
  Route,
} from 'lucide-react';
import { useState } from 'react';
import {
  DESK_FAQS,
  ROUTE_CORRIDORS,
  SERVICE_GUARANTEES,
} from '../data/heritageData';
import type { RouteCategory, RouteCorridor } from '../types/travel';

interface RoutesDirectoryProps {
  onPrimeRoute: (route: RouteCorridor, openEstimator?: boolean) => void;
}

const ROUTE_FILTERS: { id: RouteCategory; label: string }[] = [
  { id: 'all', label: 'All Corridors' },
  { id: 'airport', label: 'Airport & Station' },
  { id: 'temple', label: 'Temple & Pilgrimage' },
  { id: 'city', label: 'Cities & Hills' },
];

function GuaranteeIcon({
  iconKey,
}: {
  iconKey: 'outstation' | 'airport' | 'temple' | 'local';
}) {
  switch (iconKey) {
    case 'outstation':
      return <Compass className="w-5 h-5 text-[#8F4529]" aria-hidden="true" />;
    case 'airport':
      return <Plane className="w-5 h-5 text-[#8F4529]" aria-hidden="true" />;
    case 'temple':
      return <Landmark className="w-5 h-5 text-[#8F4529]" aria-hidden="true" />;
    case 'local':
      return <Car className="w-5 h-5 text-[#8F4529]" aria-hidden="true" />;
  }
}

export function RoutesDirectory({ onPrimeRoute }: RoutesDirectoryProps) {
  const [filter, setFilter] = useState<RouteCategory>('all');

  const visibleRoutes =
    filter === 'all'
      ? ROUTE_CORRIDORS
      : ROUTE_CORRIDORS.filter((route) => route.category === filter);

  return (
    <div className="space-y-0">
      {/* Popular Routes & Circuits Section */}
      <section id="routes-section" className="py-14 lg:py-20 border-b border-[#E4DBCF]">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="max-w-2xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#8F4529] mb-2">
                Familiar Roads &amp; Anywhere in India
              </p>
              <h2 className="font-serif text-[30px] leading-[36px] sm:text-[40px] sm:leading-[46px] font-semibold tracking-[-0.015em] text-[#1F1A17] [text-wrap:balance]">
                Familiar roads — and any place you need to reach
              </h2>
              <p className="text-[15px] leading-[24px] text-[#3D342E] mt-2">
                These routes come up often. Your destination does not have to be on this list — if
                the road takes us there from Srivilliputtur, we will talk through timing and fare.
              </p>
            </div>

            <div
              role="tablist"
              aria-label="Filter route corridors"
              className="inline-flex flex-wrap items-center gap-1 p-1.5 rounded-full bg-[#F3EDE3] border border-[#E4DBCF] self-start shadow-xs"
            >
              {ROUTE_FILTERS.map((opt) => {
                const active = filter === opt.id;
                return (
                  <button
                    key={opt.id}
                    role="tab"
                    aria-selected={active}
                    type="button"
                    onClick={() => setFilter(opt.id)}
                    className={`px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all ${
                      active
                        ? 'bg-[#FFFDF9] text-[#1F1A17] shadow-xs'
                        : 'text-[#3D342E] hover:text-[#1F1A17]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleRoutes.map((route) => (
              <article
                key={route.id}
                className="rounded-3xl glass-ivory p-6 sm:p-7 flex flex-col justify-between gap-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_48px_rgba(31,26,23,0.12)]"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between gap-2 font-mono text-[11px] uppercase tracking-[0.06em] text-[#6B635B]">
                    <span className="text-[#8F4529] font-semibold">{route.shortLabel}</span>
                    <span className="tabular-nums">
                      ~{route.distanceKm} km · {route.durationLabel}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-serif text-[23px] leading-[29px] font-semibold text-[#1F1A17]">
                      {route.destination}
                    </h3>
                    <p className="text-xs font-mono text-[#6B635B] mt-1">
                      Via {route.highwayVia}
                    </p>
                  </div>

                  <p className="text-[15px] leading-[23px] text-[#3D342E]">{route.summary}</p>

                  <div className="pt-3 border-t border-[#E4DBCF] space-y-2 text-xs text-[#3D342E]">
                    <div className="flex items-center gap-1.5 font-medium text-[#1F1A17]">
                      <CheckCircle2
                        className="w-3.5 h-3.5 text-[#1F8470] shrink-0"
                        aria-hidden="true"
                      />
                      <span>One-Way &amp; Round Trip · Upfront Quote on Call</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <Route
                        className="w-3.5 h-3.5 text-[#6B635B] shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span>Stops: {route.stops.join(' · ')}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3.5 border-t border-[#E4DBCF] flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => onPrimeRoute(route, false)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#B85C38] hover:bg-[#9A4A2C] text-white text-[13px] font-semibold whitespace-nowrap transition-all"
                  >
                    <span>Enquire Route</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onPrimeRoute(route, true)}
                    className="inline-flex items-center justify-center px-4 py-2.5 rounded-full border border-[#D2C4B3] hover:border-[#B85C38] bg-[#FFFDF9] text-[#1F1A17] text-[13px] font-semibold whitespace-nowrap transition-colors"
                  >
                    Plan Trip
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Services & Straight Answers FAQ */}
      <section className="py-14 lg:py-20 bg-[#EFE8DC]/55 border-b border-[#E4DBCF] ambient-champagne">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 space-y-12">
          <div>
            <div className="max-w-2xl mb-8">
              <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#8F4529] mb-2">
                A Travel Desk Rooted in Srivilliputtur
              </p>
              <h2 className="font-serif text-[28px] leading-[36px] sm:text-[36px] sm:leading-[42px] font-semibold text-[#1F1A17]">
                Tamil Nadu taxi and outstation cab services
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {SERVICE_GUARANTEES.map((tile) => (
                <div key={tile.id} className="rounded-3xl glass-ivory p-6 space-y-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-[#F3E0D6] border border-[#E4DBCF] flex items-center justify-center">
                    <GuaranteeIcon iconKey={tile.iconKey} />
                  </div>
                  <h3 className="font-serif text-[22px] leading-[27px] font-semibold text-[#1F1A17]">
                    {tile.title}
                  </h3>
                  <p className="text-[14px] leading-[22px] text-[#3D342E]">{tile.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Straight Answers Before You Call (FAQ) */}
          <div id="faq" className="pt-8 border-t border-[#E4DBCF]">
            <div className="max-w-2xl mb-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#8F4529] mb-1.5">
                Straight Answers Before You Call
              </p>
              <h3 className="font-serif text-[26px] leading-[32px] font-semibold text-[#1F1A17]">
                Booking is by Call or WhatsApp from our Srivilliputtur base
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {DESK_FAQS.map((faq) => (
                <div
                  key={faq.id}
                  className="rounded-3xl glass-ivory p-6 sm:p-7 space-y-2.5"
                >
                  <h4 className="font-serif text-[20px] leading-[26px] font-semibold text-[#1F1A17]">
                    {faq.question}
                  </h4>
                  <p className="text-[15px] leading-[24px] text-[#3D342E]">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
