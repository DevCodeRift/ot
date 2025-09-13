'use client';

import { useState } from 'react';
import { Target, Settings, Bell } from 'lucide-react';
import RaidFinder from './raid-finder';
import ModuleBotConfig from './module-bot-config';

interface WarModuleProps {
  allianceId?: number;
}

export default function WarModule({ allianceId }: WarModuleProps) {
  const [activeTab, setActiveTab] = useState('raid-finder');

  const tabs = [
    {
      id: 'raid-finder',
      name: 'Raid Finder',
      icon: Target,
      description: 'Find optimal raid targets'
    },
    {
      id: 'war-alerts',
      name: 'War Alerts',
      icon: Bell,
      description: 'Configure Discord war notifications'
    }
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'raid-finder':
        return <RaidFinder />;
      case 'war-alerts':
        return allianceId ? (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-cp-text-primary mb-2">War Notifications</h2>
              <p className="text-cp-text-secondary">
                Configure Discord channels to receive real-time war alerts and notifications.
              </p>
            </div>
            
            <ModuleBotConfig
              allianceId={allianceId}
              moduleKey="war"
              moduleName="War"
              moduleIcon="⚔️"
              events={[
                { 
                  key: 'war_alerts', 
                  name: 'War Alerts', 
                  description: 'Notifications when alliance members are attacked or declare war' 
                }
              ]}
            />
          </div>
        ) : (
          <div className="cp-card p-6 text-center">
            <p className="text-cp-text-muted">Alliance ID is required for bot configuration</p>
          </div>
        );
      default:
        return <RaidFinder />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="cp-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-cyberpunk text-cp-cyan mb-2">War Management</h2>
            <p className="text-cp-text-secondary">Manage war operations and Discord notifications</p>
          </div>
        </div>

        <div className="flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-cp-cyan text-cp-bg-primary shadow-cp-glow'
                    : 'bg-cp-bg-secondary text-cp-text-secondary hover:bg-cp-bg-tertiary hover:text-cp-text-primary border border-cp-border hover:border-cp-cyan'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{tab.name}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 text-sm text-cp-text-muted">
          {tabs.find(tab => tab.id === activeTab)?.description}
        </div>
      </div>

      {/* Tab Content */}
      {renderActiveTab()}
    </div>
  );
}