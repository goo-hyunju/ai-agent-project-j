"use client";

import React from "react";

interface RootCause {
  cause?: string;
  evidence?: string;
  probability?: string;
  description?: string;
}

interface RootCauseCardProps {
  cause: RootCause | string;
  index: number;
}

export default function RootCauseCard({ cause, index }: RootCauseCardProps) {
  // 문자열인 경우와 객체인 경우 모두 처리
  const isString = typeof cause === "string";
  const causeObj = isString ? { cause: cause } : cause;

  const getProbabilityColor = (prob?: string) => {
    const probUpper = prob?.toUpperCase() || "";
    if (probUpper === "HIGH") return "bg-red-100 text-red-800 border-red-300";
    if (probUpper === "MEDIUM") return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-green-100 text-green-800 border-green-300";
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
            {index + 1}
          </span>
          <h3 className="font-semibold text-gray-800">
            {causeObj.cause || `원인 ${index + 1}`}
          </h3>
        </div>
        {causeObj.probability && (
          <span
            className={`px-2 py-1 text-xs font-semibold rounded-full border ${getProbabilityColor(
              causeObj.probability
            )}`}
          >
            {causeObj.probability}
          </span>
        )}
      </div>
      
      {causeObj.description && (
        <p className="text-sm text-gray-600 mb-2">{causeObj.description}</p>
      )}
      
      {causeObj.evidence && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-500 font-medium mb-1">증거:</div>
          <code className="text-xs bg-gray-50 px-2 py-1 rounded text-gray-700">
            {causeObj.evidence}
          </code>
        </div>
      )}
    </div>
  );
}

