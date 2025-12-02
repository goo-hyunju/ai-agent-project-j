"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MarkdownViewer from "@/components/MarkdownViewer";
import RuleTable from "@/components/RuleTable";
import AnomalyTable from "@/components/AnomalyTable";

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = localStorage.getItem("agent_result");
    if (data) {
      try {
        setResult(JSON.parse(data));
      } catch (err) {
        console.error("Failed to parse result:", err);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <div className="text-gray-600">결과를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 gap-4">
        <div className="text-xl text-gray-600">결과가 없습니다.</div>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          메인 화면으로 돌아가기
        </button>
      </div>
    );
  }

  const agentResult = result.result || {};
  const { summaryStats, ruleCandidates, reportMarkdown, topAnomalies } = agentResult;

  return (
    <main className="min-h-screen p-8 flex flex-col gap-8 bg-gray-50">
      <div className="max-w-7xl mx-auto w-full">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">분석 결과</h1>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            ← 돌아가기
          </button>
        </div>

        {/* 1. 통계 요약 */}
        {summaryStats && (
          <section className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">📊 통계 요약</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-sm text-blue-600 font-medium">총 거래 수</div>
                <div className="text-2xl font-bold text-blue-900">
                  {summaryStats.totalCount?.toLocaleString() || 0}
                </div>
              </div>
              {summaryStats.fraudCount !== undefined && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="text-sm text-red-600 font-medium">사기 거래</div>
                  <div className="text-2xl font-bold text-red-900">
                    {summaryStats.fraudCount?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-red-600 mt-1">
                    ({(summaryStats.fraudRatio * 100 || 0).toFixed(2)}%)
                  </div>
                </div>
              )}
              {summaryStats.avgAmount !== undefined && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-sm text-green-600 font-medium">평균 금액</div>
                  <div className="text-2xl font-bold text-green-900">
                    {Math.round(summaryStats.avgAmount || 0).toLocaleString()}원
                  </div>
                </div>
              )}
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                전체 통계 보기
              </summary>
              <pre className="mt-2 whitespace-pre-wrap text-xs bg-gray-50 p-4 rounded overflow-x-auto">
                {JSON.stringify(summaryStats, null, 2)}
              </pre>
            </details>
          </section>
        )}

        {/* 2. 룰 테이블 */}
        {ruleCandidates && (
          <RuleTable rules={ruleCandidates} />
        )}

        {/* 3. 이상치 테이블 */}
        {topAnomalies && topAnomalies.length > 0 && (
          <AnomalyTable rows={topAnomalies} />
        )}

        {/* 4. Markdown 리포트 */}
        {reportMarkdown && (
          <MarkdownViewer markdown={reportMarkdown} />
        )}

        {/* 디버깅용 원본 데이터 */}
        <details className="bg-gray-100 p-4 rounded-lg">
          <summary className="cursor-pointer text-sm font-medium text-gray-700">
            🔧 원본 응답 데이터 (JSON)
          </summary>
          <pre className="mt-4 text-xs bg-white p-4 rounded overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </details>
      </div>
    </main>
  );
}

