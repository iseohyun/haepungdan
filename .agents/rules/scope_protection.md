---
description: Guardrails for protecting original high-resolution source assets, roadmap and changelog documents, and workspace integrity.
---

# Scope & Asset Protection Directives

## 1. Protected High-Resolution Assets
- **Protected Static Assets**: Files under `public/` (`public/map.jpg`, `public/Haepungdan-main.png`, `public/Haepungdan-*.png`) are essential production assets.
- **Strict Protection**: Do NOT delete, overwrite with low-res copies, or rename files in `public/`.

## 2. Roadmap & Specification & CHANGELOG Document Protection
- **Milestone Tracking**: `MILESTON-KR.md` serves as the official project roadmap and architectural specification document.
- **Changelog Integrity**: `CHANGELOG.md` and `CHANGELOG-KR.md` record the project's official version history and must be maintained according to `git_and_release.md`.
- **Integrity**: Do NOT delete or arbitrarily modify these documents without explicit instructions and review from the user.

## 3. Clean Workspace Maintenance
- Do NOT commit generated build artifacts (`dist/`) or package caches (`node_modules/`) to git repository tracking.
