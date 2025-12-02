"use client";

import React from "react";

export default function ErrorHourlyChart({ data }: { data: number[] }) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  const max = Math.max(...data, 1); // 0으로 나누기 방지

  return (
    <section className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-gray-800">⏰ 시간대별 에러 발생</h2>
      <div className="grid grid-cols-12 md:grid-cols-24 gap-1 md:gap-2 h-48 items-end">
        {data.map((v, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="relative w-full flex items-end justify-center" style={{ height: "100%" }}>
              <div
                className="w-full bg-gradient-to-t from-red-600 to-red-400 rounded-t transition-all hover:from-red-700 hover:to-red-500"
                style={{
                  height: `${(v / max) * 100}%`,
                  minHeight: v > 0 ? "4px" : "0",
                }}
                title={`${i}시: ${v}건`}
              />
            </div>
            <span className="text-[10px] md:text-xs text-gray-500 font-medium">{i}</span>
            {v > 0 && (
              <span className="text-[9px] text-red-600 font-semibold">{v}</span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>에러 발생</span>
          </div>
          <div className="text-gray-400">최대: {max}건</div>
        </div>
      </div>
    </section>
  );
}

