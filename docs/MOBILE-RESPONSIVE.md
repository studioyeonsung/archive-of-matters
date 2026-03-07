# 모바일 반응형 가이드 (여러 기기 대응)

## 현재 상황
- **단일 브레이크포인트**: `768px` 이하를 전부 같은 모바일로 처리 → iPhone XS(375px), SE(320px), 대형 폰(428px)이 동일한 px 값 적용
- **고정 px**: 패딩·위치·폰트가 기기별로 비율이 달라져서 작은 기기에서는 빽빽하고, 큰 기기에서는 여백이 많아짐
- **100vh**: 모바일 브라우저 주소창 표시/숨김 때문에 뷰포트 높이가 바뀌어 스크롤·정렬이 어긋날 수 있음
- **노치/세이프에리어**: iPhone X 이후 기종은 상·하·좌우에 safe area가 있어서 패딩을 줘야 잘리지 않음

## 추천 전략

### 1. **브레이크포인트 하나 더 두기 (작은 폰 전용)**
- `768px` → 태블릿/일반 모바일
- **`400px` 이하** (또는 `390px`) → 작은 폰 전용 (iPhone SE, XS, 12 mini 등)
- 이 구간에서만 패딩 축소, 폰트·아이콘·간격을 조금 더 줄이면 작은 화면에서도 정돈되게 보임

### 2. **고정 px 대신 `clamp()` 사용**
- `padding: 20px` → `padding: 0 clamp(12px, 4vw, 20px);` 처럼 **최소·선호·최대**를 한 번에 지정
- 폰트: `font-size: 38px` → `font-size: clamp(28px, 10vw, 38px);` 처럼 작은 화면에서는 더 작게, 큰 화면에서는 제한
- 이렇게 하면 320px~428px까지 하나의 규칙으로 자연스럽게 스케일됨

### 3. **세이프에리어 반영**
- viewport 메타에 `viewport-fit=cover` 추가
- 상·하·좌우 패딩에 `env(safe-area-inset-top)`, `env(safe-area-inset-bottom)` 등 사용
- 노치/홈 인디케이터 있는 기기에서 콘텐츠가 잘리지 않음

### 4. **높이 단위 보완 (선택)**
- `100vh` 대신 `100dvh`(Dynamic Viewport Height) 사용 시, 주소창 숨김/표시에 따라 높이가 바뀌어도 더 자연스러움
- 구형 브라우저 대비: `min-height: 100vh; min-height: 100dvh;` 처럼 fallback 유지

### 5. **테스트 방법**
- Chrome DevTools: 디바이스 툴바에서 “iPhone SE”, “iPhone XS”, “iPhone 14 Pro Max” 등으로 너비/높이 바꿔가며 확인
- 실제 기기: iPhone XS, SE, 안드로이드 소형 기기에서 한 번씩 스크롤·터치·가독성 확인
- [responsive design mode (Firefox)](https://firefox-source-docs.mozilla.org/devtools-user/responsive_design_mode/) 또는 [Sizzy](https://sizzy.co/) 같은 멀티 뷰포트 툴 활용

## 적용해 둔 수정 요약
- `index.html`: viewport에 `viewport-fit=cover` 추가
- `style.css`: 
  - **작은 모바일** `@media (max-width: 400px)` 블록 추가 (패딩·폰트·간격·화살표 갭 등 조정)
  - 모바일 공통에 `clamp()` 및 `env(safe-area-inset-*)` 적용
- 이렇게 하면 iPhone XS(375px) 포함 작은 기기에서도 레이아웃이 덜 깨지고, 다양한 폰 크기에 맞춰짐
