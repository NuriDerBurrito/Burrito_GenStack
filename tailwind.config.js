module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        neon: {
          blue: 'var(--neon-blue)',
          purple: 'var(--neon-purple)',
          text: 'var(--text-main)',
          divider: 'var(--divider-color)',
          bg: '#050505',
          glass: 'rgba(0, 0, 0, 0.7)'
        }
      },
      boxShadow: {
        'neon-blue': '0 0 5px var(--neon-blue), 0 0 10px var(--neon-blue)',
        'neon-purple': '0 0 5px var(--neon-purple), 0 0 10px var(--neon-purple)',
      }
    },
  },
  plugins: [],
};
