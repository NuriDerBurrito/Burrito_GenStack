module.exports = {
  entry: './src/main.js',
  target: 'electron-main',
  module: {
    rules: [
      {
        test: /native_modules\/.+\.node$/,
        use: 'node-loader',
      },
      {
        test: /[/\\]node_modules[/\\].+\.(m?js|node)$/,
        parser: { amd: false },
        use: {
          loader: '@vercel/webpack-asset-relocator-loader',
          options: {
            outputAssetBase: 'native_modules',
          },
        },
      },
    ],
  },
};
