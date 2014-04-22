module.exports = function(input, value) {
  input = parseInt(input, 10);
  value = parseInt(value, 10)
  if(isNaN(input) || isNaN(value)) {
    return ''
  }
  return input + value
}
