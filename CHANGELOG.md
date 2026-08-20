# Changelog

All notable changes to the Haepungdan project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
