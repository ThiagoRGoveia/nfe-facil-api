const webpack = require('webpack');
const path = require('path');

module.exports = function (options) {
  const { plugins, ...config } = options;
  return {
    ...config,
    output: {
      ...config.output,
      path: path.resolve(__dirname, 'dist/apps/process-document-job'),
      filename: 'lambda.js',
      // libraryTarget: 'commonjs2',
      library: {
         type: 'commonjs2'
      },
    },
    externals: [],
    plugins: [
      ...plugins,
      new webpack.IgnorePlugin({
        checkResource(resource) {
          const lazyImports = [
            '@nestjs/microservices',
            'cache-manager',
            // 'class-validator',
            // 'class-transformer',
            '@nestjs/websockets/socket-module',
            '@nestjs/microservices/microservices-module',
            'fastify-swagger',
          ];
          if (!lazyImports.includes(resource)) {
            return false;
          }
          try {
            require.resolve(resource, {
              paths: [process.cwd()],
            });
          } catch (err) {
            return true;
          }
          return false;
        },
      }),
    ],
  };
};