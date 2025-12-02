import os
from typing import List, Dict
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# TensorFlow는 선택적 (오류 시 IsolationForest 사용)
try:
    from tensorflow import keras
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False
    print("TensorFlow not available, will use IsolationForest")

# IsolationForest import
from sklearn.ensemble import IsolationForest

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")

# 모델 경로 (두 가지 모델 지원)
AUTOENCODER_PATH = os.path.join(MODEL_DIR, "autoencoder.h5")
ISOLATION_FOREST_PATH = os.path.join(MODEL_DIR, "isolation_forest.joblib")
SCALER_PATH = os.path.join(MODEL_DIR, "scaler.joblib")
FEATURE_PATH = os.path.join(MODEL_DIR, "features.txt")

# 모델/스케일러/피처 로드 (서버 시작 시 한 번만)
model = None
scaler = None
feature_cols = None
model_type = None  # "autoencoder" or "isolation_forest"

def load_model():
    """모델과 스케일러를 로드합니다. AutoEncoder 또는 IsolationForest 중 사용 가능한 것을 사용."""
    global model, scaler, feature_cols, model_type
    
    # 1) AutoEncoder 시도
    if TENSORFLOW_AVAILABLE and os.path.exists(AUTOENCODER_PATH):
        try:
            print("Loading AutoEncoder model...")
            model = keras.models.load_model(AUTOENCODER_PATH)
            scaler = joblib.load(SCALER_PATH)
            
            with open(FEATURE_PATH, "r") as f:
                feature_cols = [line.strip() for line in f.readlines()]
            
            model_type = "autoencoder"
            print(f"AutoEncoder model loaded successfully!")
            print(f"Features ({len(feature_cols)}): {feature_cols[:3]}...{feature_cols[-1]}")
            return True
        except Exception as e:
            print(f"Failed to load AutoEncoder: {e}")
    
    # 2) IsolationForest 시도
    if os.path.exists(ISOLATION_FOREST_PATH):
        try:
            print("Loading IsolationForest model...")
            model = joblib.load(ISOLATION_FOREST_PATH)
            scaler = joblib.load(SCALER_PATH)
            
            with open(FEATURE_PATH, "r") as f:
                feature_cols = [line.strip() for line in f.readlines()]
            
            model_type = "isolation_forest"
            print(f"IsolationForest model loaded successfully!")
            print(f"Features ({len(feature_cols)}): {feature_cols[:3]}...{feature_cols[-1]}")
            return True
        except Exception as e:
            print(f"Failed to load IsolationForest: {e}")
    
    # 3) 모델이 없음
    print("Warning: No model found. Please run train_autoencoder.py or train_isolation_forest.py")
    return False

# 서버 시작 시 모델 로드
model_loaded = load_model()

app = FastAPI(
    title="ML Service", 
    description="AutoEncoder 또는 IsolationForest 기반 이상치 탐지 서비스"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Record(BaseModel):
    data: Dict[str, float]


class PredictRequest(BaseModel):
    records: List[Record]


class PredictResponse(BaseModel):
    scores: List[float]


@app.get("/")
async def root():
    return {
        "message": "ML Service is running",
        "endpoints": ["/predict", "/health"],
        "model_loaded": model_loaded,
        "model_type": model_type if model_loaded else None,
    }


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model_loaded": model_loaded,
        "model_type": model_type if model_loaded else None,
    }


@app.post("/predict", response_model=PredictResponse)
async def predict(req: PredictRequest):
    """
    이상치 점수를 계산합니다.
    
    records: [{ data: { V1: ..., V2: ..., ..., Amount: ... } }, ...]
    """
    if not model_loaded:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Please train the model first using train_autoencoder.py or train_isolation_forest.py"
        )
    
    try:
        # 1) DataFrame으로 변환
        rows = [r.data for r in req.records]
        df = pd.DataFrame(rows)
        
        # 2) Feature 순서 맞추기 (없으면 0으로 채움)
        for col in feature_cols:
            if col not in df.columns:
                df[col] = 0.0
        
        # Feature 순서대로 정렬
        df = df[feature_cols]
        
        # 3) 스케일링
        X = df.values
        X_scaled = scaler.transform(X)
        
        # 4) 모델 타입에 따라 점수 계산
        if model_type == "autoencoder":
            # AutoEncoder로 재구성
            X_pred = model.predict(X_scaled, verbose=0)
            # 재구성 오류(MSE) = anomaly score
            scores = np.mean(np.square(X_scaled - X_pred), axis=1)
        else:
            # IsolationForest
            # decision_function: 낮을수록 이상치, 높을수록 정상
            raw_scores = model.decision_function(X_scaled)
            # 0~1 범위로 정규화 (높을수록 이상치)
            scores = (1 - raw_scores) / 2
            scores = np.clip(scores, 0, 1)
        
        return PredictResponse(scores=scores.tolist())
    except Exception as e:
        print(f"Error in predict: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.post("/predict/batch")
async def predict_batch(records: List[Dict[str, float]]):
    """
    배치 형태의 데이터를 받아 이상치 점수를 계산합니다.
    
    요청:
    [
        {"V1": 1.2, "V2": -0.5, ..., "Amount": 100.0},
        ...
    ]
    
    응답:
    {
        "scores": [0.1, 0.5, 0.9, ...]
    }
    """
    if not model_loaded:
        return {"error": "Model not loaded", "scores": []}
    
    try:
        # DataFrame으로 변환
        df = pd.DataFrame(records)
        
        # Feature 순서 맞추기
        for col in feature_cols:
            if col not in df.columns:
                df[col] = 0.0
        
        df = df[feature_cols]
        
        # 스케일링 및 예측
        X = df.values
        X_scaled = scaler.transform(X)
        
        if model_type == "autoencoder":
            X_pred = model.predict(X_scaled, verbose=0)
            scores = np.mean(np.square(X_scaled - X_pred), axis=1)
        else:
            raw_scores = model.decision_function(X_scaled)
            scores = (1 - raw_scores) / 2
            scores = np.clip(scores, 0, 1)
        
        return {"scores": scores.tolist()}
    except Exception as e:
        print(f"Error in predict_batch: {e}")
        return {"error": str(e), "scores": []}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
