# 프로젝트 설정 가이드

이 문서는 프로젝트 전체 설정에 대한 상세 가이드입니다.

## 목차

1. [사전 요구사항](#사전-요구사항)
2. [Python 환경 설정](#python-환경-설정)
3. [Node.js 프로젝트 설정](#nodejs-프로젝트-설정)
4. [환경 변수 설정](#환경-변수-설정)
5. [서버 실행 방법](#서버-실행-방법)
6. [문제 해결](#문제-해결)

## 사전 요구사항

### 필수
- **Node.js 18 이상** ([다운로드](https://nodejs.org/))
- **npm** (Node.js와 함께 설치됨)
- **OpenAI API Key** ([발급](https://platform.openai.com/api-keys))

### 선택 (ML Service 사용 시)
- **Python 3.11** ([다운로드](https://www.python.org/downloads/release/python-31111/))
  - 설치 시 **반드시 "Add Python 3.11 to PATH" 체크**
  - "Install for all users" 옵션도 권장

## Python 환경 설정

### 1. Python 3.11 설치 확인

**Windows PowerShell:**
```powershell
python --version
# 또는
py -3.11 --version
```

Python 3.11이 설치되지 않았다면:
1. https://www.python.org/downloads/release/python-31111/ 접속
2. "Windows installer (64-bit)" 다운로드
3. 설치 시 **"Add Python 3.11 to PATH" 체크 필수**
4. 설치 완료 후 새 PowerShell 창 열기

### 2. 가상환경 생성

**ML Service 디렉토리로 이동:**
```powershell
cd ml-service
```

**가상환경 생성:**
```powershell
python -m venv venv
```

**가상환경 활성화:**

PowerShell:
```powershell
.\venv\Scripts\Activate.ps1
```

실행 정책 오류 발생 시:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

CMD:
```cmd
venv\Scripts\activate.bat
```

Linux/Mac:
```bash
source venv/bin/activate
```

**가상환경 활성화 확인:**
```powershell
python --version
# Python 3.11.x 가 표시되어야 함
```

**가상환경 비활성화 (필요 시):**
```powershell
deactivate
```

### 3. 패키지 설치

가상환경이 활성화된 상태에서:

```powershell
# pip 업그레이드
python -m pip install --upgrade pip setuptools wheel

# 패키지 설치
pip install -r requirements.txt
```

**설치 확인:**
```powershell
python -c "import tensorflow as tf; print('TensorFlow', tf.__version__)"
python -c "import fastapi; print('FastAPI installed')"
```

### 4. 모델 학습 (ML Service 사용 시)

**한 번만 실행 (약 2-5분 소요):**
```powershell
cd ml-service
.\venv\Scripts\Activate.ps1
python train_autoencoder.py
```

**생성되는 파일:**
- `models/autoencoder.h5` - 학습된 모델
- `models/scaler.joblib` - 데이터 스케일러
- `models/features.txt` - 피처 순서

## Node.js 프로젝트 설정

### Frontend

```powershell
cd frontend
npm install
```

### Agent Server

```powershell
cd agent-server
npm install
```

### MCP Server

```powershell
cd mcp-server
npm install
```

## 환경 변수 설정

### Agent Server

`agent-server/.env` 파일 생성:

```env
OPENAI_API_KEY=sk-your-openai-api-key-here
MCP_SERVER_URL=http://localhost:5000
PORT=4000
```

### MCP Server (선택)

`mcp-server/.env` 파일 생성:

```env
PORT=5000
ML_SERVICE_URL=http://localhost:8000
```

## 서버 실행 방법

### 순서대로 실행

각 서버는 별도의 터미널 창에서 실행합니다.

#### 1. ML Service (선택, 포트 8000)

**새 PowerShell 창:**
```powershell
cd ml-service
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000
```

**확인:**
- 브라우저에서 http://localhost:8000/health 접속
- `{"status":"ok","model_loaded":true}` 응답 확인

#### 2. MCP Server (포트 5000)

**새 PowerShell 창:**
```powershell
cd mcp-server
npm run dev
```

**확인:**
- 브라우저에서 http://localhost:5000/health 접속
- `{"status":"ok"}` 응답 확인

#### 3. Agent Server (포트 4000)

**새 PowerShell 창:**
```powershell
cd agent-server
npm run dev
```

**확인:**
- 브라우저에서 http://localhost:4000/health 접속
- `{"status":"ok"}` 응답 확인

#### 4. Frontend (포트 3000)

**새 PowerShell 창:**
```powershell
cd frontend
npm run dev
```

**확인:**
- 브라우저에서 http://localhost:3000 접속
- 파일 업로드 화면이 표시되어야 함

## 실행 순서 요약

1. ML Service 실행 (선택)
   - 가상환경 활성화
   - `uvicorn main:app --reload --port 8000`

2. MCP Server 실행
   - `npm run dev`

3. Agent Server 실행
   - `.env` 파일 확인
   - `npm run dev`

4. Frontend 실행
   - `npm run dev`

## 테스트

### FDS 에이전트 테스트

1. http://localhost:3000 접속
2. "FDS 이상거래 에이전트" 선택
3. `sample_data/creditcard.csv` 파일 업로드
4. "에이전트 실행" 클릭
5. 결과 확인:
   - 통계 요약
   - 룰 후보 테이블
   - 이상 거래 Top 20
   - Markdown 리포트

### 로그 에이전트 테스트

1. http://localhost:3000/log 접속
2. 로그 파일 업로드 (.log 또는 .txt)
3. "로그 분석 실행" 클릭
4. 결과 확인:
   - 통계 요약
   - 시간대별 에러 그래프
   - Root Cause 분석
   - 대응 가이드
   - Slack 메시지

## 문제 해결

### Python 가상환경 문제

**문제: 가상환경 활성화가 안 됨**
```powershell
# PowerShell 실행 정책 설정
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 또는 직접 python.exe 사용
.\venv\Scripts\python.exe --version
```

**문제: pip이 없음**
```powershell
python -m ensurepip --upgrade
python -m pip install --upgrade pip
```

### 패키지 설치 오류

**문제: TensorFlow 설치 실패**
- Python 3.11이 설치되어 있는지 확인
- Python 3.14는 TensorFlow를 지원하지 않음

**문제: setuptools 오류**
```powershell
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

### 포트 충돌

**문제: 포트가 이미 사용 중**
```powershell
# 포트 사용 프로세스 확인 (Windows)
netstat -ano | findstr :8000

# 프로세스 종료
taskkill /PID <PID번호> /F
```

또는 각 서버의 포트를 변경:
- ML Service: `uvicorn main:app --reload --port 8001`
- MCP Server: `.env`에서 `PORT=5001`
- Agent Server: `.env`에서 `PORT=4001`

### OpenAI API 오류

**문제: API Key 오류**
- `agent-server/.env` 파일 확인
- API Key가 올바른지 확인
- OpenAI 계정에서 API 사용량 확인

### 모델 로드 오류

**문제: ML Service에서 모델을 찾을 수 없음**
```powershell
cd ml-service
.\venv\Scripts\Activate.ps1
python train_autoencoder.py
```

`models/` 디렉토리에 다음 파일이 있어야 함:
- `autoencoder.h5`
- `scaler.joblib`
- `features.txt`

### CORS 오류

모든 서버가 실행 중인지 확인:
- ML Service: http://localhost:8000/health
- MCP Server: http://localhost:5000/health
- Agent Server: http://localhost:4000/health
- Frontend: http://localhost:3000

## 추가 리소스

- ML Service 상세 가이드: [ml-service/README.md](./ml-service/README.md)
- 프로젝트 개요: [README.md](./README.md)
