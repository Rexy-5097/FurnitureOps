'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createBrowserClient } from '@/lib/supabase-browser';
import { InventoryItem } from '@/types/database';
import { X, Upload, Loader2, Camera, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useInventory } from '@/hooks/useInventory';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { createItem, updateItem, deleteItem } = useInventory();
  const isBusy = uploading || createItem.isPending || updateItem.isPending || deleteItem.isPending;

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

  const safeUpload = async (file: File) => {
      const supabase = createBrowserClient();
      
      // Force User Fetch to internally refresh token if needed
      await supabase.auth.getUser();

      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (!session || !session.access_token) {
        throw new Error("Session expired. Please login again.");
      }

      // Front-end File Size Validation (5MB Max)
      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        throw new Error("File exceeds the maximum limit of 5MB.");
      }

      // Restrict file types
      const allowedExtensions = ['png', 'jpg', 'jpeg'];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !allowedExtensions.includes(ext)) {
        throw new Error("Only PNG, JPG, and JPEG images are allowed.");
      }

      const path = `public/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      
      // Debug Logging before upload
      console.log('=== UPLOAD DEBUG CHECKLIST ===');
      console.log({
        user: session?.user?.id,
        token: session?.access_token?.slice(0, 20)
      });
      console.log('Session exists:', !!session);
      console.log('File path:', path);
      console.log('File size (bytes):', file.size);
      console.log('==============================');

      const executeUpload = async () => {
        return await supabase.storage
          .from('furniture-images')
          .upload(path, file, {
            cacheControl: '3600',
            upsert: false
          });
      };

      let uploadResult = await executeUpload();

      // Retry once after refresh
      if (uploadResult.error) {
        console.warn('Upload failed, refreshing session and retrying...', uploadResult.error.message);
        await supabase.auth.refreshSession();
        uploadResult = await executeUpload();
      }

      if (uploadResult.error) {
        throw new Error(`Image upload failed: ${uploadResult.error.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('furniture-images')
        .getPublicUrl(path);
      
      return publicUrl;
  };

  const handleDelete = async () => {
    if (!editingItem) return;
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) return;

    try {
        await deleteItem.mutateAsync(editingItem.id);
        onSuccess();
        onClose();
    } catch (err: any) {
        console.error(err);
        setError(err.message || 'An error occurred while deleting.');
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
      setError(null);
      let imageUrl = editingItem?.image_url;

      if (imageFile) {
        setUploading(true);
        try {
            imageUrl = await safeUpload(imageFile);
        } finally {
            setUploading(false);
        }
      }

      if (!imageUrl) throw new Error("Image URL missing");

      const payload = {
        name,
        origin: origin || null,
        price: Number(price),
        quantity_available: Number(quantity),
        image_url: imageUrl,
      };

      if (editingItem) {
        await updateItem.mutateAsync({ id: editingItem.id, updates: payload });
      } else {
        await createItem.mutateAsync(payload);
      }

      onSuccess();
      onClose();

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-lab-ink/40 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.95, y: 20, filter: 'blur(4px)' }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="relative w-full max-w-lg overflow-hidden rounded-[24px] border border-lab-line bg-lab-paper shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-lab-line px-6 py-4 bg-lab-surface">
              <h2 className="font-display text-[1.9rem] leading-none text-lab-ink">
                {editingItem ? 'Edit piece' : 'Add a piece'}
              </h2>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-lab-muted hover:bg-lab-ink/[0.06] hover:text-lab-ink transition-colors"
                disabled={isBusy}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                
              {/* Image Picker */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-lab-ink">Photo</label>
                <div 
                    onClick={() => !isBusy && fileInputRef.current?.click()}
                    className={`group relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-lab-line bg-lab-surface transition-colors hover:bg-lab-ink/[0.06] ${isBusy ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                    {imagePreview ? (
                        <Image 
                            src={imagePreview} 
                            alt="Preview" 
                            fill 
                            className="object-cover" 
                        />
                    ) : (
                        <div className="flex flex-col items-center space-y-2 text-lab-muted">
                            <Camera className="h-8 w-8" />
                            <span className="text-xs font-medium">Click to upload</span>
                        </div>
                    )}
                    
                    {/* Overlay on hover/preview */}
                    <div className="absolute inset-0 flex items-center justify-center bg-lab-ink/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <Upload className="h-6 w-6 text-lab-ink" />
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
                    <label className="text-sm font-semibold text-lab-ink">Name</label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full h-11 rounded-xl border border-lab-line bg-lab-surface px-4 text-sm text-lab-ink focus:border-lab-ink focus:outline-none placeholder:text-lab-muted/60 transition-all"
                        placeholder="e.g. Eames Lounge Chair"
                        disabled={isBusy}
                    />
                </div>

                {/* Origin */}
                <div className="space-y-1">
                    <label className="text-sm font-semibold text-lab-ink">Origin</label>
                    <input
                        type="text"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        className="w-full h-11 rounded-xl border border-lab-line bg-lab-surface px-4 text-sm text-lab-ink focus:border-lab-ink focus:outline-none placeholder:text-lab-muted/60 transition-all"
                        placeholder="e.g. Denmark"
                        disabled={isBusy}
                    />
                </div>

                {/* Price */}
                <div className="space-y-1">
                    <label className="text-sm font-semibold text-lab-ink">Price (USD)</label>
                    <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full h-11 rounded-xl border border-lab-line bg-lab-surface px-4 text-sm text-lab-ink focus:border-lab-ink focus:outline-none placeholder:text-lab-muted/60 transition-all"
                        placeholder="0.00"
                        disabled={isBusy}
                    />
                </div>

                {/* Quantity */}
                <div className="col-span-2 space-y-1">
                    <label className="text-sm font-semibold text-lab-ink">Quantity Available</label>
                    <input
                        type="number"
                        required
                        min="0"
                        step="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full h-11 rounded-xl border border-lab-line bg-lab-surface px-4 text-sm text-lab-ink focus:border-lab-ink focus:outline-none placeholder:text-lab-muted/60 transition-all"
                        placeholder="0"
                        disabled={isBusy}
                    />
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="rounded-md bg-lab-danger/10 p-3 text-sm text-lab-danger border border-lab-danger/30"
                >
                    {error}
                </motion.div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-lab-line">
                <div>
                    {editingItem && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={isBusy}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-lab-danger hover:text-lab-danger hover:bg-lab-danger/10 rounded-full transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
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
                        className="px-4 py-2 text-sm font-medium text-lab-muted hover:bg-lab-ink/[0.06] rounded-full transition-colors"
                        disabled={isBusy}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isBusy}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-lab-on-dark bg-lab-forest hover:opacity-90 rounded-full transition-colors disabled:opacity-70 disabled:cursor-not-allowed "
                    >
                        {isBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isBusy ? 'Saving...' : 'Save Item'}
                    </button>
                </div>
              </div>

            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

