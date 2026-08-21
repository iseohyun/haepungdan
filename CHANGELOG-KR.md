# 해풍단 (Haepungdan) 변경 이력 (Changelog)

## [v0.4.8] - 2026-08-21
### 주요 변경 및 개선 사항 (지정주소 모임 사용 횟수 1:1 배타적 매칭 및 중복 카운팅 방지)
- **모임-지정주소 간 1:1 배타적 매칭 집계 적용 (`LocationPresetsModal.tsx`)**:
  - 기존의 장소명 단순 매칭으로 인해 동일한 이름의 여러 프리셋에 1개 모임이 중복 집계(이중 카운팅)되던 현상 완전 해결.
  - 모임당 가장 일치하는 프리셋 1곳에만 배타적으로 매칭하여, 전체 프리셋의 사용 횟수 총합이 실제 모임 개수를 정확히 일치하도록 보정.

## [v0.4.7] - 2026-08-21
### 주요 변경 및 개선 사항 (지정주소 관리 내 최종 수정일자 표시 및 모임 사용 횟수 뱃지 제공)
- **지정주소(집결지) 관리 모달 고도화 (`LocationPresetsModal.tsx`)**:
  - 각 지정주소별 **최종 수정일자(`updatedAt`)**를 `YYYY.MM.DD HH:mm` 형태로 카드 하단에 표시.
  - 활성 모임 DB와 실시간 연동하여 해당 장소가 **모임에서 몇 번 사용되었는지 사용 횟수 뱃지(`🏊 모임 N회 사용` / `0회 (미사용)`)** 실시간 표시.

## [v0.4.6] - 2026-08-21
### 주요 변경 및 개선 사항 (최종 수정 시점 updatedAt 기반 Last-Write-Wins 정밀 동기화 엔진 구축)
- **Last-Write-Wins (LWW) 타임스탬프 1:1 비교 동기화 엔진 구축 (`firebase.ts`)**:
  - 모임(`Gatherings`), 참석투표(`RSVPs`), 후기(`Reviews`), 지정주소(`LocationPresets`) 모든 데이터에 대해 최종 수정 시점(`updatedAt`)을 밀리초 단위로 1:1 비교.
  - **로컬이 더 최신인 경우만**: 서버로 PUSH (업로드)하여 클라우드 최신화.
  - **서버가 더 최신인 경우**: 로컬로 PULL (다운로드)하여 과거 데이터가 서버를 덮어쓰는 동기화 롤백 현상 원천 차단.
  - 모바일에서 수정한 최신 일정이 다른 기기(PC 등)의 구버전 로컬 캐시에 의해 되돌아가는 문제 완벽 해결.

## [v0.4.5] - 2026-08-21
### 주요 변경 및 개선 사항 (미사용 고아 지정주소 업로드 방지 및 로컬/클라우드 자동 영구 삭제 필터링)
- **미사용 지정주소(Orphan Presets) 업로드 원천 차단 및 자동 삭제 (`firebase.ts`, `db.ts`)**:
  - 활성 모임(`gatherings`, `!isDeleted`)에서 참조되거나 사용 중이지 않은 고아 지정주소는 Firebase Firestore 클라우드로의 업로드를 원천 차단.
  - 로컬 IndexedDB 및 Firebase Firestore 서버에 남아있는 미사용 지정주소를 동기화 및 시작 시 자동으로 감지하여 일괄 영구 삭제.
  - 실제로 모임에서 사용 중인 유효한 지정주소만 클라우드와 선별적으로 양방향 동기화.

## [v0.4.4] - 2026-08-21
### 주요 변경 및 개선 사항 (지정주소 마스터 단일화 및 모임 참조 아키텍처 구축, 과거 더미 데이터 전면 삭제)
- **지정주소 마스터(`locationPresets`) 단일 기준(Single Source of Truth) 확립 (`types/index.ts`, `CreateGatheringModal.tsx`, `GatheringDetailModal.tsx`)**:
  - `Gathering`에 `locationPresetId` 필드를 도입하여 모임이 마스터 지정주소를 직접 참조하도록 개편.
  - 지정주소 관리에서 주소나 좌표를 수정하면 해당 장소를 사용하는 모든 모임의 내비게이션 주소가 즉시 일괄 최신화.
  - 모임 개설/수정 화면의 복잡한 장소 병합 연산을 제거하고 `locationPresets`를 직접 구독하도록 단순화.
