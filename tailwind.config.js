/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  darkMode: "class",
  content: ["./**/*.tsx", "./*.tsx"],
  plugins: [],
  theme: {
    extend: {
      gridTemplateColumns: {
        todo: "48px, auto, 150px, 100px, 90px"
      }
    }
  }
}
