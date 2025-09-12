import React, { useState } from 'react';

interface LocutusRaidTarget {
  id: number;
  nation_name: string;
  leader_name: string;
  alliance_name?: string;
  score: number;
  cities: number;
  soldiers: number;
  tanks: number;
  aircraft: number;
  ships: number;
  spies: number;
  last_active: string;
  beige_turns: number;
  vacation_mode_turns: number;
  color: string;
  
  // Locutus calculations
  lootTotal: number;
  avgInfra: number;
  militaryStrength: number;
  groundStrength: number;
  isActive: boolean;
  activityMinutes: number;
  defWars: number;
  targetScore: number;
  raidAdvice: string[];
}

interface LocutusRaidResponse {
  success: boolean;
  userNation: {
    id: number;
    name: string;
    score: number;
    scoreRange: { min: number; max: number };
    military: {
      soldiers: number;
      tanks: number;
      aircraft: number;
      ships: number;
    };
  };
  targets: LocutusRaidTarget[];
  metadata: {
    totalFound: number;
    searchCriteria: any;
    implementation: string;
    filteringApplied: string[];
  };
}

export default function LocutusRaidFinder() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LocutusRaidResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Locutus-style parameters
  const [numResults, setNumResults] = useState(5);
  const [weakground, setWeakground] = useState(false);
  const [activeTimeCutoff, setActiveTimeCutoff] = useState(10000);
  const [beigeTurns, setBeigeTurns] = useState(-1);
  const [vmTurns, setVmTurns] = useState(0);
  const [defensiveSlots, setDefensiveSlots] = useState(-1);
  const [minLoot, setMinLoot] = useState(0);

  const findTargets = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        numResults: (numResults || 5).toString(),
        weakground: (weakground || false).toString(),
        activeTimeCutoff: (activeTimeCutoff || 10000).toString(),
        beigeTurns: (beigeTurns || -1).toString(),
        vmTurns: (vmTurns || 0).toString(),
        defensiveSlots: (defensiveSlots || -1).toString(),
        minLoot: (minLoot || 0).toString()
      });

      const response = await fetch(`/api/modules/war/raid?${params}`);
      const data = await response.json();
      
      if (response.status === 401) {
        setError('Authentication required. Please sign in with Discord to use the raid finder.');
        return;
      }
      
      if (data.error) {
        setError(data.error);
      } else {
        // Debug: Log first target's loot data
        if (data.targets && data.targets.length > 0) {
          console.log('[Frontend Debug] First target loot data:', {
            name: data.targets[0].nation_name,
            lootTotal: data.targets[0].lootTotal,
            cities: data.targets[0].cities,
            score: data.targets[0].score
          });
        }
        setResults(data);
      }
    } catch (err) {
      setError('Failed to fetch raid targets');
      console.error('Raid finder error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (!num || num === null || num === undefined) {
      return '0';
    }
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatTimeAgo = (minutes: number) => {
    if (!minutes || minutes === null || minutes === undefined) {
      return 'Unknown';
    }
    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (minutes < 1440) {
      return `${Math.floor(minutes / 60)}h ago`;
    } else {
      return `${Math.floor(minutes / 1440)}d ago`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-cyan-400 mb-2">
            Locutus Raid Finder
          </h1>
          <p className="text-gray-400">
            Faithful port of the proven Locutus raid finder algorithm
          </p>
        </div>

        {/* Controls */}
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Search Parameters</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label htmlFor="numResults" className="block text-sm text-gray-300 mb-1">Results</label>
              <input
                id="numResults"
                type="number"
                value={numResults || 5}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value;
                  if (value === '') {
                    setNumResults(5);
                  } else {
                    setNumResults(parseInt(value) || 5);
                  }
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                min={1}
                max={25}
              />
            </div>
            
            <div>
              <label htmlFor="activeTimeCutoff" className="block text-sm text-gray-300 mb-1">Inactive Minutes</label>
              <input
                id="activeTimeCutoff"
                type="number"
                value={activeTimeCutoff || 10000}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value;
                  if (value === '') {
                    setActiveTimeCutoff(10000);
                  } else {
                    setActiveTimeCutoff(parseInt(value) || 10000);
                  }
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
            
            <div>
              <label htmlFor="minLoot" className="block text-sm text-gray-300 mb-1">Min Loot</label>
              <input
                id="minLoot"
                type="number"
                value={minLoot || 0}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value;
                  if (value === '') {
                    setMinLoot(0);
                  } else {
                    setMinLoot(parseFloat(value) || 0);
                  }
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
            
            <div>
              <label htmlFor="defensiveSlots" className="block text-sm text-gray-300 mb-1">Max Def Wars</label>
              <input
                id="defensiveSlots"
                type="number"
                value={defensiveSlots || -1}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value;
                  if (value === '') {
                    setDefensiveSlots(-1);
                  } else {
                    setDefensiveSlots(parseInt(value) || -1);
                  }
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center space-x-2">
              <input
                id="weakground"
                type="checkbox"
                checked={weakground}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setWeakground(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="weakground" className="text-white">
                Weak Ground Only
              </label>
            </div>
          </div>

          <button 
            onClick={findTargets} 
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded transition-colors"
          >
            {loading ? 'Finding Targets...' : 'Find Raid Targets'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900 border border-red-600 rounded-lg p-4">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Results */}
        {results && (
          <>
            {/* User Info */}
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-2">Your Nation</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Nation:</span>
                  <p className="text-white font-medium">{results.userNation?.name || 'Unknown'}</p>
                </div>
                <div>
                  <span className="text-gray-400">Score:</span>
                  <p className="text-white font-medium">{(results.userNation?.score || 0).toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-gray-400">Range:</span>
                  <p className="text-white font-medium">
                    {(results.userNation?.scoreRange?.min || 0).toFixed(2)} - {(results.userNation?.scoreRange?.max || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400">Military:</span>
                  <p className="text-white font-medium">
                    {formatNumber(results.userNation?.military?.soldiers || 0)}👥 {formatNumber(results.userNation?.military?.tanks || 0)}🚗 {formatNumber(results.userNation?.military?.aircraft || 0)}✈️ {formatNumber(results.userNation?.military?.ships || 0)}🚢
                  </p>
                </div>
              </div>
            </div>

            {/* Targets */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">
                Raid Targets ({results.targets.length} found)
              </h3>
              
              {results.targets.map((target, index) => (
                <div key={target.id} className="bg-gray-800 border border-gray-600 hover:border-cyan-400 rounded-lg p-4 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {/* Nation Header */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl font-bold text-cyan-400">#{index + 1}</span>
                        <div>
                          <h4 className="text-lg font-semibold text-white">
                            {target.nation_name || 'Unknown Nation'}
                          </h4>
                          <p className="text-sm text-gray-400">
                            {target.leader_name || 'Unknown Leader'} | {target.alliance_name || 'No Alliance'} | Score: {(target.score || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Target Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                        <div>
                          <span className="text-gray-400">Cities:</span>
                          <span className="text-white ml-1 font-medium">{target.cities || 0}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Military:</span>
                          <div className="text-white">
                            {formatNumber(target.soldiers || 0)}👥 {formatNumber(target.tanks || 0)}🚗
                          </div>
                          <div className="text-white">
                            {formatNumber(target.aircraft || 0)}✈️ {formatNumber(target.ships || 0)}🚢
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Loot:</span>
                          <span className="text-white ml-1 font-medium">
                            ${formatNumber(target.lootTotal || 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Activity:</span>
                          <span className={`ml-1 font-medium ${target.isActive ? 'text-red-400' : 'text-green-400'}`}>
                            {formatTimeAgo(target.activityMinutes || 0)}
                          </span>
                        </div>
                      </div>

                      {/* Raid Advice */}
                      {target.raidAdvice && target.raidAdvice.length > 0 && (
                        <div className="mb-3">
                          <span className="text-gray-400 text-sm">Advice:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {target.raidAdvice.map((advice, i) => (
                              <span key={i} className="text-xs bg-cyan-900 text-cyan-300 px-2 py-1 rounded">
                                {advice || 'No advice'}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* War Status */}
                      <div className="text-sm">
                        <span className="text-gray-400">Wars:</span>
                        <span className="text-white ml-1">
                          {target.defWars || 0} defensive
                        </span>
                        {(target.beige_turns || 0) > 0 && (
                          <span className="text-yellow-400 ml-2">
                            Beige: {target.beige_turns || 0} turns
                          </span>
                        )}
                        {(target.vacation_mode_turns || 0) > 0 && (
                          <span className="text-orange-400 ml-2">
                            VM: {target.vacation_mode_turns || 0} turns
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Target Score */}
                    <div className="text-right">
                      <div className="text-2xl font-bold text-cyan-400">
                        {(target.targetScore || 0).toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-400">
                        Target Score
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Metadata */}
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-2">Search Results</h4>
              <p className="text-sm text-gray-400">
                Implementation: {results.metadata?.implementation || 'Unknown'}
              </p>
              <p className="text-sm text-gray-400">
                Found {results.metadata?.totalFound || 0} potential targets after filtering
              </p>
              <div className="text-xs text-gray-500 mt-2">
                Filters: {results.metadata?.filteringApplied?.join(', ') || 'None'}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}