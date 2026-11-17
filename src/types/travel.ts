export type PortalView =
  | 'overview'
  | 'map'
  | 'fleet'
  | 'routes'
  | 'estimator'
  | 'dispatch';

export type FleetCategory = 'all' | 'sedan' | 'suv' | 'hatchback';

export type RouteCategory = 'all' | 'airport' | 'temple' | 'city';

export type TripType = 'round-trip' | 'one-way';

export type DispatchStatus = 'Quote Saved' | 'Sent via WhatsApp' | 'Confirmed' | 'Cancelled';

export interface Vehicle {
  id: string;
  name: string;
  modelSubtitle: string;
  category: Exclude<FleetCategory, 'all'>;
  registrationCode: string;
  seats: number;
  luggageCount: number;
  acLabel: string;
  fuelType: string;
  ratePerKmRoundTrip: number;
  ratePerKmOneWay: number;
  driverBattaPerDay: number;
  minimumKmPerDay: number;
  imagePath: string;
  fallbackImagePath: string;
  bestFor: string;
  highlights: string[];
}

export interface RouteCorridor {
  id: string;
  shortLabel: string;
  destination: string;
  category: Exclude<RouteCategory, 'all'>;
  distanceKm: number;
  durationLabel: string;
  oneWayAvailable: boolean;
  highwayVia: string;
  suggestedVehicleId: string;
  summary: string;
  stops: string[];
}

export interface ServiceGuarantee {
  id: string;
  title: string;
  description: string;
  iconKey: 'outstation' | 'airport' | 'temple' | 'local';
}

export interface DeskFaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface FareBreakdown {
  tripType: TripType;
  oneWayDistanceKm: number;
  days: number;
  billableKm: number;
  minimumKmApplied: boolean;
  ratePerKm: number;
  distanceCharge: number;
  driverBattaTotal: number;
  estimatedTotal: number;
}

export interface TripDispatch {
  id: string;
  createdAt: string;
  travelerName: string;
  phone: string;
  pickupLocation: string;
  dropDestination: string;
  tripType: TripType;
  pickupDate: string;
  pickupTime: string;
  days: number;
  distanceKm: number;
  vehicleId: string;
  vehicleName: string;
  vehicleReg: string;
  estimatedFare: number;
  notes: string;
  status: DispatchStatus;
}

export interface InquiryDraft {
  travelerName: string;
  phone: string;
  pickupLocation: string;
  dropDestination: string;
  tripType: TripType;
  pickupDate: string;
  pickupTime: string;
  days: number;
  distanceKm: number;
  vehicleId: string;
  notes: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  modelLabel?: string;
}
