/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Colors
        'primary': {
          DEFAULT: '#E8816F', // Coral Peach
          dark: '#D46A58',
          light: '#F4A89A',
        },
        // Background Colors
        'background': {
          light: '#FFF4F2', // Soft Blush
          DEFAULT: '#FFFFFF', // White
          secondary: '#FADBD6', // Pale Rose
        },
        // Text Colors
        'text': {
          primary: '#1B1E28', // Charcoal
          secondary: '#5F5F66', // Muted Gray
        },
        // Illustration Colors
        'illustration': {
          hair: '#2E2F45', // Deep Navy
          skin: '#F6B19C', // Warm Apricot
        },
        // Functional Colors
        'success': '#8DD6A9',
        'warning': '#F9C77B',
        'error': '#E57373',
        'info': '#68B8F4',
        'variance': 'rgba(232, 129, 111, 0.2)',
        'mean': '#5F5F66',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 6px 18px rgba(15, 23, 36, 0.06)',
        'card': '0 4px 12px rgba(15, 23, 36, 0.08)',
        'button': '0 4px 10px rgba(227, 124, 107, 0.4)',
        'button-hover': '0 6px 15px rgba(227, 124, 107, 0.5)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float-delayed 6s ease-in-out infinite 3s',
        'pulse-glow': 'pulse-glow 2s infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'float-delayed': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(227, 124, 107, 0.4)' },
          '50%': { boxShadow: '0 0 0 10px rgba(227, 124, 107, 0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200px 0' },
          '100%': { backgroundPosition: 'calc(200px + 100%) 0' },
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #E37C6B 0%, #F4A89A 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #FFF0F1 0%, #FCEFF0 100%)',
        'gradient-hero': 'linear-gradient(180deg, #FFF6F6 0%, #FFFFFF 100%)',
        'gradient-section': 'linear-gradient(180deg, #FFF9FA 0%, #FCEFF0 100%)',
        'gradient-card': 'linear-gradient(145deg, #FDFDFD 0%, #FFF0F1 100%)',
      },
    },
  },
  plugins: [],
}
