/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        platform: {
          linkedin: '#0A66C2',
          instagram: '#E4405F',
          facebook: '#1877F2',
          twitter: '#000000',
          youtube: '#FF0000',
          pinterest: '#E60023',
          google: '#4285F4',
          tiktok: '#000000',
          snapchat: '#FFFC00',
          reddit: '#FF4500',
          threads: '#000000',
        }
      },
    },
  },
  plugins: [],
}
