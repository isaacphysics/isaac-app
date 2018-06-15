var path = require("path");
var webpack = require("webpack");

class NoEmitPlugin {
  apply(compiler) {
    compiler.hooks.emit.tap('NoEmitPlugin', compilation => {
      delete compilation.assets["DUMMY_OUTPUT"];
    });
  }
}

module.exports = {
  context: path.resolve(__dirname),

  mode: "development",

  entry: {
    'isaac.js': ["./app/js/app/app.js"],
    'DUMMY_OUTPUT': ["./scss/app.scss"],
  },

  output: {
    path: path.resolve(__dirname, "app"),
    filename: '[name]',
  },
  
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          "file-loader?name=isaac.css",
          "extract-loader",
          "css-loader?url=false&sourceMap=true",
          {
            loader: 'sass-loader', 
            options: { includePaths: ["node_modules"], sourceMap: true }
          }
        ]
      },
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
        use: "babel-loader"
      },
      { 
        test: path.resolve(__dirname, "node_modules", "jquery", "dist", "jquery.js"),
        use: [
          {loader:"expose-loader", options: "jQuery"},
          {loader:"expose-loader", options: "$"}
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

  plugins: [
    new NoEmitPlugin("isaac.css.NO")
  ],

  // Generate source maps
  devtool: "source-map",
}