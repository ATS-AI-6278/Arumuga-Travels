import type {
  DeskFaqItem,
  RouteCorridor,
  ServiceGuarantee,
  TripDispatch,
  Vehicle,
} from '../types/travel';

export const DESK_BRAND_NAME = 'Sri Arumuga Travels';
export const DESK_ADDRESS =
  'Keelapatti Street, Mariamman Kovil Street, Srivilliputtur (Srivilliputhur), Tamil Nadu 626125 · GJ7P+3QH';
export const DESK_GOOGLE_MAPS_URL = 'https://maps.app.goo.gl/Mi3kFoX4Ym1JhxVs5';
export const DESK_PHONE_DISPLAY = '+91 98942 20028';
export const DESK_PHONE_ALT_DISPLAY = '+91 86676 69560';
export const DESK_PHONE_HREF = 'tel:+919894220028';
export const DESK_PHONE_ALT_HREF = 'tel:+918667669560';
export const DESK_WHATSAPP_NUMBER = '919894220028';
export const DESK_EMAIL = 'sriviarumugatravels@gmail.com';
export const DESK_SITE_URL = 'https://sriarumugatravels.vercel.app/';

export const HERO_IMAGE_PATH = 'https://sriarumugatravels.vercel.app/fleet-banner.webp';
export const HERO_FALLBACK_IMAGE_PATH =
  '/src/assets/images/hero_srivilliputtur_highway_1794918447225.jpg';

export const PICKUP_PRESETS: string[] = [
  'Keelapatti Street / Mariamman Kovil Street, Srivilliputtur',
  'Andal Temple North Car Street, Srivilliputtur',
  'Srivilliputtur Bus Stand',
  'Srivilliputtur Railway Station',
  'Madurai Airport (IXM)',
  'Rajapalayam',
];

export const FLEET_VEHICLES: Vehicle[] = [
  {
    id: 'etios-gd',
    name: 'Toyota Etios GD',
    modelSubtitle: 'Dedicated 4-Seater Outstation Diesel Sedan',
    category: 'sedan',
    registrationCode: 'TN 84 F 6278',
    seats: 4,
    luggageCount: 3,
    acLabel: 'Clean AC Interior',
    fuelType: 'Diesel',
    ratePerKmRoundTrip: 14,
    ratePerKmOneWay: 17,
    driverBattaPerDay: 350,
    minimumKmPerDay: 250,
    imagePath: 'https://sriarumugatravels.vercel.app/toyota-etios-tn84f6278.webp',
    fallbackImagePath: '/src/assets/images/fleet_swift_dzire_1794918447281.jpg',
    bestFor: 'Outstation rides, Madurai airport transfers & temple visits',
    highlights: [
      'Our dedicated Toyota Etios GD sedan (TN 84 F 6278)',
      'Clean AC interior, generous boot space & smooth highway ride',
      'Fares confirmed upfront by Call (+91 98942 20028) or WhatsApp',
    ],
  },
  {
    id: 'innova-mpv',
    name: 'Toyota Innova',
    modelSubtitle: '7-Seater Diesel Family & Group MPV',
    category: 'suv',
    registrationCode: '7-Seat Diesel',
    seats: 7,
    luggageCount: 5,
    acLabel: 'Dual-Row Cabin AC',
    fuelType: 'Diesel',
    ratePerKmRoundTrip: 20,
    ratePerKmOneWay: 25,
    driverBattaPerDay: 450,
    minimumKmPerDay: 250,
    imagePath: '/src/assets/images/fleet_innova_crysta_1794918448216.jpg',
    fallbackImagePath: '/src/assets/images/fleet_innova_crysta_1794918448216.jpg',
    bestFor: 'Extended families, wedding travel & long intercity routes',
    highlights: [
      '7-seater diesel cabin matched to family size & luggage needs',
      'Comfortable suspension for Rameswaram, Kanyakumari & hill roads',
      'Fares confirmed upfront by Call or WhatsApp before departure',
    ],
  },
  {
    id: 'hyundai-verna',
    name: 'Hyundai Verna',
    modelSubtitle: '4-Seater Executive Petrol Sedan',
    category: 'sedan',
    registrationCode: '4-Seat Petrol',
    seats: 4,
    luggageCount: 3,
    acLabel: 'Automatic Climate AC',
    fuelType: 'Petrol',
    ratePerKmRoundTrip: 15,
    ratePerKmOneWay: 18,
    driverBattaPerDay: 350,
    minimumKmPerDay: 250,
    imagePath: '/src/assets/images/fleet_swift_dzire_1794918447281.jpg',
    fallbackImagePath: '/src/assets/images/fleet_swift_dzire_1794918447281.jpg',
    bestFor: 'Executive trips, airport pickups & comfortable highway runs',
    highlights: [
      'Refined 4-seater petrol sedan with quiet cabin acoustics',
      'Matched to your passenger count and luggage requirements',
      'Direct coordination with experienced Srivilliputtur driver',
    ],
  },
  {
    id: 'hyundai-i10',
    name: 'Hyundai Grand i10',
    modelSubtitle: '4-Seater Compact Petrol Car',
    category: 'hatchback',
    registrationCode: '4-Seat Petrol',
    seats: 4,
    luggageCount: 2,
    acLabel: 'Cabin AC',
    fuelType: 'Petrol',
    ratePerKmRoundTrip: 13,
    ratePerKmOneWay: 16,
    driverBattaPerDay: 300,
    minimumKmPerDay: 250,
    imagePath: '/src/assets/images/fleet_ertiga_tour_1794918448654.jpg',
    fallbackImagePath: '/src/assets/images/fleet_ertiga_tour_1794918448654.jpg',
    bestFor: 'Local day trips, Rajapalayam hops & small-group rides',
    highlights: [
      'Nimble 4-seater hatchback for town streets and nearby visits',
      'Ideal for Srivilliputtur, Rajapalayam, Courtallam & Madurai hops',
      'Direct phone & WhatsApp fare confirmation before pickup',
    ],
  },
];

