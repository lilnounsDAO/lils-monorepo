module.exports = {
  extends: ["./index.js"],
  plugins: ["react", "react-hooks", "jsx-a11y"],
  rules: {
    "react/prop-types": "off",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
};