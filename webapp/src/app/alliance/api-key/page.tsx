'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Key, ExternalLink, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface AllianceInfo {
  id: number
  name: string
  acronym: string
  hasApiKey: boolean
  isAdmin: boolean
}

export default function AllianceApiKeySetup() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [alliance, setAlliance] = useState<AllianceInfo | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    valid: boolean
    alliance?: {
      id: number
      name: string
      acronym: string
    }
    error?: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }

    fetchAllianceInfo()
  }, [session, status])

  const fetchAllianceInfo = async () => {
    try {
      const response = await fetch('/api/alliance/admin-info')
      if (!response.ok) {
        if (response.status === 403) {
          router.push('/dashboard')
          return
        }
        throw new Error('Failed to fetch alliance info')
      }
      const data = await response.json()
      setAlliance(data.alliance)
      
      if (data.alliance?.hasApiKey) {
        // Alliance already has API key, redirect to dashboard
        router.push(`/${data.alliance.id}/dashboard`)
      }
    } catch (error) {
      console.error('Failed to fetch alliance info:', error)
    } finally {
      setLoading(false)
    }
  }

  const testApiKey = async () => {
    if (!apiKey.trim()) {
      setValidationResult({ valid: false, error: 'Please enter an API key to test' })
      return
    }

    setIsValidating(true)
    setValidationResult(null)

    try {
      const response = await fetch('/api/alliance/test-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      })

      const data = await response.json()

      if (response.ok && data.valid) {
        setValidationResult({
          valid: true,
          alliance: data.alliance,
        })
      } else {
        setValidationResult({
          valid: false,
          error: data.error || 'Invalid API key',
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

  const saveApiKey = async () => {
    if (!validationResult?.valid) {
      return
    }

    setIsValidating(true)

    try {
      const response = await fetch('/api/alliance/api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      })

      if (response.ok) {
        // Success - redirect to alliance dashboard
        router.push(`/${alliance?.id}/dashboard`)
      } else {
        const data = await response.json()
        setValidationResult({
          valid: false,
          error: data.error || 'Failed to save API key',
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

  if (loading) {
    return (
      <div className="min-h-screen bg-cp-bg-primary flex items-center justify-center">
        <div className="cp-card p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cp-cyan mx-auto mb-4"></div>
          <p className="text-cp-text-secondary">Loading alliance information...</p>
        </div>
      </div>
    )
  }

  if (!alliance) {
    return (
      <div className="min-h-screen bg-cp-bg-primary flex items-center justify-center">
        <div className="cp-card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cp-red/20 flex items-center justify-center">
            <span className="text-cp-red text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-cyberpunk text-cp-red mb-2">Access Denied</h3>
          <p className="text-cp-text-secondary">
            You are not an administrator of any alliance.
          </p>
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
            ALLIANCE API KEY SETUP
          </h1>
          <p className="text-cp-text-secondary mt-1">
            Configure your alliance's Politics & War API key
          </p>
        </div>
      </div>

      <div className="cp-container py-8">
        <div className="max-w-2xl mx-auto">
          {/* Alliance Info */}
          <div className="cp-card p-6 mb-6">
            <h2 className="text-xl font-semibold text-cp-text-primary mb-4">
              Alliance: {alliance.name}
            </h2>
            <div className="space-y-2">
              <p className="text-cp-text-secondary">
                <span className="font-medium">ID:</span> {alliance.id}
              </p>
              <p className="text-cp-text-secondary">
                <span className="font-medium">Acronym:</span> {alliance.acronym}
              </p>
              <p className="text-cp-text-secondary">
                <span className="font-medium">Your Role:</span> Alliance Administrator
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="cp-card p-6 mb-6">
            <h3 className="text-lg font-semibold text-cp-text-primary mb-3">
              Politics & War API Key Required
            </h3>
            <p className="text-cp-text-secondary mb-4">
              To manage your alliance through this platform, you need to provide a Politics & War API key 
              that has access to your alliance's data.
            </p>
            <div className="border-l-4 border-cp-cyan pl-4 mb-4">
              <p className="text-cp-cyan font-medium">Important:</p>
              <p className="text-cp-text-secondary text-sm">
                This API key will be used for all alliance operations including member management, 
                banking, and war coordination. Make sure it has the necessary permissions.
              </p>
            </div>
            <a 
              href="https://politicsandwar.com/account/api" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-cp-cyan hover:text-cp-cyan-bright transition-colors"
            >
              Get your API key from Politics & War
              <ExternalLink className="w-4 h-4 ml-2" />
            </a>
          </div>

          {/* API Key Input */}
          <div className="cp-card p-6">
            <h3 className="text-lg font-semibold text-cp-text-primary mb-4">
              Enter API Key
            </h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-cp-text-primary mb-2">
                  Politics & War API Key
                </label>
                <input
                  type="password"
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="cp-input"
                  placeholder="Enter your alliance's API key"
                  disabled={isValidating}
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={testApiKey}
                  disabled={!apiKey.trim() || isValidating}
                  className="cp-button-secondary"
                >
                  {isValidating ? 'Testing...' : 'Test API Key'}
                </button>
                
                {validationResult?.valid && (
                  <button
                    onClick={saveApiKey}
                    disabled={isValidating}
                    className="cp-button-primary"
                  >
                    Save & Continue
                  </button>
                )}
              </div>
            </div>

            {/* Validation Result */}
            {validationResult && (
              <div className={`mt-4 p-4 rounded border ${
                validationResult.valid 
                  ? 'border-cp-green bg-cp-green/10' 
                  : 'border-cp-red bg-cp-red/10'
              }`}>
                <div className="flex items-center">
                  {validationResult.valid ? (
                    <CheckCircle className="w-5 h-5 text-cp-green mr-2" />
                  ) : (
                    <XCircle className="w-5 h-5 text-cp-red mr-2" />
                  )}
                  <span className={`font-medium ${
                    validationResult.valid ? 'text-cp-green' : 'text-cp-red'
                  }`}>
                    {validationResult.valid ? 'API Key Valid!' : 'Validation Failed'}
                  </span>
                </div>
                
                {validationResult.valid && validationResult.alliance && (
                  <div className="mt-2 text-sm text-cp-text-secondary">
                    <p>Alliance: {validationResult.alliance.name} ({validationResult.alliance.acronym})</p>
                    <p>Alliance ID: {validationResult.alliance.id}</p>
                  </div>
                )}
                
                {!validationResult.valid && validationResult.error && (
                  <p className="mt-2 text-sm text-cp-red">
                    {validationResult.error}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
