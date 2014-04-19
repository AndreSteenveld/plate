var FilterNode = require('../filter_node')

module.exports = function(input) {
  if (input === undefined)
    input = ''

  var x = new String(FilterNode.escape(input+''))
  x.safe = true
  return x
}
