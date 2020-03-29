import isOnlyLetters from "./isOnlyLetters"

export default designMetaData => {
  if (!designMetaData.authorTitle) {
    return false
  }
  if (!designMetaData.townTitle) {
    return false
  }
  if (designMetaData.byteLength !== 620) {
    return false
  }
  if (!designMetaData.patternTypeTitle) {
    return false
  }
  if (!designMetaData.patternTypeTitle === "Unimplemented pattern type") {
    return false
  }
  const authorIsLetters = isOnlyLetters(designMetaData.authorTitle)
  if (!authorIsLetters) {
    return false
  }
  const townIsLetters = isOnlyLetters(designMetaData.townTitle)
  if (!townIsLetters) {
    return false
  }
  return true
}