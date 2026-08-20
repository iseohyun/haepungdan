# 해풍단 (Haepungdan) 변경 이력 (Changelog)

## [v0.1.1] - 2026-08-20
### 신규 기능 및 개선 사항 (거제 GIS 엔진, 100vh 뷰어 & 95vw 사이드바, WebP 압축, YouTube 임베드, RSVP & 후기 갤러리)
- **거제도 정적 지도(`public/map.jpg`) GIS $\leftrightarrow$ 백분율 좌표 변환 엔진 구축 (`src/utils/coordinates.ts`)**:
  - WGS84 EPSG:4326 Bounding Box(위도 $34.665000 \sim 35.045000$, 경도 $128.400000 \sim 128.755000$) 기준 수학적 양방향 변환 공식 구현.
  - 지도 클릭 시 GPS 좌표 자동 산출 및 카카오맵, 네이버지도, T-Map 3종 내비게이션 길찾기 딥링크 생성기 연동.
  - 구조라해수욕장, 바람의언덕, 매미성 등 거제 8대 주요 거점(POI) 기본 탑재 및 POI 레이어 토글 기능 제공.
- **100vh 풀스크린 지도 뷰어 & 1:1 드래그 속도 동기화 & 정밀 경계 이탈 방지 (`src/components/MapViewer.tsx`)**:
  - 반응형 초기 화면 맞춤(Fit to Screen) 알고리즘으로 디바이스 크기에 맞추어 세로축 100% 밀착 및 상하 여백 0px 구현.
  - 꽉 찬 상태 이하로 불필요하게 축소되지 않도록 최소 줌 배율(`minScale`) 잠금 처리.
  - 1:1 마우스 드래그 변위 동기화 및 지도의 상하좌우 끝단에 도달 시 빈 공간이 드러나지 않는 엄격한 뷰포트 구속(Strict Bounding Clamping) 엔진 완성.
- **모바일 95vw 슬림 반응형 네비게이션 드로어 & 좌상단 캘린더 위젯 (`src/components/layout/Sidebar.tsx`, `CalendarWidget.tsx`)**:
  - 모바일 화면에서 너비의 95%(`w-[95vw]`)를 차지하여 풍부한 모임 정보와 필터링을 한눈에 볼 수 있는 슬라이드 드로어 사이드바 구현.
  - 초슬림 상단 트리거 툴바(`TopBar.tsx`) 및 일정 있는 날짜 하이라이트와 지도 좌표 자동 포커스를 지원하는 플로팅 캘린더 위젯 개발.
- **브라우저 로컬 퍼스트(Local-First) IndexedDB 캐시 & 백업 도구 (`src/services/db.ts`, `backup.ts`)**:
  - Dexie.js 기반 0원 읽기 비용 로컬 캐시 레이어 및 `lastSyncTimestamp` 증분(Delta) 쿼리 아키텍처 확립.
  - 전체 로컬 데이터베이스를 손실 없이 JSON 파일로 내보내기(Export) 및 가져오기(Import) 복구 유틸리티 구현.
- **클라이언트 단 100% WebP 이미지 고속 압축 엔진 (`src/utils/imageCompressor.ts`)**:
  - 스마트폰 대용량 원본 사진(10MB+)을 브라우저 캔버스에서 최대 1600px, 150KB~250KB 내외의 고품질 WebP로 즉시 변환하여 스토리지 용량 98% 절감.
  - 썸네일(320px) 생성 및 다중 사진 업로드 시 실시간 압축 진행률 인디케이터 제공.
- **사진 갤러리 & 풀스크린 라이트박스(Lightbox) 뷰어 (`src/components/media/MediaGallery.tsx`)**:
  - 모임 후기 및 대표 사진 썸네일 그리드 렌더링.
  - 이전/다음 사진 넘김, 키보드 방향키/ESC 닫기, 원본 다운로드를 지원하는 풀스크린 모달 라이트박스 구현.
- **YouTube 및 Shorts 반응형 동영상 플레이어 (`src/components/media/VideoPlayerEmbed.tsx`)**:
  - 일반 유튜브 링크(`youtube.com/watch?v=...`, `youtu.be/...`) 및 유튜브 쇼츠(`youtube.com/shorts/...`) URL 자동 정규식 파싱 및 16:9 반응형 `<iframe>` 플레이어 임베드.
- **모임 라이프사이클 관리 & 실시간 RSVP 투표 & 후기 시스템 (`src/components/GatheringDetailModal.tsx`, `CreateGatheringModal.tsx`)**:
  - 5단계 모임 상태 전이(`PROPOSED` $\rightarrow$ `RECRUITING` $\rightarrow$ `CONFIRMED` $\rightarrow$ `COMPLETED` $\rightarrow$ `CANCELLED`) 관리자/작성자 제어 툴바.
  - 정회원/관리자 전용 원클릭 RSVP(참석/불참/미정) 투표 및 한 줄 코멘트 실시간 집계.
  - 모임 완료 후 별점(1~5점) 및 후기/사진 아카이빙 기능.
- **역할 기반 권한(RBAC) 체계 & 이원화 버전 관리 시스템 (`src/context/AuthContext.tsx`, `src/constants/version.ts`)**:
  - 비로그인(열람전용) / 게스트(승인대기) / 정회원(활동가능) / 관리자(전체관리) 4단계 역할 스위처.
  - 정식 시맨틱 버전(SemVer)과 브라우저 강제 새로고침 없는 일자 기반 자동 캐시버스팅 태그(`YYYYMMDDvN`) 이원화 체계 확립.
- **단일 CSS 일원화 & GitHub Pages 자동 배포 CI/CD 파이프라인 (`src/styles/app.css`, `.github/workflows/deploy.yml`)**:
  - Glassmorphism, 모달 트랜지션, 펄스 애니메이션을 단일 CSS 파일(`app.css`)로 통합.
  - GitHub Actions를 통한 자동 빌드 및 `https://iseohyun.github.io/haepungdan/` 무중단 정적 배포 파이프라인 구축.
