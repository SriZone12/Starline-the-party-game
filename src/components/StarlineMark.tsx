import React from 'react';

interface StarlineMarkProps {
  className?: string;
}

export const StarlineMark: React.FC<StarlineMarkProps> = ({ className }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <path
      d="m16 2.5 2.7 6.8 6.8 2.7-6.8 2.7-2.7 6.8-2.7-6.8-6.8-2.7 6.8-2.7L16 2.5Z"
      fill="currentColor"
    />
    <circle cx="25.5" cy="23.5" r="1.5" fill="currentColor" opacity=".7" />
    <circle cx="7" cy="24.5" r="1" fill="currentColor" opacity=".45" />
    <path
      d="m18.7 20.8 5 2M13.8 25.4l-5.4-1.2"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      opacity=".55"
    />
  </svg>
);
