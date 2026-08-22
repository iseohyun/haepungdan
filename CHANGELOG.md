# Changelog

All notable changes to the Haepungdan project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.39] - 2026-08-22

### Added & Improved
- **Expanding Red Circle Pulse Animation for Selected Marker (`MapViewer.tsx`)**:
  - Added an expanding red radar wave ping animation to the selected marker for clear and vibrant visual feedback on the map.

## [0.5.38] - 2026-08-22

### Added & Improved
- **Two-Step Interaction on Sidebar Gathering Selection (`Sidebar.tsx`)**:
  - Clicking an unselected gathering now smoothly focuses the map coordinate without opening the detail modal.
  - Re-clicking an already selected gathering or clicking the 'Details' link opens the full gathering detail modal.

## [0.5.37] - 2026-08-22

### Added & Improved
- **Hide All Title Tooltips When Candidate Selection Popup is Open (`MapViewer.tsx`)**:
  - Automatically hid all existing title labels whenever the multi-event candidate popup is active, ensuring a distraction-free selection experience.

## [0.5.36] - 2026-08-22

### Added & Improved
- **Remove Numeric Badge on Overlapping Markers (`MapViewer.tsx`)**:
  - Removed the `+N` badge from overlapping markers to retain a clean and minimal dot pin style.

## [0.5.35] - 2026-08-22

### Added & Improved
- **Postpone Event Selection Until User Chooses from Multi-Marker Popup (`MapViewer.tsx`)**:
  - Prevented automatic selection of the latest event when clicking overlapping markers, cleanly postponing event display until a specific gathering is chosen inside the popup.

## [0.5.34] - 2026-08-22

### Added & Improved
- **Prevent Auto-Reopening of Photo Widget on Meeting Change (`App.tsx`)**:
  - Removed forced photo widget dismissal reset from `handleSelectGathering` so that the user's manual OFF state is strictly respected across all gathering selections and auto-cycling.

## [0.5.33] - 2026-08-22

### Added & Improved
- **Candidate Gathering Selection Popup on Overlapping Markers (`MapViewer.tsx`)**:
  - Displayed a `+N` badge on pins with multiple overlapping events.
  - Implemented a floating candidate selection popup on marker click, allowing users to choose and view any specific gathering held at that location.

## [0.5.32] - 2026-08-22

### Added & Improved
- **Pause All Background Animations When Sidebar Menu is Open (`App.tsx`)**:
  - Automatically paused calendar auto-cycling, photo slide rotation, and 3D wave drift whenever the sidebar menu is open.

## [0.5.31] - 2026-08-22

### Added & Improved
- **Added Photo Widget Toggle Button in TopBar (`TopBar.tsx`, `App.tsx`)**:
  - Placed photo toggle icon (`ImageIcon`) immediately next to the calendar button in the vertical TopBar menu.

## [0.5.30] - 2026-08-22

### Added & Improved
- **Admin-Only Management Tab & Reverse Chronological Gathering Sort (`Sidebar.tsx`)**:
  - Restriced 'Management & Settings' tab in the sidebar strictly to administrators (`isAdmin === true`).
  - Sorted gatherings list in reverse chronological order (latest rounds and dates first) so the newest meeting appears at the top.

## [0.5.29] - 2026-08-22

### Added & Improved
- **Pre-fixed Tooltip Border Size and Left-to-Right Typewriter (`MapViewer.tsx`)**:
  - Pre-fixed the tooltip container border to the full target text size using an invisible ghost layout spacer.
  - Pinned title text origin to the left to produce a natural left-to-right typewriter effect without jitter.

## [0.5.28] - 2026-08-22

### Added & Improved
- **Strictly Fixed Marker Title Label Font Size to 1.5em (`MapViewer.tsx`)**:
  - Set fixed inline font size `style={{ fontSize: '1.5em' }}` for the active marker typewriter title tooltip across all screen sizes.

