import {
  Check,
  CheckCircle2,
  ClipboardCopy,
  FilePlus2,
  MessageCircle,
  PhoneCall,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { DESK_PHONE_HREF } from '../data/heritageData';
import type { DispatchStatus, TripDispatch } from '../types/travel';
import {
  buildWhatsAppDispatchUrl,
  formatDispatchSlipText,
  normalizeIndianPhone,
} from '../utils/fareCalculator';

interface DispatchLogProps {
  dispatches: TripDispatch[];
  onUpdateStatus: (id: string, status: DispatchStatus) => void;
  onDeleteDispatch: (id: string) => void;
  onCreateNewEstimate: () => void;
}

const STATUS_FILTERS: ('All' | DispatchStatus)[] = [
  'All',
  'Quote Saved',
  'Sent via WhatsApp',
  'Confirmed',
  'Cancelled',
];

function StatusIndicator({ status }: { status: DispatchStatus }) {
  switch (status) {
    case 'Confirmed':
      return (
        <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[#18735E]">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Confirmed</span>
        </span>
      );
    case 'Sent via WhatsApp':
      return (
        <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[#8F4529]">
          <MessageCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Sent via WhatsApp</span>
        </span>
      );
    case 'Cancelled':
      return (
        <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[#B42318]">
          <XCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Cancelled</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[#3D342E]">
          <FilePlus2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Saved Enquiry</span>
        </span>
      );
  }
}

export function DispatchLog({
  dispatches,
  onUpdateStatus,
  onDeleteDispatch,
  onCreateNewEstimate,
}: DispatchLogProps) {
  const [statusFilter, setStatusFilter] = useState<'All' | DispatchStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = dispatches.filter((item) => {
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.id.toLowerCase().includes(q) ||
      item.travelerName.toLowerCase().includes(q) ||
      item.dropDestination.toLowerCase().includes(q) ||
      item.pickupLocation.toLowerCase().includes(q) ||
      item.vehicleReg.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const handleCopy = async (dispatch: TripDispatch) => {
    try {
      await navigator.clipboard.writeText(formatDispatchSlipText(dispatch));
      setCopiedId(dispatch.id);
      window.setTimeout(() => {
        setCopiedId((prev) => (prev === dispatch.id ? null : prev));
      }, 2000);
    } catch {
      // Clipboard blocked in some embedded contexts
    }
  };

  return (
    <section id="dispatch-section" className="py-14 lg:py-20">
      <div className="max-w-[1240px] mx-auto px-5 sm:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#8F4529] mb-2">
              In-App Trip Ledger
            </p>
            <h2 className="font-serif text-[30px] leading-[36px] sm:text-[40px] sm:leading-[46px] font-semibold tracking-[-0.015em] text-[#1F1A17]">
              Saved Trip Enquiries
            </h2>
            <p className="text-[16px] leading-[24px] text-[#3D342E] mt-1.5">
              Your Srivilliputtur cab enquiries stay saved on this device so you can share them on
              WhatsApp or confirm directly by phone.
            </p>
          </div>

          <button
            type="button"
            onClick={onCreateNewEstimate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#B85C38] hover:bg-[#9A4A2C] text-white text-sm font-semibold whitespace-nowrap self-start shadow-[0_8px_20px_rgba(184,92,56,0.22)] transition-all"
          >
            <FilePlus2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>New Trip Enquiry</span>
          </button>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div
            role="tablist"
            aria-label="Filter saved enquiries by status"
            className="inline-flex flex-wrap items-center gap-1 p-1.5 rounded-full bg-[#F3EDE3] border border-[#E4DBCF] self-start shadow-xs"
          >
            {STATUS_FILTERS.map((status) => {
              const active = statusFilter === status;
              return (
                <button
                  key={status}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    active
                      ? 'bg-[#FFFDF9] text-[#1F1A17] shadow-xs'
                      : 'text-[#3D342E] hover:text-[#1F1A17]'
                  }`}
                >
                  {status === 'Quote Saved' ? 'Saved' : status}
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-76">
            <Search
              className="w-4 h-4 text-[#6B635B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference, city, or name..."
              aria-label="Search saved enquiries"
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[#FFFDF9] border border-[#E4DBCF] text-sm text-[#1F1A17] placeholder:text-[#6B635B] focus:outline-none focus:border-[#B85C38]"
            />
          </div>
        </div>

        {/* Empty State */}
        {filtered.length === 0 ? (
          <div className="rounded-3xl glass-ivory p-10 text-center space-y-4">
            <p className="font-serif text-2xl font-semibold text-[#1F1A17]">
              {dispatches.length === 0
                ? 'No saved trip enquiries yet'
                : 'No matching enquiries found'}
            </p>
            <p className="text-sm text-[#3D342E] max-w-md mx-auto">
              {dispatches.length === 0
                ? 'Use the Direct Desk Enquiry or Journey Planner to prepare an outstation trip.'
                : 'Try clearing your search filter or switching to All status tabs.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              {dispatches.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('All');
                    setSearchQuery('');
                  }}
                  className="px-5 py-2.5 rounded-full border border-[#E4DBCF] bg-[#FFFDF9] text-sm font-semibold text-[#1F1A17]"
                >
                  Reset Filters
                </button>
              ) : null}
              <button
                type="button"
                onClick={onCreateNewEstimate}
                className="px-5 py-2.5 rounded-full bg-[#B85C38] text-white text-sm font-semibold"
              >
                Create Trip Enquiry
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((item) => {
              const whatsappHref = buildWhatsAppDispatchUrl(item);
              const isCopied = copiedId === item.id;

              return (
                <article key={item.id} className="rounded-3xl glass-ivory p-6 sm:p-7">
                  {/* Top Enquiry Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E4DBCF]">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-mono text-sm font-semibold text-[#8F4529]">
                        {item.id}
                      </span>
                      <span aria-hidden="true" className="text-[#6B635B]">
                        ·
                      </span>
                      <span className="font-semibold text-[#1F1A17]">{item.travelerName}</span>
                      <span aria-hidden="true" className="text-[#6B635B]">
                        ·
                      </span>
                      <span className="font-mono text-xs text-[#3D342E] tabular-nums">
                        +91 {normalizeIndianPhone(item.phone)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <StatusIndicator status={item.status} />
                      <span className="font-mono text-xs font-semibold text-[#8F4529]">
                        Upfront Call / WhatsApp Quote
                      </span>
                    </div>
                  </div>

                  {/* Itinerary Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 text-sm">
                    <div>
                      <span className="block font-mono text-[11px] uppercase tracking-[0.06em] text-[#6B635B]">
                        Route
                      </span>
                      <p className="font-semibold text-[#1F1A17] mt-0.5">
                        {item.pickupLocation} {'->'} {item.dropDestination}
                      </p>
                      <p className="text-xs text-[#3D342E] mt-0.5">
                        {item.tripType === 'round-trip'
                          ? `Round Trip (${item.days} day${item.days > 1 ? 's' : ''})`
                          : 'One-Way Drop'}{' '}
                        · ~{item.distanceKm} km one-way
                      </p>
                    </div>

                    <div>
                      <span className="block font-mono text-[11px] uppercase tracking-[0.06em] text-[#6B635B]">
                        Departure Schedule
                      </span>
                      <p className="font-mono font-medium text-[#1F1A17] tabular-nums mt-0.5">
                        {item.pickupDate} at {item.pickupTime}
                      </p>
                      {item.notes ? (
                        <p className="text-xs text-[#3D342E] mt-0.5">{item.notes}</p>
                      ) : null}
                    </div>

                    <div>
                      <span className="block font-mono text-[11px] uppercase tracking-[0.06em] text-[#6B635B]">
                        Selected Vehicle
                      </span>
                      <p className="font-semibold text-[#1F1A17] mt-0.5">{item.vehicleName}</p>
                      <p className="font-mono text-xs text-[#8F4529] mt-0.5">
                        {item.vehicleReg}
                      </p>
                    </div>
                  </div>

                  {/* Action Toolbar */}
                  <div className="pt-3.5 border-t border-[#E4DBCF] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          if (item.status === 'Quote Saved') {
                            onUpdateStatus(item.id, 'Sent via WhatsApp');
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1F8470] hover:bg-[#18735E] text-white text-xs font-semibold whitespace-nowrap transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>Send via WhatsApp</span>
                      </a>

                      <a
                        href={DESK_PHONE_HREF}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1F1A17] hover:bg-[#3D342E] text-white text-xs font-semibold whitespace-nowrap transition-colors"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-[#F3E0D6] shrink-0" aria-hidden="true" />
                        <span>Call Desk</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleCopy(item)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[#D2C4B3] bg-[#FFFDF9] hover:border-[#B85C38] text-[#1F1A17] text-xs font-semibold whitespace-nowrap transition-colors"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#18735E]" aria-hidden="true" />
                            <span>Copied Details</span>
                          </>
                        ) : (
                          <>
                            <ClipboardCopy className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Copy Details</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.status !== 'Confirmed' && item.status !== 'Cancelled' ? (
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(item.id, 'Confirmed')}
                          className="px-3.5 py-1.5 rounded-full border border-[#B85C38] text-[#8F4529] hover:bg-[#F3E0D6]/60 text-xs font-semibold whitespace-nowrap transition-colors"
                        >
                          Mark Confirmed
                        </button>
                      ) : null}

                      {item.status !== 'Cancelled' ? (
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(item.id, 'Cancelled')}
                          className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#3D342E] hover:text-[#B42318] whitespace-nowrap transition-colors"
                        >
                          Cancel
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => onDeleteDispatch(item.id)}
                        aria-label={`Remove enquiry ${item.id}`}
                        className="p-2 rounded-full text-[#6B635B] hover:text-[#B42318] hover:bg-[#F3EDE3] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
