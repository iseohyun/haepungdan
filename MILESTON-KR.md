# 해풍단(Haepungdan) 프로젝트 개발 설계 및 마일스톤

이 문서는 거제시를 배경으로 하는 소모임 활동(모임 일정, 위치, 인원, 제안서, 참여응답, 후기, 사진/동영상)을 기록하고 추적하기 위한 플랫폼의 상세 기술 명세 및 개발 마일스톤입니다.

---

## 1. 프로젝트 개요 & 호스팅 환경

* **프로젝트명**: 해풍단 (haepungdan)
* **배포 URL**: `https://iseohyun.github.io/haepungdan/` (GitHub Pages)
* **목적**: 소모임 활동 기록, 제안 및 참여 현황 추적, 거제시 지도 기반 아카이빙
* **핵심 아키텍처 원칙**:
  1. **GitHub Pages 호스팅**: 정적 SPA(Single Page Application) 형태로 빌드되어 `index.html` 기반으로 서비스
  2. **DB 비용 최적화 (Local-First Architecture)**:
     - 기본 데이터는 정적 JSON 및 브라우저 **IndexedDB**에 로컬 캐싱
     - 접속 시 전체 데이터를 매번 호출하지 않고, `lastSyncTimestamp` 이후 변경된 **델타(증분) 데이터만 서버에서 조회**하여 Firestore Read 비용 및 트래픽 극소화
  3. **Firebase 키 주입형 설계**: 초기에는 로컬 Mock/IndexedDB로 완벽히 동작하며, 추후 Firebase 설정 키 입력 시 클라우드 동기화 활성화
  4. **비로그인 = 게스트(Guest)**: 비로그인 상태에서도 지도, 캘린더, 모임 기록 조회 가능. 로그인 및 관리자 승인 후 정회원(Member) 활동 가능

---

## 2. 시스템 아키텍처 및 데이터 흐름

```mermaid
graph TD
    subgraph Client [GitHub Pages (정적 SPA 클라이언트)]
        UI[인터랙티브 거제 맵 + 캘린더 위젯 + 상세 드로어]
        CoordEngine[GIS-좌표 상호 변환 엔진]
        SyncEngine[델타 동기화 엔진 (Delta Sync)]
        LocalDB[(로컬 캐시: IndexedDB / Dexie.js)]
        MockService[로컬 Mock / 오프라인 서비스]
    end

    subgraph Cloud [Firebase 클라우드 (선택적 활성화)]
        Auth[Firebase Auth (Google OAuth)]
        Firestore[(Cloud Firestore: 모임/응답/후기)]
        Storage[(Firebase Storage: 최적화 사진)]
    end

    UI <--> CoordEngine
    UI <--> LocalDB
    LocalDB <--> SyncEngine
    SyncEngine <-->|Firebase 연동 시| Firestore
    SyncEngine <-->|오프라인/로컬 모드| MockService
    UI <--> Auth
    UI --> Storage
```

---

## 3. 정적 지도(`source/map.jpg`) 및 GIS 좌표계 명세

첨부해주신 거제도 정적 지도 POI 오버레이 시스템 명세에 따라, **백분율 상대 좌표(`x_pct`, `y_pct`)와 WGS84 GPS 좌표(`lat`, `lng`) 간의 양방향 자동 변환 엔진**을 탑재합니다.

### 3.1. 지도 이미지 및 Bounding Box 메타데이터
* **Image Aspect Ratio**: $701 \times 820$ (세로형 정적 이미지)
* **Geographic Extent (EPSG:4326 / WGS84)**:
  * North Latitude ($Lat_{max}$): `35.045000`
  * South Latitude ($Lat_{min}$): `34.665000`
  * West Longitude ($Lng_{min}$): `128.400000`
  * East Longitude ($Lng_{max}$): `128.755000`

### 3.2. 좌표 상호 변환 공식
1. **GPS (Lat, Lng) $\rightarrow$ CSS 백분율 위치 (x_pct, y_pct)**:
   $$x\_pct = \left(\frac{Lng - 128.400}{128.755 - 128.400}\right) \times 100$$
   $$y\_pct = \left(\frac{35.045 - Lat}{35.045 - 34.665}\right) \times 100$$

