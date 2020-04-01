import camelcase from "camelcase"

const types = {}

const requireContext = require.context("../tweeters/", false)
for (const entry of requireContext.keys()) {
  const name = entry.match(/\.\/(?<key>\w+)/).groups.key
  const camelcaseName = camelcase(name)
  types[camelcaseName] = {
    Type: require(`../tweeters/${name}.js`).default,
  }
}

export default types