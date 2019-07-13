import path from "path"

import configure from "webpack-config-jaid"
import CopyPlugin from "copy-webpack-plugin"

export default configure({
  publishimo: {fetchGithub: true},
  extra: {
    module: {
      rules: [
        {
          test: /\.node$/,
          loader: "native-ext-loader",
        },
      ],
    },
    plugins: [
      new CopyPlugin([
        {
          from: path.join(__dirname, "node_modules", "canvas", "build", "Release/**"),
          context: path.join(__dirname, "node_modules", "canvas", "build", "Release"),
          to: path.join(__dirname, "dist", "package", process.env.NODE_ENV || "development"),
        },
      ]),
    ],
  },
})