- **불필요한 DB 시딩 코드 제거 및 과거 더미 데이터 전면 영구 삭제 (`db.ts`, `firebase.ts`)**:
  - `db.ts`의 `seedInitialData()`에서 모임 목록을 긁어 억지 ID(`loc_...`)를 생성하던 자동 마이그레이션 코드 완전 삭제.
  - 과거 테스트용 더미 데이터('매미성', '바람의 언덕', '도장포' 등)를 로컬 IndexedDB 및 Firebase Firestore 클라우드에서 일괄 영구 삭제하는 클린업 로직 적용.

## [v0.4.3] - 2026-08-21
### 주요 변경 및 개선 사항 (티맵 모바일 전용 연동 고도화, 안드로이드 Intent 및 iOS Scheme 지원, PC 완전 비활성화)
- **티맵(TMAP) 모바일 앱 연동 및 인텐트 스킴 구현 (`coordinates.ts`, `GatheringDetailModal.tsx`)**:
  - GPS 위경도 기반 즉시 길안내 파라미터(`rGoName`, `rGoX`, `rGoY`) 및 통합검색 스킴 연동.
  - **안드로이드**: 미설치 시 Google Play Store로 자동 이동하는 패키지 인텐트(`com.skt.tmap.ku`) 적용.
  - **iOS**: 커스텀 URL Scheme 실행 및 미설치 시 App Store 자동 이동 Fallback 구현.
- **티맵(TMAP) PC 환경 클릭 비활성화 (`GatheringDetailModal.tsx`, `coordinates.ts`)**:
  - PC 데스크톱 브라우저 환경에서는 티맵 버튼을 완전히 비활성화(`disabled`, `pointer-events-none`)하고 알림 팝업을 제거하여 깔끔한 UI 유지.

## [v0.4.2] - 2026-08-21
### 주요 변경 및 개선 사항 (3단계 위치 안내 우선순위, 지정주소 관리 인터페이스, 네이버 지도 최신 URL 규격, PC 환경 티맵 비활성화 및 모바일 전용 분기)
- **위치 안내 및 길찾기 3단계 우선순위 로직 구축 (`coordinates.ts`, `types/index.ts`, `GatheringDetailModal.tsx`)**:
  - 1순위: 해당 지도 전용 지정주소 (`kakaoAddress`, `naverAddress`, `tmapAddress`)
  - 2순위: 대표 도로명/지번 주소 (`roadAddress`, `address`, `locationDetail`)
  - 3순위: GPS 위경도 좌표 (`34.xxxxx°N, 128.xxxxx°E`)
  - 모임 상세 모달의 장소 카드에 우선순위 판별 뱃지(`지정주소`, `대표주소`, `GPS 좌표`) 실시간 표시.
- **사이드바 [관리 & 설정] 내 지정주소(집결지) 관리 모달 추가 (`LocationPresetsModal.tsx`, `Sidebar.tsx`, `db.ts`, `firebase.ts`)**:
  - 모임 장소별 지정주소(카카오/네이버/티맵), 대표 도로명주소, GPS 좌표를 등록, 수정, 삭제하는 전용 관리 인터페이스 제공.
  - IndexedDB(`locationPresets` 테이블, Schema v4) 및 Firebase Firestore 클라우드 양방향 자동 증분 동기화.
  - 모임 개설 및 수정 시 등록된 지정주소 목록이 드롭다운에 즉시 자동완성 및 주소 필드 영구 저장.
- **네이버 지도 최신 검색 URL 규격 갱신 (`coordinates.ts`)**:
  - 구버전 길찾기 링크에서 최신 통합 검색 규격(`https://map.naver.com/p/search/{주소}?c=15.00,0,0,0,dh`)으로 전면 전환.
