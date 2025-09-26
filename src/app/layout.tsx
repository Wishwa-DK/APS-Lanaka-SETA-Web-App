import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'APS Lanka - Cybersecurity Training Platform',
  description: 'Secure, educational, and compliance-focused platform for strengthening policy enforcement and reducing cyber risks',
  keywords: 'cybersecurity, training, compliance, policy management, risk assessment',
  authors: [{ name: 'APS Lanka' }],
  robots: 'noindex, nofollow', // Remove in production
}

import { ToastProvider } from '../components/Toast'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self';" />
      </head>
      <body className="min-h-screen bg-gray-50 font-sans antialiased" suppressHydrationWarning={true}>
        <ToastProvider>
          <div className="flex flex-col min-h-screen">
            {children}
          </div>
        </ToastProvider>
      </body>
    </html>
  )
}