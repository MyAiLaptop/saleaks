// Default categories for SpillNova Content Marketplace
export const DEFAULT_CATEGORIES = [
  {
    name: 'News & Events',
    slug: 'news-events',
    description: 'Breaking news, current events, and newsworthy moments',
    icon: 'Newspaper',
  },
  {
    name: 'Entertainment',
    slug: 'entertainment',
    description: 'Concerts, festivals, celebrity sightings, and entertainment events',
    icon: 'Music',
  },
  {
    name: 'Sports',
    slug: 'sports',
    description: 'Sports events, matches, training, and athletic moments',
    icon: 'Trophy',
  },
  {
    name: 'Weather & Nature',
    slug: 'weather-nature',
    description: 'Weather events, storms, natural phenomena, and landscapes',
    icon: 'Cloud',
  },
  {
    name: 'Traffic & Accidents',
    slug: 'traffic-accidents',
    description: 'Road conditions, accidents, and transport-related content',
    icon: 'Car',
  },
  {
    name: 'Wildlife',
    slug: 'wildlife',
    description: 'Animals, wildlife encounters, and nature photography',
    icon: 'Bird',
  },
  {
    name: 'Community',
    slug: 'community',
    description: 'Local events, community gatherings, and neighborhood happenings',
    icon: 'Users',
  },
  {
    name: 'Infrastructure',
    slug: 'infrastructure',
    description: 'Buildings, construction, urban development, and public works',
    icon: 'Building2',
  },
  {
    name: 'Emergency Services',
    slug: 'emergency-services',
    description: 'Fire, rescue, medical emergencies, and first responders',
    icon: 'Siren',
  },
  {
    name: 'Other',
    slug: 'other',
    description: 'Other interesting content not covered by other categories',
    icon: 'Camera',
  },
] as const

export type CategorySlug = (typeof DEFAULT_CATEGORIES)[number]['slug']
