'use client';

import { useState } from 'react';

export default function APITestPage() {
  const [nationId, setNationId] = useState('713897');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testNationActivity = async () => {
    if (!nationId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test/nation-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nationId: parseInt(nationId) })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }
      
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cp-bg-primary text-cp-text-primary p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-cyberpunk text-cp-cyan mb-8">
          Politics & War API Test
        </h1>
        
        <div className="bg-cp-bg-secondary border border-cp-border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-cp-yellow mb-4">
            Test Nation Activity Detection
          </h2>
          
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={nationId}
              onChange={(e) => setNationId(e.target.value)}
              placeholder="Nation ID"
              className="bg-cp-bg-tertiary border border-cp-border text-cp-text-primary px-4 py-2 rounded focus:border-cp-cyan focus:outline-none"
            />
            <button
              onClick={testNationActivity}
              disabled={loading || !nationId}
              className="bg-cp-cyan text-cp-bg-primary px-6 py-2 rounded font-semibold hover:bg-cp-cyan/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Testing...' : 'Test Activity'}
            </button>
          </div>
          
          <p className="text-cp-text-secondary text-sm">
            This will check for: Recent trades, bank deposits, new cities, new projects
          </p>
        </div>

        {error && (
          <div className="bg-cp-red/20 border border-cp-red text-cp-red p-4 rounded mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}

        {results && (
          <div className="bg-cp-bg-secondary border border-cp-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-cp-green mb-4">
              Results for Nation {results.nationId}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-cp-bg-tertiary p-4 rounded">
                  <h4 className="font-semibold text-cp-yellow mb-2">Nation Info</h4>
                  <p>Name: {results.nation?.nation_name}</p>
                  <p>Leader: {results.nation?.leader_name}</p>
                  <p>Score: {results.nation?.score}</p>
                  <p>Cities: {results.nation?.num_cities}</p>
                  <p>Last Active: {results.nation?.last_active}</p>
                </div>

                <div className="bg-cp-bg-tertiary p-4 rounded">
                  <h4 className="font-semibold text-cp-yellow mb-2">Recent Trades</h4>
                  <p>Count: {results.trades?.length || 0}</p>
                  {results.trades?.slice(0, 3).map((trade: any, i: number) => (
                    <div key={i} className="text-sm text-cp-text-secondary">
                      {trade.offer_resource} - {trade.buy_or_sell} - {trade.date}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-cp-bg-tertiary p-4 rounded">
                  <h4 className="font-semibold text-cp-yellow mb-2">Bank Records</h4>
                  <p>Count: {results.bankRecords?.length || 0}</p>
                  {results.bankRecords?.slice(0, 3).map((record: any, i: number) => (
                    <div key={i} className="text-sm text-cp-text-secondary">
                      ${record.money} - {record.note} - {record.date}
                    </div>
                  ))}
                </div>

                <div className="bg-cp-bg-tertiary p-4 rounded">
                  <h4 className="font-semibold text-cp-yellow mb-2">Activity Summary</h4>
                  <p>Has Recent Trades: {results.activitySummary?.hasRecentTrades ? 'Yes' : 'No'}</p>
                  <p>Has Bank Activity: {results.activitySummary?.hasBankActivity ? 'Yes' : 'No'}</p>
                  <p>Activity Score: {results.activitySummary?.activityScore}</p>
                </div>
              </div>
            </div>

            <details className="mt-6">
              <summary className="cursor-pointer text-cp-cyan hover:text-cp-cyan/80">
                View Raw Data
              </summary>
              <pre className="mt-4 bg-cp-bg-primary p-4 rounded text-sm overflow-auto max-h-96">
                {JSON.stringify(results, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}