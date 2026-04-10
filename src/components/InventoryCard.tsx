import React from 'react';
import Image from 'next/image';
import { InventoryItem } from '@/types/database';
import GlassCard from './ui/GlassCard';
import { motion } from 'framer-motion';

interface InventoryCardProps {
  item: InventoryItem;
  onClick?: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export default function InventoryCard({ item, onClick }: InventoryCardProps) {
  const isOutOfStock = item.quantity_available === 0;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="h-full"
    >
        <GlassCard 
            onClick={onClick} 
            className="flex flex-col h-full group p-0 overflow-hidden border-white/10 bg-white/5 hover:bg-white/10 hover:shadow-2xl hover:shadow-amber-900/10 hover:border-white/20 transition-all duration-300 cursor-pointer"
        >
        {/* Image Section */}
        <div className="relative aspect-square w-full overflow-hidden bg-white/5">
            <Image
            src={item.image_url || '/placeholder-furniture.png'} // Fallback if no image
            alt={item.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300" />
            
            {/* Badge */}
             <div className="absolute top-3 right-3">
                 <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full backdrop-blur-md ${isOutOfStock ? 'bg-red-500/80 text-white' : 'bg-black/50 text-white/90 border border-white/20'}`}>
                     {isOutOfStock ? 'Sold Out' : `${item.quantity_available} left`}
                 </span>
             </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-1 flex-col p-5 w-full">
            {/* Header */}
            <div className="mb-3">
            <h3 className="truncate text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                {item.name}
            </h3>
            <p className="text-xs font-semibold text-white/40 uppercase tracking-widest truncate mt-1">
                {item.origin || 'Unknown Origin'}
            </p>
            </div>

            {/* Price & Action */}
            <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/10 group-hover:border-white/20 transition-colors">
                <span className="text-xl font-bold text-white tracking-tight">
                    {formatCurrency(item.price)}
                </span>
                
                <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                    </svg>
                </div>
            </div>
        </div>
        </GlassCard>
    </motion.div>
  );
}
