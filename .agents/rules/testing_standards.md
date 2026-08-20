---
description: Testing standards, TypeScript build validation, GIS mathematical precision verification, and local database round-trip checks.
---

# Testing & Quality Assurance Standards

## 1. Type Safety & Production Build Validation
- **Mandatory Build Check**: After making significant code modifications or before completing milestones, the AI MUST execute:
  ```powershell
  npm.cmd run build
  ```
- **Zero Errors Policy**: The build must pass with exit code `0` and 0 TypeScript compilation errors.

## 2. GIS Mathematical Coordinate Precision
- Any changes to `src/utils/coordinates.ts` must pass verification against the official Bounding Box specification:
  - North-West corner `(35.045000, 128.400000)` $\rightarrow$ `(0.0%, 0.0%)`
  - South-East corner `(34.665000, 128.755000)` $\rightarrow$ `(100.0%, 100.0%)`
  - Gujora Beach `(34.78523, 128.67094)` $\rightarrow$ `(76.32%, 68.36%)`
- Numerical conversion error between `gpsToPercent` and `percentToGps` must be within `0.001%`.

## 3. Local-First Database & JSON Round-Trip Verification
- **IndexedDB Seeding**: The initial data seeder must correctly populate all initial POIs and gatherings on first run without network errors.
- **Backup Round-Trip**: The JSON export (`exportDatabaseToJson`) and import (`importDatabaseFromJson`) must accurately preserve all gathering, review, RSVP, and user data fields without corruption.

## 4. UI Responsiveness & Interaction Checks
- **100vh Canvas**: Map viewport must render cleanly without clipping or unwanted page scrollbars.
- **Mobile Sidebar**: The navigation drawer must properly open to `95vw` on mobile screen viewports and close via backdrop click or the close button.
