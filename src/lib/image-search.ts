/**
 * Client-side visual image search using perceptual hashing.
 *
 * Algorithm (Average Hash / aHash):
 * 1. Load image onto a hidden 8×8 canvas
 * 2. Convert to grayscale
 * 3. Calculate mean brightness
 * 4. Generate 64-bit binary hash: pixel > mean → 1, else → 0
 * 5. Compare hashes via Hamming distance (lower = more similar)
 *
 * Zero external API calls — works fully offline.
 */

const HASH_SIZE = 8; // 8×8 = 64-bit hash

/**
 * Load an image from a URL or File into an HTMLImageElement.
 */
function loadImage(src: string | File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Needed for Supabase storage URLs

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${typeof src === 'string' ? src : src.name}`));

    if (src instanceof File) {
      img.src = URL.createObjectURL(src);
    } else {
      img.src = src;
    }
  });
}

/**
 * Generate a perceptual hash (average hash) for an image.
 * Returns a 64-character binary string (e.g. "10110010...").
 */
export async function getImageHash(src: string | File): Promise<string> {
  const img = await loadImage(src);

  const canvas = document.createElement('canvas');
  canvas.width = HASH_SIZE;
  canvas.height = HASH_SIZE;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  // Draw the image scaled down to 8×8
  ctx.drawImage(img, 0, 0, HASH_SIZE, HASH_SIZE);

  const imageData = ctx.getImageData(0, 0, HASH_SIZE, HASH_SIZE);
  const pixels = imageData.data; // RGBA flat array

  // Convert to grayscale values
  const grayscale: number[] = [];
  for (let i = 0; i < pixels.length; i += 4) {
    // Luminance formula: 0.299R + 0.587G + 0.114B
    const gray = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
    grayscale.push(gray);
  }

  // Calculate mean brightness
  const mean = grayscale.reduce((sum, val) => sum + val, 0) / grayscale.length;

  // Generate binary hash: above mean → 1, below → 0
  const hash = grayscale.map((val) => (val >= mean ? '1' : '0')).join('');

  // Cleanup object URL if a File was used
  if (src instanceof File) {
    URL.revokeObjectURL(img.src);
  }

  return hash;
}

/**
 * Calculate the Hamming distance between two binary hash strings.
 * Lower distance = more visually similar.
 */
export function hammingDistance(hashA: string, hashB: string): number {
  if (hashA.length !== hashB.length) return Infinity;

  let distance = 0;
  for (let i = 0; i < hashA.length; i++) {
    if (hashA[i] !== hashB[i]) distance++;
  }
  return distance;
}

/**
 * Convert Hamming distance to a similarity percentage (0–100).
 * 0 distance = 100% similar, 64 distance = 0% similar.
 */
export function similarityPercent(distance: number): number {
  const maxDistance = HASH_SIZE * HASH_SIZE; // 64
  return Math.round(((maxDistance - distance) / maxDistance) * 100);
}

export interface ScoredItem<T> {
  item: T;
  distance: number;
  similarity: number; // 0–100
}

/**
 * Rank items by visual similarity to a query hash.
 * Returns items sorted by similarity (best match first).
 *
 * @param queryHash   - The perceptual hash of the query image
 * @param items       - Array of items to compare
 * @param getImageUrl - Function to extract the image URL from each item
 * @param threshold   - Minimum similarity % to include (default: 20)
 */
export async function rankByVisualSimilarity<T>(
  queryHash: string,
  items: T[],
  getImageUrl: (item: T) => string,
  threshold = 20
): Promise<ScoredItem<T>[]> {
  // Compute hashes for all items in parallel
  const results = await Promise.allSettled(
    items.map(async (item) => {
      const url = getImageUrl(item);
      const hash = await getImageHash(url);
      const dist = hammingDistance(queryHash, hash);
      const sim = similarityPercent(dist);
      return { item, distance: dist, similarity: sim };
    })
  );

  // Collect successful results
  const scored: ScoredItem<T>[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.similarity >= threshold) {
      scored.push(result.value);
    }
  }

  // Sort by distance (ascending) — best match first
  scored.sort((a, b) => a.distance - b.distance);

  return scored;
}
