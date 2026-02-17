'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { InventoryItem } from '@/types/database';
import { X, Upload, Loader2, Camera, Trash2 } from 'lucide-react';
import Image from 'next/image';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingItem: InventoryItem | null;
}

export default function InventoryModal({ isOpen, onClose, onSuccess, editingItem }: InventoryModalProps) {
  const [name, setName] = useState('');
  const [origin, setOrigin] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form when opening/editing
  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        setName(editingItem.name);
        setOrigin(editingItem.origin || '');
        setPrice(editingItem.price);
        setQuantity(editingItem.quantity_available);
        setImagePreview(editingItem.image_url);
        setImageFile(null);
      } else {
        // Reset for create
        setName('');
        setOrigin('');
        setPrice('');
        setQuantity('');
        setImageFile(null);
        setImagePreview(null);
      }
      setError(null);
      setUploading(false);
      setSubmitting(false);
    }
  }, [isOpen, editingItem]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    }
  };

  const handleDelete = async () => {
    if (!editingItem) return;

    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
        return;
    }

    try {
        setSubmitting(true);
        setError(null);

        const res = await fetch(`/api/inventory/${editingItem.id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${(await createBrowserClient().auth.getSession()).data.session?.access_token}`
            }
        });

        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'Failed to delete item');
        }

        onSuccess();
        onClose();
    } catch (err: any) {
        console.error(err);
        setError(err.message || 'An error occurred while deleting.');
    } finally {
        setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || price === '' || quantity === '') {
      setError('Please fill in all required fields.');
      return;
    }

    if (!editingItem && !imageFile) {
        setError('Image is required for new items.');
        return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const supabase = createBrowserClient();
      let imageUrl = editingItem?.image_url;

      // 1. Upload Image (if new file selected)
      if (imageFile) {
        setUploading(true); // Specific state for UI feedback if needed
        
        // Explicitly check session to ensure auth headers are present
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            throw new Error("You must be logged in to upload images.");
        }

        const path = `public/${Date.now()}_${imageFile.name.replace(/\s+/g, '_')}`; // Sanitize filename slightly

        
        const { error: uploadError } = await supabase.storage
          .from('furniture-images')
          .upload(path, imageFile);

        if (uploadError) {
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('furniture-images')
          .getPublicUrl(path);

        imageUrl = publicUrl;
        setUploading(false);
      }

      if (!imageUrl) {
        throw new Error("Image URL missing");
      }

      // 2. Call API
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const payload = {
        name,
        origin: origin || null,
        price: Number(price),
        quantity_available: Number(quantity),
        image_url: imageUrl,
      };

      let res;
      if (editingItem) {
        // Edit Mode
        res = await fetch(`/api/inventory/${editingItem.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(payload),
        });
      } else {
        // Create Mode
        res = await fetch('/api/inventory', {
          method: 'POST',
          headers,
          body: JSON.stringify({ ...payload, quantity_sold: 0 }),
        });
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save item');
      }

      // Success
      onSuccess();
      onClose();

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred.');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  const isBusy = submitting || uploading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
        {/* Modal Card */}
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-black/90 shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/5">
          <h2 className="text-lg font-semibold text-white">
            {editingItem ? 'Edit Item' : 'Add New Item'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
            disabled={isBusy}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
            
          {/* Image Picker */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/70">Item Image</label>
            <div 
                onClick={() => !isBusy && fileInputRef.current?.click()}
                className={`group relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-white/10 bg-white/5 transition-colors hover:bg-white/10 ${isBusy ? 'cursor-not-allowed opacity-50' : ''}`}
            >
                {imagePreview ? (
                     <Image 
                        src={imagePreview} 
                        alt="Preview" 
                        fill 
                        className="object-cover" 
                     />
                ) : (
                    <div className="flex flex-col items-center space-y-2 text-white/40">
                        <Camera className="h-8 w-8" />
                        <span className="text-xs font-medium">Click to upload</span>
                    </div>
                )}
                
                {/* Overlay on hover/preview */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <Upload className="h-6 w-6 text-white" />
                </div>
            </div>
            <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageChange}
                disabled={isBusy}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             {/* Name */}
            <div className="col-span-2 space-y-1">
                <label className="text-sm font-medium text-white/70">Name</label>
                <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-white/20"
                    placeholder="e.g. Eames Lounge Chair"
                    disabled={isBusy}
                />
            </div>

            {/* Origin */}
            <div className="space-y-1">
                <label className="text-sm font-medium text-white/70">Origin</label>
                <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-white/20"
                    placeholder="e.g. Denmark"
                    disabled={isBusy}
                />
            </div>

            {/* Price */}
            <div className="space-y-1">
                <label className="text-sm font-medium text-white/70">Price ($)</label>
                <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-white/20"
                    placeholder="0.00"
                    disabled={isBusy}
                />
            </div>

            {/* Quantity */}
            <div className="col-span-2 space-y-1">
                <label className="text-sm font-medium text-white/70">Quantity Available</label>
                <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-white/20"
                    placeholder="0"
                    disabled={isBusy}
                />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-300 border border-red-500/20">
                {error}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            {/* Delete Button (Only active when editing) */}
            <div>
                {editingItem && (
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isBusy}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete
                    </button>
                )}
            </div>

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/10 rounded-lg transition-colors"
                    disabled={isBusy}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isBusy}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20"
                >
                    {isBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isBusy ? 'Saving...' : 'Save Item'}
                </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
