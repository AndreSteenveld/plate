module.exports = function(input) {
  if (input === undefined || input === null)
    return 0

  var str = input.toString()
    , bits = str.split(/\s+/g)

  return bits.length
}
