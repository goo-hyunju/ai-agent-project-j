import express from "express";
import bodyParser from "body-parser";
import { fdsRouter } from "./modules/fds";
import { reportRouter } from "./modules/report";
import { logRouter } from "./modules/log";

const app = express();

// JSON 페이로드 크기 제한 증가 (대용량 데이터 처리)
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));

app.use("/fds", fdsRouter);
app.use("/report", reportRouter);
app.use("/log", logRouter);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`MCP-style tool server listening on http://localhost:${PORT}`);
});

