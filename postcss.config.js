module.exports = {
  plugins: {
    'tailwindcss/nesting': {},
    'tailwindcss': require('tailwindcss'),
    'autoprefixer': require('autoprefixer'),
    'postcss-flexbugs-fixes': require('postcss-flexbugs-fixes'),
    'postcss-preset-env': {
      autoprefixer: {
        flexbox: 'no-2009'
      },
      stage: 3,
      features: {
        'custom-properties': false
      }
    }
  }
}
