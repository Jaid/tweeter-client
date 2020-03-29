import removeAccents from "remove-accents"

export default input => {
  return /^[\w ]+$/.test(removeAccents(input))
}