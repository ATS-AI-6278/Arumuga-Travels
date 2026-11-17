import { Menu, PhoneCall, X } from 'lucide-react';
import { useState } from 'react';
import { DESK_BRAND_NAME, DESK_PHONE_HREF } from '../data/heritageData';
import type { PortalView } from '../types/travel';

interface HeaderProps {
  activeView: PortalView;
  dispatchCount: number;
  onNavigate: (view: PortalView) => void;
  onQuickBookClick: () => void;
}

const NAV_ITEMS: { id: PortalView; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'fleet', label: 'Fleet' },
  { id: 'routes', label: 'Routes' },
  { id: 'map', label: 'Route Map' },
  { id: 'estimator', label: 'Planner' },
  { id: 'dispatch', label: 'Enquiries' },
];

export function Header({
  activeView,
  dispatchCount,
  onNavigate,
  onQuickBookClick,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (view: PortalView) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 glass-ivory border-x-0 border-t-0 border-b border-[#E4DBCF]">
      <div className="max-w-[1240px] mx-auto px-5 sm:px-8 h-[68px] flex items-center justify-between gap-6">
        {/* Zone 1: Single-line Brand Title */}
        <button
          type="button"
          onClick={() => handleNavClick('overview')}
          className="text-left font-serif text-xl sm:text-[22px] font-semibold tracking-tight text-[#1F1A17] hover:text-[#B85C38] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#B85C38]"
        >
          {DESK_BRAND_NAME}
        </button>

        {/* Zone 2: Clean Single-Line Navigation Links */}
        <nav
          aria-label="Primary navigation"
          className="hidden lg:flex items-center gap-1 p-1 rounded-full bg-[#F3EDE3]/80 border border-[#E4DBCF] text-[14px] font-medium text-[#3D342E]"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`px-3.5 py-1.5 rounded-full whitespace-nowrap shrink-0 transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B85C38] ${
                  isActive
                    ? 'bg-[#FFFDF9] text-[#8F4529] font-semibold shadow-xs'
                    : 'text-[#3D342E] hover:text-[#1F1A17] hover:bg-white/50'
                }`}
              >
                {item.label}
                {item.id === 'dispatch' && dispatchCount > 0 ? (
                  <span className="ml-1.5 font-mono text-[11px] text-[#8F4529] tabular-nums">
                    ({dispatchCount})
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary CTA + Mobile Trigger */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onQuickBookClick}
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#B85C38] hover:bg-[#9A4A2C] text-white text-[14px] font-semibold whitespace-nowrap shrink-0 shadow-[0_8px_20px_rgba(184,92,56,0.24)] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B85C38]"
          >
            <PhoneCall className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Enquire Now</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#E4DBCF] bg-[#FFFDF9] text-[#1F1A17] hover:border-[#B85C38] transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Navigation Drawer */}
      {mobileMenuOpen ? (
        <div className="lg:hidden border-t border-[#E4DBCF] bg-[#FFFDF9]/95 backdrop-blur-xl px-5 py-4 space-y-3 shadow-xl">
          <div className="flex flex-col space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-2xl text-left text-[15px] font-medium transition-colors ${
                    isActive
                      ? 'bg-[#F3E0D6] text-[#8F4529] font-semibold'
                      : 'text-[#3D342E] hover:bg-[#F3EDE3]'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.id === 'dispatch' ? (
                    <span className="font-mono text-xs tabular-nums text-[#6B635B]">
                      {dispatchCount} saved
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <div className="pt-2 border-t border-[#E4DBCF] flex items-center gap-3">
            <a
              href={DESK_PHONE_HREF}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#1F1A17] text-white text-sm font-semibold"
            >
              <PhoneCall className="w-4 h-4 text-[#F3E0D6]" aria-hidden="true" />
              <span>Call Desk</span>
            </a>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onQuickBookClick();
              }}
              className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-full bg-[#B85C38] hover:bg-[#9A4A2C] text-white text-sm font-semibold"
            >
              Quick Enquiry
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