- **티맵(T map) PC 환경 비활성화 및 모바일 앱 스킴 전용 분기 (`GatheringDetailModal.tsx`, `coordinates.ts`)**:
  - PC 브라우저(데스크톱)에서는 401 오류를 방지하기 위해 티맵 버튼을 비활성화하고 모바일 앱 전용 안내 툴팁/얼럿 제공.
  - 모바일 환경에서는 `tmap://` 앱 스킴을 통해 티맵 내비게이션 즉시 실행.

## [v0.4.1] - 2026-08-21
### 주요 변경 및 개선 사항 (라이트 모드 전수조사 및 전면 테마 엔진 구축, 텍스트 가독성 및 배경 대비 최적화)
- **라이트(화이트) 모드 전수조사 및 포괄적 테마 엔진 구축 (`app.css`, `tailwind.config.js`)**:
  - `tailwind.config.js`에 `darkMode: 'class'` 명시 활성화.
  - 전역 루트 배경을 라이트 그레이(`bg-slate-100 / #f8fafc`)로 전환.
  - `.glass-panel` 및 `.glass-card`를 94% 투명도 화이트 글래스모피즘으로 전환.
  - 하드코딩된 다크 배경 클래스(`bg-slate-950`, `bg-slate-900`, `bg-slate-800` 등)를 라이트 모드에서 화이트 및 밝은 슬레이트로 전면 자동 전환.
- **텍스트 콘트라스트 및 가독성 100% 확보 (`app.css`)**:
  - 밝은 텍스트(`text-white`, `text-slate-100~400`)를 선명한 다크 텍스트(`#0f172a`, `#1e293b`, `#334155`, `#475569`)로 전환.
  - 솔리드 뱃지 및 프라이머리 버튼 위의 텍스트는 선명한 화이트로 보존.
- **지도 마커 레이블 & 달력 & 폼 컨트롤 라이트 테마 최적화 (`app.css`, `App.tsx`)**:
  - 지도 위 마커 레이블 배경을 화이트 반투명으로 변경하고, 회차 텍스트를 딥 레드로 강조.
  - 달력 요일/날짜 및 모든 폼 인풋창(`input`, `textarea`, `select`)의 라이트 모드 가독성 극대화.

## [v0.4.0] - 2026-08-21
### 주요 변경 및 개선 사항 (레이블 드래그 이동 및 DB 저장, 기하학적 최소 이격거리 보장, 관리자 자물쇠 보정 모드 및 방향키 1px 이동, 상단 툴바 디자인 통일 및 다크/라이트 모드 스위처)
- **마커 레이블 드래그 이동 및 DB 영구 저장 (`MapViewer.tsx`, `App.tsx`, `types/index.ts`)**:
  - 지도 위 레이블을 마우스나 터치로 드래그하여 자유롭게 이동 배치 가능.
  - 드래그 완료 시 이동된 상대 좌표(`labelOffset`)가 IndexedDB 및 Firebase Firestore 클라우드에 실시간 자동 저장되어 새로고침 후에도 유지.
- **레이블 시각 디자인 및 기하학적 최소 1em Border 이격거리 보장 (`MapViewer.tsx`)**:
  - 기본 `font-size`를 18px로 상향하고, 레이블 박스는 50% 반투명(`bg-slate-900/50`, `border-slate-700/50`), 텍스트는 100% 불투명으로 렌더링.
  - 레이블 외곽 border와 마커 사이의 거리가 항상 1em(`labelFontSize` px) 이상 유지되도록 Ray-Box 교차 기반 기하학적 거리 계산 로직 적용.
  - 지도 확대 시 레이블이 마커와 멀어지지 않도록 화면 렌더링 시 실시간 Clamping 적용 (서버 미저장).
- **관리자 전용 마커 보정 자물쇠 모드 & 방향키 1px 정밀 이동 (`MapViewer.tsx`)**:
  - 우상단 컨트롤러에 관리자(`isAdmin`) 전용 자물쇠(`Lock` / `Unlock`) 아이콘 배치.
  - 자물쇠 해제 시 지도 드래그 및 방향키(`←`, `→`, `↑`, `↓`)로 1px씩 정밀 보정 가능하며, 실시간 그림자 마커(Ghost Marker)로 원위치와 이동 위치를 동시 표시.
  - 자물쇠를 다시 잠그면 최종 변동량(`ΔX`, `ΔY`)이 브라우저 콘솔에 상세 출력.
