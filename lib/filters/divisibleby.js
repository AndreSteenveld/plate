module.exports = function(input, num) {
  if (isNaN(parseInt(input)))
    throw new Error('Invalid input for divisibleby: ' + String(input))

  return input % parseInt(num, 10) == 0
}
