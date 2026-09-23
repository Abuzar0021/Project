/**
 * PostCSS config for Tailwind CSS v4.
 * Tailwind v4 ships its own PostCSS plugin; no autoprefixer entry is needed
 * because it is handled internally.
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