## [0.5.27] - 2026-08-22

### Added & Improved
- **Mobile Photo Size Downscaled 2 Levels & Lifted 10px Up (`App.tsx`)**:
  - Adjusted mobile photo widget width/height to `w-48 h-48` (downscaled 2 levels) and raised bottom offset to `bottom-[58px] sm:bottom-14` (+10px).

## [0.5.26] - 2026-08-22

### Added & Improved
- **Pause All Animations During Photo Lightbox View (`App.tsx`, `CalendarWidget.tsx`)**:
  - Automatically paused calendar auto-cycle sequence, multi-photo slide rotation, and 3D wave drift whenever the full-screen photo lightbox is opened.

## [0.5.25] - 2026-08-22

### Added & Improved
- **Synced Base URL for Public Fallback Asset (`App.tsx`)**:
  - Bound fallback image path with `import.meta.env.BASE_URL` to ensure `public/Haepungdan-drive.png` loads seamlessly in all environments.

## [0.5.24] - 2026-08-22

### Added & Improved
- **Restored Bottom-Left Fixed Positioning for Photo Widget (`MapViewer.tsx`)**:
  - Restored fixed bottom-left coordinates (`bottom-12 sm:bottom-14 left-3 md:left-4`) for the floating photo widget.

## [0.5.23] - 2026-08-22

### Added & Improved
- **Strict Layer Hierarchy Alignment (Map < Photo < Marker Title Label) (`MapViewer.tsx`, `App.tsx`)**:
  - Structured z-indices so that: Base Map Image (z-0) < Photo Card Widget (z-20) < Marker & Typewriter Title Tooltip (z-50/z-9999).

## [0.5.22] - 2026-08-22

### Added & Improved
- **Extended CalendarWidget Right Offset (`CalendarWidget.tsx`)**:
  - Adjusted left offset to `left-[68px] md:left-[78px]` to ensure clearly visible rightward spacing from the TopBar.

## [0.5.21] - 2026-08-22

### Added & Improved
- **Embedded Photo Widget into MapViewer Overlay Layer (`MapViewer.tsx`, `App.tsx`)**:
  - Restored photo widget visibility by embedding it within MapViewer's container as a z-10 floating overlay.
  - Guarantees marker title labels (z-20/z-9999) render perfectly in front of photo cards without any z-index clipping.

## [0.5.20] - 2026-08-22

### Added & Improved
- **Elevated Marker Title Z-Index Above Photo Widget (`App.tsx`)**:
  - Promoted `<main>` map container to `z-20` and set photo widget to `z-10` to guarantee marker title labels always render in front of photo cards when overlapping.

## [0.5.19] - 2026-08-22

### Added & Improved
- **Shifted CalendarWidget 5px to the Right (`CalendarWidget.tsx`)**:
  - Adjusted left offset to `left-[61px] sm:left-[69px]` (+5px) for improved spacing with the vertical top bar.

## [0.5.18] - 2026-08-22

### Added & Improved
- **Highest Z-Index for Marker Title Tooltip (`MapViewer.tsx`)**:
  - Assigned `z-[999]` to selected marker container and `z-[9999]` to typewriter title tooltip to ensure absolute top-level visibility over all other map layers and markers.

## [0.5.17] - 2026-08-22

### Added & Improved
- **Resolved Auto Sequence Cycling Freeze Bug (`CalendarWidget.tsx`)**:
  - Fixed coordinate percent conversion (`gpsToPercent`) and eliminated stale closure in `handleNextMeeting` using refs.
  - Ensures seamless infinite automatic cycling across all gatherings (Lightning -> 1st -> 2nd -> ... -> 10th -> Lightning).

## [0.5.16] - 2026-08-22

