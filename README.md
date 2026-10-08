# SumaqAgro – Web Application

[![Angular](https://img.shields.io/badge/Angular-22-DD0031?logo=angular)](https://angular.dev/)
[![Angular Material](https://img.shields.io/badge/Angular%20Material-22-3F51B5?logo=angular)](https://material.angular.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Aplicación web de **SumaqAgro** (startup **Dymbia**) para productores de papa andina y café de especialidad, cooperativas y ingenieros agrónomos. Es una *Single Page Application* en **Angular 22** con **Angular Material**, organizada por *bounded context* siguiendo **Domain-Driven Design**.

| | URL |
|---|---|
| Aplicación publicada | https://sumaqagro-appweb.web.app |
| Fake API publicada | https://sumaqagro-fake-api.onrender.com/api/v1 |

## Requisitos

| Herramienta | Versión | Comprobar con |
|---|---|---|
| [Node.js](https://nodejs.org/) | 20.19+, 22.12+ o 24+ | `node --version` |
| npm | 10+ | `npm --version` |
| Git | 2.x | `git --version` |

Las librerías no se instalan una por una: están en `package.json` y se instalan con `npm install`.

## Ejecutar en local

```bash
git clone https://github.com/dymbia-opensource/sumaqAgro-appweb.git
cd sumaqAgro-appweb
npm install
```

Mientras la RESTful API no esté lista, los datos vienen de una **fake API** con json-server (`server/db.json`). Abre **dos terminales**:

```bash
# Terminal 1: fake API en http://localhost:3000/api/v1
npm run api
```

```bash
# Terminal 2: aplicación en http://localhost:4200
npm start
```

Abre `http://localhost:4200` y elige un usuario de prueba en **Acceso demo** (agricultor, director de cooperativa o ingeniero agrónomo). Esta pantalla se reemplaza por el inicio de sesión cuando se implemente IAM.

| Comando | Qué hace |
|---|---|
| `npm start` | Aplicación en modo desarrollo (`ng serve`) |
| `npm run api` | Fake API en el puerto 3000 |
| `npm run build` | Compila para producción en `dist/sumaqAgro-appweb/browser` |
| `npm test` | Pruebas unitarias con Vitest |

## Despliegue

La aplicación se publica en **Firebase Hosting** y la fake API en **Render**. La URL de la API que usa la versión publicada está en `src/environments/environment.ts`.

### Aplicación web (Firebase Hosting)

Requiere acceso al proyecto `sumaqagro-appweb` de Firebase (lo da el dueño del proyecto en *Configuración → Usuarios y permisos*). La primera vez en una PC:

```bash
npm install -g firebase-tools
firebase login
```

Para publicar una versión nueva, desde la rama `develop` actualizada:

```bash
npm run build
firebase deploy --only hosting
```

`firebase.json` publica `dist/sumaqAgro-appweb/browser` y redirige cualquier ruta a `index.html`, para que Angular abra la vista correcta al recargar la página. `.firebaserc` indica el proyecto (`sumaqagro-appweb`).

### Fake API (Render)

Render vuelve a desplegar la fake API sola con cada push a `develop`. Para crearla en otra cuenta: **New → Web Service** con este repositorio y

| Campo | Valor |
|---|---|
| Branch | `develop` |
| Runtime | Node |
| Build Command | `npm install --include=dev` |
| Start Command | `npx json-server server/db.json --routes server/routes.json --host 0.0.0.0 --port $PORT` |
| Instance Type | Free |

Luego cambia `platformProviderApiBaseUrl` en `src/environments/environment.ts` por la URL nueva. En el plan gratuito el servicio se suspende tras 15 minutos sin uso (la primera petición tarda unos segundos) y los cambios hechos desde la app se pierden al reiniciarse.

## Estructura

Cada carpeta de `src/app` es un *bounded context* (un componente del diagrama C4 de la sección 4.6 del reporte) con cuatro capas: `domain`, `application`, `infrastructure` y `presentation`. Los nombres de archivo son los de los diagramas de clases de la sección 4.7.

```
sumaqAgro-appweb/
├── docs/
│   ├── diagram-web-aplication/            # Diagramas de clases (PlantUML) de la Web Application
│   └── diagram-restful-api/               # Diagramas de clases (PlantUML) de la RESTful API
├── public/                                # Se copia tal cual al build
│   ├── i18n/
│   │   ├── es/                            # shared.json + un archivo por bounded context
│   │   └── en/                            # Los mismos archivos en inglés
│   └── images/
├── server/
│   ├── db.json                            # Datos de la fake API (json-server)
│   └── routes.json                        # Reescribe /api/v1/* → /*
├── src/
│   ├── app/
│   │   ├── shared/                        # Lo que usan todos los contextos
│   │   │   ├── domain/model/              # BaseEntity, Money, usuario demo
│   │   │   ├── application/               # Sesión demo (hasta que exista IAM)
│   │   │   ├── infrastructure/            # BaseApi, BaseApiEndpoint, BaseAssembler, fechas de la API
│   │   │   │   └── i18n/                  # Loader que une los archivos de traducción
│   │   │   └── presentation/
│   │   │       ├── components/            # layout, left-sidebar, toolbar, language-switcher
│   │   │       ├── views/                 # demo-access-view, page-not-found
│   │   │       └── i18n/                  # Textos del paginador de Angular Material
│   │   │
│   │   ├── field-management/              # Parcelas, polígono GPS, campañas y costos
│   │   │   ├── domain/model/
│   │   │   │   ├── entities/              # Entidades (*.entity.ts) y enums
│   │   │   │   └── commands/              # Commands (*.command.ts)
│   │   │   ├── application/               # Store con signals (*.store.ts)
│   │   │   ├── infrastructure/            # Fachada (*-api.ts)
│   │   │   │   ├── endpoints/             # Llamadas HTTP de cada recurso (*.endpoint.ts)
│   │   │   │   ├── assemblers/            # Resource ↔ entidad (*.assembler.ts)
│   │   │   │   └── responses/             # Contratos de la API (*.response.ts)
│   │   │   ├── presentation/views/        # Una carpeta por vista (.ts, .html, .css)
│   │   │   └── field-management.routes.ts # Rutas del contexto (lazy loading)
│   │   │
│   │   ├── crop-health/                   # NDVI/NDWI, alertas, plagas y recetas
│   │   ├── profiles/                      # Perfiles, cooperativas y socios
│   │   ├── harvest-certification/         # Lotes, calificación, certificados y verificación por QR
│   │   │                                  # (los tres con las mismas capas que field-management)
│   │   ├── app.config.ts                  # Providers: router, HttpClient, traducciones
│   │   ├── app.routes.ts                  # Rutas raíz: páginas privadas dentro del layout
│   │   └── app.ts
│   ├── environments/
│   │   ├── environment.development.ts     # API local (json-server)
│   │   └── environment.ts                 # API publicada (Render)
│   ├── material-theme.scss                # Tema de Angular Material
│   └── styles.css
├── angular.json
├── firebase.json                          # Firebase Hosting: carpeta del build y rutas de la SPA
├── .firebaserc                            # Proyecto de Firebase
└── package.json
```

Un *bounded context* nuevo crea su carpeta con las mismas capas, agrega su `*.routes.ts` en `app.routes.ts` y su archivo de traducciones en `public/i18n/{es,en}/` y en `TRANSLATION_FILES` de `app.config.ts`.

## Cómo trabajamos

* **GitFlow:** `main` (producción), `develop` (integración) y una rama `feature/<nombre>` por funcionalidad. Se une a `develop` con `git merge --no-ff`.
* **Conventional Commits:** `feat(<contexto>): ...`, `fix(...)`, `refactor(...)`, `chore: ...`, `docs: ...`.
* **Conflictos:** en `server/db.json` y `src/app/app.routes.ts` conserva las líneas de ambas ramas. Cada contexto edita solo su propio archivo de traducciones.

## Crop Health: flujo demo

- Agricultor: consulta sus parcelas y observaciones, registra reportes y consulta sus visitas y recetas.
- Director: consulta las parcelas de socios activos de su cooperativa y programa visitas.
- Ingeniero Agrónomo (Juan A. Morales, usuario 4): consulta las parcelas de su cooperativa, completa visitas, emite recetas y marca reportes como resueltos. Su identidad proviene de la sesión, no de un selector manual.

La selección de parcela se comparte con Field Management. El visor dibuja el polígono registrado sobre OpenStreetMap y muestra los índices almacenados; no descarga imágenes multiespectrales. La exportación disponible es CSV.

Una visita se programa para una fecha futura y se completa a partir de esa fecha, con al menos 10 caracteres de resultados. Al completarla, el reporte pasa de PENDING a INSPECTED; entonces permite emitir una receta. Después de registrar una receta, el ingeniero agrónomo puede marcarlo RESOLVED. Si falla la actualización del reporte después de guardar una visita, la pantalla permite sincronizar ese estado sin crear otra visita.

Los controles de rol y parcela pertenecen al frontend demo. json-server no autentica usuarios ni protege sus endpoints; la autorización real debe implementarse en el backend. El estado se limpia y las consultas anteriores se cancelan al cambiar de usuario.