- **실측 변동량(-6px, +8px) 기반 `GEOJE_BOUNDS` 정밀 보정 (`coordinates.ts`)**:
  - 사용자가 조정한 실측 변동량을 반영하여 GIS 좌표 경계값을 역산 갱신(`LAT_MAX=35.057672`, `LNG_MIN=128.392944` 등).
- **상단 좌측 툴바 디자인 통일 & 위경도 토글 & 다크/라이트 모드 스위처 (`TopBar.tsx`, `App.tsx`, `app.css`)**:
  - 5가지 버튼(사이드바, 달력, 지도컨트롤러, 위경도, 테마)의 ON/OFF 시각 스타일 통일.
  - 좌하단 GIS 좌표 표시를 켜고 끌 수 있는 `Crosshair` 토글 버튼 추가.
  - 다크 모드(🌙) / 화이트(라이트) 모드(☀️) 즉시 전환 및 `localStorage` 테마 영구 보관 지원.

## [v0.3.0] - 2026-08-21
### 주요 변경 및 개선 사항 (지도 좌표 정밀 보정, 줌 독립 고정 크기 마커/레이블, 겹침 마커 병합 및 개별 회차 하이라이트, 달력 위젯 네비게이션 전면 개편)
- **거제도 정적 지도 GPS 좌표 정밀 보정 (`coordinates.ts`)**:
  - 마커 2(옥계), 4(조선박물관) 실측 제어점 기반 선형 역산(Regression)을 통해 `GEOJE_BOUNDS`를 정밀 보정하여 실제 지도 픽셀과 GPS 간 오차를 해결.
- **지도 확대/축소 시 마커 및 레이블 1:1 고정 픽셀 크기 유지 (`MapViewer.tsx`)**:
  - Panzoom의 실시간 스케일 값을 역보정(`scale(1 / currentScale)`)하여 지도를 확대/축소해도 마커 점, 연결선, 텍스트 레이블이 항상 일정한 크기로 선명하게 표시.
- **겹침 마커 자동 그룹화 & 분산 레이블 배치 (`MapViewer.tsx`)**:
  - 동일/인접 위치의 마커들을 단일 붉은 점으로 병합하고, 회차 목록을 `1, 3, 5` 형태로 표시.
  - 다른 마커들과의 거리를 고려한 역거리 가중 방향으로 레이블을 분산 배치하고 점선 SVG 라인으로 연결.
- **레이블 내 현재 선택된 회차 붉은색 하이라이트 (`MapViewer.tsx`)**:
  - 병합된 회차 목록 중 현재 활성화된 회차 번호만 붉은색 배경으로 하이라이트 표시 및 각 회차 클릭 시 모임 즉시 선택 지원.
- **달력 위젯 UI 및 네비게이션 전면 개편 (`CalendarWidget.tsx`, `App.tsx`)**:
  - '이전 모임' / '다음 모임' borderless 화살표 네비게이션 도입 (모달 강제 팝업 없이 지도/달력 포커스만 부드럽게 이동).
  - 중간에 현재 선택된 모임의 회차 번호를 붉은색 뱃지로 표시.
  - 모임 선택 시 해당 모임이 있는 연/월(`YYYY.M` 포맷)로 달력 자동 이동 및 모임 날짜를 핑크색으로 하이라이트.
- **최초 접속 시 최신 회차 자동 로딩 및 모달 루프 방지 (`App.tsx`)**:
  - 앱 시작 시 가장 마지막(최신) 회차를 기본 활성화 상태로 로딩하고, 상세 모달 닫기 시 무한 재오픈 루프 방지.

