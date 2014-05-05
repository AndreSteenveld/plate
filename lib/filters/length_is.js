module.exports = function(input, expected, ready) {
  var tmp
  if(input) {
    if (typeof input.length === 'function') {
      tmp = input.length(function(err, len) {
        ready(err, err ? null : len === expected)
      })

      return tmp === undefined ? undefined : tmp === expected
    } else {
      return input.length === expected
    }
  }
  return 0 === expected
}