### Added & Improved
- **3D Perspective Edge Tilt Physics (rotateX, rotateY, rotateZ) (`App.tsx`)**:
  - Incorporated 3D perspective with dynamic `rotateX` (top/bottom edge lift ±6°), `rotateY` (left/right edge lift ±6°), and `rotateZ` (planar tilt ±5°) for authentic 3D wave floating realism.

## [0.5.15] - 2026-08-22

### Added & Improved
- **Resolved CSS Transform Override on Photo Widget Motion (`app.css`, `App.tsx`)**:
  - Removed transform override in `photoBlurIn` keyframes and separated the positioning container from the dynamic wave motion container.
- **Enhanced Continuous Drifting Wave Physics (`App.tsx`)**:
  - Added directional drift physics across 1-2s randomized intervals with boundary bounce and live console logging.

## [0.5.14] - 2026-08-22

### Added & Improved
- **Dynamic Wave Physics Loop with Realtime Console Logs (`App.tsx`)**:
  - Implemented dynamic JS timer loop transitioning rotation (±5°) and translation (±10px) over randomized 1-2s intervals with live console logs.
- **Robust Fallback Image Guarantee (`App.tsx`)**:
  - Ensured `/Haepungdan-drive.png` placeholder reliably loads for photo-less gatherings.
- **Doubled Marker Title Size, Fixed Center Alignment & Scale Invariance (`MapViewer.tsx`)**:
  - Doubled typewriter label font size (`text-4xl font-black` ~36px) and resolved nested scale and offset issues for perfect marker pin centering and scale invariance.

## [0.5.13] - 2026-08-22

### Added & Improved
- **Enlarged Photo Scales by 2 Steps with Reset Button (`App.tsx`, `MapViewer.tsx`)**:
  - Elevated default photo size by 2 steps (`w-72 sm:w-96` / 288px~384px) and added extra steps up to `w-[480px] sm:w-[680px]` (480px/680px).
  - Added photo size reset button (`RotateCcw`) to the remote control.
- **Enhanced Realistic Wave Float Keyframes (`app.css`)**:
  - Combined ±5° rotation (2s cycle) and ±10px translation (2.5s cycle) for realistic wave physics.
- **Icon-Only Waves Button & Fallback Placeholder Image (`MapViewer.tsx`, `App.tsx`)**:
  - Removed text and rendered clean icon-only `Waves` toggle in remote control.
  - Automatically loads `/Haepungdan-drive.png` when a gathering has no uploaded photos.
- **Doubled Marker Title Font Size with Scale Invariance (`MapViewer.tsx`)**:
  - Enlarged typewriter marker title font size by 2x (`text-2xl font-black`) while keeping its screen scale fixed regardless of map zoom.

## [0.5.12] - 2026-08-22

### Added & Improved
- **Photo Blur Fade-in/Fade-out & Wave Floating Animation (`app.css`, `App.tsx`)**:
  - Implemented blur-to-sharp entrance transition (`blur(12px)` -> `blur(0px)`) and fade-to-blur dismissal.
  - Added wave-like floating card animation (`animate-wave-float`) with a toggle switch on the remote control.
- **Auto-Cycling Multi-Photo Slideshow (`App.tsx`)**:
  - Automatically alternates between primary cover photos every 3.5s with smooth crossfade transitions.
- **Typewriter Title Tooltip Over Selected Map Marker (`MapViewer.tsx`)**:
  - Added a typewriter-animated floating tooltip right above the currently selected gathering marker pin.

## [0.5.11] - 2026-08-22

### Added & Improved
- **Elevated Default Photo Size & Added Extra-Large Zoom Modes (`App.tsx`, `MapViewer.tsx`)**:
  - Set the previous maximum photo widget scale (`w-48 sm:w-64` / 192~256px) as the new default size.
  - Expanded scaling steps up to `w-96 sm:w-[520px]` (384~520px) allowing users to enlarge preview photos much larger via the remote control.

## [0.5.10] - 2026-08-22

