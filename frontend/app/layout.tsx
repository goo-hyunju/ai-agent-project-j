import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI 데이터 에이전트',
  description: 'FDS 이상거래 탐지 및 로그 분석 에이전트',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}

