const nodeExternals = require('webpack-node-externals');
const webpack = require('webpack');
const TerserPlugin = require("terser-webpack-plugin");

module.exports = function (options) {
  const { plugins, ...config } = options;
  return {
    ...config,
    mode: 'production',
    target: 'node',
    entry: [options.entry],
    externals: [
      nodeExternals()
    ],
    optimization: {
      ...config.optimization,
      minimize: true,
      usedExports: true,
      minimizer: [new TerserPlugin({
        terserOptions: {
          keep_classnames: true,
          keep_fnames: true,
        },
      })],
    },
    output: {
      ...config.output,
      chunkFormat: false
    },
    plugins: [
      ...plugins,
    ],
    node: {
      __dirname: false,
      __filename: false,
    },
  };
};