import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: '羊蹄山之魂 - AI开放世界RPG',
  description: 'AI驱动的开放世界角色扮演游戏，每次冒险都是独一无二的叙事体验',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <Script id="tailwind-config" strategy="beforeInteractive" dangerouslySetInnerHTML={{
          __html: `window.tailwind = window.tailwind || {}; tailwind.config = {
            theme: {
              extend: {
                colors: {
                  dark: {
                    100: '#1e293b',
                    200: '#0f172a',
                    300: '#0a0f1a',
                  },
                  gold: {
                    400: '#f59e0b',
                    500: '#d97706',
                    600: '#b45309',
                  }
                }
              }
            }
          };`
        }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
