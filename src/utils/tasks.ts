/**
 * Phase 3 Utility Functions
 * Task system utilities: formatting, image compression, storage upload
 */

import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

/**
 * Format currency to Indian Rupee format
 */
export const formatCurrency = (amount: number): string => {
  return `Rs.${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Format time remaining in HH:MM:SS format
 */
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get time remaining until deadline in seconds
 */
export const getTimeRemaining = (deadline: any): number => {
  if (!deadline) return 0;
  const deadlineDate = deadline.toDate ? deadline.toDate() : new Date(deadline);
  const now = new Date();
  const diff = Math.floor((deadlineDate.getTime() - now.getTime()) / 1000);
  return Math.max(0, diff);
};

/**
 * Check if deadline has expired
 */
export const isDeadlineExpired = (deadline: any): boolean => {
  return getTimeRemaining(deadline) <= 0;
};

/**
 * Get status color classes
 */
export const getStatusColor = (status: string): { bg: string; text: string; border: string } => {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
    submitted: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
    approved: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
    rejected: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
    expired: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30' },
  };
  return colors[status] || colors.pending;
};

/**
 * Get venture color classes
 */
export const getVentureColor = (venture: string): { bg: string; text: string; border: string } => {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    BuyRix: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
    Vyuma: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
    TrendyVerse: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30' },
    Growplex: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  };
  return colors[venture] || { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30' };
};

/**
 * Compress image to max size (returns blob)
 */
export const compressImage = (file: File, maxSizeMB: number = 2): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions maintaining aspect ratio
        const maxDimension = 1920;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Compress with quality adjustment
        let quality = 0.8;
        const compress = () => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                if (blob.size > maxSizeMB * 1024 * 1024 && quality > 0.1) {
                  quality -= 0.1;
                  compress();
                } else {
                  resolve(blob);
                }
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        compress();
      };
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
};

/**
 * Upload file to Firebase Storage with progress callback
 */
export const uploadToStorage = (
  file: Blob,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(Math.round(progress));
      },
      (error) => reject(error),
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
};

/**
 * Validate URL format
 */
export const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Count words in text
 */
export const countWords = (text: string): number => {
  return text.trim().split(/\s+/).filter(Boolean).length;
};

/**
 * Get proof type icon and label
 */
export const getProofTypeInfo = (proofType: string): { icon: string; label: string } => {
  const types: Record<string, { icon: string; label: string }> = {
    image: { icon: '📷', label: 'Upload screenshot/photo' },
    link: { icon: '🔗', label: 'Submit URL link' },
    text: { icon: '📝', label: 'Write your response' },
  };
  return types[proofType] || types.image;
};

/**
 * Format relative time for submission dates
 */
export const formatRelativeTime = (timestamp: any): string => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};
