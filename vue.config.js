const { defineConfig } = require('@vue/cli-service')
const CompressionPlugin = require("compression-webpack-plugin");
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = defineConfig({
  transpileDependencies: true,
  productionSourceMap: false,
  filenameHashing: false,
  css: {
    extract: true,
  },
  configureWebpack: {
    optimization: {
      // splitChunks: false,
    },
    devServer: {
      headers: { "Access-Control-Allow-Origin": "*" }
    },
    plugins: [
      // new BundleAnalyzerPlugin(),
      new CompressionPlugin({
        algorithm: "gzip",
      }),
    ],
    externals: {
      // 'chart.js': 'Chart'
    }
  },
})
