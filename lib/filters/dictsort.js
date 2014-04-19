module.exports = function(input, key) {
  if (input === undefined || input === null)
    input = []

  return input.sort(function(x, y) {
    if(x[key] > y[key]) return 1
    if(x[key] == y[key]) return 0
    if(x[key] < y[key]) return -1
  })
}
