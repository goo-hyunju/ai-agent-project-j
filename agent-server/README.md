# Agent Server

LangChain.js 기반 에이전트 서버

## 설치

```bash
npm install
```

## 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 추가하세요:

```
OPENAI_API_KEY=your-openai-api-key-here
MCP_SERVER_URL=http://localhost:5000
PORT=4000
```

## 실행

```bash
npm run dev
```

서버는 http://localhost:4000 에서 실행됩니다.

## API 엔드포인트

### POST /agent/run
에이전트를 실행합니다.

**요청:**
- `file`: CSV 또는 로그 파일 (multipart/form-data)
- `mode`: "fds" 또는 "log"

**응답:**
```json
{
  "mode": "fds",
  "result": {
    "summaryStats": {...},
    "ruleCandidates": [...],
    "reportMarkdown": "..."
  }
}
```

### GET /health
서버 상태 확인

