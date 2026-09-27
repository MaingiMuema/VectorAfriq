'use client';

import { useState } from 'react';
import Image from 'next/image';

interface AgentAvatarProps {
  name: string;
  avatar?: string;
  className?: string;
}

const getInitials = (name: string) => {
  if (!name) return '';

  // Split by whitespace and filter out empty strings to handle multiple spaces
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return '';

  if (parts.length === 1) {
    // For single names, return the first 2 characters (e.g., "John" -> "JO")
    // This ensures we always have a substantial avatar text
    return parts[0].substring(0, 2).toUpperCase();
  }

  // For multiple names, return first letter of first and last name (e.g., "John Middle Doe" -> "JD")
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getBackgroundColor = (name: string) => {
  if (!name) return '#9CA3AF'; // Default gray for missing names

  const colors = [
    '#EF4444', // red-500
    '#F59E0B', // amber-500
    '#10B981', // emerald-500
    '#3B82F6', // blue-500
    '#6366F1', // indigo-500
    '#8B5CF6', // violet-500
    '#EC4899', // pink-500
    '#14B8A6', // teal-500
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function AgentAvatar({ name, avatar, className = '' }: AgentAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const hasValidAvatar = avatar &&
    avatar !== '/images/placeholder.png' &&
    !avatar.includes('placeholder') &&
    !imageError;

  if (hasValidAvatar) {
    return (
      <Image
        src={avatar!}
        alt={name}
        fill
        className={`object-cover transition-transform duration-500 hover:scale-110 ${className}`}
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div
      className={`w-full h-full flex items-center justify-center transition-transform duration-500 hover:scale-110 ${className}`}
      style={{ backgroundColor: getBackgroundColor(name || '') }}
    >
      <span className="text-4xl font-bold text-white tracking-widest drop-shadow-md select-none">
        {getInitials(name)}
      </span>
    </div>
  );
}
