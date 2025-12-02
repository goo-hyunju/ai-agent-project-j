import { ChatOpenAI } from "@langchain/openai";
import { mcpClient } from "../tools/mcpClient";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

const llm = new ChatOpenAI({
  apiKey: OPENAI_API_KEY,
  modelName: "gpt-4o-mini",
  temperature: 0.2,
});

export async function runLogAgent(logFilePath: string) {
  console.log("📄 [Log Agent] Starting analysis...");
  console.log("📄 [Log Agent] Log file path:", logFilePath);

  try {
    // 1) 로그 파일 로딩
    console.log("📥 Loading log file...");
    const loaded = await mcpClient.loadLog(logFilePath);
    const lines = loaded.lines;
    console.log(`📥 Loaded ${lines.length} log lines`);

    // 2) 파싱
    console.log("🔍 Parsing log lines...");
    const parsedData = await mcpClient.parseLog(lines);
    const parsed = parsedData.parsed;
    console.log(`🔍 Parsed ${parsed.length} log entries`);

    // 3) 통계 계산
    console.log("📊 Calculating log statistics...");
    const statsData = await mcpClient.logStats(parsed);
    const { counts, hourlyError, hourlyWarn, topErrorPatterns, topJobErrors, topDeviceErrors, retryStats } = statsData;
    console.log("📊 Statistics calculated:", counts);

    // 4) LLM Root Cause 분석
    console.log("🤖 Analyzing root causes with LLM...");
    
    // 에러 로그 샘플 추출 (최대 50개)
    const errorLogs = parsed.filter((p) => p.level === "ERROR").slice(0, 50);
    const warnLogs = parsed.filter((p) => p.level === "WARN").slice(0, 30);
    const sampleLogs = [...errorLogs, ...warnLogs].slice(0, 50);

    const llmPrompt = `
당신은 WCS/백엔드 운영 전문가이자 시스템 장애 분석 전문가입니다.

아래는 최근 서비스 로그 분석 결과입니다:

## 로그 통계
- 총 로그 수: ${counts.total}
- INFO: ${counts.info}, WARN: ${counts.warn}, ERROR: ${counts.error}
- DEBUG: ${counts.debug}, FATAL: ${counts.fatal}

## 시간대별 에러 분포 (24시간)
${hourlyError.map((count, hour) => `${hour}시: ${count}건`).join("\n")}

## 상위 에러 패턴 (Top 5)
${topErrorPatterns.slice(0, 5).map((p: any, idx: number) => `${idx + 1}. ${p.pattern} (${p.count}회)`).join("\n")}

## 문제가 있는 Job ID (Top 5)
${topJobErrors.slice(0, 5).map((j: any, idx: number) => `${idx + 1}. job_id=${j.jobId} (${j.count}회 에러)`).join("\n")}

## 문제가 있는 Device (Top 5)
${topDeviceErrors.slice(0, 5).map((d: any, idx: number) => `${idx + 1}. device=${d.device} (${d.count}회 에러)`).join("\n")}

## Retry 통계
- Retry 발생: ${retryStats.retryCounts}건
- 최대 Retry 횟수: ${retryStats.maxRetry}회

## 로그 샘플 (에러/WARN 위주, ${sampleLogs.length}줄)
${sampleLogs.map((p) => p.raw).join("\n")}

---

## 분석 요청

위 로그 데이터를 분석하여 다음을 생성해주세요:

1. **Root Cause 후보 3~5개**
   - 각 원인에 대한 설명
   - 증거 (어떤 로그 패턴이 이를 뒷받침하는지)
   - 확률 (HIGH/MEDIUM/LOW)

2. **대응 가이드 3~5개**
   - 각 가이드에 대한 설명
   - 즉시 조치 가능한지 여부
   - 우선순위

3. **Slack 경고 메시지**
   - 간단하고 명확한 메시지
   - 핵심 정보 포함 (에러 수, 주요 원인, 조치 필요 여부)

반드시 다음 JSON 형식으로만 출력하세요:

{
  "root_causes": [
    {
      "cause": "원인 설명",
      "evidence": "증거 로그 패턴",
      "probability": "HIGH|MEDIUM|LOW",
      "description": "상세 설명"
    }
  ],
  "recommendations": [
    {
      "action": "조치 방법",
      "description": "상세 설명",
      "immediate": true|false,
      "priority": "HIGH|MEDIUM|LOW"
    }
  ],
  "slack_message": "Slack에 올릴 경고 메시지"
}
`;

    const result = await llm.invoke(llmPrompt);
    let analysis: any = {};

    try {
      const content = result.content.toString();
      // JSON 코드 블록 제거
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        analysis = JSON.parse(content);
      }
    } catch (parseError) {
      console.warn("⚠️ JSON parsing failed. Using raw content.");
      analysis = {
        error: "JSON parsing failed",
        rawContent: result.content.toString(),
        root_causes: [],
        recommendations: [],
        slack_message: "로그 분석 중 오류가 발생했습니다.",
      };
    }

    // 5) 보고서 생성 (MCP)
    console.log("📄 Generating report...");
    const report = await mcpClient.generateReport({
      summaryStats: {
        counts,
        hourlyError,
        hourlyWarn,
        topErrorPatterns,
        topJobErrors,
        topDeviceErrors,
        retryStats,
      },
      ruleCandidates: analysis.root_causes || [],
      topAnomalies: analysis.recommendations || [],
    });

    console.log("✅ Log Agent analysis completed.");

    return {
      parsed: parsed.slice(0, 100), // 샘플만 반환 (전체는 너무 큼)
      counts,
      hourlyError,
      hourlyWarn,
      topErrorPatterns,
      topJobErrors,
      topDeviceErrors,
      retryStats,
      analysis,
      reportMarkdown: report.markdown,
      reportFile: report.filePath,
    };
  } catch (error: any) {
    console.error("Error in Log Agent:", error);
    throw new Error(`Log Agent 실행 중 오류: ${error.message}`);
  }
}
