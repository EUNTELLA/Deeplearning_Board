# Deeplearning Board

Teachable Machine으로 만든 이미지 분류 모델을 FastAPI 웹 서비스에 연결한 데모 프로젝트입니다.  
이미지 파일 업로드 또는 웹캠 촬영으로 예측을 실행하고, 결과를 게시판에 저장한 뒤 상세 페이지에서 확인할 수 있습니다.

## 주요 기능

- Teachable Machine Keras 모델(`keras_model.h5`) 로딩
- `labels.txt` 기반 클래스 라벨 표시
- 이미지 업로드 후 객체/수화 이미지 분류
- 웹캠으로 촬영한 화면 즉시 분석
- 예측 결과 Top 5와 신뢰도 막대 표시
- 예측 결과 게시판 저장
- 게시글 목록 및 상세 보기
- 상세 페이지에서 제목 수정
- SQLite 기반 게시글 데이터 저장

## UI 구성
![alt text](start.png)
![시작 화면](start.png) -[[home](home.png) - [게시판](board.png) - [상세 페이지](classification.png) 

### 메인 화면 (`/`)

메인 화면은 이미지 분석 작업을 바로 시작할 수 있는 화면입니다.

- 상단에는 핑크 배경과 크림색 드립 형태의 장식 배경이 보입니다.
- 왼쪽 카드에서 이미지를 선택하거나 드래그해서 업로드할 수 있습니다.
- 업로드한 이미지는 별도 미리보기 칸이 아니라 업로드 박스 안에 바로 표시됩니다.
- `웹캠 시작` 버튼으로 카메라를 켜고, `촬영 후 분석`으로 현재 화면을 캡처해 예측할 수 있습니다.
- 예측이 완료되면 오른쪽 결과 카드에 최종 클래스, 신뢰도, Top 5 확률 막대가 표시됩니다.
- `게시글로 저장`을 누르면 결과가 게시판에 저장됩니다.

### 게시판 (`/board`)

저장한 예측 결과를 카드 형태로 확인하는 화면입니다.

- 각 카드에는 이미지, 제목, 예측 클래스, 신뢰도가 표시됩니다.
- 카드 또는 `상세 보기`를 누르면 상세 페이지로 이동합니다.
- 클래스 필터로 특정 예측 클래스만 볼 수 있습니다.

### 상세 페이지 (`/post/{id}`)

저장된 예측 결과를 자세히 확인하는 화면입니다.

- 이미지와 예측 정보를 2열 레이아웃으로 보여줍니다.
- 처음에는 제목과 `수정하기` 버튼만 보입니다.
- `수정하기`를 누르면 제목 입력칸, `저장`, `취소` 버튼이 나타납니다.
- 제목을 수정하면 `PUT /api/v1/posts/{id}` API로 저장됩니다.

## 실행 방법

필요 패키지를 설치합니다.

```bash
pip install -r requirements.txt
```

FastAPI 서버를 실행합니다.

```bash
python -m uvicorn backend.app.main:app --reload
```

브라우저에서 접속합니다.

```text
http://127.0.0.1:8000
```

웹캠 기능은 브라우저 권한이 필요합니다. 웹캠 권한 요청이 뜨면 허용해야 촬영 분석을 사용할 수 있습니다.

## 모델 파일 위치

Teachable Machine에서 TensorFlow/Keras 형식으로 내보낸 파일을 아래 위치에 둡니다.

```text
ai/model/keras_model.h5
ai/model/labels.txt
```

현재 서비스는 `keras_model.h5` 파일명을 기준으로 모델을 로딩합니다.  
라벨 파일은 Teachable Machine 기본 형식인 다음 형태를 지원합니다.

```text
0 A
1 B
2 C
```

## API

### 이미지 예측

```http
POST /api/v1/predict
Content-Type: multipart/form-data
```

요청 필드:

- `file`: jpg, jpeg, png 이미지 파일

응답 예시:

```json
{
  "success": true,
  "filename": "sample.png",
  "predicted_class": "A",
  "confidence": 0.9821,
  "top_k": [
    { "label": "A", "score": 0.9821 },
    { "label": "B", "score": 0.0121 }
  ],
  "model": {
    "name": "keras_model.h5",
    "version": "v1"
  },
  "inference_time_ms": 123
}
```

### 게시글 목록

```http
GET /api/v1/posts
GET /api/v1/posts?category=A
```

### 게시글 상세

```http
GET /api/v1/posts/{post_id}
```

### 게시글 저장

```http
POST /api/v1/posts
Content-Type: application/json
```

요청 예시:

```json
{
  "title": "업로드 이미지 분류 결과",
  "image_url": "data:image/png;base64,...",
  "prediction": "A",
  "confidence": 0.95
}
```

### 게시글 제목 수정

```http
PUT /api/v1/posts/{post_id}
Content-Type: application/json
```

요청 예시:

```json
{
  "title": "수정한 제목"
}
```

## 프로젝트 구조

```text
Deeplearning_Board/
├─ ai/
│  └─ model/
│     ├─ keras_model.h5
│     └─ labels.txt
├─ backend/
│  └─ app/
│     ├─ main.py
│     ├─ routers/
│     │  ├─ pages.py
│     │  ├─ post.py
│     │  └─ predict.py
│     └─ services/
│        ├─ classifier_service.py
│        └─ post_service.py
├─ data/
│  └─ app.db
├─ frontend/
│  ├─ static/
│  │  ├─ css/style.css
│  │  └─ js/
│  │     ├─ board.js
│  │     └─ predict.js
│  └─ templates/
│     ├─ index.html
│     ├─ board.html
│     └─ post_detail.html
├─ requirements.txt
└─ README.md
```

## 데모 시나리오

1. 메인 화면에서 `웹캠 시작`을 누릅니다.
2. 분류할 손동작 또는 객체를 카메라에 보여줍니다.
3. `촬영 후 분석`을 눌러 예측 결과를 확인합니다.
4. Top 5 확률과 최종 예측 클래스를 설명합니다.
5. `게시글로 저장`을 눌러 결과를 저장합니다.
6. 게시판에서 저장된 결과 카드를 확인합니다.
7. 상세 페이지로 이동한 뒤 `수정하기`로 제목을 수정합니다.

## GitHub Actions

`.github/workflows/ci.yml`에 기본 CI 워크플로를 구성했습니다.

CI는 `main`, `master` 브랜치에 push하거나 pull request를 만들 때 실행됩니다.

검증 항목:

- Python 의존성 설치
- 백엔드 Python 파일 compile 검사
- 프론트엔드 JavaScript 문법 검사
- FastAPI 페이지 및 게시글 API smoke test
- 모델 파일과 라벨 파일 존재 여부 확인

CI에서는 속도와 안정성을 위해 TensorFlow 모델 추론까지 실행하지 않습니다.  
실제 모델 추론은 로컬 데모 환경에서 확인합니다.

## 무료 배포

이 프로젝트는 FastAPI, TensorFlow, SQLite를 사용하는 서버형 앱이므로 GitHub Pages에는 그대로 배포할 수 없습니다.  
무료 배포는 Hugging Face Spaces의 Docker Space를 추천합니다.

### Hugging Face Spaces

1. Hugging Face에서 새 Space를 만듭니다.
2. SDK는 `Docker`를 선택합니다.
3. 이 저장소의 파일을 Space 저장소에 push합니다.
4. Space가 `Dockerfile`을 사용해 앱을 빌드합니다.
5. 앱은 기본 포트 `7860`에서 실행됩니다.

배포 후에는 다음 기능을 웹에서 사용할 수 있습니다.

- 이미지 업로드 분석
- 웹캠 촬영 분석
- 예측 결과 표시
- 게시글 저장 및 상세 보기
- 제목 수정

주의 사항:

- 무료 Space의 디스크는 재시작 시 초기화될 수 있으므로 `data/app.db`의 데이터는 장기 보관용으로 보장되지 않습니다.
- 발표 데모용 저장 기능은 사용할 수 있지만, 장기 보관이 필요하면 별도 DB나 유료 persistent storage가 필요합니다.
- 첫 빌드는 TensorFlow 설치 때문에 시간이 걸릴 수 있습니다.

## 참고 사항

- 게시글 데이터는 `data/app.db` SQLite 파일에 저장됩니다.
- `data/app.db`는 실행 중 자동 생성되며 Git에는 포함하지 않습니다.
- 웹캠은 브라우저와 실행 환경에 따라 `http://127.0.0.1` 또는 HTTPS 환경에서만 동작할 수 있습니다.
- Teachable Machine 모델 호환을 위해 `tf-keras`를 사용합니다.
