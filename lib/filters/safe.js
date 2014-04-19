var FilterNode = require('../filter_node')

module.exports = function(input) {
  if (input === undefined)
    input = ''

  input = new String(input)
  input.safe = true
  return input
}
