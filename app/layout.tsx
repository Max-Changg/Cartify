import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cartify - Next.js Full-Stack App',
  description: 'A modern full-stack application built with Next.js 15, TypeScript, and Tailwind CSS',
  icons: {
    icon: [
      { url: '/cart-logo1.png', sizes: '32x32', type: 'image/png' },
      { url: '/cart-logo1.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/cart-logo1.png',
    apple: [
      { url: '/cart-logo1.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
