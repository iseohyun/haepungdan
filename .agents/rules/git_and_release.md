---
description: Directives for Git workflow, commit conventions, dual versioning (SemVer vs Auto Date Cache-Busting), CHANGELOG drafting, release approval, and GitHub Pages deployment.
---

# Git & Release Directives

## 1. Git Push & Commit Restrictions
- **Do NOT perform automatic `git push`**.
- Execute local `git commit` **ONLY after the user tests the work and provides an explicit success/approval message**.
- Execute `git push` or merge to `main` ONLY when explicitly requested by the user.

## 2. 이원화 버전 관리 체계 (Dual Versioning System)

### A. 일자 기반 캐시 버스팅 태그 (`YYYYMMDDvN`) - [자동 버전업]
- **목적**: 사용자가 브라우저 강제 새로고침(Ctrl+F5 / Hard Refresh)을 하지 않아도 항상 최신 번들 및 스크립트를 즉시 로드할 수 있도록 캐시를 무효화(Cache-Busting)합니다.
- **규칙**: 코드 수정, 기능 추가, 리팩토링 등 **코드 변경 작업이 발생할 때마다 사용자의 별도 동의 없이도 AI가 자동으로 오늘 날짜와 회차(`YYYYMMDDvN`)를 증가 갱신**하여 `src/constants/version.ts`에 즉시 반영합니다.
  - 예: 오늘 첫 수정 시 `20260820v1` $\rightarrow$ 다음 수정 시 `20260820v2` $\rightarrow$ 익일 첫 수정 시 `20260821v1`

### B. 정식 시맨틱 버전 (SemVer `vMAJOR.MINOR.PATCH`) - [사용자 승인제]
- **목적**: 공식 릴리즈 및 마일스톤 완료 버전을 관리합니다.
- **규칙**: AI가 임의로 버전을 상향하지 않으며, **사용자가 작업 결과물을 검토하고 버전(예: `v0.2.0`, `v1.0.0`)을 명시적으로 지정했을 때에만** `package.json`, `src/constants/version.ts`, `CHANGELOG.md`, `CHANGELOG-KR.md`에 일괄 반영합니다.

## 3. CHANGELOG.md & CHANGELOG-KR.md 작성 및 사전 검증 규칙
- 마일스톤 완료, 주요 기능 추가, 또는 릴리즈 준비 시:
  1. **초안 사전 제시 (Draft First)**: 변경 내역 초안(추가된 기능, 변경 사항, 수정된 버그 등)을 먼저 작성하여 대화창에서 사용자에게 제시합니다.
  2. **사용자 승인 후 반영**: 사용자의 명시적인 검토 및 승인을 받은 **이후에만** `CHANGELOG.md` 및 `CHANGELOG-KR.md` 파일에 기록/업데이트합니다.
  3. **형식 준수**: `CHANGELOG-KR.md`는 한국어로 명확하게 기록하며, `CHANGELOG.md`는 표준 Keep-a-Changelog 규격을 준수합니다.

## 4. GitHub Pages CI/CD & Build Pre-check
- Pushing to the `main` branch automatically triggers GitHub Actions (`.github/workflows/deploy.yml`) to build and deploy to `https://iseohyun.github.io/haepungdan/`.
- Before requesting or executing a push to `main`, the AI MUST run `npm.cmd run build` to verify 100% build success and type safety.