## [v0.2.2] - 2026-08-21
### 주요 변경 및 개선 사항 (Firebase Firestore 실시간 영구 저장 및 양방향 동기화, 모임 개설/수정 폼 전면 개편, 타임존 시차 버그 해결, 더미/임시 코드 완전 정리)
- **Firebase Firestore 실시간 영구 저장 및 양방향 동기화 (`firebase.ts`, `App.tsx`)**:
  - 모임 개설, 수정, 삭제 시 로컬 IndexedDB뿐만 아니라 Firebase Firestore 클라우드에 실시간 반영.
  - 새로고침 시 로컬과 클라우드 간 최신 모임 및 RSVP 데이터를 누락 없이 자동 일괄 동기화.
- **날짜/시간(dateTime) 타임존 시차 왜곡 버그 해결 (`coordinates.ts`, `GatheringDetailModal.tsx`, `CreateGatheringModal.tsx`)**:
  - UTC 문자열 단순 슬라이싱 대신 로컬 시간대 기반 파서(`parseLocalDateTime`) 및 한국 표준시 포맷터(`formatToKoreanIso`)를 도입하여, 수정 창을 열거나 저장할 때마다 9시간씩 시차가 밀리던 버그를 완벽히 해결.
- **모임 개설 및 수정 폼 전면 개편 & 상세 집결위치 직접 입력 모달 분리 (`CreateGatheringModal.tsx`, `GatheringDetailModal.tsx`, `DirectInputModal.tsx`)**:
  - 사용자 편의를 위한 깔끔한 가로/세로 배치 폼 디자인, 회차/일시/상태/장소 아이콘 및 썸네일 업로드 연동.
  - 상세 집결위치 직접 입력 서브 모달 및 GPS 좌표 추출 6단계 가이드 팝업 제공.
  - 등록된 실제 모임 데이터 기반으로 집결위치 및 좌표 자동완성 지원.
- **더미/임시 데이터 및 시딩 코드 완전 박멸 (`initialData.ts`, `db.ts`, `firebase.ts`)**:
  - 하드코딩된 예제 모임 3건 및 초기 6개 거점 프리셋, Firestore의 임시 `locationPresets` 컬렉션 전수 영구 삭제(Hard Delete).
- **해풍단 공식 로고 파비콘(Favicon) 적용 (`index.html`, `public/favicon.svg`)**:
  - 브라우저 탭 아이콘을 해풍단 공식 로고(`Haepungdan-main.png`) 및 파도 벡터(`favicon.svg`)로 교체.


  - GPS 좌표 입력 라벨 우측에 `?` '좌표 추출 방법' 버튼 배치.
  - 클릭 시 구글맵에서 위치 공유 및 링크 복사 후 LLM을 통해 GPS 좌표를 추출하는 6단계 상세 가이드 팝업 제공.
- **모임 개설 시 다음 회차(최대 회차 + 1) 자동 기본 세팅 (`CreateGatheringModal.tsx`)**:
  - 기존 등록된 모임들의 회차(`roundNumber`) 중 가장 큰 값에 `+1`을 자동 계산하여 새 모임 개설 시 기본값으로 세팅.
- **모임 생성 및 수정 폼 전면 개편 (`CreateGatheringModal.tsx`, `GatheringDetailModal.tsx`)**:

  - 사용자 편의를 위한 1줄 1항목 직관적 수직 레이아웃 적용 (회차, 일시, 상태, 장소명, 상세 집결위치, YouTube 링크, 대표 이미지, 상세 설명).
  - 일시 입력 필드 중복 출력 현상 해결 및 각 항목별 대표 아이콘(달력, 상태, 지도 핀, 내비 등) 시각화 보강.
- **상세 집결위치 및 GPS 직접 입력 서브 모달 분리 (`DirectInputModal.tsx`)**:
  - 상세 집결위치 선택 드롭다운에서 '직접 입력하기...' 선택 시 모달 팝업으로 상세 위치 및 GPS 좌표(`위도, 경도`)를 정밀 입력하도록 분리.
  - GPS 좌표 입력 시 위도/경도 자동 판별 및 유효성 검증 실시간 피드백 제공.
- **모임 회차(`roundNumber`) 시스템 및 지도 위 마커 회차 표기 (`MapViewer.tsx`, `Sidebar.tsx`)**:
  - 회차가 입력된 경우 지도 핀에 회차 숫자 표시, `0`회차인 경우 '번개' 마커 및 번개 모임 제목 직접 입력 모드 지원.
  - 정규 회차(`N>0`)의 경우 '제N차 해풍단 바다수영 일정'으로 모임 제목 자동 동기화.
