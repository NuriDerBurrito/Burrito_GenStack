const webpack = require('webpack');

module.exports = {
  target: 'web',
  module: {
    rules: require('./webpack.rules'),
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
  ],
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
    fallback: {
      events: require.resolve('events/'),
    },
  },
};
