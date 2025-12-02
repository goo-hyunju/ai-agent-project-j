"use client";

import React from "react";

export default function AnomalyTable({ rows }: { rows: any[] }) {
  if (!rows || rows.length === 0) return null;

  return (
    <section className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-gray-800">⚠️ 이상 거래 TOP {rows.length}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                Time
              </th>
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                Amount
              </th>
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                Hour Bucket
              </th>
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                심야
              </th>
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                사기
              </th>
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                이상치 점수
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 20).map((r, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 text-gray-900">
                  {r.Time || r.time_seconds || "-"}
                </td>
                <td className="border border-gray-300 px-4 py-3 font-medium text-gray-900">
                  {r.amount
                    ? Math.round(r.amount).toLocaleString() + "원"
                    : r.Amount || "-"}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-gray-600">
                  {r.hour_bucket !== undefined ? `${r.hour_bucket}시` : "-"}
                </td>
                <td className="border border-gray-300 px-4 py-3">
                  {r.is_night === 1 ? (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                      심야
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="border border-gray-300 px-4 py-3">
                  {r.is_fraud === 1 || r.Class === 1 ? (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                      사기
                    </span>
                  ) : (
                    <span className="text-gray-400">정상</span>
                  )}
                </td>
                <td className="border border-gray-300 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      {(r.anomaly_score || 0).toFixed(4)}
                    </span>
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-400 to-red-600 transition-all"
                        style={{
                          width: `${Math.min((r.anomaly_score || 0) * 100, 100)}%`,
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
      {rows.length > 20 && (
        <div className="mt-4 text-sm text-gray-500 text-center">
          총 {rows.length}건 중 상위 20건만 표시
        </div>
      )}
    </section>
  );
}

