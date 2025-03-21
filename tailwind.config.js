/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Make sure Tailwind scans all component files
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")], // Add DaisyUI here
};
