# 🚀 AI 데이터 에이전트 프로젝트

FDS 이상거래 탐지 및 로그 분석을 위한 AI 에이전트 시스템

## 📁 프로젝트 구조

```
ai-agent-project/
├─ frontend/           # React/Next.js UI
├─ agent-server/       # LangChain.js 기반 에이전트 서버 (Node/TS)
├─ mcp-server/         # MCP-style Tool 서버 (Node/TS)
└─ ml-service/         # AutoEncoder 등 ML 추론 서버 (Python/FastAPI)
```

## 🎯 기능

### FDS 이상거래 탐지 에이전트
- CSV 데이터 자동 분석
- 이상거래 탐지
- FDS 룰 후보 생성
- 리포트 자동 생성 (Markdown/PDF)

### 로그 장애 분석 에이전트 (추가 예정)
- 로그 파싱 및 분석
- 이상 패턴 탐지
- 장애 원인 추론

## 🚀 실행 방법

### 1. ml-service (선택, Python)
```bash
cd ml-service
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2. mcp-server (Node/TS)
```bash
cd mcp-server
npm install
npm run dev
# http://localhost:5000
```

### 3. agent-server (Node/TS)
```bash
cd agent-server
npm install
# .env 파일에 OPENAI_API_KEY 설정 필요
npm run dev
# http://localhost:4000
```

### 4. frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
# http://localhost:3000
```

## 🔧 환경 변수

### agent-server/.env
```
OPENAI_API_KEY=your-openai-api-key
```

## 📝 개발 가이드

- **초기 설정 가이드**: [SETUP.md](./SETUP.md) 참고
- 각 서브 프로젝트의 README를 참고하세요.

## 🎓 주요 기술 스택

- **Frontend**: Next.js 14, TypeScript, React
- **Agent Server**: Node.js, TypeScript, LangChain.js, OpenAI API
- **MCP Server**: Node.js, TypeScript, Express
- **ML Service**: Python, FastAPI

## 📄 라이선스

이 프로젝트는 학습 및 포트폴리오 목적으로 제작되었습니다.

