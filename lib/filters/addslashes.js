module.exports = function(input) {
  if (input === undefined || input === null)
    input = ''
  return input.toString().replace(/'/g, "\\'")
}
