import timestring from "timestring"

/**
 * @param {string|number} input
 * @return {number}
 */
export default input => {
  if (!/[a-z]/i.test(input)) {
    return input * 1000
  }
  return timestring(input, "ms")
}