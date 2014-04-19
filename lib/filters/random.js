module.exports = function(input) {
  if (!input)
    return null

  var cb = input.charAt || function(idx) {
    return this[idx];
  };

  return cb.call(input, Math.floor(Math.random() * input.length))
}
