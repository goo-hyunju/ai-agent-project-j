"use client";

import React, { useState } from "react";

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [mode, setMode] = useState<"fds" | "log">("fds");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleRunAgent = async () => {
    if (!file) {
      alert("CSV 또는 로그 파일을 선택해주세요.");
      return;
    }

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", mode);

    try {
      const res = await fetch("http://localhost:4000/agent/run", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      alert(`에이전트 실행 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-800">AI 데이터 에이전트 데모</h1>
      
      <div className="flex gap-4">
        <button
          className={`px-6 py-3 rounded-lg border-2 font-semibold transition-colors ${
            mode === "fds"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
          onClick={() => setMode("fds")}
        >
          FDS 이상거래 에이전트
        </button>
        <button
          className={`px-6 py-3 rounded-lg border-2 font-semibold transition-colors ${
            mode === "log"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
          onClick={() => setMode("log")}
        >
          로그 장애 분석 에이전트
        </button>
      </div>

      <div className="flex flex-col items-center gap-4 w-full max-w-md">
        <div className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            파일 선택
          </label>
          <input
            type="file"
            accept=".csv,.log,.txt"
            onChange={handleFileChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {file && (
          <div className="text-sm text-gray-600">
            선택된 파일: {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </div>
        )}

        <button
          className="px-8 py-3 rounded-lg bg-blue-600 text-white font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors w-full"
          disabled={loading || !file}
          onClick={handleRunAgent}
        >
          {loading ? "에이전트 실행 중..." : "에이전트 실행"}
        </button>
      </div>

      {loading && (
        <div className="text-blue-600 font-medium">분석 중...</div>
      )}

      {result && (
        <section className="mt-8 w-full max-w-4xl border rounded-lg p-6 bg-white shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">에이전트 결과</h2>
          
          {result.mode === "fds" && result.result?.reportMarkdown ? (
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-2">📊 리포트</h3>
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded overflow-x-auto">
                  {result.result.reportMarkdown}
                </pre>
              </div>
              
              {result.result.summaryStats && (
                <div className="border-b pb-4">
                  <h3 className="font-semibold mb-2">📈 통계 요약</h3>
                  <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded overflow-x-auto">
                    {JSON.stringify(result.result.summaryStats, null, 2)}
                  </pre>
                </div>
              )}

              {result.result.ruleCandidates && (
                <div>
                  <h3 className="font-semibold mb-2">🎯 룰 후보</h3>
                  <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded overflow-x-auto">
                    {typeof result.result.ruleCandidates === 'string'
                      ? result.result.ruleCandidates
                      : JSON.stringify(result.result.ruleCandidates, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </section>
      )}
    </main>
  );
}

