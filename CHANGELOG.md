# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Contributing Guidelines**: Added `CONTRIBUTING.md` with the DDD layers and dependency rules of each bounded context, Git Flow branch naming, Conventional Commits scopes, SemVer, Angular and Angular Material standards, i18n rules, fake API usage and the pull request checklist.
- **Changelog**: Added this `CHANGELOG.md` following Keep a Changelog.

## [1.0.0] - 2026-10-09

First version of the SumaqAgro Web Application, deployed on Firebase Hosting with data served by a fake API (json-server) on Render.

### Added
- **Shared Kernel**:
  - Domain base classes `BaseEntity` and the `Money` value object.
  - Infrastructure base classes: `BaseResource`, `BaseResponse`, `BaseAssembler`, `ErrorHandlingEnabledBaseType`, `BaseApi` and the generic `BaseApiEndpoint` with filtered queries (`getAllBy`), plus `api-date` helpers for `YYYY-MM-DD` dates.
  - Layout shell split into `Layout`, `LeftSidebar` (navigation by role) and `Toolbar`, with `LayoutService` for the responsive side menu.
  - `DemoSessionService` and the **Demo Access** view to choose a farmer, cooperative director or agronomist until IAM is implemented, and `PlotSelectionService` to share the selected plot between contexts.
  - Reusable presentation components `PageHeader` (breadcrumb, title and subtitle) and `MessageCard` (error and empty states), plus `LanguageSwitcher` and `PageNotFound`.
  - Material 3 green theme, Poppins font and Material Symbols icons.
- **Field Management Bounded Context**:
  - Domain model: `FieldPlot` (GPS polygon, area in hectares and crossed-sides validation), `CropCampaign`, `CampaignLedger` (total investment, cost by category, breakeven and suggested price) and `ExpenseEntry`, the `GeoCoordinate` value object, enums and commands.
  - `FieldManagementStore` (single store with signals) and `FieldManagementApi` with endpoints and assemblers for plots, campaigns and cost ledgers.
  - "My Plot" dashboard with KPI cards, NDVI evolution chart and cost distribution chart.
  - Registered plots view with plot cards and free plan slots (US-22, US-28).
  - Two-step plot registration: crop data form and satellite map (Leaflet) to delineate the polygon (US-29 to US-34).
  - Campaign finances view (US-36, US-40) and field expense form with one route per expense type: inputs, labor and freight (US-37 to US-39).
- **Crop Health Bounded Context**:
  - Entities `SatelliteObservation`, `ClimateForecast`, `AgroclimaticAlert`, `PestReport`, `FieldInspection` and `TechnicalPrescription` with their commands, assemblers, endpoints, `CropHealthApi` and `CropHealthStore`.
  - Crop health monitoring view with a Leaflet map (NDVI/NDWI layers), plot selector and observation image download.
  - Agroclimatic alerts view, pest report form, diagnosis inbox, field inspections, prescription form and prescriptions view, connected to the fake API and filtered by role.
- **Profiles Bounded Context**:
  - Entities `FarmerProfile`, `Cooperative`, `CooperativeMember`, `TechnicalAdvisor` and `CooperativeDashboard` with `ProfilesApi` and `ProfilesStore`.
  - Farmer settings view, cooperative director dashboard and cooperative institutional settings with the technical team of agronomists.
- **Harvest Certification Bounded Context**:
  - Entities `HarvestBatch`, `RepresentativeSample`, `PotatoCaliberGrading`, `CoffeeCuppingResult`, `QualityCertificate` and `PublicTraceabilityRecord` with `HarvestCertificationApi` and `HarvestCertificationStore`.
  - Harvest certificates view, batch registration, grading sheet and the farmer certificate view with QR code.
  - Public traceability view (`/verify/:token`) that verifies a certificate without an account.
- **Internationalization (i18n)**: English and Spanish translations split by bounded context (`public/i18n/{en,es}/<context>.json`) with `MultiTranslateHttpLoader`, translated paginator labels and English as the default language.
- **Fake API & Deployment**: json-server data and routes (`/api/v1`) for every bounded context, production environment pointing to Render, and Firebase Hosting configuration.
- **Documentation**: README with setup, run and deploy instructions, and PlantUML class diagrams of the Web Application and the RESTful API for every bounded context in `docs/`.

### Changed
- **Field Management Presentation**: Split large views into small presentation components (`PlotCard`, `PlotSlotCard`, `RegistrationSteps`, `PlotRegistrationForm`, `PlotBoundaryMap`, `BoundarySummaryPanel`, `PlotSavedDialog`, `CampaignKpiCards`, `NdviChartCard`, `CostDistributionCard`), renamed the registration page to `PlotRegistrationView`, and moved the NDVI loading from the dashboard view into `FieldManagementStore`.
- **Field Management Domain**: `CampaignLedger` now creates its own expenses from the expense commands, and `GeoCoordinate` is named as a value object (`geo-coordinate.ts`).
- **Crop Health**: Replaced fabricated fallback data with explicit loading, empty and error states, and enhanced the dashboard with satellite observation data.
- **Demo Access**: Texts updated to English, and the active user now comes from the demo access instead of a fixed environment user.

### Removed
- Unused `SoilBaseline` value object and `RecordSoilBaselineCommand` from the Web Application (soil analysis, US-31, remains in the design for a future version).
- Report download from Crop Health, replaced by the observation image download.
- Cooperative registration flow from Profiles.

### Fixed
- Translations, fake API data and routes lost in the Crop Health merge.
- Crop Health map initialization.
- Harvest certification routes and the quality filter translation key.
- Cooperative dashboard and institutional settings loaded for the selected user.
- Missing list responses of the Field Management infrastructure.

[Unreleased]: https://github.com/dymbia-opensource/sumaqAgro-appweb/compare/v1.0.0...develop
[1.0.0]: https://github.com/dymbia-opensource/sumaqAgro-appweb/releases/tag/v1.0.0
