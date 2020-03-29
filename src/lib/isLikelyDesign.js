import removeAccents from "remove-accents"

export default designMetaData => {
  if (!designMetaData.authorTitle) {
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
  const authorIsLetters = /^[\w ]+$/i.test(removeAccents(designMetaData.authorTitle))
  if (!authorIsLetters) {
    return false
  }
  const townIsLetters = /^[\w ]+$/i.test(removeAccents(designMetaData.townTitle))
  if (!townIsLetters) {
    return false
  }
  return true
}