# CivicPulse — AI-Powered Civic Infrastructure Reporting, Resolution & Accountability Platform

**Tagline:** *"Every civic issue deserves action. Every action deserves accountability."*

CivicPulse is a full-stack, enterprise-grade, competition-ready civic technology platform connecting citizen reporting, location intelligence, explainable priority scoring, multi-agency routing, field worker task dispatch, side-by-side evidence verification, and root-cause infrastructure dependency analysis.

---

## Enhanced Architecture & Modules

### Module 1: Advanced Priority Engine (`lib/engines/priority.ts`)
- **Transparent 100-Point Weighted Formula**:
  - Issue Severity: 25 points
  - Public Safety and Impact: 25 points
  - Infrastructure Importance: 15 points
  - Recurrence (Repeat Failure): 10 points
  - Incident Age: 10 points
  - Independent Corroboration: 10 points
  - Evidence Confidence: 5 points
- **Priority Levels**:
  - `CRITICAL` (80–100 pts) — SLA: 2h Acknowledgement, 12h Resolution
  - `HIGH` (60–79 pts) — SLA: 4h Acknowledgement, 24h Resolution
  - `MEDIUM` (35–59 pts) — SLA: 12h Acknowledgement, 48h Resolution
  - `LOW` (0–34 pts) — SLA: 24h Acknowledgement, 72h Resolution
- **Emergency Safety Overrides**:
  - Immediate hazards (open manholes, exposed live wires, gas leaks, collapsing structures) trigger an automatic emergency override setting the score directly to 100/Critical with mandatory emergency audit logging.
- **Officer Dashboard Inspection**:
  - Full factor point breakdown card rendered for any incident.
- **Configurable Governance**:
  - Weights, thresholds, and emergency keywords configurable via Admin portal.

### Module 2 & 3: Intelligent Duplicate Detection & GPS Accuracy Matching (`lib/engines/duplicates.ts`)
- **Hybrid 5-Signal Duplicate Formula**:
  $$\text{Duplicate Score} = 0.40 \times \text{Geo} + 0.30 \times \text{Text} + 0.15 \times \text{Category} + 0.10 \times \text{Image} + 0.05 \times \text{Time}$$
- **Dynamic Re-normalization**:
  - If optional signals (e.g., photo URL or timestamp) are missing, weights re-normalize dynamically across available signals rather than penalizing submissions.
- **Actionable Thresholds**:
  - `80–100`: Strong duplicate candidate
  - `60–79`: Possible duplicate requiring review
  - `<60`: Treated as separate issue
- **Citizen Experience (Never auto-deletes)**:
  - Suggests existing candidates in pre-submission step.
  - Allows citizens to click **"Support Existing Incident (+1 Corroboration)"** to reinforce active tickets or **"Submit as Separate Issue"**.
- **Accurate GPS & Location Matching**:
  - Stores `lat`, `lng`, `gps_accuracy` (in meters), `location_source` (`gps`, `manual_pin`, `exif`, `address_geocoded`), and `capture_timestamp`.
  - Dynamic candidate search radius: $\text{Candidate Radius} = \max(15, \text{acc}_1 + \text{acc}_2)$.
  - A location difference of 5 meters triggers candidate comparison with 100% geographic similarity.
  - Optional EXIF metadata reader and manual coordinate adjustment.

### Module 4: Multilingual NLP & AI Smart Adapter (`lib/engines/ai-adapter.ts`)
- Pretrained semantic text tokenization and cosine similarity over civic term vectors.
- Multilingual keyword recognition for English, Hindi (जलभराव, गड्ढा, नाली, कचरा, स्ट्रीटलाइट), and Punjabi (ਪਾਣੀ ਖੜਨਾ, ਟੋਆ, ਨਾਲੀ, ਕੂੜਾ).
- Perceptual image hashing (`dHash`) to detect reused or near-identical evidence images.
- Graceful offline fallback with deterministic rule engines.

### Module 5: Enhanced Interactive Map (`components/map/CivicMap.tsx`)
- OpenStreetMap tile rendering with dynamic Leaflet instances.
- Priority-coded pins (Red Critical pulse, Orange High, Amber Medium, Blue Low).
- View mode switch: `Split View`, `Map Only`, and `List Only`.
- **"Locate Me"** button with browser GPS accuracy circle.
- Interactive popups showing photo, priority breakdown, report counts, and audit trail links.
- Filter drawers for Category, Priority, and Status.

### Module 6: Five Distinct Role-Based Dashboards
1. **Citizen (`/citizen/dashboard`)**: Active Reports with live status, In-App Notifications feed with unread indicators, and Resolved History archive.
2. **Field Worker (`/worker/dashboard`)**: Task dispatch, GPS coordinates, SLA countdowns, and After-Work evidence submission modal.
3. **Agency Officer (`/officer/dashboard`)**: Work order queue, 7-factor Priority Engine analysis, and Duplicate Review & Merge queue.
4. **State Oversight / Supervisor (`/oversight/dashboard`)**: Verification queue, Side-by-Side Photo Review Modal (Before vs After), SLA breach tracker, and audit history.
5. **Administrator (`/admin`)**: Priority weights sliders, emergency override triggers, cities/agencies matrix, and seed data reset.

### Module 7: Database & Dual-Mode Persistence
- **SQL Migrations**:
  - `001_initial_schema.sql`: Core tables, indexes, and Row Level Security.
  - `002_advanced_features.sql`: GPS accuracy, duplicate candidates, notifications, and priority configurations.
- **In-Memory Demo Engine (`lib/db/mock-store.ts`)**: Pre-populated with 20+ realistic municipal records from New Delhi and Ludhiana.

---

## 🧪 Automated Testing & Production Build

Run Vitest unit tests:
```bash
npm run test
```
All 14 tests run and pass across all engines:
- Agency Routing Engine (3 tests)
- 7-Factor Priority & Emergency Overrides (3 tests)
- Hybrid Duplicate Detection & GPS Accuracy (4 tests)
- Infrastructure Dependency Chain Solver (1 test)
- Multilingual NLP & AI Smart Adapter (3 tests)

Run production build check:
```bash
npm run build
```
Compiled 17 static and dynamic routes with 0 errors.

---

## 🚀 How to Run in VS Code

1. Open folder in VS Code (`Cmd + O` or `Ctrl + O`).
2. Open terminal in VS Code (`Cmd + \`` or `Ctrl + \``).
3. Start development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.
5. Use the **Role Switcher** in the header to switch between Citizen, Worker, Officer, Oversight, and Admin roles.
