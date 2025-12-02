import { Router } from "express";
import fs from "fs";
import path from "path";

export const logRouter = Router();

/**
 * 로그 파일 로딩
 */
logRouter.post("/load-log", (req, res) => {
  try {
    const { filePath } = req.body as { filePath: string };

    if (!filePath) {
      return res.status(400).json({ error: "filePath is required" });
    }

    const absPath = path.resolve(filePath);

    if (!fs.existsSync(absPath)) {
      return res.status(404).json({ error: "log file not found" });
    }

    const text = fs.readFileSync(absPath, "utf-8");
    const lines = text.split("\n").filter((l) => l.trim());

    return res.json({ lines });
  } catch (error: any) {
    console.error("Error loading log file:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * 로그 파싱
 * 표준 형식: 2025-01-05T02:23:11Z ERROR message - key=value key2=value2
 */
logRouter.post("/parse", (req, res) => {
  try {
    const { lines } = req.body as { lines: string[] };

    if (!Array.isArray(lines)) {
      return res.status(400).json({ error: "lines must be an array" });
    }

    const parsed = lines.map((line) => {
      // 정규식으로 timestamp, level, message 추출
      // 형식: YYYY-MM-DDTHH:mm:ssZ LEVEL message - key=value
      const match = line.match(
        /^(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:Z|[\+\-]\d{2}:\d{2})?)\s+(INFO|WARN|ERROR|DEBUG|FATAL)\s+(.*)$/
      );

      if (!match) {
        // 매칭 실패 시 기본값 반환
        return {
          raw: line,
          timestamp: null,
          level: "UNKNOWN",
          message: line,
          meta: {},
        };
      }

      const [, timestamp, level, rest] = match;

      // 메타데이터 추출 (key=value 형태)
      const meta: any = {};
      const metaMatches = rest.match(/(\w+)=(\S+)/g);
      if (metaMatches) {
        metaMatches.forEach((pair) => {
          const [k, v] = pair.split("=");
          if (k && v) {
            meta[k.trim()] = v.trim();
          }
        });
      }

      // 메시지에서 메타데이터 제거
      let message = rest;
      if (metaMatches) {
        metaMatches.forEach((pair) => {
          message = message.replace(pair, "").trim();
        });
        message = message.replace(/\s*-\s*$/, "").trim(); // 끝의 "-" 제거
      }

      return {
        raw: line,
        timestamp,
        level,
        message,
        meta,
      };
    });

    return res.json({ parsed });
  } catch (error: any) {
    console.error("Error parsing log:", error);
    return res.status(500).json({ error: error.message });
  }
});

/**
 * 로그 통계 생성 (에러 패턴, 빈도, 시간대)
 */
logRouter.post("/stats", (req, res) => {
  try {
    const { parsed } = req.body as { parsed: any[] };

    if (!Array.isArray(parsed)) {
      return res.status(400).json({ error: "parsed must be an array" });
    }

    const counts = {
      total: parsed.length,
      info: parsed.filter((l) => l.level === "INFO").length,
      warn: parsed.filter((l) => l.level === "WARN").length,
      error: parsed.filter((l) => l.level === "ERROR").length,
      debug: parsed.filter((l) => l.level === "DEBUG").length,
      fatal: parsed.filter((l) => l.level === "FATAL").length,
      unknown: parsed.filter((l) => l.level === "UNKNOWN").length,
    };

    // 시간대별 에러 분포 (24시간)
    const hourlyError = new Array(24).fill(0);
    const hourlyWarn = new Array(24).fill(0);
    const hourlyInfo = new Array(24).fill(0);

    parsed.forEach((p) => {
      if (p.timestamp) {
        try {
          const date = new Date(p.timestamp);
          if (!isNaN(date.getTime())) {
            const h = date.getHours();
            if (p.level === "ERROR") hourlyError[h] += 1;
            if (p.level === "WARN") hourlyWarn[h] += 1;
            if (p.level === "INFO") hourlyInfo[h] += 1;
          }
        } catch (e) {
          // 날짜 파싱 실패 시 무시
        }
      }
    });

    // 에러 메시지 패턴 분석 (상위 10개)
    const errorMessages: { [key: string]: number } = {};
    parsed
      .filter((p) => p.level === "ERROR")
      .forEach((p) => {
        const msg = p.message || p.raw;
        // 메시지에서 동적 값 제거 (숫자, ID 등)
        const normalized = msg
          .replace(/\d+/g, "N")
          .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, "UUID")
          .substring(0, 100); // 길이 제한
        errorMessages[normalized] = (errorMessages[normalized] || 0) + 1;
      });

    const topErrorPatterns = Object.entries(errorMessages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([pattern, count]) => ({ pattern, count }));

    // job_id별 에러 집계
    const jobErrors: { [key: string]: number } = {};
    parsed
      .filter((p) => p.level === "ERROR" && p.meta?.job_id)
      .forEach((p) => {
        const jobId = p.meta.job_id;
        jobErrors[jobId] = (jobErrors[jobId] || 0) + 1;
      });

    const topJobErrors = Object.entries(jobErrors)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([jobId, count]) => ({ jobId, count }));

    // device별 에러 집계
    const deviceErrors: { [key: string]: number } = {};
    parsed
      .filter((p) => p.level === "ERROR" && p.meta?.device)
      .forEach((p) => {
        const device = p.meta.device;
        deviceErrors[device] = (deviceErrors[device] || 0) + 1;
      });

    const topDeviceErrors = Object.entries(deviceErrors)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([device, count]) => ({ device, count }));

    // Retry 패턴 분석
    const retryCounts = parsed.filter((p) => p.meta?.retry).length;
    const maxRetry = Math.max(
      ...parsed
        .filter((p) => p.meta?.retry)
        .map((p) => parseInt(p.meta.retry) || 0),
      0
    );

    return res.json({
      counts,
      hourlyError,
      hourlyWarn,
      hourlyInfo,
      topErrorPatterns,
      topJobErrors,
      topDeviceErrors,
      retryStats: {
        retryCounts,
        maxRetry,
      },
    });
  } catch (error: any) {
    console.error("Error calculating log stats:", error);
    return res.status(500).json({ error: error.message });
  }
});

