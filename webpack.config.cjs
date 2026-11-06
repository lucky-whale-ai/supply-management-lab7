const path = require("node:path");

module.exports = {
  entry: "./client/main.jsx",
  output: {
    path: path.resolve(__dirname, "public/build"),
    filename: "app.js",
    publicPath: "/build/",
    clean: true,
  },
  module: {
    rules: [{ test: /\.jsx?$/, exclude: /node_modules/, use: "babel-loader" }],
  },
  resolve: { extensions: [".jsx", ".js"] },
  devServer: {
    static: path.resolve(__dirname, "public"),
    host: "127.0.0.1",
    port: 3000,
    hot: false,
    historyApiFallback: true,
    proxy: [{ context: ["/api"], target: "http://127.0.0.1:3007" }],
  },
};
