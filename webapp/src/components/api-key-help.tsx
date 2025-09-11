'use client'

import { ExternalLink, AlertCircle, Key, HelpCircle } from 'lucide-react'
import { useState } from 'react'

export function ApiKeyHelp() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="mt-6 cp-card border-cp-border-accent">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-cp-bg-tertiary transition-colors"
      >
        <div className="flex items-center">
          <HelpCircle className="w-5 h-5 text-cp-cyan mr-3" />
          <span className="font-medium text-cp-text-primary">Need help getting your API key?</span>
        </div>
        <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
          ↓
        </div>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-cp-border">
          <div className="space-y-4 mt-4">
            {/* How to get API key */}
            <div>
              <h4 className="font-semibold text-cp-cyan flex items-center mb-2">
                <Key className="w-4 h-4 mr-2" />
                How to get your Politics & War API Key
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-cp-text-secondary ml-6">
                <li>Log in to your Politics & War account</li>
                <li>Go to Account Settings → API</li>
                <li>Generate a new API key if you don't have one</li>
                <li>Copy the API key and paste it above</li>
              </ol>
              <a
                href="https://politicsandwar.com/account/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center mt-2 text-cp-cyan hover:text-cp-yellow transition-colors text-sm"
              >
                Open Politics & War Account Settings
                <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            </div>

            {/* Common issues */}
            <div>
              <h4 className="font-semibold text-cp-orange flex items-center mb-2">
                <AlertCircle className="w-4 h-4 mr-2" />
                Common Issues
              </h4>
              <ul className="space-y-2 text-sm text-cp-text-secondary">
                <li className="flex items-start">
                  <span className="text-cp-red mr-2">•</span>
                  <div>
                    <strong>401 Unauthorized:</strong> Your API key is invalid or expired. 
                    Generate a new one from your account settings.
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-cp-red mr-2">•</span>
                  <div>
                    <strong>API Temporarily Unavailable:</strong> The Politics & War API may be 
                    experiencing issues. Try again in a few minutes.
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-cp-red mr-2">•</span>
                  <div>
                    <strong>Rate Limited:</strong> Too many requests. Wait a moment before trying again.
                  </div>
                </li>
              </ul>
            </div>

            {/* API Key format */}
            <div>
              <h4 className="font-semibold text-cp-green flex items-center mb-2">
                <span className="w-4 h-4 mr-2">✓</span>
                API Key Format
              </h4>
              <p className="text-sm text-cp-text-secondary">
                Your API key should be a long string of letters and numbers. It typically looks like:
              </p>
              <code className="block mt-2 p-2 bg-cp-bg-tertiary border border-cp-border rounded text-xs font-mono text-cp-text-primary">
                a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...
              </code>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
