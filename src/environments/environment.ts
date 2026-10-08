/**
 * Production environment.
 *
 * @remarks
 * Replace `platformProviderApiBaseUrl` with the deployed RESTful API URL.
 */
export const environment = {
  production: true,
  platformProviderApiBaseUrl: 'https://sumaqagro-api.example.com/api/v1',

  // IAM
  platformProviderSignUpEndpointPath: '/authentication/sign-up',
  platformProviderSignInEndpointPath: '/authentication/sign-in',
  platformProviderPasswordRecoveryEndpointPath: '/authentication/password-recovery',

  // Profiles
  platformProviderProfilesEndpointPath: '/profiles',
  platformProviderCooperativesEndpointPath: '/cooperatives',
  platformProviderCooperativeMembersEndpointPath: '/cooperative-members',
  platformProviderAgronomistAssignmentsEndpointPath: '/agronomist-assignments',

  // Subscriptions and Payments
  platformProviderPlansEndpointPath: '/plans',
  platformProviderSubscriptionsEndpointPath: '/subscriptions',
  platformProviderPaymentsEndpointPath: '/payments',

  // Field Management
  platformProviderFieldPlotsEndpointPath: '/field-plots',
  platformProviderCropCampaignsEndpointPath: '/crop-campaigns',
  platformProviderCampaignLedgersEndpointPath: '/campaign-ledgers',

  // Crop Health
  platformProviderSatelliteObservationsEndpointPath: '/satellite-observations',
  platformProviderClimateForecastsEndpointPath: '/climate-forecasts',
  platformProviderAgroclimaticAlertsEndpointPath: '/agroclimatic-alerts',
  platformProviderRegionalBulletinsEndpointPath: '/regional-bulletins',
  platformProviderPestReportsEndpointPath: '/pest-reports',
  platformProviderFieldInspectionsEndpointPath: '/field-inspections',
  platformProviderTechnicalPrescriptionsEndpointPath: '/technical-prescriptions',

  // Harvest Certification
  platformProviderHarvestBatchesEndpointPath: '/harvest-batches',
  platformProviderQualityCertificatesEndpointPath: '/quality-certificates',
  platformProviderPublicTraceabilityEndpointPath: '/public-traceability',

  /** Demo user used until the IAM bounded context is implemented. */
  demoUserId: 3,
  demoUserName: 'Cristian Santana',
  /** Temporary experience selector until IAM provides the authenticated user's role. */
  demoUserExperience: 'COOPERATIVE_DIRECTOR' as const,
};
