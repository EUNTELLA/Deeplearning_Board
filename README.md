# Deeplearning Board

Teachable Machine으로 만든 이미지 분류 모델을 웹에서 실행하고, 예측 결과를 게시판 형태로 확인하는 프로젝트입니다.

과제 목표는 `이미지 입력 -> 딥러닝 분류 실행 -> 예측 결과 표출 -> 데모 가능한 웹 UI 구성`입니다.

## 현재 완료된 부분

- FastAPI 서버 기본 실행 구조 구성
- 프론트엔드 템플릿과 정적 파일 연결
- 메인 화면(`/`) 구성
- 이미지 업로드 UI 구성
- 예측 결과 표시 UI 구성
- 게시판 화면(`/board`) 구성
- 게시글 상세 화면(`/post/{id}`) 구성
- 게시글 목록/상세/저장용 더미 API 구성
- 모델 연결 전 더미 예측 API 구성
- liquid glass 스타일 UI 적용
- 메인 진입 애니메이션 적용
- 게시판 카드 순차 슬라이드 애니메이션 적용

## 앞으로 해야 할 부분

- Teachable Machine 이미지 프로젝트에서 5~10개 클래스 모델 학습
- 각 클래스별 이미지 샘플 수집
- 가능하면 클래스별 200장 이상 확보
- Teachable Machine에서 TensorFlow/Keras 형식으로 모델 내보내기
- `ai/model/model.keras` 또는 `.h5` 모델 파일 교체
- `ai/model/labels.txt` 라벨 파일 교체
- `backend/app/services/classifier_service.py`에서 더미 응답 제거
- 실제 모델 로딩 및 이미지 예측 로직 연결
- 게시판 필터를 실제 라벨 기준으로 변경
- 예측 결과 저장 시 업로드 이미지 저장 방식 정리
- 발표/데모용 시나리오와 테스트 이미지 준비

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

## 주요 화면

- `/` : 이미지 업로드 및 예측 결과 화면
- `/board` : 분류 결과 게시판
- `/post/{id}` : 게시글 상세 화면

## API

현재 API는 모델 연동 전 기본 연결 확인용입니다.

- `POST /api/v1/predict`
  - 이미지 파일을 업로드하면 더미 예측 결과를 반환합니다.
  - 추후 실제 Teachable Machine 모델 추론으로 교체해야 합니다.

- `GET /api/v1/posts`
  - 게시글 목록을 반환합니다.

- `GET /api/v1/posts/{post_id}`
  - 게시글 상세 정보를 반환합니다.

- `POST /api/v1/posts`
  - 예측 결과를 게시글로 저장합니다.

## 프로젝트 구조

```text
Deeplearning_Board/
├── ai/
│   ├── inference.py
│   ├── preprocess.py
│   ├── utils.py
│   └── model/
│       ├── labels.txt
│       └── model.keras
├── backend/
│   └── app/
│       ├── config.py
│       ├── main.py
│       ├── models/
│       │   ├── post.py
│       │   └── schemas.py
│       ├── routers/
│       │   ├── pages.py
│       │   ├── post.py
│       │   └── predict.py
│       └── services/
│           ├── classifier_service.py
│           └── post_service.py
├── data/
│   ├── samples/
│   └── uploads/
├── docs/
├── frontend/
│   ├── static/
│   │   ├── css/
│   │   │   └── style.css
│   │   └── js/
│   │       ├── board.js
│   │       └── predict.js
│   └── templates/
│       ├── board.html
│       ├── index.html
│       └── post_detail.html
├── requirements.txt
└── README.md
```

## 모델 연동 메모

현재 `ai/model/labels.txt`와 `ai/model/model.keras`는 비어 있는 상태입니다.

Teachable Machine에서 모델을 내보낸 뒤 다음 파일을 교체해야 합니다.

- 모델 파일: `ai/model/model.keras` 또는 `ai/model/model.h5`
- 라벨 파일: `ai/model/labels.txt`

그 다음 `classifier_service.py`에서 실제 모델을 로딩하고, 업로드 이미지를 전처리한 뒤 예측 결과를 반환하도록 구현합니다.

## 커밋 메모

현재 UI 및 서버 연결 작업 커밋 메시지 예시는 다음과 같습니다.

```bash
style: enhance UI with glass effects and animations
```
