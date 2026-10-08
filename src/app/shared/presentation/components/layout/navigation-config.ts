/** One option displayed in a role-specific side navigation menu. */
export interface NavigationOption {
  link: string;
  label: string;
  icon: string;
}

/** A titled group of navigation options. */
export interface NavigationSection {
  title: string;
  options: NavigationOption[];
}

/** Experiences currently supported by the web application. */
export type UserExperience = 'FARMER' | 'COOPERATIVE_DIRECTOR';

/** Navigation for an independent farmer. */
export const farmerNavigationSections: NavigationSection[] = [
  {
    title: 'section.major',
    options: [{ link: '/field-management/dashboard', label: 'option.my-plot', icon: 'home' }],
  },
  {
    title: 'section.agricultural-operation',
    options: [
      { link: '/crop-health/monitoring', label: 'option.crop-health', icon: 'eco' },
      { link: '/field-management/finances', label: 'option.expenses', icon: 'payments' },
      { link: '/crop-health/advisor', label: 'option.advisor', icon: 'forum' },
      {
        link: '/harvest-certification/certificates',
        label: 'option.harvest-certificates',
        icon: 'workspace_premium',
      },
    ],
  },
  {
    title: 'section.system',
    options: [
      { link: '/crop-health/alerts', label: 'option.alerts', icon: 'notification_important' },
      { link: '/profiles/settings', label: 'option.settings', icon: 'settings' },
    ],
  },
];

/** Navigation for the director who manages a cooperative. */
export const cooperativeDirectorNavigationSections: NavigationSection[] = [
  {
    title: 'section.institutional-management',
    options: [
      { link: '/cooperative/dashboard', label: 'option.cooperative-dashboard', icon: 'home' },
      { link: '/profiles/cooperative/members', label: 'option.member-directory', icon: 'group' },
      { link: '/crop-health/monitoring', label: 'option.cooperative-plot-health', icon: 'description' },
      { link: '/field-management/finances', label: 'option.cooperative-costs', icon: 'calendar_month' },
      {
        link: '/harvest-certification/certificates',
        label: 'option.cooperative-certificates',
        icon: 'calendar_month',
      },
      { link: '/crop-health/alerts', label: 'option.cooperative-alerts', icon: 'calendar_month' },
    ],
  },
  {
    title: 'section.system',
    options: [{ link: '/profiles/settings', label: 'option.cooperative-settings', icon: 'settings' }],
  },
];

/** Returns the menu corresponding to the active user experience. */
export function navigationFor(experience: UserExperience): NavigationSection[] {
  return experience === 'COOPERATIVE_DIRECTOR'
    ? cooperativeDirectorNavigationSections
    : farmerNavigationSections;
}
