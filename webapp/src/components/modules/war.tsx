'use client';

import { useState, useEffect } from 'react';
import { Target, Users, Sword, Shield, DollarSign, Activity, Calendar, MapPin, Search, Filter } from 'lucide-react';

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
  totalResourceValue: number;
  dailyProduction: { [resource: string]: number };
  cityBuildings: any[];
  last_active: string;
  beige_turns: number;
  color: string;
  vacation_mode_turns: number;
}

interface RaidFinderFilters {
  minActivity: number;
  excludeAlliances: string[];
  excludeColors: string[];
  excludeVacation: boolean;
  excludeBeige: boolean;
}

interface RaidFinderResponse {
  userNation: {
    id: string;
    name: string;
    score: number;
    scoreRange: { min: number; max: number };
  };
  targets: TargetNation[];
  marketPrices: { [resource: string]: number };
  metadata: {
    totalFound: number;
    searchCriteria: any;
  };
}

export default function WarModule() {
  const [targets, setTargets] = useState<TargetNation[]>([]);
  const [loading, setLoading] = useState(false);
  const [userNation, setUserNation] = useState<any>(null);
  const [marketPrices, setMarketPrices] = useState<{ [resource: string]: number }>({});
  const [filters, setFilters] = useState<RaidFinderFilters>({
    minActivity: 7,
    excludeAlliances: [],
    excludeColors: [],
    excludeVacation: true,
    excludeBeige: false,
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
      setUserNation(data.userNation);
      setMarketPrices(data.marketPrices);
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
      <div className="flex items-center space-x-3">
        <Target className="h-8 w-8 text-cp-cyan" />
        <div>
          <h1 className="text-3xl font-bold text-cp-text-primary font-cyberpunk">Raid Finder</h1>
          <p className="text-cp-text-secondary">Find the most valuable targets within your war range</p>
        </div>
      </div>

      {/* User Nation Info */}
      {userNation && (
        <div className="bg-cp-bg-secondary border border-cp-border rounded-lg p-6">
          <h2 className="text-xl font-bold text-cp-text-primary font-cyberpunk mb-4">Your Nation</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-cp-text-secondary text-sm">Nation</p>
              <p className="text-cp-text-primary font-medium">{userNation.name}</p>
            </div>
            <div>
              <p className="text-cp-text-secondary text-sm">Score</p>
              <p className="text-cp-text-primary font-medium">{formatNumber(userNation.score)}</p>
            </div>
            <div>
              <p className="text-cp-text-secondary text-sm">War Range</p>
              <p className="text-cp-text-primary font-medium">
                {formatNumber(userNation.scoreRange.min)} - {formatNumber(userNation.scoreRange.max)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-cp-bg-secondary border border-cp-border rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-cp-cyan" />
          <h2 className="text-xl font-bold text-cp-text-primary font-cyberpunk">Search Filters</h2>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-cp-text-primary text-sm font-medium mb-1">Max Days Inactive</label>
              <input
                type="number"
                value={filters.minActivity}
                onChange={(e) => updateFilter('minActivity', parseInt(e.target.value))}
                className="w-full bg-cp-bg-tertiary border border-cp-border rounded px-3 py-2 text-cp-text-primary focus:border-cp-cyan focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-cp-text-primary text-sm font-medium mb-1">Exclude Alliance IDs (comma-separated)</label>
              <input
                value={filterInputs.excludeAlliancesText}
                onChange={(e) => {
                  setFilterInputs(prev => ({ ...prev, excludeAlliancesText: e.target.value }));
                  updateFilter('excludeAlliances', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean));
                }}
                placeholder="123,456,789"
                className="w-full bg-cp-bg-tertiary border border-cp-border rounded px-3 py-2 text-cp-text-primary focus:border-cp-cyan focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-cp-text-primary text-sm font-medium mb-1">Exclude Colors (comma-separated)</label>
              <input
                value={filterInputs.excludeColorsText}
                onChange={(e) => {
                  setFilterInputs(prev => ({ ...prev, excludeColorsText: e.target.value }));
                  updateFilter('excludeColors', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean));
                }}
                placeholder="gray,beige,white"
                className="w-full bg-cp-bg-tertiary border border-cp-border rounded px-3 py-2 text-cp-text-primary focus:border-cp-cyan focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="excludeVacation"
                checked={filters.excludeVacation}
                onChange={(e) => updateFilter('excludeVacation', e.target.checked)}
                className="w-4 h-4 text-cp-cyan bg-cp-bg-tertiary border-cp-border rounded focus:ring-cp-cyan"
              />
              <label htmlFor="excludeVacation" className="text-cp-text-primary text-sm">Exclude Vacation Mode</label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="excludeBeige"
                checked={filters.excludeBeige}
                onChange={(e) => updateFilter('excludeBeige', e.target.checked)}
                className="w-4 h-4 text-cp-cyan bg-cp-bg-tertiary border-cp-border rounded focus:ring-cp-cyan"
              />
              <label htmlFor="excludeBeige" className="text-cp-text-primary text-sm">Exclude Beige Nations</label>
            </div>
          </div>

          <button
            onClick={searchTargets}
            disabled={loading}
            className="bg-cp-cyan text-cp-bg-primary hover:bg-cp-cyan/90 disabled:opacity-50 px-6 py-2 rounded font-cyberpunk font-medium flex items-center space-x-2"
          >
            <Search className="h-4 w-4" />
            <span>{loading ? 'Searching...' : 'Find Targets'}</span>
          </button>
        </div>
      </div>

      {/* Targets List */}
      {targets.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-cp-text-primary font-cyberpunk">
            Potential Targets ({targets.length})
          </h2>
          
          {targets.map((target, index) => (
            <div key={target.id} className="bg-cp-bg-secondary border border-cp-border hover:border-cp-cyan transition-colors rounded-lg p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Basic Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-cp-text-primary">{target.name}</h3>
                    <span className={`px-2 py-1 rounded border text-xs font-medium ${getColorClasses(target.color)}`}>
                      {target.color}
                    </span>
                  </div>
                  <p className="text-cp-text-secondary">Leader: {target.leader}</p>
                  {target.alliance_name && (
                    <p className="text-cp-text-secondary">Alliance: {target.alliance_name}</p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-sm text-cp-text-secondary">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{target.cities} cities</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Activity className="h-4 w-4" />
                      <span>{getDaysAgo(target.last_active)}d ago</span>
                    </div>
                  </div>

                  {target.beige_turns > 0 && (
                    <span className="inline-block px-2 py-1 bg-amber-500/20 text-amber-400 border border-amber-600 rounded text-xs">
                      Beige: {target.beige_turns} turns
                    </span>
                  )}

                  {target.vacation_mode_turns > 0 && (
                    <span className="inline-block px-2 py-1 bg-red-500/20 text-red-400 border border-red-600 rounded text-xs">
                      VM: {target.vacation_mode_turns} turns
                    </span>
                  )}
                </div>

                {/* Military Stats */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-cp-text-primary">Military</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-cp-text-secondary">Soldiers:</span>
                      <span className="text-cp-text-primary font-medium">{formatNumber(target.soldiers)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cp-text-secondary">Tanks:</span>
                      <span className="text-cp-text-primary font-medium">{formatNumber(target.tanks)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cp-text-secondary">Aircraft:</span>
                      <span className="text-cp-text-primary font-medium">{formatNumber(target.aircraft)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cp-text-secondary">Ships:</span>
                      <span className="text-cp-text-primary font-medium">{formatNumber(target.ships)}</span>
                    </div>
                    <hr className="border-cp-border" />
                    <div className="flex justify-between">
                      <span className="text-cp-text-secondary">Score:</span>
                      <span className="text-cp-text-primary font-medium">{formatNumber(target.score)}</span>
                    </div>
                  </div>
                </div>

                {/* Value Analysis */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-cp-cyan" />
                    <h4 className="font-semibold text-cp-text-primary">Target Value</h4>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-cp-cyan">
                      {formatCurrency(target.totalResourceValue)}
                    </div>
                    <p className="text-cp-text-secondary text-sm">Total Estimated Value</p>
                  </div>

                  {Object.keys(target.dailyProduction).length > 0 && (
                    <div className="space-y-2">
                      <p className="text-cp-text-secondary text-sm font-medium">Daily Production:</p>
                      {Object.entries(target.dailyProduction)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 4)
                        .map(([resource, amount]) => (
                          <div key={resource} className="flex justify-between text-sm">
                            <span className="text-cp-text-secondary capitalize">{resource.toLowerCase()}:</span>
                            <span className="text-cp-text-primary">
                              {amount.toFixed(1)} ({formatCurrency(amount * (marketPrices[resource] || 0))})
                            </span>
                          </div>
                        ))
                      }
                    </div>
                  )}

                  <div className="pt-2">
                    <span className="block w-full text-center px-2 py-1 bg-cp-bg-tertiary text-cp-text-primary border border-cp-border rounded text-sm">
                      Rank #{index + 1}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {targets.length === 0 && !loading && (
        <div className="bg-cp-bg-secondary border border-cp-border rounded-lg p-12 text-center">
          <Target className="h-16 w-16 text-cp-text-muted mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-cp-text-primary mb-2">No Targets Found</h3>
          <p className="text-cp-text-secondary">
            Click "Find Targets" to search for potential raid targets within your war range.
          </p>
        </div>
      )}
    </div>
  );
}