# AI 데이터 에이전트 프로젝트

FDS 이상거래 탐지 및 로그 분석을 위한 AI 에이전트 시스템

## 목차

- [프로젝트 개요](#프로젝트-개요)
- [시스템 아키텍처](#시스템-아키텍처)
- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [데이터 플로우](#데이터-플로우)
- [빠른 시작](#빠른-시작)
- [개발 배경 및 목적](#개발-배경-및-목적)
- [사용 사례](#사용-사례)
- [문서](#문서)

## 프로젝트 개요

본 프로젝트는 **AI 기반 데이터 분석 에이전트 시스템**으로, 금융 거래 데이터와 로그 데이터를 자동으로 분석하여 이상 패턴을 탐지하고, 인사이트와 대응 방안을 제시하는 종합 솔루션입니다.

### 핵심 특징

- **자동화된 분석**: CSV나 로그 파일을 업로드하기만 하면 자동으로 분석 수행
- **AI 기반 인사이트**: LLM을 활용하여 사람이 읽을 수 있는 분석 결과와 규칙 생성
- **실전 아키텍처**: 마이크로서비스 아키텍처와 MCP(Model Context Protocol) 스타일의 Tool 설계
- **확장 가능**: 새로운 에이전트나 도구를 쉽게 추가할 수 있는 모듈형 구조

### 프로젝트 구조

```
ai-agent-project/
├── frontend/           # React/Next.js UI (포트: 3000)
├── agent-server/       # LangChain.js 기반 에이전트 서버 (포트: 4000)
├── mcp-server/         # MCP-style Tool 서버 (포트: 5000)
├── ml-service/         # ML 추론 서버 (Python/FastAPI, 포트: 8000, 선택)
└── sample_data/        # 테스트용 샘플 데이터
```

## 시스템 아키텍처

### 전체 구조

```
┌─────────────────┐
│   Frontend      │  Next.js + React + TypeScript
│   (포트: 3000)  │  사용자 인터페이스
└────────┬────────┘
         │ HTTP/REST
         ↓
┌─────────────────┐
│  Agent Server   │  LangChain.js + OpenAI API
│  (포트: 4000)   │  에이전트 오케스트레이션
└────────┬────────┘
         │ HTTP/REST
         ↓
┌─────────────────┐
│   MCP Server    │  Express + TypeScript
│   (포트: 5000)  │  Tool 집행 서버
└────────┬────────┘
         │        │
         │        └──→ HTTP/REST
         │                    ↓
         │         ┌─────────────────┐
         │         │   ML Service    │  FastAPI + Python
         │         │   (포트: 8000)  │  머신러닝 추론
         │         └─────────────────┘
         │
         └──→ FDS Tools ──→ Log Tools
              (CSV 전처리)   (로그 파싱)
```

### 컴포넌트별 역할

#### 1. Frontend (Next.js)

- **역할**: 사용자 인터페이스 제공
- **기술**: Next.js 14, React, TypeScript, Tailwind CSS
- **주요 기능**:
  - 파일 업로드 (CSV, 로그)
  - 분석 모드 선택 (FDS / Log)
  - 실시간 진행 상황 표시
  - 결과 시각화 (통계, 그래프, 테이블)
  - Markdown 리포트 뷰어

#### 2. Agent Server

- **역할**: 에이전트 오케스트레이션 및 LLM 통신
- **기술**: Node.js, TypeScript, LangChain.js, Express
- **주요 기능**:
  - 파일 업로드 처리
  - MCP Tool 호출 조율
  - LLM 프롬프트 생성 및 응답 처리
  - 분석 결과 통합 및 리포트 생성

#### 3. MCP Server

- **역할**: 데이터 처리 및 분석 도구 제공
- **기술**: Node.js, TypeScript, Express
- **주요 모듈**:
  - **FDS Tools**: CSV 로딩, 전처리, 이상치 점수 계산
  - **Log Tools**: 로그 파싱, 통계 분석, 패턴 탐지
  - **Report Tools**: Markdown 리포트 생성

#### 4. ML Service (선택)

- **역할**: 머신러닝 모델을 통한 이상치 탐지
- **기술**: Python 3.11, FastAPI, scikit-learn, TensorFlow (선택)
- **주요 기능**:
  - AutoEncoder 또는 IsolationForest 모델 로드
  - 이상치 점수 계산 API 제공
  - 배치 처리 지원

## 주요 기능

### 1. FDS (Fraud Detection System) 이상거래 탐지 에이전트

#### 기능 설명

금융 거래 데이터를 분석하여 사기 거래를 탐지하고, 탐지 규칙 후보를 자동 생성합니다.

#### 처리 프로세스

1. **데이터 로딩**
   - CSV 파일 업로드
   - 데이터 파싱 및 검증

2. **전처리**
   - 시간 데이터 파싱 (시간대, 심야 여부 등)
   - 금액 데이터 정규화 및 로그 변환
   - 통계 요약 생성

3. **이상치 탐지**
   - ML 모델 기반 이상치 점수 계산
   - 상위 이상 거래 선별

4. **규칙 생성**
   - LLM 기반 FDS 규칙 후보 생성
   - 위험도 평가 (HIGH/MEDIUM/LOW)
   - 규칙 설명 및 맥락 제공

5. **리포트 생성**
   - Markdown 형식의 종합 리포트
   - 통계 요약, 규칙 후보, 이상 거래 상세 정보

#### 지원 데이터 형식

- [Kaggle Credit Card Fraud Detection](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud) 데이터셋 형식
- Time, V1~V28, Amount, Class 컬럼
- 데이터셋 다운로드: [링크](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud?resource=download)

### 2. 로그 장애 분석 에이전트

#### 기능 설명

시스템 로그를 분석하여 에러 패턴을 탐지하고, 장애 원인을 추론하며, 대응 방안을 제시합니다.

#### 처리 프로세스

1. **로그 파싱**
   - 타임스탬프, 로그 레벨, 메시지 추출
   - 메타데이터 파싱 (job_id, device, retry 등)

2. **통계 분석**
   - 로그 레벨별 카운트
   - 시간대별 에러 분포
   - 반복 패턴 탐지

3. **Root Cause 분석**
   - LLM 기반 장애 원인 추론
   - 가능한 원인 3가지 제시
   - 각 원인에 대한 설명

4. **대응 가이드 생성**
   - LLM 기반 해결 방안 제시
   - 단계별 대응 절차
   - Slack 메시지 자동 생성

#### 지원 로그 형식

```
2025-01-05T02:23:11Z ERROR PLC connection timeout - job_id=98372 device=PLC01 retry=1
```

ISO 8601 타임스탬프 형식의 구조화된 로그

## 기술 스택

### Frontend

- **Next.js 14**: React 프레임워크
- **TypeScript**: 타입 안정성
- **Tailwind CSS**: 유틸리티 기반 스타일링
- **React Markdown**: Markdown 렌더링

### Backend (Agent Server)

- **Node.js**: 서버 런타임
- **TypeScript**: 타입 안정성
- **Express**: 웹 프레임워크
- **LangChain.js**: AI 에이전트 프레임워크
- **OpenAI API**: GPT 모델 연동

### Backend (MCP Server)

- **Node.js**: 서버 런타임
- **TypeScript**: 타입 안정성
- **Express**: 웹 프레임워크
- **PapaParse**: CSV 파싱
- **Axios**: HTTP 클라이언트

### ML Service

- **Python 3.11**: 프로그래밍 언어
- **FastAPI**: 웹 API 프레임워크
- **scikit-learn**: 머신러닝 라이브러리
  - IsolationForest: 이상치 탐지 모델
- **TensorFlow** (선택): 딥러닝 프레임워크
  - AutoEncoder: 이상치 탐지 모델
- **pandas**: 데이터 처리
- **numpy**: 수치 연산

## 데이터 플로우

### FDS 에이전트 플로우

```
1. 사용자 → Frontend
   - CSV 파일 업로드
   - "FDS 에이전트" 모드 선택
   - "에이전트 실행" 클릭

2. Frontend → Agent Server
   - POST /agent/run
   - multipart/form-data (file, mode)

3. Agent Server → MCP Server
   - POST /fds/load-csv (파일 로딩)
   - POST /fds/preprocess (전처리)
   - POST /fds/anomaly-score (이상치 점수)

4. MCP Server → ML Service
   - POST /predict (이상치 점수 계산)
   - 응답: anomaly scores 배열

5. Agent Server → OpenAI API
   - LLM 프롬프트 전송
   - FDS 규칙 후보 생성 요청

6. Agent Server → MCP Server
   - POST /report/generate-markdown
   - 리포트 생성

7. Agent Server → Frontend
   - JSON 응답 (결과 데이터)

8. Frontend → 사용자
   - 결과 화면 렌더링
   - 통계, 규칙, 리포트 표시
```

### 로그 에이전트 플로우

```
1. 사용자 → Frontend
   - 로그 파일 업로드
   - "로그 분석 에이전트" 모드 선택

2. Agent Server → MCP Server
   - POST /log/load-log (파일 로딩)
   - POST /log/parse (파싱)
   - POST /log/stats (통계)

3. Agent Server → OpenAI API
   - 로그 데이터와 통계 전송
   - Root Cause 분석 요청

4. Agent Server → Frontend
   - 분석 결과 전송

5. Frontend → 사용자
   - 통계, 그래프, Root Cause, 대응 가이드 표시
```

## 빠른 시작

### 1. 사전 준비

- Node.js 18 이상
- Python 3.11 (ML Service용, 선택)
- OpenAI API Key

### 2. 의존성 설치

#### Frontend
```bash
cd frontend
npm install
```

#### Agent Server
```bash
cd agent-server
npm install
```

환경 변수 설정 (`agent-server/.env`):
```
OPENAI_API_KEY=your-openai-api-key-here
MCP_SERVER_URL=http://localhost:5000
PORT=4000
```

#### MCP Server
```bash
cd mcp-server
npm install
```

환경 변수 설정 (`mcp-server/.env`, 선택):
```
PORT=5000
ML_SERVICE_URL=http://localhost:8000
```

#### ML Service (선택)
```bash
cd ml-service
python -m venv venv

# Windows PowerShell
.\venv\Scripts\Activate.ps1

# Windows CMD
venv\Scripts\activate.bat

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

**데이터 준비 (ML Service 사용 시):**

FDS 에이전트 테스트를 위해 Kaggle Credit Card Fraud Detection 데이터셋이 필요합니다.

1. [Kaggle 데이터셋 다운로드](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud?resource=download)
2. 다운로드한 `creditcard.csv` 파일을 `sample_data/` 디렉토리에 저장
3. ML Service를 사용하는 경우 모델 학습 실행 (아래 "ML Service 모델 학습" 참고)

### 3. 서버 실행

4개의 터미널 창에서 각각 실행:

**터미널 1 - ML Service (선택):**
```bash
cd ml-service
.\venv\Scripts\Activate.ps1  # PowerShell
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

### 4. 접속 및 테스트

- Frontend: http://localhost:3000
- Agent Server: http://localhost:4000/health
- MCP Server: http://localhost:5000/health
- ML Service: http://localhost:8000/health

## 개발 배경 및 목적

### 배경

현대의 금융 시스템과 IT 인프라는 매일 방대한 양의 거래 데이터와 로그 데이터를 생성합니다. 이러한 데이터를 수동으로 분석하고 이상 패턴을 찾는 것은 시간이 많이 소요되고, 숙련된 전문가가 필요합니다.

### 목적

1. **자동화**: 반복적인 데이터 분석 작업을 자동화하여 효율성 향상
2. **인사이트 제공**: AI를 활용하여 숨겨진 패턴과 규칙을 발견
3. **실전 학습**: 실무 수준의 아키텍처와 기술 스택을 활용한 포트폴리오 프로젝트
4. **확장성**: 새로운 분석 에이전트와 도구를 쉽게 추가할 수 있는 구조

### 적용 분야

- **금융**: 신용카드 사기 탐지, 이상 거래 모니터링
- **IT 운영**: 로그 분석, 장애 원인 추론, 시스템 모니터링
- **보안**: 이상 행동 탐지, 침입 탐지
- **비즈니스 분석**: 거래 패턴 분석, 고객 행동 분석

## 사용 사례

### 사례 1: 금융사 FDS 규칙 개발

**상황**: 새로운 이상 거래 패턴을 발견하여 FDS 규칙을 추가하고 싶음

**절차**:
1. 과거 거래 데이터(CSV)를 업로드
2. FDS 에이전트 실행
3. 생성된 규칙 후보 검토
4. 적절한 규칙을 실제 FDS 시스템에 적용

**효과**: 수동 분석보다 빠르게 규칙 후보를 생성하고, 데이터 기반으로 검증된 규칙을 개발할 수 있음

### 사례 2: 시스템 장애 분석

**상황**: 프로덕션 환경에서 에러가 발생했지만 원인을 찾기 어려움

**절차**:
1. 해당 시간대의 로그 파일 다운로드
2. 로그 분석 에이전트 실행
3. Root Cause 분석 결과 확인
4. 제시된 대응 가이드에 따라 조치

**효과**: 로그를 빠르게 분석하고 장애 원인을 추론하여, MTTR(Mean Time To Repair) 단축

### 사례 3: 일일 모니터링 리포트 생성

**상황**: 매일 거래 데이터를 모니터링하고 리포트를 작성해야 함

**절차**:
1. 일일 거래 데이터 CSV 준비
2. FDS 에이전트 실행
3. 생성된 Markdown 리포트 확인
4. 필요시 PDF로 변환하여 공유

**효과**: 반복적인 리포트 작성 작업을 자동화하여 시간 절약

## 확장 가능성

### 향후 개선 방향

1. **실시간 스트리밍 분석**: 배치 처리에서 실시간 스트리밍으로 전환
2. **BigQuery 연동**: 클라우드 데이터베이스 직접 연결
3. **n8n 워크플로우 연동**: 자동화된 워크플로우 구축
4. **다양한 ML 모델 지원**: XGBoost, LightGBM 등 추가
5. **대시보드 고도화**: 실시간 차트, 알림 기능 추가
6. **다중 데이터소스 지원**: API, 데이터베이스 직접 연결

## 문서

- **[초기 설정 및 설치](./SETUP.md)** - 상세한 설치 및 설정 가이드
- **[ML Service 설정](./ml-service/README.md)** - ML 서비스 상세 가이드
- 각 서브 프로젝트의 README 참고

## 라이선스

이 프로젝트는 학습 및 포트폴리오 목적으로 제작되었습니다.
