import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cartify - Next.js Full-Stack App',
  description: 'A modern full-stack application built with Next.js 15, TypeScript, and Tailwind CSS',
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