### Added & Improved
- **Permanently Calibrated Map Bounds (`coordinates.ts`)**:
  - Applied precise administrator calibration measurements (ΔX = +8.00px [+1.1412%], ΔY = +9.00px [+1.0976%]) directly to `GEOJE_BOUNDS`.
  - Updated bounds: `LNG_MIN = 128.388853, LNG_MAX = 128.747338, LAT_MAX = 35.061810, LAT_MIN = 34.684808`.
  - All gathering location pins are now perfectly aligned with actual coastal topography.

## [0.5.9] - 2026-08-22

### Added & Improved
- **Vertical Left-Aligned TopBar & Inline Calendar Widget Placement (`TopBar.tsx`, `CalendarWidget.tsx`)**:
  - Reorganized TopBar into a sleek vertical panel placed at the top-left corner (`top-3 left-3`).
  - Aligned CalendarWidget directly to the right of the vertical TopBar for a compact, unified header experience.
- **Two-Column Remote Control with Photo Resize Buttons (`MapViewer.tsx`, `App.tsx`)**:
  - Restructured map remote control into a 2-column grid (`grid-cols-2`).
  - Added photo enlarge (`ImagePlus`) and photo shrink (`ImageMinus`) buttons separated by `<hr>` dividers between map reset and calibration lock.

## [0.5.8] - 2026-08-22

### Added & Improved
- **Support Up to 3 Primary Images Per Gathering (`types/index.ts`, `CreateGatheringModal.tsx`, `GatheringDetailModal.tsx`)**:
  - Added `thumbnailUrls: string[]` (max 3 images) to the `Gathering` data schema with full backward compatibility.
  - Enabled multi-image WebP upload and preview grid with order badges and deletion controls in creation & edit modals.
- **Bottom-Left Photo Widget & Fullscreen Lightbox Integration (`App.tsx`, `PhotoLightboxModal.tsx`)**:
  - Added photo count badge overlay to the bottom-left floating widget.
  - Linked all 3 primary images directly into the fullscreen lightbox viewer for seamless slider navigation.

## [0.5.7] - 2026-08-21

### Added & Improved
- **Clean Map Marker Pins (Removed Overlaid Labels) (`MapViewer.tsx`)**:
  - Removed overlaid round number text boxes, dashed connecting lines, and label font size controls.
  - Rendered clean, responsive pin points for gatherings on the map for maximum clarity.
- **Detailed Event Date in Calendar Header & Default Collapsed State (`CalendarWidget.tsx`)**:
  - Displayed full date `{year}.{month + 1}.{day}` of the currently selected gathering in the calendar header.
  - Set the calendar widget to default to a collapsed (slim bar) view to prevent obstructing the map.
- **Auto Meeting Cycle Animation (`CalendarWidget.tsx`)**:
  - Added an auto-play timer that automatically cycles through gatherings in round order.
  - Cycle interval toggle: **"2s (Default)" → "3s" → "0s (Stop)" → "1s" → "2s"**.

## [0.5.6] - 2026-08-21

### Added & Improved
- **Lock-Gated Label Dragging & Responsive (Web/Mobile) Label Offsets (`types/index.ts`, `MapViewer.tsx`)**:
  - Restructured marker label dragging so that it only activates when the admin calibration lock is unlocked (`isCalibrationUnlocked = true`).
  - Implemented independent label offset persistence for Web (`labelOffset`) and Mobile (`labelOffsetMobile`) views.
- **Default UI States & Cleanup (`App.tsx`, `TopBar.tsx`)**:
  - Configured default UI state: **Calendar ON**, **Map Controls OFF**, **GIS Coordinates Overlay OFF**.
  - Removed the mobile quick "Create Gathering" floating bar from the TopBar, consolidating creation actions into the Sidebar.

## [0.5.5] - 2026-08-21