export const ROUTE_CORRIDORS: RouteCorridor[] = [
  {
    id: 'madurai-ixm',
    shortLabel: 'Madurai',
    destination: 'Madurai — Temple City & Airport (IXM)',
    category: 'airport',
    distanceKm: 78,
    durationLabel: '1 hr 45 min',
    oneWayAvailable: true,
    highwayVia: 'NH 744 via Thirumangalam',
    suggestedVehicleId: 'etios-gd',
    summary:
      'Meet-and-travel pickups and drops for Madurai Airport (IXM) and railway station, with room for luggage and a clear pickup plan.',
    stops: ['Thirumangalam', 'Madurai Airport (IXM)', 'Meenakshi Amman Temple'],
  },
  {
    id: 'chennai',
    shortLabel: 'Chennai',
    destination: 'Chennai — One-Way & Station Links',
    category: 'city',
    distanceKm: 545,
    durationLabel: '9 hr 30 min',
    oneWayAvailable: true,
    highwayVia: 'NH 44 & NH 38 via Trichy · Villupuram',
    suggestedVehicleId: 'innova-mpv',
    summary:
      'Outstation cab from Srivilliputtur to Chennai homes, railway stations, and Chennai Airport — timed around your schedule.',
    stops: ['Madurai', 'Trichy Bypass', 'Chennai Central / Egmore / Airport'],
  },
  {
    id: 'rameswaram',
    shortLabel: 'Rameswaram',
    destination: 'Rameswaram — Pilgrimage Road',
    category: 'temple',
    distanceKm: 215,
    durationLabel: '4 hr 15 min',
    oneWayAvailable: true,
    highwayVia: 'Virudhunagar · Paramakudi · Pamban Bridge',
    suggestedVehicleId: 'innova-mpv',
    summary:
      'Temple and pilgrimage departures timed for early-morning darshan and coastal island road access, paced comfortably for elders.',
    stops: ['Paramakudi', 'Pamban Bridge', 'Ramanathaswamy Temple & Dhanushkodi'],
  },
  {
    id: 'kanyakumari',
    shortLabel: 'Kanyakumari',
    destination: "Kanyakumari — Land's-End Coast",
    category: 'temple',
    distanceKm: 210,
    durationLabel: '4 hr 00 min',
    oneWayAvailable: true,
    highwayVia: 'NH 44 via Kovilpatti & Tirunelveli',
    suggestedVehicleId: 'etios-gd',
    summary:
      'Direct outstation journey to the southern coast, Suchindram, and Triveni Sangam with flexible family halts.',
    stops: ['Tirunelveli', 'Suchindram', 'Kanyakumari Coast'],
  },
  {
    id: 'courtallam',
    shortLabel: 'Courtallam',
    destination: 'Courtallam — Waterfalls · Tenkasi',
    category: 'city',
    distanceKm: 68,
    durationLabel: '1 hr 30 min',
    oneWayAvailable: true,
    highwayVia: 'Rajapalayam · Sivagiri · Tenkasi',
    suggestedVehicleId: 'hyundai-i10',
    summary:
      'Day trips and family outings to Courtallam waterfalls, Tenkasi Kasi Viswanathar Temple, and nearby foothill spots.',
    stops: ['Rajapalayam', 'Tenkasi', 'Main Falls & Five Falls'],
  },
  {
    id: 'tirunelveli',
    shortLabel: 'Tirunelveli',
    destination: 'Tirunelveli — Southern TN Hub',
    category: 'temple',
    distanceKm: 112,
    durationLabel: '2 hr 15 min',
    oneWayAvailable: true,
    highwayVia: 'Rajapalayam · Sankarankovil · NH 44',
    suggestedVehicleId: 'etios-gd',
    summary:
      'Reliable cab connectivity for Tirunelveli, Nellaiappar Temple, Navathirupathi shrines, and family functions.',
    stops: ['Rajapalayam', 'Sankarankovil', 'Tirunelveli Junction'],
  },
  {
    id: 'coimbatore',
    shortLabel: 'Coimbatore',
    destination: 'Coimbatore — West Tamil Nadu',
    category: 'city',
    distanceKm: 285,
    durationLabel: '5 hr 30 min',
    oneWayAvailable: true,
    highwayVia: 'Madurai · Dindigul · Pollachi',
    suggestedVehicleId: 'hyundai-verna',
    summary:
      'Comfortable sedan and Innova outstation trips to Coimbatore city, hospitals, colleges, and western Tamil Nadu towns.',
    stops: ['Dindigul', 'Palani / Pollachi', 'Coimbatore'],
  },
  {
    id: 'kodaikanal',
    shortLabel: 'Kodaikanal',
    destination: 'Kodaikanal — Hill Weekends',
    category: 'city',
    distanceKm: 195,
    durationLabel: '4 hr 30 min',
    oneWayAvailable: true,
    highwayVia: 'Thirumangalam · Batlagundu Ghat',
    suggestedVehicleId: 'innova-mpv',
    summary:
      'Experienced ghat driving up to Kodaikanal for family hill weekends, retreats, and school visits.',
    stops: ['Usilampatti / Batlagundu', 'Silver Cascade', 'Kodaikanal Lake'],
  },
  {
    id: 'bengaluru',
    shortLabel: 'Bengaluru',
    destination: 'Bengaluru — Work & Family Travel',
    category: 'city',
    distanceKm: 510,
    durationLabel: '8 hr 30 min',
    oneWayAvailable: true,
    highwayVia: 'NH 44 via Salem & Hosur',
    suggestedVehicleId: 'innova-mpv',
    summary:
      'Interstate outstation drives from Srivilliputtur to Bengaluru and anywhere across India by road.',
    stops: ['Dindigul', 'Salem', 'Electronic City / Bengaluru'],
  },
];

