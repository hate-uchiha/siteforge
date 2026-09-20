// Niche presets. Each preset is the starting copy, colours, and structure for one trade.
// Anything here can be overridden per client in clients/<slug>.json.

const genericFaq = (thing) => [
  {
    q: `How soon can you start?`,
    a: `Most ${thing} are booked within 24 to 48 hours. Urgent calls get same day priority whenever the schedule allows.`,
  },
  {
    q: `Do you give a fixed price before starting?`,
    a: `Yes. You get a written quote before any work begins. The price does not change unless you approve extra work in writing first.`,
  },
  {
    q: `Are you insured?`,
    a: `Fully insured and happy to send proof of cover on request. Every job is done by our own team, never subcontracted out without telling you.`,
  },
  {
    q: `Which areas do you cover?`,
    a: `Every area listed on this page, plus most places nearby. If you are just outside the list, ask anyway, we often travel a little further.`,
  },
  {
    q: `What payment methods do you take?`,
    a: `Card, bank transfer, and cash. No deposit is taken for standard jobs, and you get a proper invoice for every visit.`,
  },
];

const p = (o) => o;

export const presets = {
  plumber: p({
    label: 'Plumbing and heating',
    schemaType: 'Plumber',
    brand: { primary: '#0b4f9e', accent: '#ff7a18', ink: '#0c1522' },
    emergency: true,
    hero: {
      eyebrow: 'Local, licensed, same day',
      headline: 'Plumbing leaks fixed properly, not patched',
      sub: 'Burst pipes, blocked drains, boiler breakdowns and full bathroom installs. Fixed prices, tidy work, and a written guarantee on every job.',
    },
    ctas: { primary: 'Book a plumber', secondary: 'Call now' },
    trust: ['Licensed and insured', 'Fixed price quotes', '24/7 emergency call out', '12 month workmanship guarantee'],
    stats: [
      { value: '18 yrs', label: 'On the tools' },
      { value: '3,400+', label: 'Jobs completed' },
      { value: '60 min', label: 'Average emergency response' },
      { value: '4.9', label: 'Average customer rating' },
    ],
    services: [
      { name: 'Emergency leak repair', description: 'Burst pipes and active leaks stopped fast, with the cause found and fixed not just the symptom.', icon: 'droplet' },
      { name: 'Blocked drains', description: 'CCTV survey, high pressure jetting, and root removal for drains that keep coming back.', icon: 'pipe' },
      { name: 'Boiler repair and service', description: 'Diagnostics, parts, and annual servicing on gas and electric systems.', icon: 'flame' },
      { name: 'Bathroom installation', description: 'Full strip out and refit, including tiling, waste, and second fix plumbing.', icon: 'shower' },
      { name: 'Tap and toilet repairs', description: 'Dripping taps, running cisterns, and weak pressure sorted in one visit.', icon: 'wrench' },
      { name: 'Water heater replacement', description: 'Supply and fit of cylinders, unvented units, and instant heaters.', icon: 'bolt' },
    ],
    galleryLabels: ['Bathroom refit', 'Emergency leak', 'Boiler service', 'Drain jetting', 'Kitchen plumbing', 'Radiator install'],
    faq: genericFaq('plumbing jobs', 'your area'),
  }),

  electrician: p({
    label: 'Electrical',
    schemaType: 'Electrician',
    brand: { primary: '#12161c', accent: '#ffc400', ink: '#0b0e13' },
    emergency: true,
    hero: {
      eyebrow: 'Certified electrical contractor',
      headline: 'Safe electrics, certified and signed off',
      sub: 'Rewires, consumer units, EV chargers, and fault finding. Every job tested, certified, and left tidy with the paperwork to prove it.',
    },
    ctas: { primary: 'Get a quote', secondary: 'Call an electrician' },
    trust: ['Part P certified', 'Full test certificates issued', 'Insured to £5m', 'No call out fee'],
    stats: [
      { value: '15 yrs', label: 'Qualified' },
      { value: '2,100+', label: 'Certificates issued' },
      { value: '24 hrs', label: 'Quote turnaround' },
      { value: '100%', label: 'Pass rate on inspections' },
    ],
    services: [
      { name: 'Fuse board upgrades', description: 'Modern consumer units with RCD protection, labelled and certified.', icon: 'bolt' },
      { name: 'Full and partial rewires', description: 'Whole house rewires with minimal disruption and a full test certificate.', icon: 'cable' },
      { name: 'EV charger installation', description: 'Approved installer for home and workplace chargers, including load checks.', icon: 'ev' },
      { name: 'Fault finding', description: 'Tripping circuits, dead sockets, and flickering lights traced properly.', icon: 'search' },
      { name: 'Lighting design and install', description: 'Spotlights, garden lighting, and smart lighting wired and configured.', icon: 'bulb' },
      { name: 'Landlord safety certificates', description: 'EICR testing and remedial work with fast turnaround for letting agents.', icon: 'clipboard' },
    ],
    galleryLabels: ['Consumer unit', 'EV charger', 'Kitchen rewire', 'Garden lighting', 'EICR testing', 'Loft conversion'],
    faq: genericFaq('electrical work', 'your area'),
  }),

  hvac: p({
    label: 'Heating, cooling and ventilation',
    schemaType: 'HVACBusiness',
    brand: { primary: '#0a6c74', accent: '#ff8a3d', ink: '#0a1216' },
    emergency: true,
    hero: {
      eyebrow: 'Heating, cooling, air quality',
      headline: 'Keep the house comfortable all year',
      sub: 'Air conditioning installs, furnace and heat pump servicing, and duct cleaning. Maintenance plans that stop breakdowns before they happen.',
    },
    ctas: { primary: 'Book a service', secondary: 'Call the team' },
    trust: ['Factory trained engineers', 'Same day repairs', 'Filter and tune up plans', 'Workmanship guarantee'],
    stats: [
      { value: '20 yrs', label: 'Experience' },
      { value: '5,000+', label: 'Systems serviced' },
      { value: '48 hrs', label: 'Typical install time' },
      { value: '4.9', label: 'Customer rating' },
    ],
    services: [
      { name: 'Air conditioning installation', description: 'Split and multi split systems sized to the room, not guessed.', icon: 'snow' },
      { name: 'Furnace and boiler repair', description: 'No heat calls answered quickly with common parts stocked on the van.', icon: 'flame' },
      { name: 'Heat pump installs', description: 'Efficient low carbon heating with correct sizing and commissioning.', icon: 'leaf' },
      { name: 'Duct cleaning', description: 'Dust, allergens, and debris removed from ductwork and vents.', icon: 'wind' },
      { name: 'Annual maintenance plans', description: 'Two visits a year, priority booking, and discount on any repairs.', icon: 'calendar' },
      { name: 'Air quality and filtration', description: 'Humidity control, purifiers, and filtration upgrades for allergy sufferers.', icon: 'shield' },
    ],
    galleryLabels: ['Split system', 'Heat pump', 'Duct clean', 'Furnace service', 'Rooftop unit', 'Vent install'],
    faq: genericFaq('heating and cooling work', 'your area'),
  }),

  landscaper: p({
    label: 'Landscaping and garden care',
    schemaType: 'LandscapingBusiness',
    brand: { primary: '#1f6b3a', accent: '#f2b134', ink: '#0d1710' },
    emergency: false,
    hero: {
      eyebrow: 'Design, build, maintain',
      headline: 'Gardens built to be used, not just looked at',
      sub: 'Patios, decking, planting, and full garden makeovers. Plus a maintenance round so it still looks sharp next summer.',
    },
    ctas: { primary: 'Get a garden quote', secondary: 'See our work' },
    trust: ['Free design visit', 'Fixed price project quote', 'Waste removed and recycled', 'Fully insured team'],
    stats: [
      { value: '300+', label: 'Gardens transformed' },
      { value: '10 yrs', label: 'Building gardens' },
      { value: '2 wks', label: 'Typical project' },
      { value: '5.0', label: 'Average review' },
    ],
    services: [
      { name: 'Garden design', description: 'Measured plans with planting scheme and materials list before a spade goes in.', icon: 'pencil' },
      { name: 'Patios and paving', description: 'Porcelain, sandstone, and block paving laid on proper sub base, so it does not sink.', icon: 'grid' },
      { name: 'Decking', description: 'Composite and hardwood decks, including steps, balustrades, and lighting.', icon: 'home' },
      { name: 'Lawn care and turfing', description: 'Levelling, seeding, turf, and seasonal treatments for a lawn that thickens up.', icon: 'grass' },
      { name: 'Hedges and tree work', description: 'Cutting, shaping, and reductions with all arisings taken away.', icon: 'tree' },
      { name: 'Fencing and gates', description: 'Close board, panel, and bespoke fencing set in concrete posts.', icon: 'fence' },
    ],
    galleryLabels: ['Patio build', 'Deck and steps', 'Full makeover', 'Turf laid', 'Hedge shaping', 'Raised beds'],
    faq: genericFaq('landscaping projects', 'your area'),
  }),

  cleaning: p({
    label: 'Cleaning services',
    schemaType: 'HousePainter',
    brand: { primary: '#2f6fed', accent: '#00c2a8', ink: '#0c1220' },
    emergency: false,
    hero: {
      eyebrow: 'Homes, offices, end of tenancy',
      headline: 'A clean you can actually see the difference on',
      sub: 'Regular domestic cleans, deep cleans, and end of tenancy work. Same cleaner every visit, checked against a written checklist.',
    },
    ctas: { primary: 'Get a cleaning quote', secondary: 'Call us' },
    trust: ['Vetted and insured cleaners', 'Same cleaner each visit', 'Bring our own supplies', 'Satisfaction re-clean guarantee'],
    stats: [
      { value: '400+', label: 'Regular clients' },
      { value: '9 yrs', label: 'Cleaning homes' },
      { value: '100%', label: 'Checklist inspected' },
      { value: '4.9', label: 'Average rating' },
    ],
    services: [
      { name: 'Regular home cleaning', description: 'Weekly or fortnightly visits with the same cleaner and a set checklist.', icon: 'sparkle' },
      { name: 'Deep clean', description: 'Inside cupboards, oven, skirting, and behind appliances. The jobs a normal clean skips.', icon: 'brush' },
      { name: 'End of tenancy', description: 'Deposit standard cleaning with a receipt your letting agent will accept.', icon: 'key' },
      { name: 'Office and commercial', description: 'Out of hours cleaning for offices, clinics, and small retail units.', icon: 'building' },
      { name: 'Carpet and upholstery', description: 'Hot water extraction that lifts stains and odours without soaking the floor.', icon: 'rug' },
      { name: 'Airbnb changeovers', description: 'Same day turnarounds with linen, restock, and photo confirmation.', icon: 'calendar' },
    ],
    galleryLabels: ['Kitchen deep clean', 'End of tenancy', 'Office contract', 'Carpet clean', 'Bathroom detail', 'Oven clean'],
    faq: genericFaq('cleaning work', 'your area'),
  }),

  autodetailing: p({
    label: 'Auto detailing and valeting',
    schemaType: 'AutoDetailingBusiness',
    brand: { primary: '#101828', accent: '#e63946', ink: '#0a0f18' },
    emergency: false,
    hero: {
      eyebrow: 'Mobile detailing, we come to you',
      headline: 'Your car back to showroom, at your address',
      sub: 'Full valets, paint correction, and ceramic coating. We arrive with water and power, so you never have to leave the driveway.',
    },
    ctas: { primary: 'Book a detail', secondary: 'See packages' },
    trust: ['Fully mobile, own water and power', 'Fully insured', 'Only pH neutral products', 'Satisfaction guaranteed'],
    stats: [
      { value: '1,800+', label: 'Cars detailed' },
      { value: '7 yrs', label: 'Detailing' },
      { value: '3 hrs', label: 'Average full detail' },
      { value: '5.0', label: 'Review average' },
    ],
    services: [
      { name: 'Full interior and exterior valet', description: 'Pre wash, decontamination, wax, and a full interior deep clean.', icon: 'car' },
      { name: 'Paint correction', description: 'Machine polishing that removes swirls and scratches instead of hiding them.', icon: 'sparkle' },
      { name: 'Ceramic coating', description: 'Long life protection with a written warranty and aftercare guide.', icon: 'shield' },
      { name: 'Interior deep clean', description: 'Steam cleaning, extraction of seats and carpets, and odour removal.', icon: 'brush' },
      { name: 'Headlight restoration', description: 'Cloudy lenses sanded and polished back to clear, with UV seal.', icon: 'bulb' },
      { name: 'Maintenance washes', description: 'Monthly safe wash plans for coated cars at a reduced rate.', icon: 'droplet' },
    ],
    galleryLabels: ['Full detail', 'Paint correction', 'Ceramic coat', 'Interior clean', 'Wheels', 'Headlights'],
    faq: genericFaq('detailing work', 'your area'),
  }),

  salon: p({
    label: 'Hair salon',
    schemaType: 'HairSalon',
    brand: { primary: '#2b2b3a', accent: '#d4a373', ink: '#12121a' },
    emergency: false,
    hero: {
      eyebrow: 'Colour, cutting, styling',
      headline: 'Hair that grows out well and suits you',
      sub: 'Cuts, colour, balayage, and treatments by stylists who listen first. Online booking, honest advice, and no upselling.',
    },
    ctas: { primary: 'Book online', secondary: 'Call the salon' },
    trust: ['Senior stylists only', 'Free colour consultation', 'Genuine product ranges', 'No obligation advice'],
    stats: [
      { value: '12 yrs', label: 'In business' },
      { value: '6', label: 'Stylists' },
      { value: '4.9', label: 'Average rating' },
      { value: '900+', label: 'Regular clients' },
    ],
    services: [
      { name: 'Cut and finish', description: 'Consultation, cut, and style, with advice you can actually repeat at home.', icon: 'scissors' },
      { name: 'Colour and highlights', description: 'Full head, balayage, and root work using low ammonia ranges.', icon: 'brush' },
      { name: 'Blow dry and styling', description: 'Smooth, curly, or up styles for events and nights out.', icon: 'wind' },
      { name: 'Keratin and treatments', description: 'Bond repair and smoothing treatments for damaged or frizzy hair.', icon: 'sparkle' },
      { name: 'Bridal and occasion hair', description: 'Trials and wedding day styling, on site or in the salon.', icon: 'flower' },
      { name: 'Gents cutting', description: 'Classic and modern cuts, beard trims, and hot towel finishes.', icon: 'cut' },
    ],
    galleryLabels: ['Balayage', 'Blonde correction', 'Precision cut', 'Bridal up do', 'Curly finish', 'Colour gloss'],
    faq: genericFaq('appointments', 'your area'),
  }),

  barber: p({
    label: 'Barbershop',
    schemaType: 'HairSalon',
    brand: { primary: '#141414', accent: '#c9a227', ink: '#0a0a0a' },
    emergency: false,
    hero: {
      eyebrow: 'Walk in or book',
      headline: 'Sharp cuts, no appointment drama',
      sub: 'Skin fades, beard shaping, and hot towel shaves. Straight answers on what suits your hair, and a shop that runs on time.',
    },
    ctas: { primary: 'Book a chair', secondary: 'Call the shop' },
    trust: ['Master barbers', 'Walk ins welcome', 'Sterilised tools', 'Student rates'],
    stats: [
      { value: '8 yrs', label: 'On the block' },
      { value: '25 min', label: 'Average cut' },
      { value: '4.9', label: 'Average rating' },
      { value: '60k+', label: 'Cuts given' },
    ],
    services: [
      { name: 'Skin fade', description: 'Clean blended fade, razor finished and lined up.', icon: 'cut' },
      { name: 'Scissor cut', description: 'Classic scissor work for longer styles and natural texture.', icon: 'scissors' },
      { name: 'Beard trim and shape', description: 'Line up, shape, and oil, with a hot towel finish.', icon: 'razor' },
      { name: 'Hot towel shave', description: 'Traditional straight razor shave with balm and aftercare.', icon: 'flame' },
      { name: 'Kids cuts', description: 'Patient barbers and a chair that keeps little ones happy.', icon: 'star' },
      { name: 'Grey blending', description: 'Subtle colour that softens grey without looking dyed.', icon: 'brush' },
    ],
    galleryLabels: ['Skin fade', 'Beard shape', 'Scissor cut', 'Hot towel', 'Line up', 'Kids cut'],
    faq: genericFaq('bookings', 'your area'),
  }),

  gym: p({
    label: 'Gym and personal training',
    schemaType: 'HealthAndBeautyBusiness',
    brand: { primary: '#111827', accent: '#22c55e', ink: '#0a0f18' },
    emergency: false,
    hero: {
      eyebrow: 'Coaching, not just equipment',
      headline: 'A plan built around your body and your week',
      sub: 'Small group training, one to one coaching, and programmes you can keep up with. No lock in contracts, no judgement.',
    },
    ctas: { primary: 'Claim a free session', secondary: 'See timetables' },
    trust: ['Qualified coaches', 'No lock in contracts', 'Free first session', 'Beginner friendly'],
    stats: [
      { value: '500+', label: 'Members coached' },
      { value: '10 yrs', label: 'Coaching' },
      { value: '92%', label: 'Still training at 6 months' },
      { value: '4.9', label: 'Member rating' },
    ],
    services: [
      { name: 'One to one coaching', description: 'Sessions programmed for your goals, with technique filmed and reviewed.', icon: 'dumbbell' },
      { name: 'Small group training', description: 'Up to six people, coached properly, at a fraction of the one to one price.', icon: 'users' },
      { name: 'Beginner programmes', description: 'A four week on ramp so you learn the basics without feeling lost.', icon: 'clipboard' },
      { name: 'Nutrition coaching', description: 'Habit based guidance, no crash diets and no food you have to give up.', icon: 'apple' },
      { name: 'Return to training', description: 'Rehab aware coaching for people coming back from injury or a long break.', icon: 'shield' },
      { name: 'Online programming', description: 'Remote plans with weekly check ins and video form feedback.', icon: 'chart' },
    ],
    galleryLabels: ['Small group', 'One to one', 'Strength block', 'Conditioning', 'Mobility', 'Member results'],
    faq: genericFaq('training', 'your area'),
  }),

  dentist: p({
    label: 'Dental practice',
    schemaType: 'Dentist',
    brand: { primary: '#0f766e', accent: '#38bdf8', ink: '#0a1416' },
    emergency: true,
    hero: {
      eyebrow: 'Accepting new patients',
      headline: 'Dentistry without the dread',
      sub: 'Check ups, hygiene, cosmetic work, and emergency appointments. Clear pricing before treatment, and gentle care for nervous patients.',
    },
    ctas: { primary: 'Book an appointment', secondary: 'Emergency line' },
    trust: ['Nervous patient friendly', 'Transparent pricing', 'Same day emergencies', 'Flexible payment plans'],
    stats: [
      { value: '2,000+', label: 'Patients' },
      { value: '15 yrs', label: 'In practice' },
      { value: '4.9', label: 'Patient rating' },
      { value: 'Same day', label: 'Emergency slots' },
    ],
    services: [
      { name: 'Check ups and hygiene', description: 'Examination, scale and polish, and a written plan you can think about.', icon: 'tooth' },
      { name: 'White fillings', description: 'Tooth coloured restorations that blend in and last.', icon: 'shield' },
      { name: 'Teeth whitening', description: 'Home and in chair whitening with custom trays and shade matching.', icon: 'sparkle' },
      { name: 'Invisalign and aligners', description: 'Digital scanning, treatment preview, and clear aligner plans.', icon: 'grid' },
      { name: 'Implants', description: 'Single teeth through to full arch restoration, planned with 3D imaging.', icon: 'wrench' },
      { name: 'Emergency appointments', description: 'Pain, swelling, and broken teeth seen quickly, often the same day.', icon: 'bolt' },
    ],
    galleryLabels: ['Before and after', 'Whitening', 'Aligners', 'Implant case', 'Hygiene visit', 'Reception'],
    faq: genericFaq('appointments', 'your area'),
  }),

  restaurant: p({
    label: 'Restaurant and cafe',
    schemaType: 'Restaurant',
    brand: { primary: '#7c2d12', accent: '#f59e0b', ink: '#140d08' },
    emergency: false,
    hero: {
      eyebrow: 'Open for lunch and dinner',
      headline: 'Proper food, cooked to order, no shortcut',
      sub: 'Seasonal menu, locally sourced where we can, and a kitchen that tells you what is in every dish. Tables online in under a minute.',
    },
    ctas: { primary: 'Book a table', secondary: 'See the menu' },
    trust: ['Locally sourced produce', 'Vegetarian and vegan options', 'Gluten free choices', 'Groups welcome'],
    stats: [
      { value: '3', label: 'Courses from' },
      { value: '9 yrs', label: 'Serving' },
      { value: '4.8', label: 'Guest rating' },
      { value: 'Mon', label: 'to Sun open' },
    ],
    services: [
      { name: 'Lunch menu', description: 'Fast, filling plates for workers and families between midday and three.', icon: 'utensils' },
      { name: 'Dinner service', description: 'A longer menu with seasonal specials and a rotated wine list.', icon: 'wine' },
      { name: 'Sunday roast', description: 'Slow cooked meat, proper gravy, and roast potatoes that crisp.', icon: 'flame' },
      { name: 'Private events', description: 'Birthdays, wakes, and small weddings in the side room or full hire.', icon: 'users' },
      { name: 'Takeaway and delivery', description: 'Phone or online orders, collected hot or delivered locally.', icon: 'truck' },
      { name: 'Dietary requirements', description: 'Vegetarian, vegan, and gluten free dishes, with allergen advice on request.', icon: 'leaf' },
    ],
    galleryLabels: ['Main courses', 'Desserts', 'Sunday roast', 'Private room', 'Bar', 'Specials board'],
    faq: genericFaq('dinner reservations', 'your area'),
  }),

  photographer: p({
    label: 'Photography',
    schemaType: 'ProfessionalService',
    brand: { primary: '#1f2937', accent: '#f472b6', ink: '#0b1017' },
    emergency: false,
    hero: {
      eyebrow: 'Weddings, portraits, commercial',
      headline: 'Photographs that still get looked at in ten years',
      sub: 'Natural, unposed coverage with a fast turnaround. Full resolution files included, no watermark, no hidden costs.',
    },
    ctas: { primary: 'Check availability', secondary: 'View galleries' },
    trust: ['Full resolution files included', 'Backup camera and cards', 'Insured and professional', 'Fast editing turnaround'],
    stats: [
      { value: '250+', label: 'Weddings shot' },
      { value: '11 yrs', label: 'Behind the lens' },
      { value: '2 wks', label: 'Gallery delivery' },
      { value: '5.0', label: 'Client rating' },
    ],
    services: [
      { name: 'Wedding photography', description: 'Full day coverage from preparation to first dance, with two shooters available.', icon: 'heart' },
      { name: 'Portrait sessions', description: 'Family, newborn, and personal branding portraits at a location you choose.', icon: 'camera' },
      { name: 'Commercial and product', description: 'Website and catalogue imagery shot for the platform it will appear on.', icon: 'building' },
      { name: 'Event photography', description: 'Conferences, parties, and awards, with same day previews for press.', icon: 'users' },
      { name: 'Property and interiors', description: 'Estate agent and Airbnb shoots, edited and delivered within 48 hours.', icon: 'home' },
      { name: 'Photo restoration', description: 'Old and damaged prints scanned, repaired, and reprinted.', icon: 'sparkle' },
    ],
    galleryLabels: ['Wedding', 'Portraits', 'Product', 'Event', 'Interiors', 'Newborn'],
    faq: genericFaq('sessions', 'your area'),
  }),

  realestate: p({
    label: 'Real estate agent',
    schemaType: 'RealEstateAgent',
    brand: { primary: '#1e3a8a', accent: '#f59e0b', ink: '#0b1120' },
    emergency: false,
    hero: {
      eyebrow: 'Sales, lettings, valuations',
      headline: 'Sell for more, with someone who answers the phone',
      sub: 'Professional photography, honest valuations, and weekly updates you do not have to chase. Free no obligation valuation.',
    },
    ctas: { primary: 'Book a valuation', secondary: 'See listings' },
    trust: ['Free market valuation', 'Accompanied viewings', 'Professional photography included', 'No sale, no fee'],
    stats: [
      { value: '1,200+', label: 'Properties sold' },
      { value: '98%', label: 'Of asking price achieved' },
      { value: '21 days', label: 'Average to offer' },
      { value: '4.9', label: 'Vendor rating' },
    ],
    services: [
      { name: 'Sales and marketing', description: 'Photography, floorplans, and portal listings done properly from day one.', icon: 'home' },
      { name: 'Lettings and management', description: 'Tenant finding, referencing, and full management for landlords.', icon: 'key' },
      { name: 'Free valuations', description: 'A realistic figure based on real comparable sales, not a flattering guess.', icon: 'chart' },
      { name: 'Accompanied viewings', description: 'We run the viewings and follow up every buyer the same day.', icon: 'users' },
      { name: 'Mortgage introductions', description: 'Introductions to whole of market brokers for buyers who need finance.', icon: 'calculator' },
      { name: 'Landlord compliance', description: 'Certificates, deposits, and paperwork kept current so you are covered.', icon: 'clipboard' },
    ],
    galleryLabels: ['Recent sale', 'New listing', 'Interior shots', 'Sold board', 'Open house', 'Team'],
    faq: genericFaq('property appointments', 'your area'),
  }),

  tutor: p({
    label: 'Tutoring and education',
    schemaType: 'EducationalOrganization',
    brand: { primary: '#4338ca', accent: '#22d3ee', ink: '#0c0f1f' },
    emergency: false,
    hero: {
      eyebrow: 'In person and online',
      headline: 'Grades go up when confidence does',
      sub: 'Subject tutoring from primary through A level, plus exam technique. DBS checked tutors and a progress report after every block.',
    },
    ctas: { primary: 'Book a trial lesson', secondary: 'Call us' },
    trust: ['DBS checked tutors', 'Free trial lesson', 'Progress reports', 'Online or at home'],
    stats: [
      { value: '600+', label: 'Students taught' },
      { value: '2 grades', label: 'Average improvement' },
      { value: '1 to 1', label: 'or small groups' },
      { value: '4.9', label: 'Parent rating' },
    ],
    services: [
      { name: 'Maths tutoring', description: 'Number, algebra, and problem solving from primary to A level.', icon: 'calculator' },
      { name: 'English tutoring', description: 'Reading, writing, comprehension, and essay structure.', icon: 'book' },
      { name: 'Science tutoring', description: 'Combined and triple science, including required practicals.', icon: 'flask' },
      { name: 'Exam preparation', description: 'Past papers, timing, and the technique that actually gains marks.', icon: 'clipboard' },
      { name: 'Eleven plus and entrance', description: 'Verbal and non verbal reasoning with mock test practice.', icon: 'star' },
      { name: 'Online lessons', description: 'Shared whiteboard sessions recorded so students can rewatch them.', icon: 'monitor' },
    ],
    galleryLabels: ['One to one', 'Small group', 'Online lesson', 'Exam prep', 'Resources', 'Results'],
    faq: genericFaq('lessons', 'your area'),
  }),

  handyman: p({
    label: 'Handyman and repairs',
    schemaType: 'HomeAndConstructionBusiness',
    brand: { primary: '#b45309', accent: '#0ea5e9', ink: '#140f08' },
    emergency: false,
    hero: {
      eyebrow: 'Small jobs welcome',
      headline: 'The list on your fridge, finally done',
      sub: 'Flat pack, shelves, doors, sealing, and repairs. No job too small, and we turn up when we say we will.',
    },
    ctas: { primary: 'Book a visit', secondary: 'Call now' },
    trust: ['No job too small', 'Hourly or fixed price', 'Own tools and transport', 'Insured and reliable'],
    stats: [
      { value: '2,900+', label: 'Jobs done' },
      { value: '13 yrs', label: 'Fixing homes' },
      { value: '4.9', label: 'Average rating' },
      { value: '95%', label: 'Done in one visit' },
    ],
    services: [
      { name: 'Furniture assembly', description: 'Flat pack built, levelled, and anchored properly to the wall.', icon: 'wrench' },
      { name: 'Shelving and TV mounting', description: 'Studs found, brackets fitted level, cables tidied.', icon: 'monitor' },
      { name: 'Doors and locks', description: 'Sticking doors, new handles, and lock swaps.', icon: 'key' },
      { name: 'Sealing and small repairs', description: 'Bathroom silicone, grout, and patching that looks like it was never damaged.', icon: 'shield' },
      { name: 'Painting and decorating', description: 'Patch repairs, filling, and clean cutting in on walls and woodwork.', icon: 'brush' },
      { name: 'Odd jobs and punch lists', description: 'Book a half day and work through whatever is on your list.', icon: 'clipboard' },
    ],
    galleryLabels: ['Wardrobe built', 'TV mounted', 'Shelf install', 'Door repair', 'Silicone work', 'Paint refresh'],
    faq: genericFaq('odd jobs', 'your area'),
  }),

  petgrooming: p({
    label: 'Pet grooming and care',
    schemaType: 'PetStore',
    brand: { primary: '#7c3aed', accent: '#fb923c', ink: '#120a1f' },
    emergency: false,
    hero: {
      eyebrow: 'Grooming, walking, boarding',
      headline: 'Careful hands for nervous and older pets',
      sub: 'Full grooms, nails, and de shedding by qualified groomers. Small numbers so every animal gets proper attention.',
    },
    ctas: { primary: 'Book a groom', secondary: 'Call us' },
    trust: ['Qualified groomers', 'One to one appointments', 'No sedation, ever', 'Fully insured'],
    stats: [
      { value: '1,500+', label: 'Grooms a year' },
      { value: '8 yrs', label: 'Grooming' },
      { value: '4.9', label: 'Owner rating' },
      { value: 'Small', label: 'groups only' },
    ],
    services: [
      { name: 'Full groom', description: 'Bath, dry, clip, nails, ears, and a finish cut to breed standard or your preference.', icon: 'paw' },
      { name: 'Bath and brush out', description: 'De shedding and coat conditioning to cut down hair around the house.', icon: 'droplet' },
      { name: 'Nail clipping', description: 'Quick, low stress nail trims, including for pets that hate being handled.', icon: 'scissors' },
      { name: 'Puppy first groom', description: 'A gentle introduction to grooming so future visits are not a fight.', icon: 'heart' },
      { name: 'Dog walking', description: 'Group and solo walks with GPS tracked routes and photo updates.', icon: 'truck' },
      { name: 'Boarding and day care', description: 'Home from home stays with daily updates and no kennel cages.', icon: 'home' },
    ],
    galleryLabels: ['Full groom', 'Puppy first groom', 'De shed', 'Nail trim', 'Day care', 'Happy clients'],
    faq: genericFaq('grooming appointments', 'your area'),
  }),

  accountant: p({
    label: 'Accountancy and bookkeeping',
    schemaType: 'AccountingService',
    brand: { primary: '#1e40af', accent: '#10b981', ink: '#0b1120' },
    emergency: false,
    hero: {
      eyebrow: 'For sole traders and small companies',
      headline: 'Tax returns handled, and a tax bill you saw coming',
      sub: 'Bookkeeping, payroll, self assessment, and company accounts. Fixed monthly fees and someone who replies to your emails.',
    },
    ctas: { primary: 'Book a free review', secondary: 'Call the office' },
    trust: ['Fixed monthly fees', 'Qualified and regulated', 'Deadline reminders', 'Free initial review'],
    stats: [
      { value: '320+', label: 'Clients' },
      { value: '14 yrs', label: 'In practice' },
      { value: '24 hrs', label: 'Reply time' },
      { value: 'Zero', label: 'Late filing penalties' },
    ],
    services: [
      { name: 'Self assessment', description: 'Returns prepared, filed, and explained without jargon.', icon: 'clipboard' },
      { name: 'Bookkeeping', description: 'Monthly reconciliations and management accounts you can actually read.', icon: 'book' },
      { name: 'Limited company accounts', description: 'Statutory accounts, corporation tax, and confirmation statements.', icon: 'chart' },
      { name: 'Payroll', description: 'Payslips, RTI submissions, and pension auto enrolment handled.', icon: 'users' },
      { name: 'VAT returns', description: 'Registration, quarterly returns, and help choosing the right scheme.', icon: 'receipt' },
      { name: 'Tax planning', description: 'Timing, allowances, and structure advice before the year ends, not after.', icon: 'calculator' },
    ],
    galleryLabels: ['Client dashboard', 'Payroll', 'Tax planning', 'Cloud accounting', 'Team', 'Year end'],
    faq: genericFaq('accountancy work', 'your area'),
  }),

  lawyer: p({
    label: 'Solicitor and legal services',
    schemaType: 'Attorney',
    brand: { primary: '#111c3a', accent: '#b58b2a', ink: '#0a0f1d' },
    emergency: false,
    hero: {
      eyebrow: 'Conveyancing, family, wills',
      headline: 'Clear advice, plain English, no bill shock',
      sub: 'Property, family, wills, and probate work with fixed fee quotes up front and a named solicitor on your file.',
    },
    ctas: { primary: 'Request a callback', secondary: 'Call the office' },
    trust: ['Fixed fee quotes', 'Regulated and insured', 'Named solicitor per case', 'Free 15 minute call'],
    stats: [
      { value: '2,400+', label: 'Cases handled' },
      { value: '22 yrs', label: 'Practising' },
      { value: '24 hrs', label: 'Callback time' },
      { value: '4.8', label: 'Client rating' },
    ],
    services: [
      { name: 'Conveyancing', description: 'Purchase and sale work with searches, enquiries, and completion managed.', icon: 'home' },
      { name: 'Wills and probate', description: 'Wills, lasting powers of attorney, and estate administration.', icon: 'clipboard' },
      { name: 'Family law', description: 'Divorce, finances, and child arrangements, negotiated before litigated.', icon: 'users' },
      { name: 'Employment law', description: 'Contracts, settlement agreements, and tribunal advice for both sides.', icon: 'shield' },
      { name: 'Landlord and tenant', description: 'Leases, possession claims, and deposit disputes.', icon: 'key' },
      { name: 'Business law', description: 'Formation, shareholder agreements, and commercial contracts.', icon: 'building' },
    ],
    galleryLabels: ['Office', 'Team', 'Conveyancing', 'Wills', 'Family law', 'Commercial'],
    faq: genericFaq('legal matters', 'your area'),
  }),
};

export function getPreset(id) {
  const preset = presets[id];
  if (!preset) {
    const keys = Object.keys(presets).join(', ');
    throw new Error(`Unknown niche "${id}". Available: ${keys}`);
  }
  return preset;
}

export const nicheList = () =>
  Object.entries(presets).map(([id, v]) => ({ id, label: v.label }));
