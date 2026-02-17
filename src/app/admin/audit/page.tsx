'use client';

import GlassCard from '@/components/ui/GlassCard';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

export default function AuditPage() {
  return (
    <div className="min-h-screen p-8 pt-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
            <Link href="/admin" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <ArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-4xl font-bold">Audit Logs</h1>
        </div>
        
        <GlassCard className="p-0">
            <div className="border-b border-white/10 p-4 flex items-center gap-4 bg-white/5">
                <span className="text-sm font-medium text-white/60">Recent Activity</span>
            </div>
            <div className="divide-y divide-white/10">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-4">
                            <FileText className="h-5 w-5 text-white/40" />
                            <div>
                                <div className="font-medium">System Update v2.0.{i}</div>
                                <div className="text-xs text-white/40">Automated deployment</div>
                            </div>
                        </div>
                        <div className="text-xs text-white/40 font-mono">
                            2026-02-17 10:0{i}:00
                        </div>
                    </div>
                ))}
            </div>
        </GlassCard>
      </div>
    </div>
  );
}
