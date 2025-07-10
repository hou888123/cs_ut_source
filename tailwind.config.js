/** @type {import('tailwindcss').Config} */
import sharedConfig from '../shared/tailwind.config.js';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    "../shared/components/**/*.{js,jsx,ts,tsx}" // 包含共用組件
  ],
  presets: [sharedConfig],
}; 