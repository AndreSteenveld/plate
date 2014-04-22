module.exports = function(input, ready) {
  if(input) {
    if (typeof input.length === 'function') {
      return input.length(ready)
    } else {
      return input.length
    }
  }
  return 0
}