### Added & Improved
- **Fixed & Optimized Marker Label Dragging Interaction (`MapViewer.tsx`)**:
  - Excluded Panzoom intercept on labels using `excludeClass: 'panzoom-exclude'` and full pointer event capture (`onPointerDown`).
  - Removed restrictive `maxCenterDist` boundary clamp to allow full user freedom in dragging labels across map areas.
  - Adjusted drag delta calculations to match unscaled 1:1 screen pixel coordinates.

## [0.5.4] - 2026-08-21

### Added & Improved
- **Photo Widget Dismissal & Fullscreen Lightbox Photo Viewer (`PhotoLightboxModal.tsx`, `App.tsx`)**:
  - Added an `X` close button to the bottom-left floating photo card and ensured auto-dismissal/reset when navigating across gatherings.
  - Clicking the photo card opens a fullscreen lightbox modal supporting previous/next arrows, keyboard navigation (left/right/ESC), touch swipe, and a thumbnail navigation strip.

## [0.5.3] - 2026-08-21

### Added & Improved
- **Bottom-Left Floating Representative Photo Widget for Selected Gathering (`App.tsx`)**:
  - Automatically renders a floating photo card on the bottom-left of the screen when the selected gathering contains a representative thumbnail image.
  - Overlays the gathering round badge and location name, allowing users to click and open the full gathering detail modal.

## [0.5.2] - 2026-08-21

### Added & Improved
- **Added Cloud Resource Link Field and External Blank Window Support (`types/index.ts`, `CreateGatheringModal.tsx`, `GatheringDetailModal.tsx`, `Sidebar.tsx`)**:
  - Added `cloudUrl` field to the gathering model for cloud storage or document links (Google Drive, Notion, OneDrive, etc.).
  - Rendered clickable cloud link using raw values opening in a new tab (`target="_blank"`, `rel="noopener noreferrer"`), with auto-protocol normalization for domain-only inputs.
  - Added cloud badge indicator on gathering list cards in the sidebar.

## [0.5.1] - 2026-08-21

### Added & Improved
- **Removed Bottom Gathering Detail List from Calendar Widget (`CalendarWidget.tsx`)**:
  - Removed the monthly gathering detail list below the calendar grid for a cleaner, more compact floating widget layout.

## [0.5.0] - 2026-08-21

### Added & Improved
- **Purged Mock Dummy Users and Established Real Google OAuth User Management (`initialData.ts`, `db.ts`, `AuthContext.tsx`, `AdminManagementModal.tsx`, `firebase.ts`)**:
  - Removed `MOCK_USERS` and seeded mock data logic completely from the codebase, purging legacy mock user entries locally and on Firestore.
  - Automatically captures and syncs Google OAuth user details (`uid`, `displayName`, `email`, `photoURL`, `lastLoginAt`).
  - Upgraded Admin Hub (`AdminManagementModal.tsx`) with a full user management table allowing real-time role changes (`ADMIN`, `MEMBER`, `GUEST`), recent login timestamp tracking, and user deletion.

## [0.4.9] - 2026-08-21

### Added & Improved
- **Removed Cloud Configuration UI and Hardcoded Auto-Connection (`FirebaseConfigModal.tsx`, `Sidebar.tsx`, `AdminManagementModal.tsx`, `App.tsx`)**:
  - Completely deleted the user-facing Firebase configuration modal and cloud status cards from the UI.
  - Hardcoded cloud configuration into the codebase for transparent and secure background synchronization.
  - Cleaned up unused localStorage config methods in `FirebaseService`.

## [0.4.8] - 2026-08-21

### Added & Improved
- **1:1 Exclusive Gathering-to-Preset Usage Mapping (`LocationPresetsModal.tsx`)**:
  - Replaced naive name filtering with 1:1 exclusive mapping to prevent multi-matching double counting across presets with identical names.
  - Guarantees each gathering is mapped to at most one preset, ensuring the sum of usage counts never exceeds the actual active gathering count.

## [0.4.7] - 2026-08-21

