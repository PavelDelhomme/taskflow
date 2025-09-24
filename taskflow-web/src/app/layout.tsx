import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { Toaster } from 'react-hot-toast'
import 'bootstrap/dist/css/bootstrap.min.css'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TaskFlow ADHD - Tracking Professionnel',
  description: 'Système de gestion de tâches optimisé pour TDAH avec tracking professionnel - Paul Delhomme',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" data-bs-theme="dark">
      <body className={inter.className}>
        {children}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#2d3748',
              color: '#fff',
              border: '1px solid #4a5568'
            }
          }}
        />
        
        {/* Bootstrap JS */}
        <Script 
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" 
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}