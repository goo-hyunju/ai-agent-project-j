"use client";

import React from "react";

export default function RuleTable({ rules }: { rules: any[] }) {
  if (!rules || rules.length === 0) return null;

  const getRiskBadgeColor = (risk: string) => {
    const riskUpper = risk?.toUpperCase() || "MEDIUM";
    if (riskUpper === "HIGH") return "bg-red-100 text-red-800 border-red-300";
    if (riskUpper === "MEDIUM") return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-green-100 text-green-800 border-green-300";
  };

  return (
    <section className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-gray-800">🎯 FDS 룰 후보</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                번호
              </th>
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                조건
              </th>
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                설명
              </th>
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                위험도
              </th>
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">
                유형
              </th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-3 text-gray-900 font-medium">
                  {idx + 1}
                </td>
                <td className="border border-gray-300 px-4 py-3">
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                    {r.condition || r.조건 || "N/A"}
                  </code>
                </td>
                <td className="border border-gray-300 px-4 py-3 text-gray-700">
                  {r.description || r.설명 || "N/A"}
                </td>
                <td className="border border-gray-300 px-4 py-3">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full border ${getRiskBadgeColor(
                      r.risk || r.riskLevel || r.위험도 || "MEDIUM"
                    )}`}
                  >
                    {r.risk || r.riskLevel || r.위험도 || "MEDIUM"}
                  </span>
                </td>
                <td className="border border-gray-300 px-4 py-3 text-gray-600 text-xs">
                  {r.ruleType || "GENERAL"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

