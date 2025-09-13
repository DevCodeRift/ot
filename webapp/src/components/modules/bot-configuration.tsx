'use client';

import { useState, useEffect } from 'react';
import { Settings, Hash, Save, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

interface ChannelConfig {
  id?: string;
  module: string;
  eventType: string;
  channelId: string;
  isActive: boolean;
  settings?: Record<string, any>;
}

interface DiscordChannel {
  id: string;
  name: string;
  parent: string | null;
  position: number;
}

interface DiscordServer {
  id: string;
  name: string | null;
  channelConfigs: ChannelConfig[];
}

interface BotConfigProps {
  allianceId: number;
}

const MODULE_CONFIGS = {
  war: {
    name: 'War Module',
    icon: '⚔️',
    events: [
      { key: 'war_alerts', name: 'War Alerts', description: 'Notifications when alliance members are attacked or declare war' }
    ]
  },
  economics: {
    name: 'Economics Module', 
    icon: '💰',
    events: [
      { key: 'tax_reminders', name: 'Tax Reminders', description: 'Automated tax collection reminders' },
      { key: 'bank_alerts', name: 'Bank Alerts', description: 'Alliance bank transaction notifications' }
    ]
  },
  recruitment: {
    name: 'Recruitment Module',
    icon: '📋', 
    events: [
      { key: 'application_alerts', name: 'Application Alerts', description: 'New alliance application notifications' },
      { key: 'member_updates', name: 'Member Updates', description: 'Member join/leave notifications' }
    ]
  },
  gamification: {
    name: 'Gamification Module',
    icon: '🏆',
    events: [
      { key: 'quest_updates', name: 'Quest Updates', description: 'Quest assignment and completion notifications' },
      { key: 'achievement_alerts', name: 'Achievement Alerts', description: 'Member achievement notifications' }
    ]
  }
};

export default function BotConfiguration({ allianceId }: BotConfigProps) {
  const [servers, setServers] = useState<DiscordServer[]>([]);
  const [selectedServer, setSelectedServer] = useState<string>('');
  const [availableChannels, setAvailableChannels] = useState<DiscordChannel[]>([]);
  const [configs, setConfigs] = useState<ChannelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchServers();
  }, [allianceId]);

  useEffect(() => {
    if (selectedServer) {
      fetchChannels(selectedServer);
      loadServerConfigs(selectedServer);
    }
  }, [selectedServer]);

  const fetchServers = async () => {
    try {
      const response = await fetch(`/api/alliance/${allianceId}/bot/channels`);
      if (response.ok) {
        const data = await response.json();
        setServers(data.servers || []);
        if (data.servers?.length > 0) {
          setSelectedServer(data.servers[0].id);
        }
      } else {
        setMessage({ type: 'error', text: 'Failed to load Discord servers' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error loading Discord servers' });
    } finally {
      setLoading(false);
    }
  };

  const fetchChannels = async (serverId: string) => {
    setLoadingChannels(true);
    try {
      const response = await fetch(`/api/alliance/${allianceId}/bot/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableChannels(data.channels || []);
      } else {
        setMessage({ type: 'error', text: 'Failed to load Discord channels' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error loading Discord channels' });
    } finally {
      setLoadingChannels(false);
    }
  };

  const loadServerConfigs = (serverId: string) => {
    const server = servers.find(s => s.id === serverId);
    if (server) {
      setConfigs(server.channelConfigs || []);
    } else {
      setConfigs([]);
    }
  };

  const updateConfig = (module: string, eventType: string, channelId: string, isActive: boolean) => {
    setConfigs(prev => {
      const existing = prev.find(c => c.module === module && c.eventType === eventType);
      if (existing) {
        return prev.map(c => 
          c.module === module && c.eventType === eventType 
            ? { ...c, channelId, isActive }
            : c
        );
      } else {
        return [...prev, { module, eventType, channelId, isActive }];
      }
    });
  };

  const saveConfigs = async () => {
    if (!selectedServer) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/alliance/${allianceId}/bot/channels`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverId: selectedServer,
          configs: configs.filter(c => c.isActive && c.channelId)
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Bot configuration saved successfully!' });
        setTimeout(() => setMessage(null), 5000);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to save configuration' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving configuration' });
    } finally {
      setSaving(false);
    }
  };

  const getConfigForEvent = (module: string, eventType: string) => {
    return configs.find(c => c.module === module && c.eventType === eventType);
  };

  if (loading) {
    return (
      <div className="cp-card p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-cp-cyan mx-auto mb-4" />
        <p className="text-cp-text-secondary">Loading Discord servers...</p>
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div className="cp-card p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-cp-yellow mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-cp-text-primary mb-2">No Discord Servers Found</h3>
        <p className="text-cp-text-secondary mb-4">
          Your alliance doesn't have any Discord servers connected to the bot.
        </p>
        <p className="text-cp-text-muted text-sm">
          Invite the bot to your Discord server and link it to your alliance to configure notifications.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="cp-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="h-6 w-6 text-cp-cyan" />
          <h2 className="text-2xl font-bold font-cyberpunk text-cp-text-primary">
            Discord Bot Configuration
          </h2>
        </div>
        <p className="text-cp-text-secondary">
          Configure which Discord channels receive notifications for different alliance activities.
        </p>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`cp-card p-4 border-l-4 ${
          message.type === 'success' 
            ? 'border-cp-green bg-cp-green/10' 
            : 'border-cp-red bg-cp-red/10'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-cp-green" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-cp-red" />
            )}
            <p className={`font-medium ${
              message.type === 'success' ? 'text-cp-green' : 'text-cp-red'
            }`}>
              {message.text}
            </p>
          </div>
        </div>
      )}

      {/* Server Selection */}
      <div className="cp-card p-6">
        <label className="block text-sm font-medium text-cp-text-primary mb-2">
          Discord Server
        </label>
        <select
          value={selectedServer}
          onChange={(e) => setSelectedServer(e.target.value)}
          className="w-full bg-cp-bg-secondary border border-cp-border rounded px-3 py-2 text-cp-text-primary focus:border-cp-cyan focus:ring-1 focus:ring-cp-cyan"
        >
          {servers.map(server => (
            <option key={server.id} value={server.id}>
              {server.name || `Server ${server.id}`}
            </option>
          ))}
        </select>
      </div>

      {/* Module Configuration */}
      {selectedServer && (
        <div className="space-y-4">
          {Object.entries(MODULE_CONFIGS).map(([moduleKey, moduleInfo]) => (
            <div key={moduleKey} className="cp-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{moduleInfo.icon}</span>
                <h3 className="text-xl font-semibold text-cp-text-primary">
                  {moduleInfo.name}
                </h3>
              </div>

              <div className="space-y-3">
                {moduleInfo.events.map(event => {
                  const config = getConfigForEvent(moduleKey, event.key);
                  
                  return (
                    <div key={event.key} className="border border-cp-border rounded p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-cp-text-primary">{event.name}</h4>
                          <p className="text-sm text-cp-text-secondary">{event.description}</p>
                        </div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={config?.isActive || false}
                            onChange={(e) => updateConfig(
                              moduleKey, 
                              event.key, 
                              config?.channelId || '', 
                              e.target.checked
                            )}
                            className="sr-only"
                          />
                          <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            config?.isActive ? 'bg-cp-cyan' : 'bg-cp-bg-accent'
                          }`}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              config?.isActive ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </div>
                        </label>
                      </div>

                      {config?.isActive && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-cp-text-primary mb-1">
                            Discord Channel
                          </label>
                          {loadingChannels ? (
                            <div className="flex items-center gap-2 py-2">
                              <Loader2 className="h-4 w-4 animate-spin text-cp-cyan" />
                              <span className="text-sm text-cp-text-secondary">Loading channels...</span>
                            </div>
                          ) : (
                            <select
                              value={config.channelId || ''}
                              onChange={(e) => updateConfig(moduleKey, event.key, e.target.value, true)}
                              className="w-full bg-cp-bg-secondary border border-cp-border rounded px-3 py-2 text-cp-text-primary focus:border-cp-cyan focus:ring-1 focus:ring-cp-cyan"
                            >
                              <option value="">Select a channel...</option>
                              {availableChannels.map(channel => (
                                <option key={channel.id} value={channel.id}>
                                  #{channel.name} {channel.parent && `(${channel.parent})`}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Save Button */}
          <div className="cp-card p-6">
            <button
              onClick={saveConfigs}
              disabled={saving || loadingChannels}
              className="w-full bg-cp-cyan hover:bg-cp-cyan/80 disabled:bg-cp-bg-accent disabled:text-cp-text-muted text-cp-bg-primary font-semibold py-3 px-6 rounded-md transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}