2. **CSS 백분율 위치 (x_pct, y_pct) $\rightarrow$ GPS (Lat, Lng)**:
   $$Lng = 128.400 + \left(\frac{x\_pct}{100}\right) \times (128.755 - 128.400)$$
   $$Lat = 35.045 - \left(\frac{y\_pct}{100}\right) \times (35.045 - 34.665)$$

* **장점**:
  * 지도 위를 클릭하여 핀을 꽂으면 즉시 실제 위경도 GPS가 자동 계산됩니다.
  * 계산된 GPS 좌표를 바탕으로 **카카오맵 / 네이버지도 / T맵 길찾기 링크(외부 URL)**를 모임 상세 화면에서 원클릭으로 열 수 있습니다.

---

## 4. 권한 체계 (RBAC) 및 보안 정책

| 권한 등급 | 설명 | 허용 권한 |
| :--- | :--- | :--- |
| **비로그인** | 로그인하지 않은 모든 방문자 | 지도, 캘린더, 모임 정보, 후기 및 사진 **열람만 가능 (게스트와 동일)** |
| **게스트 (Guest)** | 구글 로그인 직후 승인 대기 상태 | 열람 가능 + '정회원 승인 요청' 상태 표시 |
| **정회원 (Member)** | 관리자에게 승인받은 회원 | 제안서 등록, 참여 응답(RSVP 참석/불참), 참여 후기 작성, 사진 업로드 |
| **관리자 (Admin)** | 최초 개설자 및 승인 권한자 | 모임 개설/수정/삭제/확정, 회원 등급 승인/관리, 전체 데이터 JSON 내보내기/복구 |

---

## 5. 데이터 스키마 정의 (TypeScript Interface)

```typescript
// 1. 위치 좌표 인터페이스 (백분율 + GPS 하이브리드)
export interface LocationPosition {
  x_pct: number;               // 0.0 ~ 100.0 (map.jpg 오버레이용)
  y_pct: number;               // 0.0 ~ 100.0 (map.jpg 오버레이용)
  lat: number;                 // WGS84 위도 (예: 34.78523)
  lng: number;                 // WGS84 경도 (예: 128.67094)
}

// 2. 모임 데이터
export interface Gathering {
  id: string;
  title: string;
  status: 'PROPOSED' | 'RECRUITING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  dateTime: string;            // ISO 8601 (예: "2026-09-10T14:00:00+09:00")
  locationName: string;        // 장소명 (예: "구조라해수욕장")
  locationDetail?: string;
  position: LocationPosition;  // 정적 맵 & GPS 위치
  proposal: {
    description: string;
    budgetEstimate?: number;
    preparationNotes?: string;
  };
  videoUrls: string[];         // YouTube 링크 목록
  createdBy: string;
  createdAt: string;
  updatedAt: string;           // 델타 동기화 기준
  isDeleted: boolean;          // 소프트 삭제
}

// 3. 참여 응답 (RSVP)
export interface GatheringRSVP {
  id: string;
  gatheringId: string;
  userId: string;
  userName: string;
  userPhotoUrl?: string;
  status: 'ATTENDING' | 'ABSENT' | 'UNDECIDED';
  comment?: string;
  updatedAt: string;
}

// 4. 후기 및 사진
export interface GatheringReview {
  id: string;
  gatheringId: string;
  userId: string;
  userName: string;
  userPhotoUrl?: string;
  content: string;
  rating?: number;
  photos: {
    url: string;
    thumbnailUrl?: string;
    caption?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

// 5. 사용자 프로필
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'GUEST' | 'MEMBER' | 'ADMIN';
  approvedAt?: string;
  createdAt: string;
}
```

---

## 6. 단계별 개발 마일스톤 (Milestone Roadmap)

```text
[M1] GitHub Pages용 프로젝트 셋업 & Mock/IndexedDB 기반 구축
  │
[M2] 거제 지도(map.jpg) 뷰어 + GIS 좌표 변환 엔진 + 캘린더 UI
  │
[M3] 모임 CRUD, RSVP(참여응답) & Delta Sync 로컬 엔진
  │
[M4] 후기, 갤러리(WebP 압축) & 동영상 임베드
  │
[M5] Google Auth / Firebase 어댑터 연동 & GitHub Pages 배포 자동화
```

