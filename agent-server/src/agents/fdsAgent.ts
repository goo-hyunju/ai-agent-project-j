import { ChatOpenAI } from "@langchain/openai";
import { mcpClient } from "../tools/mcpClient";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

const llm = new ChatOpenAI({
  apiKey: OPENAI_API_KEY,
  modelName: "gpt-4o-mini",
  temperature: 0.2,
});

export async function runFdsAgent(csvPath: string) {
  console.log("🔍 [FDS Agent] CSV path:", csvPath);

  /**
   * 1) MCP Tool — CSV 로딩
   */
  const loaded = await mcpClient.loadCsv(csvPath);
  const rawDf = loaded.dataframeJson;
  console.log(`📥 Loaded rows: ${rawDf.length}`);

  /**
   * 2) MCP Tool — 전처리
   * (Time/Amount → Feature Engineering)
   */
  const preprocess = await mcpClient.preprocess(rawDf);
  const cleanDf = preprocess.cleanDataframeJson;
  const summaryStats = preprocess.summaryStats;
  console.log("🛠 Preprocess completed:", summaryStats);

  /**
   * 3) MCP Tool — anomaly score
   * (지금은 Dummy Score, 나중에 Python AutoEncoder로 대체 가능)
   */
  const anomaly = await mcpClient.anomalyScore(cleanDf);
  const withScore = anomaly.dataframeWithScoreJson;
  const topAnomalies = [...withScore]
    .sort((a, b) => (b.anomaly_score || 0) - (a.anomaly_score || 0))
    .slice(0, 20);
  console.log(`⚠️ Selected top anomalies: ${topAnomalies.length}`);

  /**
   * 4) 룰 생성 LLM 프롬프트
   * Kaggle creditcard dataset 전용 버전
   */
  const rulePrompt = `
당신은 금융 FDS 분석 전문가입니다.

데이터는 Kaggle creditcard fraud detection dataset이며,
컬럼은 Time / V1~V28 / Amount / Class으로 구성됩니다.

주요 특징:
- user_id, merchant_id는 존재하지 않음
- Time은 "데이터셋 시작 이후 경과 시간" (초 단위)
- Amount는 금액
- Class = 1 이면 Fraud

전처리를 통해 다음 Feature들이 생성되었습니다:
- amount_log (로그 스케일 금액)
- time_seconds / time_minutes / time_hours
- hour_bucket (0~23)
- is_night (22~5시)
- anomaly_score (고액/심야 기반 점수)

summaryStats:
${JSON.stringify(summaryStats, null, 2)}

topAnomalies (상위 20개):
${JSON.stringify(topAnomalies.slice(0, 10), null, 2)}

아래 기준으로 FDS Rule 후보를 6~10개 생성하세요:

1) 심야(is_night=1) AND 고액(amount > avgAmount * 3)
2) anomaly_score 상위 5%
3) Time 기반 burst (특정 hour_bucket에서 amount 증가)
4) Fraud(Class=1) 패턴을 일반화하여 룰 생성
5) 금액 급등 패턴 (amount_log가 전체 평균보다 매우 높은 경우)

출력 형식(JSON 배열만):
[
  {
    "condition": "amount > ... AND is_night = 1",
    "description": "심야 고액 결제 패턴",
    "risk": "HIGH"
  }
]
`;

  const ruleResult = await llm.invoke(rulePrompt);
  let ruleCandidates: any = null;

  try {
    const content = ruleResult.content.toString();
    // JSON 코드 블록 제거
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      ruleCandidates = JSON.parse(jsonMatch[0]);
    } else {
      ruleCandidates = JSON.parse(content);
    }
  } catch (err) {
    console.warn("⚠️ Rule JSON Parse 실패. 원본 text로 전달합니다.");
    ruleCandidates = ruleResult.content;
  }

  /**
   * 5) MCP Tool — Markdown Report 생성
   */
  const report = await mcpClient.generateReport({
    summaryStats,
    ruleCandidates,
    topAnomalies,
  });

  console.log("📄 Markdown report generated.");

  return {
    summaryStats,
    ruleCandidates,
    reportMarkdown: report.markdown,
    reportFile: report.filePath,
  };
}
