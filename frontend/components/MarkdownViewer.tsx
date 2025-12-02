"use client";

import React from "react";

export default function MarkdownViewer({ markdown }: { markdown: string }) {
  if (!markdown) return null;

  // 간단한 Markdown을 HTML로 변환
  const markdownToHtml = (md: string) => {
    let html = md;
    
    // 헤더 변환
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-6 mb-3 text-gray-800">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-8 mb-4 text-gray-800 border-b pb-2">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-10 mb-5 text-gray-900">$1</h1>');
    
    // 리스트 변환
    html = html.replace(/^- (.*$)/gim, '<li class="ml-6 mb-1">$1</li>');
    html = html.replace(/(<li.*<\/li>)/s, '<ul class="list-disc list-inside mb-4 space-y-1">$1</ul>');
    
    // 코드 블록 변환
    html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4 border"><code class="text-sm">$1</code></pre>');
    html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');
    
    // 강조 변환
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
    
    // 테이블 변환 (간단한 마크다운 테이블)
    html = html.replace(/\|(.+)\|/g, (match, content) => {
      const cells = content.split('|').map((cell: string) => cell.trim());
      if (cells[0].includes('---')) {
        return ''; // 헤더 구분선 제거
      }
      return `<tr>${cells.map((cell: string) => `<td class="border px-3 py-2">${cell}</td>`).join('')}</tr>`;
    });
    
    // 줄바꿈
    html = html.replace(/\n\n/g, '</p><p class="mb-4">');
    html = html.replace(/\n/g, '<br />');
    
    return `<div class="prose prose-sm max-w-none">${html}</div>`;
  };

  return (
    <section className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-gray-800">📄 상세 리포트</h2>
      <div
        className="prose prose-sm max-w-none text-gray-700"
        dangerouslySetInnerHTML={{ __html: markdownToHtml(markdown) }}
      />
    </section>
  );
}

