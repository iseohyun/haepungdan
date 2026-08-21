# Changelog

All notable changes to the Haepungdan project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.2] - 2026-08-21

### Added
- **4-Control-Point GPS Calibration & 2D Affine Transformation (`coordinates.ts`, `MapViewer.tsx`)**:
  - Calibrated GPS to SVG/Map percentage coordinates using Least Squares Regression on 4 physical control points (Markers 1, 2, 4, 7).
  - Residual error reduced to <0.1% (<0.5px) for sub-pixel marker alignment.
- **Firebase Firestore Real-time Cloud Persistence & Bidirectional Delta Sync (`firebase.ts`, `App.tsx`)**:

  - Live persistence to Firestore collections (`gatherings`, `rsvps`, `reviews`) upon create/update/delete.
  - Automatic push of local authentic data and pull of cloud updates on app start and refresh.
- **Revamped Gathering Forms & Direct Coordinate Modal (`CreateGatheringModal.tsx`, `GatheringDetailModal.tsx`, `DirectInputModal.tsx`)**:
  - Intuitive form layout with icons, thumbnail WebP compression, next-round auto calculation, and 6-step Google Maps GPS extraction modal.
- **Official Haepungdan Logo Favicon (`index.html`, `public/favicon.svg`)**:
  - Replaced Vite icon with official Haepungdan logo and wave vector.

### Fixed
- **DateTime Timezone Shifting Bug (`coordinates.ts`, `GatheringDetailModal.tsx`, `CreateGatheringModal.tsx`)**:
  - Fixed 9-hour UTC time drift during edit saves using `parseLocalDateTime` and `formatToKoreanIso`.

### Removed
- **Completely Eradicated Dummy Data & Seeding Scripts (`initialData.ts`, `db.ts`, `firebase.ts`)**:
  - Permanently purged dummy gatherings and `locationPresets` collections from Firestore and codebase.

- **Full Initial Cloud Sync on First Visit (`firebase.ts`, `db.ts`)**:

  - Ensures 100% full download of all Firestore gatherings and location presets when visiting new domains like GitHub Pages.
- **Firebase Firestore Realtime Cloud Persistence (`firebase.ts`, `App.tsx`, `db.ts`)**:

  - Live cloud synchronization for gathering creation, updates, soft deletion, location presets, RSVPs, and reviews.
- **GPS Extraction Guide Modal (`DirectInputModal.tsx`)**:

  - Added `?` trigger button next to GPS coordinate input that opens a step-by-step 6-step guide modal for Google Maps URL sharing and LLM extraction.
- **Default Next Round Number (`CreateGatheringModal.tsx`)**:
  - Automatically pre-fills the next round number (`max(roundNumber) + 1`) when opening the creation modal.
- **Redesigned Gathering Create & Edit Forms (`CreateGatheringModal.tsx`, `GatheringDetailModal.tsx`)**:

  - Intuitive single-row vertical layout with complete icon coverage and fixed duplicate datetime labels.
- **Dedicated Location & GPS Direct Input Sub-Modal (`DirectInputModal.tsx`)**:
  - Sub-modal popup for manual detail and GPS coordinate entry with smart latitude/longitude parsing and real-time validation.
- **Gathering Round Number System (`MapViewer.tsx`, `Sidebar.tsx`)**:
  - Numeric round display on map markers and support for lightning gatherings (round 0) and automatic title formatting.
- **Official Navigation Marker Deep Links (`coordinates.ts`)**:
  - Accurate destination markers on Kakao Map, Naver Map, and T-Map.
- **Location Presets Database (`db.ts`)**:
  - Integrated location preset storage and past gathering location selector.

## [0.2.0] - 2026-08-21


### Added
- **Text-Free Clean Map (`public/map.jpg`) and Original Backup (`public/map.bak`)**:
  - Completely removed all Korean text labels and road badges while perfectly preserving coastline contours, soft pastel terrain textures, and road networks.
