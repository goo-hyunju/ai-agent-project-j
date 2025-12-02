import axios from "axios";

const MCP_BASE_URL = process.env.MCP_SERVER_URL || "http://localhost:5000";

export const mcpClient = {
  async loadCsv(filePath: string) {
    const res = await axios.post(`${MCP_BASE_URL}/fds/load-csv`, { filePath });
    return res.data; // { dataframeJson }
  },

  async preprocess(dataframeJson: any) {
    const res = await axios.post(`${MCP_BASE_URL}/fds/preprocess`, {
      dataframeJson,
    });
    return res.data; // { cleanDataframeJson, summaryStats }
  },

  async anomalyScore(cleanDataframeJson: any) {
    const res = await axios.post(`${MCP_BASE_URL}/fds/anomaly-score`, {
      dataframeJson: cleanDataframeJson,
    });
    return res.data; // { dataframeWithScoreJson }
  },

  async generateReport(payload: {
    summaryStats: any;
    ruleCandidates: any;
    topAnomalies: any;
  }) {
    const res = await axios.post(
      `${MCP_BASE_URL}/report/generate-markdown`,
      payload
    );
    return res.data; // { markdown }
  },

  // 로그 관련 API
  async loadLog(filePath: string) {
    const res = await axios.post(`${MCP_BASE_URL}/log/load-log`, { filePath });
    return res.data; // { lines }
  },

  async parseLog(lines: string[]) {
    const res = await axios.post(`${MCP_BASE_URL}/log/parse`, { lines });
    return res.data; // { parsed }
  },

  async logStats(parsed: any[]) {
    const res = await axios.post(`${MCP_BASE_URL}/log/stats`, { parsed });
    return res.data; // { counts, hourlyError, ... }
  },
};

