// Maps each SiteForge preset to the OpenStreetMap tags that find that trade.
// Also flags how well OSM covers the trade, so you know when to fall back to manual methods.

export const CATEGORIES = {
  plumber: { tags: [['craft', 'plumber']], coverage: 'thin' },
  electrician: { tags: [['craft', 'electrician']], coverage: 'thin' },
  hvac: { tags: [['craft', 'hvac'], ['craft', 'heating_engineer']], coverage: 'thin' },
  landscaper: { tags: [['craft', 'gardener'], ['shop', 'garden_centre']], coverage: 'thin' },
  cleaning: { tags: [['shop', 'dry_cleaning'], ['shop', 'laundry'], ['craft', 'cleaning']], coverage: 'thin' },
  autodetailing: { tags: [['shop', 'car_wash'], ['shop', 'car_repair'], ['amenity', 'car_wash']], coverage: 'good' },
  salon: { tags: [['shop', 'hairdresser'], ['shop', 'beauty'], ['shop', 'massage']], coverage: 'good' },
  nailbar: { tags: [['shop', 'nails'], ['shop', 'beauty']], coverage: 'good' },
  beauty: { tags: [['shop', 'beauty'], ['shop', 'massage']], coverage: 'good' },
  barber: { tags: [['shop', 'hairdresser'], ['shop', 'barber']], coverage: 'good' },
  gym: { tags: [['leisure', 'fitness_centre'], ['leisure', 'sports_centre']], coverage: 'good' },
  dentist: { tags: [['amenity', 'dentist']], coverage: 'good' },
  restaurant: { tags: [['amenity', 'restaurant'], ['amenity', 'cafe'], ['amenity', 'fast_food']], coverage: 'good' },
  photographer: { tags: [['craft', 'photographer'], ['shop', 'photo']], coverage: 'thin' },
  realestate: { tags: [['office', 'estate_agent']], coverage: 'good' },
  tutor: { tags: [['amenity', 'driving_school'], ['amenity', 'language_school'], ['office', 'educational_institution']], coverage: 'thin' },
  handyman: { tags: [['craft', 'handyman'], ['shop', 'doityourself'], ['shop', 'hardware']], coverage: 'good' },
  petgrooming: { tags: [['shop', 'pet_grooming'], ['shop', 'pet'], ['amenity', 'veterinary']], coverage: 'good' },
  accountant: { tags: [['office', 'accountant'], ['office', 'tax_advisor']], coverage: 'good' },
  lawyer: { tags: [['office', 'lawyer'], ['office', 'notary']], coverage: 'good' },
};

export const categoryIds = () => Object.keys(CATEGORIES);

// Social-only "websites" mean the business has no site of its own.
export const SOCIAL_HOSTS = [
  'facebook.com',
  'fb.com',
  'fb.me',
  'instagram.com',
  'linktr.ee',
  'twitter.com',
  'x.com',
  'tiktok.com',
  'wa.me',
  'youtube.com',
  'business.site',
  'sites.google.com',
  'wixsite.com',
  'wordpress.com',
  'blogspot.com',
  'yelp.com',
  'tripadvisor.com',
  'checkatrade.com',
  'thumbtack.com',
  'bark.com',
];

export function isSocialUrl(url) {
  if (!url) return false;
  const lower = String(url).toLowerCase();
  return SOCIAL_HOSTS.some((host) => lower.includes(host));
}