- **국내 3대 지도 내비게이션 마커 딥링크 공식 스키마 적용 (`coordinates.ts`)**:
  - 카카오맵, 네이버지도, 티맵 길찾기 시 해당 GPS 좌표 위치에 마커와 장소명이 정확하게 표시되도록 URL 스키마 표준화.
- **집결위치 프리셋 DB(`locationPresets`) 및 과거 DB 집결위치 자동 목록화 (`db.ts`)**:
  - 기존 등록된 모임 및 기본 집결지 목록을 통합하여 드롭다운에서 원클릭으로 장소 및 좌표를 자동 불러올 수 있도록 구현.
- **TopBar 캘린더 ON/OFF 토글 및 POI 제거/UI 최적화 (`TopBar.tsx`, `Sidebar.tsx`)**:
  - 상단 툴바에 캘린더 ON/OFF 토글 버튼 배치 및 기존 불필요한 POI 요소 정리.

## [v0.2.0] - 2026-08-21

### 신규 기능 및 개선 사항 (글자 제거 클린 지도, Firebase 하이브리드 연동, 관리자 센터 회원 승인제, 번들 최적화)
- **한글 정보가 완전 제거된 고해상도 클린 지도(`public/map.jpg`) 리디자인 & 기존 원본 백업(`public/map.bak`)**:
  - 기존 거제도 지도의 화사한 파스텔 지형 색감, 해안선 굴곡, 부속 섬, 도로망 스타일을 100% 온전하게 보존하면서 한글 지명(`거제시`, `통영시`, `사등면`, `옥포항`, `외도` 등)과 도로 번호 라벨을 완벽하게 제거.
  - 소모임 핀 마커 및 POI 레이어의 시인성과 지도 가독성을 극대화하고 기존 GIS Bounding Box 좌표 변환 공식과의 1:1 완벽 정합 유지.
- **하이브리드 Firebase & Delta Sync 어댑터 엔진 구축 (`src/services/firebase.ts`)**:
  - Firebase 설정이 없는 기본 상태에서는 **100% 로컬 IndexedDB 모드**로 작동하여 네트워크/API 키 없이도 모든 기능이 안정적으로 동작.
  - Firebase 연동 시 Google OAuth 팝업 로그인 활성화 및 로컬 IndexedDB와 Firestore 간 `updatedAt` 기반 **증분 동기화(Delta Sync)**를 수행하여 서버 읽기 비용 0원 유지.
- **Firebase 클라우드 연동 및 수동 동기화 모달 개발 (`src/components/admin/FirebaseConfigModal.tsx`)**:
  - Firebase 웹 앱 키(`apiKey`, `projectId`, `authDomain` 등)를 브라우저 UI에서 직접 입력/저장/해제할 수 있는 연동 제어창 구현.
  - 실시간 클라우드 연결 상태 인디케이터(🟢 연결됨 / 💻 로컬 모드) 및 "즉시 동기화" 기능 탑재.
- **해풍단 관리자 센터 (Admin Hub) 회원 승인제 구축 (`src/components/admin/AdminManagementModal.tsx`)**:
  - 가입 대기 회원(GUEST) $\rightarrow$ 정회원(MEMBER) 원클릭 승인, 정회원 $\rightarrow$ 관리자(ADMIN) 임명 등 역할 기반 권한 제어 UI 구현.
  - IndexedDB 전체 데이터를 손실 없이 원클릭으로 JSON 내보내기(Export) 및 가져오기(Import) 복구할 수 있는 빠른 백업 도구 통합.
- **Vite 번들 청크 분할 및 로딩 성능 최적화 (`vite.config.ts`)**:
  - `manualChunks` 설정을 통해 `react-vendor`, `dexie-vendor`, `firebase-vendor` 청크를 분리.
  - 메인 애플리케이션 번들(`index.js`) 용량을 **133 kB (Gzip 압축 시 34 kB)**로 대폭 경량화하여 초기 진입 속도 획기적 개선.

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
