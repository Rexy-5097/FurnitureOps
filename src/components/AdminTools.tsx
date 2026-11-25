'use client';

import React, { useState, useEffect } from 'react';
import { AuditLog } from '@/types/database';
import { X, Shield, AlertTriangle, Settings, Loader2 } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl overflow-hidden rounded-[24px] border border-lab-line bg-lab-paper shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-lab-line px-6 py-4 bg-lab-surface">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-lab-muted" />
            <h2 className="font-display text-[1.9rem] leading-none text-lab-ink">Admin console</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-lab-muted hover:bg-lab-ink/[0.06] hover:text-lab-ink transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-lab-line">
            <button
                onClick={() => setActiveTab('audit')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === 'audit' ? 'border-b-2 border-lab-accent text-lab-accent bg-lab-accent/10' : 'text-lab-muted hover:text-lab-ink hover:bg-lab-surface'}`}
            >
                <Shield className="h-4 w-4" />
                Audit Logs
            </button>
            <button
                onClick={() => setActiveTab('danger')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === 'danger' ? 'border-b-2 border-lab-danger text-lab-danger bg-lab-danger/10' : 'text-lab-muted hover:text-lab-danger hover:bg-lab-surface'}`}
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
                            <Loader2 className="h-8 w-8 animate-spin text-lab-muted" />
                        </div>
                    )}

                    {error && (
                        <div className="p-3 text-sm text-lab-danger bg-lab-danger/10 border border-lab-danger/30 rounded-lg">
                            {error}
                        </div>
                    )}

                    {!loading && !error && logs.length === 0 && (
                        <p className="text-center text-lab-muted py-8">No audit logs found.</p>
                    )}

                    {!loading && !error && logs.length > 0 && (
                        <div className="overflow-hidden rounded-lg border border-lab-line bg-lab-surface">
                            <table className="min-w-full divide-y divide-lab-line">
                                <thead className="bg-lab-surface">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-lab-muted uppercase tracking-wider">Time</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-lab-muted uppercase tracking-wider">Action</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-lab-muted uppercase tracking-wider">Actor ID</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-lab-line">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-lab-ink/[0.03] transition-colors">
                                            <td className="px-4 py-2 text-xs text-lab-muted whitespace-nowrap">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-2 text-sm font-medium text-lab-ink">
                                                {log.action}
                                            </td>
                                            <td className="px-4 py-2 text-xs text-lab-muted font-mono truncate max-w-[100px]">
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
                    <div className="p-4 bg-lab-danger/10 border border-lab-danger/30 rounded-xl space-y-4">
                        <div className="flex justify-center">
                            <div className="p-3 bg-lab-danger/15 rounded-full">
                                <AlertTriangle className="h-8 w-8 text-lab-danger" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-lab-danger">System Kill Switch</h3>
                            <p className="text-sm text-lab-danger/80 mt-1">
                                This action will <strong>permanently delete all inventory items</strong>. 
                                Audit logs will be preserved. This cannot be undone.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-lab-muted">
                            Type <code>DELETE-ALL-INVENTORY-PERMANENTLY</code> to confirm:
                        </label>
                        <input 
                            type="text" 
                            className="w-full text-center font-mono text-sm p-3 bg-lab-surface border border-lab-danger/40 rounded-xl text-lab-danger focus:border-lab-danger outline-none"
                            placeholder="Type confirmation code"
                            value={killSwitchInput}
                            onChange={(e) => setKillSwitchInput(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={handleKillSwitch}
                        disabled={killSwitchInput !== 'DELETE-ALL-INVENTORY-PERMANENTLY' || killSwitchLoading}
                        className="w-full py-3 bg-lab-danger text-white font-bold rounded-full hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
