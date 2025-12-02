"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogUploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRun = async () => {
    if (!file) {
      alert("로그 파일을 업로드해주세요.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", "log");

      const res = await fetch("http://localhost:4000/agent/run", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      localStorage.setItem("log_agent_result", JSON.stringify(data));
      router.push("/log/result");
    } catch (err: any) {
      console.error(err);
      alert(`로그 분석 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 gap-8 bg-gray-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">로그 분석 에이전트</h1>
        <p className="text-gray-600">시스템 로그를 분석하여 장애 원인을 자동으로 탐지합니다</p>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            로그 파일 선택
          </label>
          <input
            type="file"
            accept=".log,.txt"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
          {file && (
            <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
              <strong>선택된 파일:</strong> {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </div>
          )}
        </div>

        <button
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
          disabled={loading || !file}
          onClick={handleRun}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span>
              분석 중...
            </span>
          ) : (
            "🚀 로그 분석 실행"
          )}
        </button>
      </div>

      <div className="text-center text-sm text-gray-500">
        <p>지원 형식: .log, .txt</p>
        <p className="mt-1">로그 형식: YYYY-MM-DDTHH:mm:ssZ LEVEL message - key=value</p>
      </div>
    </main>
  );
}

