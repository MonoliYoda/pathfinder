# Contributing to Pathfinder

Pathfinder is a web-based wormhole mapping tool for EVE Online. This document provides a technical orientation for new contributors.

---

## What This Project Does

Pathfinder helps EVE Online players navigate wormhole space by providing:

- Interactive system maps with drag-and-drop layout
- Real-time multi-player updates (other characters appear as you move)
- Wormhole connection tracking (mass, status, time-of-death)
- Signature and anomaly logging
- Corporation/Alliance-wide shared maps
- Activity history and statistics

---

## Technology Stack

### Backend
| Concern | Technology |
|---|---|
| Language | PHP 7.2+ (64-bit) |
| Framework | [Fat-Free Framework (F3)](https://fatfreeframework.com) v3.7 |
| ORM | Cortex (F3 add-on, auto-creates DB schema) |
| Database | MySQL / MariaDB |
| Cache | Redis (recommended) or filesystem |
| Logging | Monolog 2.x |
| Auth | CCP EVE Online OAuth 2.0 SSO + JWT |
| Email | SwiftMailer 6.2.x |
| Cron | xfra35/f3-cron |

### Frontend
| Concern | Technology |
|---|---|
| Module system | RequireJS (AMD) |
| Core | jQuery 3.4.1, Bootstrap 3.3 |
| Map rendering | jsPlumb 2.13.1 |
| Templating | Mustache.js 3.0.1 |
| Local storage | LocalForage 1.7.3 |
| UI helpers | Bootbox, Bootstrap-Editable, Select2 |

### Build Pipeline
| Tool | Purpose |
|---|---|
| Gulp 4 | Task runner |
| Sass/SCSS | CSS pre-processing |
| RequireJS optimizer | JS bundling |
| Uglify-ES | JS minification |
| JSHint | JS linting |

---

## Repository Layout

```
pathfinder/
├── app/                    # All PHP source (PSR-4 namespace Exodus4D\Pathfinder)
│   ├── config.ini          # F3 core config (cache, temp paths)
│   ├── routes.ini          # URL routing table
│   ├── pathfinder.ini      # Feature flags, login settings
│   ├── cron.ini            # Cron job schedules
│   ├── environment.ini     # Secrets — NOT in git, create from template
│   ├── Controller/         # HTTP request handlers
│   ├── Model/
│   │   ├── Pathfinder/     # User-created data (maps, systems, characters …)
│   │   └── Universe/       # Read-only static EVE universe data
│   ├── Lib/                # Reusable libraries
│   │   ├── Api/            # External API clients (ESI, Eve-Scout, GitHub)
│   │   ├── Db/             # Connection pool manager
│   │   ├── Socket/         # WebSocket for real-time updates
│   │   └── Logging/        # Structured log helpers
│   ├── Cron/               # Background job classes
│   ├── Data/               # File/filesystem data adapters
│   └── Exception/          # Custom exception types
├── js/                     # JavaScript source (AMD modules)
│   ├── app/                # Application modules
│   └── lib/                # Vendored libraries
├── public/                 # Compiled & minified production assets
│   ├── css/
│   ├── js/
│   └── templates/          # Mustache HTML templates (served to browser)
├── sass/                   # SCSS source
├── export/                 # Static EVE data (SQL dumps, CSV)
├── logs/                   # Runtime logs (git-ignored)
├── tmp/                    # Cache directory (git-ignored)
├── index.php               # Application entry point
├── composer.json
├── package.json
└── gulpfile.js
```

---

## Backend Architecture

### Request Lifecycle

```
index.php
  → load Composer autoloader
  → load app/config.ini (F3 hive vars)
  → Lib\Config resolves environment.ini overrides
  → Lib\Cron registers scheduled jobs
  → F3 router matches URL against routes.ini
  → Controller::beforeroute()   ← auth check, setup validation
  → action method               ← business logic
  → Controller::afterroute()    ← cleanup
  → JSON or HTML response
```

### Controller Hierarchy

```
Controller (base)
├── AccessController            requires authenticated session
│   ├── MapController           renders the main map page
│   ├── Admin                   admin panel
│   └── Api\*                   AJAX endpoints (Map, System, User, Statistic …)
├── AppController               public landing/login page
└── Ccp\Sso                     OAuth callback handler
```

All AJAX controllers live under `app/Controller/Api/` and are routed dynamically:

```ini
; routes.ini
GET|POST /api/@controller/@action = Exodus4D\Pathfinder\Controller\Api\@controller->@action
```

### Models

All models extend `AbstractModel → Cortex`. Cortex auto-creates the MySQL table on first access using `$fieldConf`.

- **`Model/Pathfinder/`** — writable data: `MapModel`, `SystemModel`, `ConnectionModel`, `CharacterModel`, `UserModel`, `SignatureModel`, …
- **`Model/Universe/`** — read-only static data synced from CCP ESI: `SystemModel`, `RegionModel`, `TypeModel`, …

Example field definition:

```php
protected $fieldConf = [
    'name'    => ['type' => Schema::DT_VARCHAR128, 'validate' => true],
    'active'  => ['type' => Schema::DT_BOOL,       'index'    => true],
    'mapId'   => ['type' => Schema::DT_INT,         'belongs-to-one' => MapModel::class],
];
```

### Two Databases

| Alias | Content |
|---|---|
| `PF` | Pathfinder application data (read/write) |
| `UNIVERSE` | Static EVE universe data (read-only) |

Connection credentials go in `app/environment.ini` (not committed).

---

## Frontend Architecture

The frontend is structured as RequireJS (AMD) modules. The source lives in `js/app/` and `js/lib/`; the compiled output goes to `public/js/`.

### Key Modules

| Module | Role |
|---|---|
| `app/mappage.js` | Top-level map application shell |
| `app/map/map.js` | Core map renderer (jsPlumb) |
| `app/map/system.js` | Solar-system DOM nodes and interactions |
| `app/map/connection.js` | Wormhole connection rendering |
| `app/map/worker.js` | Background polling / update processor |
| `app/login.js` | Landing / login page |
| `app/admin.js` | Admin panel |
| `app/ui/module/` | Reusable UI panels (system info, signatures, …) |

### Real-time Flow

```
Client polls  GET /api/Map/updateData
              ↓
Server checks DB for changes since last client timestamp
              ↓
Response contains delta (systems, connections, characters)
              ↓
WebSocket (Lib\Socket) broadcasts to all clients on same map
              ↓
Frontend re-renders affected nodes
```

### Templates

HTML templates are Mustache files in `public/templates/`. They are fetched and rendered client-side by Mustache.js with data provided by the AMD modules.

---

## Configuration

Pathfinder uses a layered INI configuration system (Fat-Free Framework hive):

| File | Purpose | In git? |
|---|---|---|
| `app/config.ini` | Core: cache backend, tmp paths, error handlers | ✅ |
| `app/routes.ini` | URL routing table | ✅ |
| `app/pathfinder.ini` | Feature flags, registration, webhooks | ✅ |
| `app/cron.ini` | Cron expressions and job bindings | ✅ |
| `app/plugin.ini` | Third-party plugin hooks | ✅ |
| `app/requirements.ini` | System requirement checks | ✅ |
| `app/environment.ini` | DB credentials, API keys, SSO secrets | ❌ create locally |

`app/environment.ini` must be created from the documented template — see `README.md` for required keys.

---

## Cron Jobs

Jobs are defined in `app/cron.ini` and live in `app/Cron/`. They are triggered via CLI:

```bash
php index.php "/cron/jobName"
```

Or scheduled with system cron / a process manager.

| Job | Schedule | Purpose |
|---|---|---|
| `deleteEolConnections` | every 5 min | Remove end-of-life wormholes |
| `importSystemData` | every 30 min | Sync system stats from CCP ESI |
| `updateSovereigntyData` | every 30 min | Sync sovereignty maps |
| `deleteSignatures` | every 30 min | Expire old signatures |
| `cleanUpCharacterData` | hourly | Ban/kick timed-out characters |
| `deactivateMapData` | hourly | Mark old private maps inactive |
| `deleteMapData` | daily at 11:00 UTC | Remove fully deactivated maps |

---

## Authentication

```
1. Browser → GET /sso/requestAuthorization
2. Redirect → CCP SSO OAuth consent screen
3. CCP redirects → GET /sso/authorize?code=...
4. Server: verifies CCP JWT, fetches character, creates/updates DB record
5. Server: sets session cookie, redirects to map page
```

Session data is stored in the `PF` database (or Redis). Role/Right models control which characters can access which maps.

---

## Local Development Setup (summary)

1. **PHP** ≥ 7.2, **MySQL/MariaDB**, **Redis** (optional but recommended)
2. **Composer**: `composer install`
3. **Node.js + npm**: `npm install`
4. **Configure**: copy and fill in `app/environment.ini`
5. **Build assets**: `gulp build` (or `gulp watch` during development)
6. **Register CCP application** at [developers.eveonline.com](https://developers.eveonline.com) to get SSO credentials
7. Point a web server (Apache/nginx) at the project root; `index.php` handles all routes

See `README.md` for full step-by-step instructions and server configuration examples.

---

## Where to Start

| Goal | Where to look |
|---|---|
| Add a new API endpoint | `app/Controller/Api/` + `app/routes.ini` |
| Add a new DB field to a model | `app/Model/Pathfinder/*.php` (`$fieldConf`) |
| Change map rendering behaviour | `js/app/map/map.js` or `js/app/map/system.js` |
| Add a new UI panel | `js/app/ui/module/` + a template in `public/templates/` |
| Add or change a cron task | `app/Cron/` + `app/cron.ini` |
| Change EVE universe sync logic | `app/Cron/Universe.php`, `app/Model/Universe/` |
| Modify styling | `sass/` → run `gulp css` |
| Debug a backend request | `logs/` (Monolog output), `app/Lib/Monolog.php` |
