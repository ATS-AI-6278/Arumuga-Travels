import { AlertTriangle, MessageSquareText, Mic } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ConciergeAssistant } from './components/ConciergeAssistant';
import { DispatchLog } from './components/DispatchLog';
import { FareEstimator } from './components/FareEstimator';
import { FleetShowcase } from './components/FleetShowcase';
import { Footer } from './components/Footer';
import { GoogleRouteMap } from './components/GoogleRouteMap';
import { Header } from './components/Header';
import { HeroDesk } from './components/HeroDesk';
import { MobileDock } from './components/MobileDock';
import { RoutesDirectory } from './components/RoutesDirectory';
import {
  FLEET_VEHICLES,
  INITIAL_SAMPLE_DISPATCHES,
  ROUTE_CORRIDORS,
} from './data/heritageData';
import type {
  DispatchStatus,
  InquiryDraft,
  PortalView,
  RouteCorridor,
  TripDispatch,
  Vehicle,
} from './types/travel';
import {
  calculateOutstationFare,
  generateWaybillId,
  normalizeIndianPhone,
} from './utils/fareCalculator';

const STORAGE_KEY = 'sat_trip_enquiries_v1';

function getDefaultPickupDate(): string {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return tomorrow.toISOString().split('T')[0];
}

function loadSavedDispatches(): TripDispatch[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return INITIAL_SAMPLE_DISPATCHES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TripDispatch[]) : INITIAL_SAMPLE_DISPATCHES;
  } catch {
    return INITIAL_SAMPLE_DISPATCHES;
  }
}

