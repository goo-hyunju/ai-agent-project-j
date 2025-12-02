# ML Service

AutoEncoder 기반 이상치 탐지 서비스 (FastAPI)

## 개요

Kaggle Credit Card Fraud Detection 데이터셋을 기반으로 학습된 AutoEncoder 모델을 사용하여 이상치 점수를 계산하는 서비스입니다.

## 요구사항

- Python 3.11 (Python 3.14는 TensorFlow를 지원하지 않음)
- 약 500MB 이상의 디스크 공간 (모델 저장용)

## 설치

### 1. Python 3.11 설치

**Windows:**
1. https://www.python.org/downloads/release/python-31111/ 접속
2. "Windows installer (64-bit)" 다운로드
3. 설치 시 **반드시 "Add Python 3.11 to PATH" 체크**
4. 설치 완료 후 새 PowerShell 창 열기

**확인:**
```powershell
python --version
# Python 3.11.x 가 표시되어야 함
```

### 2. 가상환경 생성 및 활성화

```powershell
cd ml-service

# 가상환경 생성
python -m venv venv

# 가상환경 활성화 (PowerShell)
.\venv\Scripts\Activate.ps1

# 실행 정책 오류 시
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**가상환경 활성화 확인:**
```powershell
python --version
# Python 3.11.x 가 표시되어야 함
```

### 3. 패키지 설치

가상환경이 활성화된 상태에서:

```powershell
# pip 업그레이드
python -m pip install --upgrade pip setuptools wheel

# 패키지 설치
pip install -r requirements.txt
```

**설치 확인:**
```powershell
python -c "import tensorflow as tf; print('TensorFlow', tf.__version__)"
python -c "import fastapi; print('FastAPI installed')"
```

## 모델 학습

### 데이터 준비

`sample_data/creditcard.csv` 파일이 있어야 합니다.

### 학습 실행

**한 번만 실행 (약 2-5분 소요):**

```powershell
cd ml-service
.\venv\Scripts\Activate.ps1
python train_autoencoder.py
```

**생성되는 파일:**
- `models/autoencoder.h5` - 학습된 AutoEncoder 모델
- `models/scaler.joblib` - StandardScaler
- `models/features.txt` - 피처 순서 (V1~V28, Amount)

**학습 정보:**
- 입력 차원: 29 (V1~V28 + Amount)
- 인코딩 차원: 14
- 구조: 29 → 20 → 14 → 20 → 29
- 손실 함수: MSE (Mean Squared Error)
- 학습 데이터: Class=0 (정상 거래)만 사용

## 서버 실행

### 개발 모드 (자동 리로드)

```powershell
cd ml-service
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000
```

### 프로덕션 모드

```powershell
uvicorn main:app --host 0.0.0.0 --port 8000
```

**서버 접속:**
- API: http://localhost:8000
- Health Check: http://localhost:8000/health
- API 문서: http://localhost:8000/docs

## API 엔드포인트

### POST /predict

이상치 점수를 계산합니다.

**요청:**
```json
{
  "records": [
    {
      "data": {
        "V1": -1.36,
        "V2": -0.07,
        "V3": 0.85,
        ...
        "V28": -0.02,
        "Amount": 149.62
      }
    }
  ]
}
```

**응답:**
```json
{
  "scores": [0.1234, 0.5678, ...]
}
```

점수가 높을수록 이상치 가능성이 높습니다.

### POST /predict/batch

배치 형태의 데이터를 받아 이상치 점수를 계산합니다.

**요청:**
```json
[
  {
    "V1": -1.36,
    "V2": -0.07,
    ...
    "Amount": 149.62
  },
  ...
]
```

**응답:**
```json
{
  "scores": [0.1234, 0.5678, ...]
}
```

### GET /health

서버 상태 및 모델 로드 상태 확인

**응답:**
```json
{
  "status": "ok",
  "model_loaded": true
}
```

## 파일 구조

```
ml-service/
├── train_autoencoder.py    # 모델 학습 스크립트
├── train_isolation_forest.py  # IsolationForest 학습 (대안)
├── main.py                 # FastAPI 서버
├── requirements.txt        # Python 의존성
├── models/                 # 학습된 모델 저장 디렉토리
│   ├── autoencoder.h5      # AutoEncoder 모델
│   ├── scaler.joblib       # StandardScaler
│   └── features.txt        # 피처 순서
└── README.md
```

## 문제 해결

### 모델이 로드되지 않음

**확인 사항:**
1. `models/` 디렉토리에 다음 파일이 있는지 확인:
   - `autoencoder.h5`
   - `scaler.joblib`
   - `features.txt`

2. 파일이 없다면 모델 학습 실행:
```powershell
python train_autoencoder.py
```

### TensorFlow 설치 오류

**Python 버전 확인:**
```powershell
python --version
# Python 3.11.x 가 아니면 재설치 필요
```

**재설치:**
```powershell
pip install --upgrade pip setuptools wheel
pip install tensorflow
```

### 예측 오류

**입력 데이터 확인:**
- V1~V28, Amount 필드가 모두 포함되어 있는지 확인
- 필드 값이 숫자 형식인지 확인
- 누락된 필드가 있으면 0으로 채워짐

### 성능 최적화

**모델 학습 파라미터 조정:**
- `train_autoencoder.py`에서 epoch 수, batch_size, encoding_dim 조정
- GPU 사용 시 TensorFlow GPU 버전 설치

## IsolationForest 대안

TensorFlow 설치에 문제가 있는 경우, IsolationForest를 사용할 수 있습니다:

```powershell
python train_isolation_forest.py
```

`main.py`는 자동으로 두 모델 중 사용 가능한 것을 로드합니다.

## 참고 자료

- [Kaggle Credit Card Fraud Detection](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud)
- [TensorFlow AutoEncoder 가이드](https://www.tensorflow.org/tutorials/generic/autoencoder)
- [FastAPI 문서](https://fastapi.tiangolo.com/)
