module.exports = function(input) {
  var num = (new Number(input)).valueOf()
    , singular = num == 1 ? '' : 's'
    , value

  if (isNaN(num))
    num = 0

  value =
    num < 1024 ? num + ' byte'+singular :
    num < (1024*1024) ? (num/1024)+' KB' :
    num < (1024*1024*1024) ? (num / (1024*1024)) + ' MB' :
    num / (1024*1024*1024) + ' GB'

  return value
}