export default function App() {
  const [activeView, setActiveView] = useState<PortalView>('overview');
  const [dispatches, setDispatches] = useState<TripDispatch[]>(loadSavedDispatches);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [mapsApiKey, setMapsApiKey] = useState<string>(
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  );

  // AI Concierge Drawer State (Multi-Turn Chat + Live Voice 3.8)
  const [conciergeOpen, setConciergeOpen] = useState(false);
  const [conciergeTab, setConciergeTab] = useState<'chat' | 'voice'>('chat');

  const defaultRoute = ROUTE_CORRIDORS[0];
  const [draft, setDraft] = useState<InquiryDraft>({
    travelerName: '',
    phone: '',
    pickupLocation: 'Keelapatti Street, Srivilliputtur',
    dropDestination: defaultRoute.destination,
    tripType: 'round-trip',
    pickupDate: getDefaultPickupDate(),
    pickupTime: '05:30',
    days: 1,
    distanceKm: defaultRoute.distanceKm,
    vehicleId: FLEET_VEHICLES[0].id,
    notes: '',
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dispatches));
    } catch {
      // Ignore storage quota exceptions
    }
  }, [dispatches]);

  // Listen for Google Maps Platform Case A quota exhaustion events
  useEffect(() => {
    const handleQuotaExceeded = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  // Resolve runtime Google Maps API key from server config if not baked at build time
  useEffect(() => {
    if (mapsApiKey) return;
    fetch('/api/config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { mapsApiKey?: string } | null) => {
        if (data?.mapsApiKey) {
          setMapsApiKey(data.mapsApiKey);
        }
      })
      .catch(() => {
        // Ignore network failure if config endpoint unavailable
      });
  }, [mapsApiKey]);

  const handleDraftChange = (patch: Partial<InquiryDraft>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
  };

  const handleNavigate = (view: PortalView) => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickBookClick = () => {
    setActiveView('overview');
    window.setTimeout(() => {
      const target = document.getElementById('quick-inquiry-card');
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
  };

  const handleSelectRoutePreset = (route: RouteCorridor, openEstimator = false) => {
    setDraft((prev) => ({
      ...prev,
      dropDestination: route.destination,
      distanceKm: route.distanceKm,
      vehicleId: route.suggestedVehicleId,
    }));

    if (openEstimator) {
      setActiveView('estimator');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (activeView !== 'overview') {
      setActiveView('overview');
      window.setTimeout(() => {
        document
          .getElementById('quick-inquiry-card')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 40);
    }
  };

  const handleSelectVehicle = (vehicle: Vehicle, openEstimator = false) => {
    setDraft((prev) => ({ ...prev, vehicleId: vehicle.id }));
    if (openEstimator) {
      setActiveView('estimator');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (activeView === 'fleet') {
      setActiveView('overview');
      window.setTimeout(() => {
        document
          .getElementById('quick-inquiry-card')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 40);
    }
  };

  const handleSyncRouteFromMap = ({
    origin,
    destination,
    distanceKm,
  }: {
    origin: string;
    destination: string;
    distanceKm: number;
  }) => {
    setDraft((prev) => ({
      ...prev,
      pickupLocation: origin,
      dropDestination: destination,
      distanceKm,
    }));

    if (activeView === 'map') {
      setActiveView('estimator');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.setTimeout(() => {
        document
          .getElementById('estimator-section')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 40);
    }
  };

  const handleSaveDispatch = (submittedDraft: InquiryDraft): TripDispatch => {
    const vehicle =
      FLEET_VEHICLES.find((v) => v.id === submittedDraft.vehicleId) ?? FLEET_VEHICLES[0];
    const breakdown = calculateOutstationFare(
      vehicle,
      submittedDraft.distanceKm,
      submittedDraft.tripType,
      submittedDraft.days
    );

    const newDispatch: TripDispatch = {
      id: generateWaybillId(),
      createdAt: new Date().toISOString(),
      travelerName: submittedDraft.travelerName.trim(),
      phone: normalizeIndianPhone(submittedDraft.phone),
      pickupLocation: submittedDraft.pickupLocation.trim(),
      dropDestination: submittedDraft.dropDestination.trim(),
      tripType: submittedDraft.tripType,
      pickupDate: submittedDraft.pickupDate,
      pickupTime: submittedDraft.pickupTime,
      days: submittedDraft.tripType === 'one-way' ? 1 : submittedDraft.days,
      distanceKm: submittedDraft.distanceKm,
      vehicleId: vehicle.id,
      vehicleName: vehicle.name,
      vehicleReg: vehicle.registrationCode,
      estimatedFare: breakdown.estimatedTotal,
      notes: submittedDraft.notes.trim(),
      status: 'Quote Saved',
    };

    setDispatches((prev) => [newDispatch, ...prev]);
    return newDispatch;
  };

  const handleUpdateStatus = (id: string, status: DispatchStatus) => {
    setDispatches((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  const handleDeleteDispatch = (id: string) => {
    setDispatches((prev) => prev.filter((item) => item.id !== id));
  };

  const openConcierge = (tab: 'chat' | 'voice') => {
    setConciergeTab(tab);
    setConciergeOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F1E8] text-[#1F1A17]">
      {quotaExceeded ? (
        <div
          role="alert"
          className="sticky top-0 z-50 bg-[#B42318] text-white px-5 py-2.5 text-xs sm:text-sm flex flex-wrap items-center justify-center gap-2 border-b border-white/20"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 text-[#F3E0D6]" aria-hidden="true" />
          <span>
            Google Maps Demo Key quota exceeded. Switch to your own Cloud billing key in AI Studio
            Settings to continue live map &amp; routing calls.
          </span>
          <a
            href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-semibold text-[#F3E0D6] hover:text-white whitespace-nowrap"
          >
            Resolve Quota
          </a>
        </div>
      ) : null}

      <Header
        activeView={activeView}
        dispatchCount={dispatches.length}
        onNavigate={handleNavigate}
        onQuickBookClick={handleQuickBookClick}
      />

      <main className="flex-1">
        {activeView === 'overview' ? (
          <>
            <HeroDesk
              draft={draft}
              onDraftChange={handleDraftChange}
              onSelectRoutePreset={(route) => handleSelectRoutePreset(route, false)}
              onSubmitDispatch={handleSaveDispatch}
              onOpenEstimator={() => handleNavigate('estimator')}
              onOpenDispatchLog={() => handleNavigate('dispatch')}
              onOpenConcierge={openConcierge}
            />
            <FleetShowcase
              selectedVehicleId={draft.vehicleId}
              onSelectVehicle={handleSelectVehicle}
            />
            <RoutesDirectory onPrimeRoute={handleSelectRoutePreset} />
            <GoogleRouteMap
              apiKey={mapsApiKey}
              originText={draft.pickupLocation}
              destinationText={draft.dropDestination}
              onSyncRouteToEstimator={handleSyncRouteFromMap}
            />
            <FareEstimator
              draft={draft}
              onDraftChange={handleDraftChange}
              onSaveDispatch={handleSaveDispatch}
              onOpenDispatchLog={() => handleNavigate('dispatch')}
            />
            <DispatchLog
              dispatches={dispatches}
              onUpdateStatus={handleUpdateStatus}
              onDeleteDispatch={handleDeleteDispatch}
              onCreateNewEstimate={() => handleNavigate('estimator')}
            />
          </>
        ) : null}

        {activeView === 'map' ? (
          <>
            <GoogleRouteMap
              apiKey={mapsApiKey}
              originText={draft.pickupLocation}
              destinationText={draft.dropDestination}
              onSyncRouteToEstimator={handleSyncRouteFromMap}
            />
            <RoutesDirectory onPrimeRoute={handleSelectRoutePreset} />
          </>
        ) : null}

        {activeView === 'fleet' ? (
          <FleetShowcase
            selectedVehicleId={draft.vehicleId}
            onSelectVehicle={handleSelectVehicle}
          />
        ) : null}

        {activeView === 'routes' ? (
          <RoutesDirectory onPrimeRoute={handleSelectRoutePreset} />
        ) : null}

        {activeView === 'estimator' ? (
          <FareEstimator
            draft={draft}
            onDraftChange={handleDraftChange}
            onSaveDispatch={handleSaveDispatch}
            onOpenDispatchLog={() => handleNavigate('dispatch')}
          />
        ) : null}

        {activeView === 'dispatch' ? (
          <DispatchLog
            dispatches={dispatches}
            onUpdateStatus={handleUpdateStatus}
            onDeleteDispatch={handleDeleteDispatch}
            onCreateNewEstimate={() => handleNavigate('estimator')}
          />
        ) : null}
      </main>

      <Footer onNavigate={handleNavigate} />
      <MobileDock draft={draft} />

      {/* Floating Luxury Concierge Launcher (Chat + Live Voice 3.8) */}
      {!conciergeOpen ? (
        <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 flex items-center gap-2 p-1.5 rounded-full glass-obsidian shadow-[0_18px_48px_rgba(0,0,0,0.4)]">
          <button
            type="button"
            onClick={() => openConcierge('chat')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#B85C38] hover:bg-[#9A4A2C] text-white text-xs sm:text-sm font-semibold whitespace-nowrap transition-all"
          >
            <MessageSquareText className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Trip Concierge</span>
          </button>

          <button
            type="button"
            onClick={() => openConcierge('voice')}
            aria-label="Open Live Voice Concierge"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-[#1F8470] hover:bg-[#18735E] text-white text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors"
          >
            <Mic className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Voice</span>
          </button>
        </div>
      ) : null}

      <ConciergeAssistant
        isOpen={conciergeOpen}
        initialTab={conciergeTab}
        draft={draft}
        onClose={() => setConciergeOpen(false)}
      />
    </div>
  );
}
