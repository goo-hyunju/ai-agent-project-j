import os
import pandas as pd
import joblib
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import IsolationForest
import numpy as np

# 1) 데이터 로드
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(BASE_DIR, "..", "sample_data", "creditcard.csv")

print("Loading:", csv_path)

if not os.path.exists(csv_path):
    print(f"Error: CSV file not found at {csv_path}")
    print("Please ensure creditcard.csv is in sample_data/ directory")
    exit(1)

df = pd.read_csv(csv_path)
print(f"Loaded {len(df)} rows")

# 2) Normal (Class=0)만 사용해 IsolationForest 학습
normal_df = df[df["Class"] == 0].copy()
print(f"Normal transactions: {len(normal_df)}")

# 3) 사용할 Feature 선택 (V1~V28 + Amount)
feature_cols = [f"V{i}" for i in range(1, 29)] + ["Amount"]
X = normal_df[feature_cols].values

print(f"Features: {len(feature_cols)}")
print(f"Feature columns: {feature_cols[:5]}...{feature_cols[-1]}")

# 4) 스케일링 (StandardScaler)
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 5) IsolationForest 모델 학습
print("\nTraining IsolationForest...")
# contamination: 이상치 비율 추정 (0.01 = 1%)
# random_state: 재현성을 위해
model = IsolationForest(
    contamination=0.01,  # 데이터의 1%를 이상치로 간주
    random_state=42,
    n_estimators=100,
    max_samples='auto'
)
model.fit(X_scaled)

print("Model training completed!")

# 6) 모델 및 스케일러 저장
model_dir = os.path.join(BASE_DIR, "models")
os.makedirs(model_dir, exist_ok=True)

model_path = os.path.join(model_dir, "isolation_forest.joblib")
scaler_path = os.path.join(model_dir, "scaler.joblib")
feature_path = os.path.join(model_dir, "features.txt")

joblib.dump(model, model_path)
joblib.dump(scaler, scaler_path)

# Feature 순서 기록
with open(feature_path, "w") as f:
    for col in feature_cols:
        f.write(col + "\n")

print("\n" + "=" * 50)
print("Model training completed!")
print(f"Model saved to: {model_path}")
print(f"Scaler saved to: {scaler_path}")
print(f"Features saved to: {feature_path}")
print("=" * 50)

# 7) 검증: 전체 데이터에 대해 점수 계산
print("\nValidating on full dataset...")
all_X = df[feature_cols].values
all_X_scaled = scaler.transform(all_X)
scores = model.score_samples(all_X_scaled)  # 낮을수록 이상치
anomaly_scores = -scores  # 높을수록 이상치로 변환

# Fraud (Class=1)와 Normal (Class=0)의 점수 분포 확인
fraud_scores = anomaly_scores[df["Class"] == 1]
normal_scores = anomaly_scores[df["Class"] == 0]

print(f"\nFraud transactions (Class=1): {len(fraud_scores)}")
print(f"  Mean anomaly score: {fraud_scores.mean():.4f}")
print(f"  Max anomaly score: {fraud_scores.max():.4f}")
print(f"  Min anomaly score: {fraud_scores.min():.4f}")

print(f"\nNormal transactions (Class=0): {len(normal_scores)}")
print(f"  Mean anomaly score: {normal_scores.mean():.4f}")
print(f"  Max anomaly score: {normal_scores.max():.4f}")
print(f"  Min anomaly score: {normal_scores.min():.4f}")

print("\n✅ Training and validation completed successfully!")

