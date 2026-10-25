import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

def create_butterfly_assets():
    # Size for high-res logo
    size = (512, 512)
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    
    # We will also create an SVG representation that's crystal clear at all scales
    svg_butterfly = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 120" fill="none">
  <defs>
    <!-- Left upper wing gradient -->
    <linearGradient id="leftUpperGrad" x1="15%" y1="10%" x2="95%" y2="90%">
      <stop offset="0%" stop-color="#C084FC" />
      <stop offset="45%" stop-color="#A855F7" />
      <stop offset="100%" stop-color="#7E22CE" />
    </linearGradient>

    <!-- Left lower wing gradient -->
    <linearGradient id="leftLowerGrad" x1="10%" y1="20%" x2="90%" y2="90%">
      <stop offset="0%" stop-color="#A855F7" />
      <stop offset="60%" stop-color="#8B5CF6" />
      <stop offset="100%" stop-color="#6D28D9" />
    </linearGradient>

    <!-- Right upper wing gradient -->
    <linearGradient id="rightUpperGrad" x1="85%" y1="10%" x2="5%" y2="90%">
      <stop offset="0%" stop-color="#FDA4AF" />
      <stop offset="40%" stop-color="#F472B6" />
      <stop offset="100%" stop-color="#EC4899" />
    </linearGradient>

    <!-- Right lower wing gradient -->
    <linearGradient id="rightLowerGrad" x1="90%" y1="20%" x2="10%" y2="90%">
      <stop offset="0%" stop-color="#FECDD3" />
      <stop offset="50%" stop-color="#FDA4AF" />
      <stop offset="100%" stop-color="#F43F5E" />
    </linearGradient>

    <!-- Center bead glow -->
    <radialGradient id="beadGrad" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#E9D5FF" />
      <stop offset="60%" stop-color="#A855F7" />
      <stop offset="100%" stop-color="#581C87" />
    </radialGradient>

    <!-- Soft ambient wing glow -->
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Wing layer with subtle glow -->
  <g filter="url(#softGlow)">
    <!-- Left Upper Wing -->
    <path d="M 68 46 C 66 32, 54 12, 34 14 C 18 16, 12 32, 16 52 C 20 70, 48 66, 68 54 Z"
          fill="url(#leftUpperGrad)" />

    <!-- Left Lower Wing -->
    <path d="M 67 56 C 52 56, 26 62, 28 82 C 30 96, 48 98, 58 86 C 64 78, 66 66, 67 56 Z"
          fill="url(#leftLowerGrad)" />

    <!-- Right Upper Wing -->
    <path d="M 72 46 C 74 32, 86 12, 106 14 C 122 16, 128 32, 124 52 C 120 70, 92 66, 72 54 Z"
          fill="url(#rightUpperGrad)" />

    <!-- Right Lower Wing -->
    <path d="M 73 56 C 88 56, 114 62, 112 82 C 110 96, 92 98, 82 86 C 76 78, 74 66, 73 56 Z"
          fill="url(#rightLowerGrad)" />
  </g>

  <!-- Butterfly Torso / Spine -->
  <path d="M 69.5 44 C 68 52, 68 64, 70 76 C 70.8 76, 71.5 75, 72 73 C 72 63, 72 52, 70.5 44 Z"
        fill="#3B0764" opacity="0.8" />

  <!-- Top Glowing Bead / Orb -->
  <ellipse cx="70" cy="18" rx="4.5" ry="5.5" fill="url(#beadGrad)" />
</svg>'''

    with open("c:/Users/Asus/Desktop/CareerTwin/frontend/public/logo.svg", "w", encoding="utf-8") as f:
        f.write(svg_butterfly)
    with open("c:/Users/Asus/Desktop/CareerTwin/frontend/public/favicon.svg", "w", encoding="utf-8") as f:
        f.write(svg_butterfly)

    print("SVG generated successfully.")

create_butterfly_assets()
