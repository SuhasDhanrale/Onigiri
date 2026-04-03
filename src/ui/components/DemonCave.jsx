import React from 'react';
import './DemonCave.css';

export function DemonCave() {
  return (
    <div className="demon-cave-container">
      <svg 
        viewBox="0 0 800 200" 
        preserveAspectRatio="xMidYMin slice" 
        className="demon-cave-svg"
      >
        <defs>
          <radialGradient id="caveGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="rgba(184, 66, 53, 0.6)" />
            <stop offset="100%" stopColor="rgba(184, 66, 53, 0)" />
          </radialGradient>
          
          <filter id="inkBlur">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
          </filter>
          
          <pattern id="parchmentTexture" width="400" height="400" patternUnits="userSpaceOnUse">
             <rect width="400" height="400" fill="#dfd4ba" />
             {/* Subtle noise/texture can be added here if needed */}
          </pattern>
        </defs>

        {/* Inner Glow */}
        <ellipse cx="400" cy="40" rx="300" ry="80" fill="url(#caveGlow)" className="cave-pulse-glow" />
        
        {/* Rear Deep Shadow */}
        <path 
          d="M 100 0 Q 400 120 700 0 L 800 0 L 800 -100 L 0 -100 L 0 0 Z" 
          fill="#0a0908" 
        />

        {/* Main Cave Teeth/Mouth Area */}
        <path 
          className="cave-mouth-path"
          d="M 0 0 
             L 50 20 L 80 10 L 120 40 L 160 15 L 210 50 
             L 260 25 L 310 60 L 360 30 L 400 70 
             L 440 30 L 490 60 L 540 25 L 590 50 
             L 640 15 L 680 40 L 720 10 L 750 20 L 800 0 
             V -100 H 0 Z" 
          fill="#1b1918"
          stroke="#1b1918"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        
        {/* Subtle Inner Shadows (Redesigned to avoid face shape) */}
        <g opacity="0.3" filter="url(#inkBlur)">
          <path d="M 50 30 L 150 50" fill="none" stroke="#1b1918" strokeWidth="3" />
          <path d="M 750 30 L 650 50" fill="none" stroke="#1b1918" strokeWidth="3" />
          <path d="M 300 80 L 500 80" fill="none" stroke="#b84235" strokeWidth="5" opacity="0.4" />
        </g>
      </svg>
      
      {/* Animated Spirit Mist Particles */}
      <div className="spirit-mist-container">
        {[...Array(6)].map((_, i) => (
          <div key={i} className={`mist-particle mist-${i}`} />
        ))}
      </div>
    </div>
  );
}
