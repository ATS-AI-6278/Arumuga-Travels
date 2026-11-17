import { ExternalLink, Mail, MapPin, PhoneCall } from 'lucide-react';
import {
  DESK_ADDRESS,
  DESK_BRAND_NAME,
  DESK_EMAIL,
  DESK_GOOGLE_MAPS_URL,
  DESK_PHONE_ALT_DISPLAY,
  DESK_PHONE_ALT_HREF,
  DESK_PHONE_DISPLAY,
  DESK_PHONE_HREF,
  DESK_SITE_URL,
} from '../data/heritageData';
import type { PortalView } from '../types/travel';

interface FooterProps {
  onNavigate: (view: PortalView) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-[#1F1A17] text-[#E4DBCF] border-t border-[#E4DBCF]/15 pb-24 md:pb-12">
      <div className="max-w-[1240px] mx-auto px-5 sm:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-[#E4DBCF]/15">
          <div className="md:col-span-5 space-y-3">
            <p className="font-serif text-2xl font-semibold text-[#FFFDF9]">
              {DESK_BRAND_NAME}
            </p>
            <p className="text-sm text-[#E4DBCF]/85 leading-relaxed max-w-md">
              Tamil Nadu cab service based in Srivilliputtur (Srivilliputhur) — outstation sedan
              and Innova journeys, Madurai Airport pickups, and pilgrimage routes across India.
            </p>
            <div className="flex items-start gap-2 text-xs text-[#E4DBCF]/85 pt-1">
              <MapPin className="w-4 h-4 text-[#B85C38] shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-1">
                <p>{DESK_ADDRESS}</p>
                <a
                  href={DESK_GOOGLE_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#F3E0D6] hover:text-white underline underline-offset-4"
                >
                  <span>Open on Google Maps</span>
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>

          <div className="md:col-span-3 space-y-2.5">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#F3E0D6]">
              Travel Desk
            </p>
            <ul className="space-y-1.5 text-sm">
              {(
                [
                  ['overview', 'Overview & Enquiry'],
                  ['fleet', 'Fleet Lineup'],
                  ['routes', 'Routes & FAQ'],
                  ['map', 'Live Route Map'],
                  ['estimator', 'Trip Planner'],
                  ['dispatch', 'Saved Enquiries'],
                ] as [PortalView, string][]
              ).map(([view, label]) => (
                <li key={view}>
                  <button
                    type="button"
                    onClick={() => onNavigate(view)}
                    className="hover:text-[#FFFDF9] hover:underline underline-offset-4 transition-colors"
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4 space-y-2.5">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#F3E0D6]">
              Call or WhatsApp Desk
            </p>
            <div className="space-y-2 text-sm">
              <a
                href={DESK_PHONE_HREF}
                className="flex items-center gap-2 text-[#FFFDF9] hover:text-[#F3E0D6] font-mono tabular-nums"
              >
                <PhoneCall className="w-4 h-4 text-[#B85C38] shrink-0" aria-hidden="true" />
                <span>{DESK_PHONE_DISPLAY}</span>
              </a>
              <a
                href={DESK_PHONE_ALT_HREF}
                className="flex items-center gap-2 text-[#E4DBCF] hover:text-[#FFFDF9] font-mono text-xs tabular-nums"
              >
                <PhoneCall className="w-3.5 h-3.5 text-[#B85C38] shrink-0" aria-hidden="true" />
                <span>{DESK_PHONE_ALT_DISPLAY}</span>
              </a>
              <a
                href={`mailto:${DESK_EMAIL}`}
                className="flex items-center gap-2 text-[#E4DBCF] hover:text-[#FFFDF9] text-xs pt-0.5"
              >
                <Mail className="w-4 h-4 text-[#B85C38] shrink-0" aria-hidden="true" />
                <span>{DESK_EMAIL}</span>
              </a>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-[#E4DBCF]/70">
          <p>© {new Date().getFullYear()} {DESK_BRAND_NAME} — Srivilliputtur, Tamil Nadu.</p>
          <a
            href={DESK_SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono hover:text-[#FFFDF9] transition-colors"
          >
            sriarumugatravels.vercel.app
          </a>
        </div>
      </div>
    </footer>
  );
}
