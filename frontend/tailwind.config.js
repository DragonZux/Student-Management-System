/** @type {import('tailwindcss').Config} */

const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Cyberpunk palette - Dark mode only
        background: '#0a0a0f',
        foreground: '#e0e0e0',
        card: '#12121a',
        muted: '#1c1c2e',
        'muted-foreground': '#6b7280',
        accent: '#00ff88',
        'accent-secondary': '#ff00ff',
        'accent-tertiary': '#00d4ff',
        border: '#2a2a3a',
        input: '#12121a',
        ring: '#00ff88',
        destructive: '#ff3366',
      },
      fontFamily: {
        // Cyberpunk monospace focus
        heading: ['"Orbitron"', '"Share Tech Mono"', 'monospace'],
        body: ['"JetBrains Mono"', '"Fira Code"', '"Consolas"', 'monospace'],
        mono: ['"Share Tech Mono"', 'monospace'],
      },
      fontSize: {
        '3xs': '0.5rem',
        '2xs': '0.625rem',
      },
      spacing: {
        '13': '3.25rem',
        '15': '3.75rem',
        '17': '4.25rem',
        '18': '4.5rem',
        '19': '4.75rem',
        '21': '5.25rem',
      },
      borderRadius: {
        // Cyberpunk uses sharp edges primarily
        none: '0',
        sm: '2px',
        base: '4px',
        DEFAULT: '4px',
      },
      boxShadow: {
        // Neon glow shadows - core to cyberpunk aesthetic
        'neon': '0 0 5px #00ff88, 0 0 10px rgba(0, 255, 136, 0.25)',
        'neon-sm': '0 0 3px #00ff88, 0 0 6px rgba(0, 255, 136, 0.15)',
        'neon-lg': '0 0 10px #00ff88, 0 0 20px rgba(0, 255, 136, 0.35), 0 0 40px rgba(0, 255, 136, 0.15)',
        'neon-secondary': '0 0 5px #ff00ff, 0 0 20px rgba(255, 0, 255, 0.4)',
        'neon-tertiary': '0 0 5px #00d4ff, 0 0 20px rgba(0, 212, 255, 0.4)',
        'neon-destructive': '0 0 5px #ff3366, 0 0 15px rgba(255, 51, 102, 0.3)',
      },
      textShadow: {
        glow: '0 0 10px rgba(0, 255, 136, 0.5)',
        'glow-lg': '0 0 20px rgba(0, 255, 136, 0.4), 0 0 40px rgba(0, 255, 136, 0.2)',
      },
      animation: {
        glitch: 'glitch 0.4s infinite',
        blink: 'blink 1s step-end infinite',
        scanline: 'scanline 8s linear infinite',
        'rgb-shift': 'rgb-shift 3s ease-in-out infinite',
        pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(2px, -2px)' },
          '60%': { transform: 'translate(-1px, -1px)' },
          '80%': { transform: 'translate(1px, 1px)' },
        },
        blink: {
          '50%': { opacity: '0' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'rgb-shift': {
          '0%, 100%': {
            textShadow: '-2px 0 #ff00ff, 2px 0 #00d4ff',
          },
          '50%': {
            textShadow: '2px 0 #ff00ff, -2px 0 #00d4ff',
          },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      transitionTimingFunction: {
        'cyber': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'glitch': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
      clipPath: {
        chamfer: 'polygon(0 10px, 10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px))',
        'chamfer-sm': 'polygon(0 5px, 5px 0, calc(100% - 5px) 0, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0 calc(100% - 5px))',
      },
      screens: {
        'xs': '320px',
        ...defaultTheme.screens,
      },
    },
  },
  plugins: [
    require('tailwindcss/plugin')(({ addUtilities, theme, addBase }) => {
      // Cyber utilities
      addUtilities({
        '.cyber-glitch': {
          animation: 'glitch 0.4s infinite',
          position: 'relative',
          '&::before': {
            content: 'attr(data-text)',
            position: 'absolute',
            left: '-2px',
            textShadow: '-2px 0 #ff00ff',
            clip: 'rect(0, 900px, 0, 0)',
            animation: 'glitch 0.3s infinite',
          },
          '&::after': {
            content: 'attr(data-text)',
            position: 'absolute',
            left: '2px',
            textShadow: '2px 0 #00d4ff',
            clip: 'rect(0, 900px, 0, 0)',
            animation: 'glitch 0.3s infinite -0.1s',
          },
        },
        '.cyber-chamfer': {
          clipPath: theme('clipPath.chamfer'),
        },
        '.cyber-chamfer-sm': {
          clipPath: theme('clipPath.chamfer-sm'),
        },
        '.neon-border': {
          borderColor: '#00ff88',
          boxShadow: '0 0 10px rgba(0, 255, 136, 0.25)',
        },
        '.neon-border-secondary': {
          borderColor: '#ff00ff',
          boxShadow: '0 0 10px rgba(255, 0, 255, 0.25)',
        },
        '.neon-border-tertiary': {
          borderColor: '#00d4ff',
          boxShadow: '0 0 10px rgba(0, 212, 255, 0.25)',
        },
        '.cyber-glow': {
          filter: 'drop-shadow(0 0 8px rgba(0, 255, 136, 0.4))',
        },
        '.cyber-glow-secondary': {
          filter: 'drop-shadow(0 0 8px rgba(255, 0, 255, 0.4))',
        },
        '.scanlines': {
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.15) 2px, rgba(0, 0, 0, 0.15) 4px)',
          backgroundSize: '100% 4px',
          pointerEvents: 'none',
        },
        '.grid-pattern': {
          backgroundImage: 'linear-gradient(rgba(0, 255, 136, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 136, 0.03) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        },
        '.terminal-prefix::before': {
          content: '">"',
          marginRight: '0.5rem',
          color: '#00ff88',
          fontWeight: 'bold',
        },
        '.uppercase-wide': {
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        },
      });

      // Add scanlines overlay to body/main
      addBase({
        body: {
          backgroundColor: '#0a0a0f',
          color: '#e0e0e0',
          fontFamily: '"JetBrains Mono", monospace',
          position: 'relative',
        },
        'body::after': {
          content: '""',
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.03) 2px, rgba(0, 0, 0, 0.03) 4px)',
          pointerEvents: 'none',
          zIndex: '9999',
        },
      });
    }),
  ],
};
