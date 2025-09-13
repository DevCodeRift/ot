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

interface ModuleBotConfigProps {
  allianceId: number;
  moduleKey: string;
  moduleName: string;
  moduleIcon: string;
  events: Array<{
    key: string;
    name: string;
    description: string;
  }>;
  className?: string;
}

export default function ModuleBotConfig({ 
  allianceId, 
  moduleKey, 
  moduleName, 
  moduleIcon, 
  events,
  className = ''
}: ModuleBotConfigProps) {
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
      // Filter configs to only show ones for this module
      const moduleConfigs = server.channelConfigs?.filter(c => c.module === moduleKey) || [];
      setConfigs(moduleConfigs);
    } else {
      setConfigs([]);
    }
  };

  const updateConfig = (eventType: string, channelId: string, isActive: boolean) => {
    setConfigs(prev => {
      const existing = prev.find(c => c.eventType === eventType);
      if (existing) {
        return prev.map(c => 
          c.eventType === eventType 
            ? { ...c, channelId, isActive }
            : c
        );
      } else {
        return [...prev, { module: moduleKey, eventType, channelId, isActive }];
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
        setMessage({ type: 'success', text: `${moduleName} notification settings saved successfully!` });
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

  const getConfigForEvent = (eventType: string) => {
    return configs.find(c => c.eventType === eventType);
  };

  const hasActiveConfigs = configs.some(c => c.isActive && c.channelId);

  if (loading) {
    return (
      <div className={`cp-card p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-cp-cyan mr-2" />
          <span className="text-cp-text-secondary">Loading Discord configuration...</span>
        </div>
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div className={`cp-card p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xl">{moduleIcon}</span>
          <h3 className="text-lg font-semibold text-cp-text-primary">Discord Notifications</h3>
        </div>
        <div className="text-center py-6">
          <AlertTriangle className="h-8 w-8 text-cp-yellow mx-auto mb-3" />
          <p className="text-cp-text-secondary mb-2">No Discord servers connected</p>
          <p className="text-cp-text-muted text-sm">
            Connect your Discord server to receive {moduleName.toLowerCase()} notifications.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`cp-card p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xl">{moduleIcon}</span>
        <h3 className="text-lg font-semibold text-cp-text-primary">Discord Notifications</h3>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`mb-4 p-3 rounded border-l-4 ${
          message.type === 'success' 
            ? 'border-cp-green bg-cp-green/10' 
            : 'border-cp-red bg-cp-red/10'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-cp-green" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-cp-red" />
            )}
            <p className={`text-sm font-medium ${
              message.type === 'success' ? 'text-cp-green' : 'text-cp-red'
            }`}>
              {message.text}
            </p>
          </div>
        </div>
      )}

      {/* Server Selection */}
      <div className="mb-4">
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

      {/* Event Configuration */}
      {selectedServer && (
        <div className="space-y-3">
          {events.map(event => {
            const config = getConfigForEvent(event.key);
            
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
                        event.key, 
                        config?.channelId || '', 
                        e.target.checked
                      )}
                      className="sr-only"
                    />
                    <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      config?.isActive ? 'bg-cp-cyan' : 'bg-cp-bg-accent'
                    }`}>
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        config?.isActive ? 'translate-x-5' : 'translate-x-1'
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
                        onChange={(e) => updateConfig(event.key, e.target.value, true)}
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

          {/* Save Button */}
          <button
            onClick={saveConfigs}
            disabled={saving || loadingChannels || !hasActiveConfigs}
            className="w-full bg-cp-cyan hover:bg-cp-cyan/80 disabled:bg-cp-bg-accent disabled:text-cp-text-muted text-cp-bg-primary font-semibold py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2 mt-4"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? 'Saving...' : 'Save Notifications'}
          </button>
        </div>
      )}
    </div>
  );
}