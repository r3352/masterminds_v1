import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { ApolloWrapper } from '@/components/providers/apollo-wrapper'
import { AuthProvider } from '@/contexts/auth-context'
import { WebSocketProvider } from '@/contexts/websocket-context'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Masterminds - Expert Q&A Platform',
  description: 'A Q&A platform that connects you with experts and provides AI-powered answers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ApolloWrapper>
          <AuthProvider>
            <WebSocketProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="light"
                enableSystem
                disableTransitionOnChange
              >
                <div className="min-h-screen flex flex-col">
                  <Navbar />
                  <main className="flex-1">
                    {children}
                  </main>
                  <Footer />
                </div>
              </ThemeProvider>
            </WebSocketProvider>
          </AuthProvider>
        </ApolloWrapper>
      </body>
    </html>
  )
}