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
import { UserExperience } from '../../../domain/model/demo-user';

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
      {
        link: '/profiles/cooperative/dashboard',
        label: 'option.cooperative-dashboard',
        icon: 'home',
      },
      { link: '/profiles/cooperative/members', label: 'option.member-directory', icon: 'group' },
      { link: '/crop-health/monitoring', label: 'option.cooperative-plot-health', icon: 'description' },
      { link: '/field-management/finances', label: 'option.cooperative-costs', icon: 'calendar_month' },
      {
        link: '/harvest-certification/certificates',
        label: 'option.cooperative-certificates',
        icon: 'calendar_month',
      },
      { link: '/crop-health/alerts', label: 'option.cooperative-alerts', icon: 'calendar_month' },
      { link: '/crop-health/inbox', label: 'option.diagnosis-inbox', icon: 'pest_control' },
    ],
  },
  {
    title: 'section.system',
    options: [{ link: '/profiles/cooperative/settings', label: 'option.cooperative-settings', icon: 'settings' }],
  },
];

export const agronomistNavigationSections: NavigationSection[] = [{
  title: 'section.agricultural-operation',
  options: [
    { link: '/crop-health/inbox', label: 'option.diagnosis-inbox', icon: 'pest_control' },
    { link: '/crop-health/inspections', label: 'option.field-inspections', icon: 'travel_explore' },
    { link: '/crop-health/prescriptions', label: 'option.prescriptions', icon: 'medication' },
    { link: '/crop-health/monitoring', label: 'option.crop-health', icon: 'eco' },
    { link: '/crop-health/alerts', label: 'option.alerts', icon: 'warning' },
  ],
}];

/** Returns only navigation options supported by the selected demo role. */
export function navigationFor(experience: UserExperience): NavigationSection[] {
  if (experience === 'AGRONOMIST') return agronomistNavigationSections;
  return experience === 'COOPERATIVE_DIRECTOR' ? cooperativeDirectorNavigationSections : farmerNavigationSections;
}
