# 🚀 프로젝트 설정 가이드

## 전체 프로젝트 구조

```
ai-agent-project/
├─ frontend/           # React/Next.js UI (포트: 3000)
├─ agent-server/       # LangChain.js 에이전트 서버 (포트: 4000)
├─ mcp-server/         # MCP Tool 서버 (포트: 5000)
└─ ml-service/         # Python ML 서버 (포트: 8000, 선택)
```

## 🔧 초기 설정

### 1. Frontend 설정

```bash
cd frontend
npm install
```

### 2. Agent Server 설정

```bash
cd agent-server
npm install
```

**환경 변수 설정:**

`.env` 파일 생성:
```
OPENAI_API_KEY=your-openai-api-key-here
MCP_SERVER_URL=http://localhost:5000
PORT=4000
```

### 3. MCP Server 설정

```bash
cd mcp-server
npm install
```

**환경 변수 설정 (선택):**

`.env` 파일 생성:
```
PORT=5000
ML_SERVICE_URL=http://localhost:8000
```

### 4. ML Service 설정 (선택)

```bash
cd ml-service
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

## 🚀 실행 순서

### 방법 1: 각 서버를 별도 터미널에서 실행

**터미널 1 - ML Service (선택):**
```bash
cd ml-service
venv\Scripts\activate  # Windows
uvicorn main:app --reload --port 8000
```

**터미널 2 - MCP Server:**
```bash
cd mcp-server
npm run dev
```

**터미널 3 - Agent Server:**
```bash
cd agent-server
npm run dev
```

**터미널 4 - Frontend:**
```bash
cd frontend
npm run dev
```

### 방법 2: 순차 실행

1. ML Service (선택) → http://localhost:8000
2. MCP Server → http://localhost:5000
3. Agent Server → http://localhost:4000
4. Frontend → http://localhost:3000

## ✅ 확인 방법

1. 브라우저에서 http://localhost:3000 접속
2. CSV 파일 업로드
3. "FDS 이상거래 에이전트" 모드 선택
4. "에이전트 실행" 버튼 클릭
5. 결과 확인

## 📝 테스트용 샘플 CSV

FDS 분석을 위한 샘플 CSV 파일 구조:

```csv
transaction_id,amount,time,customer_id,merchant_id,transaction_type,status
1,100000,2024-01-01 12:00:00,C001,M001,ATM,WITHDRAWAL,SUCCESS
2,50000,2024-01-01 13:00:00,C001,M002,ONLINE,PURCHASE,SUCCESS
...
```

## 🐛 문제 해결

### Port 이미 사용 중
- 각 서버의 포트를 변경하거나 사용 중인 프로세스를 종료하세요.

### OpenAI API Key 오류
- `agent-server/.env` 파일에 올바른 API 키가 설정되어 있는지 확인하세요.

### 모듈을 찾을 수 없음
- 각 디렉토리에서 `npm install` 또는 `pip install -r requirements.txt`를 다시 실행하세요.

## 📚 추가 정보

각 서브 프로젝트의 README.md를 참고하세요:
- `frontend/README.md`
- `agent-server/README.md`
- `mcp-server/README.md`
- `ml-service/README.md`

