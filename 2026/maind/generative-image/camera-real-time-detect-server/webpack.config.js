const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const Dotenv = require("dotenv-webpack");

module.exports = (env, argv) => {
  const isDev = argv.mode === "development";

  return {
    entry: "./src/index.js",

    output: {
      filename: "bundle.[contenthash].js",
      path: path.resolve(__dirname, "dist"),
      clean: true,
    },

    devServer: {
      static: "./dist",
      port: 3000,
      open: true,
      // HTTPS needed for getUserMedia on localhost (Chrome allows http://localhost,
      // but if you test on a real device over LAN you'll need https)
      // https: true,
    },

    plugins: [
      // Reads .env and exposes vars as process.env.VAR_NAME in your JS
      new Dotenv({
        path: "./.env",
        safe: true,       // requires a .env.example file listing required vars
        allowEmptyValues: false,
      }),

      new HtmlWebpackPlugin({
        template: "./public/index.html",
        // inject the bundle <script> automatically
      }),
    ],

    // Source maps in dev, none in prod
    devtool: isDev ? "eval-source-map" : false,
  };
};
