import { Router } from "express";
import fs from "fs";
import path from "path";
import Papa from "papaparse";

export const fdsRouter = Router();

// POST /fds/load-csv
fdsRouter.post("/load-csv", (req, res) => {
  try {
    const { filePath } = req.body as { filePath: string };

    if (!filePath) {
      return res.status(400).json({ error: "filePath required" });
    }

    const absPath = path.resolve(filePath);

    if (!fs.existsSync(absPath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const csvData = fs.readFileSync(absPath, "utf-8");

    const parsed = Papa.parse(csvData, {
      header: true,
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

// POST /fds/preprocess
fdsRouter.post("/preprocess", (req, res) => {
  try {
    const { dataframeJson } = req.body as { dataframeJson: any[] };

    if (!dataframeJson || !Array.isArray(dataframeJson)) {
      return res.status(400).json({ error: "dataframeJson must be an array" });
    }

    // 기본 전처리: NULL 값 제거, 빈 문자열 처리
    const cleanDataframeJson = dataframeJson
      .map((row) => {
        const cleanRow: any = {};
        for (const [key, value] of Object.entries(row)) {
          if (value !== null && value !== undefined && value !== "") {
            cleanRow[key] = value;
          }
        }
        return cleanRow;
      })
      .filter((row) => Object.keys(row).length > 0);

    // 기본 통계 계산
    const summaryStats: any = {
      totalCount: cleanDataframeJson.length,
      columnCount: cleanDataframeJson.length > 0 ? Object.keys(cleanDataframeJson[0]).length : 0,
      columns: cleanDataframeJson.length > 0 ? Object.keys(cleanDataframeJson[0]) : [],
    };

    // 금액 관련 컬럼 자동 감지 및 통계
    const amountColumns = summaryStats.columns.filter((col: string) =>
      /amount|금액|가격|price|cost/i.test(col)
    );

    if (amountColumns.length > 0) {
      const firstAmountCol = amountColumns[0];
      const amounts = cleanDataframeJson
        .map((row: any) => {
          const val = row[firstAmountCol];
          if (typeof val === "string") {
            return parseFloat(val.replace(/[^\d.-]/g, ""));
          }
          return parseFloat(val) || 0;
        })
        .filter((val: number) => !isNaN(val));

      if (amounts.length > 0) {
        summaryStats.amountStats = {
          column: firstAmountCol,
          min: Math.min(...amounts),
          max: Math.max(...amounts),
          avg: amounts.reduce((a, b) => a + b, 0) / amounts.length,
          total: amounts.reduce((a, b) => a + b, 0),
        };
      }
    }

    // 시간 관련 컬럼 자동 감지
    const timeColumns = summaryStats.columns.filter((col: string) =>
      /time|시간|date|날짜|timestamp/i.test(col)
    );
    if (timeColumns.length > 0) {
      summaryStats.timeColumns = timeColumns;
    }

    return res.json({
      cleanDataframeJson,
      summaryStats,
    });
  } catch (error: any) {
    console.error("Error preprocessing:", error);
    return res.status(500).json({ error: error.message });
  }
});

// POST /fds/anomaly-score
fdsRouter.post("/anomaly-score", async (req, res) => {
  try {
    const { dataframeJson } = req.body as { dataframeJson: any[] };

    if (!dataframeJson || !Array.isArray(dataframeJson)) {
      return res.status(400).json({ error: "dataframeJson must be an array" });
    }

    // TODO: 여기서 ml-service(Python) 호출해서 anomaly_score 추가
    // 현재는 간단한 휴리스틱으로 dummy score 생성
    
    const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";
    
    // Python ML 서비스가 있으면 호출, 없으면 더미 점수 생성
    try {
      // ML 서비스 호출 시도 (선택적)
      const axios = require("axios");
      const response = await axios.post(`${ML_SERVICE_URL}/predict`, {
        records: dataframeJson.map((row) => ({ data: row })),
      });

      const scores = response.data.scores || [];
      const withScore = dataframeJson.map((row, idx) => ({
        ...row,
        anomaly_score: scores[idx] || Math.random(),
      }));

      return res.json({
        dataframeWithScoreJson: withScore,
      });
    } catch (mlError: any) {
      // ML 서비스가 없으면 더미 점수 생성
      console.log("ML service not available, using dummy scores");
      
      const withScore = dataframeJson.map((row) => ({
        ...row,
        anomaly_score: Math.random(), // 0~1 사이 랜덤 점수
      }));

      return res.json({
        dataframeWithScoreJson: withScore,
      });
    }
  } catch (error: any) {
    console.error("Error calculating anomaly scores:", error);
    return res.status(500).json({ error: error.message });
  }
});

