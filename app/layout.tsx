import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Amki - 스마트 암기 카드',
  description: 'SM-2 알고리즘 기반 간격 반복 학습 앱',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // ADR: 다크 모드 고정 — 학습 앱 특성상 야간 사용 빈도가 높아
    // 다크 모드를 기본으로 고정합니다. 추후 테마 전환이 필요하면
    // next-themes ThemeProvider를 추가하세요.
    <html lang="ko" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  )
}
