from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import random

app = FastAPI(title="ML Service", description="AutoEncoder 기반 이상치 탐지 서비스")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Record(BaseModel):
    data: Dict[str, Any]


class PredictRequest(BaseModel):
    records: List[Record]


class PredictResponse(BaseModel):
    scores: List[float]


@app.get("/")
async def root():
    return {"message": "ML Service is running", "endpoints": ["/predict", "/health"]}


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/predict", response_model=PredictResponse)
async def predict(req: PredictRequest):
    """
    이상치 점수를 계산합니다.
    
    현재는 더미 랜덤 점수를 반환합니다.
    실제 AutoEncoder 모델을 사용하려면:
    1. 모델 파일을 로드
    2. 데이터를 전처리
    3. 모델로 예측 수행
    """
    # TODO: 여기서 AutoEncoder 모델 불러서 anomaly score 계산
    # 현재는 dummy random score
    # 
    # 예시:
    # from sklearn.preprocessing import StandardScaler
    # import joblib
    # 
    # model = joblib.load('autoencoder_model.pkl')
    # scaler = StandardScaler()
    # 
    # features = extract_features(req.records)
    # scaled_features = scaler.transform(features)
    # scores = model.predict(scaled_features)
    
    # 더미 점수 생성 (실제로는 모델 추론 결과)
    scores = [random.random() for _ in req.records]
    
    return PredictResponse(scores=scores)


@app.post("/predict/batch")
async def predict_batch(records: List[Dict[str, Any]]):
    """
    배치 형태의 데이터를 받아 이상치 점수를 계산합니다.
    
    요청:
    [
        {"column1": "value1", "column2": "value2", ...},
        ...
    ]
    
    응답:
    {
        "scores": [0.1, 0.5, 0.9, ...]
    }
    """
    scores = [random.random() for _ in records]
    return {"scores": scores}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

