'use client';

import React, { useState, useEffect } from 'react';
import { AuditLog } from '@/types/database';
import { X, Shield, AlertTriangle, Settings, Loader2 } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

interface AdminToolsProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdminTools({ isOpen, onClose, onSuccess }: AdminToolsProps) {
  const [activeTab, setActiveTab] = useState<'audit' | 'danger'>('audit');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Kill Switch State
  const [killSwitchInput, setKillSwitchInput] = useState('');
  const [killSwitchLoading, setKillSwitchLoading] = useState(false);

  // Fetch logs when tab changes to audit
  useEffect(() => {
    if (isOpen && activeTab === 'audit') {
      fetchLogs();
    }
  }, [isOpen, activeTab]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get session for Auth header
      const { data: { session } } = await import('@/lib/supabase-browser').then(m => m.createBrowserClient().auth.getSession());
      
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/admin/audit-logs', { headers });
      if (!res.ok) {
         if (res.status === 403 || res.status === 401) {
             throw new Error("Unauthorized Access");
         }
         throw new Error('Failed to fetch logs');
      }
      const data = await res.json();
      setLogs(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKillSwitch = async () => {
    if (killSwitchInput !== 'DELETE-ALL-INVENTORY-PERMANENTLY') {
        alert('Confirmation code mismatch.');
        return;
    }

    if (!confirm('FINAL WARNING: This will wipe the entire inventory database. Are you absolutely sure?')) {
        return;
    }

    setKillSwitchLoading(true);
    try {
        // Get current session to ensure we send the token
        const { data: { session } } = await import('@/lib/supabase-browser').then(m => m.createBrowserClient().auth.getSession());
        
        if (!session) throw new Error("Unauthorized: No active session");

        const res = await fetch('/api/admin/kill-switch', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ confirmation_code: killSwitchInput })
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'Kill switch failed');
        }

        // Success
        alert('System Reset Successful.');
        setKillSwitchInput('');
        onSuccess(); // Refresh inventory
        onClose(); // Close modal

    } catch (err: any) {
        alert(`Error: ${err.message}`);
    } finally {
        setKillSwitchLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-black/90 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/5">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-white/70" />
            <h2 className="text-lg font-semibold text-white">Admin Console</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
            <button
                onClick={() => setActiveTab('audit')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === 'audit' ? 'border-b-2 border-blue-500 text-blue-400 bg-blue-500/10' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            >
                <Shield className="h-4 w-4" />
                Audit Logs
            </button>
            <button
                onClick={() => setActiveTab('danger')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === 'danger' ? 'border-b-2 border-red-500 text-red-500 bg-red-500/10' : 'text-white/40 hover:text-red-400 hover:bg-white/5'}`}
            >
                <AlertTriangle className="h-4 w-4" />
                Danger Zone
            </button>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
            
            {/* AUDIT LOGS TAB */}
            {activeTab === 'audit' && (
                <div className="space-y-4">
                    {loading && (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-white/40" />
                        </div>
                    )}

                    {error && (
                        <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
                            {error}
                        </div>
                    )}

                    {!loading && !error && logs.length === 0 && (
                        <p className="text-center text-white/40 py-8">No audit logs found.</p>
                    )}

                    {!loading && !error && logs.length > 0 && (
                        <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5">
                            <table className="min-w-full divide-y divide-white/10">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Time</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Action</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">Actor ID</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-2 text-xs text-white/60 whitespace-nowrap">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-2 text-sm font-medium text-white">
                                                {log.action}
                                            </td>
                                            <td className="px-4 py-2 text-xs text-white/40 font-mono truncate max-w-[100px]">
                                                {log.actor_id}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* DANGER ZONE TAB */}
            {activeTab === 'danger' && (
                <div className="max-w-md mx-auto space-y-6 text-center pt-4">
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl space-y-4">
                        <div className="flex justify-center">
                            <div className="p-3 bg-red-500/20 rounded-full">
                                <AlertTriangle className="h-8 w-8 text-red-500" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-red-400">System Kill Switch</h3>
                            <p className="text-sm text-red-200/60 mt-1">
                                This action will <strong>permanently delete all inventory items</strong>. 
                                Audit logs will be preserved. This cannot be undone.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-white/60">
                            Type <code>DELETE-ALL-INVENTORY-PERMANENTLY</code> to confirm:
                        </label>
                        <input 
                            type="text" 
                            className="w-full text-center font-mono text-sm p-2 bg-black/50 border border-red-900/50 rounded-lg text-red-400 focus:ring-2 focus:ring-red-500/50 outline-none"
                            placeholder="Type confirmation code"
                            value={killSwitchInput}
                            onChange={(e) => setKillSwitchInput(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={handleKillSwitch}
                        disabled={killSwitchInput !== 'DELETE-ALL-INVENTORY-PERMANENTLY' || killSwitchLoading}
                        className="w-full py-3 bg-red-600 text-white font-bold rounded-lg shadow-lg shadow-red-600/20 hover:bg-red-700 focus:ring-4 focus:ring-red-900/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {killSwitchLoading && <Loader2 className="h-5 w-5 animate-spin" />}
                        RESET SYSTEM
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
