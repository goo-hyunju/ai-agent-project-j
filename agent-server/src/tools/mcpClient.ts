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
};

