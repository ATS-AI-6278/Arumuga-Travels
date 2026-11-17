import {
  APIProvider,
  AdvancedMarker,
  Map as GoogleMapComponent,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  ArrowRight,
  Compass,
  Loader2,
  MapPin,
  Navigation,
  Route as RouteIcon,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ROUTE_CORRIDORS } from '../data/heritageData';
import { useAutocompleteSuggestions } from '../hooks/useAutocompleteSuggestions';
import type { RouteCorridor } from '../types/travel';

interface GoogleRouteMapProps {
  apiKey: string;
  originText: string;
  destinationText: string;
  onSyncRouteToEstimator: (params: {
    origin: string;
    destination: string;
    distanceKm: number;
  }) => void;
}

interface ComputedRouteSummary {
  distanceMeters: number;
  durationMillis: number;
  startLatLng: { lat: number; lng: number } | null;
  endLatLng: { lat: number; lng: number } | null;
}

const DEFAULT_MAP_CENTER = { lat: 9.5121, lng: 77.634 };

function formatDurationMillis(ms: number): string {
  const totalMinutes = Math.max(1, Math.round(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return `${mins} min`;
  return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
}

function PlaceSearchInput({
  id,
  label,
  value,
  placeholder,
  onSelectText,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onSelectText: (text: string) => void;
}) {
  const placesLib = useMapsLibrary('places');
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const { suggestions, isLoading, resetSession } = useAutocompleteSuggestions(
    isOpen ? query : ''
  );

  const handlePickSuggestion = useCallback(
    async (suggestion: google.maps.places.AutocompleteSuggestion) => {
      if (!placesLib || !suggestion.placePrediction) return;
      try {
        const place = suggestion.placePrediction.toPlace();
        await place.fetchFields({
          fields: ['displayName', 'formattedAddress', 'location', 'viewport'],
        });
        const formatted =
          place.formattedAddress ||
          place.displayName ||
          suggestion.placePrediction.text.text;
        setQuery(formatted);
        setIsOpen(false);
        resetSession();
        onSelectText(formatted);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('OVER_QUERY_LIMIT') ||
          msg.includes('429')
        ) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        const fallbackText = suggestion.placePrediction.text.text;
        setQuery(fallbackText);
        setIsOpen(false);
        resetSession();
        onSelectText(fallbackText);
      }
    },
    [placesLib, onSelectText, resetSession]
  );

  return (
    <div className="relative">
      <label
        htmlFor={id}
        className="block text-xs font-semibold uppercase tracking-[0.06em] text-[#56423B] mb-1.5"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setIsOpen(false), 180);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              setIsOpen(false);
              onSelectText(query);
            }
          }}
          placeholder={placeholder}
          className="w-full pl-3.5 pr-9 py-2.5 rounded-xl bg-white/90 border border-[#E3DACB] text-sm text-[#1F1A17] placeholder:text-[#89726A] focus:outline-none focus:border-[#C86337] focus:ring-2 focus:ring-[#C86337]/20"
        />
        {isLoading ? (
          <Loader2
            className="w-4 h-4 text-[#C86337] animate-spin absolute right-3 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
        ) : (
          <MapPin
            className="w-4 h-4 text-[#A64B23] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
        )}
      </div>

      {isOpen && suggestions.length > 0 ? (
        <ul className="absolute left-0 right-0 mt-1.5 z-30 rounded-2xl bg-[#FCFAF6]/95 backdrop-blur-xl border border-[#E3DACB] shadow-xl overflow-hidden max-h-56 overflow-y-auto">
          {suggestions.map((suggestion, idx) => {
            const labelText = suggestion.placePrediction?.text.text ?? '';
            return (
              <li key={`${labelText}-${idx}`}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    void handlePickSuggestion(suggestion);
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-sm text-[#1F1A17] hover:bg-[#EDE5D8]/70 transition-colors border-b last:border-b-0 border-[#E3DACB]/60 flex items-start gap-2"
                >
                  <MapPin
                    className="w-3.5 h-3.5 text-[#C86337] shrink-0 mt-1"
                    aria-hidden="true"
                  />
                  <span>{labelText}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function LiveRouteLayer({
  originQuery,
  destinationQuery,
  onRouteComputed,
  onRouteError,
  onLoadingChange,
}: {
  originQuery: string;
  destinationQuery: string;
  onRouteComputed: (summary: ComputedRouteSummary) => void;
  onRouteError: (msg: string | null) => void;
  onLoadingChange: (loading: boolean) => void;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const [markers, setMarkers] = useState<{
    start: { lat: number; lng: number } | null;
    end: { lat: number; lng: number } | null;
  }>({ start: null, end: null });

  useEffect(() => {
    if (!routesLib || !map || !originQuery.trim() || !destinationQuery.trim()) {
      return;
    }

    let cancelled = false;
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];
    onRouteError(null);
    onLoadingChange(true);

    const request = {
      origin: originQuery,
      destination: destinationQuery,
      travelMode: 'DRIVING',
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport', 'legs'],
    };

    (routesLib.Route as unknown as {
      computeRoutes: (req: typeof request) => Promise<{
        routes?: Array<{
          distanceMeters?: number;
          durationMillis?: number;
          viewport?: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral;
          legs?: Array<{
            startLocation?: { lat: () => number; lng: () => number };
            endLocation?: { lat: () => number; lng: () => number };
          }>;
          createPolylines: () => google.maps.Polyline[];
        }>;
      }>;
    })
      .computeRoutes(request)
      .then((res) => {
        if (cancelled) return;
        onLoadingChange(false);

        const primaryRoute = res?.routes?.[0];
        if (!primaryRoute) {
          onRouteError('No driving route found between these two locations.');
          return;
        }

        const newPolylines = primaryRoute.createPolylines();
        newPolylines.forEach((polyline) => {
          polyline.setOptions({
            strokeColor: '#B85C38',
            strokeOpacity: 0.92,
            strokeWeight: 6,
          });
          polyline.setMap(map);
        });
        polylinesRef.current = newPolylines;

        if (primaryRoute.viewport) {
          map.fitBounds(primaryRoute.viewport);
        }

        const leg = primaryRoute.legs?.[0];
        const startLoc = leg?.startLocation;
        const endLoc = leg?.endLocation;
        const startLatLng = startLoc
          ? { lat: startLoc.lat(), lng: startLoc.lng() }
          : null;
        const endLatLng = endLoc ? { lat: endLoc.lat(), lng: endLoc.lng() } : null;

        setMarkers({ start: startLatLng, end: endLatLng });
        onRouteComputed({
          distanceMeters: primaryRoute.distanceMeters ?? 0,
          durationMillis: primaryRoute.durationMillis ?? 0,
          startLatLng,
          endLatLng,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        onLoadingChange(false);
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('OVER_QUERY_LIMIT') ||
          msg.includes('429')
        ) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        onRouteError(
          'Unable to compute live route right now. Try selecting a Tamil Nadu landmark or corridor.'
        );
      });

    return () => {
      cancelled = true;
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [routesLib, map, originQuery, destinationQuery, onRouteComputed, onRouteError, onLoadingChange]);

  return (
    <>
      {markers.start ? (
        <AdvancedMarker position={markers.start} title="Origin Pickup">
          <div className="px-2.5 py-1 rounded-full bg-[#1F1A17] text-[#FFFDF9] border border-[#E4DBCF] shadow-lg text-[11px] font-mono font-semibold flex items-center gap-1.5">
            <span>Pickup</span>
          </div>
        </AdvancedMarker>
      ) : null}

      {markers.end ? (
        <AdvancedMarker position={markers.end} title="Drop Destination">
          <div className="px-2.5 py-1 rounded-full bg-[#B85C38] text-white border border-white/80 shadow-lg text-[11px] font-mono font-semibold flex items-center gap-1.5">
            <span>Drop</span>
          </div>
        </AdvancedMarker>
      ) : null}
    </>
  );
}

export function GoogleRouteMap({
  apiKey,
  originText,
  destinationText,
  onSyncRouteToEstimator,
}: GoogleRouteMapProps) {
  const [originQuery, setOriginQuery] = useState(
    `${originText || 'Keelapatti Street'}, Srivilliputtur, Tamil Nadu, India`
  );
  const [destQuery, setDestQuery] = useState(
    `${destinationText || 'Madurai International Airport'}, Tamil Nadu, India`
  );
  const [routeSummary, setRouteSummary] = useState<ComputedRouteSummary | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const handleCorridorQuickPick = (route: RouteCorridor) => {
    setOriginQuery('Srivilliputtur, Tamil Nadu, India');
    setDestQuery(`${route.destination}, Tamil Nadu, India`);
  };

  const liveKm = routeSummary
    ? Math.max(10, Math.round(routeSummary.distanceMeters / 1000))
    : null;

  return (
    <section id="map-section" className="py-12 lg:py-16 border-b border-[#E3DACB]">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#8F4529] mb-2">
              Live Google Maps Route Atlas
            </p>
            <h2 className="font-serif text-[30px] leading-[36px] sm:text-[40px] sm:leading-[46px] font-semibold tracking-[-0.015em] text-[#1F1A17] [text-wrap:balance]">
              Trace highway routes from Srivilliputtur across India
            </h2>
            <p className="text-[15px] leading-[24px] text-[#3D342E] mt-2">
              Search any pickup point and destination using live Google Maps routing, then apply the
              distance straight into your Trip Planner &amp; WhatsApp enquiry.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Glass Control Panel */}
          <div className="lg:col-span-4 glass-ivory rounded-3xl p-6 flex flex-col justify-between gap-5">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.08em] text-[#8F4529]">
                <Compass className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Interactive Route Finder</span>
              </div>

              {apiKey ? (
                <APIProvider apiKey={apiKey} language="en" region="IN">
                  <div className="space-y-3.5">
                    <PlaceSearchInput
                      id="gmp-origin-input"
                      label="Origin Pickup"
                      value={originQuery}
                      placeholder="Search Srivilliputtur or nearby pickup..."
                      onSelectText={(val) => setOriginQuery(val)}
                    />
                    <PlaceSearchInput
                      id="gmp-dest-input"
                      label="Destination"
                      value={destQuery}
                      placeholder="Search airport, temple, or city..."
                      onSelectText={(val) => setDestQuery(val)}
                    />
                  </div>
                </APIProvider>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="fallback-origin"
                      className="block text-xs font-semibold uppercase tracking-[0.06em] text-[#56423B] mb-1"
                    >
                      Origin Pickup
                    </label>
                    <input
                      id="fallback-origin"
                      type="text"
                      value={originQuery}
                      onChange={(e) => setOriginQuery(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E3DACB] text-sm"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="fallback-dest"
                      className="block text-xs font-semibold uppercase tracking-[0.06em] text-[#56423B] mb-1"
                    >
                      Destination
                    </label>
                    <input
                      id="fallback-dest"
                      type="text"
                      value={destQuery}
                      onChange={(e) => setDestQuery(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E3DACB] text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Quick Corridor Pills */}
              <div className="pt-1">
                <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-[#56423B] mb-2">
                  Quick Tamil Nadu Corridors
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {ROUTE_CORRIDORS.map((corridor) => (
                    <button
                      key={corridor.id}
                      type="button"
                      onClick={() => handleCorridorQuickPick(corridor)}
                      className="px-3 py-1.5 rounded-full bg-white/80 hover:bg-[#EDE5D8] border border-[#E3DACB] text-xs font-semibold text-[#1F1A17] transition-colors whitespace-nowrap"
                    >
                      {corridor.shortLabel}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Route Telemetry Summary */}
            <div className="rounded-2xl bg-[#1F1A17] text-[#F6F1E8] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#F3E0D6]">
                  Live Route Metrics
                </span>
                {routeLoading ? (
                  <Loader2
                    className="w-4 h-4 text-[#F3E0D6] animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Navigation className="w-4 h-4 text-[#F3E0D6]" aria-hidden="true" />
                )}
              </div>

              {routeError ? (
                <p className="text-xs text-[#FFB598] leading-relaxed">{routeError}</p>
              ) : routeSummary ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block text-[11px] text-[#E4DBCF]/75">Road Distance</span>
                    <span className="font-mono text-2xl font-semibold text-[#FFFDF9] tabular-nums">
                      {liveKm} km
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] text-[#E4DBCF]/75">Est. Drive</span>
                    <span className="font-mono text-lg font-semibold text-[#F3E0D6] tabular-nums">
                      {formatDurationMillis(routeSummary.durationMillis)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#E4DBCF]/80">
                  {apiKey
                    ? 'Calculating live road path...'
                    : 'Google Maps API key will activate live route telemetry once loaded.'}
                </p>
              )}

              <button
                type="button"
                disabled={!liveKm}
                onClick={() => {
                  if (!liveKm) return;
                  onSyncRouteToEstimator({
                    origin: originQuery,
                    destination: destQuery,
                    distanceKm: liveKm,
                  });
                }}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-[#B85C38] hover:bg-[#9A4A2C] disabled:opacity-45 text-white text-sm font-semibold transition-colors"
              >
                <span>Apply {liveKm ? `${liveKm} km` : 'Route'} to Trip Planner</span>
                <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Right Interactive Google Map Container */}
          <div className="lg:col-span-8 rounded-3xl overflow-hidden border border-[#E3DACB] bg-[#EDE5D8] shadow-[0_14px_40px_rgba(31,26,23,0.10)] min-h-[440px] lg:min-h-[520px] relative">
            {apiKey ? (
              <APIProvider apiKey={apiKey} language="en" region="IN">
                <div className="w-full h-[440px] lg:h-[520px]">
                  <GoogleMapComponent
                    mapId="DEMO_MAP_ID"
                    defaultCenter={DEFAULT_MAP_CENTER}
                    defaultZoom={8}
                    gestureHandling="greedy"
                    disableDefaultUI={false}
                    streetViewControl={false}
                    mapTypeControl={false}
                    internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                    className="w-full h-full"
                  >
                    <LiveRouteLayer
                      originQuery={originQuery}
                      destinationQuery={destQuery}
                      onRouteComputed={setRouteSummary}
                      onRouteError={setRouteError}
                      onLoadingChange={setRouteLoading}
                    />
                  </GoogleMapComponent>
                </div>
              </APIProvider>
            ) : (
              <div className="w-full h-[440px] lg:h-[520px] flex flex-col items-center justify-center p-8 text-center space-y-3 bg-gradient-to-br from-[#F6F1E8] to-[#EDE5D8]">
                <RouteIcon className="w-10 h-10 text-[#C86337]" aria-hidden="true" />
                <h3 className="font-serif text-2xl font-semibold text-[#1F1A17]">
                  Google Maps Route View Ready
                </h3>
                <p className="text-sm text-[#38312B] max-w-md">
                  Google Maps API key was not detected in the current runtime environment. Restart
                  the preview server or configure <code className="font-mono">VITE_GOOGLE_MAPS_API_KEY</code>{' '}
                  to render interactive highway polylines.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