### Milestone 1: GitHub Pages 환경 구축 및 로컬 스토리지 레이어 (1단계)
* **목표**: Vite + React + TypeScript + Tailwind CSS 기반 정적 SPA 구성 및 로컬 DB 레이어 확립
* **세부 과제**:
  - [x] 프로젝트 초기화 및 GitHub Pages 배포 경로(`base: '/haepungdan/'`) 설정
  - [x] IndexedDB(`Dexie.js`) 로컬 저장소 구축 및 초기 샘플 JSON 데이터 시딩
  - [x] 데이터 읽기 최소화를 위한 `lastSyncTimestamp` 캐시 매니저 작성
  - [x] 로컬 Mock 인증 상태(비로그인/게스트/정회원/관리자 전환 기능) 구현

### Milestone 2: 거제 지도(`map.jpg`) 뷰어 & GIS 엔진 & 캘린더 위젯 (2단계)
* **세부 과제**:
  - [x] `public/map.jpg` 에셋 로딩 및 줌/팬(Zoom & Pan, 마우스 휠/터치 드래그, 100% 밀착, 1:1 드래그 동기화, 엄격 경계 구속) 캔버스 구현
  - [x] Bounding Box 기반 GPS $\leftrightarrow$ 백분율 좌표 변환 유틸리티 함수 및 테스트 작성
  - [x] 지도 위 핀(Marker) 오버레이 렌더링 (모임 상태별 배지 및 펄스 애니메이션)
  - [x] 지도 클릭 시 좌표 자동 취득 및 카카오맵/네이버지도/T맵 길찾기 연동 링크 생성
  - [x] 좌상단 플로팅 캘린더 위젯 개발 (일정 있는 날짜 하이라이트 및 맵 포커스 연동)

### Milestone 3: 모임 라이프사이클 관리 & 참여 응답(RSVP) (3단계)
* **목표**: 모임 제안, 생성/수정, 정회원 참여 응답(RSVP), 데이터 변경분 감지 로직
* **세부 과제**:
  - [x] 모임 개설 모달 (지도 클릭 핀 지정 + 일시 + 제안서 입력 + POI 퀵선택)
  - [x] 모임 상태 전이 관리 (`PROPOSED` $\rightarrow$ `RECRUITING` $\rightarrow$ `CONFIRMED` $\rightarrow$ `COMPLETED` $\rightarrow$ `CANCELLED`)
  - [x] 정회원 RSVP 인터랙션 (참석/불참/미정 버튼 + 코멘트 + 실시간 집계)
  - [x] 비로그인/게스트 접근 제한 가드(안내 팝업 및 권한 안내)

### Milestone 4: 참여 후기, 갤러리 & 비디오 아카이빙 (4단계)
* **목표**: 모임 완료 후 사진 업로드, 갤러리 뷰어, YouTube 동영상 임베드
* **세부 과제**:
  - [x] 모임 상세 모달 UI (모임 정보 / 참석자 목록 / 후기 & 갤러리 탭)
  - [x] 클라이언트 이미지 WebP 압축 및 로컬 업로드 파이프라인 (`imageCompressor.ts`)
  - [x] 모임별 사진 갤러리(Lightbox/슬라이드 뷰) 및 썸네일 그리드 (`MediaGallery.tsx`)
  - [x] YouTube / Shorts URL 입력 시 반응형 임베드 플레이어 렌더링 (`VideoPlayerEmbed.tsx`)

### Milestone 5: Firebase 어댑터 연동, 관리자 도구 & 배포 (5단계)
* **목표**: Firebase Auth(Google 로그인) 및 Firestore/Storage 플러그인 연동, 관리자 승인 UI, GitHub Actions 배포
* **세부 과제**:
  - [x] Firebase 설정 모달/환경변수 주입 레이어 (`firebase.ts`, `FirebaseConfigModal.tsx` 키 입력 시 클라우드 동기화 활성화)
  - [x] Google OAuth 로그인 및 사용자 Role 승인 관리자 페이지 (`AdminManagementModal.tsx`)
  - [x] 로컬 전체 데이터 JSON 다운로드(Export) 및 복구(Import) 백업 도구 (`backup.ts`)
  - [x] GitHub Actions 워크플로우를 통한 GitHub Pages 자동 빌드 & 배포 파이프라인 구축 (`.github/workflows/deploy.yml`)
