
-프로젝트 구조
-
 ```
 Deeplearning_Board/
-├─ ai/         - AI 관련 스크립트, 모델 학습 및 추론 코드
-├─ backend/    - 서버 및 API (백엔드) 코드
-├─ frontend/   - 웹 프론트엔드 소스
-├─ data/       - 원시 데이터 및 전처리 스크립트
-├─ docs/       - 문서 및 설계 자료
-├─ README.md   - 프로젝트 요약 및 구조 설명
+├── ai/
+│   ├── inference.py
+│   ├── preprocess.py
+│   ├── utils.py
+│   └── model/
+│       ├── labels.txt
+│       └── model.keras
+├── backend/
+│   └── app/
+│       ├── config.py
+│       ├── main.py
+│       ├── models/
+│       │   ├── post.py
+│       │   └── schemas.py
+│       ├── routers/
+│       │   ├── pages.py
+│       │   ├── post.py
+│       │   └── predict.py
+│       └── services/
+│           ├── classifier_service.py
+│           └── post_service.py
+├── data/
+│   ├── samples/
+│   └── uploads/
+├── docs/
+├── frontend/
+│   └── static/
+│       ├── css/
+│       ├── images/
+│       └── js/
+│   └── templates/
+└── README.md
 ```
-
-간단 사용법
-
-- backend/: 서버 실행 및 API 관련 코드
-- frontend/: 프론트엔드 개발 서버 및 빌드 스크립트
-- ai/: 모델 학습과 추론 관련 스크립트
-- data/: 원시 데이터와 전처리 파이프라인
-- docs/: 추가 문서와 가이드
