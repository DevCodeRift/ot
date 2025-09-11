'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Key, ExternalLink, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { ApiKeyHelp } from '@/components/api-key-help'

export default function ApiKeySetup() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [apiKey, setApiKey] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    valid: boolean
    nation?: {
      id: number
      nation_name: string
      leader_name: string
      alliance_id: number
      alliance?: {
        id: number
        name: string
        acronym: string
      }
    }
    error?: string
  } | null>(null)

  const testApiKey = async () => {
    if (!apiKey.trim()) {
      setValidationResult({ valid: false, error: 'Please enter an API key to test' })
      return
    }

    setIsValidating(true)
    setValidationResult(null)

    try {
      const response = await fetch('/api/test/api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      })

      const data = await response.json()
      console.log('Test API response:', data)

      setValidationResult({
        valid: data.success || false,
        error: data.success ? 'Test successful! Check console for details.' : `Test failed: ${JSON.stringify(data, null, 2)}`,
      })
    } catch (error) {
      setValidationResult({
        valid: false,
        error: 'Test request failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
      })
    } finally {
      setIsValidating(false)
    }
  }

  const validateAndSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setValidationResult({ valid: false, error: 'Please enter an API key' })
      return
    }

    setIsValidating(true)
    setValidationResult(null)

    try {
      const response = await fetch('/api/user/api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        setValidationResult({
          valid: true,
          nation: data.nation,
        })
        
        // Update the session with new user data
        await update()
        
        // Redirect to dashboard immediately after session update
        router.push('/dashboard')
      } else {
        setValidationResult({
          valid: false,
          error: data.error || 'Failed to validate API key',
        })
      }
    } catch (error) {
      setValidationResult({
        valid: false,
        error: 'Network error. Please try again.',
      })
    } finally {
      setIsValidating(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-cp-bg-primary flex items-center justify-center">
        <div className="cp-card p-8 text-center">
          <p className="text-cp-text-secondary">Please sign in to continue</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cp-bg-primary">
      {/* Header */}
      <div className="border-b border-cp-border bg-cp-bg-secondary">
        <div className="cp-container py-4">
          <h1 className="text-2xl font-bold font-cyberpunk text-cp-text-primary flex items-center">
            <Key className="w-8 h-8 text-cp-cyan mr-3" />
            API KEY CONFIGURATION
          </h1>
          <p className="text-cp-text-secondary mt-1">
            Connect your Politics & War account to access alliance management features
          </p>
        </div>
      </div>

      <div className="cp-container py-8">
        <div className="max-w-2xl mx-auto">
          {/* Welcome message */}
          <div className="cp-card p-6 mb-6">
            <h2 className="text-xl font-semibold text-cp-text-primary mb-4">
              Welcome, {session.user.name}!
            </h2>
            <p className="text-cp-text-secondary">
              To access the alliance management features, we need to link your Politics & War account using your API key.
            </p>
          </div>

          {/* Instructions */}
          <div className="cp-card p-6 mb-6">
            <h3 className="text-lg font-semibold text-cp-text-primary mb-4 flex items-center">
              <AlertCircle className="w-5 h-5 text-cp-yellow mr-2" />
              How to get your API Key
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-cp-text-secondary">
              <li>
                Go to your{' '}
                <a
                  href="https://politicsandwar.com/account/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cp-cyan hover:text-cp-yellow transition-colors inline-flex items-center"
                >
                  Politics & War Account Settings
                  <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              </li>
              <li>Scroll down to the "API Key" section</li>
              <li>Generate a new API key if you don't have one</li>
              <li>Copy the API key and paste it below</li>
            </ol>
            <div className="mt-4 p-4 bg-cp-bg-tertiary border border-cp-border rounded-sm">
              <p className="text-sm text-cp-text-muted">
                <strong>Note:</strong> Your API key is stored securely and encrypted. We only use it to fetch your nation data and alliance information.
              </p>
            </div>
          </div>

          {/* API Key Input */}
          <div className="cp-card p-6">
            <h3 className="text-lg font-semibold text-cp-text-primary mb-4">
              Enter your API Key
            </h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-cp-text-secondary mb-2">
                  Politics & War API Key
                </label>
                <input
                  type="password"
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key here..."
                  className="cp-input"
                  disabled={isValidating}
                />
              </div>

              {/* Validation Result */}
              {validationResult && (
                <div className={`p-4 rounded-sm border ${
                  validationResult.valid 
                    ? 'bg-green-900/20 border-cp-green text-cp-green' 
                    : 'bg-red-900/20 border-cp-red text-cp-red'
                }`}>
                  <div className="flex items-center">
                    {validationResult.valid ? (
                      <CheckCircle className="w-5 h-5 mr-2" />
                    ) : (
                      <XCircle className="w-5 h-5 mr-2" />
                    )}
                    <span className="font-medium">
                      {validationResult.valid ? 'API Key Validated!' : 'Validation Failed'}
                    </span>
                  </div>
                  
                  {validationResult.valid && validationResult.nation && (
                    <div className="mt-2 text-sm">
                      <p><strong>Nation:</strong> {validationResult.nation.nation_name}</p>
                      <p><strong>Leader:</strong> {validationResult.nation.leader_name}</p>
                      {validationResult.nation.alliance && (
                        <p><strong>Alliance:</strong> {validationResult.nation.alliance.name} [{validationResult.nation.alliance.acronym}]</p>
                      )}
                      <p className="mt-2 text-cp-text-secondary">Redirecting to dashboard...</p>
                    </div>
                  )}
                  
                  {!validationResult.valid && validationResult.error && (
                    <p className="mt-2 text-sm">{validationResult.error}</p>
                  )}
                </div>
              )}

              <button
                onClick={validateAndSaveApiKey}
                disabled={isValidating || !apiKey.trim()}
                className={`
                  w-full cp-button-primary py-3 px-6 rounded-sm font-semibold
                  ${(isValidating || !apiKey.trim()) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
                  transition-all duration-300
                `}
              >
                {isValidating ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin w-5 h-5 border-2 border-cp-bg-primary border-t-transparent rounded-full mr-2"></div>
                    VALIDATING...
                  </div>
                ) : (
                  'VALIDATE & SAVE API KEY'
                )}
              </button>
            </div>
          </div>

          {/* Help section */}
          <ApiKeyHelp />

          {/* Security info */}
          <div className="mt-6 text-center text-sm text-cp-text-muted">
            <p>🔒 All API keys are encrypted and stored securely</p>
            <p className="mt-1">We never store or log your API key in plain text</p>
          </div>
        </div>
      </div>
    </div>
  )
}