export const SERVICE_GUARANTEES: ServiceGuarantee[] = [
  {
    id: 'outstation-cab',
    title: 'Outstation Journeys',
    description:
      'Tamil Nadu outstation cab from Srivilliputtur to cities, towns, and family homes across Tamil Nadu and India — timed around your day, not a timetable.',
    iconKey: 'outstation',
  },
  {
    id: 'airport-taxi',
    title: 'Airport & Station Pickups',
    description:
      'Meet-and-travel for Madurai Airport (IXM) and nearby airports or railway stations, with room for luggage and a clear pickup plan.',
    iconKey: 'airport',
  },
  {
    id: 'temple-pilgrimage',
    title: 'Temple & Pilgrimage Trips',
    description:
      'Andal Temple visits, Rameswaram, Navathirupathi, and longer pilgrimage routes — paced calmly and thoughtfully for elders and families.',
    iconKey: 'temple',
  },
  {
    id: 'local-taxi',
    title: 'Local & Day Trips',
    description:
      'Short hops around Srivilliputtur, Rajapalayam, Courtallam, and Madurai when you need a dependable car and courteous driver for the day.',
    iconKey: 'local',
  },
];

export const DESK_FAQS: DeskFaqItem[] = [
  {
    id: 'faq-book',
    question: 'How do I book a taxi or outstation cab?',
    answer:
      'Call or WhatsApp +91 98942 20028 or +91 86676 69560, use the WhatsApp enquiry card here, or email sriviarumugatravels@gmail.com. There is no app cart; you speak directly with the travel desk.',
  },
  {
    id: 'faq-base',
    question: 'Where is Sri Arumuga Travels based?',
    answer:
      'We are based at one desk in Srivilliputtur (Keelapatti Street, Mariamman Kovil Street, Srivilliputtur 626125), Tamil Nadu — not a call-center branch. Journeys start here and cover Tamil Nadu and India by road.',
  },
  {
    id: 'faq-vehicles',
    question: 'What kind of vehicles do you offer?',
    answer:
      'Our fleet lineup includes Toyota Etios GD (TN 84 F 6278, 4 seat diesel), Toyota Innova (7 seat diesel), Hyundai Verna (4 seat petrol), and Hyundai Grand i10 (4 seat petrol). We do not run a tempo or a bus.',
  },
  {
    id: 'faq-fares',
    question: 'How are outstation fares confirmed?',
    answer:
      'We do not publish rigid online rate cards. Fares are confirmed clearly upfront by phone call or WhatsApp based on your pickup point, destination, dates, and passenger/luggage requirements.',
  },
];

