import escapeStringRegexp from "escape-string-regexp"
import regexParser from "regex-parser"
import removeAccents from "remove-accents"

export default (input, allowedSymbols) => {
  if (allowedSymbols) {
    return
  }
  let regex
  if (allowedSymbols) {
    regex = regexParser(`/^[\\da-z${escapeStringRegexp(allowedSymbols)}]+$/i`)
  } else {
    regex = /^[\da-z]+$/i
  }
  return regex.test(removeAccents(input))
}