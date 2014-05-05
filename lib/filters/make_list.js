module.exports = function(input) {
  if(input === undefined || input === null) {
    input = ''
  }

  input = input instanceof Array ? input : input.toString().split('')

  return input
}
