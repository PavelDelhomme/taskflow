import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TaskFlow ADHD',
  description: 'Gestion de tâches adaptée TDAH',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
