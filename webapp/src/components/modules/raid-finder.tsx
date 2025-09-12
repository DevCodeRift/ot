'use client';

import React, { useState } from 'react';
import { Search, Target, Shield, Activity, DollarSign, Zap, AlertTriangle, ChevronDown, ChevronUp, User, Star } from 'lucide-react';

interface RaidTarget {
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
  
  // Calculated values
  lootTotal: number;
  avgInfra: number;
  militaryStrength: number;
  groundStrength: number;
  isActive: boolean;
  activityMinutes: number;
  defWars: number;
  targetScore: number;
  raidAdvice: string[];
  
  // Debug breakdown
  debugBreakdown?: {
    baseIncomePerCity: number;
    totalGrossIncome: number;
    netIncomePerDay: number;
    daysOfSavings: number;
    estimatedCash: number;
    lootableCash: number;
    resourceValue: number;
    infraLootValue: number;
    militaryValue: number;
    wealthMultiplier: number;
    inactivityBonus: number;
    finalLoot: number;
  };
}

interface RaidFinderResponse {
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
  targets: RaidTarget[];
  metadata: {
    totalFound: number;
    searchCriteria: any;
    implementation: string;
    filteringApplied: string[];
  };
}

export default function RaidFinder() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RaidFinderResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedTargets, setExpandedTargets] = useState<Set<number>>(new Set());
  
  // Search parameters
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
        setError('Authentication required. Please sign in with Discord to access the raid finder.');
        return;
      }
      
      if (data.error) {
        setError(data.error);
      } else {
        setResults(data);
      }
    } catch (err) {
      setError('Failed to connect to raid finder service');
      console.error('Raid finder error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTargetExpansion = (targetId: number) => {
    const newExpanded = new Set(expandedTargets);
    if (newExpanded.has(targetId)) {
      newExpanded.delete(targetId);
    } else {
      newExpanded.add(targetId);
    }
    setExpandedTargets(newExpanded);
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

  const getActivityStatusColor = (isActive: boolean) => {
    return isActive ? 'text-cp-red' : 'text-cp-green';
  };

  const getLootColor = (amount: number) => {
    if (amount >= 10000000) return 'text-cp-yellow'; // 10M+
    if (amount >= 5000000) return 'text-cp-green';   // 5M+
    if (amount >= 1000000) return 'text-cp-cyan';    // 1M+
    return 'text-cp-text-secondary';
  };

  return (
    <div className="min-h-screen bg-cp-bg-primary text-cp-text-primary">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header Section */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Target className="w-8 h-8 text-cp-cyan" />
            <h1 className="text-4xl font-cyberpunk font-bold text-cp-cyan">
              RAID FINDER
            </h1>
            <Target className="w-8 h-8 text-cp-cyan" />
          </div>
          <p className="text-cp-text-secondary text-lg">
            Advanced target acquisition system for military operations
          </p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-cp-cyan rounded-full animate-pulse"></div>
            <span className="text-cp-cyan text-sm font-mono">SYSTEM ONLINE</span>
            <div className="w-2 h-2 bg-cp-cyan rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="bg-cp-bg-secondary border border-cp-border rounded-lg p-6 relative overflow-hidden">
          {/* Background Grid Effect */}
          <div className="absolute inset-0 opacity-5">
            <div className="grid grid-cols-12 h-full">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="border-r border-cp-cyan"></div>
              ))}
            </div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <Search className="w-5 h-5 text-cp-cyan" />
              <h2 className="text-xl font-cyberpunk font-semibold text-cp-text-primary">SEARCH PARAMETERS</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-cp-text-secondary">
                  Results Count
                </label>
                <input
                  type="number"
                  value={numResults || 5}
                  onChange={(e) => setNumResults(parseInt(e.target.value) || 5)}
                  className="w-full bg-cp-bg-tertiary border border-cp-border rounded px-3 py-2 text-cp-text-primary focus:border-cp-cyan focus:outline-none focus:ring-1 focus:ring-cp-cyan transition-colors"
                  min={1}
                  max={25}
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-cp-text-secondary">
                  Inactive Minutes
                </label>
                <input
                  type="number"
                  value={activeTimeCutoff || 10000}
                  onChange={(e) => setActiveTimeCutoff(parseInt(e.target.value) || 10000)}
                  className="w-full bg-cp-bg-tertiary border border-cp-border rounded px-3 py-2 text-cp-text-primary focus:border-cp-cyan focus:outline-none focus:ring-1 focus:ring-cp-cyan transition-colors"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-cp-text-secondary">
                  Minimum Loot ($)
                </label>
                <input
                  type="number"
                  value={minLoot || 0}
                  onChange={(e) => setMinLoot(parseFloat(e.target.value) || 0)}
                  className="w-full bg-cp-bg-tertiary border border-cp-border rounded px-3 py-2 text-cp-text-primary focus:border-cp-cyan focus:outline-none focus:ring-1 focus:ring-cp-cyan transition-colors"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-cp-text-secondary">
                  Max Defensive Wars
                </label>
                <input
                  type="number"
                  value={defensiveSlots || -1}
                  onChange={(e) => setDefensiveSlots(parseInt(e.target.value) || -1)}
                  className="w-full bg-cp-bg-tertiary border border-cp-border rounded px-3 py-2 text-cp-text-primary focus:border-cp-cyan focus:outline-none focus:ring-1 focus:ring-cp-cyan transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center space-x-6 mb-6">
              <div className="flex items-center space-x-2">
                <input
                  id="weakground"
                  type="checkbox"
                  checked={weakground}
                  onChange={(e) => setWeakground(e.target.checked)}
                  className="w-4 h-4 rounded border-cp-border bg-cp-bg-tertiary text-cp-cyan focus:ring-cp-cyan"
                />
                <label htmlFor="weakground" className="text-cp-text-primary font-medium">
                  Target Weak Ground Forces Only
                </label>
              </div>
            </div>

            <button 
              onClick={findTargets} 
              disabled={loading}
              className="w-full bg-gradient-to-r from-cp-cyan to-cp-green hover:from-cp-green hover:to-cp-cyan disabled:from-cp-border disabled:to-cp-border text-cp-bg-primary font-cyberpunk font-bold py-3 px-6 rounded transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-cp-cyan/20"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-cp-bg-primary border-t-transparent rounded-full animate-spin"></div>
                  SCANNING TARGETS...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  INITIATE RAID SCAN
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-cp-bg-secondary border border-cp-red rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-cp-red flex-shrink-0" />
            <p className="text-cp-red">{error}</p>
          </div>
        )}

        {/* Results */}
        {results && (
          <>
            {/* User Nation Info */}
            <div className="bg-cp-bg-secondary border border-cp-border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-cp-cyan" />
                <h3 className="text-lg font-cyberpunk font-semibold text-cp-text-primary">OPERATOR PROFILE</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-cp-text-secondary text-sm">Nation:</span>
                  <p className="text-cp-text-primary font-medium">{results.userNation?.name || 'Unknown'}</p>
                </div>
                <div>
                  <span className="text-cp-text-secondary text-sm">Score:</span>
                  <p className="text-cp-cyan font-medium">{(results.userNation?.score || 0).toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-cp-text-secondary text-sm">Target Range:</span>
                  <p className="text-cp-yellow font-medium">
                    {(results.userNation?.scoreRange?.min || 0).toFixed(2)} - {(results.userNation?.scoreRange?.max || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <span className="text-cp-text-secondary text-sm">Military Assets:</span>
                  <div className="text-cp-green font-medium text-sm">
                    <div>{formatNumber(results.userNation?.military?.soldiers || 0)} Soldiers</div>
                    <div>{formatNumber(results.userNation?.military?.tanks || 0)} Tanks | {formatNumber(results.userNation?.military?.aircraft || 0)} Aircraft | {formatNumber(results.userNation?.military?.ships || 0)} Ships</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Targets */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Target className="w-6 h-6 text-cp-cyan" />
                <h3 className="text-xl font-cyberpunk font-bold text-cp-text-primary">
                  RAID TARGETS IDENTIFIED
                </h3>
                <span className="bg-cp-cyan text-cp-bg-primary px-2 py-1 rounded text-sm font-bold">
                  {results.targets.length}
                </span>
              </div>
              
              {results.targets.map((target, index) => {
                const isExpanded = expandedTargets.has(target.id);
                return (
                  <div key={target.id} className="bg-cp-bg-secondary border border-cp-border hover:border-cp-cyan rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-cp-cyan/10">
                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          {/* Target Header */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className="bg-cp-cyan text-cp-bg-primary w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                              #{index + 1}
                            </div>
                            <div>
                              <h4 className="text-lg font-cyberpunk font-bold text-cp-text-primary">
                                {target.nation_name || 'Unknown Nation'}
                              </h4>
                              <p className="text-sm text-cp-text-secondary">
                                {target.leader_name || 'Unknown Leader'} • {target.alliance_name || 'No Alliance'} • Score: {(target.score || 0).toFixed(2)}
                              </p>
                            </div>
                          </div>

                          {/* Target Stats Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="bg-cp-bg-tertiary border border-cp-border rounded p-3">
                              <div className="text-cp-text-secondary text-xs uppercase font-medium mb-1">Cities</div>
                              <div className="text-cp-text-primary text-lg font-bold">{target.cities || 0}</div>
                            </div>
                            <div className="bg-cp-bg-tertiary border border-cp-border rounded p-3">
                              <div className="text-cp-text-secondary text-xs uppercase font-medium mb-1">Military</div>
                              <div className="text-cp-text-primary text-xs space-y-1">
                                <div>{formatNumber(target.soldiers || 0)} Soldiers</div>
                                <div>{formatNumber(target.tanks || 0)} Tanks</div>
                                <div>{formatNumber(target.aircraft || 0)} Aircraft</div>
                                <div>{formatNumber(target.ships || 0)} Ships</div>
                              </div>
                            </div>
                            <div className="bg-cp-bg-tertiary border border-cp-border rounded p-3">
                              <div className="text-cp-text-secondary text-xs uppercase font-medium mb-1">Loot Value</div>
                              <div className={`text-lg font-bold ${getLootColor(target.lootTotal || 0)}`}>
                                ${formatNumber(target.lootTotal || 0)}
                              </div>
                            </div>
                            <div className="bg-cp-bg-tertiary border border-cp-border rounded p-3">
                              <div className="text-cp-text-secondary text-xs uppercase font-medium mb-1">Activity</div>
                              <div className={`font-medium ${getActivityStatusColor(target.isActive)}`}>
                                {formatTimeAgo(target.activityMinutes || 0)}
                              </div>
                            </div>
                          </div>

                          {/* Combat Advice */}
                          {target.raidAdvice && target.raidAdvice.length > 0 && (
                            <div className="mb-4">
                              <div className="text-cp-text-secondary text-sm mb-2">Tactical Recommendations:</div>
                              <div className="flex flex-wrap gap-2">
                                {target.raidAdvice.map((advice, i) => (
                                  <span key={i} className="bg-cp-cyan/20 text-cp-cyan px-3 py-1 rounded-full text-xs border border-cp-cyan/30">
                                    {advice || 'Standard approach'}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* War Status */}
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Shield className="w-4 h-4 text-cp-text-secondary" />
                              <span className="text-cp-text-secondary">Defensive Wars:</span>
                              <span className="text-cp-text-primary font-medium">{target.defWars || 0}</span>
                            </div>
                            {(target.beige_turns || 0) > 0 && (
                              <div className="text-cp-yellow">
                                Beige: {target.beige_turns} turns
                              </div>
                            )}
                            {(target.vacation_mode_turns || 0) > 0 && (
                              <div className="text-cp-orange">
                                VM: {target.vacation_mode_turns} turns
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Target Score */}
                        <div className="text-right ml-6">
                          <div className="bg-cp-bg-tertiary border border-cp-cyan rounded-lg p-4">
                            <div className="text-3xl font-bold text-cp-cyan">
                              {(target.targetScore || 0).toFixed(1)}
                            </div>
                            <div className="text-sm text-cp-text-secondary uppercase font-medium">
                              Target Score
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Debug Breakdown */}
                      {target.debugBreakdown && (
                        <div className="mt-4 border-t border-cp-border pt-4">
                          <button
                            onClick={() => toggleTargetExpansion(target.id)}
                            className="flex items-center gap-2 text-cp-cyan hover:text-cp-green transition-colors"
                          >
                            <Activity className="w-4 h-4" />
                            <span className="text-sm font-medium">Loot Analysis</span>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          
                          {isExpanded && (
                            <div className="mt-3 bg-cp-bg-primary/50 rounded-lg p-4 border border-cp-border/50">
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                                <div className="space-y-1">
                                  <div className="text-cp-text-secondary">Base Income/City:</div>
                                  <div className="text-cp-green font-medium">${formatNumber(target.debugBreakdown.baseIncomePerCity)}</div>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-cp-text-secondary">Daily Gross Income:</div>
                                  <div className="text-cp-green font-medium">${formatNumber(target.debugBreakdown.totalGrossIncome)}</div>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-cp-text-secondary">Net Income/Day:</div>
                                  <div className="text-cp-blue font-medium">${formatNumber(target.debugBreakdown.netIncomePerDay)}</div>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-cp-text-secondary">Days of Savings:</div>
                                  <div className="text-cp-yellow font-medium">{target.debugBreakdown.daysOfSavings.toFixed(1)}</div>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-cp-text-secondary">Estimated Cash:</div>
                                  <div className="text-cp-green font-medium">${formatNumber(target.debugBreakdown.estimatedCash)}</div>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-cp-text-secondary">Lootable Cash (14%):</div>
                                  <div className="text-cp-cyan font-medium">${formatNumber(target.debugBreakdown.lootableCash)}</div>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-cp-text-secondary">Resource Stockpile:</div>
                                  <div className="text-cp-purple font-medium">${formatNumber(target.debugBreakdown.resourceValue)}</div>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-cp-text-secondary">Infrastructure Loot:</div>
                                  <div className="text-cp-orange font-medium">${formatNumber(target.debugBreakdown.infraLootValue)}</div>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-cp-text-secondary">Military Equipment:</div>
                                  <div className="text-cp-red font-medium">${formatNumber(target.debugBreakdown.militaryValue)}</div>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-cp-text-secondary">Wealth Multiplier:</div>
                                  <div className="text-cp-yellow font-medium">{target.debugBreakdown.wealthMultiplier.toFixed(2)}x</div>
                                </div>
                                <div className="space-y-1">
                                  <div className="text-cp-text-secondary">Inactivity Bonus:</div>
                                  <div className="text-cp-pink font-medium">{target.debugBreakdown.inactivityBonus.toFixed(2)}x</div>
                                </div>
                                <div className="col-span-2 md:col-span-3 border-t border-cp-border pt-2 mt-2">
                                  <div className="text-cp-text-secondary">Final Loot Total:</div>
                                  <div className="text-cp-cyan font-bold text-lg">${formatNumber(target.debugBreakdown.finalLoot)}</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Search Metadata */}
            <div className="bg-cp-bg-secondary border border-cp-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-cp-cyan" />
                <h4 className="font-cyberpunk font-semibold text-cp-text-primary">SCAN RESULTS</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-cp-text-secondary">Implementation:</span>
                  <span className="text-cp-text-primary ml-2">{results.metadata?.implementation || 'Standard'}</span>
                </div>
                <div>
                  <span className="text-cp-text-secondary">Targets Found:</span>
                  <span className="text-cp-cyan ml-2 font-medium">{results.metadata?.totalFound || 0}</span>
                </div>
                <div>
                  <span className="text-cp-text-secondary">Filters Applied:</span>
                  <span className="text-cp-green ml-2">{results.metadata?.filteringApplied?.length || 0}</span>
                </div>
              </div>
              {results.metadata?.filteringApplied && results.metadata.filteringApplied.length > 0 && (
                <div className="mt-2 text-xs text-cp-text-muted">
                  Active Filters: {results.metadata.filteringApplied.join(', ')}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}