### Added & Improved
- **Display Last Modified Date & Gathering Usage Badges in Location Presets Modal (`LocationPresetsModal.tsx`)**:
  - Added formatted last modified date (`YYYY.MM.DD HH:mm`) on each location preset card.
  - Added live usage count badges (`🏊 모임 N회 사용` / `0회 (미사용)`) reflecting real-time gathering associations.

## [0.4.6] - 2026-08-21

### Added & Improved
- **Last-Write-Wins (LWW) Timestamp Comparison Sync Engine (`firebase.ts`)**:
  - Implemented millisecond-precise `updatedAt` comparison across gatherings, RSVPs, reviews, and location presets.
  - Ensures local changes are only pushed if newer than the server, and server updates are pulled if newer than local data.
  - Completely prevents outdated client cache from overwriting newer updates made from other devices (e.g. mobile admin edits).

## [0.4.5] - 2026-08-21

### Added & Improved
- **Prevent Uploading and Purge Unused Location Presets (`firebase.ts`, `db.ts`)**:
  - Blocked uploading orphan/unused location presets that are not referenced by any active gathering.
  - Automatically deleted unreferenced presets from both local IndexedDB and Firebase Firestore cloud on startup and sync.

## [0.4.4] - 2026-08-21

### Added & Improved
- **Single Source of Truth for Location Presets (`types/index.ts`, `CreateGatheringModal.tsx`, `GatheringDetailModal.tsx`)**:
  - Established `locationPresets` as the master table; gatherings now reference `locationPresetId` directly.
  - Updating a preset automatically and instantaneously updates all navigation links across all gatherings.
  - Simplified location selection by removing complex merge queries and querying `allPresets` directly.
- **Removed Forced Seeding & Purged Legacy Dummy Data (`db.ts`, `firebase.ts`)**:
  - Removed code that forcefully generated `loc_...` presets from gatherings list.
  - Added cleanup routines to purge legacy dummy data ('매미성', '바람의 언덕', etc.) from both local IndexedDB and Firebase Firestore.

## [0.4.3] - 2026-08-21

### Added & Improved
- **Enhanced TMAP Mobile Integration (`coordinates.ts`, `GatheringDetailModal.tsx`)**:
  - Implemented accurate route navigation parameters (`rGoName`, `rGoX`, `rGoY`) and search fallback.
  - Added Android Package Intent (`com.skt.tmap.ku`) with Play Store fallback and iOS custom scheme with App Store fallback.
- **Disabled TMAP Click on PC Browsers (`GatheringDetailModal.tsx`, `coordinates.ts`)**:
  - Fully disabled TMAP button on desktop environments without alert popups for clean UI interaction.

## [0.4.2] - 2026-08-21

### Added & Improved
- **3-Tier Location Guide & Navigation Fallback (`coordinates.ts`, `types/index.ts`, `GatheringDetailModal.tsx`)**:
  - Implemented prioritized location resolution: 1. Map-specific address -> 2. Primary road/jibun address -> 3. GPS coordinates.
  - Displayed live priority badges (`지정주소`, `대표주소`, `GPS 좌표`) in the gathering detail modal.
- **Location Presets Management Modal (`LocationPresetsModal.tsx`, `Sidebar.tsx`, `db.ts`, `firebase.ts`)**:
  - Added dedicated interface to create, edit, search, and delete location presets under the "Settings & Tools" sidebar tab.
  - Bi-directional sync with IndexedDB (v4 schema) and Firebase Firestore `locationPresets`.
  - Auto-completion and address persistence when creating/editing gatherings.
- **Modern Naver Map URL Standard (`coordinates.ts`)**:
  - Upgraded Naver Map links to the latest search standard (`https://map.naver.com/p/search/{query}?c=15.00,0,0,0,dh`).
