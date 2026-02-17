import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'drift': 'drift 8s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 4s ease infinite',
        'slide-up': 'slide-up 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'slide-in-right': 'slide-in-right 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'icon-float': 'icon-float 3s ease-in-out infinite',
        'card-in': 'card-in 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'bounce-in': 'bounce-in 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in-blur': 'fade-in-blur 0.6s cubic-bezier(0.16,1,0.3,1) both',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) translateX(0) scale(1)' },
          '25%': { transform: 'translateY(-20px) translateX(10px) scale(1.05)' },
          '50%': { transform: 'translateY(-10px) translateX(-15px) scale(0.98)' },
          '75%': { transform: 'translateY(-25px) translateX(5px) scale(1.02)' },
        },
        drift: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -25px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 15px) scale(0.95)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.15)' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(40px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'icon-float': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-8px) rotate(3deg)' },
        },
        'card-in': {
          from: { opacity: '0', transform: 'translateY(16px) scale(0.97)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'bounce-in': {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { transform: 'scale(1.1)' },
          '70%': { transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'fade-in-blur': {
          from: { opacity: '0', filter: 'blur(8px)', transform: 'scale(0.96)' },
          to: { opacity: '1', filter: 'blur(0)', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
