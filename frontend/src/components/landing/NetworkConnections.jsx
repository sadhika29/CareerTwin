import React from 'react'
import { motion } from 'framer-motion'

export default function NetworkConnections({ nodes, viewBox = "0 0 1000 500", hub = { x: 500, y: 250 } }) {
  return (
    <svg viewBox={viewBox} className="absolute inset-0 w-full h-full z-10 pointer-events-none overflow-visible">
      <defs>
        {nodes.map((node, i) => (
          <linearGradient key={`path-grad-${i}`} id={`path-grad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={node.hex || '#A855F7'} />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor={node.hex || '#22D3EE'} />
          </linearGradient>
        ))}
        {/* Glow Filters */}
        <filter id="glow-ambient" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="12" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="glow-core" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Ambient connection glows (faint magenta glow around selected connections) */}
      {nodes.map((node, i) => (
         <motion.path key={`ambient-${i}`} d={node.path} stroke={node.hex || '#A855F7'} strokeWidth="20" opacity="0.05" filter="url(#glow-ambient)" fill="none" />
      ))}

      {/* Orbit Rings around Hub */}
      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: `${hub.x}px ${hub.y}px` }}
      >
        <ellipse cx={hub.x} cy={hub.y} rx="140" ry="140" stroke="#A855F7" strokeWidth="1" strokeDasharray="4 8" opacity="0.15" fill="none" />
      </motion.g>
      <motion.g
        animate={{ rotate: -360 }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: `${hub.x}px ${hub.y}px` }}
      >
        <ellipse cx={hub.x} cy={hub.y} rx="200" ry="200" stroke="#22D3EE" strokeWidth="1" opacity="0.1" fill="none" />
      </motion.g>
      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        style={{ transformOrigin: `${hub.x}px ${hub.y}px` }}
      >
        <ellipse cx={hub.x} cy={hub.y} rx="280" ry="280" stroke="#EC4899" strokeWidth="1" strokeDasharray="2 12" opacity="0.1" fill="none" />
      </motion.g>

      {/* Curved Neon Connection Paths */}
      {nodes.map((node, i) => (
        <g key={`path-${i}`}>
          {/* Layer 1: Large very soft ambient glow */}
          <motion.path
            d={node.path}
            stroke={`url(#path-grad-${i})`}
            strokeWidth="10"
            strokeOpacity="0.08"
            fill="none"
            filter="url(#glow-ambient)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 0.2 }}
          />
          {/* Layer 2: Medium transparent glow */}
          <motion.path
            d={node.path}
            stroke={`url(#path-grad-${i})`}
            strokeWidth="4"
            strokeOpacity="0.3"
            fill="none"
            filter="url(#glow-core)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 0.2 }}
          />
          {/* Layer 3: Thin bright core line */}
          <motion.path
            d={node.path}
            stroke={`url(#path-grad-${i})`}
            strokeWidth="1.5"
            strokeOpacity="0.6"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 0.2 }}
          />
          
          {/* Moving Particles (Energy Trail) */}
          <motion.path
            d={node.path}
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeDasharray="1 6 2 8 3 10 4 400"
            strokeLinecap="round"
            fill="none"
            initial={{ strokeDashoffset: 434, opacity: 0 }}
            animate={{ strokeDashoffset: 0, opacity: 1 }}
            transition={{ duration: node.particleDuration || 4, repeat: Infinity, ease: "linear", delay: (node.delay || 0) }}
            filter="url(#glow-core)"
          />
        </g>
      ))}

      {/* Glowing Connection Nodes */}
      {nodes.map((node, i) => (
        node.cx && node.cy ? (
          <g key={`node-${i}`}>
            <motion.circle 
              cx={node.cx} cy={node.cy} r="6" 
              fill={node.hex || '#A855F7'} opacity="0.3" 
              filter="url(#glow-ambient)"
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
            />
            <motion.circle 
              cx={node.cx} cy={node.cy} r="3" 
              fill="#FFFFFF" 
              filter="url(#glow-core)"
            />
          </g>
        ) : null
      ))}
      
      {/* Central Hub Node Glow */}
      <motion.circle 
        cx={hub.x} cy={hub.y} r="12" 
        fill="#A855F7" opacity="0.4" 
        filter="url(#glow-ambient)"
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  )
}
