---
description: Haepungdan core architecture standards, GIS coordinate integrity, Local-First DB rules, single CSS policy, and Windows compatibility.
---

# Project Architecture & Consistency Directives

## 1. GIS Coordinate Integrity (Single Source of Truth)
- **Hybrid Coordinates**: Every map location (Gathering, POI) MUST maintain both relative percentage coordinates (`x_pct`, `y_pct`) and WGS84 GPS coordinates (`lat`, `lng`).
- **Mathematical Integrity**: Use `src/utils/coordinates.ts` formulas (`gpsToPercent`, `percentToGps`) as the sole authority. Hardcoded pixel positioning on the map is strictly prohibited.
- **External GIS Integration**: Maintain valid navigation link generators for Kakao Map, Naver Map, and T-Map.

## 2. Local-First Database & Zero-Cost Reads
- **Client Cache Primary**: All UI views must read directly from browser IndexedDB (`src/services/db.ts` via Dexie.js). Direct, repetitive server queries on every render are prohibited.
- **Delta Synchronization**: Server syncing must query only records with `updatedAt > lastSyncTimestamp`.
- **Soft Deletion**: Use `isDeleted: true` flags instead of hard deletes to allow local client caches to synchronize deletions safely.
- **Data Portability**: Full database JSON export/import utilities (`src/services/backup.ts`) must remain functional.

## 3. Single Unified CSS Policy
- **No Scattered CSS**: Do NOT create separate `.css` or `.module.css` files per component.
- **Centralized Styling**: All custom styling, design tokens, Glassmorphism panels, marker pulse animations, and theme variables MUST reside in `src/styles/app.css`.

## 4. Mobile-First 95vw Layout & Fullscreen Map
- **100vh Map Canvas**: The interactive Geoje map canvas must occupy the full viewport height (`100vh`).
- **95vw Mobile Sidebar**: When open on mobile devices (`< 768px`), the navigation sidebar drawer must occupy `w-[95vw]` to ensure high readability and comprehensive data presentation.

## 5. Windows PowerShell Tooling
- On Windows PowerShell, execute commands using `npm.cmd` and `npx.cmd` to prevent script execution policy blocks.
