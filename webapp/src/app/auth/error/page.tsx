'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const errorMessages = {
  Configuration: 'There is a problem with the server configuration.',
  AccessDenied: 'You do not have permission to sign in.',
  Verification: 'The verification token has expired or has already been used.',
  Default: 'An error occurred during authentication.',
  OAuthSignin: 'Error in constructing an authorization URL.',
  OAuthCallback: 'Error in handling the response from an OAuth provider.',
  OAuthCreateAccount: 'Could not create OAuth provider user in the database.',
  EmailCreateAccount: 'Could not create email provider user in the database.',
  Callback: 'Error in the OAuth callback handler route.',
  OAuthAccountNotLinked: 'The email on the account is already linked, but not with this OAuth account.',
  EmailSignin: 'Sending the email with the verification token failed.',
  CredentialsSignin: 'The authorize callback returned null in the Credentials provider.',
  SessionRequired: 'You must be signed in to view this page.'
}

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className="min-h-screen bg-cp-bg-primary flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-cp-bg-secondary border border-cp-border rounded-lg p-6 text-center">
        <h1 className="text-2xl font-bold text-cp-text-primary mb-4">
          Authentication Error
        </h1>
        <div className="mb-6">
          <p className="text-cp-text-secondary mb-2">
            Error Type: <span className="text-cp-red font-mono">{error || 'Unknown'}</span>
          </p>
          <p className="text-cp-text-muted text-sm">
            {errorMessages[error as keyof typeof errorMessages] || errorMessages.Default}
          </p>
        </div>
        
        {error === 'OAuthCallback' && (
          <div className="bg-cp-bg-tertiary border border-cp-red rounded p-4 mb-4 text-left">
            <h3 className="text-cp-red font-semibold mb-2">OAuth Callback Error</h3>
            <p className="text-cp-text-secondary text-sm">
              This usually indicates a mismatch between the redirect URI configured in Discord 
              and the callback URL your application is expecting.
            </p>
            <p className="text-cp-text-secondary text-sm mt-2">
              Please verify that your Discord application has the correct redirect URI:
              <br />
              <code className="text-cp-cyan bg-cp-bg-primary px-1 rounded">
                {typeof window !== 'undefined' ? `${window.location.origin}/api/auth/callback/discord` : ''}
              </code>
            </p>
          </div>
        )}

        <div className="space-y-3">
          <a
            href="/auth/signin"
            className="block w-full bg-cp-cyan text-cp-bg-primary px-4 py-2 rounded font-medium hover:bg-cp-cyan/90 transition-colors"
          >
            Try Again
          </a>
          <a
            href="/"
            className="block w-full border border-cp-border text-cp-text-primary px-4 py-2 rounded font-medium hover:border-cp-cyan hover:text-cp-cyan transition-colors"
          >
            Go Home
          </a>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-cp-bg-tertiary border border-cp-yellow rounded text-left">
            <h3 className="text-cp-yellow font-semibold mb-2">Debug Info</h3>
            <pre className="text-xs text-cp-text-secondary overflow-auto">
              {JSON.stringify(Object.fromEntries(searchParams.entries()), null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cp-bg-primary flex items-center justify-center">
        <div className="text-cp-cyan">Loading...</div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}
