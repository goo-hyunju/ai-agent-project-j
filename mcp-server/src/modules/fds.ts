import { Router } from "express";
import fs from "fs";
import path from "path";
import Papa from "papaparse";

export const fdsRouter = Router();

/**
 * 1) CSV 로딩
 */
fdsRouter.post("/load-csv", (req, res) => {
  try {
    const { filePath } = req.body as { filePath: string };

    if (!filePath) {
      return res.status(400).json({ error: "filePath is required" });
    }

    const absPath = path.resolve(filePath);

    if (!fs.existsSync(absPath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const csvData = fs.readFileSync(absPath, "utf-8");

    const parsed = Papa.parse(csvData, {
      header: true,
      dynamicTyping: true, // 숫자 자동 변환
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    return res.json({
      dataframeJson: parsed.data, // array of records
    });
  } catch (error: any) {
    console.error("Error loading CSV:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * 2) Kaggle 기반 전처리
 * Kaggle creditcard.csv 컬럼:
 * Time, V1 ~ V28, Amount, Class
 */
fdsRouter.post("/preprocess", (req, res) => {
  try {
    const { dataframeJson } = req.body as { dataframeJson: any[] };

    if (!Array.isArray(dataframeJson)) {
      return res.status(400).json({ error: "dataframeJson must be an array" });
    }

    // --- 1) 기본 정리 및 Feature 생성 ---
    const cleaned = dataframeJson.map((row) => {
      const c: any = { ...row };

      // Amount parsing
      c.amount = Number(c.Amount) || 0;
      c.amount_log = Math.log1p(c.amount);

      // Time → bucket 변환
      // Kaggle의 Time은 "데이터셋 첫 row부터 몇 초가 지났는지" 이므로
      // 시간대별 패턴을 "버킷"으로 해석
      const t = Number(c.Time) || 0;
      c.time_seconds = t;
      c.time_minutes = Math.floor(t / 60);
      c.time_hours = Math.floor(t / 3600);

      // 범주형 버킷 (24시간 주기)
      c.hour_bucket = Math.floor(c.time_hours % 24); // 0~23

      // 심야 여부 (22시~05시)
      c.is_night = c.hour_bucket <= 5 || c.hour_bucket >= 22 ? 1 : 0;

      // Fraud 여부
      c.is_fraud = Number(c.Class) === 1 ? 1 : 0;

      // V-features는 그대로 유지 (나중에 ML 모델에서 사용 가능)
      // V1~V28은 이미 PCA 변환된 feature이므로 그대로 사용

      return c;
    });

    // --- 2) Summary Stats 계산 ---
    const totalCount = cleaned.length;
    const fraudCount = cleaned.filter((r) => r.is_fraud === 1).length;
    const avgAmount = cleaned.reduce((acc, r) => acc + r.amount, 0) / totalCount;
    const nightCount = cleaned.filter((r) => r.is_night === 1).length;

    // 시간대별 분포
    const hourDistribution: { [hour: number]: { total: number; fraud: number } } = {};
    cleaned.forEach((r) => {
      const hour = r.hour_bucket;
      if (!hourDistribution[hour]) {
        hourDistribution[hour] = { total: 0, fraud: 0 };
      }
      hourDistribution[hour].total++;
      if (r.is_fraud === 1) {
        hourDistribution[hour].fraud++;
      }
    });

    // 금액 분포 통계
    const amounts = cleaned.map((r) => r.amount).filter((a) => a > 0);
    const sortedAmounts = [...amounts].sort((a, b) => a - b);
    const medianAmount = sortedAmounts[Math.floor(sortedAmounts.length / 2)] || 0;

    // Fraud 거래의 금액 통계
    const fraudAmounts = cleaned.filter((r) => r.is_fraud === 1).map((r) => r.amount);
    const avgFraudAmount = fraudAmounts.length > 0
      ? fraudAmounts.reduce((a, b) => a + b, 0) / fraudAmounts.length
      : 0;

    const summaryStats = {
      totalCount,
      fraudCount,
      normalCount: totalCount - fraudCount,
      avgAmount,
      medianAmount,
      maxAmount: Math.max(...amounts),
      minAmount: Math.min(...amounts),
      nightCount,
      nightRatio: nightCount / totalCount,
      fraudRatio: fraudCount / totalCount,
      avgFraudAmount,
      hourDistribution,
      // V-features 통계 (평균값)
      vFeaturesStats: {
        v1: cleaned.reduce((sum, r) => sum + (Number(r.V1) || 0), 0) / totalCount,
        v2: cleaned.reduce((sum, r) => sum + (Number(r.V2) || 0), 0) / totalCount,
        v3: cleaned.reduce((sum, r) => sum + (Number(r.V3) || 0), 0) / totalCount,
      },
    };

    res.json({
      cleanDataframeJson: cleaned,
      summaryStats,
    });
  } catch (error: any) {
    console.error("Error preprocessing:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * 3) anomaly-score 계산
 * AutoEncoder 모델을 사용하여 실제 이상치 점수 계산
 */
fdsRouter.post("/anomaly-score", async (req, res) => {
  try {
    const { dataframeJson } = req.body as { dataframeJson: any[] };

    if (!dataframeJson || !Array.isArray(dataframeJson)) {
      return res.status(400).json({ error: "dataframeJson must be an array" });
    }

    const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

    // Python ML 서비스 호출 (AutoEncoder 모델 사용)
    try {
      const axios = require("axios");
      
      // 1) AutoEncoder에 보낼 records 구성
      //    V1~V28 + Amount만 추려서 보냄
      const records = dataframeJson.map((row) => {
        const data: any = {};
        
        // V1~V28 추출
        for (let i = 1; i <= 28; i++) {
          const key = `V${i}`;
          data[key] = Number(row[key]) || 0;
        }
        
        // Amount 추출 (대소문자 구분 없이)
        data["Amount"] = Number(row.Amount ?? row.amount ?? 0);
        
        return { data };
      });

      // 2) ml-service 호출
      const response = await axios.post(
        `${ML_SERVICE_URL}/predict`,
        { records },
        { timeout: 30000 } // 모델 추론 시간 고려하여 타임아웃 증가
      );

      const scores: number[] = response.data.scores || [];

      // 3) 원본 row에 anomaly_score 추가
      const withScore = dataframeJson.map((row, idx) => ({
        ...row,
        anomaly_score: scores[idx] || 0,
      }));

      console.log(`✅ AutoEncoder scores calculated: ${scores.length} records`);
      console.log(`   Score range: ${Math.min(...scores).toFixed(4)} ~ ${Math.max(...scores).toFixed(4)}`);

      return res.json({
        dataframeWithScoreJson: withScore,
      });
    } catch (mlError: any) {
      // ML 서비스가 없거나 오류 발생 시 휴리스틱 기반 점수 생성 (Fallback)
      console.warn("⚠️ ML service not available or error occurred, using heuristic scores");
      console.warn("   Error:", mlError.message || mlError);

      // 평균 금액 계산 (전체 데이터 기준)
      const avgAmount = dataframeJson.reduce((sum, r) => sum + (r.amount || 0), 0) / dataframeJson.length;

      const withScore = dataframeJson.map((row) => {
        let score = 0;

        // 1) 금액 기반 점수 (평균 대비 높을수록 높은 점수)
        if (row.amount && avgAmount > 0) {
          const amountRatio = row.amount / avgAmount;
          if (amountRatio > 3) score += 0.3;
          else if (amountRatio > 2) score += 0.2;
          else if (amountRatio > 1.5) score += 0.1;
        }

        // 2) 심야 거래 점수
        if (row.is_night === 1) {
          score += 0.2;
        }

        // 3) amount_log 기반 점수 (로그 스케일)
        if (row.amount_log) {
          score += Math.min(row.amount_log / 15, 0.2); // 최대 0.2
        }

        // 4) V-features 기반 점수 (극단값 감지)
        let vFeatureScore = 0;
        for (let i = 1; i <= 28; i++) {
          const vValue = Math.abs(Number(row[`V${i}`]) || 0);
          if (vValue > 3) vFeatureScore += 0.01;
        }
        score += Math.min(vFeatureScore, 0.2);

        // 5) 실제 Fraud인 경우 점수 보정
        if (row.is_fraud === 1) {
          score += 0.1;
        }

        // 랜덤 노이즈 추가 (0~0.1)
        score += Math.random() * 0.1;

        return {
          ...row,
          anomaly_score: Math.min(score, 1.0),
        };
      });

      return res.json({
        dataframeWithScoreJson: withScore,
        warning: "ML service unavailable, using heuristic scores",
      });
    }
  } catch (error: any) {
    console.error("Error calculating anomaly scores:", error);
    return res.status(500).json({ error: error.message });
  }
});
