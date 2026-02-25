const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const Dotenv = require("dotenv-webpack");

module.exports = (env, argv) => {
  const isDev = argv.mode === "development";

  return {
    entry: "./src/index.js",

    output: {
      filename: "bundle.[contenthash].js",
      // Vercel serve i file statici dalla cartella configurata in vercel.json
      path: path.resolve(__dirname, "public/dist"),
      clean: true,
      publicPath: "/dist/",
    },

    devServer: {
      static: "./public",
      port: 3000,
      open: true,
      // In dev, proxia /api verso una funzione locale (vedi scripts in package.json)
      proxy: [
        {
          context: ["/api"],
          target: "http://localhost:3001",
        },
      ],
    },

    plugins: [
      // dotenv-webpack serve SOLO in locale per il dev server
      // Su Vercel le env vars vengono iniettate direttamente da Vercel, non servono qui
      ...(isDev ? [new Dotenv({ path: "./.env", safe: true })] : []),

      new HtmlWebpackPlugin({
        template: "./public/index.html",
        filename: "../index.html", // scrive in /public/index.html
      }),
    ],

    devtool: isDev ? "eval-source-map" : false,
  };
};
