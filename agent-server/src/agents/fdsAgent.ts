import { ChatOpenAI } from "@langchain/openai";
import { mcpClient } from "../tools/mcpClient";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

const llm = new ChatOpenAI({
  apiKey: OPENAI_API_KEY,
  modelName: "gpt-4o-mini",
  temperature: 0.2,
});

export async function runFdsAgent(csvPath: string) {
  try {
    // 1) MCP Tool로 데이터 로딩 & 전처리
    console.log("Loading CSV file...");
    const loaded = await mcpClient.loadCsv(csvPath);
    console.log("Preprocessing data...");
    const preprocessed = await mcpClient.preprocess(loaded.dataframeJson);
    const cleanDataframeJson = preprocessed.cleanDataframeJson;
    const summaryStats = preprocessed.summaryStats;

    // 2) (선택) MCP → Python ML 서비스 호출
    console.log("Calculating anomaly scores...");
    const anomaly = await mcpClient.anomalyScore(cleanDataframeJson);
    const dataframeWithScoreJson = anomaly.dataframeWithScoreJson;

    // 3) 상위 이상치 Top-N 추출
    const allRecords = dataframeWithScoreJson as any[];
    
    // anomaly_score 기준으로 정렬
    const sortedByScore = allRecords
      .filter((r: any) => r.anomaly_score !== undefined)
      .sort((a: any, b: any) => (b.anomaly_score || 0) - (a.anomaly_score || 0));
    
    const topAnomaliesSample = sortedByScore.slice(0, 20);

    // 4) LLM에게 룰 후보 생성 요청
    console.log("Generating rule candidates with LLM...");
    const rulePrompt = `
당신은 FDS(Fraud Detection System) 분석 전문가입니다.

아래는 거래 데이터에 대한 통계 요약과 이상치 상위 샘플입니다.

[통계 요약]
${JSON.stringify(summaryStats, null, 2)}

[이상치 상위 샘플 (Top 20)]
${JSON.stringify(topAnomaliesSample.slice(0, 10), null, 2)}

위 정보를 기반으로 사람이 바로 룰로 사용할 수 있는 FDS Rule 후보를 5~10개 정도 생성해주세요.

각 룰은 다음 형식을 따르세요:
- 조건: (예: 심야 시간대 00~04시, ATM 출금 3회 이상, 합계 100만 원 이상)
- 설명: (룰이 필요한 이유와 맥락, 참고 사항)
- 위험도: (HIGH / MEDIUM / LOW 중 하나)

반드시 JSON 배열 형태로만 출력하세요. 다른 텍스트는 포함하지 마세요.

형식 예시:
[
  {
    "condition": "심야 시간대(00~04시)에 ATM 출금이 3회 이상 발생",
    "description": "심야 시간대의 반복 출금은 비정상적인 거래 패턴을 나타낼 수 있습니다.",
    "riskLevel": "HIGH"
  }
]
`;

    const ruleResult = await llm.invoke(rulePrompt);
    let ruleCandidates: any;

    try {
      const content = ruleResult.content.toString();
      // JSON 코드 블록 제거
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        ruleCandidates = JSON.parse(jsonMatch[0]);
      } else {
        ruleCandidates = JSON.parse(content);
      }
    } catch (parseError) {
      console.error("Failed to parse rule candidates as JSON:", parseError);
      // JSON parsing 실패 시 그냥 text 상태로 넘김
      ruleCandidates = ruleResult.content;
    }

    // 5) MCP report-tool로 마크다운 리포트 생성
    console.log("Generating report...");
    const report = await mcpClient.generateReport({
      summaryStats,
      ruleCandidates,
      topAnomalies: topAnomaliesSample,
    });

    return {
      summaryStats,
      ruleCandidates,
      topAnomaliesCount: topAnomaliesSample.length,
      reportMarkdown: report.markdown,
    };
  } catch (error: any) {
    console.error("Error in FDS Agent:", error);
    throw new Error(`FDS Agent 실행 중 오류: ${error.message}`);
  }
}

