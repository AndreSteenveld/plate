module.exports = function(input) {
  if (!input)
    throw new Error('Invalid input for random: ' + String(input))

  var cb = input.charAt || function(idx) {
    return this[idx];
  };

  return cb.call(input, Math.floor(Math.random() * input.length))
}
