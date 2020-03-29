import removeAccents from "remove-accents"

export default designMetaData => {
  if (!designMetaData.authorTitle) {
    return false
  }
  if (designMetaData.byteLength !== 620) {
    return false
  }
  return /^[\w ]+$/i.test(removeAccents(designMetaData.authorTitle))
}