- **Hybrid Firebase & Delta Sync Engine (`src/services/firebase.ts`)**:
  - Zero-cost offline fallback to IndexedDB when unconfigured; seamless Google OAuth popup login and incremental Firestore Delta Sync when configured.
- **Firebase Cloud Configuration Modal (`src/components/admin/FirebaseConfigModal.tsx`)**:
  - Dynamic API key injection, live connection indicator, and manual sync trigger.
- **Admin Hub & Member Approval (`src/components/admin/AdminManagementModal.tsx`)**:
  - Member management UI (GUEST to MEMBER approval, ADMIN promotion) and one-click JSON database export/import.
- **Vite Bundle Optimization (`vite.config.ts`)**:
  - `manualChunks` vendor code-splitting reducing main application bundle to 133 kB (34 kB gzip).

## [0.1.1] - 2026-08-20

### Added
- **GIS Coordinate Transformation Engine (`src/utils/coordinates.ts`)**:
  - Two-way mathematical conversion between WGS84 GPS (`lat`, `lng`) and static map percentage coordinates (`x_pct`, `y_pct`) for Geoje Island Bounding Box (Lat: 34.665 to 35.045, Lng: 128.400 to 128.755).
  - Navigation URL generators for Kakao Map, Naver Map, and T-Map.
  - 8 default Geoje Points of Interest (POIs) with toggleable overlay layer.
- **100vh Fullscreen Map Viewer (`src/components/MapViewer.tsx`)**:
  - Responsive fit-to-screen scaling with 0px top/bottom margins.
  - 1:1 mouse drag displacement synchronization.
  - Strict bounding clamping preventing dragging beyond map edges.
- **Mobile-First 95vw Navigation Drawer & Calendar Widget (`Sidebar.tsx`, `CalendarWidget.tsx`)**:
  - 95vw responsive slide drawer on mobile screens with search, status filters, and POI lists.
  - Floating top bar trigger and calendar widget highlighting meeting dates.
- **Local-First IndexedDB Layer (`src/services/db.ts`, `backup.ts`)**:
  - Dexie.js persistent client storage with zero-cost initial reads and delta sync support (`lastSyncTimestamp`).
  - Full JSON backup export and import restore tools.
- **Client-Side WebP Compressor (`src/utils/imageCompressor.ts`)**:
  - High-performance canvas-based image resizing (up to 1600px) and WebP compression (150KB~250KB) reducing storage overhead by 98%.
- **Photo Gallery & Lightbox Viewer (`src/components/media/MediaGallery.tsx`)**:
  - Grid thumbnail display with full-screen lightbox modal, keyboard navigation, and download capabilities.
- **YouTube & Shorts Embed Player (`src/components/media/VideoPlayerEmbed.tsx`)**:
  - Automatic regex detection and responsive 16:9 player embedding for standard YouTube and Shorts URLs.
- **Gathering Lifecycle & Interactive RSVP (`GatheringDetailModal.tsx`, `CreateGatheringModal.tsx`)**:
  - 5-stage status transition workflow (`PROPOSED` -> `RECRUITING` -> `CONFIRMED` -> `COMPLETED` -> `CANCELLED`).
  - Interactive RSVP voting (Attending/Declined/Undecided) with live comments and attendee counters.
  - Post-gathering 5-star rating, review submissions, and multi-photo WebP uploads.
- **RBAC Mock Authentication & Dual Versioning (`AuthContext.tsx`, `version.ts`)**:
  - 4 user roles: Unauthenticated, Guest, Member, Admin.
  - Dual versioning combining SemVer and automated cache-busting date tags (`YYYYMMDDvN`).
- **Single Unified CSS & GitHub Pages CI/CD (`app.css`, `.github/workflows/deploy.yml`)**:
  - Glassmorphism, animations, and tokens centralized in `src/styles/app.css`.
  - Automated deployment to `https://iseohyun.github.io/haepungdan/`.
