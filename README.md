---
title: ASL Letter Board
emoji: 👋
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
pinned: false
---

# ASL Letter Board

Teachable Machine으로 학습한 ASL 알파벳 이미지 분류 모델을 FastAPI API와 React 화면에 연결한 프로젝트입니다.
이미지 업로드 또는 웹캠 촬영으로 A-Z 알파벳을 예측하고, 결과를 게시판에 저장해 학습 기록처럼 관리할 수 있습니다.

![Teachable Machine 학습 화면](docs/image/teachable_machine_page.png)

## 주요 기능

- Teachable Machine Keras 모델(`keras_model.h5`) 기반 ASL 알파벳 A-Z 분류
- `labels.txt` 기반 클래스 라벨 로딩 및 게시판 필터 자동 생성
- 이미지 업로드, 드래그 앤 드롭, 웹캠 촬영 분석 지원
- 예측 결과 Top 5, 신뢰도, 모델 정보 표시
- 예측 결과 게시판 저장, 목록 조회, 상세 조회
- 게시글 제목 수정 및 삭제
- 단어 학습 페이지 제공
- LOVE, APPLE 단어 이미지 리소스 정리
- SQLite 기반 로컬 데이터 저장

## 화면 구성

<table>
  <tr>
    <td width="50%"><img src="docs/image/start.png" alt="Start screen" width="100%"></td>
    <td width="50%"><img src="docs/image/home.png" alt="Home screen" width="100%"></td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/image/classification.png" alt="Classification screen" width="100%"></td>
    <td width="50%"><img src="docs/image/words.png" alt="Words screen" width="100%"></td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/image/board.png" alt="Board screen" width="100%"></td>
    <td width="50%"></td>
  </tr>
</table>

```text
docs/image/
├─ start.png
├─ home.png
├─ classification.png
├─ words.png
├─ teachable_machine_page.png
└─ board.png
```

주요 화면:

- `/`: 홈 화면
- `/classify`: 알파벳 분류 화면
- `/board`: 저장된 학습 기록 게시판
- `/post/{id}`: 게시글 상세 화면
- `/love-learning`: 단어 학습 화면
- `/webcam-test`: 웹캠 테스트 화면

## 실행 방법

Python 패키지를 설치합니다.

```bash
pip install -r requirements.txt
```

FastAPI 서버를 실행합니다. React 화면은 `frontend/dist` 빌드 결과물을 FastAPI가 함께 제공합니다.

React 화면을 먼저 빌드합니다.

```bash
cd frontend
npm install
npm run build
cd ..
```

그 다음 FastAPI 서버를 실행합니다.

```bash
python -m uvicorn backend.app.main:app --reload
```

브라우저에서 접속합니다.

```text
http://127.0.0.1:8000
```

웹캠 기능은 브라우저 권한이 필요합니다. 권한 요청이 뜨면 허용해야 촬영 분석을 사용할 수 있습니다.

개발 중 React dev server를 따로 실행하려면 아래 명령을 사용합니다. Vite proxy가 `/api`, `/word-images`, `/static` 요청을 FastAPI로 전달합니다.

```bash
cd frontend
npm run dev
```

## 모델 파일

Teachable Machine에서 TensorFlow/Keras 형식으로 내보낸 모델 파일을 아래 위치에 둡니다.

```text
ai/model/keras_model.h5
ai/model/labels.txt
```

`labels.txt`는 Teachable Machine 기본 형식을 지원합니다.

```text
0 A
1 B
2 C
...
25 Z
```

서비스는 라벨 파일을 읽어 예측 결과 이름과 게시판 필터를 구성합니다.

## 단어 학습 이미지

단어 학습용 이미지는 `docs/image/words` 아래에 둡니다.

```text
docs/image/words/
├─ LOVE/
│  ├─ L_01.jpg
│  ├─ O_01.jpg
│  ├─ V_01.jpg
│  └─ E_01.jpg
├─ APPLE/
│  ├─ A_01.jpg
│  ├─ P_01.jpg
│  ├─ P_02.jpg
│  ├─ L_01.jpg
│  └─ E_01.jpg
└─ manifest.json
```

FastAPI는 이 폴더를 `/word-images` 경로로 제공합니다.

예시:

```text
http://127.0.0.1:8000/word-images/LOVE/L_01.jpg
http://127.0.0.1:8000/word-images/APPLE/P_02.jpg
```

APPLE의 두 번째 P는 `APPLE/P_02.jpg`로 지정되어 있습니다.

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

### 라벨 조회

```http
GET /api/v1/predict/labels
```

응답 예시:

```json
{
  "classes": ["A", "B", "C"],
  "count": 3
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
  "title": "ASL A 분류 결과",
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

### 게시글 삭제

```http
DELETE /api/v1/posts/{post_id}
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
├─ docs/
│  └─ image/
│     └─ words/
│        ├─ LOVE/
│        ├─ APPLE/
│        └─ manifest.json
├─ frontend/
│  ├─ src/
│  │  ├─ api/client.js
│  │  ├─ main.jsx
│  │  └─ style.css
│  ├─ static/
│  │  ├─ css/style.css
│  │  └─ images/placeholder.jpg
│  ├─ index.html
│  ├─ package.json
│  ├─ package-lock.json
│  └─ vite.config.js
├─ Dockerfile
├─ requirements.txt
└─ README.md
```

## 배포

이 프로젝트는 Hugging Face Spaces의 Docker 환경에 배포했습니다. Docker 빌드는 React 앱을 먼저 빌드한 뒤, FastAPI가 빌드된 정적 파일과 API를 하나의 서버에서 제공합니다.

https://huggingface.co/spaces/eunzzang/Deeplearning_Board

GitHub Actions는 push 시 기본 검증을 자동으로 수행하기 위해 사용했습니다. 현재는 배포 자동화보다는 CI 확인 용도이며, 추후 GitHub 저장소와 Hugging Face Spaces 배포를 자동 연동할 때 확장할 수 있습니다.

주의:

- 무료 Space는 재시작 시 SQLite 데이터가 초기화될 수 있습니다.
- 장기 저장이 필요하면 별도 데이터베이스나 persistent storage가 필요합니다.
- 첫 빌드는 TensorFlow 설치 때문에 시간이 걸릴 수 있습니다.

## 참고 사항

- 게시글 데이터는 `data/app.db`에 저장됩니다.
- `data/app.db`는 실행 중 자동 생성됩니다.
- 웹캠은 `http://127.0.0.1` 또는 HTTPS 환경에서 안정적으로 동작합니다.
- Teachable Machine 모델 호환을 위해 `tf-keras`를 사용합니다.
- `__pycache__`와 실행 중 생성 파일은 커밋 대상에서 제외하는 것을 권장합니다.