- **TMAP PC Disabled & Mobile App Scheme Support (`GatheringDetailModal.tsx`, `coordinates.ts`)**:
  - Disabled TMAP button on desktop browsers to prevent 401 unauthorized errors with informative tooltips.
  - Enabled direct `tmap://` app scheme for mobile devices.

## [0.4.1] - 2026-08-21

### Fixed & Improved
- **Comprehensive Light Mode Theme Engine (`app.css`, `tailwind.config.js`)**:
  - Explicitly configured `darkMode: 'class'` in Tailwind config.
  - Overhauled `.glass-panel` and `.glass-card` to high-opacity white glassmorphism.
  - Automatically mapped all hardcoded dark backgrounds (`bg-slate-950/900/800`) to crisp light tones (`#ffffff`, `#f1f5f9`).
  - Adjusted text contrast across all headings, subtitles, labels, and form controls to deep slate colors for 100% legibility.
  - Customized map marker labels, calendar widgets, and modal form inputs for light theme.

## [0.4.0] - 2026-08-21

### Added
- **Draggable Marker Labels & DB Persistence (`MapViewer.tsx`, `App.tsx`, `types/index.ts`)**:
  - Drag and drop marker labels to custom positions with automatic persistence to IndexedDB and Firebase Firestore.
- **Geometric Border Distance Calculation & 18px Default Font (`MapViewer.tsx`)**:
  - Exact 1em minimum spacing calculation based on closest label border to marker center using ray-box intersection.
  - 50% semi-transparent background/border with 100% solid readable text.
  - Scale-clamped rendering distance when zoomed in without overriding saved DB offset.
- **Admin Calibration Lock Mode & 1px Arrow Key Precision (`MapViewer.tsx`)**:
  - Admin-only lock/unlock icon button with live ghost/shadow marker rendering.
  - Fine-grained 1px calibration using keyboard arrow keys with delta summary logged to browser console on lock.
- **Calibrated Geo Bounds from Real Measurement (`coordinates.ts`)**:
  - Recalibrated `GEOJE_BOUNDS` based on real measured displacement (`ΔX = -6px`, `ΔY = +8px`).
- **Unified TopBar Button Group & Dark/Light Mode Switcher (`TopBar.tsx`, `App.tsx`, `app.css`)**:
  - Consistent ON/OFF styling across all 5 toolbar buttons.
  - Added bottom-left GIS overlay toggle button (`Crosshair`).
  - Added Dark (🌙) / Light (☀️) theme switcher with `localStorage` persistence.

## [0.3.0] - 2026-08-21

### Added
- **Calibrated Geographic Bounds (`coordinates.ts`)**:
  - Calibrated `GEOJE_BOUNDS` using real control point regression from markers 2 and 4.
- **Zoom-Invariant Marker & Label Scaling (`MapViewer.tsx`)**:
  - Maintained fixed pixel size for red dot markers, SVG connector lines, and text labels regardless of map zoom level using `scale(1 / currentScale)`.
- **Overlapping Marker Clustering & Directional Offset Labels (`MapViewer.tsx`)**:
  - Merged overlapping POIs into single red dots with combined round number labels (e.g., `1, 3, 5`).
  - Positioned labels away from neighboring markers using inverse distance weighting.
- **Active Round Highlighting in Merged Labels (`MapViewer.tsx`)**:
  - Highlighted the active gathering's round number in red badge style within multi-round labels.
- **Revamped Calendar Widget Navigation & Event Highlight (`CalendarWidget.tsx`, `App.tsx`)**:
  - Borderless previous/next meeting arrow buttons that cycle through gatherings without opening detail modal.
  - Red round number badge in calendar header with `YYYY.M` date format.
  - Pink highlights for gathering dates with auto-navigation to the gathering's month.
- **Initial Load Auto-Selection & Modal Loop Fix (`App.tsx`)**:
  - Automatically loads the latest gathering on initial app launch without triggering infinite modal reopen loops.

## [0.2.2] - 2026-08-21

### Added
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
