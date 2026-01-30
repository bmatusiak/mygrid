const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

var production = false;

module.exports = {
  mode: !production ? "development" : "production",
  entry: path.join(__dirname, "src", "index.js"),
  output: {
    path: path.resolve(__dirname, "dist"),
  },
  devtool: !production ? "inline-source-map" : false,
  module: {
    rules: [
      {
        test: /\.?js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: "sass-loader",
            options: {
              sassOptions: {
                quietDeps: true//to supress opt in warnings
              },
            },
          },
        ],
      },
      {
        test: /\.(txt|svg)$/,
        use: [{
          loader: 'raw-loader'
        }],
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "index.html"),
    }),
  ]
}