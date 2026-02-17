import React from 'react';
import Image from 'next/image';
import { InventoryItem } from '@/types/database';
import GlassCard from './ui/GlassCard';

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
    <GlassCard onClick={onClick} className="flex flex-col h-full group p-0 overflow-hidden border-white/10 bg-white/5 hover:bg-white/10">
      {/* Image Section */}
      <div className="relative aspect-square w-full overflow-hidden bg-white/5">
        <Image
          src={item.image_url || '/placeholder-furniture.png'} // Fallback if no image
          alt={item.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />
        {/* Gradient Overlay for text readability if needed, though text is below */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col p-4 w-full">
        {/* Header */}
        <div className="mb-2">
          <h3 className="truncate text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
            {item.name}
          </h3>
          <p className="text-xs font-medium text-white/50 uppercase tracking-wide truncate">
            {item.origin || 'Unknown Origin'}
          </p>
        </div>

        {/* Price & Stock */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-white/10">
          <span className="text-lg font-bold text-white/90">
            {formatCurrency(item.price)}
          </span>
          
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
              isOutOfStock
                ? 'bg-red-500/10 text-red-400 ring-red-500/20'
                : 'bg-green-500/10 text-green-400 ring-green-500/20'
            }`}
          >
            {isOutOfStock ? 'Out of Stock' : `In Stock: ${item.quantity_available}`}
          </span>
        </div>
      </div>
    </GlassCard>
  );
}
