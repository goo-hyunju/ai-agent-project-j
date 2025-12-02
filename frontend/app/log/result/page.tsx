"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ErrorHourlyChart from "@/components/ErrorHourlyChart";
import MarkdownViewer from "@/components/MarkdownViewer";
import SlackMessageBox from "@/components/SlackMessageBox";
import RootCauseCard from "@/components/RootCauseCard";

export default function LogResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem("log_agent_result");
    if (raw) {
      try {
        setResult(JSON.parse(raw));
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

  if (!result || !result.result) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 gap-4">
        <div className="text-xl text-gray-600">결과가 없습니다.</div>
        <button
          onClick={() => router.push("/log")}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          로그 분석 페이지로 돌아가기
        </button>
      </div>
    );
  }

  const agentResult = result.result;
  const {
    analysis,
    counts,
    hourlyError,
    hourlyWarn,
    topErrorPatterns,
    topJobErrors,
    topDeviceErrors,
    retryStats,
    reportMarkdown,
  } = agentResult;

  return (
    <main className="min-h-screen p-8 flex flex-col gap-8 bg-gray-50">
      <div className="max-w-7xl mx-auto w-full">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">📋 로그 분석 결과</h1>
          <button
            onClick={() => router.push("/log")}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            ← 돌아가기
          </button>
        </div>

        {/* 1) 로그 통계 요약 */}
        {counts && (
          <section className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">📊 통계 요약</h2>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-sm text-blue-600 font-medium">총 로그</div>
                <div className="text-2xl font-bold text-blue-900">
                  {counts.total?.toLocaleString() || 0}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-sm text-green-600 font-medium">INFO</div>
                <div className="text-2xl font-bold text-green-900">
                  {counts.info?.toLocaleString() || 0}
                </div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="text-sm text-yellow-600 font-medium">WARN</div>
                <div className="text-2xl font-bold text-yellow-900">
                  {counts.warn?.toLocaleString() || 0}
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="text-sm text-red-600 font-medium">ERROR</div>
                <div className="text-2xl font-bold text-red-900">
                  {counts.error?.toLocaleString() || 0}
                </div>
              </div>
              {counts.debug !== undefined && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-600 font-medium">DEBUG</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {counts.debug?.toLocaleString() || 0}
                  </div>
                </div>
              )}
              {counts.fatal !== undefined && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-sm text-purple-600 font-medium">FATAL</div>
                  <div className="text-2xl font-bold text-purple-900">
                    {counts.fatal?.toLocaleString() || 0}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 2) 시간대별 에러 그래프 */}
        {hourlyError && (
          <ErrorHourlyChart data={hourlyError} />
        )}

        {/* 3) Root Cause 분석 */}
        {analysis?.root_causes && analysis.root_causes.length > 0 && (
          <section className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">🔍 Root Cause 분석</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.root_causes.map((cause: any, idx: number) => (
                <RootCauseCard key={idx} cause={cause} index={idx} />
              ))}
            </div>
          </section>
        )}

        {/* 4) 대응 가이드 */}
        {analysis?.recommendations && analysis.recommendations.length > 0 && (
          <section className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">💡 대응 가이드</h2>
            <div className="space-y-4">
              {analysis.recommendations.map((rec: any, idx: number) => (
                <div
                  key={idx}
                  className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {idx + 1}
                      </span>
                      <h3 className="font-semibold text-gray-800">
                        {rec.action || rec.recommendation || `가이드 ${idx + 1}`}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      {rec.immediate !== undefined && (
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            rec.immediate
                              ? "bg-orange-100 text-orange-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {rec.immediate ? "즉시 조치" : "계획 필요"}
                        </span>
                      )}
                      {rec.priority && (
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            rec.priority === "HIGH"
                              ? "bg-red-100 text-red-800"
                              : rec.priority === "MEDIUM"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {rec.priority}
                        </span>
                      )}
                    </div>
                  </div>
                  {rec.description && (
                    <p className="text-sm text-gray-600 ml-8">{rec.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5) 상위 에러 패턴 */}
        {topErrorPatterns && topErrorPatterns.length > 0 && (
          <section className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">⚠️ 상위 에러 패턴</h2>
            <div className="space-y-2">
              {topErrorPatterns.slice(0, 5).map((pattern: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <code className="text-sm text-gray-700 flex-1">{pattern.pattern}</code>
                  <span className="ml-4 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                    {pattern.count}회
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6) 문제가 있는 Job/Device */}
        {(topJobErrors?.length > 0 || topDeviceErrors?.length > 0) && (
          <section className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">🎯 문제 집중 영역</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {topJobErrors && topJobErrors.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Job ID별 에러</h3>
                  <div className="space-y-2">
                    {topJobErrors.slice(0, 5).map((job: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <code className="text-sm">job_id={job.jobId}</code>
                        <span className="text-red-600 font-semibold">{job.count}건</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {topDeviceErrors && topDeviceErrors.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Device별 에러</h3>
                  <div className="space-y-2">
                    {topDeviceErrors.slice(0, 5).map((device: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <code className="text-sm">device={device.device}</code>
                        <span className="text-red-600 font-semibold">{device.count}건</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 7) Slack 메시지 */}
        {analysis?.slack_message && (
          <SlackMessageBox message={analysis.slack_message} />
        )}

        {/* 8) Markdown 리포트 */}
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

