# ML Service

AutoEncoder 기반 이상치 탐지 서비스 (Python/FastAPI)

## 설치

### 가상환경 생성 및 활성화

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**Linux/Mac:**
```bash
python -m venv venv
source venv/bin/activate
```

### 패키지 설치
```bash
pip install -r requirements.txt
```

## 실행

```bash
uvicorn main:app --reload --port 8000
```

또는:

```bash
python main.py
```

서버는 http://localhost:8000 에서 실행됩니다.

API 문서는 http://localhost:8000/docs 에서 확인할 수 있습니다.

## API 엔드포인트

### POST /predict
이상치 점수를 계산합니다.

**요청:**
```json
{
  "records": [
    {"data": {"amount": 100000, "time": "2024-01-01 12:00:00"}},
    ...
  ]
}
```

**응답:**
```json
{
  "scores": [0.1, 0.5, 0.9, ...]
}
```

### POST /predict/batch
배치 형태의 데이터를 받아 이상치 점수를 계산합니다.

**요청:**
```json
[
  {"amount": 100000, "time": "2024-01-01 12:00:00"},
  ...
]
```

**응답:**
```json
{
  "scores": [0.1, 0.5, 0.9, ...]
}
```

### GET /health
서버 상태 확인

## 모델 통합

실제 AutoEncoder 모델을 사용하려면:

1. 모델 파일 준비 (예: `autoencoder_model.pkl`)
2. `main.py`의 `predict` 함수 수정
3. 필요한 전처리 로직 추가

## 개발 참고

- 현재는 더미 랜덤 점수를 반환합니다
- 실제 모델 통합 시 scikit-learn, TensorFlow, PyTorch 등을 사용할 수 있습니다

