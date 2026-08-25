import React from 'react';

interface BowlIllustrationProps {
  className?: string;
}

export const BowlIllustration: React.FC<BowlIllustrationProps> = ({ className = '' }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Soft warm floor shadow under the bowl */}
      <div className="absolute -bottom-2 w-44 h-8 bg-amber-900/10 blur-md rounded-full pointer-events-none" />

      <svg
        viewBox="0 0 200 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm select-none"
      >
        <defs>
          {/* Steam gradient */}
          <linearGradient id="steamGrad1" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#C88E84" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#EAD2CC" stopOpacity="0.05" />
          </linearGradient>
          {/* Bowl gradient */}
          <linearGradient id="bowlGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C45A45" />
            <stop offset="100%" stopColor="#A84330" />
          </linearGradient>
          {/* Soup gradient */}
          <linearGradient id="soupGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F5E5D5" />
            <stop offset="100%" stopColor="#EAD5C2" />
          </linearGradient>
          {/* Chopsticks gradient */}
          <linearGradient id="stickGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#96614A" />
            <stop offset="100%" stopColor="#7E4A35" />
          </linearGradient>
        </defs>

        {/* --- Steam Wisps (3 graceful rising curves) --- */}
        <g className="animate-pulse duration-1000">
          {/* Left steam */}
          <path
            d="M74 95 C 68 70, 82 50, 72 25 C 69 18, 67 12, 70 8"
            stroke="url(#steamGrad1)"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* Center steam */}
          <path
            d="M102 95 C 108 65, 96 45, 106 18 C 108 13, 110 8, 108 4"
            stroke="url(#steamGrad1)"
            strokeWidth="5.5"
            strokeLinecap="round"
          />
          {/* Right steam */}
          <path
            d="M128 95 C 138 72, 122 52, 134 28 C 137 20, 138 12, 136 7"
            stroke="url(#steamGrad1)"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </g>

        {/* --- Chopsticks (Slanted across the bowl) --- */}
        <g id="chopsticks">
          {/* Lower Chopstick */}
          <path
            d="M34 116 L172 73"
            stroke="#96614A"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M34 116 L172 73"
            stroke="#B47960"
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.6"
          />
          {/* Upper Chopstick */}
          <path
            d="M48 108 L168 62"
            stroke="#87533E"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </g>

        {/* --- Bowl Rim & Food In Bowl --- */}
        {/* Bowl Back Rim */}
        <ellipse cx="100" cy="116" rx="72" ry="20" fill="#E4BA9F" stroke="#D19E7E" strokeWidth="4" />

        {/* Soup surface */}
        <ellipse cx="100" cy="118" rx="66" ry="17" fill="url(#soupGrad)" />

        {/* Food ingredients in soup (meatballs & veggie garnish) */}
        {/* Meatball Left */}
        <ellipse cx="76" cy="120" rx="9" ry="8" fill="#B87B4C" />
        <ellipse cx="74" cy="118" rx="4" ry="3" fill="#D39768" opacity="0.6" />

        {/* Veggie Center (Green Pea / Veggie) */}
        <ellipse cx="100" cy="121" rx="8" ry="7" fill="#6EA667" />
        <ellipse cx="98" cy="119" rx="3.5" ry="3" fill="#95C98E" opacity="0.6" />

        {/* Meatball Right */}
        <ellipse cx="124" cy="120" rx="9" ry="8" fill="#BD574E" />
        <ellipse cx="122" cy="118" rx="4" ry="3" fill="#DF7970" opacity="0.6" />

        {/* Front Bowl Rim */}
        <path
          d="M28 116 C28 128, 60 138, 100 138 C140 138, 172 128, 172 116"
          fill="none"
          stroke="#E4BA9F"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Bowl Body (Terra cotta / Warm Red-Orange Ceramic) */}
        <path
          d="M32 120 C 34 165, 62 195, 100 195 C 138 195, 166 165, 168 120 Z"
          fill="url(#bowlGrad)"
        />

        {/* Subtle shadow highlight on bowl body curve */}
        <path
          d="M44 135 C 50 170, 75 188, 100 188 C 125 188, 150 170, 156 135 C 145 158, 122 174, 100 174 C 78 174, 55 158, 44 135 Z"
          fill="#8B2F1F"
          opacity="0.35"
        />

        {/* Bowl Base Foot */}
        <path
          d="M80 195 C 80 198, 90 201, 100 201 C 110 201, 120 198, 120 195 Z"
          fill="#8B2F1F"
        />
      </svg>
    </div>
  );
};

