import { Router } from "express";
import fs from "fs";
import path from "path";

export const reportRouter = Router();

reportRouter.post("/generate-markdown", (req, res) => {
  try {
    const { summaryStats, ruleCandidates, topAnomalies } = req.body;

    let markdown = `# FDS 이상 거래 분석 리포트\n\n`;
    markdown += `생성 일시: ${new Date().toLocaleString("ko-KR")}\n\n`;

    // 1. 기본 통계
    markdown += `## 1. 기본 통계\n\n`;
    markdown += `\`\`\`json\n${JSON.stringify(summaryStats, null, 2)}\n\`\`\`\n\n`;

    // 2. 룰 후보
    markdown += `## 2. 룰 후보\n\n`;

    if (Array.isArray(ruleCandidates)) {
      ruleCandidates.forEach((rule: any, idx: number) => {
        markdown += `### 룰 ${idx + 1}\n\n`;
        
        if (typeof rule === "object") {
          markdown += `- **조건**: ${rule.condition || rule.조건 || "N/A"}\n`;
          markdown += `- **설명**: ${rule.description || rule.설명 || "N/A"}\n`;
          markdown += `- **위험도**: ${rule.riskLevel || rule.위험도 || "N/A"}\n\n`;
        } else {
          markdown += `${rule}\n\n`;
        }
      });
    } else if (typeof ruleCandidates === "string") {
      markdown += `${ruleCandidates}\n\n`;
    } else {
      markdown += `\`\`\`json\n${JSON.stringify(ruleCandidates, null, 2)}\n\`\`\`\n\n`;
    }

    // 3. 이상 거래 샘플
    markdown += `## 3. 이상 거래 샘플 (Top ${topAnomalies?.length || 0})\n\n`;

    if (Array.isArray(topAnomalies) && topAnomalies.length > 0) {
      // 표 형식으로 첫 10개만 표시
      const displayCount = Math.min(10, topAnomalies.length);
      const headers = Object.keys(topAnomalies[0]);
      
      markdown += `| ${headers.join(" | ")} |\n`;
      markdown += `| ${headers.map(() => "---").join(" | ")} |\n`;
      
      topAnomalies.slice(0, displayCount).forEach((anomaly: any) => {
        const values = headers.map((h) => {
          const val = anomaly[h];
          if (typeof val === "object") {
            return JSON.stringify(val);
          }
          return String(val || "").substring(0, 50);
        });
        markdown += `| ${values.join(" | ")} |\n`;
      });

      if (topAnomalies.length > displayCount) {
        markdown += `\n*(총 ${topAnomalies.length}건 중 ${displayCount}건 표시)*\n\n`;
      }
    } else {
      markdown += `\`\`\`json\n${JSON.stringify(topAnomalies, null, 2)}\n\`\`\`\n\n`;
    }

    markdown += `---\n\n`;
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

