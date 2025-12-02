"use client";

import React, { useState } from "react";

export default function SlackMessageBox({ message }: { message?: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    if (!message) return;
    
    navigator.clipboard.writeText(message);
    setCopied(true);
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  if (!message) return null;

  return (
    <section className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-bold text-gray-800">💬 Slack 메시지</h2>
        <button
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            copied
              ? "bg-green-600 text-white"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
          onClick={copyToClipboard}
        >
          {copied ? "✓ 복사됨!" : "📋 복사하기"}
        </button>
      </div>
      <textarea
        className="w-full h-32 border border-gray-300 p-3 rounded-lg text-sm bg-gray-50 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={message}
        readOnly
      />
      <div className="mt-2 text-xs text-gray-500">
        위 메시지를 복사하여 Slack에 붙여넣으세요.
      </div>
    </section>
  );
}

