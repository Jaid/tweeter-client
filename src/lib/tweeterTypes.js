import camelcase from "camelcase"

const entries = {}
const requireContext = require.context("../tweeters/", true, /^\.\/\w+\/index.js$/)
for (const relativePath of requireContext.keys()) {
  const name = relativePath.match(/[/\\](?<name>.+?)[/\\]index\.js$/).groups.name
  const camelcaseName = camelcase(name)
  entries[camelcaseName] = {
    Type: requireContext(relativePath).default,
  }
}

export default entries