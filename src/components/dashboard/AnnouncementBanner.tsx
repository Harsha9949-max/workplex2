/**
 * AnnouncementBanner Component
 * Horizontal scrolling text banner for admin announcements
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Announcement } from '../../hooks/useFirestore';
import { SkeletonLoader } from './SkeletonLoader';
import { Megaphone } from 'lucide-react';

interface AnnouncementBannerProps {
  announcements: Announcement[];
  loading: boolean;
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({
  announcements,
  loading,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (loading || announcements.length === 0) return;

    const rotateAnnouncement = () => {
      if (!isPaused) {
        setCurrentIndex((prev) => (prev + 1) % announcements.length);
      }
    };

    intervalRef.current = setInterval(rotateAnnouncement, 4000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [announcements.length, loading, isPaused]);

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-[#E8B84B]/20 to-[#00C9A7]/20 rounded-lg p-3">
        <SkeletonLoader type="announcement" />
      </div>
    );
  }

  if (announcements.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#E8B84B]/20 via-[#E8B84B]/10 to-[#00C9A7]/20 border border-[#E8B84B]/30"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="marquee"
      aria-label="Admin announcements"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 p-3">
        <Megaphone size={18} className="text-[#E8B84B] flex-shrink-0" />
        <div className="flex-1 overflow-hidden">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="text-white text-sm font-medium"
          >
            {announcements[currentIndex]?.text}
          </motion.div>
        </div>
        {/* Pagination Dots */}
        {announcements.length > 1 && (
          <div className="flex gap-1 flex-shrink-0">
            {announcements.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  index === currentIndex ? 'bg-[#E8B84B] w-3' : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
