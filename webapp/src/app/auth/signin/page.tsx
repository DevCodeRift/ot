'use client'

import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { Shield, Zap, Users, BarChart3 } from 'lucide-react'

function SignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>({})
  
  const error = searchParams.get('error')
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  useEffect(() => {
    // Check if user is already signed in
    getSession().then((session) => {
      if (session) {
        router.push('/')
      }
    })
    
    // Set debug info
    if (typeof window !== 'undefined') {
      setDebugInfo({
        baseUrl: window.location.origin,
        callbackUrl,
        error,
        userAgent: navigator.userAgent,
        redirectUri: `${window.location.origin}/api/auth/callback/discord`
      })
    }
  }, [router, callbackUrl, error])

  const handleDiscordSignIn = async () => {
    setIsLoading(true)
    console.log('Initiating Discord OAuth with:', { callbackUrl, baseUrl: window.location.origin })
    try {
      const result = await signIn('discord', { 
        callbackUrl,
        redirect: true 
      })
      console.log('SignIn result:', result)
    } catch (error) {
      console.error('Sign in error:', error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cp-bg-primary flex items-center justify-center relative overflow-hidden">
      {/* Cyberpunk background effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cp-cyan to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cp-cyan to-transparent"></div>
        <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-cp-cyan to-transparent"></div>
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-cp-cyan to-transparent"></div>
      </div>

      {/* Animated grid background */}
      <div className="absolute inset-0" style={{
        backgroundImage: `
          linear-gradient(rgba(0, 245, 255, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 245, 255, 0.1) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        animation: 'grid-move 20s linear infinite'
      }}></div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          {/* Logo/Title */}
          <div className="mb-6">
            <h1 className="text-4xl md:text-6xl font-bold font-cyberpunk text-transparent bg-clip-text bg-gradient-to-r from-cp-cyan via-cp-green to-cp-yellow">
              POLITICS & WAR
            </h1>
            <p className="text-xl md:text-2xl font-cyberpunk text-cp-text-accent mt-2">
              ALLIANCE COMMAND CENTER
            </p>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="cp-card text-center p-4">
              <Shield className="w-8 h-8 text-cp-cyan mx-auto mb-2" />
              <p className="text-sm font-medium">Secure</p>
            </div>
            <div className="cp-card text-center p-4">
              <Zap className="w-8 h-8 text-cp-yellow mx-auto mb-2" />
              <p className="text-sm font-medium">Fast</p>
            </div>
            <div className="cp-card text-center p-4">
              <Users className="w-8 h-8 text-cp-green mx-auto mb-2" />
              <p className="text-sm font-medium">Collaborative</p>
            </div>
            <div className="cp-card text-center p-4">
              <BarChart3 className="w-8 h-8 text-cp-purple mx-auto mb-2" />
              <p className="text-sm font-medium">Analytics</p>
            </div>
          </div>
        </div>

        {/* Sign in card */}
        <div className="max-w-md mx-auto">
          <div className="cp-card p-8 text-center">
            <h2 className="text-2xl font-bold font-cyberpunk text-cp-text-primary mb-6">
              ACCESS TERMINAL
            </h2>
            
            {error && (
              <div className="bg-cp-red/10 border border-cp-red rounded p-3 mb-4">
                <p className="text-cp-red text-sm">
                  Authentication error: {error}
                </p>
              </div>
            )}
            
            <p className="text-cp-text-secondary mb-6">
              Connect your Discord account to access the alliance management system
            </p>

            <button
              onClick={handleDiscordSignIn}
              disabled={isLoading}
              className={`
                w-full cp-button-primary py-3 px-6 rounded-sm font-semibold text-lg
                ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                transition-all duration-300
              `}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin w-5 h-5 border-2 border-cp-bg-primary border-t-transparent rounded-full mr-2"></div>
                  CONNECTING...
                </div>
              ) : (
                <>
                  <svg className="w-6 h-6 inline mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.246.195.372.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.981.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.201 0 2.176 1.068 2.157 2.38 0 1.311-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.2 0 2.176 1.068 2.157 2.38 0 1.311-.956 2.38-2.157 2.38z"/>
                  </svg>
                  CONNECT WITH DISCORD
                </>
              )}
            </button>

            <div className="mt-6 text-xs text-cp-text-muted">
              <p>Secure authentication via Discord OAuth</p>
              <p className="mt-1">No passwords required • Data encrypted</p>
            </div>
          </div>
        </div>

        {/* System info */}
        <div className="mt-8 text-center text-cp-text-muted text-sm">
          <p>SYSTEM STATUS: <span className="text-cp-green">ONLINE</span></p>
          <p className="mt-1">SECURITY LEVEL: <span className="text-cp-cyan">MAXIMUM</span></p>
        </div>
        
        {/* Debug info - development only */}
        {process.env.NODE_ENV === 'development' && Object.keys(debugInfo).length > 0 && (
          <div className="mt-8 max-w-md mx-auto">
            <div className="cp-card p-4">
              <h3 className="text-cp-yellow font-semibold mb-2 text-center">Debug Info</h3>
              <pre className="text-xs text-cp-text-secondary overflow-auto max-h-40">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes grid-move {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
      `}</style>
    </div>
  )
}

export default function SignIn() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cp-bg-primary flex items-center justify-center">
        <div className="text-cp-cyan">Loading...</div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}
