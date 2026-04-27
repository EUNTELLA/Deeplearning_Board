# API 명세서 (v1)

Base URL
```
/api/v1
```

요약
- 주요 리소스: /posts, /predict, /uploads, /stats
- 응답 포맷: JSON (HTML 페이지는 웹 라우트로 별도 제공)
- 필드 네이밍: snake_case
- 날짜/시간: ISO 8601 (예: 2026-04-28T12:34:56Z)

공통 에러 응답 (예시)
```json
{
  "success": false,
  "error": {
    "code": 400,
    "message": "Bad Request",
    "details": null
  }
}
```

인증 / Rate limiting
- 인증: 선택(예: JWT Authorization: Bearer <token>), 필요한 엔드포인트에 표기
- Rate limit: 예시 - 60 requests/min (문서화 권장)

모델 메타데이터(권장 응답 필드)
- model_name, model_version, inference_time_ms

---

## 1. 웹 페이지 라우팅 (HTML)
(웹 서버 템플릿용; API Base URL 적용 없음)
- GET / → 200 HTML (index.html)
- GET /board → 200 HTML (board.html)
- GET /posts/{post_id} → 200 HTML (post detail)

---

## 2. 이미지 분류 API (routers/predict.py)

### [POST] 이미지 분류
POST /api/v1/predict
Headers:
- Content-Type: multipart/form-data
Request (form-data):
- file: (required) image file, field name `file` (max 10MB, allowed: .jpg, .jpeg, .png)
Response 200:
```json
{
  "success": true,
  "filename": "cat.jpg",
  "predicted_class": "cat",
  "confidence": 0.9821,
  "top_k": [
    {"label":"cat","score":0.9821},
    {"label":"dog","score":0.0121}
  ],
  "model": {
    "name": "classifier",
    "version": "v1.0.0"
  },
  "inference_time_ms": 123
}
```
Errors:
- 400: missing file / invalid file type
- 413: payload too large
- 500: model inference failure

---

### [POST] 이미지 업로드 + 분류 + 게시글 자동 생성
POST /api/v1/predict/upload
Headers:
- Content-Type: multipart/form-data
Request (form-data):
- title: string (required)
- content: string (optional)
- image: file (required) field name `image`
Response 201:
```json
{
  "success": true,
  "post_id": 15,
  "prediction": "cat",
  "confidence": 0.98,
  "model": {"name":"classifier","version":"v1.0.0"}
}
```

---

### [GET] 모델 라벨 목록
GET /api/v1/predict/labels
Response 200:
```json
{
  "classes": ["cat","dog","car","person"]
}
```

---

## 3. 게시글 API (routers/post.py)

### [GET] 게시글 목록 (페이징/필터)
GET /api/v1/posts
Query params:
- page: int (default 1)
- size: int (default 10)
- category: string (optional)
Response 200:
```json
{
  "items": [
    {
      "id": 1,
      "title": "고양이 분류 성공",
      "prediction": "cat",
      "confidence": 0.98,
      "created_at": "2026-04-28T12:00:00Z"
    }
  ],
  "page": 1,
  "size": 10,
  "total": 34
}
```

### [GET] 게시글 상세
GET /api/v1/posts/{id}
Response 200:
```json
{
  "id": 1,
  "title": "고양이 분류 성공",
  "content": "테스트 글",
  "image_url": "/uploads/cat.jpg",
  "prediction": "cat",
  "confidence": 0.98,
  "created_at": "2026-04-28T12:00:00Z"
}
```
404: post not found

### [POST] 게시글 생성
POST /api/v1/posts
Headers:
- Content-Type: application/json
Request body:
```json
{
  "title":"새 게시글",
  "content":"내용",
  "image_url":"/uploads/sample.jpg",
  "prediction":"cat",
  "confidence":0.95
}
```
Response 201:
```json
{"success": true, "id": 123}
```
Validation: title required, image_url optional, confidence 0.0-1.0

### [PUT] 게시글 수정
PUT /api/v1/posts/{id}
Request body (partial 허용):
```json
{"title":"수정 제목","content":"수정 내용"}
```
Response 200: {"success": true}

### [DELETE] 게시글 삭제
DELETE /api/v1/posts/{id}
Response 200:
```json
{"success": true, "message": "삭제 완료"}
```

---

## 4. 좋아요 / 추천
POST /api/v1/posts/{id}/like
Response 200:
```json
{"success": true, "likes": 12}
```

---

## 5. 통계 API (대시보드용)
GET /api/v1/stats/classes
Query params (optional):
- start_date, end_date (ISO 8601)
Response 200:
```json
{"cat":34,"dog":20,"car":14}
```

---

## 데이터/응답 스키마 (schemas.py)

PostCreate
- title: string (required)
- content: string (optional)
- image_url: string (optional, 경로)
- prediction: string (optional)
- confidence: float (0.0 - 1.0, optional)

PostResponse
- id: int
- title: string
- content: string
- image_url: string
- prediction: string
- confidence: float
- created_at: datetime (ISO 8601)

PredictResponse
- success: bool
- filename: string
- predicted_class: string
- confidence: float
- top_k: [{label: string, score: float}]
- model: {name:string, version:string}
- inference_time_ms: int

ErrorResponse
- success: false
- error: {code:int, message:string, details:object|null}

---

## 구현/운영 권장사항
- 모든 API는 /api/v1/ 접두사를 사용해 버전 관리
- 요청/응답 예시는 OpenAPI(Swagger)로 작성해 자동 문서화 권장
- 파일 업로드는 저장소 용량, 확장자 검사, 악성 파일 검사 구현
- 민감한 파일 업로드는 인증/ACL 적용
- 모델 버전 관리 및 A/B 테스트 로그 남기기
- 자세한 로깅(요청 id, inference time, model version)으로 문제 추적

---