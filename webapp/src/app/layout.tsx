import { Rajdhani } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const rajdhani = Rajdhani({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700']
})

export const metadata = {
  title: 'Politics & War Alliance Manager',
  description: 'Cyberpunk-themed alliance management platform for Politics & War',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={rajdhani.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
