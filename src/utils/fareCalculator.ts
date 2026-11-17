import { DESK_BRAND_NAME, DESK_WHATSAPP_NUMBER } from '../data/heritageData';
import type { FareBreakdown, TripDispatch, TripType, Vehicle } from '../types/travel';

export function calculateOutstationFare(
  vehicle: Vehicle,
  oneWayDistanceKm: number,
  tripType: TripType,
  days: number
): FareBreakdown {
  const safeDistance = Math.max(20, Math.round(oneWayDistanceKm || 0));
  const safeDays = tripType === 'one-way' ? 1 : Math.max(1, Math.round(days || 1));

  if (tripType === 'one-way') {
    const billableKm = safeDistance;
    const ratePerKm = vehicle.ratePerKmOneWay;
    const distanceCharge = billableKm * ratePerKm;
    const driverBattaTotal = vehicle.driverBattaPerDay;
    return {
      tripType,
      oneWayDistanceKm: safeDistance,
      days: 1,
      billableKm,
      minimumKmApplied: false,
      ratePerKm,
      distanceCharge,
      driverBattaTotal,
      estimatedTotal: distanceCharge + driverBattaTotal,
    };
  }

  const actualRoundTripKm = safeDistance * 2;
  const minimumFloorKm = safeDays * vehicle.minimumKmPerDay;
  const minimumKmApplied = minimumFloorKm > actualRoundTripKm;
  const billableKm = Math.max(actualRoundTripKm, minimumFloorKm);
  const ratePerKm = vehicle.ratePerKmRoundTrip;
  const distanceCharge = billableKm * ratePerKm;
  const driverBattaTotal = safeDays * vehicle.driverBattaPerDay;

  return {
    tripType,
    oneWayDistanceKm: safeDistance,
    days: safeDays,
    billableKm,
    minimumKmApplied,
    ratePerKm,
    distanceCharge,
    driverBattaTotal,
    estimatedTotal: distanceCharge + driverBattaTotal,
  };
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function normalizeIndianPhone(raw: string): string {
  return raw.replace(/\D/g, '').slice(-10);
}

export function isValidIndianPhone(raw: string): boolean {
  const digits = normalizeIndianPhone(raw);
  return /^[6-9]\d{9}$/.test(digits);
}

export function generateWaybillId(): string {
  const randomDigits = Math.floor(2500 + Math.random() * 7400);
  return `SAT-${randomDigits}`;
}

export function buildWhatsAppDispatchUrl(dispatch: {
  id?: string;
  travelerName: string;
  phone: string;
  pickupLocation: string;
  dropDestination: string;
  tripType: TripType;
  pickupDate: string;
  pickupTime: string;
  days: number;
  distanceKm: number;
  vehicleName: string;
  vehicleReg: string;
  estimatedFare: number;
  notes?: string;
}): string {
  const lines = [
    `*${DESK_BRAND_NAME} — Outstation Cab Enquiry*`,
    dispatch.id ? `Enquiry Ref: ${dispatch.id}` : null,
    `Traveler: ${dispatch.travelerName || 'Guest'} (${dispatch.phone || 'Call back'})`,
    `Route: ${dispatch.pickupLocation} -> ${dispatch.dropDestination}`,
    `Trip Mode: ${dispatch.tripType === 'round-trip' ? `Round Trip (${dispatch.days} day${dispatch.days > 1 ? 's' : ''})` : 'One-Way Drop'} (~${dispatch.distanceKm} km one-way)`,
    `Pickup: ${dispatch.pickupDate} at ${dispatch.pickupTime}`,
    `Vehicle: ${dispatch.vehicleName} (${dispatch.vehicleReg})`,
    `Please confirm exact upfront fare on call/WhatsApp.`,
    dispatch.notes ? `Notes: ${dispatch.notes}` : null,
  ].filter(Boolean);

  const encoded = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${DESK_WHATSAPP_NUMBER}?text=${encoded}`;
}

export function formatDispatchSlipText(dispatch: TripDispatch): string {
  return [
    `${DESK_BRAND_NAME} | Waybill ${dispatch.id}`,
    `Status: ${dispatch.status}`,
    `Traveler: ${dispatch.travelerName} (+91 ${normalizeIndianPhone(dispatch.phone)})`,
    `Pickup: ${dispatch.pickupLocation}`,
    `Drop: ${dispatch.dropDestination}`,
    `Schedule: ${dispatch.pickupDate} · ${dispatch.pickupTime}`,
    `Mode: ${dispatch.tripType === 'round-trip' ? `Round Trip (${dispatch.days} day/s)` : 'One-Way Drop'} · ${dispatch.distanceKm} km`,
    `Assigned Class: ${dispatch.vehicleName} (${dispatch.vehicleReg})`,
    `Estimated Fare: ${formatINR(dispatch.estimatedFare)} + actual tolls/parking`,
    dispatch.notes ? `Notes: ${dispatch.notes}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
