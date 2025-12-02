import { Router } from "express";
import fs from "fs";
import path from "path";

export const reportRouter = Router();

reportRouter.post("/generate-markdown", (req, res) => {
  try {
    const { summaryStats, ruleCandidates, topAnomalies, patterns } = req.body;

    let markdown = `# FDS 이상 거래 분석 리포트\n\n`;
    markdown += `생성 일시: ${new Date().toLocaleString("ko-KR")}\n\n`;

    // 1. 기본 통계
    markdown += `## 1. 기본 통계\n\n`;
    
    if (summaryStats) {
      markdown += `### 거래 현황\n`;
      markdown += `- 총 거래 수: ${summaryStats.totalCount?.toLocaleString() || 0}건\n`;
      markdown += `- 정상 거래: ${summaryStats.normalCount?.toLocaleString() || 0}건\n`;
      markdown += `- 사기 거래: ${summaryStats.fraudCount?.toLocaleString() || 0}건\n`;
      markdown += `- 사기 비율: ${((summaryStats.fraudRatio || 0) * 100).toFixed(2)}%\n\n`;

      markdown += `### 금액 통계\n`;
      markdown += `- 최소 금액: ${Math.round(summaryStats.minAmount || 0).toLocaleString()}원\n`;
      markdown += `- 최대 금액: ${Math.round(summaryStats.maxAmount || 0).toLocaleString()}원\n`;
      markdown += `- 평균 금액: ${Math.round(summaryStats.avgAmount || 0).toLocaleString()}원\n`;
      markdown += `- 중간값: ${Math.round(summaryStats.medianAmount || 0).toLocaleString()}원\n`;
      if (summaryStats.avgFraudAmount) {
        markdown += `- 평균 사기 금액: ${Math.round(summaryStats.avgFraudAmount || 0).toLocaleString()}원\n`;
      }
      markdown += `\n`;

      markdown += `### 시간대 통계\n`;
      markdown += `- 심야 거래 (22시~05시): ${summaryStats.nightCount?.toLocaleString() || 0}건\n`;
      markdown += `- 심야 거래 비율: ${((summaryStats.nightRatio || 0) * 100).toFixed(2)}%\n\n`;
    }

    // 패턴 분석
    if (patterns) {
      markdown += `## 2. 패턴 분석\n\n`;
      markdown += `- 고액 거래 (평균 대비 3배 이상): ${patterns.highAmountTransactions || 0}건\n`;
      markdown += `- 심야 고액 거래: ${patterns.nightHighAmount || 0}건\n`;
      markdown += `- 고위험 이상치 (score > 0.9): ${patterns.highAnomalyScore || 0}건\n`;
      markdown += `- 초고위험 이상치 (score > 0.95): ${patterns.veryHighAnomalyScore || 0}건\n`;
      markdown += `- 실제 사기 거래: ${patterns.fraudTransactions || 0}건\n`;
      markdown += `- 고액 사기 거래: ${patterns.highAmountFraud || 0}건\n\n`;
    }

    // 3. 룰 후보
    markdown += `## 3. FDS 룰 후보\n\n`;

    if (Array.isArray(ruleCandidates) && ruleCandidates.length > 0) {
      ruleCandidates.forEach((rule: any, idx: number) => {
        const riskBadge = getRiskBadge(rule.riskLevel || rule.risk || "MEDIUM");
        const ruleTypeLabel = getRuleTypeLabel(rule.ruleType || "GENERAL");
        
        markdown += `### 룰 ${idx + 1} ${riskBadge} [${ruleTypeLabel}]\n\n`;
        
        if (typeof rule === "object") {
          markdown += `**조건:**\n`;
          markdown += `\`\`\`\n${rule.condition || rule.조건 || "N/A"}\n\`\`\`\n\n`;
          
          markdown += `**설명:**\n`;
          markdown += `${rule.description || rule.설명 || "N/A"}\n\n`;
          
          markdown += `**위험도:** ${rule.riskLevel || rule.risk || rule.위험도 || "MEDIUM"}\n\n`;
          
          if (rule.suggestedThreshold) {
            markdown += `**제안 임계값:** ${rule.suggestedThreshold}\n\n`;
          }
          
          if (rule.ruleType) {
            markdown += `**룰 유형:** ${ruleTypeLabel}\n\n`;
          }
        } else {
          markdown += `${rule}\n\n`;
        }
        
        markdown += `---\n\n`;
      });
    } else if (typeof ruleCandidates === "string") {
      markdown += `${ruleCandidates}\n\n`;
    } else {
      markdown += `\`\`\`json\n${JSON.stringify(ruleCandidates, null, 2)}\n\`\`\`\n\n`;
    }

    // 4. 이상 거래 샘플
    markdown += `## 4. 이상 거래 샘플 (Top ${topAnomalies?.length || 0})\n\n`;

    if (Array.isArray(topAnomalies) && topAnomalies.length > 0) {
      // 주요 컬럼만 선택하여 표시 (Kaggle 데이터 전용)
      const keyColumns = [
        "Time",
        "Amount",
        "amount",
        "hour_bucket",
        "is_night",
        "is_fraud",
        "anomaly_score",
        "Class",
      ];
      
      const availableColumns = keyColumns.filter((col) =>
        topAnomalies[0].hasOwnProperty(col)
      );
      
      const displayCount = Math.min(10, topAnomalies.length);
      
      if (availableColumns.length > 0) {
        markdown += `| ${availableColumns.join(" | ")} |\n`;
        markdown += `| ${availableColumns.map(() => "---").join(" | ")} |\n`;
        
        topAnomalies.slice(0, displayCount).forEach((anomaly: any) => {
          const values = availableColumns.map((col) => {
            const val = anomaly[col];
            if (val === null || val === undefined) return "-";
            if (typeof val === "object") {
              return JSON.stringify(val).substring(0, 30);
            }
            if (typeof val === "number") {
              return val.toFixed(2);
            }
            return String(val).substring(0, 30);
          });
          markdown += `| ${values.join(" | ")} |\n`;
        });

        if (topAnomalies.length > displayCount) {
          markdown += `\n*(총 ${topAnomalies.length}건 중 ${displayCount}건 표시)*\n\n`;
        }
      } else {
        // 주요 컬럼이 없으면 모든 컬럼 표시
        const headers = Object.keys(topAnomalies[0]);
        markdown += `| ${headers.join(" | ")} |\n`;
        markdown += `| ${headers.map(() => "---").join(" | ")} |\n`;
        
        topAnomalies.slice(0, displayCount).forEach((anomaly: any) => {
          const values = headers.map((h) => {
            const val = anomaly[h];
            if (typeof val === "object") {
              return JSON.stringify(val).substring(0, 30);
            }
            return String(val || "").substring(0, 30);
          });
          markdown += `| ${values.join(" | ")} |\n`;
        });
      }
    } else {
      markdown += `이상 거래 샘플이 없습니다.\n\n`;
    }

    markdown += `\n---\n\n`;
    markdown += `*본 리포트는 AI 에이전트에 의해 자동 생성되었습니다.*\n`;

    // 리포트 파일 저장
    const reportsDir = path.resolve("reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outPath = path.resolve(reportsDir, `fds-report-${timestamp}.md`);
    fs.writeFileSync(outPath, markdown, "utf-8");

    res.json({ markdown, filePath: outPath });
  } catch (error: any) {
    console.error("Error generating report:", error);
    return res.status(500).json({ error: error.message });
  }
});

function getRiskBadge(riskLevel: string): string {
  const risk = riskLevel.toUpperCase();
  if (risk === "HIGH") return "🔴 HIGH";
  if (risk === "MEDIUM") return "🟡 MEDIUM";
  if (risk === "LOW") return "🟢 LOW";
  return risk;
}

function getRuleTypeLabel(ruleType: string): string {
  const typeMap: { [key: string]: string } = {
    HIGH_AMOUNT: "고액 거래",
    NIGHT_PATTERN: "심야 패턴",
    ANOMALY_SCORE: "이상치 점수",
    TIME_BURST: "시간 버스트",
    V_FEATURES: "V-features",
    COMBINED: "복합 패턴",
    FRAUD_PATTERN: "사기 패턴",
    NIGHT_PATTERN: "심야 패턴",
    SPIKE_PATTERN: "급증 패턴",
    FAILURE_PATTERN: "실패 패턴",
    LOCATION_PATTERN: "지역 패턴",
    SPEED_PATTERN: "속도 패턴",
    BEHAVIOR_PATTERN: "행동 패턴",
    GENERAL: "일반",
  };
  return typeMap[ruleType] || ruleType;
}
