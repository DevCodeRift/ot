'use client';

import { useState, useEffect } from 'react';
import { Target, Users, Sword, Shield, DollarSign, Activity, Calendar, MapPin, Search, Filter, Zap, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface TargetNation {
  id: string;
  name: string;
  leader: string;
  score: number;
  alliance_id?: number;
  alliance_name?: string;
  cities: number;
  soldiers: number;
  tanks: number;
  aircraft: number;
  ships: number;
  
  // Enhanced Locutus-inspired data
  totalValue: number;
  accessibleValue: number;
  accessibility: number;
  activityScore: number;
  activityFactors: {
    loginActivity: number;
    economicActivity: number;
    warActivity: number;
  };
  militaryStrength: {
    ground: number;
    air: number;
    naval: number;
    total: number;
  };
  raidAnalysis: {
    successChance: number;
    recommendation: string;
    risks: string[];
  };
  targetScore: number;
  
  last_active: string;
  beige_turns: number;
  color: string;
  vacation_mode_turns: number;
  wars: any[];
  defensiveWars: number;
}

interface RaidFinderFilters {
  minActivity: number;
  excludeAlliances: string[];
  excludeColors: string[];
  excludeVacation: boolean;
  excludeBeige: boolean;
  
  // Enhanced Locutus-inspired filters
  weakGroundOnly: boolean;
  maxDefensiveWars: number;
  minGroundRatio: number;
  minAirRatio: number;
  minNavalRatio: number;
  minSuccessChance: number;
  minAccessibleValue: number;
}

interface RaidFinderResponse {
  targets: TargetNation[];
  metadata: {
    userMilitary: {
      soldiers: number;
      tanks: number;
      aircraft: number;
      ships: number;
    };
    filters: any;
    totalTargets: number;
    raidAdvice: string[];
  };
}

export default function WarModuleEnhanced() {
  const [targets, setTargets] = useState<TargetNation[]>([]);
  const [loading, setLoading] = useState(false);
  const [userMilitary, setUserMilitary] = useState<any>(null);
  const [raidAdvice, setRaidAdvice] = useState<string[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<TargetNation | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const [filters, setFilters] = useState<RaidFinderFilters>({
    minActivity: 7,
    excludeAlliances: [],
    excludeColors: [],
    excludeVacation: true,
    excludeBeige: false,
    
    // Enhanced Locutus-inspired filters
    weakGroundOnly: false,
    maxDefensiveWars: 3,
    minGroundRatio: 0.5,
    minAirRatio: 0.5,
    minNavalRatio: 0.5,
    minSuccessChance: 0.6,
    minAccessibleValue: 10000000, // 10M minimum accessible value
  });

  const [filterInputs, setFilterInputs] = useState({
    excludeAlliancesText: '',
    excludeColorsText: '',
  });

  const searchTargets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        allianceId: '790', // This should come from user alliance  
        minActivity: filters.minActivity.toString(),
        excludeVacation: filters.excludeVacation.toString(),
        excludeBeige: filters.excludeBeige.toString(),
        weakGroundOnly: filters.weakGroundOnly.toString(),
        maxDefensiveWars: filters.maxDefensiveWars.toString(),
        minGroundRatio: filters.minGroundRatio.toString(),
        minAirRatio: filters.minAirRatio.toString(),
        minNavalRatio: filters.minNavalRatio.toString(),
        minSuccessChance: filters.minSuccessChance.toString(),
        minAccessibleValue: filters.minAccessibleValue.toString(),
      });

      if (filters.excludeAlliances.length > 0) {
        params.append('excludeAlliances', filters.excludeAlliances.join(','));
      }

      if (filters.excludeColors.length > 0) {
        params.append('excludeColors', filters.excludeColors.join(','));
      }

      const response = await fetch(`/api/modules/war/raid-finder?${params}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch targets');
      }

      const data: RaidFinderResponse = await response.json();
      setTargets(data.targets);
      setUserMilitary(data.metadata.userMilitary);
      setRaidAdvice(data.metadata.raidAdvice || []);
    } catch (error) {
      console.error('Error fetching targets:', error);
      // Handle error - maybe show a toast notification
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (key: keyof RaidFinderFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (num: number): string => {
    return `$${formatNumber(num)}`;
  };

  const getSuccessColor = (chance: number): string => {
    if (chance >= 0.8) return 'text-green-400';
    if (chance >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getActivityColor = (score: number): string => {
    if (score >= 0.7) return 'text-red-400'; // Very inactive = good target
    if (score >= 0.4) return 'text-yellow-400';
    return 'text-green-400'; // Very active = poor target
  };

  const getColorClasses = (color: string): string => {
    const colorMap: { [key: string]: string } = {
      beige: 'bg-amber-900/20 text-amber-400 border-amber-600',
      gray: 'bg-gray-900/20 text-gray-400 border-gray-600',
      lime: 'bg-lime-900/20 text-lime-400 border-lime-600',
      green: 'bg-green-900/20 text-green-400 border-green-600',
      white: 'bg-gray-800/20 text-gray-300 border-gray-500',
      brown: 'bg-yellow-900/20 text-yellow-400 border-yellow-600',
      maroon: 'bg-red-900/20 text-red-400 border-red-600',
      purple: 'bg-purple-900/20 text-purple-400 border-purple-600',
      blue: 'bg-blue-900/20 text-blue-400 border-blue-600',
      red: 'bg-red-900/20 text-red-400 border-red-600',
      orange: 'bg-orange-900/20 text-orange-400 border-orange-600',
      yellow: 'bg-yellow-900/20 text-yellow-400 border-yellow-600',
      pink: 'bg-pink-900/20 text-pink-400 border-pink-600',
      olive: 'bg-green-900/20 text-green-400 border-green-600',
      aqua: 'bg-cyan-900/20 text-cyan-400 border-cyan-600',
    };
    return colorMap[color.toLowerCase()] || 'bg-gray-900/20 text-gray-400 border-gray-600';
  };

  const getDaysAgo = (dateString: string): number => {
    const date = new Date(dateString);
    const now = new Date();
    return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6 p-6 bg-cp-bg-primary min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Target className="h-8 w-8 text-cp-cyan" />
          <div>
            <h1 className="text-2xl font-cyberpunk text-cp-text-primary">
              Enhanced Raid Finder
            </h1>
            <p className="text-cp-text-secondary">
              Locutus-inspired sophisticated target analysis
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="cp-button flex items-center space-x-2"
        >
          <Filter className="h-4 w-4" />
          <span>Advanced Filters</span>
        </button>
      </div>

      {/* Raid Advice */}
      {raidAdvice.length > 0 && (
        <div className="cp-card p-4 border-l-4 border-cp-cyan">
          <h3 className="text-lg font-semibold text-cp-cyan mb-2 flex items-center">
            <Zap className="h-5 w-5 mr-2" />
            Raid Intelligence
          </h3>
          <ul className="space-y-1">
            {raidAdvice.map((advice, index) => (
              <li key={index} className="text-cp-text-secondary flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-cp-cyan flex-shrink-0" />
                {advice}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* User Military Stats */}
      {userMilitary && (
        <div className="cp-card p-4">
          <h3 className="text-lg font-semibold text-cp-text-primary mb-3 flex items-center">
            <Shield className="h-5 w-5 mr-2 text-cp-cyan" />
            Your Military Forces
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-cp-text-secondary text-sm">Soldiers</p>
              <p className="text-cp-text-primary font-medium">{formatNumber(userMilitary.soldiers)}</p>
            </div>
            <div className="text-center">
              <p className="text-cp-text-secondary text-sm">Tanks</p>
              <p className="text-cp-text-primary font-medium">{formatNumber(userMilitary.tanks)}</p>
            </div>
            <div className="text-center">
              <p className="text-cp-text-secondary text-sm">Aircraft</p>
              <p className="text-cp-text-primary font-medium">{formatNumber(userMilitary.aircraft)}</p>
            </div>
            <div className="text-center">
              <p className="text-cp-text-secondary text-sm">Ships</p>
              <p className="text-cp-text-primary font-medium">{formatNumber(userMilitary.ships)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Basic Filters */}
      <div className="cp-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-cp-text-secondary text-sm mb-2">Min Activity (days)</label>
            <input
              type="number"
              value={filters.minActivity}
              onChange={(e) => updateFilter('minActivity', parseInt(e.target.value))}
              className="w-full bg-cp-bg-secondary border border-cp-border rounded px-3 py-2 text-cp-text-primary focus:border-cp-cyan focus:outline-none"
            />
          </div>
          
          <div className="flex items-center space-x-2 pt-6">
            <input
              type="checkbox"
              checked={filters.excludeVacation}
              onChange={(e) => updateFilter('excludeVacation', e.target.checked)}
              className="text-cp-cyan focus:ring-cp-cyan"
            />
            <label className="text-cp-text-secondary text-sm">Exclude Vacation</label>
          </div>
          
          <div className="flex items-center space-x-2 pt-6">
            <input
              type="checkbox"
              checked={filters.excludeBeige}
              onChange={(e) => updateFilter('excludeBeige', e.target.checked)}
              className="text-cp-cyan focus:ring-cp-cyan"
            />
            <label className="text-cp-text-secondary text-sm">Exclude Beige</label>
          </div>
          
          <div className="flex items-center space-x-2 pt-6">
            <input
              type="checkbox"
              checked={filters.weakGroundOnly}
              onChange={(e) => updateFilter('weakGroundOnly', e.target.checked)}
              className="text-cp-cyan focus:ring-cp-cyan"
            />
            <label className="text-cp-text-secondary text-sm">Weak Ground Only</label>
          </div>
          
          <button
            onClick={searchTargets}
            disabled={loading}
            className="cp-button px-6 py-2 mt-4 flex items-center justify-center space-x-2"
          >
            <Search className="h-4 w-4" />
            <span>{loading ? 'Analyzing...' : 'Find Targets'}</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="cp-card p-6 border-l-4 border-cp-yellow">
          <h3 className="text-lg font-semibold text-cp-text-primary mb-4">Advanced Military Analysis Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-cp-text-secondary text-sm mb-2">Max Defensive Wars</label>
              <input
                type="number"
                value={filters.maxDefensiveWars}
                onChange={(e) => updateFilter('maxDefensiveWars', parseInt(e.target.value))}
                className="w-full bg-cp-bg-secondary border border-cp-border rounded px-3 py-2 text-cp-text-primary focus:border-cp-cyan focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-cp-text-secondary text-sm mb-2">Min Ground Ratio</label>
              <input
                type="number"
                step="0.1"
                value={filters.minGroundRatio}
                onChange={(e) => updateFilter('minGroundRatio', parseFloat(e.target.value))}
                className="w-full bg-cp-bg-secondary border border-cp-border rounded px-3 py-2 text-cp-text-primary focus:border-cp-cyan focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-cp-text-secondary text-sm mb-2">Min Air Ratio</label>
              <input
                type="number"
                step="0.1"
                value={filters.minAirRatio}
                onChange={(e) => updateFilter('minAirRatio', parseFloat(e.target.value))}
                className="w-full bg-cp-bg-secondary border border-cp-border rounded px-3 py-2 text-cp-text-primary focus:border-cp-cyan focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-cp-text-secondary text-sm mb-2">Min Success Chance</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={filters.minSuccessChance}
                onChange={(e) => updateFilter('minSuccessChance', parseFloat(e.target.value))}
                className="w-full bg-cp-bg-secondary border border-cp-border rounded px-3 py-2 text-cp-text-primary focus:border-cp-cyan focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-cp-text-secondary text-sm mb-2">Min Accessible Value</label>
              <input
                type="number"
                value={filters.minAccessibleValue}
                onChange={(e) => updateFilter('minAccessibleValue', parseInt(e.target.value))}
                className="w-full bg-cp-bg-secondary border border-cp-border rounded px-3 py-2 text-cp-text-primary focus:border-cp-cyan focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Targets Display */}
      {targets.length > 0 && (
        <div className="cp-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-cyberpunk text-cp-text-primary flex items-center">
              <Target className="h-6 w-6 mr-2 text-cp-cyan" />
              Raid Targets ({targets.length})
            </h2>
          </div>
          
          <div className="space-y-4">
            {targets.map((target) => (
              <div
                key={target.id}
                className="cp-card p-4 hover:border-cp-cyan transition-all cursor-pointer"
                onClick={() => setSelectedTarget(selectedTarget?.id === target.id ? null : target)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-cp-text-primary">{target.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded border ${getColorClasses(target.color)}`}>
                        {target.color}
                      </span>
                      {target.alliance_name && (
                        <span className="text-xs text-cp-text-secondary">
                          [{target.alliance_name}]
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-sm">
                      <div>
                        <p className="text-cp-text-secondary">Score</p>
                        <p className="text-cp-text-primary font-medium">{formatNumber(target.score)}</p>
                      </div>
                      <div>
                        <p className="text-cp-text-secondary">Cities</p>
                        <p className="text-cp-text-primary font-medium">{target.cities}</p>
                      </div>
                      <div>
                        <p className="text-cp-text-secondary">Target Score</p>
                        <p className="text-cp-cyan font-medium">{target.targetScore.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-cp-text-secondary">Success Chance</p>
                        <p className={`font-medium ${getSuccessColor(target.raidAnalysis.successChance)}`}>
                          {(target.raidAnalysis.successChance * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-cp-text-secondary">Accessible Loot</p>
                        <p className="text-cp-text-primary font-medium">{formatCurrency(target.accessibleValue)}</p>
                      </div>
                      <div>
                        <p className="text-cp-text-secondary">Activity</p>
                        <p className={`font-medium ${getActivityColor(target.activityScore)}`}>
                          {(target.activityScore * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xs text-cp-text-secondary mb-1">Last Active</div>
                    <div className="text-cp-text-primary">{getDaysAgo(target.last_active)}d ago</div>
                  </div>
                </div>
                
                {/* Detailed Analysis (Expandable) */}
                {selectedTarget?.id === target.id && (
                  <div className="mt-4 pt-4 border-t border-cp-border">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Military Analysis */}
                      <div>
                        <h4 className="text-sm font-semibold text-cp-cyan mb-2 flex items-center">
                          <Sword className="h-4 w-4 mr-1" />
                          Military Strength
                        </h4>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-cp-text-secondary">Ground:</span>
                            <span className="text-cp-text-primary">{formatNumber(target.militaryStrength.ground)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-cp-text-secondary">Air:</span>
                            <span className="text-cp-text-primary">{formatNumber(target.militaryStrength.air)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-cp-text-secondary">Naval:</span>
                            <span className="text-cp-text-primary">{formatNumber(target.militaryStrength.naval)}</span>
                          </div>
                          <div className="flex justify-between border-t border-cp-border pt-1">
                            <span className="text-cp-text-secondary">Total:</span>
                            <span className="text-cp-cyan font-medium">{formatNumber(target.militaryStrength.total)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Activity Breakdown */}
                      <div>
                        <h4 className="text-sm font-semibold text-cp-cyan mb-2 flex items-center">
                          <Activity className="h-4 w-4 mr-1" />
                          Activity Analysis
                        </h4>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-cp-text-secondary">Login:</span>
                            <span className="text-cp-text-primary">{(target.activityFactors.loginActivity * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-cp-text-secondary">Economic:</span>
                            <span className="text-cp-text-primary">{(target.activityFactors.economicActivity * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-cp-text-secondary">War:</span>
                            <span className="text-cp-text-primary">{(target.activityFactors.warActivity * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between border-t border-cp-border pt-1">
                            <span className="text-cp-text-secondary">Overall:</span>
                            <span className={`font-medium ${getActivityColor(target.activityScore)}`}>
                              {(target.activityScore * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Loot Analysis */}
                      <div>
                        <h4 className="text-sm font-semibold text-cp-cyan mb-2 flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          Loot Analysis
                        </h4>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-cp-text-secondary">Total Value:</span>
                            <span className="text-cp-text-primary">{formatCurrency(target.totalValue)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-cp-text-secondary">Accessibility:</span>
                            <span className="text-cp-text-primary">{(target.accessibility * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-cp-text-secondary">Defensive Wars:</span>
                            <span className="text-cp-text-primary">{target.defensiveWars}</span>
                          </div>
                          <div className="flex justify-between border-t border-cp-border pt-1">
                            <span className="text-cp-text-secondary">Accessible:</span>
                            <span className="text-cp-cyan font-medium">{formatCurrency(target.accessibleValue)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Raid Recommendation */}
                    <div className="mt-4 p-3 bg-cp-bg-secondary rounded border border-cp-border">
                      <h4 className="text-sm font-semibold text-cp-cyan mb-2 flex items-center">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        Raid Analysis
                      </h4>
                      <p className="text-sm text-cp-text-primary mb-2">{target.raidAnalysis.recommendation}</p>
                      {target.raidAnalysis.risks.length > 0 && (
                        <div>
                          <p className="text-xs text-cp-text-secondary mb-1">Risk Factors:</p>
                          <ul className="space-y-0.5">
                            {target.raidAnalysis.risks.map((risk, index) => (
                              <li key={index} className="text-xs text-orange-400 flex items-start">
                                <AlertTriangle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                                {risk}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="cp-card p-8 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-cp-cyan border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-cp-text-secondary">Analyzing targets with sophisticated military intelligence...</p>
        </div>
      )}

      {/* No Results */}
      {!loading && targets.length === 0 && (
        <div className="cp-card p-8 text-center">
          <Target className="h-12 w-12 text-cp-text-secondary mx-auto mb-4" />
          <p className="text-cp-text-secondary">No targets found matching your criteria.</p>
          <p className="text-cp-text-secondary text-sm mt-2">
            Try adjusting your filters or search parameters.
          </p>
        </div>
      )}
    </div>
  );
}