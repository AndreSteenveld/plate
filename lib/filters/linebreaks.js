var safe = require('./safe')

module.exports = function(input) {
  if(input === undefined || input === null) {
    input = ''
  }

  var str = input.toString()
    , paras = str.split('\n\n')
    , out = []

  while(paras.length) {
    out.unshift(paras.pop().replace(/\n/g, '<br />'))
  }

  return safe('<p>'+out.join('</p><p>')+'</p>')
}
