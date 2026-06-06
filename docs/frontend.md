# WHO-I-AM: Frontend Documentation

This document describes the Next.js application structure, component architecture, state management hooks, and UI visualizations of the WHO-I-AM user interface.

---

## 1. Technical Framework & Styling

* **Core**: Next.js 15 (React 19, TypeScript).
* **Styling**: Vanilla CSS rules coupled with Tailwind utility classes.
* **Design Philosophy**: Glassmorphism dark-cyber aesthetic (`bg-cyber-black`, glowing borders, translucent backdrops, neon HSL parameters).
* **Map Rendering**: Leaflet JS (integrated via dynamic loading on the client-side to prevent SSR window issues).

---

## 2. Page Configurations

### Landing Hub (`/`) - `src/app/page.tsx`
* Renders an interactive background backdrop component (`DataGridHero`).
* Offers a configuration drawer (`GridControlPanel`) to adjust grid parameters: spacing, pulse duration, animation type (pulse, wave, random), mouse glow, and HSL neon accents.
* **Hotkeys**: Pressing `H` toggles the parameter drawer; pressing `R` randomizes variables.

### Main Audit Dashboard (`/dashboard`) - `src/app/dashboard/page.tsx`
* Automatically starts the diagnostic pipeline on mount.
* Displays a multi-panel grid comprising:
  * **Overall Progress Header**: Tracks the current category and step indicator.
  * **Privacy Score Dial**: Displays the user's score from 10 to 100.
  * **Threat Severity Ledger**: Summarizes identified risks (High, Med, Low).
  * **Simulation Form**: Allows manual spoofing of IP and User-Agent parameters.
  * **Map Target Frame**: Visualizes geographical coordinates (IP-derived or GPS).
  * **Interactive Audit Details**: Renders detailed audits under accordion tabs.
  * **Diagnostics Terminal Logs**: Output console displaying real-time checks.

---

## 3. Component Architecture & Widgets

```text
src/components/
├── ui/
│   └── data-grid-hero.tsx    # Interactive backdrop grid canvas
├── Map.tsx                   # Leaflet map container
├── ScannerConsole.tsx        # Styled diagnostic terminal logs
├── PrivacyScoreDial.tsx      # SVG radial indicator chart
├── RiskFindingsCard.tsx      # Diagnostic audit risk list
├── SimulationConsole.tsx     # Spoof configuration panel
├── EducationalDrawer.tsx     # Slide-out privacy documentation drawer
├── AuditCategoryCard.tsx     # Card container for audits
└── categories/               # Individual detailed panel drawers
    ├── NetworkAuditPanel.tsx
    ├── DeviceAuditPanel.tsx
    ├── FingerprintAuditPanel.tsx
    ├── WebRTCDNSPanel.tsx
    ├── CapabilitiesPanel.tsx
    └── SecurityPanel.tsx
```

### Key Interactive Components:
* **Interactive Leaflet Map (`Map.tsx`)**: Integrates CartoDB Dark Matter tile layouts with client markers pointing to coordinates.
* **Privacy Score Dial (`PrivacyScoreDial.tsx`)**: Radial HSL SVG path animation. Calculates path offsets dynamically based on the final score.
* **Simulation Console (`SimulationConsole.tsx`)**: Includes preset User-Agent configurations (iPhone, Linux, Windows, Tor Browser) and manual IP overrides.
* **Educational Drawer (`EducationalDrawer.tsx`)**: Overlay drawer explaining the mechanics of WebRTC, Canvas Fingerprinting, and DNS Leaks to educate non-technical users.

---

## 4. State Management Hook (`useAuditPipeline.ts`)

The React state logic is encapsulated in `src/app/hooks/useAuditPipeline.ts`. It manages:

* **Paced Diagnostic Execution**: Emulates a sequential sweep across the 8 categories. Loops through 5 descriptive check steps per category (separated by a 90ms delay) to keep the UI engaging.
* **Network Query Execution**: Queries `/api/whoami` on step 1, passing spoof values if simulation is active.
* **Fingerprint Extraction**:
  * Calls `getCanvasFingerprint()` and `getAudioFingerprint()` to extract client hashes.
  * WebGL parameters are read via `getWebGLFingerprint()`.
  * Browser API supports (localStorage, serviceWorker) are read on step 7.
* **Uniqueness Calculation**: Sends client hashes to `/api/fingerprint` to retrieve historical matching percentages.
* **DNS Leak Trigger**: Generates a random session token via `/api/dns-leak/init`, triggers a client-side DNS lookup to `token.dns.whoami.com` using a dummy `fetch` check, and polls `/api/dns-leak/check` after a 1.5s delay to map the resolver paths.
* **Score Calculation Engine**:
  * Starts at `100`.
  * Deduces `-15` for WebRTC leaks.
  * Deduces `-20` for DNS leaks.
  * Deduces `-10` for routing headers.
  * Deduces `-15` for User-Agent mismatches.
  * Deduces `-15` for unencrypted HTTP connections.
  * Grants a `+10` bonus for Tor nodes and `+5` for VPNs.
  * Caps values between `10` and `100`.
* **History Aggregator**: Persists the last 5 results (IP, Score, Grade) in browser `localStorage`.
