"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"fds" | "log">("fds");
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) {
      alert("파일을 선택해주세요.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", mode);

      const res = await fetch("http://localhost:4000/agent/run", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      
      // 결과를 LocalStorage에 저장 → /result 화면에서 표시
      localStorage.setItem("agent_result", JSON.stringify(data));
      
      router.push("/result");
    } catch (err: any) {
      console.error(err);
      alert(`에이전트 실행 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 gap-6 bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-800">AI FDS 분석 에이전트</h1>
      <p className="text-gray-600">이상거래 탐지 및 로그 분석 시스템</p>

      {/* 모드 선택 버튼 */}
      <div className="flex gap-4">
        <button
          className={`px-6 py-3 rounded-lg border-2 font-semibold transition-colors ${
            mode === "fds"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
          onClick={() => setMode("fds")}
        >
          🔍 FDS 에이전트
        </button>
        <button
          className={`px-6 py-3 rounded-lg border-2 font-semibold transition-colors ${
            mode === "log"
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
          }`}
          onClick={() => setMode("log")}
        >
          📋 로그 분석 에이전트
        </button>
      </div>

      {/* 파일 업로드 */}
      <div className="w-full max-w-md">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          파일 선택
        </label>
        <input
          type="file"
          accept=".csv,.log,.txt"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        {file && (
          <div className="mt-2 text-sm text-gray-600">
            선택된 파일: {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </div>
        )}
      </div>

      {/* 실행 버튼 */}
      <button
        disabled={loading || !file}
        onClick={handleUpload}
        className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin">⏳</span>
            에이전트 실행 중...
          </span>
        ) : (
          "🚀 에이전트 실행"
        )}
      </button>
    </main>
  );
}
