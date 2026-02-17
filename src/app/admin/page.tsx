'use client';

import GlassCard from '@/components/ui/GlassCard';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  return (
    <div className="min-h-screen p-8 pt-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Admin Console</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
            <GlassCard className="p-8">
                <ShieldAlert className="h-10 w-10 text-red-400 mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Audit Logs</h2>
                <p className="text-white/60 mb-6">View system-wide activity and security events.</p>
                <Link 
                    href="/admin/audit"
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium"
                >
                    View Logs
                </Link>
            </GlassCard>

            <GlassCard className="p-8">
                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                    <span className="text-blue-400 font-bold">U</span>
                </div>
                <h2 className="text-2xl font-semibold mb-2">User Management</h2>
                <p className="text-white/60 mb-6">Manage roles and permissions.</p>
                <button className="px-4 py-2 rounded-lg bg-white/5 text-white/40 cursor-not-allowed text-sm font-medium">
                    Coming Soon
                </button>
            </GlassCard>
        </div>
      </div>
    </div>
  );
}
