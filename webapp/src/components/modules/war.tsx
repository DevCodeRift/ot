'use client';

import { Target } from 'lucide-react';

// This is a placeholder - the enhanced version is in war-enhanced.tsx
// and is used in the module page
export default function WarModule() {
  return (
    <div className="space-y-6 p-6 bg-cp-bg-primary min-h-screen">
      <div className="flex items-center space-x-3">
        <Target className="h-8 w-8 text-cp-cyan" />
        <div>
          <h1 className="text-2xl font-cyberpunk text-cp-text-primary">
            War Management
          </h1>
          <p className="text-cp-text-secondary">
            Basic war module - enhanced version available separately.
          </p>
        </div>
      </div>
      
      <div className="cp-card p-6">
        <p className="text-cp-text-secondary">
          This is a placeholder. The enhanced war module with sophisticated raid finder is available.
        </p>
      </div>
    </div>
  );
}