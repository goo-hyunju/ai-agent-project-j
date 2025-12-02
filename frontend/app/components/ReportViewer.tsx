"use client";

import React from "react";

interface ReportViewerProps {
  reportMarkdown: string;
  summaryStats?: any;
  ruleCandidates?: any;
  topAnomalies?: any[];
}

export default function ReportViewer({
  reportMarkdown,
  summaryStats,
  ruleCandidates,
  topAnomalies,
}: ReportViewerProps) {
  // 간단한 Markdown을 HTML로 변환 (기본적인 변환)
  const markdownToHtml = (md: string) => {
    let html = md;
    
    // 헤더 변환
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-6 mb-3 border-b pb-2">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>');
    
    // 리스트 변환
    html = html.replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>');
    html = html.replace(/(<li.*<\/li>)/s, '<ul class="list-disc list-inside mb-4">$1</ul>');
    
    // 코드 블록 변환
    html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-4 rounded overflow-x-auto my-4"><code>$1</code></pre>');
    html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>');
    
    // 강조 변환
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // 줄바꿈
    html = html.replace(/\n/g, '<br />');
    
    return html;
  };

  const getRiskBadgeColor = (risk: string) => {
    const riskUpper = risk?.toUpperCase() || "MEDIUM";
    if (riskUpper === "HIGH") return "bg-red-100 text-red-800 border-red-300";
    if (riskUpper === "MEDIUM") return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-green-100 text-green-800 border-green-300";
  };

  const handleDownloadPDF = () => {
    // 간단한 PDF 다운로드 (브라우저 인쇄 기능 활용)
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>FDS 분석 리포트</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #1f2937; }
              h2 { border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-top: 30px; }
              table { border-collapse: collapse; width: 100%; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f3f4f6; }
              pre { background: #f9fafb; padding: 15px; border-radius: 5px; overflow-x: auto; }
            </style>
          </head>
          <body>
            ${markdownToHtml(reportMarkdown)}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* 액션 버튼 */}
      <div className="flex justify-end gap-2">
        <button
          onClick={handleDownloadPDF}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          📄 PDF 다운로드
        </button>
      </div>

      {/* 리포트 본문 */}
      <div
        className="prose prose-sm max-w-none bg-white p-6 rounded-lg border shadow-sm"
        dangerouslySetInnerHTML={{ __html: markdownToHtml(reportMarkdown) }}
      />

      {/* 룰 후보 테이블 (추가 표시) */}
      {ruleCandidates && Array.isArray(ruleCandidates) && ruleCandidates.length > 0 && (
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-bold mb-4">🎯 FDS 룰 후보 상세</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    번호
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    조건
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    설명
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    위험도
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    유형
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ruleCandidates.map((rule: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {rule.condition || rule.조건 || "N/A"}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {rule.description || rule.설명 || "N/A"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full border ${getRiskBadgeColor(
                          rule.riskLevel || rule.risk || rule.위험도
                        )}`}
                      >
                        {rule.riskLevel || rule.risk || rule.위험도 || "MEDIUM"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {rule.ruleType || "GENERAL"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 통계 요약 카드 */}
      {summaryStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      )}

      {/* Top Anomalies 시각화 */}
      {topAnomalies && Array.isArray(topAnomalies) && topAnomalies.length > 0 && (
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-xl font-bold mb-4">⚠️ 이상 거래 Top {topAnomalies.length}</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Hour
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    심야
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    사기
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    이상치 점수
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topAnomalies.slice(0, 10).map((anomaly: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {anomaly.Time || anomaly.time_seconds || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {anomaly.amount
                        ? Math.round(anomaly.amount).toLocaleString() + "원"
                        : anomaly.Amount || "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {anomaly.hour_bucket !== undefined ? `${anomaly.hour_bucket}시` : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {anomaly.is_night === 1 ? (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                          심야
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {anomaly.is_fraud === 1 || anomaly.Class === 1 ? (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                          사기
                        </span>
                      ) : (
                        <span className="text-gray-400">정상</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {(anomaly.anomaly_score || 0).toFixed(3)}
                        </span>
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-yellow-400 to-red-600"
                            style={{
                              width: `${(anomaly.anomaly_score || 0) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {topAnomalies.length > 10 && (
            <div className="mt-4 text-sm text-gray-500 text-center">
              총 {topAnomalies.length}건 중 상위 10건만 표시
            </div>
          )}
        </div>
      )}
    </div>
  );
}

