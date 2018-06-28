var path = require("path");
var webpack = require("webpack");
const merge = require('webpack-merge');

var prodConfig = {
  optimization: {
    minimize: true,
  },
};

module.exports = function(env) {
  return merge({
    context: path.resolve(__dirname),

    mode: "development",

    entry: {
      'isaac.js': ["./app/js/app/app.js"],
    },

    output: {
      path: path.resolve(__dirname, "app"),
      filename: '[name]',
    },
    
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: [/node_modules/, /app\/js\/lib/],
          use: 'babel-loader?cacheDirectory=true',
        },
        {
          test: /\.html$/,
          use: [
            { loader:'ngtemplate-loader', options: { relativeTo: "/partials", prefix: "/partials", module: "isaac.templates" } },
            { loader: 'html-loader' }
          ]
        },
        {
          test: /\.ts$/,
          use: ["babel-loader", "ts-loader"]
        },
        { 
          test: path.resolve(__dirname, "node_modules", "jquery", "dist", "jquery.js"),
          use: [
            {loader:"expose-loader", options: "jQuery"},
            {loader:"expose-loader", options: "$"}
          ]
        },
        { 
          test: /modernizr/,
          use: [
            {loader:"expose-loader", options: "Modernizr"},
            {loader:"imports-loader?this=>window"},
          ]
        },
        { 
          test: /opentip-jquery/,
          use: [
            {loader:"expose-loader", options: "Opentip"},
          ]
        },
        { 
          test: /showdown\.js/,
          use: [
            {loader:"expose-loader", options: "Showdown"},
          ]
        },
        {
          test: /angular-ui-router\.js/,
          use: "imports-loader?angular",
        },
        {
          test: /angular-google-maps\.js/,
          use: "imports-loader?_=lodash",
        }
      ]
    },

    resolve: {
      modules: [path.resolve(__dirname), "node_modules"],

      extensions: ['.js', '.html', '.ts'],

      alias: {
        'jquery-ui/datepicker' : 'jquery-ui/ui/widgets/datepicker',
        '/partials': 'app/partials',
        'showdown': 'app/js/lib/showdown/showdown.js',
      },
    },

    // Generate source maps
    devtool: "source-map",
  }, env == "prod" ? prodConfig : {} );
};