export const INITIAL_SAMPLE_DISPATCHES: TripDispatch[] = [
  {
    id: 'SAT-2408',
    createdAt: '2026-11-16T18:40:00.000Z',
    travelerName: 'Meenakshi Sundaram',
    phone: '9842154320',
    pickupLocation: 'Keelapatti Street, Srivilliputtur',
    dropDestination: 'Rameswaram — Pilgrimage Road',
    tripType: 'round-trip',
    pickupDate: '2026-11-22',
    pickupTime: '04:30',
    days: 2,
    distanceKm: 215,
    vehicleId: 'innova-mpv',
    vehicleName: 'Toyota Innova',
    vehicleReg: '7-Seat Diesel',
    estimatedFare: 10900,
    notes: 'Family pilgrimage with 2 elders; confirm darshan halt timing on call.',
    status: 'Confirmed',
  },
  {
    id: 'SAT-2409',
    createdAt: '2026-11-17T07:15:00.000Z',
    travelerName: 'Aravindh Krishnan',
    phone: '9442188912',
    pickupLocation: 'Srivilliputtur Railway Station',
    dropDestination: 'Madurai — Temple City & Airport (IXM)',
    tripType: 'one-way',
    pickupDate: '2026-11-19',
    pickupTime: '06:15',
    days: 1,
    distanceKm: 78,
    vehicleId: 'etios-gd',
    vehicleName: 'Toyota Etios GD',
    vehicleReg: 'TN 84 F 6278',
    estimatedFare: 1676,
    notes: 'Morning Madurai Airport (IXM) drop with 2 suitcases.',
    status: 'Sent via WhatsApp',
  },
];
