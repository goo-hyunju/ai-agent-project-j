# MCP Server

MCP-style Tool 서버 - 데이터 처리 및 리포트 생성 도구 제공

## 설치

```bash
npm install
```

## 실행

```bash
npm run dev
```

서버는 http://localhost:5000 에서 실행됩니다.

## API 엔드포인트

### FDS 관련

#### POST /fds/load-csv
CSV 파일을 로드합니다.

**요청:**
```json
{
  "filePath": "/path/to/file.csv"
}
```

**응답:**
```json
{
  "dataframeJson": [...]
}
```

#### POST /fds/preprocess
데이터를 전처리하고 기본 통계를 계산합니다.

**요청:**
```json
{
  "dataframeJson": [...]
}
```

**응답:**
```json
{
  "cleanDataframeJson": [...],
  "summaryStats": {...}
}
```

#### POST /fds/anomaly-score
이상치 점수를 계산합니다.

**요청:**
```json
{
  "dataframeJson": [...]
}
```

**응답:**
```json
{
  "dataframeWithScoreJson": [...]
}
```

### 리포트 관련

#### POST /report/generate-markdown
마크다운 리포트를 생성합니다.

**요청:**
```json
{
  "summaryStats": {...},
  "ruleCandidates": [...],
  "topAnomalies": [...]
}
```

**응답:**
```json
{
  "markdown": "...",
  "filePath": "/path/to/report.md"
}
```

### GET /health
서버 상태 확인

