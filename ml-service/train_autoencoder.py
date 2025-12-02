import os
import pandas as pd
import joblib
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

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

# 2) Normal (Class=0)만 사용해 AutoEncoder 학습
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

X_train, X_val = train_test_split(X_scaled, test_size=0.2, random_state=42)
print(f"Train set: {len(X_train)}, Validation set: {len(X_val)}")

input_dim = X_train.shape[1]

# 5) AutoEncoder 모델 정의
encoding_dim = 14  # 중간 차원 (원래 29 → 14로 축소)

input_layer = keras.Input(shape=(input_dim,))
encoded = layers.Dense(20, activation="relu")(input_layer)
encoded = layers.Dense(encoding_dim, activation="relu")(encoded)
decoded = layers.Dense(20, activation="relu")(encoded)
decoded = layers.Dense(input_dim, activation="linear")(decoded)

autoencoder = keras.Model(inputs=input_layer, outputs=decoded)
autoencoder.compile(optimizer="adam", loss="mse")

print("\nAutoEncoder Architecture:")
autoencoder.summary()

# 6) 학습
print("\nTraining AutoEncoder...")
history = autoencoder.fit(
    X_train,
    X_train,
    epochs=10,  # 처음엔 10 epoch 정도로 가볍게
    batch_size=256,
    shuffle=True,
    validation_data=(X_val, X_val),
    verbose=1
)

# 7) 모델 및 스케일러 저장
model_dir = os.path.join(BASE_DIR, "models")
os.makedirs(model_dir, exist_ok=True)

model_path = os.path.join(model_dir, "autoencoder.h5")
scaler_path = os.path.join(model_dir, "scaler.joblib")
feature_path = os.path.join(model_dir, "features.txt")

autoencoder.save(model_path)
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

# 학습 히스토리 요약
final_train_loss = history.history["loss"][-1]
final_val_loss = history.history["val_loss"][-1]
print(f"\nFinal training loss: {final_train_loss:.6f}")
print(f"Final validation loss: {final_val_loss:.6f}")

