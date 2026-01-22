// Default categories for SA Leaks
export const DEFAULT_CATEGORIES = [
  {
    name: 'Government Corruption',
    slug: 'government-corruption',
    description: 'Corruption in national, provincial, or local government',
    icon: 'Building2',
  },
  {
    name: 'Corporate Fraud',
    slug: 'corporate-fraud',
    description: 'Corporate misconduct, fraud, and financial crimes',
    icon: 'Briefcase',
  },
  {
    name: 'Police Misconduct',
    slug: 'police-misconduct',
    description: 'Police brutality, corruption, or abuse of power',
    icon: 'Shield',
  },
  {
    name: 'State Capture',
    slug: 'state-capture',
    description: 'State capture and politically connected corruption',
    icon: 'Landmark',
  },
  {
    name: 'Tender Fraud',
    slug: 'tender-fraud',
    description: 'Irregular tender processes and procurement fraud',
    icon: 'FileText',
  },
  {
    name: 'Environmental Crimes',
    slug: 'environmental-crimes',
    description: 'Illegal dumping, pollution, and environmental violations',
    icon: 'Leaf',
  },
  {
    name: 'Healthcare',
    slug: 'healthcare',
    description: 'Corruption or malpractice in healthcare sector',
    icon: 'Heart',
  },
  {
    name: 'Education',
    slug: 'education',
    description: 'Corruption or misconduct in educational institutions',
    icon: 'GraduationCap',
  },
  {
    name: 'Human Rights',
    slug: 'human-rights',
    description: 'Human rights violations and abuses',
    icon: 'Users',
  },
  {
    name: 'Other',
    slug: 'other',
    description: 'Other wrongdoing not covered by other categories',
    icon: 'AlertCircle',
  },
] as const

export type CategorySlug = (typeof DEFAULT_CATEGORIES)[number]['slug']
