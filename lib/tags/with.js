module.exports = WithNode

var Promise = require('../promise')

function WithNode(nodes, extra_context) {
  this.nodes = nodes
  this.extra_context = extra_context || {}
}

var cons = WithNode
  , proto = cons.prototype
  , kwarg_re = /(?:(\w+)=)?(.+)/

function token_kwargs(bits, parser) {
  var match
    , kwarg_format
    , kwargs
    , key
    , value

  if(!bits.length)
    return {}
  match = kwarg_re.exec(bits[0])
  kwarg_format = match && match[1]
  if(!kwarg_format)
    if(bits.length < 3 || bits[1] != 'as')
      return {}

  kwargs = {}
  while(bits.length) {
    if(kwarg_format) {
      match = kwarg_re.exec(bits[0])
      if(!match || !match[1]){
        return kwargs
      }
      key = match[1]
      value = match[2]
      bits.shift()
    } else {
      if(bits.length < 3 || bits[1] != 'as') {
        return kwargs
      }
      key = bits[2]
      value = bits[0]
      bits.splice(0, 3)
    }
    kwargs[key] = parser.compile(value)
    if(bits.length && !kwarg_format) {
      if(bits[0] != 'and') {
        return kwargs
      }
      bits.shift()
    }
  }
  return kwargs
}

cons.parse = function(contents, parser) {
  var bits = contents.split(/\s+/g)
    , nodelist = parser.parse(['endwith'])
    , has_context_vars = false
    , remaining_bits
    , extra_context


  remaining_bits = bits.slice(1)
  extra_context = token_kwargs(remaining_bits, parser)

  for(var context_var in extra_context)
    if(extra_context.hasOwnProperty(context_var)) {
      has_context_vars = true
      break
    }

  if (!has_context_vars)
      throw new Error('"'+bits[0]+'" expected at least one variable assignment')
  if (remaining_bits.length)
      throw new Error('"'+bits[0]+'" received an invalid token: "'+remaining_bits[0]+'"')

  parser.tokens.shift()
  return new cons(nodelist, extra_context)
}

proto.render = function(context) {
  var self = this
    , result
    , promise = new Promise
    , promises = 0
    , value

  context = context.copy()

  function promise_resolved(key) {
    return function(data) {
      context[key] = data;
      if (--promises === 0) {
        promise.resolve(self.nodes.render(context))
      }
    }
  }

  for(var key in self.extra_context) {
    if(self.extra_context.hasOwnProperty(key)) {
      value = self.extra_context[key].resolve(context)

      if(value && value.constructor === Promise) {
        promises++
        value.once('done', promise_resolved(key))
      }
      else {
        context[key] = value
      }
    }
  }

  if (promises)
    return promise
  else
    result = self.nodes.render(context)

  return result
}
