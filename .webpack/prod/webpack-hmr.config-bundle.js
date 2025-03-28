const nodeExternals = require('webpack-node-externals');
const webpack = require('webpack');
const TerserPlugin = require("terser-webpack-plugin");

module.exports = function (options) {
  const { plugins, ...config } = options;
  return {
    ...config,
    entry: [options.entry],
    externals: [
      nodeExternals({
        allowlist: [
          "@aws-sdk/client-cognito-identity-provider",
          "@aws-sdk/client-s3",
          "@aws-sdk/client-sqs",
          "@codegenie/serverless-express",
          "@golevelup/nestjs-discovery",
          "@graphql-yoga/nestjs",
          "@mikro-orm/core",
          "@mikro-orm/nestjs",
          "@mikro-orm/postgresql",
          "@nestjs/axios",
          "@nestjs/common",
          "@nestjs/common/*",
          "@nestjs/config",
          "@nestjs/core",
          "@nestjs/graphql",
          "@nestjs/passport",
          "@nestjs/platform-express",
          "@nestjs/swagger",
          "@types/passport-http",
          "@types/unzipper",
          "auth0",
          "axios",
          "class-transformer",
          "class-validator",
          "exceljs",
          "express",
          "graphql",
          "graphql-scalars",
          "graphql-upload-minimal",
          "graphql-yoga",
          "install",
          "json-2-csv",
          "jwks-rsa",
          "lodash",
          "nestjs-pino",
          "passport-http",
          "passport-jwt",
          "pdf-parse",
          "pdf-to-img",
          "pino-http",
          "pino-pretty",
          "reflect-metadata",
          "rxjs",
          "rxjs/operators",
          "sst",
          "stripe",
          "unzipper",
          "uuid",
          "oracledb",
          "pg-query-stream",
          "sqlite3",
          "ts-morph",
          "nestjs/graphql/dist/federation",
          "nestjs/graphql/federation",
          "libsql",
          "mysql2",
          "mariadb/callback",
          "better-sqlite3",
          "tedious",
          "mysql"
        ],
      })
    ],
    optimization: {
      ...config.optimization,
      minimize: true,
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
      new webpack.IgnorePlugin({
        checkResource(resource) {
          const lazyImports = [
            '@nestjs/microservices',
            'cache-manager',
            '@nestjs/websockets/socket-module',
            '@nestjs/microservices/microservices-module',
            '@nestjs/graphql/dist/federation',
            'fastify-swagger',
            'libsql',
            'mysql2',
            'mariadb/callback',
            'sqlite3',
            'better-sqlite3',
            'tedious',
            'mysql',
            'oracledb',
            'pg-query-stream',
            'sqlite3',
            'ts-morph'
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
      new webpack.NormalModuleReplacementPlugin(
        /canvas|canvas\/build\/Release\/canvas\.node$|@apollo\/subgraph\/.+$|@apollo\/subgraph$/,
        'noop2'
      ),
    ],
    node: {
      __dirname: false,
      __filename: false,
    },
  };
};