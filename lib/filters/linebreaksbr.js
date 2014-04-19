var safe = require('./safe')

module.exports = function(input) {
  if (input === undefined || input === null)
    input = ''

  var str = input.toString()
  return safe(str.replace(/\n/g, '<br />'))
}
