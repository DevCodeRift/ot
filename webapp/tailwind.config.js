/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/modules/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Cyberpunk 2077 Color Palette
        'cp-cyan': '#00f5ff',
        'cp-yellow': '#fcee0a',
        'cp-red': '#ff003c',
        'cp-green': '#00ff9f',
        'cp-purple': '#b847ca',
        'cp-orange': '#ff6b35',
        
        // Background Colors
        'cp-bg-primary': '#0f0f0f',
        'cp-bg-secondary': '#1a1a1a',
        'cp-bg-tertiary': '#252525',
        'cp-bg-accent': '#2a2a2a',
        
        // Text Colors
        'cp-text-primary': '#ffffff',
        'cp-text-secondary': '#b3b3b3',
        'cp-text-muted': '#666666',
        'cp-text-accent': '#00f5ff',
        
        // Border Colors
        'cp-border': '#333333',
        'cp-border-accent': '#00f5ff',
      },
      fontFamily: {
        'cyberpunk': ['Rajdhani', 'Arial', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'cp-glow': '0 0 10px #00f5ff',
        'cp-glow-lg': '0 0 20px #00f5ff',
      },
      animation: {
        'cyber-scan': 'cyber-scan 2s infinite',
      },
      keyframes: {
        'cyber-scan': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
}
