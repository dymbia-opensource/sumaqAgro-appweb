# SumaqAgro – Web Application

[![Angular](https://img.shields.io/badge/Angular-22-DD0031?logo=angular)](https://angular.dev/)
[![Angular Material](https://img.shields.io/badge/Angular%20Material-22-3F51B5?logo=angular)](https://material.angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Aplicación web de **SumaqAgro**, plataforma SaaS de la startup **Dymbia** para productores de papa andina y café de especialidad, cooperativas y agrónomos: registro de parcelas con su polígono GPS, costos de campaña y precio para no perder, monitoreo satelital (NDVI/NDWI), alertas y certificados de calidad con código QR.

Es una *Single Page Application* en **Angular 22** con **Angular Material**, organizada por *bounded context* siguiendo **Domain-Driven Design**.

## Requisitos

Para clonar y ejecutar el proyecto solo se necesita:

| Herramienta | Versión | Comprobar con |
|---|---|---|
| [Node.js](https://nodejs.org/) | 20.19+, 22.12+ o 24+ (el equipo usa 24) | `node --version` |
| npm | 10+ (el proyecto usa npm 11) | `npm --version` |
| Git | 2.x | `git --version` |

Opcionales:

* **Angular CLI** global (`npm install -g @angular/cli@22`), para usar `ng` directo. Sin instalarla, se puede usar `npx ng`.
* **git flow** (AVH), para trabajar con las ramas `feature/*`. Viene con Git for Windows.

Las librerías del proyecto **no se instalan una por una**: están en `package.json` y se instalan con `npm install`.

| Para | Paquetes |
|---|---|
| Framework | `@angular/core`, `common`, `router`, `forms`, `platform-browser` (22) |
| Componentes de UI | `@angular/material` y `@angular/cdk` (22) |
| Idiomas (español e inglés) | `@ngx-translate/core` y `@ngx-translate/http-loader` (18) |
| Gráficos | `chart.js` (4) y `ng2-charts` (11) |
| Fake API (solo desarrollo) | `json-server` (0.17) |
| Tests y formato (solo desarrollo) | `vitest`, `jsdom` y `prettier` |

## Instalación

```bash
git clone https://github.com/dymbia-opensource/sumaqAgro-appweb.git
cd sumaqAgro-appweb
npm install
```

## Ejecución

Mientras la RESTful API no esté lista, los datos vienen de una **fake API** con json-server (`server/db.json`). Abre **dos terminales**:

```bash
# Terminal 1: fake API en http://localhost:3000/api/v1
npm run api
```

```bash
# Terminal 2: aplicación en http://localhost:4200
npm start
```

Abre `http://localhost:4200`. La aplicación entra directo al dashboard **Mi Parcela** del usuario de prueba (`demoUserId: 1` en `src/environments`), hasta que se implemente el inicio de sesión (IAM).

Para comprobar la fake API: `http://localhost:3000/api/v1/field-plots`.

## Despliegue

| Qué | Dónde | URL |
|---|---|---|
| Aplicación web (Static Content) | Firebase Hosting | https://sumaqagro-appweb.web.app |
| Fake API (json-server) | Render | https://sumaqagro-fake-api.onrender.com/api/v1 |

**Fake API.** Render despliega solo la rama `develop` en cada push, con el comando `npx json-server server/db.json --routes server/routes.json --host 0.0.0.0 --port $PORT`. En el plan gratuito el servicio se suspende tras 15 minutos sin uso: la primera petición tarda unos segundos en responder. Los cambios hechos desde la aplicación se pierden al reiniciarse y vuelven a los datos de `server/db.json`.

**Aplicación web.** `src/environments/environment.ts` apunta a la fake API de Render. Para publicar una nueva versión (requiere [Firebase CLI](https://firebase.google.com/docs/cli) y acceso al proyecto `sumaqagro-appweb`):

```bash
firebase login
npm run build
firebase deploy --only hosting
```

`firebase.json` publica la carpeta `dist/sumaqAgro-appweb/browser` y redirige cualquier ruta a `index.html`, para que Angular abra la vista correcta al recargar la página.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm start` | Levanta la aplicación en modo desarrollo (`ng serve`) |
| `npm run api` | Levanta la fake API en el puerto 3000 |
| `npm run build` | Compila para producción en `dist/` |
| `npm test` | Ejecuta las pruebas unitarias con Vitest |

## Avance

| Bounded context | Estado |
|---|---|
| Shared | Clases base, layout con menú lateral, selector de idioma ES / EN y página 404. Pendiente: modo sin conexión |
| Field Management | Dominio, infraestructura, store y dashboard **Mi Parcela**. Pendiente: parcelas, registro con mapa y finanzas |
| Crop Health, Harvest Certification, Profiles, Subscriptions and Payments, IAM | Pendientes |

## Convenciones de trabajo

* **GitFlow:** `main` (producción), `develop` (integración) y una rama `feature/<nombre>` por cada capa o funcionalidad.
* **Conventional Commits:** `feat(<contexto>): ...`, `fix(...)`, `chore: ...`, `docs: ...`, `style(...)`.
* **Capas por bounded context:** se implementan en orden `domain` → `infrastructure` → `application` → `presentation`.

---

## Estructura del proyecto

Estructura final de la **Web Application** de SumaqAgro. Sigue lo definido en el reporte:

* **C4 (sección 4.6):** cada carpeta de `src/app` es un componente del diagrama de componentes de la Web Application. La carpeta `public/` y el resultado de `ng build` forman el contenedor **Static Content** (Firebase Hosting).
* **DDD:** una carpeta por bounded context (IAM, Profiles, Subscriptions and Payments, Field Management, Crop Health y Harvest Certification) más `shared`. Cada una tiene las capas `domain/model`, `application`, `infrastructure` y `presentation`.
* **Diagramas de clases (sección 4.7):** los nombres de archivo son los mismos que aparecen junto a cada clase en los diagramas de la Web Application.

### Componentes del C4 y carpetas

| Componente (C4) | Carpeta | Llama a (RESTful API) | Usado por |
|---|---|---|---|
| IAM Component | `src/app/iam/` | IAM Component | Visitante (registro) y todos los usuarios (inicio de sesión) |
| Profiles Component | `src/app/profiles/` | Profiles Component | Directivo de cooperativa |
| Subscriptions and Payments Component | `src/app/subscriptions/` | Subscriptions and Payments Component | Productor |
| Field Management Component | `src/app/field-management/` | Field Management Component | Productor |
| Crop Health Component | `src/app/crop-health/` | Crop Health Component | Productor y agrónomo |
| Harvest Certification Component | `src/app/harvest-certification/` | Harvest Certification Component | Directivo y visitante (vista pública del QR) |
| Shared Component | `src/app/shared/` | — | Todos los componentes |

### Árbol de carpetas

```
sumaqagro-app-web/
├── docs/
│   ├── class-diagrams/                         # Fuentes PlantUML de la sección 4.7 (web-application)
│   └── user-stories.md                         # User stories y criterios de aceptación
├── server/
│   ├── db.json                                 # Datos de prueba para json-server (fake API)
│   └── routes.json                             # Reescribe /api/v1/* → /* para json-server
├── public/                                     # Se copia tal cual al build (Static Content)
│   ├── i18n/
│   │   ├── en.json
│   │   └── es.json
│   ├── images/
│   │   └── logo-sumaqagro.png
│   ├── icons/                                  # Íconos de la PWA
│   ├── manifest.webmanifest                    # Datos de la PWA (nombre, íconos, colores)
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── shared/
│   │   │   ├── domain/
│   │   │   │   └── model/
│   │   │   │       ├── base-entity.ts
│   │   │   │       └── money.ts
│   │   │   ├── infrastructure/
│   │   │   │   ├── base-api.ts
│   │   │   │   ├── base-api-endpoint.ts
│   │   │   │   ├── base-assembler.ts
│   │   │   │   ├── base-response.ts                     # BaseResource y BaseResponse
│   │   │   │   ├── error-handling-enabled-base-type.ts
│   │   │   │   ├── offline-sync.service.ts              # Cola sin conexión en IndexedDB (Dexie.js)
│   │   │   │   ├── pending-operation.ts
│   │   │   │   ├── pending-operation-type.ts            # FIELD_EXPENSE, PEST_REPORT
│   │   │   │   ├── sync-result.ts
│   │   │   │   └── app-update.service.ts                # Service Worker (SwUpdate): versión nueva de la app
│   │   │   └── presentation/
│   │   │       ├── components/
│   │   │       │   ├── layout/                          # layout.ts / .html / .css (menú según el rol)
│   │   │       │   ├── language-switcher/
│   │   │       │   └── offline-status-banner/
│   │   │       └── views/
│   │   │           └── page-not-found/
│   │   │
│   │   ├── iam/
│   │   │   ├── domain/
│   │   │   │   └── model/
│   │   │   │       ├── entities/
│   │   │   │       │   ├── user.entity.ts
│   │   │   │       │   ├── authenticated-user.entity.ts
│   │   │   │       │   └── user-role.ts
│   │   │   │       └── commands/
│   │   │   │           ├── sign-up.command.ts
│   │   │   │           ├── sign-in.command.ts
│   │   │   │           ├── request-password-reset.command.ts
│   │   │   │           └── reset-password.command.ts
│   │   │   ├── application/
│   │   │   │   └── iam.store.ts
│   │   │   ├── infrastructure/
│   │   │   │   ├── iam-api.ts
│   │   │   │   ├── iam.guard.ts                         # Protege las rutas privadas (sesión y rol)
│   │   │   │   ├── iam.interceptor.ts                   # Agrega el token JWT a cada petición
│   │   │   │   ├── endpoints/
│   │   │   │   │   ├── sign-up.endpoint.ts
│   │   │   │   │   ├── sign-in.endpoint.ts
│   │   │   │   │   └── password-recovery.endpoint.ts
│   │   │   │   ├── assemblers/
│   │   │   │   │   ├── sign-up.assembler.ts
│   │   │   │   │   ├── sign-in.assembler.ts
│   │   │   │   │   └── password-recovery.assembler.ts
│   │   │   │   ├── requests/
│   │   │   │   │   ├── sign-up.request.ts
│   │   │   │   │   ├── sign-in.request.ts
│   │   │   │   │   ├── forgot-password.request.ts
│   │   │   │   │   └── reset-password.request.ts
│   │   │   │   └── responses/
│   │   │   │       ├── sign-up.response.ts
│   │   │   │       └── sign-in.response.ts
│   │   │   ├── presentation/
│   │   │   │   ├── views/
│   │   │   │   │   ├── sign-up-form/
│   │   │   │   │   ├── sign-in-form/
│   │   │   │   │   ├── forgot-password-form/
│   │   │   │   │   └── reset-password-form/
│   │   │   │   └── components/
│   │   │   │       └── logout-menu-item/
│   │   │   └── iam.routes.ts
│   │   │
│   │   ├── profiles/
│   │   │   ├── domain/
│   │   │   │   └── model/
│   │   │   │       ├── entities/
│   │   │   │       │   ├── profile.entity.ts
│   │   │   │       │   ├── cooperative.entity.ts
│   │   │   │       │   ├── cooperative-member.entity.ts
│   │   │   │       │   ├── agronomist-invitation.entity.ts
│   │   │   │       │   ├── agronomist-assignment.entity.ts
│   │   │   │       │   ├── preferred-language.ts
│   │   │   │       │   └── invitation-status.ts
│   │   │   │       └── commands/
│   │   │   │           ├── update-profile.command.ts
│   │   │   │           ├── register-cooperative.command.ts
│   │   │   │           ├── add-cooperative-member.command.ts
│   │   │   │           ├── invite-agronomist.command.ts
│   │   │   │           └── assign-agronomist-to-plot.command.ts
│   │   │   ├── application/
│   │   │   │   └── profiles.store.ts
│   │   │   ├── infrastructure/
│   │   │   │   ├── profiles-api.ts
│   │   │   │   ├── endpoints/
│   │   │   │   │   ├── profiles.endpoint.ts
│   │   │   │   │   ├── cooperatives.endpoint.ts
│   │   │   │   │   ├── cooperative-members.endpoint.ts
│   │   │   │   │   └── agronomist-assignments.endpoint.ts
│   │   │   │   ├── assemblers/
│   │   │   │   │   ├── profile.assembler.ts
│   │   │   │   │   ├── cooperative.assembler.ts
│   │   │   │   │   ├── cooperative-member.assembler.ts
│   │   │   │   │   └── agronomist-assignment.assembler.ts
│   │   │   │   └── responses/
│   │   │   │       ├── profile.response.ts              # Resource de un registro
│   │   │   │       ├── profiles.response.ts             # Respuesta con la lista
│   │   │   │       ├── cooperative.response.ts
│   │   │   │       ├── cooperatives.response.ts
│   │   │   │       ├── cooperative-member.response.ts
│   │   │   │       ├── cooperative-members.response.ts
│   │   │   │       ├── agronomist-assignment.response.ts
│   │   │   │       └── agronomist-assignments.response.ts
│   │   │   ├── presentation/
│   │   │   │   └── views/
│   │   │   │       ├── profile-settings-view/
│   │   │   │       ├── cooperative-registration-form/
│   │   │   │       ├── member-directory-view/
│   │   │   │       └── agronomist-assignment-view/
│   │   │   └── profiles.routes.ts
│   │   │
│   │   ├── subscriptions/
│   │   │   ├── domain/
│   │   │   │   └── model/
│   │   │   │       ├── entities/
│   │   │   │       │   ├── plan.entity.ts
│   │   │   │       │   ├── subscription.entity.ts
│   │   │   │       │   ├── payment.entity.ts
│   │   │   │       │   ├── plan-code.ts
│   │   │   │       │   ├── subscription-status.ts
│   │   │   │       │   ├── billing-cycle.ts
│   │   │   │       │   └── payment-status.ts
│   │   │   │       └── commands/
│   │   │   │           ├── select-subscription-plan.command.ts
│   │   │   │           ├── submit-payment.command.ts
│   │   │   │           └── cancel-subscription.command.ts
│   │   │   ├── application/
│   │   │   │   └── subscriptions.store.ts
│   │   │   ├── infrastructure/
│   │   │   │   ├── subscriptions-api.ts
│   │   │   │   ├── endpoints/
│   │   │   │   │   ├── plans.endpoint.ts
│   │   │   │   │   ├── subscriptions.endpoint.ts
│   │   │   │   │   └── payments.endpoint.ts
│   │   │   │   ├── assemblers/
│   │   │   │   │   ├── plan.assembler.ts
│   │   │   │   │   ├── subscription.assembler.ts
│   │   │   │   │   └── payment.assembler.ts
│   │   │   │   └── responses/
│   │   │   │       ├── plan.response.ts
│   │   │   │       ├── plans.response.ts
│   │   │   │       ├── subscription.response.ts
│   │   │   │       ├── subscriptions.response.ts
│   │   │   │       ├── payment.response.ts
│   │   │   │       └── payments.response.ts
│   │   │   ├── presentation/
│   │   │   │   └── views/
│   │   │   │       ├── plans-catalog-view/
│   │   │   │       ├── checkout-view/
│   │   │   │       └── billing-history-view/
│   │   │   └── subscriptions.routes.ts
│   │   │
│   │   ├── field-management/
│   │   │   ├── domain/
│   │   │   │   └── model/
│   │   │   │       ├── entities/
│   │   │   │       │   ├── field-plot.entity.ts
│   │   │   │       │   ├── geo-coordinate.entity.ts
│   │   │   │       │   ├── soil-baseline.entity.ts
│   │   │   │       │   ├── crop-campaign.entity.ts
│   │   │   │       │   ├── campaign-ledger.entity.ts
│   │   │   │       │   ├── expense-entry.entity.ts
│   │   │   │       │   ├── plot-status.ts
│   │   │   │       │   ├── crop-type.ts
│   │   │   │       │   ├── campaign-status.ts
│   │   │   │       │   ├── expense-category.ts
│   │   │   │       │   └── yield-unit.ts
│   │   │   │       └── commands/
│   │   │   │           ├── register-field-plot.command.ts
│   │   │   │           ├── delineate-plot-boundary.command.ts
│   │   │   │           ├── record-soil-baseline.command.ts
│   │   │   │           ├── start-crop-campaign.command.ts
│   │   │   │           ├── select-crop-type.command.ts
│   │   │   │           ├── specify-seed-variety.command.ts
│   │   │   │           ├── record-sowing-date.command.ts
│   │   │   │           ├── close-crop-campaign.command.ts
│   │   │   │           ├── record-input-expense.command.ts
│   │   │   │           ├── record-daily-labor-expense.command.ts
│   │   │   │           ├── record-field-freight-expense.command.ts
│   │   │   │           ├── set-expected-yield.command.ts
│   │   │   │           └── export-campaign-cost-report.command.ts
│   │   │   ├── application/
│   │   │   │   └── field-management.store.ts            # Usa OfflineSyncService para los gastos sin conexión
│   │   │   ├── infrastructure/
│   │   │   │   ├── field-management-api.ts
│   │   │   │   ├── endpoints/
│   │   │   │   │   ├── field-plots.endpoint.ts
│   │   │   │   │   ├── crop-campaigns.endpoint.ts
│   │   │   │   │   └── campaign-ledgers.endpoint.ts
│   │   │   │   ├── assemblers/
│   │   │   │   │   ├── field-plot.assembler.ts
│   │   │   │   │   ├── crop-campaign.assembler.ts
│   │   │   │   │   └── campaign-ledger.assembler.ts
│   │   │   │   └── responses/
│   │   │   │       ├── field-plot.response.ts
│   │   │   │       ├── field-plots.response.ts
│   │   │   │       ├── crop-campaign.response.ts
│   │   │   │       ├── crop-campaigns.response.ts
│   │   │   │       ├── campaign-ledger.response.ts
│   │   │   │       ├── campaign-ledgers.response.ts
│   │   │   │       └── expense-entry.response.ts
│   │   │   ├── presentation/
│   │   │   │   └── views/
│   │   │   │       ├── my-plot-dashboard-view/
│   │   │   │       ├── registered-plots-view/
│   │   │   │       ├── plot-registration-form/
│   │   │   │       ├── plot-boundary-map-view/          # Mapa Leaflet.js para marcar el polígono
│   │   │   │       ├── campaign-finances-view/
│   │   │   │       └── field-expense-form/
│   │   │   └── field-management.routes.ts
│   │   │
│   │   ├── crop-health/
│   │   │   ├── domain/
│   │   │   │   └── model/
│   │   │   │       ├── entities/
│   │   │   │       │   ├── satellite-observation.entity.ts
│   │   │   │       │   ├── climate-forecast.entity.ts
│   │   │   │       │   ├── agroclimatic-alert.entity.ts
│   │   │   │       │   ├── action-step.entity.ts
│   │   │   │       │   ├── regional-bulletin.entity.ts
│   │   │   │       │   ├── pest-report.entity.ts
│   │   │   │       │   ├── field-inspection.entity.ts
│   │   │   │       │   ├── technical-prescription.entity.ts
│   │   │   │       │   ├── satellite-source.ts
│   │   │   │       │   ├── alert-type.ts
│   │   │   │       │   ├── alert-severity.ts
│   │   │   │       │   ├── alert-status.ts
│   │   │   │       │   ├── pest-report-status.ts
│   │   │   │       │   ├── inspection-status.ts
│   │   │   │       │   └── prescription-status.ts
│   │   │   │       └── commands/
│   │   │   │           ├── upload-pest-evidence-photo.command.ts   # Lleva clientSyncId (modo sin conexión)
│   │   │   │           ├── record-damage-assessment.command.ts
│   │   │   │           ├── schedule-field-inspection.command.ts
│   │   │   │           ├── complete-field-inspection.command.ts
│   │   │   │           ├── issue-technical-prescription.command.ts
│   │   │   │           ├── confirm-treatment-application.command.ts
│   │   │   │           ├── report-foliage-recovery.command.ts
│   │   │   │           ├── evaluate-treatment-effectiveness.command.ts
│   │   │   │           ├── complete-action-step.command.ts
│   │   │   │           ├── close-alert.command.ts
│   │   │   │           └── issue-regional-bulletin.command.ts
│   │   │   ├── application/
│   │   │   │   └── crop-health.store.ts                 # Usa OfflineSyncService para los reportes de plagas
│   │   │   ├── infrastructure/
│   │   │   │   ├── crop-health-api.ts
│   │   │   │   ├── endpoints/
│   │   │   │   │   ├── satellite-observations.endpoint.ts
│   │   │   │   │   ├── climate-forecasts.endpoint.ts
│   │   │   │   │   ├── agroclimatic-alerts.endpoint.ts
│   │   │   │   │   ├── regional-bulletins.endpoint.ts
│   │   │   │   │   ├── pest-reports.endpoint.ts
│   │   │   │   │   ├── field-inspections.endpoint.ts
│   │   │   │   │   └── technical-prescriptions.endpoint.ts
│   │   │   │   ├── assemblers/
│   │   │   │   │   ├── satellite-observation.assembler.ts
│   │   │   │   │   ├── climate-forecast.assembler.ts
│   │   │   │   │   ├── agroclimatic-alert.assembler.ts
│   │   │   │   │   ├── regional-bulletin.assembler.ts
│   │   │   │   │   ├── pest-report.assembler.ts
│   │   │   │   │   ├── field-inspection.assembler.ts
│   │   │   │   │   └── technical-prescription.assembler.ts
│   │   │   │   └── responses/
│   │   │   │       ├── satellite-observation.response.ts
│   │   │   │       ├── satellite-observations.response.ts
│   │   │   │       ├── climate-forecast.response.ts
│   │   │   │       ├── climate-forecasts.response.ts
│   │   │   │       ├── agroclimatic-alert.response.ts
│   │   │   │       ├── agroclimatic-alerts.response.ts
│   │   │   │       ├── regional-bulletin.response.ts
│   │   │   │       ├── pest-report.response.ts
│   │   │   │       ├── field-inspection.response.ts
│   │   │   │       └── technical-prescription.response.ts
│   │   │   ├── presentation/
│   │   │   │   └── views/
│   │   │   │       ├── crop-health-view/                # Mapa NDVI/NDWI con Leaflet.js
│   │   │   │       ├── agricultural-alerts-view/
│   │   │   │       ├── alert-detail-view/
│   │   │   │       ├── advisor-consultation-view/
│   │   │   │       ├── pest-report-form/
│   │   │   │       ├── diagnosis-inbox-view/
│   │   │   │       ├── prescription-form/
│   │   │   │       └── regional-bulletin-form/
│   │   │   └── crop-health.routes.ts
│   │   │
│   │   ├── harvest-certification/
│   │   │   ├── domain/
│   │   │   │   └── model/
│   │   │   │       ├── entities/
│   │   │   │       │   ├── harvest-batch.entity.ts
│   │   │   │       │   ├── representative-sample.entity.ts
│   │   │   │       │   ├── potato-caliber-grading.entity.ts
│   │   │   │       │   ├── coffee-cupping-result.entity.ts
│   │   │   │       │   ├── quality-certificate.entity.ts
│   │   │   │       │   ├── public-traceability-record.entity.ts
│   │   │   │       │   ├── crop-type.ts
│   │   │   │       │   ├── batch-status.ts
│   │   │   │       │   ├── quality-category.ts
│   │   │   │       │   └── certificate-status.ts
│   │   │   │       └── commands/
│   │   │   │           ├── register-harvest-batch.command.ts
│   │   │   │           ├── weigh-delivered-batch.command.ts
│   │   │   │           ├── extract-representative-sample.command.ts
│   │   │   │           ├── grade-potato-calibers.command.ts
│   │   │   │           ├── perform-coffee-cupping.command.ts
│   │   │   │           ├── issue-quality-certificate.command.ts
│   │   │   │           └── verify-certificate.command.ts
│   │   │   ├── application/
│   │   │   │   └── harvest-certification.store.ts
│   │   │   ├── infrastructure/
│   │   │   │   ├── harvest-certification-api.ts
│   │   │   │   ├── endpoints/
│   │   │   │   │   ├── harvest-batches.endpoint.ts
│   │   │   │   │   ├── quality-certificates.endpoint.ts
│   │   │   │   │   └── public-traceability.endpoint.ts
│   │   │   │   ├── assemblers/
│   │   │   │   │   ├── harvest-batch.assembler.ts
│   │   │   │   │   ├── quality-certificate.assembler.ts
│   │   │   │   │   └── public-traceability.assembler.ts
│   │   │   │   └── responses/
│   │   │   │       ├── harvest-batch.response.ts
│   │   │   │       ├── harvest-batches.response.ts
│   │   │   │       ├── quality-certificate.response.ts
│   │   │   │       ├── quality-certificates.response.ts
│   │   │   │       └── public-traceability.response.ts
│   │   │   ├── presentation/
│   │   │   │   └── views/
│   │   │   │       ├── harvest-batch-registration-view/
│   │   │   │       ├── harvest-grading-sheet-view/
│   │   │   │       ├── harvest-certificates-view/
│   │   │   │       └── public-traceability-view/        # Ruta pública: se abre al escanear el QR
│   │   │   └── harvest-certification.routes.ts
│   │   │
│   │   ├── app.config.ts                       # Providers: router, HttpClient + iam.interceptor, Service Worker, i18n
│   │   ├── app.routes.ts                       # Lazy loading de cada *.routes.ts
│   │   ├── app.ts
│   │   ├── app.html
│   │   └── app.css
│   ├── environments/
│   │   ├── environment.ts                      # URL de la RESTful API en producción
│   │   └── environment.development.ts          # URL de json-server o de la API local
│   ├── index.html
│   ├── main.ts
│   ├── material-theme.scss                     # Tema de Angular Material
│   └── styles.css
├── .editorconfig
├── .firebaserc                                 # Proyecto de Firebase al que se despliega
├── .gitignore
├── angular.json
├── CHANGELOG.md                                # Notas de cada versión
├── CONTRIBUTING.md                             # Guía para colaborar y convenciones de código
├── firebase.json                               # Firebase Hosting: carpeta del build y rewrite de la SPA a index.html
├── LICENSE
├── ngsw-config.json                            # Caché del Service Worker (@angular/pwa)
├── package.json
├── README.md
├── tsconfig.json
├── tsconfig.app.json
└── tsconfig.spec.json
```

### Convenciones del código

* **Cuatro capas por bounded context:** `domain/model` (con `entities/` y `commands/`), `application`, `infrastructure` y `presentation`, más su archivo `*.routes.ts`.
* **Una carpeta por vista o componente:** cada una contiene sus archivos `.ts`, `.html` y `.css` (por ejemplo, `plot-registration-form/plot-registration-form.ts`).
* **El sufijo del archivo indica su tipo:**

| Sufijo | Contenido |
|---|---|
| `.entity.ts` | Entidad del dominio (hereda de `BaseEntity`) |
| `.ts` en `entities/` sin sufijo | Enum con los valores de un estado o tipo (por ejemplo, `crop-type.ts`) |
| `.command.ts` | Command que dispara una acción del usuario |
| `.store.ts` | Estado del contexto con *signals* |
| `-api.ts` | Fachada que agrupa los endpoints del contexto |
| `.endpoint.ts` | Llamadas HTTP de un recurso (hereda de `BaseApiEndpoint`) |
| `.assembler.ts` | Conversión entre recursos de la API y entidades |
| `.request.ts` / `.response.ts` | Interfaces de los datos que se envían y reciben |
| `.service.ts` | Servicio de `shared` (sincronización sin conexión y actualización de la app) |
| `.guard.ts` / `.interceptor.ts` | Protección de rutas y token JWT en cada petición (solo en IAM) |

* **Relaciones entre carpetas (igual que en el diagrama de componentes):**
  * Cada contexto usa las clases base de `shared` (`BaseEntity`, `BaseApiEndpoint`, `BaseAssembler`).
  * Cada `*.routes.ts` usa `iam.guard.ts` para revisar la sesión y el rol, salvo la ruta de `public-traceability-view/`, que es pública.
  * `layout` (en `shared`) lee el rol desde `iam.store.ts` para mostrar el menú de cada usuario.
  * Ningún contexto importa archivos de otro contexto, salvo de `shared` y de IAM (guard y store).
  * Cada contexto llama solo al contexto del mismo nombre en la RESTful API.
* **Modo sin conexión:** `offline-sync.service.ts` guarda en IndexedDB los gastos (Field Management) y los reportes de plagas (Crop Health) hechos sin señal, cada uno con un `clientSyncId` para no duplicarse, y los envía cuando vuelve la conexión. `ngsw-config.json` deja en caché la aplicación y los mapas.
* **Dependencias principales (`package.json`):** `@angular/material`, `@angular/pwa` (`@angular/service-worker`), `leaflet`, `dexie` y `@ngx-translate/core`; en desarrollo, `json-server`.
* **Despliegue:** `ng build` genera la carpeta `dist/sumaqAgro-appweb/browser`, que se publica en Firebase Hosting (contenedor Static Content). `firebase.json` hace que cualquier ruta de la SPA cargue `index.html`.
* **Fake API:** `server/db.json` simula el backend con json-server mientras la RESTful API no está lista. Sus colecciones usan los mismos nombres que los endpoints (`field-plots`, `crop-campaigns`, `pest-reports`, etc.).
