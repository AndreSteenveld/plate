(function(e){if("function"==typeof bootstrap)bootstrap("plate",e);else if("object"==typeof exports)module.exports=e();else if("function"==typeof define&&define.amd)define(e);else if("undefined"!=typeof ses){if(!ses.ok())return;ses.makePlate=e}else"undefined"!=typeof window?window.plate=e():global.plate=e()})(function(){var define,ses,bootstrap,module,exports;
return (function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
require('dst')

var plate = require('./lib/index')
if(typeof define !== 'undefined' && define.amd) {
  define('plate', [], function() { return plate })
} else {
  window.plate = plate
}

plate.debug = require('./lib/debug')
plate.utils = plate.date = require('./lib/date')
plate.utils.Promise = require('./lib/promise')
plate.utils.SafeString = function(str) {
  str = new String(str)
  str.safe = true
  return str
}
plate.libraries = require('./lib/libraries')

module.exports = plate

},{"./lib/date":5,"./lib/debug":6,"./lib/index":65,"./lib/libraries":66,"./lib/promise":71,"dst":92}],2:[function(require,module,exports){
module.exports = BlockContext

function BlockContext() {
  this.blocks = {}
}

var cons = BlockContext
  , proto = cons.prototype

cons.KEY = '__BLOCK_CONTEXT__'

cons.from = function(context) {
  return context[this.KEY]
}

cons.into = function(context) {
  return context[this.KEY] = new this()
}

proto.add = function(blocks) {
  for(var name in blocks) {
    (this.blocks[name] = this.blocks[name] || []).unshift(blocks[name])
  }
}

proto.get = function(name) {
  var list = this.blocks[name] || []

  return list[list.length - 1]
}

proto.push = function(name, block) {
  (this.blocks[name] = this.blocks[name] || []).push(block)
}

proto.pop = function(name) {
  return (this.blocks[name] = this.blocks[name] || []).pop()
}

},{}],3:[function(require,module,exports){
module.exports = CommentToken

var Token = require('./token')

function CommentToken(content, line) {
  Token.call(this, content, line)
}

var cons = CommentToken
  , proto = cons.prototype = new Token

proto.constructor = cons

proto.node = function(parser) {
  // no-operation
  return null
}


},{"./token":90}],4:[function(require,module,exports){
module.exports = Context

function Context(from) {
  if(from && from.constructor === Context) {
    return from
  }

  from = from || {}
  for(var key in from) if(from.hasOwnProperty(key)) {
    this[key] = from[key]
  }
}

var cons = Context
  , proto = cons.prototype

proto.copy = function() {
  var F = Function()
  F.name = cons.name
  F.prototype = this
  return new F
}

},{}],5:[function(require,module,exports){
module.exports = { time: time_format, date: format, DateFormat: DateFormat }

try { require('tz') } catch(e) { }

function capfirst (str) {
  return str.replace(/^(.{1})/, function(a, m) { return m.toUpperCase() })
}

function map (arr, iter) {
  var out = []
  for(var i = 0, len = arr.length; i < len; ++i)
    out.push(iter(arr[i], i, arr))
  return out
}

function reduce(arr, iter, start) {
  arr = arr.slice()
  if(start !== undefined)
    arr.unshift(start)

  if(arr.length === 0)
    throw new Error('reduce of empty array')

  if(arr.length === 1)
    return arr[0]

  var out = arr.slice()
    , item = arr.shift()

  do {
    item = iter(item, arr.shift())
  } while(arr.length)

  return item
}

function strtoarray(str) {
  var arr = []
  for(var i = 0, len = str.length; i < len; ++i)
    arr.push(str.charAt(i))
  return arr
}

var WEEKDAYS = [ 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday' ]
  , WEEKDAYS_ABBR = map(WEEKDAYS, function(x) { return strtoarray(x).slice(0, 3).join('') })
  , WEEKDAYS_REV = reduce(map(WEEKDAYS, function(x, i) { return [x, i] }), function(lhs, rhs) { lhs[rhs[0]] = rhs[1]; return lhs }, {})
  , MONTHS = [ 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december' ]
  , MONTHS_3 = map(MONTHS, function(x) { return strtoarray(x).slice(0, 3).join('') })
  , MONTHS_3_REV = reduce(map(MONTHS_3, function(x, i) { return [x, i] }), function(lhs, rhs) { lhs[rhs[0]] = rhs[1]; return lhs }, {})
  , MONTHS_AP = [
    'Jan.'
  , 'Feb.'
  , 'March'
  , 'April'
  , 'May'
  , 'June'
  , 'July'
  , 'Aug.'
  , 'Sept.'
  , 'Oct.'
  , 'Nov.'
  , 'Dec.'
  ]


var MONTHS_ALT = {
  1: 'January',
  2: 'February',
  3: 'March',
  4: 'April',
  5: 'May',
  6: 'June',
  7: 'July',
  8: 'August',
  9: 'September',
  10: 'October',
  11: 'November',
  12: 'December'
}

function Formatter(t) {
  this.data = t
}

Formatter.prototype.format = function(str) {
  var bits = strtoarray(str)
  , esc = false
  , out = []
  , bit

  while(bits.length) {
    bit = bits.shift()

    if(esc) {
      out.push(bit)
      esc = false
    } else if(bit === '\\') {
      esc = true
    } else if(this[bit]) {
      out.push(this[bit]())
    } else {
      out.push(bit)
    }
  }

  return out.join('')
}

function TimeFormat(t) {
  Formatter.call(this, t)
}

var proto = TimeFormat.prototype = new Formatter()

proto.a = function() {
  // 'a.m.' or 'p.m.'
  if (this.data.getHours() > 11)
    return 'p.m.'
  return 'a.m.'
}

proto.A = function() {
  // 'AM' or 'PM'
  if (this.data.getHours() > 11)
    return 'PM'
  return 'AM'
}

proto.f = function() {
  /*
  Time, in 12-hour hours and minutes, with minutes left off if they're
  zero.
  Examples: '1', '1:30', '2:05', '2'
  Proprietary extension.
  */
  if (this.data.getMinutes() == 0)
    return this.g()
  return this.g() + ":" + this.i()
}

proto.g = function() {
  // Hour, 12-hour format without leading zeros i.e. '1' to '12'
  var h = this.data.getHours()

  return this.data.getHours() % 12 || 12
}

proto.G = function() {
  // Hour, 24-hour format without leading zeros i.e. '0' to '23'
  return this.data.getHours()
}

proto.h = function() {
  // Hour, 12-hour format i.e. '01' to '12'
  return ('0'+this.g()).slice(-2)
}

proto.H = function() {
  // Hour, 24-hour format i.e. '00' to '23'
  return ('0'+this.G()).slice(-2)
}

proto.i = function() {
  // Minutes i.e. '00' to '59'
  return ('0' + this.data.getMinutes()).slice(-2)
}

proto.P = function() {
  /*
  Time, in 12-hour hours, minutes and 'a.m.'/'p.m.', with minutes left off
  if they're zero and the strings 'midnight' and 'noon' if appropriate.
  Examples: '1 a.m.', '1:30 p.m.', 'midnight', 'noon', '12:30 p.m.'
  Proprietary extension.
  */
  var m = this.data.getMinutes()
    , h = this.data.getHours()

  if (m == 0 && h == 0)
    return 'midnight'
  if (m == 0 && h == 12)
    return 'noon'
  return this.f() + " " + this.a()
}

proto.s = function() {
  // Seconds i.e. '00' to '59'
  return ('0'+this.data.getSeconds()).slice(-2)
}

proto.u = function() {
  // Microseconds
  return this.data.getMilliseconds()
}

// DateFormat

function DateFormat(t) {
  this.data = t
  this.year_days = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
}

proto = DateFormat.prototype = new TimeFormat()

proto.contructor = DateFormat

proto.b = function() {
  // Month, textual, 3 letters, lowercase e.g. 'jan'
  return MONTHS_3[this.data.getMonth()]
}

proto.c= function() {
  /*
  ISO 8601 Format
  Example : '2008-01-02T10:30:00.000123'
  */
  return this.data.toISOString ? this.data.toISOString() : ''
}

proto.d = function() {
  // Day of the month, 2 digits with leading zeros i.e. '01' to '31'
  return ('0'+this.data.getDate()).slice(-2)
}

proto.D = function() {
  // Day of the week, textual, 3 letters e.g. 'Fri'
  return capfirst(WEEKDAYS_ABBR[this.data.getDay()])
}

proto.E = function() {
  // Alternative month names as required by some locales. Proprietary extension.
  return MONTHS_ALT[this.data.getMonth()+1]
}

proto.F= function() {
  // Month, textual, long e.g. 'January'
  return capfirst(MONTHS[this.data.getMonth()])
}

proto.I = function() {
  // '1' if Daylight Savings Time, '0' otherwise.
  return this.data.isDST() ? '1' : '0'
}

proto.j = function() {
  // Day of the month without leading zeros i.e. '1' to '31'
  return this.data.getDate()
}

proto.l = function() {
  // Day of the week, textual, long e.g. 'Friday'
  return capfirst(WEEKDAYS[this.data.getDay()])
}

proto.L = function() {
  // Boolean for whether it is a leap year i.e. True or False
  // Selects this year's February 29th and checks if the month
  // is still February.
  return (new Date(this.data.getFullYear(), 1, 29).getMonth()) === 1
}

proto.m = function() {
  // Month i.e. '01' to '12'"
  return ('0'+(this.data.getMonth()+1)).slice(-2)
}

proto.M = function() {
  // Month, textual, 3 letters e.g. 'Jan'
  return capfirst(MONTHS_3[this.data.getMonth()])
}

proto.n = function() {
  // Month without leading zeros i.e. '1' to '12'
  return this.data.getMonth() + 1
}

proto.N = function() {
  // Month abbreviation in Associated Press style. Proprietary extension.
  return MONTHS_AP[this.data.getMonth()]
}

proto.O = function() {
  // Difference to Greenwich time in hours e.g. '+0200'

  var tzoffs = this.data.getTimezoneOffset()
    , offs = ~~(tzoffs / 60)
    , mins = ('00' + ~~Math.abs(tzoffs % 60)).slice(-2)

  return ((tzoffs > 0) ? '-' : '+') + ('00' + Math.abs(offs)).slice(-2) + mins
}

proto.r = function() {
  // RFC 2822 formatted date e.g. 'Thu, 21 Dec 2000 16:01:07 +0200'
  return this.format('D, j M Y H:i:s O')
}

proto.S = function() {
  /* English ordinal suffix for the day of the month, 2 characters i.e. 'st', 'nd', 'rd' or 'th' */
  var d = this.data.getDate()

  if (d >= 11 && d <= 13)
    return 'th'
  var last = d % 10

  if (last == 1)
    return 'st'
  if (last == 2)
    return 'nd'
  if (last == 3)
    return 'rd'
  return 'th'
}

proto.t = function() {
  // Number of days in the given month i.e. '28' to '31'
  // Use a javascript trick to determine the days in a month
  return 32 - new Date(this.data.getFullYear(), this.data.getMonth(), 32).getDate()
}

proto.T = function() {
  // Time zone of this machine e.g. 'EST' or 'MDT'
  if(this.data.tzinfo) {
    return this.data.tzinfo().abbr || '???'
  }
  return '???'
}

proto.U = function() {
  // Seconds since the Unix epoch (January 1 1970 00:00:00 GMT)
  // UTC() return milliseconds frmo the epoch
  // return Math.round(this.data.UTC() * 1000)
  return ~~(this.data / 1000)
}

proto.w = function() {
  // Day of the week, numeric, i.e. '0' (Sunday) to '6' (Saturday)
  return this.data.getDay()
}

proto.W = function() {
  // ISO-8601 week number of year, weeks starting on Monday
  // Algorithm from http://www.personal.ecu.edu/mccartyr/ISOwdALG.txt
  var jan1_weekday = new Date(this.data.getFullYear(), 0, 1).getDay()
    , weekday = this.data.getDay()
    , day_of_year = this.z()
    , week_number
    , i = 365

  if(day_of_year <= (8 - jan1_weekday) && jan1_weekday > 4) {
    if(jan1_weekday === 5 || (jan1_weekday === 6 && this.L.call({data:new Date(this.data.getFullYear()-1, 0, 1)}))) {
      week_number = 53
    } else {
      week_number = 52
    }
  } else {
    if(this.L()) {
      i = 366
    }
    if((i - day_of_year) < (4 - weekday)) {
      week_number = 1
    } else {
      week_number = ~~((day_of_year + (7 - weekday) + (jan1_weekday - 1)) / 7)
      if(jan1_weekday > 4)
        week_number -= 1
    }
  }
  return week_number
}

proto.y = function() {
  // Year, 2 digits e.g. '99'
  return (''+this.data.getFullYear()).slice(-2)
}

proto.Y = function() {
  // Year, 4 digits e.g. '1999'
  return this.data.getFullYear()
}

proto.z = function() {
  // Day of the year i.e. '0' to '365'

  doy = this.year_days[this.data.getMonth()] + this.data.getDate()
  if (this.L() && this.data.getMonth() > 1)
    doy += 1
  return doy
}

proto.Z = function() {
  /*
  Time zone offset in seconds (i.e. '-43200' to '43200'). The offset for
  timezones west of UTC is always negative, and for those east of UTC is
  always positive.
  */
  return this.data.getTimezoneOffset() * -60
}


function format(value, format_string) {
  var df = new DateFormat(value)
  return df.format(format_string)
}


function time_format(value, format_string) {
  var tf = new TimeFormat(value)
  return tf.format(format_string)
}

},{"tz":93}],6:[function(require,module,exports){
module.exports = {
    log: function(value) { console.log(value) }
  , error: function(err) { console.error(err, err && err.stack) }
  , info: function(value) { }
}

},{}],7:[function(require,module,exports){
var Library = require('./library')

module.exports = DefaultFilters

function DefaultFilters() {
  Library.call(this, this.builtins)
}

var cons = DefaultFilters
  , proto = cons.prototype = new Library

proto.constructor = cons

proto.builtins = {
    'add': require('./filters/add')
  , 'addslashes': require('./filters/addslashes')
  , 'capfirst': require('./filters/capfirst')
  , 'center': require('./filters/center')
  , 'cut': require('./filters/cut')
  , 'date': require('./filters/date')
  , 'default': require('./filters/default')
  , 'dictsort': require('./filters/dictsort')
  , 'dictsortreversed': require('./filters/dictsortreversed')
  , 'divisibleby': require('./filters/divisibleby')
  , 'escape': require('./filters/escape')
  , 'filesizeformat': require('./filters/filesizeformat')
  , 'first': require('./filters/first')
  , 'floatformat': require('./filters/floatformat')
  , 'force_escape': require('./filters/force_escape')
  , 'get_digit': require('./filters/get_digit')
  , 'index': require('./filters/index')
  , 'iteritems': require('./filters/iteritems')
  , 'iriencode': require('./filters/iriencode')
  , 'join': require('./filters/join')
  , 'last': require('./filters/last')
  , 'length': require('./filters/length')
  , 'length_is': require('./filters/length_is')
  , 'linebreaks': require('./filters/linebreaks')
  , 'linebreaksbr': require('./filters/linebreaksbr')
  , 'linenumbers': require('./filters/linenumbers')
  , 'ljust': require('./filters/ljust')
  , 'lower': require('./filters/lower')
  , 'make_list': require('./filters/make_list')
  , 'phone2numeric': require('./filters/phone2numeric')
  , 'pluralize': require('./filters/pluralize')
  , 'random': require('./filters/random')
  , 'rjust': require('./filters/rjust')
  , 'safe': require('./filters/safe')
  , 'slice': require('./filters/slice')
  , 'slugify': require('./filters/slugify')
  , 'split': require('./filters/split')
  , 'striptags': require('./filters/striptags')
  , 'timesince': require('./filters/timesince')
  , 'timeuntil': require('./filters/timeuntil')
  , 'title': require('./filters/title')
  , 'truncatechars': require('./filters/truncatechars')
  , 'truncatewords': require('./filters/truncatewords')
  , 'unordered_list': require('./filters/unordered_list')
  , 'upper': require('./filters/upper')
  , 'urlencode': require('./filters/urlencode')
  , 'urlize': require('./filters/urlize')
  , 'urlizetrunc': require('./filters/urlizetrunc')
  , 'wordcount': require('./filters/wordcount')
  , 'wordwrap': require('./filters/wordwrap')
  , 'yesno': require('./filters/yesno')
}


},{"./filters/add":14,"./filters/addslashes":15,"./filters/capfirst":16,"./filters/center":17,"./filters/cut":18,"./filters/date":19,"./filters/default":20,"./filters/dictsort":21,"./filters/dictsortreversed":22,"./filters/divisibleby":23,"./filters/escape":24,"./filters/filesizeformat":25,"./filters/first":26,"./filters/floatformat":27,"./filters/force_escape":28,"./filters/get_digit":29,"./filters/index":30,"./filters/iriencode":31,"./filters/iteritems":32,"./filters/join":33,"./filters/last":34,"./filters/length":35,"./filters/length_is":36,"./filters/linebreaks":37,"./filters/linebreaksbr":38,"./filters/linenumbers":39,"./filters/ljust":40,"./filters/lower":41,"./filters/make_list":42,"./filters/phone2numeric":43,"./filters/pluralize":44,"./filters/random":45,"./filters/rjust":46,"./filters/safe":47,"./filters/slice":48,"./filters/slugify":49,"./filters/split":50,"./filters/striptags":51,"./filters/timesince":52,"./filters/timeuntil":53,"./filters/title":54,"./filters/truncatechars":55,"./filters/truncatewords":56,"./filters/unordered_list":57,"./filters/upper":58,"./filters/urlencode":59,"./filters/urlize":60,"./filters/urlizetrunc":61,"./filters/wordcount":62,"./filters/wordwrap":63,"./filters/yesno":64,"./library":67}],8:[function(require,module,exports){
var Library = require('./library')

module.exports = DefaultTags

function DefaultTags() {
  Library.call(this, this.builtins)
}

var cons = DefaultTags
  , proto = cons.prototype = new Library

proto.constructor = cons

proto.builtins = {
    'block': require('./tags/block').parse
  , 'comment': require('./tags/comment').parse
  , 'debug': require('./tags/debug').parse
  , 'extends': require('./tags/extends').parse
  , 'for': require('./tags/for').parse
  , 'if': require('./tags/if/node').parse
  , 'include': require('./tags/include').parse
  , 'now': require('./tags/now').parse
  , 'with': require('./tags/with').parse
}

},{"./library":67,"./tags/block":73,"./tags/comment":74,"./tags/debug":75,"./tags/extends":76,"./tags/for":77,"./tags/if/node":81,"./tags/include":85,"./tags/now":86,"./tags/with":87}],9:[function(require,module,exports){
module.exports = FilterApplication

var Promise = require('./promise')

function FilterApplication(name, bits) {
  this.name = name
  this.args = bits
  this.filter = null
}

var cons = FilterApplication
  , proto = cons.prototype

proto.attach = function(parser) {
  this.filter = parser.filters.lookup(this.name)
}

proto.resolve = function(context, value, fromIDX, argValues) {
  var self = this
    , promise
    , start = fromIDX || 0
    , result
    , tmp

  argValues = argValues || []

  if(value && value.constructor === Promise) {
    promise = new Promise
    value.once('done', function(val) {
      promise.resolve(self.resolve(context, val))
    })

    // start over once we've resolved the base value
    return promise
  }

  for(var i = start, len = self.args.length; i < len; ++i) {
    var argValue = self.args[i].resolve ?
        self.args[i].resolve(context) :
        self.args[i]

    if(argValue === undefined || argValue === null) {
      argValues[i] = argValue
      continue
    }

    if(argValue.constructor === Promise) {
      promise = new Promise

      argValue.once('done', function(val) {
        argValues[i] = val
        promise.resolve(self.resolve(
            context
          , value
          , i
          , argValues
        ))
      })

      return promise
    }

    argValues[i] = argValue
  }

  promise = new Promise
  tmp = self.filter.apply(null, [value].concat(argValues).concat([ready]))

  if(tmp !== undefined) {
    result = tmp
  }

  if(result === undefined) {
    return promise
  }

  return result

  function ready(err, data) {
    if(promise.trigger)
      return promise.resolve(err ? err : data)

    result = data
  }
}

},{"./promise":71}],10:[function(require,module,exports){
module.exports = FilterChain

function FilterChain(bits) {
  this.bits = bits
}

var cons = FilterChain
  , proto = cons.prototype

proto.attach = function(parser) {
  for(var i = 0, len = this.bits.length; i < len; ++i) {
    if(this.bits[i] && this.bits[i].attach) {
      this.bits[i].attach(parser)
    }
  }
}

proto.resolve = function(context) {
  var result = this.bits[0].resolve ?
      this.bits[0].resolve(context) :
      this.bits[0]

  for(var i = 1, len = this.bits.length; i < len; ++i) {
    result = this.bits[i].resolve(context, result)
  }

  return result
}


},{}],11:[function(require,module,exports){
module.exports = FilterLookup

var Promise = require('./promise')

function FilterLookup(bits) {
  this.bits = bits
}

var cons = FilterLookup
  , proto = cons.prototype

proto.resolve = function(context, fromIDX) {
  fromIDX = fromIDX || 0

  var self = this
    , bits = self.bits
    , current = context
    , temporary = null
    , promise
    , result
    , next

  for(var i = fromIDX, len = bits.length; i < len; ++i) {
    if(current === undefined || current === null) {
      break
    }

    // fix for IE:
    if(bits[i] === 'super') {
      bits[i] = '_super'
    }

    next = current[bits[i]]

    // could be async, could be sync.
    if(typeof next === 'function') {
      promise = new Promise

      promise.once('done', function(data) {
        temporary = data
      })

      current = next.call(current, function(err, data) {
        promise.resolve(err ? null : self.resolve(data, i+1))
      })

      if(temporary !== null)
        current = temporary

      promise.trigger = temporary = null

      if(current === undefined)
        return promise

    } else {
      current = next
    }

  }

  return current
}

},{"./promise":71}],12:[function(require,module,exports){
module.exports = FilterNode

var Promise = require('./promise')
  , debug = require('./debug')

function FilterNode(filter) {
  this.filter = filter
}

var cons = FilterNode
  , proto = cons.prototype

cons.escape = escapeHTML

proto.render = safely(function(context) {
  var self = this
    , result = self.filter.resolve(context)
    , promise

  if(result === undefined)
    return ''

  if(result && result.constructor === Promise) {
    promise = new Promise

    result.once('done', function(result) {
      promise.resolve(self.format(result))
    })

    return promise
  }

  return self.format(result)
})

proto.format = function(result) {
  if(result && result.safe) {
    return result.toString()
  }

  if(result === null || result === undefined)
    return ''

  return escapeHTML(result+'')
}

function safely(fn) {
  return function(context) {
    try {
      return fn.call(this, context)
    } catch(err) {
      debug.info(err)
      return ''
    }
  }
}

function escapeHTML(str) {
  return str
    .replace(/\&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

},{"./debug":6,"./promise":71}],13:[function(require,module,exports){
var Token = require('./token')
  , FilterNode = require('./filter_node')

module.exports = FilterToken

function FilterToken(content, line) {
  Token.call(this, content, line)
}

var cons = FilterToken
  , proto = cons.prototype = new Token

proto.constructor = cons

proto.node = function(parser) {
  return new FilterNode(parser.compile(this.content))
}


},{"./filter_node":12,"./token":90}],14:[function(require,module,exports){
module.exports = function(input, value) {
  input = parseInt(input, 10);
  value = parseInt(value, 10)
  if (isNaN(input) || isNaN(value))
    return ''
  return input + value
}

},{}],15:[function(require,module,exports){
module.exports = function(input) {
  if (input === undefined || input === null)
    input = ''
  return input.toString().replace(/'/g, "\\'")
}

},{}],16:[function(require,module,exports){
module.exports = function(input) {
  var str = input.toString();
  return [str.slice(0,1).toUpperCase(), str.slice(1)].join('')
}

},{}],17:[function(require,module,exports){
module.exports = function(input, len, ready) {
  if (input === undefined || input === null)
    input = ''

  if(ready === undefined)
    len = 0

  var str = input.toString()
    , value = ' '

  len -= str.length
  if(len < 0) {
    return str
  }

  var len_half = len/2.0
    , arr = []
    , idx = Math.floor(len_half)

  while(idx-- > 0) {
    arr.push(value)
  }

  arr = arr.join('')
  str = arr + str + arr
  if((len_half - Math.floor(len_half)) > 0) {
    str = input.toString().length % 2 == 0 ? value + str : str + value
  }

  return str
}

},{}],18:[function(require,module,exports){
module.exports = function(input, value) {
  var str = input.toString()
  return str.replace(new RegExp(value, "g"), '')
}

},{}],19:[function(require,module,exports){
var format = require('../date').date

module.exports = function(input, value, ready) {
  if (ready === undefined)
    value = 'N j, Y'

  return format(input.getFullYear ? input : new Date(input), value)
}

},{"../date":5}],20:[function(require,module,exports){
module.exports = function(input, def, ready) {
  return input ? input : def
}

},{}],21:[function(require,module,exports){
module.exports = function(input, key) {
  if (input === undefined || input === null)
    input = []

  return input.sort(function(x, y) {
    if(x[key] > y[key]) return 1
    if(x[key] == y[key]) return 0
    if(x[key] < y[key]) return -1
  })
}

},{}],22:[function(require,module,exports){
var dictsort = require('./dictsort');

module.exports = function(input, key) {
  return dictsort(input, key).reverse()
}

},{"./dictsort":21}],23:[function(require,module,exports){
module.exports = function(input, num) {
  if (isNaN(parseInt(input)))
    throw new Error('Invalid input for divisibleby: ' + String(input))

  return input % parseInt(num, 10) == 0
}

},{}],24:[function(require,module,exports){
var FilterNode = require('../filter_node')

module.exports = function(input) {
  if (input === undefined) {
    input = ''
  }

  if(input && input.safe) {
    return input
  }

  input = new String(FilterNode.escape(input))
  input.safe = true
  return input
}

},{"../filter_node":12}],25:[function(require,module,exports){
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

},{}],26:[function(require,module,exports){
module.exports = function(input) {
  return input[0]
}

},{}],27:[function(require,module,exports){
module.exports = function(input, val) {
  val = parseInt(val, 10)
  val = isNaN(val) ? -1 : val

  var isPositive = val >= 0
    , asNumber = parseFloat(input)
    , absValue = Math.abs(val)
    , pow = Math.pow(10, absValue)
    , pow_minus_one = Math.pow(10, Math.max(absValue-1, 0))
    , asString

  if (isNaN(asNumber))
    return ''

  asNumber = Math.round((pow * asNumber) / pow_minus_one)

  if(val !== 0)
    asNumber /= 10

  asString = asNumber.toString()

  if(isPositive) {
    var split = asString.split('.')
      , decimal = split.length > 1 ? split[1] : ''

    while(decimal.length < val) {
      decimal += '0'
    }

    asString = decimal.length ? [split[0], decimal].join('.') : split[0]
  }

  return asString
}

},{}],28:[function(require,module,exports){
var FilterNode = require('../filter_node')

module.exports = function(input) {
  if (input === undefined)
    input = ''

  var x = new String(FilterNode.escape(input+''))
  x.safe = true
  return x
}

},{"../filter_node":12}],29:[function(require,module,exports){
module.exports = function(input, digit) {
  var isNum = !isNaN(parseInt(input, 10))
    , str = input.toString()
    , len = str.split('').length

  digit = parseInt(digit, 10)
  if(isNum && !isNaN(digit) && digit <= len) {
    return str.charAt(len - digit)
  }

  return input
}

},{}],30:[function(require,module,exports){

},{}],31:[function(require,module,exports){
module.exports = function(input) {
  return input
}

},{}],32:[function(require,module,exports){
module.exports = function(input) {
  var output = []
  for(var name in input) if(input.hasOwnProperty(name)) {
    output.push([name, input[name]])
  }
  return output
}

},{}],33:[function(require,module,exports){
module.exports = function(input, glue) {
  input = input instanceof Array ? input : input.toString().split('')
  return input.join(glue)
}

},{}],34:[function(require,module,exports){
module.exports = function(input) {
  var cb = input.charAt || function(ind) { return input[ind]; }

  return cb.call(input, input.length-1);
}

},{}],35:[function(require,module,exports){
module.exports = function(input, ready) {
  if(input) {
    if (typeof input.length === 'function') {
      return input.length(ready)
    }
    else {
      return input.length
    }
  }
  return 0
}

},{}],36:[function(require,module,exports){
module.exports = function(input, expected, ready) {
  var tmp
  if(input) {
    if (typeof input.length === 'function') {
      tmp = input.length(function(err, len) {
        ready(err, err ? null : len === expected)
      })

      return tmp === undefined ? undefined : tmp === expected
    }
    else {
      return input.length === expected
    }
  }
  return 0 === expected
}

},{}],37:[function(require,module,exports){
var safe = require('./safe')

module.exports = function(input) {
  if (input === undefined || input === null)
    input = ''

  var str = input.toString()
    , paras = str.split('\n\n')
    , out = []

  while(paras.length) {
    out.unshift(paras.pop().replace(/\n/g, '<br />'))
  }

  return safe('<p>'+out.join('</p><p>')+'</p>')
}

},{"./safe":47}],38:[function(require,module,exports){
var safe = require('./safe')

module.exports = function(input) {
  if (input === undefined || input === null)
    input = ''

  var str = input.toString()
  return safe(str.replace(/\n/g, '<br />'))
}

},{"./safe":47}],39:[function(require,module,exports){
module.exports = function(input) {
  if (input === undefined || input === null)
    input = ''

  var str = input.toString()
    , bits = str.split('\n')
    , out = []
    , len = bits.length

  while(bits.length) {
    out.unshift(len - out.length + '. ' + bits.pop())
  }

  return out.join('\n')
}

},{}],40:[function(require,module,exports){
module.exports = function(input, num) {
  var bits = (input === null || input === undefined ? '' : input).toString().split('')
    , difference = num - bits.length

  // push returns new length of array.
  while(difference > 0) {
    difference = num - bits.push(' ')
  }

  return bits.join('')
}

},{}],41:[function(require,module,exports){
module.exports = function(input) {
  return input.toString().toLowerCase()
}

},{}],42:[function(require,module,exports){
module.exports = function(input) {
  if (input === undefined || input === null)
    input = ''

  input = input instanceof Array ? input : input.toString().split('')

  return input
}

},{}],43:[function(require,module,exports){

var LETTERS = {
'a': '2', 'b': '2', 'c': '2', 'd': '3', 'e': '3',
'f': '3', 'g': '4', 'h': '4', 'i': '4', 'j': '5', 'k': '5', 'l': '5',
'm': '6', 'n': '6', 'o': '6', 'p': '7', 'q': '7', 'r': '7', 's': '7',
't': '8', 'u': '8', 'v': '8', 'w': '9', 'x': '9', 'y': '9', 'z': '9'
};

module.exports = function(input) {
  var str = input.toString().toLowerCase().split('')
    , out = []
    , ltr

  while(str.length) {
    ltr = str.pop()
    out.unshift(LETTERS[ltr] ? LETTERS[ltr] : ltr)
  }

  return out.join('')
}

},{}],44:[function(require,module,exports){
module.exports = function(input, plural) {
  plural = (typeof plural === 'string' ? plural : 's').split(',')

  var val = Number(input)
    , suffix

  if (isNaN(val))
    val = 1

  suffix = plural[plural.length-1];
  if(val === 1) {
    suffix = plural.length > 1 ? plural[0] : '';
  }

  return suffix
}

},{}],45:[function(require,module,exports){
module.exports = function(input) {
  if (!input)
    return null

  var cb = input.charAt || function(idx) {
    return this[idx];
  };

  return cb.call(input, Math.floor(Math.random() * input.length))
}

},{}],46:[function(require,module,exports){
module.exports = function(input, num) {
  var bits = (input === null || input === undefined ? '' : input).toString().split('')
    , difference = num - bits.length

  // push returns new length of array.
  // NB: [].unshift returns `undefined` in IE<9.
  while(difference > 0) {
    difference = (bits.unshift(' '), num - bits.length)
  }

  return bits.join('')
}

},{}],47:[function(require,module,exports){
var FilterNode = require('../filter_node')

module.exports = function(input) {
  if (input === undefined)
    input = ''

  input = new String(input)
  input.safe = true
  return input
}

},{"../filter_node":12}],48:[function(require,module,exports){
module.exports = function(input, by) {
  if (input === undefined || input === null)
    input = []

  by = by.toString()
  if(by.charAt(0) === ':') {
    by = '0'+by
  }

  if(by.charAt(by.length-1) === ':') {
    by = by.slice(0, -1)
  }

  var splitBy = by.split(':')
    , slice = input.slice || (function() {
        input = this.toString()
        return input.slice
      })()

  return slice.apply(input, splitBy)
}

},{}],49:[function(require,module,exports){
module.exports = function(input) {
  input = input.toString()
  return input
        .replace(/[^\w\s\d\-]/g, '')
        .replace(/^\s*/, '')
        .replace(/\s*$/, '')
        .replace(/[\-\s]+/g, '-')
        .toLowerCase()
}

},{}],50:[function(require,module,exports){
module.exports = function(input, by, ready) {
  by = arguments.length === 2 ? ',' : by
  input = ''+input
  return input.split(by)
}

},{}],51:[function(require,module,exports){
module.exports = function(input) {
  var str = input.toString()
  return str.replace(/<[^>]*?>/g, '')
}

},{}],52:[function(require,module,exports){
module.exports = function(input, n, ready) {
  var input = new Date(input)
    , now   = ready === undefined ? new Date() : new Date(n)
    , diff  = input - now
    , since = Math.abs(diff)

  if(diff > 0)
    return '0 minutes'

  // 365.25 * 24 * 60 * 60 * 1000 === years
  var years =   ~~(since / 31557600000)
    , months =  ~~((since - (years*31557600000)) / 2592000000)
    , days =    ~~((since - (years * 31557600000 + months * 2592000000)) / 86400000)
    , hours =   ~~((since - (years * 31557600000 + months * 2592000000 + days * 86400000)) / 3600000)
    , minutes = ~~((since - (years * 31557600000 + months * 2592000000 + days * 86400000 + hours * 3600000)) / 60000)
    , result = [
        years   ? pluralize(years,    'year') : null
      , months  ? pluralize(months,   'month') : null
      , days    ? pluralize(days,     'day') : null
      , hours   ? pluralize(hours,    'hour') : null
      , minutes ? pluralize(minutes,  'minute') : null
    ]
    , out = []

  for(var i = 0, len = result.length; i < len; ++i) {
    result[i] !== null && out.push(result[i])
  }

  if(!out.length) {
    return '0 minutes'
  }

  return out[0] + (out[1] ? ', ' + out[1] : '')

  function pluralize(x, str) {
    return x + ' ' + str + (x === 1 ? '' : 's')
  }
}

},{}],53:[function(require,module,exports){
var timesince = require('./timesince').timesince

module.exports = function(input, n) {
  var now = n ? new Date(n) : new Date()
  return timesince(now, input)
}

},{"./timesince":52}],54:[function(require,module,exports){
module.exports = function(input) {
  var str = input.toString()
    , bits = str.split(/\s{1}/g)
    , out = []

  while(bits.length) {
    var word = bits.shift()
    word = word.charAt(0).toUpperCase() + word.slice(1)
    out.push(word)
  }

  out = out.join(' ')
  return out.replace(/([a-z])'([A-Z])/g, function(a, m, x) { return x.toLowerCase() })
}

},{}],55:[function(require,module,exports){
module.exports = function(input, n) {
  var str = input.toString()
    , num = parseInt(n, 10)

  if(isNaN(num))
    return input

  if(input.length <= num)
    return input

  return input.slice(0, num)+'...'
}

},{}],56:[function(require,module,exports){
module.exports = function(input, n) {
  var str = input.toString()
    , num = parseInt(n, 10)
    , words

  if(isNaN(num))
    return input

  words = input.split(/\s+/)

  if(words.length <= num)
    return input

  return words.slice(0, num).join(' ')+'...'
}

},{}],57:[function(require,module,exports){
var safe = require('./safe');

var ulparser = function(list) {
  var out = []
    , l = list.slice()
    , item

  while(l.length) {
    item = l.pop()

    if(item instanceof Array)
      out.unshift('<ul>'+ulparser(item)+'</ul>')
    else
      out.unshift('</li><li>'+item)
  }

  // get rid of the leading </li>, if any. add trailing </li>.
  return out.join('').replace(/^<\/li>/, '') + '</li>'
}

module.exports = function(input) {
  return input instanceof Array ?
    safe(ulparser(input)) :
    input
}

},{"./safe":47}],58:[function(require,module,exports){
module.exports = function(input) {
  return input.toString().toUpperCase()
}

},{}],59:[function(require,module,exports){
module.exports = function(input) {
  return escape(input.toString())
}

},{}],60:[function(require,module,exports){
var safe = require('./safe')
var url_finder = require('../url_finder')

module.exports = function(input) {
  return safe(url_finder(input, function() {
    return '<a href="'+arguments[0]+'">'+arguments[0]+'</a>';
  }))
}

},{"../url_finder":91,"./safe":47}],61:[function(require,module,exports){
var safe = require('./safe')
var url_finder = require('../url_finder')

module.exports = function(input, len) {
  len = parseInt(len, 10) || 1000
  return safe(url_finder(input, function() {
    var ltr = arguments[0].length > len ? arguments[0].slice(0, len) + '...' : arguments[0];
    return '<a href="'+arguments[0]+'">'+ltr+'</a>';
  }))
}

},{"../url_finder":91,"./safe":47}],62:[function(require,module,exports){
module.exports = function(input) {
  if (input === undefined || input === null)
    return 0

  var str = input.toString()
    , bits = str.split(/\s+/g)

  return bits.length
}

},{}],63:[function(require,module,exports){
module.exports = function(input, len) {
  var words = input.toString().split(/\s+/g)
    , out = []
    , len = parseInt(len, 10) || words.length

  while(words.length) {
    out.unshift(words.splice(0, len).join(' '))
  }

  return out.join('\n')
}

},{}],64:[function(require,module,exports){
module.exports = function(input, map) {
  if (input === undefined)
    input = false

  var ourMap = map.toString().split(',')
    , value

  ourMap.length < 3 && ourMap.push(ourMap[1])

  value = ourMap[
    input ? 0 :
    input === false ? 1 :
    2
  ]

  return value
}

},{}],65:[function(require,module,exports){
var global=self;var FilterToken = require('./filter_token')
  , TagToken = require('./tag_token')
  , CommentToken = require('./comment_token')
  , TextToken = require('./text_token')
  , libraries = require('./libraries')
  , Parser = require('./parser')
  , Context = require('./context')
  , Meta = require('./meta')
  , Promise = require('./promise')

module.exports = Template

// circular alias to support old
// versions of plate.
Template.Template = Template
Template.Context = Context

var later = typeof global !== 'undefined' ?
    function(fn) { global.setTimeout(fn, 0) } :
    function(fn) { this.setTimeout(fn, 0) }

function Template(raw, libraries, parser) {
  if(typeof raw !== 'string') {
    throw new TypeError('input should be a string')
  }

  this.raw = raw

  libraries = libraries || {}

  this.tagLibrary =
    libraries.tag_library || Template.Meta.createTagLibrary()

  this.filterLibrary =
    libraries.filter_library || Template.Meta.createFilterLibrary()

  this.pluginLibrary =
    libraries.plugin_library || Template.Meta.createPluginLibrary()

  this.parser = parser || Parser

  this.tokens = null
}

var cons = Template
  , proto = cons.prototype
  , meta = cons.Meta = new Meta

cons.createPluginLibrary = function() {
  return new libraries.DefaultPluginLibrary()
}

proto.getNodeList = function() {
  this.nodelist = this.nodelist || this.parse()

  return this.nodelist
}

proto.parse = function() {
  var parser

  this.tokens = this.tokens || cons.tokenize(this.raw)

  parser = new this.parser(
      this.tokens
    , this.tagLibrary
    , this.filterLibrary
    , this.pluginLibrary
    , this
  )

  return parser.parse()
}

proto.render = protect(function(context, ready) {
  context = new Context(context)

  var result

  result =
  this
    .getNodeList()
    .render(context)

  if(result.constructor === Promise) {
    result.once('done', function(data) {
      ready(null, data)
    })
  } else {
    later(function() {
      ready(null, result)
    }, 0)
  }

})

function protect(fn) {
  return function(context, ready) {
    if(!context || !ready) {
      throw new TypeError()
    }

    try {
      return fn.call(this, context, ready)
    } catch(e) {
      later(function() {
        ready(e, null)
      }, 0)
    }
  }
}

cons.MATCH_RE = /\{[%#\{](.*?)[\}#%]\}/

cons.tokenize = function(content) {
  var match = null
    , tokens = []
    , lineNo = 1
    , incLineNo = function(str) { lineNo += str.split('\n').length }
    , map = {
          '%': TagToken
        , '#': CommentToken
        , '{': FilterToken
      }
    , rex = this.MATCH_RE
    , literal

  do {
    match = rex.exec(content)
    if(!match)
      continue

    literal = content.slice(0, match.index)
    incLineNo(literal)
    if(match.index)
      tokens.push(new TextToken(literal.slice(0, match.index, lineNo)))

    match[1] = match[1]
      .replace(/^\s+/, '')
      .replace(/\s+$/, '')

    tokens.push(new map[match[0].charAt(1)](match[1], lineNo))

    content = content.slice(match.index + match[0].length)
  } while(content.length && match)

  tokens.push(new TextToken(content))

  return tokens
}

},{"./comment_token":3,"./context":4,"./filter_token":13,"./libraries":66,"./meta":68,"./parser":70,"./promise":71,"./tag_token":72,"./text_token":89}],66:[function(require,module,exports){
module.exports = {
    Library: require('./library')
  , DefaultPluginLibrary: require('./library')
  , DefaultTagLibrary: require('./defaulttags')
  , DefaultFilterLibrary: require('./defaultfilters')
}

},{"./defaultfilters":7,"./defaulttags":8,"./library":67}],67:[function(require,module,exports){
module.exports = Library

var Promise = require('./promise')

function Library(lib) {
  this.registry = lib || {}
}

var cons = Library
  , proto = cons.prototype

proto.lookup = errorOnNull(function(name) {
  var out = this.registry[name] || null

  if(typeof out === 'function' && out.length === 2 && name === 'loader') {
    out = Promise.toPromise(out)
  }

  return out
}, "Could not find {0}!")

proto.register = errorOnNull(function(name, item) {
  if(this.registry[name])
    return null

  this.registry[name] = item
}, "{0} is already registered!")


function errorOnNull(fn, msg) {
  return function() {
    var result = fn.call(this, arguments[0], arguments[1])
      , args = arguments

    if(result === null)
      throw new Error(msg.replace(/\{(\d+?)\}/g, function(a, m) {
        return args[+m]
      }))

    return result
  }
}


},{"./promise":71}],68:[function(require,module,exports){
var libraries = require('./libraries')

module.exports = Meta

function Meta() {
  this._autoregister = {
      plugin: {}
    , tag: {}
    , filter: {}
  }

  this._cache = {}

  this._classes = {
      filter: libraries.DefaultFilterLibrary
    , plugin: libraries.DefaultPluginLibrary
    , tag: libraries.DefaultTagLibrary
  }
}

var cons = Meta
  , proto = cons.prototype

proto.createPluginLibrary = createLibrary('plugin')
proto.createFilterLibrary = createLibrary('filter')
proto.createTagLibrary = createLibrary('tag')

proto.registerPlugin = createAutoregister('plugin')
proto.registerFilter = createAutoregister('filter')
proto.registerTag = createAutoregister('tag')

function createAutoregister(name) {
  return function(key, item) {
    if(this._cache[name])
      this._cache[name].register(key, item);
    else
      this._autoregister[name][key] = item;
  }
}

function createLibrary(name) {
  return function() {
    if(this._cache[name])
      return this._cache[name];

    var lib = new this._classes[name]

    for(var key in this._autoregister[name]) {
      lib.register(key, this._autoregister[name][key])
    }

    this._cache[name] = lib
    return lib
  }
}


},{"./libraries":66}],69:[function(require,module,exports){
module.exports = NodeList

var Promise = require('./promise')

function NodeList(nodes) {
  this.nodes = nodes
}

var cons = NodeList
  , proto = cons.prototype

proto.render = function(context) {
  var promises = []
    , results = []
    , nodes = this.nodes
    , result

  for(var i = 0, len = nodes.length; i < len; ++i) {
    results[i] = result = nodes[i].render(context)

    if(result.constructor === Promise) {
      promises.push(result)
    }
  }

  if(promises.length) {
    return this.resolvePromises(results, promises)
  }

  return results.join('')
}

proto.resolvePromises = function(results, promises) {
  var self = this
    , promise = new Promise
    , total = promises.length

  for(var i = 0, p = 0, len = results.length; i < len; ++i) {
    if(results[i].constructor !== Promise)
      continue

    promises[p++].once('done', bind(i, function(idx, result) {
      results[idx] = result

      if(!--total)
        promise.resolve(results.join(''))
    }))
  }

  return promise
}

function bind(num, fn) {
  return function(result) {
    return fn(num, result)
  }
}

},{"./promise":71}],70:[function(require,module,exports){
module.exports = Parser

var NodeList = require('./node_list')

var FilterApplication = require('./filter_application')
  , FilterLookup = require('./filter_lookup')
  , FilterChain = require('./filter_chain')
  , TagToken = require('./tag_token')

function Parser(tokens, tags, filters, plugins) {
  this.tokens = tokens
  this.tags = tags
  this.filters = filters
  this.plugins = plugins

  // for use with extends / block tags
  this.loadedBlocks = []
}

var cons = Parser
  , proto = cons.prototype

proto.cache = {}

proto.parse = function(until) {
  var okay = !until
    , token = null
    , output = []
    , node

  while(this.tokens.length > 0) {
    token = this.tokens.shift()

    if(until && token.is(until) && token.constructor === TagToken) {
      this.tokens.unshift(token)
      okay = true

      break
    }

    if(node = token.node(this)) {
      output.push(node)
    }
  }

  if(!okay) {
    throw new Error('expected one of ' + until)
  }

  return new NodeList(output)
}

proto.compileNumber = function(content, idx, output) {
  var decimal = content.charAt(idx) === '.'
    , bits = decimal ? ['0.'] : []
    , parse
    , c

  do {
    c = content.charAt(idx)

    if(c === '.') {
      if(decimal) {
        break
      }

      decimal = true
      bits.push('.')
    } else if(/\d/.test(c)) {
      bits.push(c)
    }
  } while(++idx < content.length)

  parse = decimal ? parseFloat : parseInt
  output.push(parse(bits.join(''), 10))

  return idx
}

proto.compileString = function(content, idx, output) {
  var type = content.charAt(idx)
    , escaped = false
    , bits = []
    , c

  ++idx

  do {
    c = content.charAt(idx)

    if(!escaped) {
      if(c === '\\') {
        escaped = true

        continue
      }

      if(c === type) {
        break
      }

      bits.push(c)
    } else {
      if(!/['"\\]/.test(c)) {
        bits.push('\\')
      }

      bits.push(c)
      escaped = false
    }

  } while(++idx < content.length)

  output.push(bits.join(''))

  return idx
}

proto.compileName = function(content, idx, output) {
  var out = []
    , c

  do {
    c = content.charAt(idx)

    if(/[^\w\d\_]/.test(c)) {
      break
    }

    out.push(c)
  } while(++idx < content.length)

  output.push(out.join(''))

  return idx
}

proto.compileFilter = function(content, idx, output) {
  var filterName
    , oldLen
    , bits

  ++idx

  idx = this.compileName(content, idx, output)
  filterName = output.pop()

  if(content.charAt(idx) !== ':') {
    output.push(new FilterApplication(filterName, []))

    return idx - 1
  }

  ++idx

  oldLen = output.length
  idx = this.compileFull(content, idx, output, true)
  bits = output.splice(oldLen, output.length - oldLen)

  output.push(new FilterApplication(filterName, bits))

  return idx
}

proto.compileLookup = function(content, idx, output) {
  var bits = []

  do {
    idx = this.compileName(content, idx, output)
    bits.push(output.pop())

    if(content.charAt(idx) !== '.') {
      break
    }
  } while(++idx < content.length)

  output.push(new FilterLookup(bits))

  return idx - 1
}

proto.compileFull = function(content, idx, output, omitPipe) {
  var c

  output = output || []
  idx = idx || 0
  // something|filtername[:arg, arg]
  // "quotes"
  // 1
  // 1.2
  // true | false
  // swallow leading whitespace.

  while(/\s/.test(content.charAt(idx))) {
    ++idx
  }

  do {
    c = content.charAt(idx)

    if(/[,\s]/.test(c)) {
      break
    }

    if(omitPipe && c === '|') {
      --idx

      break
    }

    switch(true) {
      case /[\d\.]/.test(c):
        idx = this.compileNumber(content, idx, output)
        break
      case /['"]/.test(c):
        idx = this.compileString(content, idx, output)
        break
      case c === '|':
        idx = this.compileFilter(content, idx, output)
        break
      default:
        idx = this.compileLookup(content, idx, output)
        break
    }
  } while(++idx < content.length)

  return idx
}

proto.compile = function(content) {
  var output = []

  if(this.cache[content]) {
    return this.cache[content]
  }

  this.compileFull(content, 0, output)

  output = this.cache[content] = new FilterChain(output, this)
  output.attach(this)

  return output
}

},{"./filter_application":9,"./filter_chain":10,"./filter_lookup":11,"./node_list":69,"./tag_token":72}],71:[function(require,module,exports){
module.exports = Promise

function Promise() {
  this.trigger = null
}

var cons = Promise
  , proto = cons.prototype

proto.resolve = function(value) {
  var trigger = this.trigger

  if(!value || value.constructor !== cons) {
    return trigger(value)
  }

  value.once('done', trigger)
}

proto.once = function(ev, fn) {
  this.trigger = fn
}

cons.toPromise = function(fn) {
  return function promisified() {
    var args = [].slice.call(arguments)
      , promise = new cons
      , self = this

    args.push(onready)

    setTimeout(bang, 0)

    return promise

    function bang() {
      fn.apply(self, args)
    }

    function onready(err, data) {
      promise.resolve(data)
    }
  }
}

},{}],72:[function(require,module,exports){
module.exports = TagToken

var Token = require('./token')

function TagToken(content, line) {
  Token.call(this, content, line)
}

var cons = TagToken
  , proto = cons.prototype = new Token

proto.constructor = cons

proto.node = function(parser) {
  var tag = parser.tags.lookup(this.name)

  return tag(this.content, parser)
}

},{"./token":90}],73:[function(require,module,exports){
module.exports = BlockNode

var Promise = require('../promise')
  , BlockContext = require('../block_context')

function BlockNode(name, nodes) {
  this.name = name
  this.nodes = nodes

  this.context = null
}

var cons = BlockNode
  , proto = cons.prototype

proto.render = function(context) {
  var self = this
    , blockContext = BlockContext.from(context)
    , result
    , block
    , push

  if(!blockContext) {
    context.block = self
    return self.nodes.render(context)
  }

  block = push = blockContext.pop(self.name)

  if(!block) {
    block = self
  }

  block = new BlockNode(block.name, block.nodes)

  block.context = context
  block.context.block = block
  context.block = block

  result = block.nodes.render(context)

  if(push) {
    blockContext.push(self.name, push)
  }

  return result

}

proto.isBlockNode = true

proto._super = function() {
  var blockContext = BlockContext.from(this.context)
    , block
    , str

  if(blockContext && (block = blockContext.get(this.name))) {
    str = new String(block.render(this.context))
    str.safe = true
    return str
  }

  return ''
}

cons.parse = function(contents, parser) {
  var bits = contents.split(' ')
    , name = bits[1]
    , loaded = parser.loadedBlocks
    , nodes

  for(var i = 0, len = loaded.length; i < len; ++i)
    if(loaded[i] === name)
      throw new Error('block tag with the name "'+name+'" appears more than once')

  loaded.push(name)

  nodes = parser.parse(['endblock'])
  parser.tokens.shift()

  return new cons(name, nodes)
}

},{"../block_context":2,"../promise":71}],74:[function(require,module,exports){
module.exports = CommentNode

function CommentNode() {
  // no-op.
}

var cons = CommentNode
  , proto = cons.prototype

proto.render = function(context) {
  return ''
}

cons.parse = function(contents, parser) {
  nl = parser.parse(['endcomment'])
  parser.tokens.shift()

  return new cons
}

},{}],75:[function(require,module,exports){
module.exports = DebugNode

var Promise = require('../promise')
  , Context = require('../context')
  , debug = require('../debug')

function DebugNode(varname) {
  this.varname = varname
}

var cons = DebugNode
  , proto = cons.prototype

proto.render = function(context, value) {
  var self = this
    , target = context
    , promise

  if(self.varname !== null) {
    value = arguments.length === 2 ? value : self.varname.resolve(context)
    if(value && value.constructor === Promise) {
      promise = new Promise
      value.once('done', function(data) {
        promise.resolve(self.render(context, data))
      })
      return promise
    }
    target = value
  }

  if(target === context) {
    while(target !== Context.prototype) {
      debug.log(target)
      target = Object.getPrototypeOf(target)
    }
    return ''
  }
  debug.log(target)
  return ''
}

cons.parse = function(contents, parser) {
  var bits = contents.split(' ')

  return new DebugNode(bits[1] ? parser.compile(bits[1]) : null)
}


},{"../context":4,"../debug":6,"../promise":71}],76:[function(require,module,exports){
module.exports = ExtendsNode

var Promise = require('../promise')
  , BlockContext = require('../block_context')


function ExtendsNode(parent, nodes, loader) {
  this.parent = parent
  this.loader = loader

  this.blocks = {}

  for(var i = 0, len = nodes.nodes.length; i < len; ++i) {
    if(!nodes.nodes[i].isBlockNode)
      continue

    this.blocks[nodes.nodes[i].name] = nodes.nodes[i]
  }
}

var cons = ExtendsNode
  , proto = cons.prototype

proto.isExtendsNode = true

proto.render = function(context, parent) {
  var self = this
    , promise

  parent = parent || this.parent.resolve(context)

  if(parent.constructor === Promise) {
    promise = new Promise

    parent.once('done', function(data) {
      promise.resolve(self.render(context, data))
    })

    return promise
  }

  parent = self.get_template(parent)

  if(parent.constructor === Promise) {
    promise = new Promise

    parent.once('done', function(data) {
      promise.resolve(self.render(context, data))
    })

    return promise
  }

  var blockContext = BlockContext.from(context) || BlockContext.into(context)
    , blocks = {}
    , nodeList = parent.getNodeList()
    , extendsIDX = false

  blockContext.add(self.blocks)

  for(var i = 0, len = nodeList.nodes.length; i < len; ++i) {
    if(nodeList.nodes[i].isExtendsNode) {
      extendsIDX = true
      break
    }

    if(nodeList.nodes[i].isBlockNode) {
      blocks[nodeList.nodes[i].name] = nodeList.nodes[i]
    }
  }

  if(!extendsIDX) {
    blockContext.add(blocks)
  }

  promise = new Promise

  parent.render(context, function(err, data) {
    promise.resolve(data)
  })

  return promise
}

proto.get_template = function(parent) {
  if(typeof parent !== 'string') {
    return parent
  }

  return this.loader(parent)
}

cons.parse = function(contents, parser) {
  var bits = contents.split(' ')
    , parent = parser.compile(bits.slice(1).join(' '))
    , nodes = parser.parse()
    , loader = parser.plugins.lookup('loader')

  return new cons(parent, nodes, loader)
}

},{"../block_context":2,"../promise":71}],77:[function(require,module,exports){
module.exports = ForNode

var NodeList = require('../node_list')
  , Promise = require('../promise')

function ForNode(target, unpack, loop, empty, reversed) {
  this.target = target
  this.unpack = unpack
  this.loop = loop
  this.empty = empty
  this.reversed = reversed
}

var cons = ForNode
  , proto = cons.prototype

function getInIndex(bits) {
  for(var i = 0, len = bits.length; i < len; ++i)
    if(bits[i] === 'in')
      return i

  return -1
}

proto.render = function(context, value) {
  var self = this
    , arr = value || self.target.resolve(context)
    , promise


  if(arr && arr.constructor === Promise) {
    promise = new Promise
    arr.once('done', function(data) {
      promise.resolve(self.render(context, data))
    })

    return promise
  }

  if(arr === undefined || arr === null) {
    arr = []
  }

  var bits = []
    , promises = []
    , parent = context.forloop
    , loop = {}
    , result
    , ctxt
    , sub

  if(!('length' in arr)) {
    for(var key in arr) if(arr.hasOwnProperty(key)) {
      bits.push(key)
    }

    arr = bits.slice()
    bits.length = 0
  }

  if(!arr.length) {
    return self.empty.render(context)
  }

  sub = self.reversed ? arr.length - 1 : 0

  for(var i = 0, len = arr.length, idx; i < len; ++i) {
    ctxt = context.copy()
    idx = Math.abs(sub - i)
    loop.counter = i + 1
    loop.counter0 = i
    loop.revcounter = len - i
    loop.revcounter0 = len - (i + 1)
    loop.first = i === 0
    loop.last = i === len - 1
    loop.parentloop = parent
    ctxt.forloop = loop

    if(self.unpack.length === 1)
      ctxt[self.unpack[0]] = arr[idx]
    else for(var u = 0; u < self.unpack.length; ++u)
      ctxt[self.unpack[u]] = arr[idx][u]

    result = self.loop.render(ctxt)
    if(result.constructor === Promise)
      promises.push(result)

    bits.push(result)
  }

  if(promises.length) {
    return self.loop.resolvePromises(bits, promises)
  }

  return bits.join('')
}

cons.parse = function(contents, parser) {
  var bits = contents.split(/\s+/)
    , reversed = bits[bits.length-1] === 'reversed'
    , idxIn = getInIndex(bits)
    , variables = bits.slice(1, idxIn)
    , target = parser.compile(bits[idxIn+1])
    , nodelist = parser.parse(['empty', 'endfor'])
    , unpack = []
    , empty


  if(parser.tokens.shift().is(['empty'])) {
    empty = parser.parse(['endfor'])
    parser.tokens.shift()
  } else {
    empty = new NodeList([])
  }

  variables = variables.join(' ').split(',')
  for(var i = 0, len = variables.length; i < len; ++i) {
    variables[i] = variables[i].replace(/(^\s+|\s+$)/, '')
    if(variables[i])
      unpack.push(variables[i])
  }

  return new cons(target, unpack, nodelist, empty, reversed);
}

},{"../node_list":69,"../promise":71}],78:[function(require,module,exports){
module.exports = EndToken

function EndToken() {
  this.lbp = 0
}

},{}],79:[function(require,module,exports){
module.exports = InfixOperator

var Promise = require('../../promise')

function InfixOperator(bp, cmp) {
  this.lbp = bp
  this.cmp = cmp

  this.first =
  this.second = null
}

var cons = InfixOperator
  , proto = cons.prototype

proto.nud = function(parser) {
  throw new Error("Unexpected token")
}

proto.led = function(lhs, parser) {
  this.first = lhs
  this.second = parser.expression(this.lbp)
  return this
}

proto.evaluate = function(context, first, second, sentFirst, sentSecond) {
  var self = this
    , promise

  first = sentFirst ? first : self.first.evaluate(context)

  if(first && first.constructor === Promise) {
    promise = new Promise

    first.once('done', function(data) {
      promise.resolve(self.evaluate(context, data, null, true, false))
    })

    return promise
  }

  second = sentSecond ? second : self.second.evaluate(context)

  if(second && second.constructor === Promise) {
    promise = new Promise

    second.once('done', function(data) {
      promise.resolve(self.evaluate(context, first, data, true, true))
    })

    return promise
  }

  return self.cmp(first, second)
}


},{"../../promise":71}],80:[function(require,module,exports){
module.exports = LiteralToken

function LiteralToken(value, original) {
  this.lbp = 0
  this.value = value
}

var cons = LiteralToken
  , proto = cons.prototype

proto.nud = function(parser) {
  return this
}

proto.led = function() {
  throw new Error()
}

proto.evaluate = function(context) {
  if(!this.value)
    return this.value

  if(!this.value.resolve)
    return this.value

  return this.value.resolve(context)
}

},{}],81:[function(require,module,exports){
module.exports = IfNode

var Promise = require('../../promise')
  , NodeList = require('../../node_list')
  , Parser = require('./parser')

function IfNode(predicate, when_true, when_false) {
  this.predicate = predicate
  this.when_true = when_true
  this.when_false = when_false
}

var cons = IfNode
  , proto = cons.prototype

proto.render = function(context, result, times) {
  var self = this
    , promise

  result = times === 1 ? result : this.predicate.evaluate(context)

  if(result && result.constructor === Promise) {
    promise = new Promise

    result.once('done', function(value) {
      promise.resolve(self.render(context, value, 1))
    })

    return promise
  }

  if(result) {
    return this.when_true.render(context)
  }
  return this.when_false.render(context)
}

cons.parse = function(contents, parser) {
  var bits = contents.split(' ').slice(1)
    , ifp = new Parser(bits, parser)
    , predicate
    , when_true
    , when_false
    , next

  predicate = ifp.parse()

  when_true = parser.parse(['else', 'elif', 'endif'])

  next = parser.tokens.shift()

  if(next.is(['endif'])) {
    when_false = new NodeList([])
  } else if(next.is(['elif'])) {
    when_false = cons.parse(next.content, parser)
  } else {
    when_false = parser.parse(['endif'])
    parser.tokens.shift()
  }

  return new cons(predicate, when_true, when_false)
}

},{"../../node_list":69,"../../promise":71,"./parser":83}],82:[function(require,module,exports){
var InfixOperator = require('./infix')
  , PrefixOperator = require('./prefix')

var keys

keys = Object.keys || keyshim

function keyshim(obj) {
  var accum = []

  for(var n in obj) if(obj.hasOwnProperty(n)) {
    accum.push(n)
  }

  return accum
}

module.exports = {
    'or': function() {
      return new InfixOperator(6, function(x, y) {
          return x || y
      })
    }

  , 'and': function() {
      return new InfixOperator(7, function(x, y) {
          return x && y
      })
    }

  , 'not': function() {
      return new PrefixOperator(8, function(x) {
        return !x
      })
    }

  , 'in': function() {
      return new InfixOperator(9, in_operator)
    }

  , 'not in': function() {
    return new InfixOperator(9, function(x, y) {
      return !in_operator(x,y)
    })
  }

  , '=': function() {
    return new InfixOperator(10, function(x, y) {
      return x == y
    })
  }

  , '==': function() {
      return new InfixOperator(10, function(x, y) {
        return x == y
      })
    }

  , '!=': function() {
      return new InfixOperator(10, function(x, y) {
        return x !== y
      })
    }

  , '>': function() {
      return new InfixOperator(10, function(x, y) {
        return x > y
      })
    }

  , '>=': function() {
      return new InfixOperator(10, function(x, y) {
        return x >= y
      })
    }

  , '<': function() {
      return new InfixOperator(10, function(x, y) {
        return x < y
      })
    }

  , '<=': function() {
      return new InfixOperator(10, function(x, y) {
        return x <= y
      })
    }
}

function in_operator(x, y) {
  if(!(x instanceof Object) && y instanceof Object) {
    if(!(y && 'length' in y)) {
      y = keys(y)
    }
  }

  if(typeof(x) == 'string' && typeof(y) =='string') {
    return y.indexOf(x) !== -1
  }

  if(x === undefined || x === null)
    return false

  if(y === undefined || y === null)
    return false

  for(var found = false, i = 0, len = y.length; i < len && !found; ++i) {
    var rhs = y[i]
    if(x instanceof Array) {
      for(var idx = 0,
        equal = x.length == rhs.length,
        xlen = x.length;
        idx < xlen && equal; ++idx) {

        equal = (x[idx] === rhs[idx])
      }
      found = equal

    } else if(x instanceof Object) {
      if(x === rhs) {
        return true
      }
      var xkeys = keys(x),
        rkeys = keys(rhs)

      if(xkeys.length === rkeys.length) {
        for(var i = 0, len = xkeys.length, equal = true;
          i < len && equal;
          ++i) {
          equal = xkeys[i] === rkeys[i] &&
              x[xkeys[i]] === rhs[rkeys[i]]
        }
        found = equal
      }
    } else {
      found = x == rhs
    }
  }
  return found
}

},{"./infix":79,"./prefix":84}],83:[function(require,module,exports){
module.exports = IfParser

var LiteralToken = require('./literal')
  , EndToken = require('./end')
  , operators = require('./operators')

function IfParser(tokens, parser) {
  this.createVariable = function(token) {
    return new LiteralToken(parser.compile(token), token)
  }

  var len = tokens.length
    , i = 0
    , mappedTokens = []
    , token

  while(i < len) {
    token = tokens[i]
    if(token == 'not' && tokens[i+1] == 'in') {
      ++i
      token = 'not in'
    }
    mappedTokens.push(this.translateToken(token))
    ++i
  }

  this.pos = 0
  this.tokens = mappedTokens
  this.currentToken = this.next()
}

var cons = IfParser
  , proto = cons.prototype

proto.translateToken = function(token) {
  var op = operators[token]

  if(op === undefined) {
    return this.createVariable(token)
  }

  return op()
}

proto.next = function() {
  if(this.pos >= this.tokens.length) {
    return new EndToken()
  }
  return this.tokens[this.pos++]
}

proto.parse = function() {
  var retval = this.expression()

  if(!(this.currentToken.constructor === EndToken)) {
    throw new Error("Unused "+this.currentToken+" at end of if expression.")
  }

  return retval
}

proto.expression = function(rbp) {
  rbp = rbp || 0

  var t = this.currentToken
    , left

  this.currentToken = this.next()

  left = t.nud(this)
  while(rbp < this.currentToken.lbp) {
    t = this.currentToken

    this.currentToken = this.next()

    left = t.led(left, this)
  }

  return left
}

},{"./end":78,"./literal":80,"./operators":82}],84:[function(require,module,exports){
module.exports = PrefixOperator

var Promise = require('../../promise')

function PrefixOperator(bp, cmp) {
  this.lbp = bp
  this.cmp = cmp

  this.first =
  this.second = null
}

var cons = PrefixOperator
  , proto = cons.prototype

proto.nud = function(parser) {
  this.first = parser.expression(this.lbp)
  this.second = null
  return this
}

proto.led = function(first, parser) {
  throw new Error("Unexpected token")
}

proto.evaluate = function(context, first, times) {
  var self = this
    , promise

  first = times === 1 ? first : self.first.evaluate(context)

  if(first && first.constructor === Promise) {
    promise = new Promise

    first.once('done', function(data) {
      promise.resolve(self.evaluate(context, data, 1))
    })

    return promise
  }

  return self.cmp(first)
}

},{"../../promise":71}],85:[function(require,module,exports){
module.exports = IncludeNode

var Promise = require('../promise')

function IncludeNode(target_var, loader) {
  this.target_var = target_var
  this.loader = loader
}

var cons = IncludeNode
  , proto = cons.prototype

cons.parse = function(contents, parser) {
  var bits = contents.split(' ')
    , varname = parser.compile(bits.slice(1).join(' '))
    , loader = parser.plugins.lookup('loader')

  return new cons(varname, loader)
}

proto.render = function(context, target) {
  var self = this
    , promise

  target = target || this.target_var.resolve(context)

  if(target && target.constructor === Promise) {
    promise = new Promise

    target.once('done', function(data) {
      promise.resolve(self.render(context, data))
    })

    return promise
  }

  target = self.get_template(target)

  if(target && target.constructor === Promise) {
    promise = new Promise

    target.once('done', function(data) {
      promise.resolve(self.render(context, data))
    })

    return promise
  }

  promise = new Promise

  target.render(context.copy(), function(err, data) {
    promise.resolve(data)
  })

  return promise
}

proto.get_template = function(target) {
  if(typeof target === 'string') {
    return this.loader(target)
  }

  // okay, it's probably a template object
  return target
}

},{"../promise":71}],86:[function(require,module,exports){
module.exports = NowNode

var format = require('../date').date

function NowNode(formatString) {
  this.format = formatString
}

var cons = NowNode
  , proto = cons.prototype

proto.render = function(context) {
  return format(new Date, this.format)
}

cons.parse = function(contents, parser) {
  var bits = contents.split(' ')
    , fmt = bits.slice(1).join(' ')

  fmt = fmt
    .replace(/^\s+/, '')
    .replace(/\s+$/, '')

  if(/['"]/.test(fmt.charAt(0))) {
    fmt = fmt.slice(1, -1)
  }

  return new NowNode(fmt || 'N j, Y')
}

},{"../date":5}],87:[function(require,module,exports){
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

},{"../promise":71}],88:[function(require,module,exports){
module.exports = TextNode

function TextNode(content) {
  this.content = content
}

var cons = TextNode
  , proto = cons.prototype

proto.render = function(context) {
  return this.content
}

},{}],89:[function(require,module,exports){
module.exports = TextToken

var Token = require('./token')
  , TextNode = require('./text_node')

function TextToken(content, line) {
  Token.call(this, content, line)
}

var cons = TextToken
  , proto = cons.prototype = new Token

proto.constructor = cons

proto.node = function(parser) {
  return new TextNode(this.content)
}

},{"./text_node":88,"./token":90}],90:[function(require,module,exports){
module.exports = Token

function Token(content, line) {
  this.content = content
  this.line = line

  this.name = content && content.split(' ')[0]
}

var cons = Token
  , proto = cons.prototype

proto.toString = function() {
  // NB: this should only be
  // debug output, so it's
  // probably safe to use
  // JSON.stringify here.
  return '<'+this.constructor.name+': '+JSON.stringify(this.content)+'>'
}

proto.is = function(names) {
  for(var i = 0, len = names.length; i < len; ++i)
    if(names[i] === this.name)
      return true
  return false
}

},{}],91:[function(require,module,exports){
module.exports = function(input, callback) {
  var str = input.toString()
  return str.replace(/(((http(s)?:\/\/)|(mailto:))([\w\d\-\.:@\/?&=%])+)/g, callback)
}
},{}],92:[function(require,module,exports){
;(function() {

// so, the only way we (reliably) get access to DST in javascript
// is via `Date#getTimezoneOffset`.
//
// this value will switch for a given date based on the presence or absence
// of DST at that date.

function find_dst_threshold (near, far) {
  var near_date = new Date(near)
    , far_date = new Date(far)
    , near_offs = near_date.getTimezoneOffset()
    , far_offs = far_date.getTimezoneOffset()

  if(near_offs === far_offs) return 0

  if(Math.abs(near_date - far_date) < 1000) return near_date

  return find_dst_threshold(near, near+(far-near)/2) || find_dst_threshold(near+(far-near)/2, far)
}


function find_dst_thresholds() {
  var d = new Date()
    , d = new Date(d.getFullYear(), 0, 1)
    , f = new Date(d.getFullYear(), 11, 31)
    , x
    , first
    , second

  x = (f - d) / -2
  first = find_dst_threshold(+d, d - x)
  second = find_dst_threshold(d - x, +f)

  return {
    spring_forward  : first ? (first.getTimezoneOffset() < second.getTimezoneOffset() ? second : first) - new Date(d.getFullYear(), 0, 1, 0, 0) : 0
  , fall_back       : first ? (first.getTimezoneOffset() < second.getTimezoneOffset() ? first : second) - new Date(d.getFullYear(), 0, 1, 0, 0) : 0
  }
}

var THRESHOLDS = find_dst_thresholds()

function is_dst(datetime, thresholds) {

  thresholds = thresholds || THRESHOLDS

  if(thresholds.spring_forward === thresholds.fall_back)
    return false

  var offset = datetime - new Date(datetime.getFullYear(), 0, 1, 0, 0)
    , dst_is_reversed = thresholds.spring_forward > thresholds.fall_back
    , max = Math.max(thresholds.fall_back, thresholds.spring_forward)
    , min = Math.min(thresholds.fall_back, thresholds.spring_forward)

  if(min < offset && offset < max)
    return !dst_is_reversed
  return dst_is_reversed
}

Date.prototype.isDST = function(thresholds) {
  return is_dst(this, thresholds) 
}

is_dst.find_thresholds = find_dst_thresholds

if(typeof module !== 'undefined') {
  module.exports = is_dst
} else {
  window.is_dst = is_dst 
}

})()

},{}],93:[function(require,module,exports){
var tz = require('./tz')
  , isDST = require('dst')

module.exports = tzinfo

function get_offset_fmt(tzoffs) {
  var offs = ~~(tzoffs / 60)
    , mins = ('00' + ~~Math.abs(tzoffs % 60)).slice(-2)

  offs = ((tzoffs > 0) ? '-' : '+') + ('00' + Math.abs(offs)).slice(-2) + mins

  return offs
}

function tzinfo(date, tz_list, determine_dst, TZ) {

  var fmt = get_offset_fmt(date.getTimezoneOffset())

  TZ = TZ || tz
  tz_list = tz_list || TZ[fmt]
  determine_dst = determine_dst || isDST

  var date_is_dst = determine_dst(date)
    , date_dst_thresholds = determine_dst.find_thresholds()
    , has_dst = date_dst_thresholds.spring_forward !== date_dst_thresholds.fall_back
    , is_north = has_dst && date_dst_thresholds.spring_forward < date_dst_thresholds.fall_back 
    , list = (tz_list || []).slice()
    , filtered = []

  var datestroffset = /\((.*?)\)/.exec('' + new Date())

  if(datestroffset) {
    datestroffset = datestroffset[1]

    for(var i = 0, len = list.length; i < len; ++i) {
      if(list[i].abbr === datestroffset) {
        return {
            'name': list[i].name
          , 'loc': list[i].loc
          , 'abbr': list[i].abbr
          , 'offset': fmt
        }
      }
    }
  }


  if(!is_north)
    list = list.reverse()

  for(var i = 0, len = list.length; i < len; ++i) {
    if(date_is_dst === /([Dd]aylight|[Ss]ummer)/.test(list[i].name)) {
      filtered.push(list[i])
    }
  }
  list = filtered
  if(!list.length) return {}

  return {
      'name':     list[0].name
    , 'loc':      list[0].loc
    , 'abbr':     list[0].abbr
    , 'offset':   fmt
  }
} 

tzinfo.get_offset_format = get_offset_fmt
tzinfo.tz_list = tz

Date.prototype.tzinfo = function() {
  return tzinfo(this)
}

Date.prototype.tzoffset = function() {
  return 'GMT'+get_offset_fmt(this.getTimezoneOffset())
}

},{"./tz":94,"dst":92}],94:[function(require,module,exports){
module.exports = {
  "+0900": [
    {
      "loc": "Asia", 
      "abbr": "JST", 
      "name": "Japan Standard Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "KST", 
      "name": "Korea Standard Time"
    }, 
    {
      "loc": "Australia", 
      "abbr": "WDT", 
      "name": "Western Daylight Time"
    } 
  ], 
  "+1345": [
    {
      "loc": "Pacific", 
      "abbr": "CHADT", 
      "name": "Chatham Island Daylight Time"
    }
  ], 
  "+0500": [
    {
      "loc": "Asia", 
      "abbr": "PKT", 
      "name": "Pakistan Standard Time"
    } 
  ], 
  "+0430": [
    {
      "loc": "Asia", 
      "abbr": "AFT", 
      "name": "Afghanistan Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "IRDT", 
      "name": "Iran Daylight Time"
    }
  ], 
  "+1200": [
    {
      "loc": "Asia", 
      "abbr": "ANAST", 
      "name": "Anadyr Summer Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "ANAT", 
      "name": "Anadyr Time"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "FJT", 
      "name": "Fiji Time"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "GILT", 
      "name": "Gilbert Island Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "MAGST", 
      "name": "Magadan Summer Time"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "MHT", 
      "name": "Marshall Islands Time"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "NZST", 
      "name": "New Zealand Standard Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "PETST", 
      "name": "Kamchatka Summer Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "PETT", 
      "name": "Kamchatka Time"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "TVT", 
      "name": "Tuvalu Time"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "WFT", 
      "name": "Wallis and Futuna Time"
    }
  ], 
  "-1100": [
    {
      "loc": "Pacific", 
      "abbr": "SST", 
      "name": "Samoa Standard Time"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "WST", 
      "name": "West Samoa Time"
    } 
  ], 
  "+1400": [
    {
      "loc": "Pacific", 
      "abbr": "LINT", 
      "name": "Line Islands Time"
    }
  ], 
  "-0230": [
    {
      "loc": "North America", 
      "abbr": "HAT", 
      "name": "Heure Avanc\u00e9e de Terre-Neuve"
    }, 
    {
      "loc": "North America", 
      "abbr": "NDT", 
      "name": "Newfoundland Daylight Time"
    }
  ], 
  "-0100": [
    {
      "loc": "Africa", 
      "abbr": "CVT", 
      "name": "Cape Verde Time"
    }, 
    {
      "loc": "North America", 
      "abbr": "EGT", 
      "name": "East Greenland Time"
    } 
  ], 
  "-1200": [
    {
      "loc": "Military", 
      "abbr": "Y", 
      "name": "Yankee Time Zone"
    }
  ], 
  "+0800": [
    {
      "loc": "Asia", 
      "abbr": "CST", 
      "name": "China Standard Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "KRAST", 
      "name": "Krasnoyarsk Summer Time"
    }, 
    {
      "loc": "Australia", 
      "abbr": "WST", 
      "name": "Western Standard Time"
    }
  ], 
  "+0630": [
    {
      "loc": "Asia", 
      "abbr": "MMT", 
      "name": "Myanmar Time"
    },
    {
      "loc": "Indian Ocean", 
      "abbr": "CCT", 
      "name": "Cocos Islands Time"
    }
  ], 
  "-0430": [
    {
      "loc": "South America", 
      "abbr": "HLV", 
      "name": "Hora Legal de Venezuela"
    }, 
    {
      "loc": "South America", 
      "abbr": "VET", 
      "name": "Venezuelan Standard Time"
    }
  ], 
  "-0700": [
    {
      "loc": "North America", 
      "abbr": "MST", 
      "name": "Mountain Standard Time"
    }, 
    {
      "loc": "North America", 
      "abbr": "PDT", 
      "name": "Pacific Daylight Time"
    }, 
    {
      "loc": "North America", 
      "abbr": "HAP", 
      "name": "Heure Avanc\u00e9e du Pacifique"
    }, 
    {
      "loc": "North America", 
      "abbr": "HNR", 
      "name": "Heure Normale des Rocheuses"
    } 
  ], 
  "-0200": [
    {
      "loc": "South America", 
      "abbr": "FNT", 
      "name": "Fernando de Noronha Time"
    }, 
    {
      "loc": "North America", 
      "abbr": "WGST", 
      "name": "Western Greenland Summer Time"
    },
    {
      "loc": "North America", 
      "abbr": "PMDT", 
      "name": "Pierre & Miquelon Daylight Time"
    }, 
    {
      "loc": "South America", 
      "abbr": "UYST", 
      "name": "Uruguay Summer Time"
    }, 
    {
      "loc": "South America", 
      "abbr": "BRST", 
      "name": "Brasilia Summer Time"
    } 
  ], 
  "+1030": [
    {
      "loc": "Australia", 
      "abbr": "CDT", 
      "name": "Central Daylight Time"
    }, 
    {
      "loc": "Australia", 
      "abbr": "LHST", 
      "name": "Lord Howe Standard Time"
    }
  ], 
  "+0300": [
    {
      "loc": "Europe", 
      "abbr": "MSK", 
      "name": "Moscow Standard Time"
    },
    {
      "loc": "Asia", 
      "abbr": "IDT", 
      "name": "Israel Daylight Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "AST", 
      "name": "Arabia Standard Time"
    }, 
    {
      "loc": "Indian Ocean", 
      "abbr": "EAT", 
      "name": "East Africa Time"
    }, 
    {
      "loc": "Europe", 
      "abbr": "EEST", 
      "name": "Eastern European Summer Time"
    }, 
    {
      "loc": "Africa", 
      "abbr": "EAT", 
      "name": "Eastern Africa Time"
    } 
  ], 
  "UTC": [
    {
      "loc": "Atlantic", 
      "abbr": "AZOST", 
      "name": "Azores Summer Time"
    }, 
    {
      "loc": "North America", 
      "abbr": "EGST", 
      "name": "Eastern Greenland Summer Time"
    }, 
    {
      "loc": "Africa", 
      "abbr": "GMT", 
      "name": "Greenwich Mean Time"
    }, 
    {
      "loc": "Europe", 
      "abbr": "GMT", 
      "name": "Greenwich Mean Time"
    }, 
    {
      "loc": "Africa", 
      "abbr": "WET", 
      "name": "Western European Time"
    }, 
    {
      "loc": "Europe", 
      "abbr": "WET", 
      "name": "Western European Time"
    }, 
    {
      "loc": "Africa", 
      "abbr": "WT", 
      "name": "Western Sahara Standard Time"
    }, 
    {
      "loc": "Military", 
      "abbr": "Z", 
      "name": "Zulu Time Zone"
    }
  ], 
  "+0400": [
    {
      "loc": "Asia", 
      "abbr": "AMT", 
      "name": "Armenia Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "AZT", 
      "name": "Azerbaijan Time"
    }, 
    {
      "loc": "Military", 
      "abbr": "D", 
      "name": "Delta Time Zone"
    }, 
    {
      "loc": "Asia", 
      "abbr": "GET", 
      "name": "Georgia Standard Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "GST", 
      "name": "Gulf Standard Time"
    }, 
    {
      "loc": "Europe", 
      "abbr": "KUYT", 
      "name": "Kuybyshev Time"
    }, 
    {
      "loc": "Europe", 
      "abbr": "MSD", 
      "name": "Moscow Daylight Time"
    }, 
    {
      "loc": "Africa", 
      "abbr": "MUT", 
      "name": "Mauritius Time"
    }, 
    {
      "loc": "Africa", 
      "abbr": "RET", 
      "name": "Reunion Time"
    }, 
    {
      "loc": "Europe", 
      "abbr": "SAMT", 
      "name": "Samara Time"
    }, 
    {
      "loc": "Africa", 
      "abbr": "SCT", 
      "name": "Seychelles Time"
    }
  ], 
  "+0700": [
    {
      "loc": "Australia", 
      "abbr": "CXT", 
      "name": "Christmas Island Time"
    }, 
    {
      "loc": "Antarctica", 
      "abbr": "DAVT", 
      "name": "Davis Time"
    }, 
    {
      "loc": "Military", 
      "abbr": "G", 
      "name": "Golf Time Zone"
    }, 
    {
      "loc": "Asia", 
      "abbr": "HOVT", 
      "name": "Hovd Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "ICT", 
      "name": "Indochina Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "KRAT", 
      "name": "Krasnoyarsk Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "NOVST", 
      "name": "Novosibirsk Summer Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "OMSST", 
      "name": "Omsk Summer Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "WIB", 
      "name": "Western Indonesian Time"
    }
  ], 
  "+0200": [
    {
      "loc": "Military", 
      "abbr": "B", 
      "name": "Bravo Time Zone"
    }, 
    {
      "loc": "Africa", 
      "abbr": "CAT", 
      "name": "Central Africa Time"
    }, 
    {
      "loc": "Europe", 
      "abbr": "CEST", 
      "name": "Central European Summer Time"
    }, 
    {
      "loc": "Africa", 
      "abbr": "EET", 
      "name": "Eastern European Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "EET", 
      "name": "Eastern European Time"
    }, 
    {
      "loc": "Europe", 
      "abbr": "EET", 
      "name": "Eastern European Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "IST", 
      "name": "Israel Standard Time"
    }, 
    {
      "loc": "Africa", 
      "abbr": "SAST", 
      "name": "South Africa Standard Time"
    }, 
    {
      "loc": "Africa", 
      "abbr": "WAST", 
      "name": "West Africa Summer Time"
    }
  ], 
  "-1000": [
    {
      "loc": "Pacific", 
      "abbr": "CKT", 
      "name": "Cook Island Time"
    }, 
    {
      "loc": "North America", 
      "abbr": "HAST", 
      "name": "Hawaii-Aleutian Standard Time"
    }, 
    {
      "loc": "North America", 
      "abbr": "HST", 
      "name": "Hawaii-Aleutian Standard Time"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "TAHT", 
      "name": "Tahiti Time"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "TKT", 
      "name": "Tokelau Time"
    }, 
    {
      "loc": "Military", 
      "abbr": "W", 
      "name": "Whiskey Time Zone"
    }
  ], 
  "+0930": [
    {
      "loc": "Australia", 
      "abbr": "CST", 
      "name": "Central Standard Time"
    }
  ], 
  "+0530": [
    {
      "loc": "Asia", 
      "abbr": "IST", 
      "name": "India Standard Time"
    }
  ], 
  "+1300": [
    {
      "loc": "Pacific", 
      "abbr": "FJST", 
      "name": "Fiji Summer Time"
    }, 
    {
      "loc": "Antarctica", 
      "abbr": "NZDT", 
      "name": "New Zealand Daylight Time"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "NZDT", 
      "name": "New Zealand Daylight Time"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "PHOT", 
      "name": "Phoenix Island Time"
    }
  ], 
  "+0545": [
    {
      "loc": "Asia", 
      "abbr": "NPT", 
      "name": "Nepal Time"
    }
  ], 
  "+1000": [
    {
      "loc": "Pacific", 
      "abbr": "ChST", 
      "name": "Chamorro Standard Time"
    }, 
    {
      "loc": "Australia", 
      "abbr": "EST", 
      "name": "Eastern Standard Time"
    }, 
    {
      "loc": "Military", 
      "abbr": "K", 
      "name": "Kilo Time Zone"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "PGT", 
      "name": "Papua New Guinea Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "VLAT", 
      "name": "Vladivostok Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "YAKST", 
      "name": "Yakutsk Summer Time"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "YAPT", 
      "name": "Yap Time"
    }
  ], 
  "-0600": [
    {
      "loc": "North America", 
      "abbr": "CST", 
      "name": "Central Standard Time"
    }, 
    {
      "loc": "North America", 
      "abbr": "MDT", 
      "name": "Mountain Daylight Time"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "GALT", 
      "name": "Galapagos Time"
    }, 
    {
      "loc": "North America", 
      "abbr": "HAR", 
      "name": "Heure Avanc\u00e9e des Rocheuses"
    }, 
    {
      "loc": "North America", 
      "abbr": "HNC", 
      "name": "Heure Normale du Centre"
    }, 
    {
      "loc": "Central America", 
      "abbr": "HNC", 
      "name": "Heure Normale du Centre"
    }, 
    {
      "loc": "Central America", 
      "abbr": "CST", 
      "name": "Central Standard Time"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "EAST", 
      "name": "Easter Island Standard Time"
    }
  ], 
  "+0100": [
    {
      "loc": "Europe", 
      "abbr": "CET", 
      "name": "Central European Time"
    }, 
    {
      "loc": "Europe", 
      "abbr": "BST", 
      "name": "British Summer Time"
    }, 
    {
      "loc": "Africa", 
      "abbr": "CET", 
      "name": "Central European Time"
    }, 
    {
      "loc": "Africa", 
      "abbr": "WEST", 
      "name": "Western European Summer Time"
    }, 
    {
      "loc": "Europe", 
      "abbr": "WEST", 
      "name": "Western European Summer Time"
    }, 
    {
      "loc": "Africa", 
      "abbr": "WST", 
      "name": "Western Sahara Summer Time"
    },
    {
      "loc": "Africa", 
      "abbr": "WAT", 
      "name": "West Africa Time"
    }
  ], 
  "-0400": [
    {
      "loc": "North America", 
      "abbr": "AST", 
      "name": "Atlantic Standard Time"
    }, 
    {
      "loc": "North America", 
      "abbr": "EDT", 
      "name": "Eastern Daylight Time"
    }, 
    {
      "loc": "South America", 
      "abbr": "CLT", 
      "name": "Chile Standard Time"
    }, 
    {
      "loc": "South America", 
      "abbr": "FKT", 
      "name": "Falkland Island Time"
    }, 
    {
      "loc": "South America", 
      "abbr": "GYT", 
      "name": "Guyana Time"
    }, 
    {
      "loc": "South America", 
      "abbr": "PYT", 
      "name": "Paraguay Time"
    }, 
    {
      "loc": "South America", 
      "abbr": "AMT", 
      "name": "Amazon Time"
    } 
  ], 
  "-0330": [
    {
      "loc": "North America", 
      "abbr": "NST", 
      "name": "Newfoundland Standard Time"
    }
  ], 
  "-0500": [
    {
      "loc": "North America", 
      "abbr": "EST", 
      "name": "Eastern Standard Time"
    }, 
    {
      "loc": "North America", 
      "abbr": "CDT", 
      "name": "Central Daylight Time"
    }, 
    {
      "loc": "South America", 
      "abbr": "COT", 
      "name": "Colombia Time"
    }, 
    {
      "loc": "Caribbean", 
      "abbr": "CST", 
      "name": "Cuba Standard Time"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "EASST", 
      "name": "Easter Island Summer Time"
    }, 
    {
      "loc": "South America", 
      "abbr": "ECT", 
      "name": "Ecuador Time"
    }, 
    {
      "loc": "Central America", 
      "abbr": "EST", 
      "name": "Eastern Standard Time"
    }, 
    {
      "loc": "Caribbean", 
      "abbr": "EST", 
      "name": "Eastern Standard Time"
    }, 
    {
      "loc": "Central America", 
      "abbr": "ET", 
      "name": "Tiempo del Este"
    }, 
    {
      "loc": "Caribbean", 
      "abbr": "ET", 
      "name": "Tiempo del Este"
    }, 
    {
      "loc": "North America", 
      "abbr": "ET", 
      "name": "Tiempo Del Este"
    }, 
    {
      "loc": "North America", 
      "abbr": "HAC", 
      "name": "Heure Avanc\u00e9e du Centre"
    }, 
    {
      "loc": "South America", 
      "abbr": "PET", 
      "name": "Peru Time"
    } 
  ], 
  "-0900": [
    {
      "loc": "North America", 
      "abbr": "AKST", 
      "name": "Alaska Standard Time"
    }, 
    {
      "loc": "North America", 
      "abbr": "HADT", 
      "name": "Hawaii-Aleutian Daylight Time"
    } 
  ], 
  "-0300": [
    {
      "loc": "North America", 
      "abbr": "ADT", 
      "name": "Atlantic Daylight Time"
    }, 
    {
      "loc": "South America", 
      "abbr": "AMST", 
      "name": "Amazon Summer Time"
    }, 
    {
      "loc": "South America", 
      "abbr": "BRT", 
      "name": "Bras\u00edlia time"
    } 
  ], 
  "+1245": [
    {
      "loc": "Pacific", 
      "abbr": "CHAST", 
      "name": "Chatham Island Standard Time"
    }
  ], 
  "+0600": [
    {
      "loc": "Asia", 
      "abbr": "BST", 
      "name": "Bangladesh Standard Time"
    }, 
    {
      "loc": "Asia", 
      "abbr": "YEKST", 
      "name": "Yekaterinburg Summer Time"
    },
    {
      "loc": "Asia", 
      "abbr": "BST", 
      "name": "Bangladesh Standard Time"
    } 
  ], 
  "-0930": [
    {
      "loc": "Pacific", 
      "abbr": "MART", 
      "name": "Marquesas Time"
    }
  ], 
  "+0330": [
    {
      "loc": "Asia", 
      "abbr": "IRST", 
      "name": "Iran Standard Time"
    }
  ], 
  "+1130": [
    {
      "loc": "Australia", 
      "abbr": "NFT", 
      "name": "Norfolk Time"
    }
  ], 
  "+1100": [
    {
      "loc": "Asia", 
      "abbr": "VLAST", 
      "name": "Vladivostok Summer Time"
    }, 
    {
      "loc": "Australia", 
      "abbr": "EDT", 
      "name": "Eastern Daylight Time"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "NCT", 
      "name": "New Caledonia Time"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "PONT", 
      "name": "Pohnpei Standard Time"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "SBT", 
      "name": "Solomon IslandsTime"
    }, 
    {
      "loc": "Pacific", 
      "abbr": "VUT", 
      "name": "Vanuatu Time"
    }
  ], 
  "-0800": [
    {
      "loc": "North America", 
      "abbr": "PST", 
      "name": "Pacific Standard Time"
    }, 
    {
      "loc": "North America", 
      "abbr": "AKDT", 
      "name": "Alaska Daylight Time"
    } 
  ]
}

},{}]},{},[1])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvYnJvd3Nlci5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvYmxvY2tfY29udGV4dC5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvY29tbWVudF90b2tlbi5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvY29udGV4dC5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvZGF0ZS5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvZGVidWcuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2RlZmF1bHRmaWx0ZXJzLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9kZWZhdWx0dGFncy5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvZmlsdGVyX2FwcGxpY2F0aW9uLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9maWx0ZXJfY2hhaW4uanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcl9sb29rdXAuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcl9ub2RlLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9maWx0ZXJfdG9rZW4uanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcnMvYWRkLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9maWx0ZXJzL2FkZHNsYXNoZXMuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcnMvY2FwZmlyc3QuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcnMvY2VudGVyLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9maWx0ZXJzL2N1dC5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvZmlsdGVycy9kYXRlLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9maWx0ZXJzL2RlZmF1bHQuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcnMvZGljdHNvcnQuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcnMvZGljdHNvcnRyZXZlcnNlZC5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvZmlsdGVycy9kaXZpc2libGVieS5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvZmlsdGVycy9lc2NhcGUuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcnMvZmlsZXNpemVmb3JtYXQuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcnMvZmlyc3QuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcnMvZmxvYXRmb3JtYXQuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcnMvZm9yY2VfZXNjYXBlLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9maWx0ZXJzL2dldF9kaWdpdC5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvZmlsdGVycy9pbmRleC5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvZmlsdGVycy9pcmllbmNvZGUuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcnMvaXRlcml0ZW1zLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9maWx0ZXJzL2pvaW4uanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcnMvbGFzdC5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvZmlsdGVycy9sZW5ndGguanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcnMvbGVuZ3RoX2lzLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9maWx0ZXJzL2xpbmVicmVha3MuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcnMvbGluZWJyZWFrc2JyLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9maWx0ZXJzL2xpbmVudW1iZXJzLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9maWx0ZXJzL2xqdXN0LmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9maWx0ZXJzL2xvd2VyLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9maWx0ZXJzL21ha2VfbGlzdC5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvZmlsdGVycy9waG9uZTJudW1lcmljLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9maWx0ZXJzL3BsdXJhbGl6ZS5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvZmlsdGVycy9yYW5kb20uanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcnMvcmp1c3QuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcnMvc2FmZS5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvZmlsdGVycy9zbGljZS5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvZmlsdGVycy9zbHVnaWZ5LmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9maWx0ZXJzL3NwbGl0LmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9maWx0ZXJzL3N0cmlwdGFncy5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvZmlsdGVycy90aW1lc2luY2UuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcnMvdGltZXVudGlsLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9maWx0ZXJzL3RpdGxlLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9maWx0ZXJzL3RydW5jYXRlY2hhcnMuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcnMvdHJ1bmNhdGV3b3Jkcy5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvZmlsdGVycy91bm9yZGVyZWRfbGlzdC5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvZmlsdGVycy91cHBlci5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvZmlsdGVycy91cmxlbmNvZGUuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcnMvdXJsaXplLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9maWx0ZXJzL3VybGl6ZXRydW5jLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9maWx0ZXJzL3dvcmRjb3VudC5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvZmlsdGVycy93b3Jkd3JhcC5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvZmlsdGVycy95ZXNuby5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvaW5kZXguanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2xpYnJhcmllcy5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvbGlicmFyeS5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvbWV0YS5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvbm9kZV9saXN0LmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9wYXJzZXIuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL3Byb21pc2UuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL3RhZ190b2tlbi5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvdGFncy9ibG9jay5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvdGFncy9jb21tZW50LmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi90YWdzL2RlYnVnLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi90YWdzL2V4dGVuZHMuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL3RhZ3MvZm9yLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi90YWdzL2lmL2VuZC5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvdGFncy9pZi9pbmZpeC5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvdGFncy9pZi9saXRlcmFsLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi90YWdzL2lmL25vZGUuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL3RhZ3MvaWYvb3BlcmF0b3JzLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi90YWdzL2lmL3BhcnNlci5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvdGFncy9pZi9wcmVmaXguanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL3RhZ3MvaW5jbHVkZS5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvdGFncy9ub3cuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL3RhZ3Mvd2l0aC5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvdGV4dF9ub2RlLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi90ZXh0X3Rva2VuLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi90b2tlbi5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvdXJsX2ZpbmRlci5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9ub2RlX21vZHVsZXMvZHN0L2luZGV4LmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL25vZGVfbW9kdWxlcy90ei9pbmRleC5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9ub2RlX21vZHVsZXMvdHovdHouanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25QQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUJBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyJyZXF1aXJlKCdkc3QnKVxuXG52YXIgcGxhdGUgPSByZXF1aXJlKCcuL2xpYi9pbmRleCcpXG5pZih0eXBlb2YgZGVmaW5lICE9PSAndW5kZWZpbmVkJyAmJiBkZWZpbmUuYW1kKSB7XG4gIGRlZmluZSgncGxhdGUnLCBbXSwgZnVuY3Rpb24oKSB7IHJldHVybiBwbGF0ZSB9KVxufSBlbHNlIHtcbiAgd2luZG93LnBsYXRlID0gcGxhdGVcbn1cblxucGxhdGUuZGVidWcgPSByZXF1aXJlKCcuL2xpYi9kZWJ1ZycpXG5wbGF0ZS51dGlscyA9IHBsYXRlLmRhdGUgPSByZXF1aXJlKCcuL2xpYi9kYXRlJylcbnBsYXRlLnV0aWxzLlByb21pc2UgPSByZXF1aXJlKCcuL2xpYi9wcm9taXNlJylcbnBsYXRlLnV0aWxzLlNhZmVTdHJpbmcgPSBmdW5jdGlvbihzdHIpIHtcbiAgc3RyID0gbmV3IFN0cmluZyhzdHIpXG4gIHN0ci5zYWZlID0gdHJ1ZVxuICByZXR1cm4gc3RyXG59XG5wbGF0ZS5saWJyYXJpZXMgPSByZXF1aXJlKCcuL2xpYi9saWJyYXJpZXMnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHBsYXRlXG4iLCJtb2R1bGUuZXhwb3J0cyA9IEJsb2NrQ29udGV4dFxuXG5mdW5jdGlvbiBCbG9ja0NvbnRleHQoKSB7XG4gIHRoaXMuYmxvY2tzID0ge31cbn1cblxudmFyIGNvbnMgPSBCbG9ja0NvbnRleHRcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbmNvbnMuS0VZID0gJ19fQkxPQ0tfQ09OVEVYVF9fJ1xuXG5jb25zLmZyb20gPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gIHJldHVybiBjb250ZXh0W3RoaXMuS0VZXVxufVxuXG5jb25zLmludG8gPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gIHJldHVybiBjb250ZXh0W3RoaXMuS0VZXSA9IG5ldyB0aGlzKClcbn1cblxucHJvdG8uYWRkID0gZnVuY3Rpb24oYmxvY2tzKSB7XG4gIGZvcih2YXIgbmFtZSBpbiBibG9ja3MpIHtcbiAgICAodGhpcy5ibG9ja3NbbmFtZV0gPSB0aGlzLmJsb2Nrc1tuYW1lXSB8fCBbXSkudW5zaGlmdChibG9ja3NbbmFtZV0pXG4gIH1cbn1cblxucHJvdG8uZ2V0ID0gZnVuY3Rpb24obmFtZSkge1xuICB2YXIgbGlzdCA9IHRoaXMuYmxvY2tzW25hbWVdIHx8IFtdXG5cbiAgcmV0dXJuIGxpc3RbbGlzdC5sZW5ndGggLSAxXVxufVxuXG5wcm90by5wdXNoID0gZnVuY3Rpb24obmFtZSwgYmxvY2spIHtcbiAgKHRoaXMuYmxvY2tzW25hbWVdID0gdGhpcy5ibG9ja3NbbmFtZV0gfHwgW10pLnB1c2goYmxvY2spXG59XG5cbnByb3RvLnBvcCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgcmV0dXJuICh0aGlzLmJsb2Nrc1tuYW1lXSA9IHRoaXMuYmxvY2tzW25hbWVdIHx8IFtdKS5wb3AoKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBDb21tZW50VG9rZW5cblxudmFyIFRva2VuID0gcmVxdWlyZSgnLi90b2tlbicpXG5cbmZ1bmN0aW9uIENvbW1lbnRUb2tlbihjb250ZW50LCBsaW5lKSB7XG4gIFRva2VuLmNhbGwodGhpcywgY29udGVudCwgbGluZSlcbn1cblxudmFyIGNvbnMgPSBDb21tZW50VG9rZW5cbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlID0gbmV3IFRva2VuXG5cbnByb3RvLmNvbnN0cnVjdG9yID0gY29uc1xuXG5wcm90by5ub2RlID0gZnVuY3Rpb24ocGFyc2VyKSB7XG4gIC8vIG5vLW9wZXJhdGlvblxuICByZXR1cm4gbnVsbFxufVxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IENvbnRleHRcblxuZnVuY3Rpb24gQ29udGV4dChmcm9tKSB7XG4gIGlmKGZyb20gJiYgZnJvbS5jb25zdHJ1Y3RvciA9PT0gQ29udGV4dCkge1xuICAgIHJldHVybiBmcm9tXG4gIH1cblxuICBmcm9tID0gZnJvbSB8fCB7fVxuICBmb3IodmFyIGtleSBpbiBmcm9tKSBpZihmcm9tLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICB0aGlzW2tleV0gPSBmcm9tW2tleV1cbiAgfVxufVxuXG52YXIgY29ucyA9IENvbnRleHRcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLmNvcHkgPSBmdW5jdGlvbigpIHtcbiAgdmFyIEYgPSBGdW5jdGlvbigpXG4gIEYubmFtZSA9IGNvbnMubmFtZVxuICBGLnByb3RvdHlwZSA9IHRoaXNcbiAgcmV0dXJuIG5ldyBGXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHsgdGltZTogdGltZV9mb3JtYXQsIGRhdGU6IGZvcm1hdCwgRGF0ZUZvcm1hdDogRGF0ZUZvcm1hdCB9XG5cbnRyeSB7IHJlcXVpcmUoJ3R6JykgfSBjYXRjaChlKSB7IH1cblxuZnVuY3Rpb24gY2FwZmlyc3QgKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoL14oLnsxfSkvLCBmdW5jdGlvbihhLCBtKSB7IHJldHVybiBtLnRvVXBwZXJDYXNlKCkgfSlcbn1cblxuZnVuY3Rpb24gbWFwIChhcnIsIGl0ZXIpIHtcbiAgdmFyIG91dCA9IFtdXG4gIGZvcih2YXIgaSA9IDAsIGxlbiA9IGFyci5sZW5ndGg7IGkgPCBsZW47ICsraSlcbiAgICBvdXQucHVzaChpdGVyKGFycltpXSwgaSwgYXJyKSlcbiAgcmV0dXJuIG91dFxufVxuXG5mdW5jdGlvbiByZWR1Y2UoYXJyLCBpdGVyLCBzdGFydCkge1xuICBhcnIgPSBhcnIuc2xpY2UoKVxuICBpZihzdGFydCAhPT0gdW5kZWZpbmVkKVxuICAgIGFyci51bnNoaWZ0KHN0YXJ0KVxuXG4gIGlmKGFyci5sZW5ndGggPT09IDApXG4gICAgdGhyb3cgbmV3IEVycm9yKCdyZWR1Y2Ugb2YgZW1wdHkgYXJyYXknKVxuXG4gIGlmKGFyci5sZW5ndGggPT09IDEpXG4gICAgcmV0dXJuIGFyclswXVxuXG4gIHZhciBvdXQgPSBhcnIuc2xpY2UoKVxuICAgICwgaXRlbSA9IGFyci5zaGlmdCgpXG5cbiAgZG8ge1xuICAgIGl0ZW0gPSBpdGVyKGl0ZW0sIGFyci5zaGlmdCgpKVxuICB9IHdoaWxlKGFyci5sZW5ndGgpXG5cbiAgcmV0dXJuIGl0ZW1cbn1cblxuZnVuY3Rpb24gc3RydG9hcnJheShzdHIpIHtcbiAgdmFyIGFyciA9IFtdXG4gIGZvcih2YXIgaSA9IDAsIGxlbiA9IHN0ci5sZW5ndGg7IGkgPCBsZW47ICsraSlcbiAgICBhcnIucHVzaChzdHIuY2hhckF0KGkpKVxuICByZXR1cm4gYXJyXG59XG5cbnZhciBXRUVLREFZUyA9IFsgJ3N1bmRheScsICdtb25kYXknLCAndHVlc2RheScsICd3ZWRuZXNkYXknLCAndGh1cnNkYXknLCAnZnJpZGF5JywgJ3NhdHVyZGF5JyBdXG4gICwgV0VFS0RBWVNfQUJCUiA9IG1hcChXRUVLREFZUywgZnVuY3Rpb24oeCkgeyByZXR1cm4gc3RydG9hcnJheSh4KS5zbGljZSgwLCAzKS5qb2luKCcnKSB9KVxuICAsIFdFRUtEQVlTX1JFViA9IHJlZHVjZShtYXAoV0VFS0RBWVMsIGZ1bmN0aW9uKHgsIGkpIHsgcmV0dXJuIFt4LCBpXSB9KSwgZnVuY3Rpb24obGhzLCByaHMpIHsgbGhzW3Joc1swXV0gPSByaHNbMV07IHJldHVybiBsaHMgfSwge30pXG4gICwgTU9OVEhTID0gWyAnamFudWFyeScsICdmZWJydWFyeScsICdtYXJjaCcsICdhcHJpbCcsICdtYXknLCAnanVuZScsICdqdWx5JywgJ2F1Z3VzdCcsICdzZXB0ZW1iZXInLCAnb2N0b2JlcicsICdub3ZlbWJlcicsICdkZWNlbWJlcicgXVxuICAsIE1PTlRIU18zID0gbWFwKE1PTlRIUywgZnVuY3Rpb24oeCkgeyByZXR1cm4gc3RydG9hcnJheSh4KS5zbGljZSgwLCAzKS5qb2luKCcnKSB9KVxuICAsIE1PTlRIU18zX1JFViA9IHJlZHVjZShtYXAoTU9OVEhTXzMsIGZ1bmN0aW9uKHgsIGkpIHsgcmV0dXJuIFt4LCBpXSB9KSwgZnVuY3Rpb24obGhzLCByaHMpIHsgbGhzW3Joc1swXV0gPSByaHNbMV07IHJldHVybiBsaHMgfSwge30pXG4gICwgTU9OVEhTX0FQID0gW1xuICAgICdKYW4uJ1xuICAsICdGZWIuJ1xuICAsICdNYXJjaCdcbiAgLCAnQXByaWwnXG4gICwgJ01heSdcbiAgLCAnSnVuZSdcbiAgLCAnSnVseSdcbiAgLCAnQXVnLidcbiAgLCAnU2VwdC4nXG4gICwgJ09jdC4nXG4gICwgJ05vdi4nXG4gICwgJ0RlYy4nXG4gIF1cblxuXG52YXIgTU9OVEhTX0FMVCA9IHtcbiAgMTogJ0phbnVhcnknLFxuICAyOiAnRmVicnVhcnknLFxuICAzOiAnTWFyY2gnLFxuICA0OiAnQXByaWwnLFxuICA1OiAnTWF5JyxcbiAgNjogJ0p1bmUnLFxuICA3OiAnSnVseScsXG4gIDg6ICdBdWd1c3QnLFxuICA5OiAnU2VwdGVtYmVyJyxcbiAgMTA6ICdPY3RvYmVyJyxcbiAgMTE6ICdOb3ZlbWJlcicsXG4gIDEyOiAnRGVjZW1iZXInXG59XG5cbmZ1bmN0aW9uIEZvcm1hdHRlcih0KSB7XG4gIHRoaXMuZGF0YSA9IHRcbn1cblxuRm9ybWF0dGVyLnByb3RvdHlwZS5mb3JtYXQgPSBmdW5jdGlvbihzdHIpIHtcbiAgdmFyIGJpdHMgPSBzdHJ0b2FycmF5KHN0cilcbiAgLCBlc2MgPSBmYWxzZVxuICAsIG91dCA9IFtdXG4gICwgYml0XG5cbiAgd2hpbGUoYml0cy5sZW5ndGgpIHtcbiAgICBiaXQgPSBiaXRzLnNoaWZ0KClcblxuICAgIGlmKGVzYykge1xuICAgICAgb3V0LnB1c2goYml0KVxuICAgICAgZXNjID0gZmFsc2VcbiAgICB9IGVsc2UgaWYoYml0ID09PSAnXFxcXCcpIHtcbiAgICAgIGVzYyA9IHRydWVcbiAgICB9IGVsc2UgaWYodGhpc1tiaXRdKSB7XG4gICAgICBvdXQucHVzaCh0aGlzW2JpdF0oKSlcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0LnB1c2goYml0KVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvdXQuam9pbignJylcbn1cblxuZnVuY3Rpb24gVGltZUZvcm1hdCh0KSB7XG4gIEZvcm1hdHRlci5jYWxsKHRoaXMsIHQpXG59XG5cbnZhciBwcm90byA9IFRpbWVGb3JtYXQucHJvdG90eXBlID0gbmV3IEZvcm1hdHRlcigpXG5cbnByb3RvLmEgPSBmdW5jdGlvbigpIHtcbiAgLy8gJ2EubS4nIG9yICdwLm0uJ1xuICBpZiAodGhpcy5kYXRhLmdldEhvdXJzKCkgPiAxMSlcbiAgICByZXR1cm4gJ3AubS4nXG4gIHJldHVybiAnYS5tLidcbn1cblxucHJvdG8uQSA9IGZ1bmN0aW9uKCkge1xuICAvLyAnQU0nIG9yICdQTSdcbiAgaWYgKHRoaXMuZGF0YS5nZXRIb3VycygpID4gMTEpXG4gICAgcmV0dXJuICdQTSdcbiAgcmV0dXJuICdBTSdcbn1cblxucHJvdG8uZiA9IGZ1bmN0aW9uKCkge1xuICAvKlxuICBUaW1lLCBpbiAxMi1ob3VyIGhvdXJzIGFuZCBtaW51dGVzLCB3aXRoIG1pbnV0ZXMgbGVmdCBvZmYgaWYgdGhleSdyZVxuICB6ZXJvLlxuICBFeGFtcGxlczogJzEnLCAnMTozMCcsICcyOjA1JywgJzInXG4gIFByb3ByaWV0YXJ5IGV4dGVuc2lvbi5cbiAgKi9cbiAgaWYgKHRoaXMuZGF0YS5nZXRNaW51dGVzKCkgPT0gMClcbiAgICByZXR1cm4gdGhpcy5nKClcbiAgcmV0dXJuIHRoaXMuZygpICsgXCI6XCIgKyB0aGlzLmkoKVxufVxuXG5wcm90by5nID0gZnVuY3Rpb24oKSB7XG4gIC8vIEhvdXIsIDEyLWhvdXIgZm9ybWF0IHdpdGhvdXQgbGVhZGluZyB6ZXJvcyBpLmUuICcxJyB0byAnMTInXG4gIHZhciBoID0gdGhpcy5kYXRhLmdldEhvdXJzKClcblxuICByZXR1cm4gdGhpcy5kYXRhLmdldEhvdXJzKCkgJSAxMiB8fCAxMlxufVxuXG5wcm90by5HID0gZnVuY3Rpb24oKSB7XG4gIC8vIEhvdXIsIDI0LWhvdXIgZm9ybWF0IHdpdGhvdXQgbGVhZGluZyB6ZXJvcyBpLmUuICcwJyB0byAnMjMnXG4gIHJldHVybiB0aGlzLmRhdGEuZ2V0SG91cnMoKVxufVxuXG5wcm90by5oID0gZnVuY3Rpb24oKSB7XG4gIC8vIEhvdXIsIDEyLWhvdXIgZm9ybWF0IGkuZS4gJzAxJyB0byAnMTInXG4gIHJldHVybiAoJzAnK3RoaXMuZygpKS5zbGljZSgtMilcbn1cblxucHJvdG8uSCA9IGZ1bmN0aW9uKCkge1xuICAvLyBIb3VyLCAyNC1ob3VyIGZvcm1hdCBpLmUuICcwMCcgdG8gJzIzJ1xuICByZXR1cm4gKCcwJyt0aGlzLkcoKSkuc2xpY2UoLTIpXG59XG5cbnByb3RvLmkgPSBmdW5jdGlvbigpIHtcbiAgLy8gTWludXRlcyBpLmUuICcwMCcgdG8gJzU5J1xuICByZXR1cm4gKCcwJyArIHRoaXMuZGF0YS5nZXRNaW51dGVzKCkpLnNsaWNlKC0yKVxufVxuXG5wcm90by5QID0gZnVuY3Rpb24oKSB7XG4gIC8qXG4gIFRpbWUsIGluIDEyLWhvdXIgaG91cnMsIG1pbnV0ZXMgYW5kICdhLm0uJy8ncC5tLicsIHdpdGggbWludXRlcyBsZWZ0IG9mZlxuICBpZiB0aGV5J3JlIHplcm8gYW5kIHRoZSBzdHJpbmdzICdtaWRuaWdodCcgYW5kICdub29uJyBpZiBhcHByb3ByaWF0ZS5cbiAgRXhhbXBsZXM6ICcxIGEubS4nLCAnMTozMCBwLm0uJywgJ21pZG5pZ2h0JywgJ25vb24nLCAnMTI6MzAgcC5tLidcbiAgUHJvcHJpZXRhcnkgZXh0ZW5zaW9uLlxuICAqL1xuICB2YXIgbSA9IHRoaXMuZGF0YS5nZXRNaW51dGVzKClcbiAgICAsIGggPSB0aGlzLmRhdGEuZ2V0SG91cnMoKVxuXG4gIGlmIChtID09IDAgJiYgaCA9PSAwKVxuICAgIHJldHVybiAnbWlkbmlnaHQnXG4gIGlmIChtID09IDAgJiYgaCA9PSAxMilcbiAgICByZXR1cm4gJ25vb24nXG4gIHJldHVybiB0aGlzLmYoKSArIFwiIFwiICsgdGhpcy5hKClcbn1cblxucHJvdG8ucyA9IGZ1bmN0aW9uKCkge1xuICAvLyBTZWNvbmRzIGkuZS4gJzAwJyB0byAnNTknXG4gIHJldHVybiAoJzAnK3RoaXMuZGF0YS5nZXRTZWNvbmRzKCkpLnNsaWNlKC0yKVxufVxuXG5wcm90by51ID0gZnVuY3Rpb24oKSB7XG4gIC8vIE1pY3Jvc2Vjb25kc1xuICByZXR1cm4gdGhpcy5kYXRhLmdldE1pbGxpc2Vjb25kcygpXG59XG5cbi8vIERhdGVGb3JtYXRcblxuZnVuY3Rpb24gRGF0ZUZvcm1hdCh0KSB7XG4gIHRoaXMuZGF0YSA9IHRcbiAgdGhpcy55ZWFyX2RheXMgPSBbMCwgMzEsIDU5LCA5MCwgMTIwLCAxNTEsIDE4MSwgMjEyLCAyNDMsIDI3MywgMzA0LCAzMzRdXG59XG5cbnByb3RvID0gRGF0ZUZvcm1hdC5wcm90b3R5cGUgPSBuZXcgVGltZUZvcm1hdCgpXG5cbnByb3RvLmNvbnRydWN0b3IgPSBEYXRlRm9ybWF0XG5cbnByb3RvLmIgPSBmdW5jdGlvbigpIHtcbiAgLy8gTW9udGgsIHRleHR1YWwsIDMgbGV0dGVycywgbG93ZXJjYXNlIGUuZy4gJ2phbidcbiAgcmV0dXJuIE1PTlRIU18zW3RoaXMuZGF0YS5nZXRNb250aCgpXVxufVxuXG5wcm90by5jPSBmdW5jdGlvbigpIHtcbiAgLypcbiAgSVNPIDg2MDEgRm9ybWF0XG4gIEV4YW1wbGUgOiAnMjAwOC0wMS0wMlQxMDozMDowMC4wMDAxMjMnXG4gICovXG4gIHJldHVybiB0aGlzLmRhdGEudG9JU09TdHJpbmcgPyB0aGlzLmRhdGEudG9JU09TdHJpbmcoKSA6ICcnXG59XG5cbnByb3RvLmQgPSBmdW5jdGlvbigpIHtcbiAgLy8gRGF5IG9mIHRoZSBtb250aCwgMiBkaWdpdHMgd2l0aCBsZWFkaW5nIHplcm9zIGkuZS4gJzAxJyB0byAnMzEnXG4gIHJldHVybiAoJzAnK3RoaXMuZGF0YS5nZXREYXRlKCkpLnNsaWNlKC0yKVxufVxuXG5wcm90by5EID0gZnVuY3Rpb24oKSB7XG4gIC8vIERheSBvZiB0aGUgd2VlaywgdGV4dHVhbCwgMyBsZXR0ZXJzIGUuZy4gJ0ZyaSdcbiAgcmV0dXJuIGNhcGZpcnN0KFdFRUtEQVlTX0FCQlJbdGhpcy5kYXRhLmdldERheSgpXSlcbn1cblxucHJvdG8uRSA9IGZ1bmN0aW9uKCkge1xuICAvLyBBbHRlcm5hdGl2ZSBtb250aCBuYW1lcyBhcyByZXF1aXJlZCBieSBzb21lIGxvY2FsZXMuIFByb3ByaWV0YXJ5IGV4dGVuc2lvbi5cbiAgcmV0dXJuIE1PTlRIU19BTFRbdGhpcy5kYXRhLmdldE1vbnRoKCkrMV1cbn1cblxucHJvdG8uRj0gZnVuY3Rpb24oKSB7XG4gIC8vIE1vbnRoLCB0ZXh0dWFsLCBsb25nIGUuZy4gJ0phbnVhcnknXG4gIHJldHVybiBjYXBmaXJzdChNT05USFNbdGhpcy5kYXRhLmdldE1vbnRoKCldKVxufVxuXG5wcm90by5JID0gZnVuY3Rpb24oKSB7XG4gIC8vICcxJyBpZiBEYXlsaWdodCBTYXZpbmdzIFRpbWUsICcwJyBvdGhlcndpc2UuXG4gIHJldHVybiB0aGlzLmRhdGEuaXNEU1QoKSA/ICcxJyA6ICcwJ1xufVxuXG5wcm90by5qID0gZnVuY3Rpb24oKSB7XG4gIC8vIERheSBvZiB0aGUgbW9udGggd2l0aG91dCBsZWFkaW5nIHplcm9zIGkuZS4gJzEnIHRvICczMSdcbiAgcmV0dXJuIHRoaXMuZGF0YS5nZXREYXRlKClcbn1cblxucHJvdG8ubCA9IGZ1bmN0aW9uKCkge1xuICAvLyBEYXkgb2YgdGhlIHdlZWssIHRleHR1YWwsIGxvbmcgZS5nLiAnRnJpZGF5J1xuICByZXR1cm4gY2FwZmlyc3QoV0VFS0RBWVNbdGhpcy5kYXRhLmdldERheSgpXSlcbn1cblxucHJvdG8uTCA9IGZ1bmN0aW9uKCkge1xuICAvLyBCb29sZWFuIGZvciB3aGV0aGVyIGl0IGlzIGEgbGVhcCB5ZWFyIGkuZS4gVHJ1ZSBvciBGYWxzZVxuICAvLyBTZWxlY3RzIHRoaXMgeWVhcidzIEZlYnJ1YXJ5IDI5dGggYW5kIGNoZWNrcyBpZiB0aGUgbW9udGhcbiAgLy8gaXMgc3RpbGwgRmVicnVhcnkuXG4gIHJldHVybiAobmV3IERhdGUodGhpcy5kYXRhLmdldEZ1bGxZZWFyKCksIDEsIDI5KS5nZXRNb250aCgpKSA9PT0gMVxufVxuXG5wcm90by5tID0gZnVuY3Rpb24oKSB7XG4gIC8vIE1vbnRoIGkuZS4gJzAxJyB0byAnMTInXCJcbiAgcmV0dXJuICgnMCcrKHRoaXMuZGF0YS5nZXRNb250aCgpKzEpKS5zbGljZSgtMilcbn1cblxucHJvdG8uTSA9IGZ1bmN0aW9uKCkge1xuICAvLyBNb250aCwgdGV4dHVhbCwgMyBsZXR0ZXJzIGUuZy4gJ0phbidcbiAgcmV0dXJuIGNhcGZpcnN0KE1PTlRIU18zW3RoaXMuZGF0YS5nZXRNb250aCgpXSlcbn1cblxucHJvdG8ubiA9IGZ1bmN0aW9uKCkge1xuICAvLyBNb250aCB3aXRob3V0IGxlYWRpbmcgemVyb3MgaS5lLiAnMScgdG8gJzEyJ1xuICByZXR1cm4gdGhpcy5kYXRhLmdldE1vbnRoKCkgKyAxXG59XG5cbnByb3RvLk4gPSBmdW5jdGlvbigpIHtcbiAgLy8gTW9udGggYWJicmV2aWF0aW9uIGluIEFzc29jaWF0ZWQgUHJlc3Mgc3R5bGUuIFByb3ByaWV0YXJ5IGV4dGVuc2lvbi5cbiAgcmV0dXJuIE1PTlRIU19BUFt0aGlzLmRhdGEuZ2V0TW9udGgoKV1cbn1cblxucHJvdG8uTyA9IGZ1bmN0aW9uKCkge1xuICAvLyBEaWZmZXJlbmNlIHRvIEdyZWVud2ljaCB0aW1lIGluIGhvdXJzIGUuZy4gJyswMjAwJ1xuXG4gIHZhciB0em9mZnMgPSB0aGlzLmRhdGEuZ2V0VGltZXpvbmVPZmZzZXQoKVxuICAgICwgb2ZmcyA9IH5+KHR6b2ZmcyAvIDYwKVxuICAgICwgbWlucyA9ICgnMDAnICsgfn5NYXRoLmFicyh0em9mZnMgJSA2MCkpLnNsaWNlKC0yKVxuXG4gIHJldHVybiAoKHR6b2ZmcyA+IDApID8gJy0nIDogJysnKSArICgnMDAnICsgTWF0aC5hYnMob2ZmcykpLnNsaWNlKC0yKSArIG1pbnNcbn1cblxucHJvdG8uciA9IGZ1bmN0aW9uKCkge1xuICAvLyBSRkMgMjgyMiBmb3JtYXR0ZWQgZGF0ZSBlLmcuICdUaHUsIDIxIERlYyAyMDAwIDE2OjAxOjA3ICswMjAwJ1xuICByZXR1cm4gdGhpcy5mb3JtYXQoJ0QsIGogTSBZIEg6aTpzIE8nKVxufVxuXG5wcm90by5TID0gZnVuY3Rpb24oKSB7XG4gIC8qIEVuZ2xpc2ggb3JkaW5hbCBzdWZmaXggZm9yIHRoZSBkYXkgb2YgdGhlIG1vbnRoLCAyIGNoYXJhY3RlcnMgaS5lLiAnc3QnLCAnbmQnLCAncmQnIG9yICd0aCcgKi9cbiAgdmFyIGQgPSB0aGlzLmRhdGEuZ2V0RGF0ZSgpXG5cbiAgaWYgKGQgPj0gMTEgJiYgZCA8PSAxMylcbiAgICByZXR1cm4gJ3RoJ1xuICB2YXIgbGFzdCA9IGQgJSAxMFxuXG4gIGlmIChsYXN0ID09IDEpXG4gICAgcmV0dXJuICdzdCdcbiAgaWYgKGxhc3QgPT0gMilcbiAgICByZXR1cm4gJ25kJ1xuICBpZiAobGFzdCA9PSAzKVxuICAgIHJldHVybiAncmQnXG4gIHJldHVybiAndGgnXG59XG5cbnByb3RvLnQgPSBmdW5jdGlvbigpIHtcbiAgLy8gTnVtYmVyIG9mIGRheXMgaW4gdGhlIGdpdmVuIG1vbnRoIGkuZS4gJzI4JyB0byAnMzEnXG4gIC8vIFVzZSBhIGphdmFzY3JpcHQgdHJpY2sgdG8gZGV0ZXJtaW5lIHRoZSBkYXlzIGluIGEgbW9udGhcbiAgcmV0dXJuIDMyIC0gbmV3IERhdGUodGhpcy5kYXRhLmdldEZ1bGxZZWFyKCksIHRoaXMuZGF0YS5nZXRNb250aCgpLCAzMikuZ2V0RGF0ZSgpXG59XG5cbnByb3RvLlQgPSBmdW5jdGlvbigpIHtcbiAgLy8gVGltZSB6b25lIG9mIHRoaXMgbWFjaGluZSBlLmcuICdFU1QnIG9yICdNRFQnXG4gIGlmKHRoaXMuZGF0YS50emluZm8pIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLnR6aW5mbygpLmFiYnIgfHwgJz8/PydcbiAgfVxuICByZXR1cm4gJz8/Pydcbn1cblxucHJvdG8uVSA9IGZ1bmN0aW9uKCkge1xuICAvLyBTZWNvbmRzIHNpbmNlIHRoZSBVbml4IGVwb2NoIChKYW51YXJ5IDEgMTk3MCAwMDowMDowMCBHTVQpXG4gIC8vIFVUQygpIHJldHVybiBtaWxsaXNlY29uZHMgZnJtbyB0aGUgZXBvY2hcbiAgLy8gcmV0dXJuIE1hdGgucm91bmQodGhpcy5kYXRhLlVUQygpICogMTAwMClcbiAgcmV0dXJuIH5+KHRoaXMuZGF0YSAvIDEwMDApXG59XG5cbnByb3RvLncgPSBmdW5jdGlvbigpIHtcbiAgLy8gRGF5IG9mIHRoZSB3ZWVrLCBudW1lcmljLCBpLmUuICcwJyAoU3VuZGF5KSB0byAnNicgKFNhdHVyZGF5KVxuICByZXR1cm4gdGhpcy5kYXRhLmdldERheSgpXG59XG5cbnByb3RvLlcgPSBmdW5jdGlvbigpIHtcbiAgLy8gSVNPLTg2MDEgd2VlayBudW1iZXIgb2YgeWVhciwgd2Vla3Mgc3RhcnRpbmcgb24gTW9uZGF5XG4gIC8vIEFsZ29yaXRobSBmcm9tIGh0dHA6Ly93d3cucGVyc29uYWwuZWN1LmVkdS9tY2NhcnR5ci9JU093ZEFMRy50eHRcbiAgdmFyIGphbjFfd2Vla2RheSA9IG5ldyBEYXRlKHRoaXMuZGF0YS5nZXRGdWxsWWVhcigpLCAwLCAxKS5nZXREYXkoKVxuICAgICwgd2Vla2RheSA9IHRoaXMuZGF0YS5nZXREYXkoKVxuICAgICwgZGF5X29mX3llYXIgPSB0aGlzLnooKVxuICAgICwgd2Vla19udW1iZXJcbiAgICAsIGkgPSAzNjVcblxuICBpZihkYXlfb2ZfeWVhciA8PSAoOCAtIGphbjFfd2Vla2RheSkgJiYgamFuMV93ZWVrZGF5ID4gNCkge1xuICAgIGlmKGphbjFfd2Vla2RheSA9PT0gNSB8fCAoamFuMV93ZWVrZGF5ID09PSA2ICYmIHRoaXMuTC5jYWxsKHtkYXRhOm5ldyBEYXRlKHRoaXMuZGF0YS5nZXRGdWxsWWVhcigpLTEsIDAsIDEpfSkpKSB7XG4gICAgICB3ZWVrX251bWJlciA9IDUzXG4gICAgfSBlbHNlIHtcbiAgICAgIHdlZWtfbnVtYmVyID0gNTJcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYodGhpcy5MKCkpIHtcbiAgICAgIGkgPSAzNjZcbiAgICB9XG4gICAgaWYoKGkgLSBkYXlfb2ZfeWVhcikgPCAoNCAtIHdlZWtkYXkpKSB7XG4gICAgICB3ZWVrX251bWJlciA9IDFcbiAgICB9IGVsc2Uge1xuICAgICAgd2Vla19udW1iZXIgPSB+figoZGF5X29mX3llYXIgKyAoNyAtIHdlZWtkYXkpICsgKGphbjFfd2Vla2RheSAtIDEpKSAvIDcpXG4gICAgICBpZihqYW4xX3dlZWtkYXkgPiA0KVxuICAgICAgICB3ZWVrX251bWJlciAtPSAxXG4gICAgfVxuICB9XG4gIHJldHVybiB3ZWVrX251bWJlclxufVxuXG5wcm90by55ID0gZnVuY3Rpb24oKSB7XG4gIC8vIFllYXIsIDIgZGlnaXRzIGUuZy4gJzk5J1xuICByZXR1cm4gKCcnK3RoaXMuZGF0YS5nZXRGdWxsWWVhcigpKS5zbGljZSgtMilcbn1cblxucHJvdG8uWSA9IGZ1bmN0aW9uKCkge1xuICAvLyBZZWFyLCA0IGRpZ2l0cyBlLmcuICcxOTk5J1xuICByZXR1cm4gdGhpcy5kYXRhLmdldEZ1bGxZZWFyKClcbn1cblxucHJvdG8ueiA9IGZ1bmN0aW9uKCkge1xuICAvLyBEYXkgb2YgdGhlIHllYXIgaS5lLiAnMCcgdG8gJzM2NSdcblxuICBkb3kgPSB0aGlzLnllYXJfZGF5c1t0aGlzLmRhdGEuZ2V0TW9udGgoKV0gKyB0aGlzLmRhdGEuZ2V0RGF0ZSgpXG4gIGlmICh0aGlzLkwoKSAmJiB0aGlzLmRhdGEuZ2V0TW9udGgoKSA+IDEpXG4gICAgZG95ICs9IDFcbiAgcmV0dXJuIGRveVxufVxuXG5wcm90by5aID0gZnVuY3Rpb24oKSB7XG4gIC8qXG4gIFRpbWUgem9uZSBvZmZzZXQgaW4gc2Vjb25kcyAoaS5lLiAnLTQzMjAwJyB0byAnNDMyMDAnKS4gVGhlIG9mZnNldCBmb3JcbiAgdGltZXpvbmVzIHdlc3Qgb2YgVVRDIGlzIGFsd2F5cyBuZWdhdGl2ZSwgYW5kIGZvciB0aG9zZSBlYXN0IG9mIFVUQyBpc1xuICBhbHdheXMgcG9zaXRpdmUuXG4gICovXG4gIHJldHVybiB0aGlzLmRhdGEuZ2V0VGltZXpvbmVPZmZzZXQoKSAqIC02MFxufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdCh2YWx1ZSwgZm9ybWF0X3N0cmluZykge1xuICB2YXIgZGYgPSBuZXcgRGF0ZUZvcm1hdCh2YWx1ZSlcbiAgcmV0dXJuIGRmLmZvcm1hdChmb3JtYXRfc3RyaW5nKVxufVxuXG5cbmZ1bmN0aW9uIHRpbWVfZm9ybWF0KHZhbHVlLCBmb3JtYXRfc3RyaW5nKSB7XG4gIHZhciB0ZiA9IG5ldyBUaW1lRm9ybWF0KHZhbHVlKVxuICByZXR1cm4gdGYuZm9ybWF0KGZvcm1hdF9zdHJpbmcpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBsb2c6IGZ1bmN0aW9uKHZhbHVlKSB7IGNvbnNvbGUubG9nKHZhbHVlKSB9XG4gICwgZXJyb3I6IGZ1bmN0aW9uKGVycikgeyBjb25zb2xlLmVycm9yKGVyciwgZXJyICYmIGVyci5zdGFjaykgfVxuICAsIGluZm86IGZ1bmN0aW9uKHZhbHVlKSB7IH1cbn1cbiIsInZhciBMaWJyYXJ5ID0gcmVxdWlyZSgnLi9saWJyYXJ5JylcblxubW9kdWxlLmV4cG9ydHMgPSBEZWZhdWx0RmlsdGVyc1xuXG5mdW5jdGlvbiBEZWZhdWx0RmlsdGVycygpIHtcbiAgTGlicmFyeS5jYWxsKHRoaXMsIHRoaXMuYnVpbHRpbnMpXG59XG5cbnZhciBjb25zID0gRGVmYXVsdEZpbHRlcnNcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlID0gbmV3IExpYnJhcnlcblxucHJvdG8uY29uc3RydWN0b3IgPSBjb25zXG5cbnByb3RvLmJ1aWx0aW5zID0ge1xuICAgICdhZGQnOiByZXF1aXJlKCcuL2ZpbHRlcnMvYWRkJylcbiAgLCAnYWRkc2xhc2hlcyc6IHJlcXVpcmUoJy4vZmlsdGVycy9hZGRzbGFzaGVzJylcbiAgLCAnY2FwZmlyc3QnOiByZXF1aXJlKCcuL2ZpbHRlcnMvY2FwZmlyc3QnKVxuICAsICdjZW50ZXInOiByZXF1aXJlKCcuL2ZpbHRlcnMvY2VudGVyJylcbiAgLCAnY3V0JzogcmVxdWlyZSgnLi9maWx0ZXJzL2N1dCcpXG4gICwgJ2RhdGUnOiByZXF1aXJlKCcuL2ZpbHRlcnMvZGF0ZScpXG4gICwgJ2RlZmF1bHQnOiByZXF1aXJlKCcuL2ZpbHRlcnMvZGVmYXVsdCcpXG4gICwgJ2RpY3Rzb3J0JzogcmVxdWlyZSgnLi9maWx0ZXJzL2RpY3Rzb3J0JylcbiAgLCAnZGljdHNvcnRyZXZlcnNlZCc6IHJlcXVpcmUoJy4vZmlsdGVycy9kaWN0c29ydHJldmVyc2VkJylcbiAgLCAnZGl2aXNpYmxlYnknOiByZXF1aXJlKCcuL2ZpbHRlcnMvZGl2aXNpYmxlYnknKVxuICAsICdlc2NhcGUnOiByZXF1aXJlKCcuL2ZpbHRlcnMvZXNjYXBlJylcbiAgLCAnZmlsZXNpemVmb3JtYXQnOiByZXF1aXJlKCcuL2ZpbHRlcnMvZmlsZXNpemVmb3JtYXQnKVxuICAsICdmaXJzdCc6IHJlcXVpcmUoJy4vZmlsdGVycy9maXJzdCcpXG4gICwgJ2Zsb2F0Zm9ybWF0JzogcmVxdWlyZSgnLi9maWx0ZXJzL2Zsb2F0Zm9ybWF0JylcbiAgLCAnZm9yY2VfZXNjYXBlJzogcmVxdWlyZSgnLi9maWx0ZXJzL2ZvcmNlX2VzY2FwZScpXG4gICwgJ2dldF9kaWdpdCc6IHJlcXVpcmUoJy4vZmlsdGVycy9nZXRfZGlnaXQnKVxuICAsICdpbmRleCc6IHJlcXVpcmUoJy4vZmlsdGVycy9pbmRleCcpXG4gICwgJ2l0ZXJpdGVtcyc6IHJlcXVpcmUoJy4vZmlsdGVycy9pdGVyaXRlbXMnKVxuICAsICdpcmllbmNvZGUnOiByZXF1aXJlKCcuL2ZpbHRlcnMvaXJpZW5jb2RlJylcbiAgLCAnam9pbic6IHJlcXVpcmUoJy4vZmlsdGVycy9qb2luJylcbiAgLCAnbGFzdCc6IHJlcXVpcmUoJy4vZmlsdGVycy9sYXN0JylcbiAgLCAnbGVuZ3RoJzogcmVxdWlyZSgnLi9maWx0ZXJzL2xlbmd0aCcpXG4gICwgJ2xlbmd0aF9pcyc6IHJlcXVpcmUoJy4vZmlsdGVycy9sZW5ndGhfaXMnKVxuICAsICdsaW5lYnJlYWtzJzogcmVxdWlyZSgnLi9maWx0ZXJzL2xpbmVicmVha3MnKVxuICAsICdsaW5lYnJlYWtzYnInOiByZXF1aXJlKCcuL2ZpbHRlcnMvbGluZWJyZWFrc2JyJylcbiAgLCAnbGluZW51bWJlcnMnOiByZXF1aXJlKCcuL2ZpbHRlcnMvbGluZW51bWJlcnMnKVxuICAsICdsanVzdCc6IHJlcXVpcmUoJy4vZmlsdGVycy9sanVzdCcpXG4gICwgJ2xvd2VyJzogcmVxdWlyZSgnLi9maWx0ZXJzL2xvd2VyJylcbiAgLCAnbWFrZV9saXN0JzogcmVxdWlyZSgnLi9maWx0ZXJzL21ha2VfbGlzdCcpXG4gICwgJ3Bob25lMm51bWVyaWMnOiByZXF1aXJlKCcuL2ZpbHRlcnMvcGhvbmUybnVtZXJpYycpXG4gICwgJ3BsdXJhbGl6ZSc6IHJlcXVpcmUoJy4vZmlsdGVycy9wbHVyYWxpemUnKVxuICAsICdyYW5kb20nOiByZXF1aXJlKCcuL2ZpbHRlcnMvcmFuZG9tJylcbiAgLCAncmp1c3QnOiByZXF1aXJlKCcuL2ZpbHRlcnMvcmp1c3QnKVxuICAsICdzYWZlJzogcmVxdWlyZSgnLi9maWx0ZXJzL3NhZmUnKVxuICAsICdzbGljZSc6IHJlcXVpcmUoJy4vZmlsdGVycy9zbGljZScpXG4gICwgJ3NsdWdpZnknOiByZXF1aXJlKCcuL2ZpbHRlcnMvc2x1Z2lmeScpXG4gICwgJ3NwbGl0JzogcmVxdWlyZSgnLi9maWx0ZXJzL3NwbGl0JylcbiAgLCAnc3RyaXB0YWdzJzogcmVxdWlyZSgnLi9maWx0ZXJzL3N0cmlwdGFncycpXG4gICwgJ3RpbWVzaW5jZSc6IHJlcXVpcmUoJy4vZmlsdGVycy90aW1lc2luY2UnKVxuICAsICd0aW1ldW50aWwnOiByZXF1aXJlKCcuL2ZpbHRlcnMvdGltZXVudGlsJylcbiAgLCAndGl0bGUnOiByZXF1aXJlKCcuL2ZpbHRlcnMvdGl0bGUnKVxuICAsICd0cnVuY2F0ZWNoYXJzJzogcmVxdWlyZSgnLi9maWx0ZXJzL3RydW5jYXRlY2hhcnMnKVxuICAsICd0cnVuY2F0ZXdvcmRzJzogcmVxdWlyZSgnLi9maWx0ZXJzL3RydW5jYXRld29yZHMnKVxuICAsICd1bm9yZGVyZWRfbGlzdCc6IHJlcXVpcmUoJy4vZmlsdGVycy91bm9yZGVyZWRfbGlzdCcpXG4gICwgJ3VwcGVyJzogcmVxdWlyZSgnLi9maWx0ZXJzL3VwcGVyJylcbiAgLCAndXJsZW5jb2RlJzogcmVxdWlyZSgnLi9maWx0ZXJzL3VybGVuY29kZScpXG4gICwgJ3VybGl6ZSc6IHJlcXVpcmUoJy4vZmlsdGVycy91cmxpemUnKVxuICAsICd1cmxpemV0cnVuYyc6IHJlcXVpcmUoJy4vZmlsdGVycy91cmxpemV0cnVuYycpXG4gICwgJ3dvcmRjb3VudCc6IHJlcXVpcmUoJy4vZmlsdGVycy93b3JkY291bnQnKVxuICAsICd3b3Jkd3JhcCc6IHJlcXVpcmUoJy4vZmlsdGVycy93b3Jkd3JhcCcpXG4gICwgJ3llc25vJzogcmVxdWlyZSgnLi9maWx0ZXJzL3llc25vJylcbn1cblxuIiwidmFyIExpYnJhcnkgPSByZXF1aXJlKCcuL2xpYnJhcnknKVxuXG5tb2R1bGUuZXhwb3J0cyA9IERlZmF1bHRUYWdzXG5cbmZ1bmN0aW9uIERlZmF1bHRUYWdzKCkge1xuICBMaWJyYXJ5LmNhbGwodGhpcywgdGhpcy5idWlsdGlucylcbn1cblxudmFyIGNvbnMgPSBEZWZhdWx0VGFnc1xuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGUgPSBuZXcgTGlicmFyeVxuXG5wcm90by5jb25zdHJ1Y3RvciA9IGNvbnNcblxucHJvdG8uYnVpbHRpbnMgPSB7XG4gICAgJ2Jsb2NrJzogcmVxdWlyZSgnLi90YWdzL2Jsb2NrJykucGFyc2VcbiAgLCAnY29tbWVudCc6IHJlcXVpcmUoJy4vdGFncy9jb21tZW50JykucGFyc2VcbiAgLCAnZGVidWcnOiByZXF1aXJlKCcuL3RhZ3MvZGVidWcnKS5wYXJzZVxuICAsICdleHRlbmRzJzogcmVxdWlyZSgnLi90YWdzL2V4dGVuZHMnKS5wYXJzZVxuICAsICdmb3InOiByZXF1aXJlKCcuL3RhZ3MvZm9yJykucGFyc2VcbiAgLCAnaWYnOiByZXF1aXJlKCcuL3RhZ3MvaWYvbm9kZScpLnBhcnNlXG4gICwgJ2luY2x1ZGUnOiByZXF1aXJlKCcuL3RhZ3MvaW5jbHVkZScpLnBhcnNlXG4gICwgJ25vdyc6IHJlcXVpcmUoJy4vdGFncy9ub3cnKS5wYXJzZVxuICAsICd3aXRoJzogcmVxdWlyZSgnLi90YWdzL3dpdGgnKS5wYXJzZVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBGaWx0ZXJBcHBsaWNhdGlvblxuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJy4vcHJvbWlzZScpXG5cbmZ1bmN0aW9uIEZpbHRlckFwcGxpY2F0aW9uKG5hbWUsIGJpdHMpIHtcbiAgdGhpcy5uYW1lID0gbmFtZVxuICB0aGlzLmFyZ3MgPSBiaXRzXG4gIHRoaXMuZmlsdGVyID0gbnVsbFxufVxuXG52YXIgY29ucyA9IEZpbHRlckFwcGxpY2F0aW9uXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by5hdHRhY2ggPSBmdW5jdGlvbihwYXJzZXIpIHtcbiAgdGhpcy5maWx0ZXIgPSBwYXJzZXIuZmlsdGVycy5sb29rdXAodGhpcy5uYW1lKVxufVxuXG5wcm90by5yZXNvbHZlID0gZnVuY3Rpb24oY29udGV4dCwgdmFsdWUsIGZyb21JRFgsIGFyZ1ZhbHVlcykge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgICAsIHByb21pc2VcbiAgICAsIHN0YXJ0ID0gZnJvbUlEWCB8fCAwXG4gICAgLCByZXN1bHRcbiAgICAsIHRtcFxuXG4gIGFyZ1ZhbHVlcyA9IGFyZ1ZhbHVlcyB8fCBbXVxuXG4gIGlmKHZhbHVlICYmIHZhbHVlLmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG4gICAgdmFsdWUub25jZSgnZG9uZScsIGZ1bmN0aW9uKHZhbCkge1xuICAgICAgcHJvbWlzZS5yZXNvbHZlKHNlbGYucmVzb2x2ZShjb250ZXh0LCB2YWwpKVxuICAgIH0pXG5cbiAgICAvLyBzdGFydCBvdmVyIG9uY2Ugd2UndmUgcmVzb2x2ZWQgdGhlIGJhc2UgdmFsdWVcbiAgICByZXR1cm4gcHJvbWlzZVxuICB9XG5cbiAgZm9yKHZhciBpID0gc3RhcnQsIGxlbiA9IHNlbGYuYXJncy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIHZhciBhcmdWYWx1ZSA9IHNlbGYuYXJnc1tpXS5yZXNvbHZlID9cbiAgICAgICAgc2VsZi5hcmdzW2ldLnJlc29sdmUoY29udGV4dCkgOlxuICAgICAgICBzZWxmLmFyZ3NbaV1cblxuICAgIGlmKGFyZ1ZhbHVlID09PSB1bmRlZmluZWQgfHwgYXJnVmFsdWUgPT09IG51bGwpIHtcbiAgICAgIGFyZ1ZhbHVlc1tpXSA9IGFyZ1ZhbHVlXG4gICAgICBjb250aW51ZVxuICAgIH1cblxuICAgIGlmKGFyZ1ZhbHVlLmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgICBwcm9taXNlID0gbmV3IFByb21pc2VcblxuICAgICAgYXJnVmFsdWUub25jZSgnZG9uZScsIGZ1bmN0aW9uKHZhbCkge1xuICAgICAgICBhcmdWYWx1ZXNbaV0gPSB2YWxcbiAgICAgICAgcHJvbWlzZS5yZXNvbHZlKHNlbGYucmVzb2x2ZShcbiAgICAgICAgICAgIGNvbnRleHRcbiAgICAgICAgICAsIHZhbHVlXG4gICAgICAgICAgLCBpXG4gICAgICAgICAgLCBhcmdWYWx1ZXNcbiAgICAgICAgKSlcbiAgICAgIH0pXG5cbiAgICAgIHJldHVybiBwcm9taXNlXG4gICAgfVxuXG4gICAgYXJnVmFsdWVzW2ldID0gYXJnVmFsdWVcbiAgfVxuXG4gIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuICB0bXAgPSBzZWxmLmZpbHRlci5hcHBseShudWxsLCBbdmFsdWVdLmNvbmNhdChhcmdWYWx1ZXMpLmNvbmNhdChbcmVhZHldKSlcblxuICBpZih0bXAgIT09IHVuZGVmaW5lZCkge1xuICAgIHJlc3VsdCA9IHRtcFxuICB9XG5cbiAgaWYocmVzdWx0ID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gcHJvbWlzZVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdFxuXG4gIGZ1bmN0aW9uIHJlYWR5KGVyciwgZGF0YSkge1xuICAgIGlmKHByb21pc2UudHJpZ2dlcilcbiAgICAgIHJldHVybiBwcm9taXNlLnJlc29sdmUoZXJyID8gZXJyIDogZGF0YSlcblxuICAgIHJlc3VsdCA9IGRhdGFcbiAgfVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBGaWx0ZXJDaGFpblxuXG5mdW5jdGlvbiBGaWx0ZXJDaGFpbihiaXRzKSB7XG4gIHRoaXMuYml0cyA9IGJpdHNcbn1cblxudmFyIGNvbnMgPSBGaWx0ZXJDaGFpblxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8uYXR0YWNoID0gZnVuY3Rpb24ocGFyc2VyKSB7XG4gIGZvcih2YXIgaSA9IDAsIGxlbiA9IHRoaXMuYml0cy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIGlmKHRoaXMuYml0c1tpXSAmJiB0aGlzLmJpdHNbaV0uYXR0YWNoKSB7XG4gICAgICB0aGlzLmJpdHNbaV0uYXR0YWNoKHBhcnNlcilcbiAgICB9XG4gIH1cbn1cblxucHJvdG8ucmVzb2x2ZSA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgdmFyIHJlc3VsdCA9IHRoaXMuYml0c1swXS5yZXNvbHZlID9cbiAgICAgIHRoaXMuYml0c1swXS5yZXNvbHZlKGNvbnRleHQpIDpcbiAgICAgIHRoaXMuYml0c1swXVxuXG4gIGZvcih2YXIgaSA9IDEsIGxlbiA9IHRoaXMuYml0cy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIHJlc3VsdCA9IHRoaXMuYml0c1tpXS5yZXNvbHZlKGNvbnRleHQsIHJlc3VsdClcbiAgfVxuXG4gIHJldHVybiByZXN1bHRcbn1cblxuIiwibW9kdWxlLmV4cG9ydHMgPSBGaWx0ZXJMb29rdXBcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCcuL3Byb21pc2UnKVxuXG5mdW5jdGlvbiBGaWx0ZXJMb29rdXAoYml0cykge1xuICB0aGlzLmJpdHMgPSBiaXRzXG59XG5cbnZhciBjb25zID0gRmlsdGVyTG9va3VwXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by5yZXNvbHZlID0gZnVuY3Rpb24oY29udGV4dCwgZnJvbUlEWCkge1xuICBmcm9tSURYID0gZnJvbUlEWCB8fCAwXG5cbiAgdmFyIHNlbGYgPSB0aGlzXG4gICAgLCBiaXRzID0gc2VsZi5iaXRzXG4gICAgLCBjdXJyZW50ID0gY29udGV4dFxuICAgICwgdGVtcG9yYXJ5ID0gbnVsbFxuICAgICwgcHJvbWlzZVxuICAgICwgcmVzdWx0XG4gICAgLCBuZXh0XG5cbiAgZm9yKHZhciBpID0gZnJvbUlEWCwgbGVuID0gYml0cy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIGlmKGN1cnJlbnQgPT09IHVuZGVmaW5lZCB8fCBjdXJyZW50ID09PSBudWxsKSB7XG4gICAgICBicmVha1xuICAgIH1cblxuICAgIC8vIGZpeCBmb3IgSUU6XG4gICAgaWYoYml0c1tpXSA9PT0gJ3N1cGVyJykge1xuICAgICAgYml0c1tpXSA9ICdfc3VwZXInXG4gICAgfVxuXG4gICAgbmV4dCA9IGN1cnJlbnRbYml0c1tpXV1cblxuICAgIC8vIGNvdWxkIGJlIGFzeW5jLCBjb3VsZCBiZSBzeW5jLlxuICAgIGlmKHR5cGVvZiBuZXh0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBwcm9taXNlID0gbmV3IFByb21pc2VcblxuICAgICAgcHJvbWlzZS5vbmNlKCdkb25lJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB0ZW1wb3JhcnkgPSBkYXRhXG4gICAgICB9KVxuXG4gICAgICBjdXJyZW50ID0gbmV4dC5jYWxsKGN1cnJlbnQsIGZ1bmN0aW9uKGVyciwgZGF0YSkge1xuICAgICAgICBwcm9taXNlLnJlc29sdmUoZXJyID8gbnVsbCA6IHNlbGYucmVzb2x2ZShkYXRhLCBpKzEpKVxuICAgICAgfSlcblxuICAgICAgaWYodGVtcG9yYXJ5ICE9PSBudWxsKVxuICAgICAgICBjdXJyZW50ID0gdGVtcG9yYXJ5XG5cbiAgICAgIHByb21pc2UudHJpZ2dlciA9IHRlbXBvcmFyeSA9IG51bGxcblxuICAgICAgaWYoY3VycmVudCA9PT0gdW5kZWZpbmVkKVxuICAgICAgICByZXR1cm4gcHJvbWlzZVxuXG4gICAgfSBlbHNlIHtcbiAgICAgIGN1cnJlbnQgPSBuZXh0XG4gICAgfVxuXG4gIH1cblxuICByZXR1cm4gY3VycmVudFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBGaWx0ZXJOb2RlXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi9wcm9taXNlJylcbiAgLCBkZWJ1ZyA9IHJlcXVpcmUoJy4vZGVidWcnKVxuXG5mdW5jdGlvbiBGaWx0ZXJOb2RlKGZpbHRlcikge1xuICB0aGlzLmZpbHRlciA9IGZpbHRlclxufVxuXG52YXIgY29ucyA9IEZpbHRlck5vZGVcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbmNvbnMuZXNjYXBlID0gZXNjYXBlSFRNTFxuXG5wcm90by5yZW5kZXIgPSBzYWZlbHkoZnVuY3Rpb24oY29udGV4dCkge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgICAsIHJlc3VsdCA9IHNlbGYuZmlsdGVyLnJlc29sdmUoY29udGV4dClcbiAgICAsIHByb21pc2VcblxuICBpZihyZXN1bHQgPT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gJydcblxuICBpZihyZXN1bHQgJiYgcmVzdWx0LmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG5cbiAgICByZXN1bHQub25jZSgnZG9uZScsIGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgcHJvbWlzZS5yZXNvbHZlKHNlbGYuZm9ybWF0KHJlc3VsdCkpXG4gICAgfSlcblxuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxuICByZXR1cm4gc2VsZi5mb3JtYXQocmVzdWx0KVxufSlcblxucHJvdG8uZm9ybWF0ID0gZnVuY3Rpb24ocmVzdWx0KSB7XG4gIGlmKHJlc3VsdCAmJiByZXN1bHQuc2FmZSkge1xuICAgIHJldHVybiByZXN1bHQudG9TdHJpbmcoKVxuICB9XG5cbiAgaWYocmVzdWx0ID09PSBudWxsIHx8IHJlc3VsdCA9PT0gdW5kZWZpbmVkKVxuICAgIHJldHVybiAnJ1xuXG4gIHJldHVybiBlc2NhcGVIVE1MKHJlc3VsdCsnJylcbn1cblxuZnVuY3Rpb24gc2FmZWx5KGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbihjb250ZXh0KSB7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIGNvbnRleHQpXG4gICAgfSBjYXRjaChlcnIpIHtcbiAgICAgIGRlYnVnLmluZm8oZXJyKVxuICAgICAgcmV0dXJuICcnXG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGVzY2FwZUhUTUwoc3RyKSB7XG4gIHJldHVybiBzdHJcbiAgICAucmVwbGFjZSgvXFwmL2csICcmYW1wOycpXG4gICAgLnJlcGxhY2UoLzwvZywgJyZsdDsnKVxuICAgIC5yZXBsYWNlKC8+L2csICcmZ3Q7JylcbiAgICAucmVwbGFjZSgvXCIvZywgJyZxdW90OycpXG4gICAgLnJlcGxhY2UoLycvZywgJyYjMzk7Jylcbn1cbiIsInZhciBUb2tlbiA9IHJlcXVpcmUoJy4vdG9rZW4nKVxuICAsIEZpbHRlck5vZGUgPSByZXF1aXJlKCcuL2ZpbHRlcl9ub2RlJylcblxubW9kdWxlLmV4cG9ydHMgPSBGaWx0ZXJUb2tlblxuXG5mdW5jdGlvbiBGaWx0ZXJUb2tlbihjb250ZW50LCBsaW5lKSB7XG4gIFRva2VuLmNhbGwodGhpcywgY29udGVudCwgbGluZSlcbn1cblxudmFyIGNvbnMgPSBGaWx0ZXJUb2tlblxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGUgPSBuZXcgVG9rZW5cblxucHJvdG8uY29uc3RydWN0b3IgPSBjb25zXG5cbnByb3RvLm5vZGUgPSBmdW5jdGlvbihwYXJzZXIpIHtcbiAgcmV0dXJuIG5ldyBGaWx0ZXJOb2RlKHBhcnNlci5jb21waWxlKHRoaXMuY29udGVudCkpXG59XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIHZhbHVlKSB7XG4gIGlucHV0ID0gcGFyc2VJbnQoaW5wdXQsIDEwKTtcbiAgdmFsdWUgPSBwYXJzZUludCh2YWx1ZSwgMTApXG4gIGlmIChpc05hTihpbnB1dCkgfHwgaXNOYU4odmFsdWUpKVxuICAgIHJldHVybiAnJ1xuICByZXR1cm4gaW5wdXQgKyB2YWx1ZVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICBpZiAoaW5wdXQgPT09IHVuZGVmaW5lZCB8fCBpbnB1dCA9PT0gbnVsbClcbiAgICBpbnB1dCA9ICcnXG4gIHJldHVybiBpbnB1dC50b1N0cmluZygpLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICB2YXIgc3RyID0gaW5wdXQudG9TdHJpbmcoKTtcbiAgcmV0dXJuIFtzdHIuc2xpY2UoMCwxKS50b1VwcGVyQ2FzZSgpLCBzdHIuc2xpY2UoMSldLmpvaW4oJycpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBsZW4sIHJlYWR5KSB7XG4gIGlmIChpbnB1dCA9PT0gdW5kZWZpbmVkIHx8IGlucHV0ID09PSBudWxsKVxuICAgIGlucHV0ID0gJydcblxuICBpZihyZWFkeSA9PT0gdW5kZWZpbmVkKVxuICAgIGxlbiA9IDBcblxuICB2YXIgc3RyID0gaW5wdXQudG9TdHJpbmcoKVxuICAgICwgdmFsdWUgPSAnICdcblxuICBsZW4gLT0gc3RyLmxlbmd0aFxuICBpZihsZW4gPCAwKSB7XG4gICAgcmV0dXJuIHN0clxuICB9XG5cbiAgdmFyIGxlbl9oYWxmID0gbGVuLzIuMFxuICAgICwgYXJyID0gW11cbiAgICAsIGlkeCA9IE1hdGguZmxvb3IobGVuX2hhbGYpXG5cbiAgd2hpbGUoaWR4LS0gPiAwKSB7XG4gICAgYXJyLnB1c2godmFsdWUpXG4gIH1cblxuICBhcnIgPSBhcnIuam9pbignJylcbiAgc3RyID0gYXJyICsgc3RyICsgYXJyXG4gIGlmKChsZW5faGFsZiAtIE1hdGguZmxvb3IobGVuX2hhbGYpKSA+IDApIHtcbiAgICBzdHIgPSBpbnB1dC50b1N0cmluZygpLmxlbmd0aCAlIDIgPT0gMCA/IHZhbHVlICsgc3RyIDogc3RyICsgdmFsdWVcbiAgfVxuXG4gIHJldHVybiBzdHJcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIHZhbHVlKSB7XG4gIHZhciBzdHIgPSBpbnB1dC50b1N0cmluZygpXG4gIHJldHVybiBzdHIucmVwbGFjZShuZXcgUmVnRXhwKHZhbHVlLCBcImdcIiksICcnKVxufVxuIiwidmFyIGZvcm1hdCA9IHJlcXVpcmUoJy4uL2RhdGUnKS5kYXRlXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIHZhbHVlLCByZWFkeSkge1xuICBpZiAocmVhZHkgPT09IHVuZGVmaW5lZClcbiAgICB2YWx1ZSA9ICdOIGosIFknXG5cbiAgcmV0dXJuIGZvcm1hdChpbnB1dC5nZXRGdWxsWWVhciA/IGlucHV0IDogbmV3IERhdGUoaW5wdXQpLCB2YWx1ZSlcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIGRlZiwgcmVhZHkpIHtcbiAgcmV0dXJuIGlucHV0ID8gaW5wdXQgOiBkZWZcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIGtleSkge1xuICBpZiAoaW5wdXQgPT09IHVuZGVmaW5lZCB8fCBpbnB1dCA9PT0gbnVsbClcbiAgICBpbnB1dCA9IFtdXG5cbiAgcmV0dXJuIGlucHV0LnNvcnQoZnVuY3Rpb24oeCwgeSkge1xuICAgIGlmKHhba2V5XSA+IHlba2V5XSkgcmV0dXJuIDFcbiAgICBpZih4W2tleV0gPT0geVtrZXldKSByZXR1cm4gMFxuICAgIGlmKHhba2V5XSA8IHlba2V5XSkgcmV0dXJuIC0xXG4gIH0pXG59XG4iLCJ2YXIgZGljdHNvcnQgPSByZXF1aXJlKCcuL2RpY3Rzb3J0Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIGtleSkge1xuICByZXR1cm4gZGljdHNvcnQoaW5wdXQsIGtleSkucmV2ZXJzZSgpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBudW0pIHtcbiAgaWYgKGlzTmFOKHBhcnNlSW50KGlucHV0KSkpXG4gICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGlucHV0IGZvciBkaXZpc2libGVieTogJyArIFN0cmluZyhpbnB1dCkpXG5cbiAgcmV0dXJuIGlucHV0ICUgcGFyc2VJbnQobnVtLCAxMCkgPT0gMFxufVxuIiwidmFyIEZpbHRlck5vZGUgPSByZXF1aXJlKCcuLi9maWx0ZXJfbm9kZScpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgaWYgKGlucHV0ID09PSB1bmRlZmluZWQpIHtcbiAgICBpbnB1dCA9ICcnXG4gIH1cblxuICBpZihpbnB1dCAmJiBpbnB1dC5zYWZlKSB7XG4gICAgcmV0dXJuIGlucHV0XG4gIH1cblxuICBpbnB1dCA9IG5ldyBTdHJpbmcoRmlsdGVyTm9kZS5lc2NhcGUoaW5wdXQpKVxuICBpbnB1dC5zYWZlID0gdHJ1ZVxuICByZXR1cm4gaW5wdXRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIG51bSA9IChuZXcgTnVtYmVyKGlucHV0KSkudmFsdWVPZigpXG4gICAgLCBzaW5ndWxhciA9IG51bSA9PSAxID8gJycgOiAncydcbiAgICAsIHZhbHVlXG5cbiAgaWYgKGlzTmFOKG51bSkpXG4gICAgbnVtID0gMFxuXG4gIHZhbHVlID1cbiAgICBudW0gPCAxMDI0ID8gbnVtICsgJyBieXRlJytzaW5ndWxhciA6XG4gICAgbnVtIDwgKDEwMjQqMTAyNCkgPyAobnVtLzEwMjQpKycgS0InIDpcbiAgICBudW0gPCAoMTAyNCoxMDI0KjEwMjQpID8gKG51bSAvICgxMDI0KjEwMjQpKSArICcgTUInIDpcbiAgICBudW0gLyAoMTAyNCoxMDI0KjEwMjQpICsgJyBHQidcblxuICByZXR1cm4gdmFsdWVcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgcmV0dXJuIGlucHV0WzBdXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCB2YWwpIHtcbiAgdmFsID0gcGFyc2VJbnQodmFsLCAxMClcbiAgdmFsID0gaXNOYU4odmFsKSA/IC0xIDogdmFsXG5cbiAgdmFyIGlzUG9zaXRpdmUgPSB2YWwgPj0gMFxuICAgICwgYXNOdW1iZXIgPSBwYXJzZUZsb2F0KGlucHV0KVxuICAgICwgYWJzVmFsdWUgPSBNYXRoLmFicyh2YWwpXG4gICAgLCBwb3cgPSBNYXRoLnBvdygxMCwgYWJzVmFsdWUpXG4gICAgLCBwb3dfbWludXNfb25lID0gTWF0aC5wb3coMTAsIE1hdGgubWF4KGFic1ZhbHVlLTEsIDApKVxuICAgICwgYXNTdHJpbmdcblxuICBpZiAoaXNOYU4oYXNOdW1iZXIpKVxuICAgIHJldHVybiAnJ1xuXG4gIGFzTnVtYmVyID0gTWF0aC5yb3VuZCgocG93ICogYXNOdW1iZXIpIC8gcG93X21pbnVzX29uZSlcblxuICBpZih2YWwgIT09IDApXG4gICAgYXNOdW1iZXIgLz0gMTBcblxuICBhc1N0cmluZyA9IGFzTnVtYmVyLnRvU3RyaW5nKClcblxuICBpZihpc1Bvc2l0aXZlKSB7XG4gICAgdmFyIHNwbGl0ID0gYXNTdHJpbmcuc3BsaXQoJy4nKVxuICAgICAgLCBkZWNpbWFsID0gc3BsaXQubGVuZ3RoID4gMSA/IHNwbGl0WzFdIDogJydcblxuICAgIHdoaWxlKGRlY2ltYWwubGVuZ3RoIDwgdmFsKSB7XG4gICAgICBkZWNpbWFsICs9ICcwJ1xuICAgIH1cblxuICAgIGFzU3RyaW5nID0gZGVjaW1hbC5sZW5ndGggPyBbc3BsaXRbMF0sIGRlY2ltYWxdLmpvaW4oJy4nKSA6IHNwbGl0WzBdXG4gIH1cblxuICByZXR1cm4gYXNTdHJpbmdcbn1cbiIsInZhciBGaWx0ZXJOb2RlID0gcmVxdWlyZSgnLi4vZmlsdGVyX25vZGUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIGlmIChpbnB1dCA9PT0gdW5kZWZpbmVkKVxuICAgIGlucHV0ID0gJydcblxuICB2YXIgeCA9IG5ldyBTdHJpbmcoRmlsdGVyTm9kZS5lc2NhcGUoaW5wdXQrJycpKVxuICB4LnNhZmUgPSB0cnVlXG4gIHJldHVybiB4XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBkaWdpdCkge1xuICB2YXIgaXNOdW0gPSAhaXNOYU4ocGFyc2VJbnQoaW5wdXQsIDEwKSlcbiAgICAsIHN0ciA9IGlucHV0LnRvU3RyaW5nKClcbiAgICAsIGxlbiA9IHN0ci5zcGxpdCgnJykubGVuZ3RoXG5cbiAgZGlnaXQgPSBwYXJzZUludChkaWdpdCwgMTApXG4gIGlmKGlzTnVtICYmICFpc05hTihkaWdpdCkgJiYgZGlnaXQgPD0gbGVuKSB7XG4gICAgcmV0dXJuIHN0ci5jaGFyQXQobGVuIC0gZGlnaXQpXG4gIH1cblxuICByZXR1cm4gaW5wdXRcbn1cbiIsbnVsbCwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICByZXR1cm4gaW5wdXRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIG91dHB1dCA9IFtdXG4gIGZvcih2YXIgbmFtZSBpbiBpbnB1dCkgaWYoaW5wdXQuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcbiAgICBvdXRwdXQucHVzaChbbmFtZSwgaW5wdXRbbmFtZV1dKVxuICB9XG4gIHJldHVybiBvdXRwdXRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIGdsdWUpIHtcbiAgaW5wdXQgPSBpbnB1dCBpbnN0YW5jZW9mIEFycmF5ID8gaW5wdXQgOiBpbnB1dC50b1N0cmluZygpLnNwbGl0KCcnKVxuICByZXR1cm4gaW5wdXQuam9pbihnbHVlKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICB2YXIgY2IgPSBpbnB1dC5jaGFyQXQgfHwgZnVuY3Rpb24oaW5kKSB7IHJldHVybiBpbnB1dFtpbmRdOyB9XG5cbiAgcmV0dXJuIGNiLmNhbGwoaW5wdXQsIGlucHV0Lmxlbmd0aC0xKTtcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIHJlYWR5KSB7XG4gIGlmKGlucHV0KSB7XG4gICAgaWYgKHR5cGVvZiBpbnB1dC5sZW5ndGggPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBpbnB1dC5sZW5ndGgocmVhZHkpXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuIGlucHV0Lmxlbmd0aFxuICAgIH1cbiAgfVxuICByZXR1cm4gMFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgZXhwZWN0ZWQsIHJlYWR5KSB7XG4gIHZhciB0bXBcbiAgaWYoaW5wdXQpIHtcbiAgICBpZiAodHlwZW9mIGlucHV0Lmxlbmd0aCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdG1wID0gaW5wdXQubGVuZ3RoKGZ1bmN0aW9uKGVyciwgbGVuKSB7XG4gICAgICAgIHJlYWR5KGVyciwgZXJyID8gbnVsbCA6IGxlbiA9PT0gZXhwZWN0ZWQpXG4gICAgICB9KVxuXG4gICAgICByZXR1cm4gdG1wID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiB0bXAgPT09IGV4cGVjdGVkXG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuIGlucHV0Lmxlbmd0aCA9PT0gZXhwZWN0ZWRcbiAgICB9XG4gIH1cbiAgcmV0dXJuIDAgPT09IGV4cGVjdGVkXG59XG4iLCJ2YXIgc2FmZSA9IHJlcXVpcmUoJy4vc2FmZScpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgaWYgKGlucHV0ID09PSB1bmRlZmluZWQgfHwgaW5wdXQgPT09IG51bGwpXG4gICAgaW5wdXQgPSAnJ1xuXG4gIHZhciBzdHIgPSBpbnB1dC50b1N0cmluZygpXG4gICAgLCBwYXJhcyA9IHN0ci5zcGxpdCgnXFxuXFxuJylcbiAgICAsIG91dCA9IFtdXG5cbiAgd2hpbGUocGFyYXMubGVuZ3RoKSB7XG4gICAgb3V0LnVuc2hpZnQocGFyYXMucG9wKCkucmVwbGFjZSgvXFxuL2csICc8YnIgLz4nKSlcbiAgfVxuXG4gIHJldHVybiBzYWZlKCc8cD4nK291dC5qb2luKCc8L3A+PHA+JykrJzwvcD4nKVxufVxuIiwidmFyIHNhZmUgPSByZXF1aXJlKCcuL3NhZmUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIGlmIChpbnB1dCA9PT0gdW5kZWZpbmVkIHx8IGlucHV0ID09PSBudWxsKVxuICAgIGlucHV0ID0gJydcblxuICB2YXIgc3RyID0gaW5wdXQudG9TdHJpbmcoKVxuICByZXR1cm4gc2FmZShzdHIucmVwbGFjZSgvXFxuL2csICc8YnIgLz4nKSlcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgaWYgKGlucHV0ID09PSB1bmRlZmluZWQgfHwgaW5wdXQgPT09IG51bGwpXG4gICAgaW5wdXQgPSAnJ1xuXG4gIHZhciBzdHIgPSBpbnB1dC50b1N0cmluZygpXG4gICAgLCBiaXRzID0gc3RyLnNwbGl0KCdcXG4nKVxuICAgICwgb3V0ID0gW11cbiAgICAsIGxlbiA9IGJpdHMubGVuZ3RoXG5cbiAgd2hpbGUoYml0cy5sZW5ndGgpIHtcbiAgICBvdXQudW5zaGlmdChsZW4gLSBvdXQubGVuZ3RoICsgJy4gJyArIGJpdHMucG9wKCkpXG4gIH1cblxuICByZXR1cm4gb3V0LmpvaW4oJ1xcbicpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBudW0pIHtcbiAgdmFyIGJpdHMgPSAoaW5wdXQgPT09IG51bGwgfHwgaW5wdXQgPT09IHVuZGVmaW5lZCA/ICcnIDogaW5wdXQpLnRvU3RyaW5nKCkuc3BsaXQoJycpXG4gICAgLCBkaWZmZXJlbmNlID0gbnVtIC0gYml0cy5sZW5ndGhcblxuICAvLyBwdXNoIHJldHVybnMgbmV3IGxlbmd0aCBvZiBhcnJheS5cbiAgd2hpbGUoZGlmZmVyZW5jZSA+IDApIHtcbiAgICBkaWZmZXJlbmNlID0gbnVtIC0gYml0cy5wdXNoKCcgJylcbiAgfVxuXG4gIHJldHVybiBiaXRzLmpvaW4oJycpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHJldHVybiBpbnB1dC50b1N0cmluZygpLnRvTG93ZXJDYXNlKClcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgaWYgKGlucHV0ID09PSB1bmRlZmluZWQgfHwgaW5wdXQgPT09IG51bGwpXG4gICAgaW5wdXQgPSAnJ1xuXG4gIGlucHV0ID0gaW5wdXQgaW5zdGFuY2VvZiBBcnJheSA/IGlucHV0IDogaW5wdXQudG9TdHJpbmcoKS5zcGxpdCgnJylcblxuICByZXR1cm4gaW5wdXRcbn1cbiIsIlxudmFyIExFVFRFUlMgPSB7XG4nYSc6ICcyJywgJ2InOiAnMicsICdjJzogJzInLCAnZCc6ICczJywgJ2UnOiAnMycsXG4nZic6ICczJywgJ2cnOiAnNCcsICdoJzogJzQnLCAnaSc6ICc0JywgJ2onOiAnNScsICdrJzogJzUnLCAnbCc6ICc1JyxcbidtJzogJzYnLCAnbic6ICc2JywgJ28nOiAnNicsICdwJzogJzcnLCAncSc6ICc3JywgJ3InOiAnNycsICdzJzogJzcnLFxuJ3QnOiAnOCcsICd1JzogJzgnLCAndic6ICc4JywgJ3cnOiAnOScsICd4JzogJzknLCAneSc6ICc5JywgJ3onOiAnOSdcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIHN0ciA9IGlucHV0LnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKS5zcGxpdCgnJylcbiAgICAsIG91dCA9IFtdXG4gICAgLCBsdHJcblxuICB3aGlsZShzdHIubGVuZ3RoKSB7XG4gICAgbHRyID0gc3RyLnBvcCgpXG4gICAgb3V0LnVuc2hpZnQoTEVUVEVSU1tsdHJdID8gTEVUVEVSU1tsdHJdIDogbHRyKVxuICB9XG5cbiAgcmV0dXJuIG91dC5qb2luKCcnKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgcGx1cmFsKSB7XG4gIHBsdXJhbCA9ICh0eXBlb2YgcGx1cmFsID09PSAnc3RyaW5nJyA/IHBsdXJhbCA6ICdzJykuc3BsaXQoJywnKVxuXG4gIHZhciB2YWwgPSBOdW1iZXIoaW5wdXQpXG4gICAgLCBzdWZmaXhcblxuICBpZiAoaXNOYU4odmFsKSlcbiAgICB2YWwgPSAxXG5cbiAgc3VmZml4ID0gcGx1cmFsW3BsdXJhbC5sZW5ndGgtMV07XG4gIGlmKHZhbCA9PT0gMSkge1xuICAgIHN1ZmZpeCA9IHBsdXJhbC5sZW5ndGggPiAxID8gcGx1cmFsWzBdIDogJyc7XG4gIH1cblxuICByZXR1cm4gc3VmZml4XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIGlmICghaW5wdXQpXG4gICAgcmV0dXJuIG51bGxcblxuICB2YXIgY2IgPSBpbnB1dC5jaGFyQXQgfHwgZnVuY3Rpb24oaWR4KSB7XG4gICAgcmV0dXJuIHRoaXNbaWR4XTtcbiAgfTtcblxuICByZXR1cm4gY2IuY2FsbChpbnB1dCwgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogaW5wdXQubGVuZ3RoKSlcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIG51bSkge1xuICB2YXIgYml0cyA9IChpbnB1dCA9PT0gbnVsbCB8fCBpbnB1dCA9PT0gdW5kZWZpbmVkID8gJycgOiBpbnB1dCkudG9TdHJpbmcoKS5zcGxpdCgnJylcbiAgICAsIGRpZmZlcmVuY2UgPSBudW0gLSBiaXRzLmxlbmd0aFxuXG4gIC8vIHB1c2ggcmV0dXJucyBuZXcgbGVuZ3RoIG9mIGFycmF5LlxuICAvLyBOQjogW10udW5zaGlmdCByZXR1cm5zIGB1bmRlZmluZWRgIGluIElFPDkuXG4gIHdoaWxlKGRpZmZlcmVuY2UgPiAwKSB7XG4gICAgZGlmZmVyZW5jZSA9IChiaXRzLnVuc2hpZnQoJyAnKSwgbnVtIC0gYml0cy5sZW5ndGgpXG4gIH1cblxuICByZXR1cm4gYml0cy5qb2luKCcnKVxufVxuIiwidmFyIEZpbHRlck5vZGUgPSByZXF1aXJlKCcuLi9maWx0ZXJfbm9kZScpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgaWYgKGlucHV0ID09PSB1bmRlZmluZWQpXG4gICAgaW5wdXQgPSAnJ1xuXG4gIGlucHV0ID0gbmV3IFN0cmluZyhpbnB1dClcbiAgaW5wdXQuc2FmZSA9IHRydWVcbiAgcmV0dXJuIGlucHV0XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBieSkge1xuICBpZiAoaW5wdXQgPT09IHVuZGVmaW5lZCB8fCBpbnB1dCA9PT0gbnVsbClcbiAgICBpbnB1dCA9IFtdXG5cbiAgYnkgPSBieS50b1N0cmluZygpXG4gIGlmKGJ5LmNoYXJBdCgwKSA9PT0gJzonKSB7XG4gICAgYnkgPSAnMCcrYnlcbiAgfVxuXG4gIGlmKGJ5LmNoYXJBdChieS5sZW5ndGgtMSkgPT09ICc6Jykge1xuICAgIGJ5ID0gYnkuc2xpY2UoMCwgLTEpXG4gIH1cblxuICB2YXIgc3BsaXRCeSA9IGJ5LnNwbGl0KCc6JylcbiAgICAsIHNsaWNlID0gaW5wdXQuc2xpY2UgfHwgKGZ1bmN0aW9uKCkge1xuICAgICAgICBpbnB1dCA9IHRoaXMudG9TdHJpbmcoKVxuICAgICAgICByZXR1cm4gaW5wdXQuc2xpY2VcbiAgICAgIH0pKClcblxuICByZXR1cm4gc2xpY2UuYXBwbHkoaW5wdXQsIHNwbGl0QnkpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIGlucHV0ID0gaW5wdXQudG9TdHJpbmcoKVxuICByZXR1cm4gaW5wdXRcbiAgICAgICAgLnJlcGxhY2UoL1teXFx3XFxzXFxkXFwtXS9nLCAnJylcbiAgICAgICAgLnJlcGxhY2UoL15cXHMqLywgJycpXG4gICAgICAgIC5yZXBsYWNlKC9cXHMqJC8sICcnKVxuICAgICAgICAucmVwbGFjZSgvW1xcLVxcc10rL2csICctJylcbiAgICAgICAgLnRvTG93ZXJDYXNlKClcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIGJ5LCByZWFkeSkge1xuICBieSA9IGFyZ3VtZW50cy5sZW5ndGggPT09IDIgPyAnLCcgOiBieVxuICBpbnB1dCA9ICcnK2lucHV0XG4gIHJldHVybiBpbnB1dC5zcGxpdChieSlcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIHN0ciA9IGlucHV0LnRvU3RyaW5nKClcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC88W14+XSo/Pi9nLCAnJylcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIG4sIHJlYWR5KSB7XG4gIHZhciBpbnB1dCA9IG5ldyBEYXRlKGlucHV0KVxuICAgICwgbm93ICAgPSByZWFkeSA9PT0gdW5kZWZpbmVkID8gbmV3IERhdGUoKSA6IG5ldyBEYXRlKG4pXG4gICAgLCBkaWZmICA9IGlucHV0IC0gbm93XG4gICAgLCBzaW5jZSA9IE1hdGguYWJzKGRpZmYpXG5cbiAgaWYoZGlmZiA+IDApXG4gICAgcmV0dXJuICcwIG1pbnV0ZXMnXG5cbiAgLy8gMzY1LjI1ICogMjQgKiA2MCAqIDYwICogMTAwMCA9PT0geWVhcnNcbiAgdmFyIHllYXJzID0gICB+fihzaW5jZSAvIDMxNTU3NjAwMDAwKVxuICAgICwgbW9udGhzID0gIH5+KChzaW5jZSAtICh5ZWFycyozMTU1NzYwMDAwMCkpIC8gMjU5MjAwMDAwMClcbiAgICAsIGRheXMgPSAgICB+figoc2luY2UgLSAoeWVhcnMgKiAzMTU1NzYwMDAwMCArIG1vbnRocyAqIDI1OTIwMDAwMDApKSAvIDg2NDAwMDAwKVxuICAgICwgaG91cnMgPSAgIH5+KChzaW5jZSAtICh5ZWFycyAqIDMxNTU3NjAwMDAwICsgbW9udGhzICogMjU5MjAwMDAwMCArIGRheXMgKiA4NjQwMDAwMCkpIC8gMzYwMDAwMClcbiAgICAsIG1pbnV0ZXMgPSB+figoc2luY2UgLSAoeWVhcnMgKiAzMTU1NzYwMDAwMCArIG1vbnRocyAqIDI1OTIwMDAwMDAgKyBkYXlzICogODY0MDAwMDAgKyBob3VycyAqIDM2MDAwMDApKSAvIDYwMDAwKVxuICAgICwgcmVzdWx0ID0gW1xuICAgICAgICB5ZWFycyAgID8gcGx1cmFsaXplKHllYXJzLCAgICAneWVhcicpIDogbnVsbFxuICAgICAgLCBtb250aHMgID8gcGx1cmFsaXplKG1vbnRocywgICAnbW9udGgnKSA6IG51bGxcbiAgICAgICwgZGF5cyAgICA/IHBsdXJhbGl6ZShkYXlzLCAgICAgJ2RheScpIDogbnVsbFxuICAgICAgLCBob3VycyAgID8gcGx1cmFsaXplKGhvdXJzLCAgICAnaG91cicpIDogbnVsbFxuICAgICAgLCBtaW51dGVzID8gcGx1cmFsaXplKG1pbnV0ZXMsICAnbWludXRlJykgOiBudWxsXG4gICAgXVxuICAgICwgb3V0ID0gW11cblxuICBmb3IodmFyIGkgPSAwLCBsZW4gPSByZXN1bHQubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICByZXN1bHRbaV0gIT09IG51bGwgJiYgb3V0LnB1c2gocmVzdWx0W2ldKVxuICB9XG5cbiAgaWYoIW91dC5sZW5ndGgpIHtcbiAgICByZXR1cm4gJzAgbWludXRlcydcbiAgfVxuXG4gIHJldHVybiBvdXRbMF0gKyAob3V0WzFdID8gJywgJyArIG91dFsxXSA6ICcnKVxuXG4gIGZ1bmN0aW9uIHBsdXJhbGl6ZSh4LCBzdHIpIHtcbiAgICByZXR1cm4geCArICcgJyArIHN0ciArICh4ID09PSAxID8gJycgOiAncycpXG4gIH1cbn1cbiIsInZhciB0aW1lc2luY2UgPSByZXF1aXJlKCcuL3RpbWVzaW5jZScpLnRpbWVzaW5jZVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBuKSB7XG4gIHZhciBub3cgPSBuID8gbmV3IERhdGUobikgOiBuZXcgRGF0ZSgpXG4gIHJldHVybiB0aW1lc2luY2Uobm93LCBpbnB1dClcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIHN0ciA9IGlucHV0LnRvU3RyaW5nKClcbiAgICAsIGJpdHMgPSBzdHIuc3BsaXQoL1xcc3sxfS9nKVxuICAgICwgb3V0ID0gW11cblxuICB3aGlsZShiaXRzLmxlbmd0aCkge1xuICAgIHZhciB3b3JkID0gYml0cy5zaGlmdCgpXG4gICAgd29yZCA9IHdvcmQuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyB3b3JkLnNsaWNlKDEpXG4gICAgb3V0LnB1c2god29yZClcbiAgfVxuXG4gIG91dCA9IG91dC5qb2luKCcgJylcbiAgcmV0dXJuIG91dC5yZXBsYWNlKC8oW2Etel0pJyhbQS1aXSkvZywgZnVuY3Rpb24oYSwgbSwgeCkgeyByZXR1cm4geC50b0xvd2VyQ2FzZSgpIH0pXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBuKSB7XG4gIHZhciBzdHIgPSBpbnB1dC50b1N0cmluZygpXG4gICAgLCBudW0gPSBwYXJzZUludChuLCAxMClcblxuICBpZihpc05hTihudW0pKVxuICAgIHJldHVybiBpbnB1dFxuXG4gIGlmKGlucHV0Lmxlbmd0aCA8PSBudW0pXG4gICAgcmV0dXJuIGlucHV0XG5cbiAgcmV0dXJuIGlucHV0LnNsaWNlKDAsIG51bSkrJy4uLidcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIG4pIHtcbiAgdmFyIHN0ciA9IGlucHV0LnRvU3RyaW5nKClcbiAgICAsIG51bSA9IHBhcnNlSW50KG4sIDEwKVxuICAgICwgd29yZHNcblxuICBpZihpc05hTihudW0pKVxuICAgIHJldHVybiBpbnB1dFxuXG4gIHdvcmRzID0gaW5wdXQuc3BsaXQoL1xccysvKVxuXG4gIGlmKHdvcmRzLmxlbmd0aCA8PSBudW0pXG4gICAgcmV0dXJuIGlucHV0XG5cbiAgcmV0dXJuIHdvcmRzLnNsaWNlKDAsIG51bSkuam9pbignICcpKycuLi4nXG59XG4iLCJ2YXIgc2FmZSA9IHJlcXVpcmUoJy4vc2FmZScpO1xuXG52YXIgdWxwYXJzZXIgPSBmdW5jdGlvbihsaXN0KSB7XG4gIHZhciBvdXQgPSBbXVxuICAgICwgbCA9IGxpc3Quc2xpY2UoKVxuICAgICwgaXRlbVxuXG4gIHdoaWxlKGwubGVuZ3RoKSB7XG4gICAgaXRlbSA9IGwucG9wKClcblxuICAgIGlmKGl0ZW0gaW5zdGFuY2VvZiBBcnJheSlcbiAgICAgIG91dC51bnNoaWZ0KCc8dWw+Jyt1bHBhcnNlcihpdGVtKSsnPC91bD4nKVxuICAgIGVsc2VcbiAgICAgIG91dC51bnNoaWZ0KCc8L2xpPjxsaT4nK2l0ZW0pXG4gIH1cblxuICAvLyBnZXQgcmlkIG9mIHRoZSBsZWFkaW5nIDwvbGk+LCBpZiBhbnkuIGFkZCB0cmFpbGluZyA8L2xpPi5cbiAgcmV0dXJuIG91dC5qb2luKCcnKS5yZXBsYWNlKC9ePFxcL2xpPi8sICcnKSArICc8L2xpPidcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICByZXR1cm4gaW5wdXQgaW5zdGFuY2VvZiBBcnJheSA/XG4gICAgc2FmZSh1bHBhcnNlcihpbnB1dCkpIDpcbiAgICBpbnB1dFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICByZXR1cm4gaW5wdXQudG9TdHJpbmcoKS50b1VwcGVyQ2FzZSgpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHJldHVybiBlc2NhcGUoaW5wdXQudG9TdHJpbmcoKSlcbn1cbiIsInZhciBzYWZlID0gcmVxdWlyZSgnLi9zYWZlJylcbnZhciB1cmxfZmluZGVyID0gcmVxdWlyZSgnLi4vdXJsX2ZpbmRlcicpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgcmV0dXJuIHNhZmUodXJsX2ZpbmRlcihpbnB1dCwgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuICc8YSBocmVmPVwiJythcmd1bWVudHNbMF0rJ1wiPicrYXJndW1lbnRzWzBdKyc8L2E+JztcbiAgfSkpXG59XG4iLCJ2YXIgc2FmZSA9IHJlcXVpcmUoJy4vc2FmZScpXG52YXIgdXJsX2ZpbmRlciA9IHJlcXVpcmUoJy4uL3VybF9maW5kZXInKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBsZW4pIHtcbiAgbGVuID0gcGFyc2VJbnQobGVuLCAxMCkgfHwgMTAwMFxuICByZXR1cm4gc2FmZSh1cmxfZmluZGVyKGlucHV0LCBmdW5jdGlvbigpIHtcbiAgICB2YXIgbHRyID0gYXJndW1lbnRzWzBdLmxlbmd0aCA+IGxlbiA/IGFyZ3VtZW50c1swXS5zbGljZSgwLCBsZW4pICsgJy4uLicgOiBhcmd1bWVudHNbMF07XG4gICAgcmV0dXJuICc8YSBocmVmPVwiJythcmd1bWVudHNbMF0rJ1wiPicrbHRyKyc8L2E+JztcbiAgfSkpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIGlmIChpbnB1dCA9PT0gdW5kZWZpbmVkIHx8IGlucHV0ID09PSBudWxsKVxuICAgIHJldHVybiAwXG5cbiAgdmFyIHN0ciA9IGlucHV0LnRvU3RyaW5nKClcbiAgICAsIGJpdHMgPSBzdHIuc3BsaXQoL1xccysvZylcblxuICByZXR1cm4gYml0cy5sZW5ndGhcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIGxlbikge1xuICB2YXIgd29yZHMgPSBpbnB1dC50b1N0cmluZygpLnNwbGl0KC9cXHMrL2cpXG4gICAgLCBvdXQgPSBbXVxuICAgICwgbGVuID0gcGFyc2VJbnQobGVuLCAxMCkgfHwgd29yZHMubGVuZ3RoXG5cbiAgd2hpbGUod29yZHMubGVuZ3RoKSB7XG4gICAgb3V0LnVuc2hpZnQod29yZHMuc3BsaWNlKDAsIGxlbikuam9pbignICcpKVxuICB9XG5cbiAgcmV0dXJuIG91dC5qb2luKCdcXG4nKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgbWFwKSB7XG4gIGlmIChpbnB1dCA9PT0gdW5kZWZpbmVkKVxuICAgIGlucHV0ID0gZmFsc2VcblxuICB2YXIgb3VyTWFwID0gbWFwLnRvU3RyaW5nKCkuc3BsaXQoJywnKVxuICAgICwgdmFsdWVcblxuICBvdXJNYXAubGVuZ3RoIDwgMyAmJiBvdXJNYXAucHVzaChvdXJNYXBbMV0pXG5cbiAgdmFsdWUgPSBvdXJNYXBbXG4gICAgaW5wdXQgPyAwIDpcbiAgICBpbnB1dCA9PT0gZmFsc2UgPyAxIDpcbiAgICAyXG4gIF1cblxuICByZXR1cm4gdmFsdWVcbn1cbiIsInZhciBnbG9iYWw9c2VsZjt2YXIgRmlsdGVyVG9rZW4gPSByZXF1aXJlKCcuL2ZpbHRlcl90b2tlbicpXG4gICwgVGFnVG9rZW4gPSByZXF1aXJlKCcuL3RhZ190b2tlbicpXG4gICwgQ29tbWVudFRva2VuID0gcmVxdWlyZSgnLi9jb21tZW50X3Rva2VuJylcbiAgLCBUZXh0VG9rZW4gPSByZXF1aXJlKCcuL3RleHRfdG9rZW4nKVxuICAsIGxpYnJhcmllcyA9IHJlcXVpcmUoJy4vbGlicmFyaWVzJylcbiAgLCBQYXJzZXIgPSByZXF1aXJlKCcuL3BhcnNlcicpXG4gICwgQ29udGV4dCA9IHJlcXVpcmUoJy4vY29udGV4dCcpXG4gICwgTWV0YSA9IHJlcXVpcmUoJy4vbWV0YScpXG4gICwgUHJvbWlzZSA9IHJlcXVpcmUoJy4vcHJvbWlzZScpXG5cbm1vZHVsZS5leHBvcnRzID0gVGVtcGxhdGVcblxuLy8gY2lyY3VsYXIgYWxpYXMgdG8gc3VwcG9ydCBvbGRcbi8vIHZlcnNpb25zIG9mIHBsYXRlLlxuVGVtcGxhdGUuVGVtcGxhdGUgPSBUZW1wbGF0ZVxuVGVtcGxhdGUuQ29udGV4dCA9IENvbnRleHRcblxudmFyIGxhdGVyID0gdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgP1xuICAgIGZ1bmN0aW9uKGZuKSB7IGdsb2JhbC5zZXRUaW1lb3V0KGZuLCAwKSB9IDpcbiAgICBmdW5jdGlvbihmbikgeyB0aGlzLnNldFRpbWVvdXQoZm4sIDApIH1cblxuZnVuY3Rpb24gVGVtcGxhdGUocmF3LCBsaWJyYXJpZXMsIHBhcnNlcikge1xuICBpZih0eXBlb2YgcmF3ICE9PSAnc3RyaW5nJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2lucHV0IHNob3VsZCBiZSBhIHN0cmluZycpXG4gIH1cblxuICB0aGlzLnJhdyA9IHJhd1xuXG4gIGxpYnJhcmllcyA9IGxpYnJhcmllcyB8fCB7fVxuXG4gIHRoaXMudGFnTGlicmFyeSA9XG4gICAgbGlicmFyaWVzLnRhZ19saWJyYXJ5IHx8IFRlbXBsYXRlLk1ldGEuY3JlYXRlVGFnTGlicmFyeSgpXG5cbiAgdGhpcy5maWx0ZXJMaWJyYXJ5ID1cbiAgICBsaWJyYXJpZXMuZmlsdGVyX2xpYnJhcnkgfHwgVGVtcGxhdGUuTWV0YS5jcmVhdGVGaWx0ZXJMaWJyYXJ5KClcblxuICB0aGlzLnBsdWdpbkxpYnJhcnkgPVxuICAgIGxpYnJhcmllcy5wbHVnaW5fbGlicmFyeSB8fCBUZW1wbGF0ZS5NZXRhLmNyZWF0ZVBsdWdpbkxpYnJhcnkoKVxuXG4gIHRoaXMucGFyc2VyID0gcGFyc2VyIHx8IFBhcnNlclxuXG4gIHRoaXMudG9rZW5zID0gbnVsbFxufVxuXG52YXIgY29ucyA9IFRlbXBsYXRlXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuICAsIG1ldGEgPSBjb25zLk1ldGEgPSBuZXcgTWV0YVxuXG5jb25zLmNyZWF0ZVBsdWdpbkxpYnJhcnkgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIG5ldyBsaWJyYXJpZXMuRGVmYXVsdFBsdWdpbkxpYnJhcnkoKVxufVxuXG5wcm90by5nZXROb2RlTGlzdCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLm5vZGVsaXN0ID0gdGhpcy5ub2RlbGlzdCB8fCB0aGlzLnBhcnNlKClcblxuICByZXR1cm4gdGhpcy5ub2RlbGlzdFxufVxuXG5wcm90by5wYXJzZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcGFyc2VyXG5cbiAgdGhpcy50b2tlbnMgPSB0aGlzLnRva2VucyB8fCBjb25zLnRva2VuaXplKHRoaXMucmF3KVxuXG4gIHBhcnNlciA9IG5ldyB0aGlzLnBhcnNlcihcbiAgICAgIHRoaXMudG9rZW5zXG4gICAgLCB0aGlzLnRhZ0xpYnJhcnlcbiAgICAsIHRoaXMuZmlsdGVyTGlicmFyeVxuICAgICwgdGhpcy5wbHVnaW5MaWJyYXJ5XG4gICAgLCB0aGlzXG4gIClcblxuICByZXR1cm4gcGFyc2VyLnBhcnNlKClcbn1cblxucHJvdG8ucmVuZGVyID0gcHJvdGVjdChmdW5jdGlvbihjb250ZXh0LCByZWFkeSkge1xuICBjb250ZXh0ID0gbmV3IENvbnRleHQoY29udGV4dClcblxuICB2YXIgcmVzdWx0XG5cbiAgcmVzdWx0ID1cbiAgdGhpc1xuICAgIC5nZXROb2RlTGlzdCgpXG4gICAgLnJlbmRlcihjb250ZXh0KVxuXG4gIGlmKHJlc3VsdC5jb25zdHJ1Y3RvciA9PT0gUHJvbWlzZSkge1xuICAgIHJlc3VsdC5vbmNlKCdkb25lJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcmVhZHkobnVsbCwgZGF0YSlcbiAgICB9KVxuICB9IGVsc2Uge1xuICAgIGxhdGVyKGZ1bmN0aW9uKCkge1xuICAgICAgcmVhZHkobnVsbCwgcmVzdWx0KVxuICAgIH0sIDApXG4gIH1cblxufSlcblxuZnVuY3Rpb24gcHJvdGVjdChmbikge1xuICByZXR1cm4gZnVuY3Rpb24oY29udGV4dCwgcmVhZHkpIHtcbiAgICBpZighY29udGV4dCB8fCAhcmVhZHkpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoKVxuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICByZXR1cm4gZm4uY2FsbCh0aGlzLCBjb250ZXh0LCByZWFkeSlcbiAgICB9IGNhdGNoKGUpIHtcbiAgICAgIGxhdGVyKGZ1bmN0aW9uKCkge1xuICAgICAgICByZWFkeShlLCBudWxsKVxuICAgICAgfSwgMClcbiAgICB9XG4gIH1cbn1cblxuY29ucy5NQVRDSF9SRSA9IC9cXHtbJSNcXHtdKC4qPylbXFx9IyVdXFx9L1xuXG5jb25zLnRva2VuaXplID0gZnVuY3Rpb24oY29udGVudCkge1xuICB2YXIgbWF0Y2ggPSBudWxsXG4gICAgLCB0b2tlbnMgPSBbXVxuICAgICwgbGluZU5vID0gMVxuICAgICwgaW5jTGluZU5vID0gZnVuY3Rpb24oc3RyKSB7IGxpbmVObyArPSBzdHIuc3BsaXQoJ1xcbicpLmxlbmd0aCB9XG4gICAgLCBtYXAgPSB7XG4gICAgICAgICAgJyUnOiBUYWdUb2tlblxuICAgICAgICAsICcjJzogQ29tbWVudFRva2VuXG4gICAgICAgICwgJ3snOiBGaWx0ZXJUb2tlblxuICAgICAgfVxuICAgICwgcmV4ID0gdGhpcy5NQVRDSF9SRVxuICAgICwgbGl0ZXJhbFxuXG4gIGRvIHtcbiAgICBtYXRjaCA9IHJleC5leGVjKGNvbnRlbnQpXG4gICAgaWYoIW1hdGNoKVxuICAgICAgY29udGludWVcblxuICAgIGxpdGVyYWwgPSBjb250ZW50LnNsaWNlKDAsIG1hdGNoLmluZGV4KVxuICAgIGluY0xpbmVObyhsaXRlcmFsKVxuICAgIGlmKG1hdGNoLmluZGV4KVxuICAgICAgdG9rZW5zLnB1c2gobmV3IFRleHRUb2tlbihsaXRlcmFsLnNsaWNlKDAsIG1hdGNoLmluZGV4LCBsaW5lTm8pKSlcblxuICAgIG1hdGNoWzFdID0gbWF0Y2hbMV1cbiAgICAgIC5yZXBsYWNlKC9eXFxzKy8sICcnKVxuICAgICAgLnJlcGxhY2UoL1xccyskLywgJycpXG5cbiAgICB0b2tlbnMucHVzaChuZXcgbWFwW21hdGNoWzBdLmNoYXJBdCgxKV0obWF0Y2hbMV0sIGxpbmVObykpXG5cbiAgICBjb250ZW50ID0gY29udGVudC5zbGljZShtYXRjaC5pbmRleCArIG1hdGNoWzBdLmxlbmd0aClcbiAgfSB3aGlsZShjb250ZW50Lmxlbmd0aCAmJiBtYXRjaClcblxuICB0b2tlbnMucHVzaChuZXcgVGV4dFRva2VuKGNvbnRlbnQpKVxuXG4gIHJldHVybiB0b2tlbnNcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIExpYnJhcnk6IHJlcXVpcmUoJy4vbGlicmFyeScpXG4gICwgRGVmYXVsdFBsdWdpbkxpYnJhcnk6IHJlcXVpcmUoJy4vbGlicmFyeScpXG4gICwgRGVmYXVsdFRhZ0xpYnJhcnk6IHJlcXVpcmUoJy4vZGVmYXVsdHRhZ3MnKVxuICAsIERlZmF1bHRGaWx0ZXJMaWJyYXJ5OiByZXF1aXJlKCcuL2RlZmF1bHRmaWx0ZXJzJylcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gTGlicmFyeVxuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJy4vcHJvbWlzZScpXG5cbmZ1bmN0aW9uIExpYnJhcnkobGliKSB7XG4gIHRoaXMucmVnaXN0cnkgPSBsaWIgfHwge31cbn1cblxudmFyIGNvbnMgPSBMaWJyYXJ5XG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by5sb29rdXAgPSBlcnJvck9uTnVsbChmdW5jdGlvbihuYW1lKSB7XG4gIHZhciBvdXQgPSB0aGlzLnJlZ2lzdHJ5W25hbWVdIHx8IG51bGxcblxuICBpZih0eXBlb2Ygb3V0ID09PSAnZnVuY3Rpb24nICYmIG91dC5sZW5ndGggPT09IDIgJiYgbmFtZSA9PT0gJ2xvYWRlcicpIHtcbiAgICBvdXQgPSBQcm9taXNlLnRvUHJvbWlzZShvdXQpXG4gIH1cblxuICByZXR1cm4gb3V0XG59LCBcIkNvdWxkIG5vdCBmaW5kIHswfSFcIilcblxucHJvdG8ucmVnaXN0ZXIgPSBlcnJvck9uTnVsbChmdW5jdGlvbihuYW1lLCBpdGVtKSB7XG4gIGlmKHRoaXMucmVnaXN0cnlbbmFtZV0pXG4gICAgcmV0dXJuIG51bGxcblxuICB0aGlzLnJlZ2lzdHJ5W25hbWVdID0gaXRlbVxufSwgXCJ7MH0gaXMgYWxyZWFkeSByZWdpc3RlcmVkIVwiKVxuXG5cbmZ1bmN0aW9uIGVycm9yT25OdWxsKGZuLCBtc2cpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHZhciByZXN1bHQgPSBmbi5jYWxsKHRoaXMsIGFyZ3VtZW50c1swXSwgYXJndW1lbnRzWzFdKVxuICAgICAgLCBhcmdzID0gYXJndW1lbnRzXG5cbiAgICBpZihyZXN1bHQgPT09IG51bGwpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IobXNnLnJlcGxhY2UoL1xceyhcXGQrPylcXH0vZywgZnVuY3Rpb24oYSwgbSkge1xuICAgICAgICByZXR1cm4gYXJnc1srbV1cbiAgICAgIH0pKVxuXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9XG59XG5cbiIsInZhciBsaWJyYXJpZXMgPSByZXF1aXJlKCcuL2xpYnJhcmllcycpXG5cbm1vZHVsZS5leHBvcnRzID0gTWV0YVxuXG5mdW5jdGlvbiBNZXRhKCkge1xuICB0aGlzLl9hdXRvcmVnaXN0ZXIgPSB7XG4gICAgICBwbHVnaW46IHt9XG4gICAgLCB0YWc6IHt9XG4gICAgLCBmaWx0ZXI6IHt9XG4gIH1cblxuICB0aGlzLl9jYWNoZSA9IHt9XG5cbiAgdGhpcy5fY2xhc3NlcyA9IHtcbiAgICAgIGZpbHRlcjogbGlicmFyaWVzLkRlZmF1bHRGaWx0ZXJMaWJyYXJ5XG4gICAgLCBwbHVnaW46IGxpYnJhcmllcy5EZWZhdWx0UGx1Z2luTGlicmFyeVxuICAgICwgdGFnOiBsaWJyYXJpZXMuRGVmYXVsdFRhZ0xpYnJhcnlcbiAgfVxufVxuXG52YXIgY29ucyA9IE1ldGFcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLmNyZWF0ZVBsdWdpbkxpYnJhcnkgPSBjcmVhdGVMaWJyYXJ5KCdwbHVnaW4nKVxucHJvdG8uY3JlYXRlRmlsdGVyTGlicmFyeSA9IGNyZWF0ZUxpYnJhcnkoJ2ZpbHRlcicpXG5wcm90by5jcmVhdGVUYWdMaWJyYXJ5ID0gY3JlYXRlTGlicmFyeSgndGFnJylcblxucHJvdG8ucmVnaXN0ZXJQbHVnaW4gPSBjcmVhdGVBdXRvcmVnaXN0ZXIoJ3BsdWdpbicpXG5wcm90by5yZWdpc3RlckZpbHRlciA9IGNyZWF0ZUF1dG9yZWdpc3RlcignZmlsdGVyJylcbnByb3RvLnJlZ2lzdGVyVGFnID0gY3JlYXRlQXV0b3JlZ2lzdGVyKCd0YWcnKVxuXG5mdW5jdGlvbiBjcmVhdGVBdXRvcmVnaXN0ZXIobmFtZSkge1xuICByZXR1cm4gZnVuY3Rpb24oa2V5LCBpdGVtKSB7XG4gICAgaWYodGhpcy5fY2FjaGVbbmFtZV0pXG4gICAgICB0aGlzLl9jYWNoZVtuYW1lXS5yZWdpc3RlcihrZXksIGl0ZW0pO1xuICAgIGVsc2VcbiAgICAgIHRoaXMuX2F1dG9yZWdpc3RlcltuYW1lXVtrZXldID0gaXRlbTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVMaWJyYXJ5KG5hbWUpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIGlmKHRoaXMuX2NhY2hlW25hbWVdKVxuICAgICAgcmV0dXJuIHRoaXMuX2NhY2hlW25hbWVdO1xuXG4gICAgdmFyIGxpYiA9IG5ldyB0aGlzLl9jbGFzc2VzW25hbWVdXG5cbiAgICBmb3IodmFyIGtleSBpbiB0aGlzLl9hdXRvcmVnaXN0ZXJbbmFtZV0pIHtcbiAgICAgIGxpYi5yZWdpc3RlcihrZXksIHRoaXMuX2F1dG9yZWdpc3RlcltuYW1lXVtrZXldKVxuICAgIH1cblxuICAgIHRoaXMuX2NhY2hlW25hbWVdID0gbGliXG4gICAgcmV0dXJuIGxpYlxuICB9XG59XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gTm9kZUxpc3RcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCcuL3Byb21pc2UnKVxuXG5mdW5jdGlvbiBOb2RlTGlzdChub2Rlcykge1xuICB0aGlzLm5vZGVzID0gbm9kZXNcbn1cblxudmFyIGNvbnMgPSBOb2RlTGlzdFxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8ucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCkge1xuICB2YXIgcHJvbWlzZXMgPSBbXVxuICAgICwgcmVzdWx0cyA9IFtdXG4gICAgLCBub2RlcyA9IHRoaXMubm9kZXNcbiAgICAsIHJlc3VsdFxuXG4gIGZvcih2YXIgaSA9IDAsIGxlbiA9IG5vZGVzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgcmVzdWx0c1tpXSA9IHJlc3VsdCA9IG5vZGVzW2ldLnJlbmRlcihjb250ZXh0KVxuXG4gICAgaWYocmVzdWx0LmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgICBwcm9taXNlcy5wdXNoKHJlc3VsdClcbiAgICB9XG4gIH1cblxuICBpZihwcm9taXNlcy5sZW5ndGgpIHtcbiAgICByZXR1cm4gdGhpcy5yZXNvbHZlUHJvbWlzZXMocmVzdWx0cywgcHJvbWlzZXMpXG4gIH1cblxuICByZXR1cm4gcmVzdWx0cy5qb2luKCcnKVxufVxuXG5wcm90by5yZXNvbHZlUHJvbWlzZXMgPSBmdW5jdGlvbihyZXN1bHRzLCBwcm9taXNlcykge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgICAsIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuICAgICwgdG90YWwgPSBwcm9taXNlcy5sZW5ndGhcblxuICBmb3IodmFyIGkgPSAwLCBwID0gMCwgbGVuID0gcmVzdWx0cy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIGlmKHJlc3VsdHNbaV0uY29uc3RydWN0b3IgIT09IFByb21pc2UpXG4gICAgICBjb250aW51ZVxuXG4gICAgcHJvbWlzZXNbcCsrXS5vbmNlKCdkb25lJywgYmluZChpLCBmdW5jdGlvbihpZHgsIHJlc3VsdCkge1xuICAgICAgcmVzdWx0c1tpZHhdID0gcmVzdWx0XG5cbiAgICAgIGlmKCEtLXRvdGFsKVxuICAgICAgICBwcm9taXNlLnJlc29sdmUocmVzdWx0cy5qb2luKCcnKSlcbiAgICB9KSlcbiAgfVxuXG4gIHJldHVybiBwcm9taXNlXG59XG5cbmZ1bmN0aW9uIGJpbmQobnVtLCBmbikge1xuICByZXR1cm4gZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgcmV0dXJuIGZuKG51bSwgcmVzdWx0KVxuICB9XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFBhcnNlclxuXG52YXIgTm9kZUxpc3QgPSByZXF1aXJlKCcuL25vZGVfbGlzdCcpXG5cbnZhciBGaWx0ZXJBcHBsaWNhdGlvbiA9IHJlcXVpcmUoJy4vZmlsdGVyX2FwcGxpY2F0aW9uJylcbiAgLCBGaWx0ZXJMb29rdXAgPSByZXF1aXJlKCcuL2ZpbHRlcl9sb29rdXAnKVxuICAsIEZpbHRlckNoYWluID0gcmVxdWlyZSgnLi9maWx0ZXJfY2hhaW4nKVxuICAsIFRhZ1Rva2VuID0gcmVxdWlyZSgnLi90YWdfdG9rZW4nKVxuXG5mdW5jdGlvbiBQYXJzZXIodG9rZW5zLCB0YWdzLCBmaWx0ZXJzLCBwbHVnaW5zKSB7XG4gIHRoaXMudG9rZW5zID0gdG9rZW5zXG4gIHRoaXMudGFncyA9IHRhZ3NcbiAgdGhpcy5maWx0ZXJzID0gZmlsdGVyc1xuICB0aGlzLnBsdWdpbnMgPSBwbHVnaW5zXG5cbiAgLy8gZm9yIHVzZSB3aXRoIGV4dGVuZHMgLyBibG9jayB0YWdzXG4gIHRoaXMubG9hZGVkQmxvY2tzID0gW11cbn1cblxudmFyIGNvbnMgPSBQYXJzZXJcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLmNhY2hlID0ge31cblxucHJvdG8ucGFyc2UgPSBmdW5jdGlvbih1bnRpbCkge1xuICB2YXIgb2theSA9ICF1bnRpbFxuICAgICwgdG9rZW4gPSBudWxsXG4gICAgLCBvdXRwdXQgPSBbXVxuICAgICwgbm9kZVxuXG4gIHdoaWxlKHRoaXMudG9rZW5zLmxlbmd0aCA+IDApIHtcbiAgICB0b2tlbiA9IHRoaXMudG9rZW5zLnNoaWZ0KClcblxuICAgIGlmKHVudGlsICYmIHRva2VuLmlzKHVudGlsKSAmJiB0b2tlbi5jb25zdHJ1Y3RvciA9PT0gVGFnVG9rZW4pIHtcbiAgICAgIHRoaXMudG9rZW5zLnVuc2hpZnQodG9rZW4pXG4gICAgICBva2F5ID0gdHJ1ZVxuXG4gICAgICBicmVha1xuICAgIH1cblxuICAgIGlmKG5vZGUgPSB0b2tlbi5ub2RlKHRoaXMpKSB7XG4gICAgICBvdXRwdXQucHVzaChub2RlKVxuICAgIH1cbiAgfVxuXG4gIGlmKCFva2F5KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdleHBlY3RlZCBvbmUgb2YgJyArIHVudGlsKVxuICB9XG5cbiAgcmV0dXJuIG5ldyBOb2RlTGlzdChvdXRwdXQpXG59XG5cbnByb3RvLmNvbXBpbGVOdW1iZXIgPSBmdW5jdGlvbihjb250ZW50LCBpZHgsIG91dHB1dCkge1xuICB2YXIgZGVjaW1hbCA9IGNvbnRlbnQuY2hhckF0KGlkeCkgPT09ICcuJ1xuICAgICwgYml0cyA9IGRlY2ltYWwgPyBbJzAuJ10gOiBbXVxuICAgICwgcGFyc2VcbiAgICAsIGNcblxuICBkbyB7XG4gICAgYyA9IGNvbnRlbnQuY2hhckF0KGlkeClcblxuICAgIGlmKGMgPT09ICcuJykge1xuICAgICAgaWYoZGVjaW1hbCkge1xuICAgICAgICBicmVha1xuICAgICAgfVxuXG4gICAgICBkZWNpbWFsID0gdHJ1ZVxuICAgICAgYml0cy5wdXNoKCcuJylcbiAgICB9IGVsc2UgaWYoL1xcZC8udGVzdChjKSkge1xuICAgICAgYml0cy5wdXNoKGMpXG4gICAgfVxuICB9IHdoaWxlKCsraWR4IDwgY29udGVudC5sZW5ndGgpXG5cbiAgcGFyc2UgPSBkZWNpbWFsID8gcGFyc2VGbG9hdCA6IHBhcnNlSW50XG4gIG91dHB1dC5wdXNoKHBhcnNlKGJpdHMuam9pbignJyksIDEwKSlcblxuICByZXR1cm4gaWR4XG59XG5cbnByb3RvLmNvbXBpbGVTdHJpbmcgPSBmdW5jdGlvbihjb250ZW50LCBpZHgsIG91dHB1dCkge1xuICB2YXIgdHlwZSA9IGNvbnRlbnQuY2hhckF0KGlkeClcbiAgICAsIGVzY2FwZWQgPSBmYWxzZVxuICAgICwgYml0cyA9IFtdXG4gICAgLCBjXG5cbiAgKytpZHhcblxuICBkbyB7XG4gICAgYyA9IGNvbnRlbnQuY2hhckF0KGlkeClcblxuICAgIGlmKCFlc2NhcGVkKSB7XG4gICAgICBpZihjID09PSAnXFxcXCcpIHtcbiAgICAgICAgZXNjYXBlZCA9IHRydWVcblxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICBpZihjID09PSB0eXBlKSB7XG4gICAgICAgIGJyZWFrXG4gICAgICB9XG5cbiAgICAgIGJpdHMucHVzaChjKVxuICAgIH0gZWxzZSB7XG4gICAgICBpZighL1snXCJcXFxcXS8udGVzdChjKSkge1xuICAgICAgICBiaXRzLnB1c2goJ1xcXFwnKVxuICAgICAgfVxuXG4gICAgICBiaXRzLnB1c2goYylcbiAgICAgIGVzY2FwZWQgPSBmYWxzZVxuICAgIH1cblxuICB9IHdoaWxlKCsraWR4IDwgY29udGVudC5sZW5ndGgpXG5cbiAgb3V0cHV0LnB1c2goYml0cy5qb2luKCcnKSlcblxuICByZXR1cm4gaWR4XG59XG5cbnByb3RvLmNvbXBpbGVOYW1lID0gZnVuY3Rpb24oY29udGVudCwgaWR4LCBvdXRwdXQpIHtcbiAgdmFyIG91dCA9IFtdXG4gICAgLCBjXG5cbiAgZG8ge1xuICAgIGMgPSBjb250ZW50LmNoYXJBdChpZHgpXG5cbiAgICBpZigvW15cXHdcXGRcXF9dLy50ZXN0KGMpKSB7XG4gICAgICBicmVha1xuICAgIH1cblxuICAgIG91dC5wdXNoKGMpXG4gIH0gd2hpbGUoKytpZHggPCBjb250ZW50Lmxlbmd0aClcblxuICBvdXRwdXQucHVzaChvdXQuam9pbignJykpXG5cbiAgcmV0dXJuIGlkeFxufVxuXG5wcm90by5jb21waWxlRmlsdGVyID0gZnVuY3Rpb24oY29udGVudCwgaWR4LCBvdXRwdXQpIHtcbiAgdmFyIGZpbHRlck5hbWVcbiAgICAsIG9sZExlblxuICAgICwgYml0c1xuXG4gICsraWR4XG5cbiAgaWR4ID0gdGhpcy5jb21waWxlTmFtZShjb250ZW50LCBpZHgsIG91dHB1dClcbiAgZmlsdGVyTmFtZSA9IG91dHB1dC5wb3AoKVxuXG4gIGlmKGNvbnRlbnQuY2hhckF0KGlkeCkgIT09ICc6Jykge1xuICAgIG91dHB1dC5wdXNoKG5ldyBGaWx0ZXJBcHBsaWNhdGlvbihmaWx0ZXJOYW1lLCBbXSkpXG5cbiAgICByZXR1cm4gaWR4IC0gMVxuICB9XG5cbiAgKytpZHhcblxuICBvbGRMZW4gPSBvdXRwdXQubGVuZ3RoXG4gIGlkeCA9IHRoaXMuY29tcGlsZUZ1bGwoY29udGVudCwgaWR4LCBvdXRwdXQsIHRydWUpXG4gIGJpdHMgPSBvdXRwdXQuc3BsaWNlKG9sZExlbiwgb3V0cHV0Lmxlbmd0aCAtIG9sZExlbilcblxuICBvdXRwdXQucHVzaChuZXcgRmlsdGVyQXBwbGljYXRpb24oZmlsdGVyTmFtZSwgYml0cykpXG5cbiAgcmV0dXJuIGlkeFxufVxuXG5wcm90by5jb21waWxlTG9va3VwID0gZnVuY3Rpb24oY29udGVudCwgaWR4LCBvdXRwdXQpIHtcbiAgdmFyIGJpdHMgPSBbXVxuXG4gIGRvIHtcbiAgICBpZHggPSB0aGlzLmNvbXBpbGVOYW1lKGNvbnRlbnQsIGlkeCwgb3V0cHV0KVxuICAgIGJpdHMucHVzaChvdXRwdXQucG9wKCkpXG5cbiAgICBpZihjb250ZW50LmNoYXJBdChpZHgpICE9PSAnLicpIHtcbiAgICAgIGJyZWFrXG4gICAgfVxuICB9IHdoaWxlKCsraWR4IDwgY29udGVudC5sZW5ndGgpXG5cbiAgb3V0cHV0LnB1c2gobmV3IEZpbHRlckxvb2t1cChiaXRzKSlcblxuICByZXR1cm4gaWR4IC0gMVxufVxuXG5wcm90by5jb21waWxlRnVsbCA9IGZ1bmN0aW9uKGNvbnRlbnQsIGlkeCwgb3V0cHV0LCBvbWl0UGlwZSkge1xuICB2YXIgY1xuXG4gIG91dHB1dCA9IG91dHB1dCB8fCBbXVxuICBpZHggPSBpZHggfHwgMFxuICAvLyBzb21ldGhpbmd8ZmlsdGVybmFtZVs6YXJnLCBhcmddXG4gIC8vIFwicXVvdGVzXCJcbiAgLy8gMVxuICAvLyAxLjJcbiAgLy8gdHJ1ZSB8IGZhbHNlXG4gIC8vIHN3YWxsb3cgbGVhZGluZyB3aGl0ZXNwYWNlLlxuXG4gIHdoaWxlKC9cXHMvLnRlc3QoY29udGVudC5jaGFyQXQoaWR4KSkpIHtcbiAgICArK2lkeFxuICB9XG5cbiAgZG8ge1xuICAgIGMgPSBjb250ZW50LmNoYXJBdChpZHgpXG5cbiAgICBpZigvWyxcXHNdLy50ZXN0KGMpKSB7XG4gICAgICBicmVha1xuICAgIH1cblxuICAgIGlmKG9taXRQaXBlICYmIGMgPT09ICd8Jykge1xuICAgICAgLS1pZHhcblxuICAgICAgYnJlYWtcbiAgICB9XG5cbiAgICBzd2l0Y2godHJ1ZSkge1xuICAgICAgY2FzZSAvW1xcZFxcLl0vLnRlc3QoYyk6XG4gICAgICAgIGlkeCA9IHRoaXMuY29tcGlsZU51bWJlcihjb250ZW50LCBpZHgsIG91dHB1dClcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgL1snXCJdLy50ZXN0KGMpOlxuICAgICAgICBpZHggPSB0aGlzLmNvbXBpbGVTdHJpbmcoY29udGVudCwgaWR4LCBvdXRwdXQpXG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlIGMgPT09ICd8JzpcbiAgICAgICAgaWR4ID0gdGhpcy5jb21waWxlRmlsdGVyKGNvbnRlbnQsIGlkeCwgb3V0cHV0KVxuICAgICAgICBicmVha1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWR4ID0gdGhpcy5jb21waWxlTG9va3VwKGNvbnRlbnQsIGlkeCwgb3V0cHV0KVxuICAgICAgICBicmVha1xuICAgIH1cbiAgfSB3aGlsZSgrK2lkeCA8IGNvbnRlbnQubGVuZ3RoKVxuXG4gIHJldHVybiBpZHhcbn1cblxucHJvdG8uY29tcGlsZSA9IGZ1bmN0aW9uKGNvbnRlbnQpIHtcbiAgdmFyIG91dHB1dCA9IFtdXG5cbiAgaWYodGhpcy5jYWNoZVtjb250ZW50XSkge1xuICAgIHJldHVybiB0aGlzLmNhY2hlW2NvbnRlbnRdXG4gIH1cblxuICB0aGlzLmNvbXBpbGVGdWxsKGNvbnRlbnQsIDAsIG91dHB1dClcblxuICBvdXRwdXQgPSB0aGlzLmNhY2hlW2NvbnRlbnRdID0gbmV3IEZpbHRlckNoYWluKG91dHB1dCwgdGhpcylcbiAgb3V0cHV0LmF0dGFjaCh0aGlzKVxuXG4gIHJldHVybiBvdXRwdXRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gUHJvbWlzZVxuXG5mdW5jdGlvbiBQcm9taXNlKCkge1xuICB0aGlzLnRyaWdnZXIgPSBudWxsXG59XG5cbnZhciBjb25zID0gUHJvbWlzZVxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8ucmVzb2x2ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gIHZhciB0cmlnZ2VyID0gdGhpcy50cmlnZ2VyXG5cbiAgaWYoIXZhbHVlIHx8IHZhbHVlLmNvbnN0cnVjdG9yICE9PSBjb25zKSB7XG4gICAgcmV0dXJuIHRyaWdnZXIodmFsdWUpXG4gIH1cblxuICB2YWx1ZS5vbmNlKCdkb25lJywgdHJpZ2dlcilcbn1cblxucHJvdG8ub25jZSA9IGZ1bmN0aW9uKGV2LCBmbikge1xuICB0aGlzLnRyaWdnZXIgPSBmblxufVxuXG5jb25zLnRvUHJvbWlzZSA9IGZ1bmN0aW9uKGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiBwcm9taXNpZmllZCgpIHtcbiAgICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKVxuICAgICAgLCBwcm9taXNlID0gbmV3IGNvbnNcbiAgICAgICwgc2VsZiA9IHRoaXNcblxuICAgIGFyZ3MucHVzaChvbnJlYWR5KVxuXG4gICAgc2V0VGltZW91dChiYW5nLCAwKVxuXG4gICAgcmV0dXJuIHByb21pc2VcblxuICAgIGZ1bmN0aW9uIGJhbmcoKSB7XG4gICAgICBmbi5hcHBseShzZWxmLCBhcmdzKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG9ucmVhZHkoZXJyLCBkYXRhKSB7XG4gICAgICBwcm9taXNlLnJlc29sdmUoZGF0YSlcbiAgICB9XG4gIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gVGFnVG9rZW5cblxudmFyIFRva2VuID0gcmVxdWlyZSgnLi90b2tlbicpXG5cbmZ1bmN0aW9uIFRhZ1Rva2VuKGNvbnRlbnQsIGxpbmUpIHtcbiAgVG9rZW4uY2FsbCh0aGlzLCBjb250ZW50LCBsaW5lKVxufVxuXG52YXIgY29ucyA9IFRhZ1Rva2VuXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZSA9IG5ldyBUb2tlblxuXG5wcm90by5jb25zdHJ1Y3RvciA9IGNvbnNcblxucHJvdG8ubm9kZSA9IGZ1bmN0aW9uKHBhcnNlcikge1xuICB2YXIgdGFnID0gcGFyc2VyLnRhZ3MubG9va3VwKHRoaXMubmFtZSlcblxuICByZXR1cm4gdGFnKHRoaXMuY29udGVudCwgcGFyc2VyKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBCbG9ja05vZGVcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCcuLi9wcm9taXNlJylcbiAgLCBCbG9ja0NvbnRleHQgPSByZXF1aXJlKCcuLi9ibG9ja19jb250ZXh0JylcblxuZnVuY3Rpb24gQmxvY2tOb2RlKG5hbWUsIG5vZGVzKSB7XG4gIHRoaXMubmFtZSA9IG5hbWVcbiAgdGhpcy5ub2RlcyA9IG5vZGVzXG5cbiAgdGhpcy5jb250ZXh0ID0gbnVsbFxufVxuXG52YXIgY29ucyA9IEJsb2NrTm9kZVxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8ucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCkge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgICAsIGJsb2NrQ29udGV4dCA9IEJsb2NrQ29udGV4dC5mcm9tKGNvbnRleHQpXG4gICAgLCByZXN1bHRcbiAgICAsIGJsb2NrXG4gICAgLCBwdXNoXG5cbiAgaWYoIWJsb2NrQ29udGV4dCkge1xuICAgIGNvbnRleHQuYmxvY2sgPSBzZWxmXG4gICAgcmV0dXJuIHNlbGYubm9kZXMucmVuZGVyKGNvbnRleHQpXG4gIH1cblxuICBibG9jayA9IHB1c2ggPSBibG9ja0NvbnRleHQucG9wKHNlbGYubmFtZSlcblxuICBpZighYmxvY2spIHtcbiAgICBibG9jayA9IHNlbGZcbiAgfVxuXG4gIGJsb2NrID0gbmV3IEJsb2NrTm9kZShibG9jay5uYW1lLCBibG9jay5ub2RlcylcblxuICBibG9jay5jb250ZXh0ID0gY29udGV4dFxuICBibG9jay5jb250ZXh0LmJsb2NrID0gYmxvY2tcbiAgY29udGV4dC5ibG9jayA9IGJsb2NrXG5cbiAgcmVzdWx0ID0gYmxvY2subm9kZXMucmVuZGVyKGNvbnRleHQpXG5cbiAgaWYocHVzaCkge1xuICAgIGJsb2NrQ29udGV4dC5wdXNoKHNlbGYubmFtZSwgcHVzaClcbiAgfVxuXG4gIHJldHVybiByZXN1bHRcblxufVxuXG5wcm90by5pc0Jsb2NrTm9kZSA9IHRydWVcblxucHJvdG8uX3N1cGVyID0gZnVuY3Rpb24oKSB7XG4gIHZhciBibG9ja0NvbnRleHQgPSBCbG9ja0NvbnRleHQuZnJvbSh0aGlzLmNvbnRleHQpXG4gICAgLCBibG9ja1xuICAgICwgc3RyXG5cbiAgaWYoYmxvY2tDb250ZXh0ICYmIChibG9jayA9IGJsb2NrQ29udGV4dC5nZXQodGhpcy5uYW1lKSkpIHtcbiAgICBzdHIgPSBuZXcgU3RyaW5nKGJsb2NrLnJlbmRlcih0aGlzLmNvbnRleHQpKVxuICAgIHN0ci5zYWZlID0gdHJ1ZVxuICAgIHJldHVybiBzdHJcbiAgfVxuXG4gIHJldHVybiAnJ1xufVxuXG5jb25zLnBhcnNlID0gZnVuY3Rpb24oY29udGVudHMsIHBhcnNlcikge1xuICB2YXIgYml0cyA9IGNvbnRlbnRzLnNwbGl0KCcgJylcbiAgICAsIG5hbWUgPSBiaXRzWzFdXG4gICAgLCBsb2FkZWQgPSBwYXJzZXIubG9hZGVkQmxvY2tzXG4gICAgLCBub2Rlc1xuXG4gIGZvcih2YXIgaSA9IDAsIGxlbiA9IGxvYWRlZC5sZW5ndGg7IGkgPCBsZW47ICsraSlcbiAgICBpZihsb2FkZWRbaV0gPT09IG5hbWUpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Jsb2NrIHRhZyB3aXRoIHRoZSBuYW1lIFwiJytuYW1lKydcIiBhcHBlYXJzIG1vcmUgdGhhbiBvbmNlJylcblxuICBsb2FkZWQucHVzaChuYW1lKVxuXG4gIG5vZGVzID0gcGFyc2VyLnBhcnNlKFsnZW5kYmxvY2snXSlcbiAgcGFyc2VyLnRva2Vucy5zaGlmdCgpXG5cbiAgcmV0dXJuIG5ldyBjb25zKG5hbWUsIG5vZGVzKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBDb21tZW50Tm9kZVxuXG5mdW5jdGlvbiBDb21tZW50Tm9kZSgpIHtcbiAgLy8gbm8tb3AuXG59XG5cbnZhciBjb25zID0gQ29tbWVudE5vZGVcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLnJlbmRlciA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgcmV0dXJuICcnXG59XG5cbmNvbnMucGFyc2UgPSBmdW5jdGlvbihjb250ZW50cywgcGFyc2VyKSB7XG4gIG5sID0gcGFyc2VyLnBhcnNlKFsnZW5kY29tbWVudCddKVxuICBwYXJzZXIudG9rZW5zLnNoaWZ0KClcblxuICByZXR1cm4gbmV3IGNvbnNcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gRGVidWdOb2RlXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi4vcHJvbWlzZScpXG4gICwgQ29udGV4dCA9IHJlcXVpcmUoJy4uL2NvbnRleHQnKVxuICAsIGRlYnVnID0gcmVxdWlyZSgnLi4vZGVidWcnKVxuXG5mdW5jdGlvbiBEZWJ1Z05vZGUodmFybmFtZSkge1xuICB0aGlzLnZhcm5hbWUgPSB2YXJuYW1lXG59XG5cbnZhciBjb25zID0gRGVidWdOb2RlXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by5yZW5kZXIgPSBmdW5jdGlvbihjb250ZXh0LCB2YWx1ZSkge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgICAsIHRhcmdldCA9IGNvbnRleHRcbiAgICAsIHByb21pc2VcblxuICBpZihzZWxmLnZhcm5hbWUgIT09IG51bGwpIHtcbiAgICB2YWx1ZSA9IGFyZ3VtZW50cy5sZW5ndGggPT09IDIgPyB2YWx1ZSA6IHNlbGYudmFybmFtZS5yZXNvbHZlKGNvbnRleHQpXG4gICAgaWYodmFsdWUgJiYgdmFsdWUuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcbiAgICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuICAgICAgdmFsdWUub25jZSgnZG9uZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgcHJvbWlzZS5yZXNvbHZlKHNlbGYucmVuZGVyKGNvbnRleHQsIGRhdGEpKVxuICAgICAgfSlcbiAgICAgIHJldHVybiBwcm9taXNlXG4gICAgfVxuICAgIHRhcmdldCA9IHZhbHVlXG4gIH1cblxuICBpZih0YXJnZXQgPT09IGNvbnRleHQpIHtcbiAgICB3aGlsZSh0YXJnZXQgIT09IENvbnRleHQucHJvdG90eXBlKSB7XG4gICAgICBkZWJ1Zy5sb2codGFyZ2V0KVxuICAgICAgdGFyZ2V0ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHRhcmdldClcbiAgICB9XG4gICAgcmV0dXJuICcnXG4gIH1cbiAgZGVidWcubG9nKHRhcmdldClcbiAgcmV0dXJuICcnXG59XG5cbmNvbnMucGFyc2UgPSBmdW5jdGlvbihjb250ZW50cywgcGFyc2VyKSB7XG4gIHZhciBiaXRzID0gY29udGVudHMuc3BsaXQoJyAnKVxuXG4gIHJldHVybiBuZXcgRGVidWdOb2RlKGJpdHNbMV0gPyBwYXJzZXIuY29tcGlsZShiaXRzWzFdKSA6IG51bGwpXG59XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gRXh0ZW5kc05vZGVcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCcuLi9wcm9taXNlJylcbiAgLCBCbG9ja0NvbnRleHQgPSByZXF1aXJlKCcuLi9ibG9ja19jb250ZXh0JylcblxuXG5mdW5jdGlvbiBFeHRlbmRzTm9kZShwYXJlbnQsIG5vZGVzLCBsb2FkZXIpIHtcbiAgdGhpcy5wYXJlbnQgPSBwYXJlbnRcbiAgdGhpcy5sb2FkZXIgPSBsb2FkZXJcblxuICB0aGlzLmJsb2NrcyA9IHt9XG5cbiAgZm9yKHZhciBpID0gMCwgbGVuID0gbm9kZXMubm9kZXMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZighbm9kZXMubm9kZXNbaV0uaXNCbG9ja05vZGUpXG4gICAgICBjb250aW51ZVxuXG4gICAgdGhpcy5ibG9ja3Nbbm9kZXMubm9kZXNbaV0ubmFtZV0gPSBub2Rlcy5ub2Rlc1tpXVxuICB9XG59XG5cbnZhciBjb25zID0gRXh0ZW5kc05vZGVcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLmlzRXh0ZW5kc05vZGUgPSB0cnVlXG5cbnByb3RvLnJlbmRlciA9IGZ1bmN0aW9uKGNvbnRleHQsIHBhcmVudCkge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgICAsIHByb21pc2VcblxuICBwYXJlbnQgPSBwYXJlbnQgfHwgdGhpcy5wYXJlbnQucmVzb2x2ZShjb250ZXh0KVxuXG4gIGlmKHBhcmVudC5jb25zdHJ1Y3RvciA9PT0gUHJvbWlzZSkge1xuICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuXG4gICAgcGFyZW50Lm9uY2UoJ2RvbmUnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBwcm9taXNlLnJlc29sdmUoc2VsZi5yZW5kZXIoY29udGV4dCwgZGF0YSkpXG4gICAgfSlcblxuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxuICBwYXJlbnQgPSBzZWxmLmdldF90ZW1wbGF0ZShwYXJlbnQpXG5cbiAgaWYocGFyZW50LmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG5cbiAgICBwYXJlbnQub25jZSgnZG9uZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHByb21pc2UucmVzb2x2ZShzZWxmLnJlbmRlcihjb250ZXh0LCBkYXRhKSlcbiAgICB9KVxuXG4gICAgcmV0dXJuIHByb21pc2VcbiAgfVxuXG4gIHZhciBibG9ja0NvbnRleHQgPSBCbG9ja0NvbnRleHQuZnJvbShjb250ZXh0KSB8fCBCbG9ja0NvbnRleHQuaW50byhjb250ZXh0KVxuICAgICwgYmxvY2tzID0ge31cbiAgICAsIG5vZGVMaXN0ID0gcGFyZW50LmdldE5vZGVMaXN0KClcbiAgICAsIGV4dGVuZHNJRFggPSBmYWxzZVxuXG4gIGJsb2NrQ29udGV4dC5hZGQoc2VsZi5ibG9ja3MpXG5cbiAgZm9yKHZhciBpID0gMCwgbGVuID0gbm9kZUxpc3Qubm9kZXMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICBpZihub2RlTGlzdC5ub2Rlc1tpXS5pc0V4dGVuZHNOb2RlKSB7XG4gICAgICBleHRlbmRzSURYID0gdHJ1ZVxuICAgICAgYnJlYWtcbiAgICB9XG5cbiAgICBpZihub2RlTGlzdC5ub2Rlc1tpXS5pc0Jsb2NrTm9kZSkge1xuICAgICAgYmxvY2tzW25vZGVMaXN0Lm5vZGVzW2ldLm5hbWVdID0gbm9kZUxpc3Qubm9kZXNbaV1cbiAgICB9XG4gIH1cblxuICBpZighZXh0ZW5kc0lEWCkge1xuICAgIGJsb2NrQ29udGV4dC5hZGQoYmxvY2tzKVxuICB9XG5cbiAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG5cbiAgcGFyZW50LnJlbmRlcihjb250ZXh0LCBmdW5jdGlvbihlcnIsIGRhdGEpIHtcbiAgICBwcm9taXNlLnJlc29sdmUoZGF0YSlcbiAgfSlcblxuICByZXR1cm4gcHJvbWlzZVxufVxuXG5wcm90by5nZXRfdGVtcGxhdGUgPSBmdW5jdGlvbihwYXJlbnQpIHtcbiAgaWYodHlwZW9mIHBhcmVudCAhPT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gcGFyZW50XG4gIH1cblxuICByZXR1cm4gdGhpcy5sb2FkZXIocGFyZW50KVxufVxuXG5jb25zLnBhcnNlID0gZnVuY3Rpb24oY29udGVudHMsIHBhcnNlcikge1xuICB2YXIgYml0cyA9IGNvbnRlbnRzLnNwbGl0KCcgJylcbiAgICAsIHBhcmVudCA9IHBhcnNlci5jb21waWxlKGJpdHMuc2xpY2UoMSkuam9pbignICcpKVxuICAgICwgbm9kZXMgPSBwYXJzZXIucGFyc2UoKVxuICAgICwgbG9hZGVyID0gcGFyc2VyLnBsdWdpbnMubG9va3VwKCdsb2FkZXInKVxuXG4gIHJldHVybiBuZXcgY29ucyhwYXJlbnQsIG5vZGVzLCBsb2FkZXIpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IEZvck5vZGVcblxudmFyIE5vZGVMaXN0ID0gcmVxdWlyZSgnLi4vbm9kZV9saXN0JylcbiAgLCBQcm9taXNlID0gcmVxdWlyZSgnLi4vcHJvbWlzZScpXG5cbmZ1bmN0aW9uIEZvck5vZGUodGFyZ2V0LCB1bnBhY2ssIGxvb3AsIGVtcHR5LCByZXZlcnNlZCkge1xuICB0aGlzLnRhcmdldCA9IHRhcmdldFxuICB0aGlzLnVucGFjayA9IHVucGFja1xuICB0aGlzLmxvb3AgPSBsb29wXG4gIHRoaXMuZW1wdHkgPSBlbXB0eVxuICB0aGlzLnJldmVyc2VkID0gcmV2ZXJzZWRcbn1cblxudmFyIGNvbnMgPSBGb3JOb2RlXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5mdW5jdGlvbiBnZXRJbkluZGV4KGJpdHMpIHtcbiAgZm9yKHZhciBpID0gMCwgbGVuID0gYml0cy5sZW5ndGg7IGkgPCBsZW47ICsraSlcbiAgICBpZihiaXRzW2ldID09PSAnaW4nKVxuICAgICAgcmV0dXJuIGlcblxuICByZXR1cm4gLTFcbn1cblxucHJvdG8ucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCwgdmFsdWUpIHtcbiAgdmFyIHNlbGYgPSB0aGlzXG4gICAgLCBhcnIgPSB2YWx1ZSB8fCBzZWxmLnRhcmdldC5yZXNvbHZlKGNvbnRleHQpXG4gICAgLCBwcm9taXNlXG5cblxuICBpZihhcnIgJiYgYXJyLmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG4gICAgYXJyLm9uY2UoJ2RvbmUnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBwcm9taXNlLnJlc29sdmUoc2VsZi5yZW5kZXIoY29udGV4dCwgZGF0YSkpXG4gICAgfSlcblxuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxuICBpZihhcnIgPT09IHVuZGVmaW5lZCB8fCBhcnIgPT09IG51bGwpIHtcbiAgICBhcnIgPSBbXVxuICB9XG5cbiAgdmFyIGJpdHMgPSBbXVxuICAgICwgcHJvbWlzZXMgPSBbXVxuICAgICwgcGFyZW50ID0gY29udGV4dC5mb3Jsb29wXG4gICAgLCBsb29wID0ge31cbiAgICAsIHJlc3VsdFxuICAgICwgY3R4dFxuICAgICwgc3ViXG5cbiAgaWYoISgnbGVuZ3RoJyBpbiBhcnIpKSB7XG4gICAgZm9yKHZhciBrZXkgaW4gYXJyKSBpZihhcnIuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgYml0cy5wdXNoKGtleSlcbiAgICB9XG5cbiAgICBhcnIgPSBiaXRzLnNsaWNlKClcbiAgICBiaXRzLmxlbmd0aCA9IDBcbiAgfVxuXG4gIGlmKCFhcnIubGVuZ3RoKSB7XG4gICAgcmV0dXJuIHNlbGYuZW1wdHkucmVuZGVyKGNvbnRleHQpXG4gIH1cblxuICBzdWIgPSBzZWxmLnJldmVyc2VkID8gYXJyLmxlbmd0aCAtIDEgOiAwXG5cbiAgZm9yKHZhciBpID0gMCwgbGVuID0gYXJyLmxlbmd0aCwgaWR4OyBpIDwgbGVuOyArK2kpIHtcbiAgICBjdHh0ID0gY29udGV4dC5jb3B5KClcbiAgICBpZHggPSBNYXRoLmFicyhzdWIgLSBpKVxuICAgIGxvb3AuY291bnRlciA9IGkgKyAxXG4gICAgbG9vcC5jb3VudGVyMCA9IGlcbiAgICBsb29wLnJldmNvdW50ZXIgPSBsZW4gLSBpXG4gICAgbG9vcC5yZXZjb3VudGVyMCA9IGxlbiAtIChpICsgMSlcbiAgICBsb29wLmZpcnN0ID0gaSA9PT0gMFxuICAgIGxvb3AubGFzdCA9IGkgPT09IGxlbiAtIDFcbiAgICBsb29wLnBhcmVudGxvb3AgPSBwYXJlbnRcbiAgICBjdHh0LmZvcmxvb3AgPSBsb29wXG5cbiAgICBpZihzZWxmLnVucGFjay5sZW5ndGggPT09IDEpXG4gICAgICBjdHh0W3NlbGYudW5wYWNrWzBdXSA9IGFycltpZHhdXG4gICAgZWxzZSBmb3IodmFyIHUgPSAwOyB1IDwgc2VsZi51bnBhY2subGVuZ3RoOyArK3UpXG4gICAgICBjdHh0W3NlbGYudW5wYWNrW3VdXSA9IGFycltpZHhdW3VdXG5cbiAgICByZXN1bHQgPSBzZWxmLmxvb3AucmVuZGVyKGN0eHQpXG4gICAgaWYocmVzdWx0LmNvbnN0cnVjdG9yID09PSBQcm9taXNlKVxuICAgICAgcHJvbWlzZXMucHVzaChyZXN1bHQpXG5cbiAgICBiaXRzLnB1c2gocmVzdWx0KVxuICB9XG5cbiAgaWYocHJvbWlzZXMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIHNlbGYubG9vcC5yZXNvbHZlUHJvbWlzZXMoYml0cywgcHJvbWlzZXMpXG4gIH1cblxuICByZXR1cm4gYml0cy5qb2luKCcnKVxufVxuXG5jb25zLnBhcnNlID0gZnVuY3Rpb24oY29udGVudHMsIHBhcnNlcikge1xuICB2YXIgYml0cyA9IGNvbnRlbnRzLnNwbGl0KC9cXHMrLylcbiAgICAsIHJldmVyc2VkID0gYml0c1tiaXRzLmxlbmd0aC0xXSA9PT0gJ3JldmVyc2VkJ1xuICAgICwgaWR4SW4gPSBnZXRJbkluZGV4KGJpdHMpXG4gICAgLCB2YXJpYWJsZXMgPSBiaXRzLnNsaWNlKDEsIGlkeEluKVxuICAgICwgdGFyZ2V0ID0gcGFyc2VyLmNvbXBpbGUoYml0c1tpZHhJbisxXSlcbiAgICAsIG5vZGVsaXN0ID0gcGFyc2VyLnBhcnNlKFsnZW1wdHknLCAnZW5kZm9yJ10pXG4gICAgLCB1bnBhY2sgPSBbXVxuICAgICwgZW1wdHlcblxuXG4gIGlmKHBhcnNlci50b2tlbnMuc2hpZnQoKS5pcyhbJ2VtcHR5J10pKSB7XG4gICAgZW1wdHkgPSBwYXJzZXIucGFyc2UoWydlbmRmb3InXSlcbiAgICBwYXJzZXIudG9rZW5zLnNoaWZ0KClcbiAgfSBlbHNlIHtcbiAgICBlbXB0eSA9IG5ldyBOb2RlTGlzdChbXSlcbiAgfVxuXG4gIHZhcmlhYmxlcyA9IHZhcmlhYmxlcy5qb2luKCcgJykuc3BsaXQoJywnKVxuICBmb3IodmFyIGkgPSAwLCBsZW4gPSB2YXJpYWJsZXMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICB2YXJpYWJsZXNbaV0gPSB2YXJpYWJsZXNbaV0ucmVwbGFjZSgvKF5cXHMrfFxccyskKS8sICcnKVxuICAgIGlmKHZhcmlhYmxlc1tpXSlcbiAgICAgIHVucGFjay5wdXNoKHZhcmlhYmxlc1tpXSlcbiAgfVxuXG4gIHJldHVybiBuZXcgY29ucyh0YXJnZXQsIHVucGFjaywgbm9kZWxpc3QsIGVtcHR5LCByZXZlcnNlZCk7XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IEVuZFRva2VuXG5cbmZ1bmN0aW9uIEVuZFRva2VuKCkge1xuICB0aGlzLmxicCA9IDBcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gSW5maXhPcGVyYXRvclxuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJy4uLy4uL3Byb21pc2UnKVxuXG5mdW5jdGlvbiBJbmZpeE9wZXJhdG9yKGJwLCBjbXApIHtcbiAgdGhpcy5sYnAgPSBicFxuICB0aGlzLmNtcCA9IGNtcFxuXG4gIHRoaXMuZmlyc3QgPVxuICB0aGlzLnNlY29uZCA9IG51bGxcbn1cblxudmFyIGNvbnMgPSBJbmZpeE9wZXJhdG9yXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by5udWQgPSBmdW5jdGlvbihwYXJzZXIpIHtcbiAgdGhyb3cgbmV3IEVycm9yKFwiVW5leHBlY3RlZCB0b2tlblwiKVxufVxuXG5wcm90by5sZWQgPSBmdW5jdGlvbihsaHMsIHBhcnNlcikge1xuICB0aGlzLmZpcnN0ID0gbGhzXG4gIHRoaXMuc2Vjb25kID0gcGFyc2VyLmV4cHJlc3Npb24odGhpcy5sYnApXG4gIHJldHVybiB0aGlzXG59XG5cbnByb3RvLmV2YWx1YXRlID0gZnVuY3Rpb24oY29udGV4dCwgZmlyc3QsIHNlY29uZCwgc2VudEZpcnN0LCBzZW50U2Vjb25kKSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICAgICwgcHJvbWlzZVxuXG4gIGZpcnN0ID0gc2VudEZpcnN0ID8gZmlyc3QgOiBzZWxmLmZpcnN0LmV2YWx1YXRlKGNvbnRleHQpXG5cbiAgaWYoZmlyc3QgJiYgZmlyc3QuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcbiAgICBwcm9taXNlID0gbmV3IFByb21pc2VcblxuICAgIGZpcnN0Lm9uY2UoJ2RvbmUnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBwcm9taXNlLnJlc29sdmUoc2VsZi5ldmFsdWF0ZShjb250ZXh0LCBkYXRhLCBudWxsLCB0cnVlLCBmYWxzZSkpXG4gICAgfSlcblxuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxuICBzZWNvbmQgPSBzZW50U2Vjb25kID8gc2Vjb25kIDogc2VsZi5zZWNvbmQuZXZhbHVhdGUoY29udGV4dClcblxuICBpZihzZWNvbmQgJiYgc2Vjb25kLmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG5cbiAgICBzZWNvbmQub25jZSgnZG9uZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHByb21pc2UucmVzb2x2ZShzZWxmLmV2YWx1YXRlKGNvbnRleHQsIGZpcnN0LCBkYXRhLCB0cnVlLCB0cnVlKSlcbiAgICB9KVxuXG4gICAgcmV0dXJuIHByb21pc2VcbiAgfVxuXG4gIHJldHVybiBzZWxmLmNtcChmaXJzdCwgc2Vjb25kKVxufVxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IExpdGVyYWxUb2tlblxuXG5mdW5jdGlvbiBMaXRlcmFsVG9rZW4odmFsdWUsIG9yaWdpbmFsKSB7XG4gIHRoaXMubGJwID0gMFxuICB0aGlzLnZhbHVlID0gdmFsdWVcbn1cblxudmFyIGNvbnMgPSBMaXRlcmFsVG9rZW5cbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLm51ZCA9IGZ1bmN0aW9uKHBhcnNlcikge1xuICByZXR1cm4gdGhpc1xufVxuXG5wcm90by5sZWQgPSBmdW5jdGlvbigpIHtcbiAgdGhyb3cgbmV3IEVycm9yKClcbn1cblxucHJvdG8uZXZhbHVhdGUgPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gIGlmKCF0aGlzLnZhbHVlKVxuICAgIHJldHVybiB0aGlzLnZhbHVlXG5cbiAgaWYoIXRoaXMudmFsdWUucmVzb2x2ZSlcbiAgICByZXR1cm4gdGhpcy52YWx1ZVxuXG4gIHJldHVybiB0aGlzLnZhbHVlLnJlc29sdmUoY29udGV4dClcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gSWZOb2RlXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi4vLi4vcHJvbWlzZScpXG4gICwgTm9kZUxpc3QgPSByZXF1aXJlKCcuLi8uLi9ub2RlX2xpc3QnKVxuICAsIFBhcnNlciA9IHJlcXVpcmUoJy4vcGFyc2VyJylcblxuZnVuY3Rpb24gSWZOb2RlKHByZWRpY2F0ZSwgd2hlbl90cnVlLCB3aGVuX2ZhbHNlKSB7XG4gIHRoaXMucHJlZGljYXRlID0gcHJlZGljYXRlXG4gIHRoaXMud2hlbl90cnVlID0gd2hlbl90cnVlXG4gIHRoaXMud2hlbl9mYWxzZSA9IHdoZW5fZmFsc2Vcbn1cblxudmFyIGNvbnMgPSBJZk5vZGVcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLnJlbmRlciA9IGZ1bmN0aW9uKGNvbnRleHQsIHJlc3VsdCwgdGltZXMpIHtcbiAgdmFyIHNlbGYgPSB0aGlzXG4gICAgLCBwcm9taXNlXG5cbiAgcmVzdWx0ID0gdGltZXMgPT09IDEgPyByZXN1bHQgOiB0aGlzLnByZWRpY2F0ZS5ldmFsdWF0ZShjb250ZXh0KVxuXG4gIGlmKHJlc3VsdCAmJiByZXN1bHQuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcbiAgICBwcm9taXNlID0gbmV3IFByb21pc2VcblxuICAgIHJlc3VsdC5vbmNlKCdkb25lJywgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHByb21pc2UucmVzb2x2ZShzZWxmLnJlbmRlcihjb250ZXh0LCB2YWx1ZSwgMSkpXG4gICAgfSlcblxuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxuICBpZihyZXN1bHQpIHtcbiAgICByZXR1cm4gdGhpcy53aGVuX3RydWUucmVuZGVyKGNvbnRleHQpXG4gIH1cbiAgcmV0dXJuIHRoaXMud2hlbl9mYWxzZS5yZW5kZXIoY29udGV4dClcbn1cblxuY29ucy5wYXJzZSA9IGZ1bmN0aW9uKGNvbnRlbnRzLCBwYXJzZXIpIHtcbiAgdmFyIGJpdHMgPSBjb250ZW50cy5zcGxpdCgnICcpLnNsaWNlKDEpXG4gICAgLCBpZnAgPSBuZXcgUGFyc2VyKGJpdHMsIHBhcnNlcilcbiAgICAsIHByZWRpY2F0ZVxuICAgICwgd2hlbl90cnVlXG4gICAgLCB3aGVuX2ZhbHNlXG4gICAgLCBuZXh0XG5cbiAgcHJlZGljYXRlID0gaWZwLnBhcnNlKClcblxuICB3aGVuX3RydWUgPSBwYXJzZXIucGFyc2UoWydlbHNlJywgJ2VsaWYnLCAnZW5kaWYnXSlcblxuICBuZXh0ID0gcGFyc2VyLnRva2Vucy5zaGlmdCgpXG5cbiAgaWYobmV4dC5pcyhbJ2VuZGlmJ10pKSB7XG4gICAgd2hlbl9mYWxzZSA9IG5ldyBOb2RlTGlzdChbXSlcbiAgfSBlbHNlIGlmKG5leHQuaXMoWydlbGlmJ10pKSB7XG4gICAgd2hlbl9mYWxzZSA9IGNvbnMucGFyc2UobmV4dC5jb250ZW50LCBwYXJzZXIpXG4gIH0gZWxzZSB7XG4gICAgd2hlbl9mYWxzZSA9IHBhcnNlci5wYXJzZShbJ2VuZGlmJ10pXG4gICAgcGFyc2VyLnRva2Vucy5zaGlmdCgpXG4gIH1cblxuICByZXR1cm4gbmV3IGNvbnMocHJlZGljYXRlLCB3aGVuX3RydWUsIHdoZW5fZmFsc2UpXG59XG4iLCJ2YXIgSW5maXhPcGVyYXRvciA9IHJlcXVpcmUoJy4vaW5maXgnKVxuICAsIFByZWZpeE9wZXJhdG9yID0gcmVxdWlyZSgnLi9wcmVmaXgnKVxuXG52YXIga2V5c1xuXG5rZXlzID0gT2JqZWN0LmtleXMgfHwga2V5c2hpbVxuXG5mdW5jdGlvbiBrZXlzaGltKG9iaikge1xuICB2YXIgYWNjdW0gPSBbXVxuXG4gIGZvcih2YXIgbiBpbiBvYmopIGlmKG9iai5oYXNPd25Qcm9wZXJ0eShuKSkge1xuICAgIGFjY3VtLnB1c2gobilcbiAgfVxuXG4gIHJldHVybiBhY2N1bVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAnb3InOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgSW5maXhPcGVyYXRvcig2LCBmdW5jdGlvbih4LCB5KSB7XG4gICAgICAgICAgcmV0dXJuIHggfHwgeVxuICAgICAgfSlcbiAgICB9XG5cbiAgLCAnYW5kJzogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IEluZml4T3BlcmF0b3IoNywgZnVuY3Rpb24oeCwgeSkge1xuICAgICAgICAgIHJldHVybiB4ICYmIHlcbiAgICAgIH0pXG4gICAgfVxuXG4gICwgJ25vdCc6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBQcmVmaXhPcGVyYXRvcig4LCBmdW5jdGlvbih4KSB7XG4gICAgICAgIHJldHVybiAheFxuICAgICAgfSlcbiAgICB9XG5cbiAgLCAnaW4nOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgSW5maXhPcGVyYXRvcig5LCBpbl9vcGVyYXRvcilcbiAgICB9XG5cbiAgLCAnbm90IGluJzogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBJbmZpeE9wZXJhdG9yKDksIGZ1bmN0aW9uKHgsIHkpIHtcbiAgICAgIHJldHVybiAhaW5fb3BlcmF0b3IoeCx5KVxuICAgIH0pXG4gIH1cblxuICAsICc9JzogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBJbmZpeE9wZXJhdG9yKDEwLCBmdW5jdGlvbih4LCB5KSB7XG4gICAgICByZXR1cm4geCA9PSB5XG4gICAgfSlcbiAgfVxuXG4gICwgJz09JzogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IEluZml4T3BlcmF0b3IoMTAsIGZ1bmN0aW9uKHgsIHkpIHtcbiAgICAgICAgcmV0dXJuIHggPT0geVxuICAgICAgfSlcbiAgICB9XG5cbiAgLCAnIT0nOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgSW5maXhPcGVyYXRvcigxMCwgZnVuY3Rpb24oeCwgeSkge1xuICAgICAgICByZXR1cm4geCAhPT0geVxuICAgICAgfSlcbiAgICB9XG5cbiAgLCAnPic6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBJbmZpeE9wZXJhdG9yKDEwLCBmdW5jdGlvbih4LCB5KSB7XG4gICAgICAgIHJldHVybiB4ID4geVxuICAgICAgfSlcbiAgICB9XG5cbiAgLCAnPj0nOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgSW5maXhPcGVyYXRvcigxMCwgZnVuY3Rpb24oeCwgeSkge1xuICAgICAgICByZXR1cm4geCA+PSB5XG4gICAgICB9KVxuICAgIH1cblxuICAsICc8JzogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IEluZml4T3BlcmF0b3IoMTAsIGZ1bmN0aW9uKHgsIHkpIHtcbiAgICAgICAgcmV0dXJuIHggPCB5XG4gICAgICB9KVxuICAgIH1cblxuICAsICc8PSc6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBJbmZpeE9wZXJhdG9yKDEwLCBmdW5jdGlvbih4LCB5KSB7XG4gICAgICAgIHJldHVybiB4IDw9IHlcbiAgICAgIH0pXG4gICAgfVxufVxuXG5mdW5jdGlvbiBpbl9vcGVyYXRvcih4LCB5KSB7XG4gIGlmKCEoeCBpbnN0YW5jZW9mIE9iamVjdCkgJiYgeSBpbnN0YW5jZW9mIE9iamVjdCkge1xuICAgIGlmKCEoeSAmJiAnbGVuZ3RoJyBpbiB5KSkge1xuICAgICAgeSA9IGtleXMoeSlcbiAgICB9XG4gIH1cblxuICBpZih0eXBlb2YoeCkgPT0gJ3N0cmluZycgJiYgdHlwZW9mKHkpID09J3N0cmluZycpIHtcbiAgICByZXR1cm4geS5pbmRleE9mKHgpICE9PSAtMVxuICB9XG5cbiAgaWYoeCA9PT0gdW5kZWZpbmVkIHx8IHggPT09IG51bGwpXG4gICAgcmV0dXJuIGZhbHNlXG5cbiAgaWYoeSA9PT0gdW5kZWZpbmVkIHx8IHkgPT09IG51bGwpXG4gICAgcmV0dXJuIGZhbHNlXG5cbiAgZm9yKHZhciBmb3VuZCA9IGZhbHNlLCBpID0gMCwgbGVuID0geS5sZW5ndGg7IGkgPCBsZW4gJiYgIWZvdW5kOyArK2kpIHtcbiAgICB2YXIgcmhzID0geVtpXVxuICAgIGlmKHggaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgZm9yKHZhciBpZHggPSAwLFxuICAgICAgICBlcXVhbCA9IHgubGVuZ3RoID09IHJocy5sZW5ndGgsXG4gICAgICAgIHhsZW4gPSB4Lmxlbmd0aDtcbiAgICAgICAgaWR4IDwgeGxlbiAmJiBlcXVhbDsgKytpZHgpIHtcblxuICAgICAgICBlcXVhbCA9ICh4W2lkeF0gPT09IHJoc1tpZHhdKVxuICAgICAgfVxuICAgICAgZm91bmQgPSBlcXVhbFxuXG4gICAgfSBlbHNlIGlmKHggaW5zdGFuY2VvZiBPYmplY3QpIHtcbiAgICAgIGlmKHggPT09IHJocykge1xuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgfVxuICAgICAgdmFyIHhrZXlzID0ga2V5cyh4KSxcbiAgICAgICAgcmtleXMgPSBrZXlzKHJocylcblxuICAgICAgaWYoeGtleXMubGVuZ3RoID09PSBya2V5cy5sZW5ndGgpIHtcbiAgICAgICAgZm9yKHZhciBpID0gMCwgbGVuID0geGtleXMubGVuZ3RoLCBlcXVhbCA9IHRydWU7XG4gICAgICAgICAgaSA8IGxlbiAmJiBlcXVhbDtcbiAgICAgICAgICArK2kpIHtcbiAgICAgICAgICBlcXVhbCA9IHhrZXlzW2ldID09PSBya2V5c1tpXSAmJlxuICAgICAgICAgICAgICB4W3hrZXlzW2ldXSA9PT0gcmhzW3JrZXlzW2ldXVxuICAgICAgICB9XG4gICAgICAgIGZvdW5kID0gZXF1YWxcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZm91bmQgPSB4ID09IHJoc1xuICAgIH1cbiAgfVxuICByZXR1cm4gZm91bmRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gSWZQYXJzZXJcblxudmFyIExpdGVyYWxUb2tlbiA9IHJlcXVpcmUoJy4vbGl0ZXJhbCcpXG4gICwgRW5kVG9rZW4gPSByZXF1aXJlKCcuL2VuZCcpXG4gICwgb3BlcmF0b3JzID0gcmVxdWlyZSgnLi9vcGVyYXRvcnMnKVxuXG5mdW5jdGlvbiBJZlBhcnNlcih0b2tlbnMsIHBhcnNlcikge1xuICB0aGlzLmNyZWF0ZVZhcmlhYmxlID0gZnVuY3Rpb24odG9rZW4pIHtcbiAgICByZXR1cm4gbmV3IExpdGVyYWxUb2tlbihwYXJzZXIuY29tcGlsZSh0b2tlbiksIHRva2VuKVxuICB9XG5cbiAgdmFyIGxlbiA9IHRva2Vucy5sZW5ndGhcbiAgICAsIGkgPSAwXG4gICAgLCBtYXBwZWRUb2tlbnMgPSBbXVxuICAgICwgdG9rZW5cblxuICB3aGlsZShpIDwgbGVuKSB7XG4gICAgdG9rZW4gPSB0b2tlbnNbaV1cbiAgICBpZih0b2tlbiA9PSAnbm90JyAmJiB0b2tlbnNbaSsxXSA9PSAnaW4nKSB7XG4gICAgICArK2lcbiAgICAgIHRva2VuID0gJ25vdCBpbidcbiAgICB9XG4gICAgbWFwcGVkVG9rZW5zLnB1c2godGhpcy50cmFuc2xhdGVUb2tlbih0b2tlbikpXG4gICAgKytpXG4gIH1cblxuICB0aGlzLnBvcyA9IDBcbiAgdGhpcy50b2tlbnMgPSBtYXBwZWRUb2tlbnNcbiAgdGhpcy5jdXJyZW50VG9rZW4gPSB0aGlzLm5leHQoKVxufVxuXG52YXIgY29ucyA9IElmUGFyc2VyXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by50cmFuc2xhdGVUb2tlbiA9IGZ1bmN0aW9uKHRva2VuKSB7XG4gIHZhciBvcCA9IG9wZXJhdG9yc1t0b2tlbl1cblxuICBpZihvcCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHRoaXMuY3JlYXRlVmFyaWFibGUodG9rZW4pXG4gIH1cblxuICByZXR1cm4gb3AoKVxufVxuXG5wcm90by5uZXh0ID0gZnVuY3Rpb24oKSB7XG4gIGlmKHRoaXMucG9zID49IHRoaXMudG9rZW5zLmxlbmd0aCkge1xuICAgIHJldHVybiBuZXcgRW5kVG9rZW4oKVxuICB9XG4gIHJldHVybiB0aGlzLnRva2Vuc1t0aGlzLnBvcysrXVxufVxuXG5wcm90by5wYXJzZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcmV0dmFsID0gdGhpcy5leHByZXNzaW9uKClcblxuICBpZighKHRoaXMuY3VycmVudFRva2VuLmNvbnN0cnVjdG9yID09PSBFbmRUb2tlbikpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJVbnVzZWQgXCIrdGhpcy5jdXJyZW50VG9rZW4rXCIgYXQgZW5kIG9mIGlmIGV4cHJlc3Npb24uXCIpXG4gIH1cblxuICByZXR1cm4gcmV0dmFsXG59XG5cbnByb3RvLmV4cHJlc3Npb24gPSBmdW5jdGlvbihyYnApIHtcbiAgcmJwID0gcmJwIHx8IDBcblxuICB2YXIgdCA9IHRoaXMuY3VycmVudFRva2VuXG4gICAgLCBsZWZ0XG5cbiAgdGhpcy5jdXJyZW50VG9rZW4gPSB0aGlzLm5leHQoKVxuXG4gIGxlZnQgPSB0Lm51ZCh0aGlzKVxuICB3aGlsZShyYnAgPCB0aGlzLmN1cnJlbnRUb2tlbi5sYnApIHtcbiAgICB0ID0gdGhpcy5jdXJyZW50VG9rZW5cblxuICAgIHRoaXMuY3VycmVudFRva2VuID0gdGhpcy5uZXh0KClcblxuICAgIGxlZnQgPSB0LmxlZChsZWZ0LCB0aGlzKVxuICB9XG5cbiAgcmV0dXJuIGxlZnRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gUHJlZml4T3BlcmF0b3JcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCcuLi8uLi9wcm9taXNlJylcblxuZnVuY3Rpb24gUHJlZml4T3BlcmF0b3IoYnAsIGNtcCkge1xuICB0aGlzLmxicCA9IGJwXG4gIHRoaXMuY21wID0gY21wXG5cbiAgdGhpcy5maXJzdCA9XG4gIHRoaXMuc2Vjb25kID0gbnVsbFxufVxuXG52YXIgY29ucyA9IFByZWZpeE9wZXJhdG9yXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by5udWQgPSBmdW5jdGlvbihwYXJzZXIpIHtcbiAgdGhpcy5maXJzdCA9IHBhcnNlci5leHByZXNzaW9uKHRoaXMubGJwKVxuICB0aGlzLnNlY29uZCA9IG51bGxcbiAgcmV0dXJuIHRoaXNcbn1cblxucHJvdG8ubGVkID0gZnVuY3Rpb24oZmlyc3QsIHBhcnNlcikge1xuICB0aHJvdyBuZXcgRXJyb3IoXCJVbmV4cGVjdGVkIHRva2VuXCIpXG59XG5cbnByb3RvLmV2YWx1YXRlID0gZnVuY3Rpb24oY29udGV4dCwgZmlyc3QsIHRpbWVzKSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICAgICwgcHJvbWlzZVxuXG4gIGZpcnN0ID0gdGltZXMgPT09IDEgPyBmaXJzdCA6IHNlbGYuZmlyc3QuZXZhbHVhdGUoY29udGV4dClcblxuICBpZihmaXJzdCAmJiBmaXJzdC5jb25zdHJ1Y3RvciA9PT0gUHJvbWlzZSkge1xuICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuXG4gICAgZmlyc3Qub25jZSgnZG9uZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHByb21pc2UucmVzb2x2ZShzZWxmLmV2YWx1YXRlKGNvbnRleHQsIGRhdGEsIDEpKVxuICAgIH0pXG5cbiAgICByZXR1cm4gcHJvbWlzZVxuICB9XG5cbiAgcmV0dXJuIHNlbGYuY21wKGZpcnN0KVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBJbmNsdWRlTm9kZVxuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJy4uL3Byb21pc2UnKVxuXG5mdW5jdGlvbiBJbmNsdWRlTm9kZSh0YXJnZXRfdmFyLCBsb2FkZXIpIHtcbiAgdGhpcy50YXJnZXRfdmFyID0gdGFyZ2V0X3ZhclxuICB0aGlzLmxvYWRlciA9IGxvYWRlclxufVxuXG52YXIgY29ucyA9IEluY2x1ZGVOb2RlXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5jb25zLnBhcnNlID0gZnVuY3Rpb24oY29udGVudHMsIHBhcnNlcikge1xuICB2YXIgYml0cyA9IGNvbnRlbnRzLnNwbGl0KCcgJylcbiAgICAsIHZhcm5hbWUgPSBwYXJzZXIuY29tcGlsZShiaXRzLnNsaWNlKDEpLmpvaW4oJyAnKSlcbiAgICAsIGxvYWRlciA9IHBhcnNlci5wbHVnaW5zLmxvb2t1cCgnbG9hZGVyJylcblxuICByZXR1cm4gbmV3IGNvbnModmFybmFtZSwgbG9hZGVyKVxufVxuXG5wcm90by5yZW5kZXIgPSBmdW5jdGlvbihjb250ZXh0LCB0YXJnZXQpIHtcbiAgdmFyIHNlbGYgPSB0aGlzXG4gICAgLCBwcm9taXNlXG5cbiAgdGFyZ2V0ID0gdGFyZ2V0IHx8IHRoaXMudGFyZ2V0X3Zhci5yZXNvbHZlKGNvbnRleHQpXG5cbiAgaWYodGFyZ2V0ICYmIHRhcmdldC5jb25zdHJ1Y3RvciA9PT0gUHJvbWlzZSkge1xuICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuXG4gICAgdGFyZ2V0Lm9uY2UoJ2RvbmUnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBwcm9taXNlLnJlc29sdmUoc2VsZi5yZW5kZXIoY29udGV4dCwgZGF0YSkpXG4gICAgfSlcblxuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxuICB0YXJnZXQgPSBzZWxmLmdldF90ZW1wbGF0ZSh0YXJnZXQpXG5cbiAgaWYodGFyZ2V0ICYmIHRhcmdldC5jb25zdHJ1Y3RvciA9PT0gUHJvbWlzZSkge1xuICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuXG4gICAgdGFyZ2V0Lm9uY2UoJ2RvbmUnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBwcm9taXNlLnJlc29sdmUoc2VsZi5yZW5kZXIoY29udGV4dCwgZGF0YSkpXG4gICAgfSlcblxuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxuICBwcm9taXNlID0gbmV3IFByb21pc2VcblxuICB0YXJnZXQucmVuZGVyKGNvbnRleHQuY29weSgpLCBmdW5jdGlvbihlcnIsIGRhdGEpIHtcbiAgICBwcm9taXNlLnJlc29sdmUoZGF0YSlcbiAgfSlcblxuICByZXR1cm4gcHJvbWlzZVxufVxuXG5wcm90by5nZXRfdGVtcGxhdGUgPSBmdW5jdGlvbih0YXJnZXQpIHtcbiAgaWYodHlwZW9mIHRhcmdldCA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gdGhpcy5sb2FkZXIodGFyZ2V0KVxuICB9XG5cbiAgLy8gb2theSwgaXQncyBwcm9iYWJseSBhIHRlbXBsYXRlIG9iamVjdFxuICByZXR1cm4gdGFyZ2V0XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IE5vd05vZGVcblxudmFyIGZvcm1hdCA9IHJlcXVpcmUoJy4uL2RhdGUnKS5kYXRlXG5cbmZ1bmN0aW9uIE5vd05vZGUoZm9ybWF0U3RyaW5nKSB7XG4gIHRoaXMuZm9ybWF0ID0gZm9ybWF0U3RyaW5nXG59XG5cbnZhciBjb25zID0gTm93Tm9kZVxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8ucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCkge1xuICByZXR1cm4gZm9ybWF0KG5ldyBEYXRlLCB0aGlzLmZvcm1hdClcbn1cblxuY29ucy5wYXJzZSA9IGZ1bmN0aW9uKGNvbnRlbnRzLCBwYXJzZXIpIHtcbiAgdmFyIGJpdHMgPSBjb250ZW50cy5zcGxpdCgnICcpXG4gICAgLCBmbXQgPSBiaXRzLnNsaWNlKDEpLmpvaW4oJyAnKVxuXG4gIGZtdCA9IGZtdFxuICAgIC5yZXBsYWNlKC9eXFxzKy8sICcnKVxuICAgIC5yZXBsYWNlKC9cXHMrJC8sICcnKVxuXG4gIGlmKC9bJ1wiXS8udGVzdChmbXQuY2hhckF0KDApKSkge1xuICAgIGZtdCA9IGZtdC5zbGljZSgxLCAtMSlcbiAgfVxuXG4gIHJldHVybiBuZXcgTm93Tm9kZShmbXQgfHwgJ04gaiwgWScpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFdpdGhOb2RlXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi4vcHJvbWlzZScpXG5cbmZ1bmN0aW9uIFdpdGhOb2RlKG5vZGVzLCBleHRyYV9jb250ZXh0KSB7XG4gIHRoaXMubm9kZXMgPSBub2Rlc1xuICB0aGlzLmV4dHJhX2NvbnRleHQgPSBleHRyYV9jb250ZXh0IHx8IHt9XG59XG5cbnZhciBjb25zID0gV2l0aE5vZGVcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG4gICwga3dhcmdfcmUgPSAvKD86KFxcdyspPSk/KC4rKS9cblxuZnVuY3Rpb24gdG9rZW5fa3dhcmdzKGJpdHMsIHBhcnNlcikge1xuICB2YXIgbWF0Y2hcbiAgICAsIGt3YXJnX2Zvcm1hdFxuICAgICwga3dhcmdzXG4gICAgLCBrZXlcbiAgICAsIHZhbHVlXG5cbiAgaWYoIWJpdHMubGVuZ3RoKVxuICAgIHJldHVybiB7fVxuICBtYXRjaCA9IGt3YXJnX3JlLmV4ZWMoYml0c1swXSlcbiAga3dhcmdfZm9ybWF0ID0gbWF0Y2ggJiYgbWF0Y2hbMV1cbiAgaWYoIWt3YXJnX2Zvcm1hdClcbiAgICBpZihiaXRzLmxlbmd0aCA8IDMgfHwgYml0c1sxXSAhPSAnYXMnKVxuICAgICAgcmV0dXJuIHt9XG5cbiAga3dhcmdzID0ge31cbiAgd2hpbGUoYml0cy5sZW5ndGgpIHtcbiAgICBpZihrd2FyZ19mb3JtYXQpIHtcbiAgICAgIG1hdGNoID0ga3dhcmdfcmUuZXhlYyhiaXRzWzBdKVxuICAgICAgaWYoIW1hdGNoIHx8ICFtYXRjaFsxXSl7XG4gICAgICAgIHJldHVybiBrd2FyZ3NcbiAgICAgIH1cbiAgICAgIGtleSA9IG1hdGNoWzFdXG4gICAgICB2YWx1ZSA9IG1hdGNoWzJdXG4gICAgICBiaXRzLnNoaWZ0KClcbiAgICB9IGVsc2Uge1xuICAgICAgaWYoYml0cy5sZW5ndGggPCAzIHx8IGJpdHNbMV0gIT0gJ2FzJykge1xuICAgICAgICByZXR1cm4ga3dhcmdzXG4gICAgICB9XG4gICAgICBrZXkgPSBiaXRzWzJdXG4gICAgICB2YWx1ZSA9IGJpdHNbMF1cbiAgICAgIGJpdHMuc3BsaWNlKDAsIDMpXG4gICAgfVxuICAgIGt3YXJnc1trZXldID0gcGFyc2VyLmNvbXBpbGUodmFsdWUpXG4gICAgaWYoYml0cy5sZW5ndGggJiYgIWt3YXJnX2Zvcm1hdCkge1xuICAgICAgaWYoYml0c1swXSAhPSAnYW5kJykge1xuICAgICAgICByZXR1cm4ga3dhcmdzXG4gICAgICB9XG4gICAgICBiaXRzLnNoaWZ0KClcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGt3YXJnc1xufVxuXG5jb25zLnBhcnNlID0gZnVuY3Rpb24oY29udGVudHMsIHBhcnNlcikge1xuICB2YXIgYml0cyA9IGNvbnRlbnRzLnNwbGl0KC9cXHMrL2cpXG4gICAgLCBub2RlbGlzdCA9IHBhcnNlci5wYXJzZShbJ2VuZHdpdGgnXSlcbiAgICAsIGhhc19jb250ZXh0X3ZhcnMgPSBmYWxzZVxuICAgICwgcmVtYWluaW5nX2JpdHNcbiAgICAsIGV4dHJhX2NvbnRleHRcblxuXG4gIHJlbWFpbmluZ19iaXRzID0gYml0cy5zbGljZSgxKVxuICBleHRyYV9jb250ZXh0ID0gdG9rZW5fa3dhcmdzKHJlbWFpbmluZ19iaXRzLCBwYXJzZXIpXG5cbiAgZm9yKHZhciBjb250ZXh0X3ZhciBpbiBleHRyYV9jb250ZXh0KVxuICAgIGlmKGV4dHJhX2NvbnRleHQuaGFzT3duUHJvcGVydHkoY29udGV4dF92YXIpKSB7XG4gICAgICBoYXNfY29udGV4dF92YXJzID0gdHJ1ZVxuICAgICAgYnJlYWtcbiAgICB9XG5cbiAgaWYgKCFoYXNfY29udGV4dF92YXJzKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdcIicrYml0c1swXSsnXCIgZXhwZWN0ZWQgYXQgbGVhc3Qgb25lIHZhcmlhYmxlIGFzc2lnbm1lbnQnKVxuICBpZiAocmVtYWluaW5nX2JpdHMubGVuZ3RoKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdcIicrYml0c1swXSsnXCIgcmVjZWl2ZWQgYW4gaW52YWxpZCB0b2tlbjogXCInK3JlbWFpbmluZ19iaXRzWzBdKydcIicpXG5cbiAgcGFyc2VyLnRva2Vucy5zaGlmdCgpXG4gIHJldHVybiBuZXcgY29ucyhub2RlbGlzdCwgZXh0cmFfY29udGV4dClcbn1cblxucHJvdG8ucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCkge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgICAsIHJlc3VsdFxuICAgICwgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG4gICAgLCBwcm9taXNlcyA9IDBcblxuICBjb250ZXh0ID0gY29udGV4dC5jb3B5KClcblxuICBmdW5jdGlvbiBwcm9taXNlX3Jlc29sdmVkKGtleSkge1xuICAgIHJldHVybiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBjb250ZXh0W2tleV0gPSBkYXRhO1xuICAgICAgaWYgKC0tcHJvbWlzZXMgPT09IDApIHtcbiAgICAgICAgcHJvbWlzZS5yZXNvbHZlKHNlbGYubm9kZXMucmVuZGVyKGNvbnRleHQpKVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGZvcih2YXIga2V5IGluIHNlbGYuZXh0cmFfY29udGV4dCkge1xuICAgIGlmKHNlbGYuZXh0cmFfY29udGV4dC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICB2YWx1ZSA9IHNlbGYuZXh0cmFfY29udGV4dFtrZXldLnJlc29sdmUoY29udGV4dClcblxuICAgICAgaWYodmFsdWUgJiYgdmFsdWUuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcbiAgICAgICAgcHJvbWlzZXMrK1xuICAgICAgICB2YWx1ZS5vbmNlKCdkb25lJywgcHJvbWlzZV9yZXNvbHZlZChrZXkpKVxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGNvbnRleHRba2V5XSA9IHZhbHVlXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKHByb21pc2VzKVxuICAgIHJldHVybiBwcm9taXNlXG4gIGVsc2VcbiAgICByZXN1bHQgPSBzZWxmLm5vZGVzLnJlbmRlcihjb250ZXh0KVxuXG4gIHJldHVybiByZXN1bHRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gVGV4dE5vZGVcblxuZnVuY3Rpb24gVGV4dE5vZGUoY29udGVudCkge1xuICB0aGlzLmNvbnRlbnQgPSBjb250ZW50XG59XG5cbnZhciBjb25zID0gVGV4dE5vZGVcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLnJlbmRlciA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgcmV0dXJuIHRoaXMuY29udGVudFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBUZXh0VG9rZW5cblxudmFyIFRva2VuID0gcmVxdWlyZSgnLi90b2tlbicpXG4gICwgVGV4dE5vZGUgPSByZXF1aXJlKCcuL3RleHRfbm9kZScpXG5cbmZ1bmN0aW9uIFRleHRUb2tlbihjb250ZW50LCBsaW5lKSB7XG4gIFRva2VuLmNhbGwodGhpcywgY29udGVudCwgbGluZSlcbn1cblxudmFyIGNvbnMgPSBUZXh0VG9rZW5cbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlID0gbmV3IFRva2VuXG5cbnByb3RvLmNvbnN0cnVjdG9yID0gY29uc1xuXG5wcm90by5ub2RlID0gZnVuY3Rpb24ocGFyc2VyKSB7XG4gIHJldHVybiBuZXcgVGV4dE5vZGUodGhpcy5jb250ZW50KVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBUb2tlblxuXG5mdW5jdGlvbiBUb2tlbihjb250ZW50LCBsaW5lKSB7XG4gIHRoaXMuY29udGVudCA9IGNvbnRlbnRcbiAgdGhpcy5saW5lID0gbGluZVxuXG4gIHRoaXMubmFtZSA9IGNvbnRlbnQgJiYgY29udGVudC5zcGxpdCgnICcpWzBdXG59XG5cbnZhciBjb25zID0gVG9rZW5cbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gIC8vIE5COiB0aGlzIHNob3VsZCBvbmx5IGJlXG4gIC8vIGRlYnVnIG91dHB1dCwgc28gaXQnc1xuICAvLyBwcm9iYWJseSBzYWZlIHRvIHVzZVxuICAvLyBKU09OLnN0cmluZ2lmeSBoZXJlLlxuICByZXR1cm4gJzwnK3RoaXMuY29uc3RydWN0b3IubmFtZSsnOiAnK0pTT04uc3RyaW5naWZ5KHRoaXMuY29udGVudCkrJz4nXG59XG5cbnByb3RvLmlzID0gZnVuY3Rpb24obmFtZXMpIHtcbiAgZm9yKHZhciBpID0gMCwgbGVuID0gbmFtZXMubGVuZ3RoOyBpIDwgbGVuOyArK2kpXG4gICAgaWYobmFtZXNbaV0gPT09IHRoaXMubmFtZSlcbiAgICAgIHJldHVybiB0cnVlXG4gIHJldHVybiBmYWxzZVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgY2FsbGJhY2spIHtcbiAgdmFyIHN0ciA9IGlucHV0LnRvU3RyaW5nKClcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC8oKChodHRwKHMpPzpcXC9cXC8pfChtYWlsdG86KSkoW1xcd1xcZFxcLVxcLjpAXFwvPyY9JV0pKykvZywgY2FsbGJhY2spXG59IiwiOyhmdW5jdGlvbigpIHtcblxuLy8gc28sIHRoZSBvbmx5IHdheSB3ZSAocmVsaWFibHkpIGdldCBhY2Nlc3MgdG8gRFNUIGluIGphdmFzY3JpcHRcbi8vIGlzIHZpYSBgRGF0ZSNnZXRUaW1lem9uZU9mZnNldGAuXG4vL1xuLy8gdGhpcyB2YWx1ZSB3aWxsIHN3aXRjaCBmb3IgYSBnaXZlbiBkYXRlIGJhc2VkIG9uIHRoZSBwcmVzZW5jZSBvciBhYnNlbmNlXG4vLyBvZiBEU1QgYXQgdGhhdCBkYXRlLlxuXG5mdW5jdGlvbiBmaW5kX2RzdF90aHJlc2hvbGQgKG5lYXIsIGZhcikge1xuICB2YXIgbmVhcl9kYXRlID0gbmV3IERhdGUobmVhcilcbiAgICAsIGZhcl9kYXRlID0gbmV3IERhdGUoZmFyKVxuICAgICwgbmVhcl9vZmZzID0gbmVhcl9kYXRlLmdldFRpbWV6b25lT2Zmc2V0KClcbiAgICAsIGZhcl9vZmZzID0gZmFyX2RhdGUuZ2V0VGltZXpvbmVPZmZzZXQoKVxuXG4gIGlmKG5lYXJfb2ZmcyA9PT0gZmFyX29mZnMpIHJldHVybiAwXG5cbiAgaWYoTWF0aC5hYnMobmVhcl9kYXRlIC0gZmFyX2RhdGUpIDwgMTAwMCkgcmV0dXJuIG5lYXJfZGF0ZVxuXG4gIHJldHVybiBmaW5kX2RzdF90aHJlc2hvbGQobmVhciwgbmVhcisoZmFyLW5lYXIpLzIpIHx8IGZpbmRfZHN0X3RocmVzaG9sZChuZWFyKyhmYXItbmVhcikvMiwgZmFyKVxufVxuXG5cbmZ1bmN0aW9uIGZpbmRfZHN0X3RocmVzaG9sZHMoKSB7XG4gIHZhciBkID0gbmV3IERhdGUoKVxuICAgICwgZCA9IG5ldyBEYXRlKGQuZ2V0RnVsbFllYXIoKSwgMCwgMSlcbiAgICAsIGYgPSBuZXcgRGF0ZShkLmdldEZ1bGxZZWFyKCksIDExLCAzMSlcbiAgICAsIHhcbiAgICAsIGZpcnN0XG4gICAgLCBzZWNvbmRcblxuICB4ID0gKGYgLSBkKSAvIC0yXG4gIGZpcnN0ID0gZmluZF9kc3RfdGhyZXNob2xkKCtkLCBkIC0geClcbiAgc2Vjb25kID0gZmluZF9kc3RfdGhyZXNob2xkKGQgLSB4LCArZilcblxuICByZXR1cm4ge1xuICAgIHNwcmluZ19mb3J3YXJkICA6IGZpcnN0ID8gKGZpcnN0LmdldFRpbWV6b25lT2Zmc2V0KCkgPCBzZWNvbmQuZ2V0VGltZXpvbmVPZmZzZXQoKSA/IHNlY29uZCA6IGZpcnN0KSAtIG5ldyBEYXRlKGQuZ2V0RnVsbFllYXIoKSwgMCwgMSwgMCwgMCkgOiAwXG4gICwgZmFsbF9iYWNrICAgICAgIDogZmlyc3QgPyAoZmlyc3QuZ2V0VGltZXpvbmVPZmZzZXQoKSA8IHNlY29uZC5nZXRUaW1lem9uZU9mZnNldCgpID8gZmlyc3QgOiBzZWNvbmQpIC0gbmV3IERhdGUoZC5nZXRGdWxsWWVhcigpLCAwLCAxLCAwLCAwKSA6IDBcbiAgfVxufVxuXG52YXIgVEhSRVNIT0xEUyA9IGZpbmRfZHN0X3RocmVzaG9sZHMoKVxuXG5mdW5jdGlvbiBpc19kc3QoZGF0ZXRpbWUsIHRocmVzaG9sZHMpIHtcblxuICB0aHJlc2hvbGRzID0gdGhyZXNob2xkcyB8fCBUSFJFU0hPTERTXG5cbiAgaWYodGhyZXNob2xkcy5zcHJpbmdfZm9yd2FyZCA9PT0gdGhyZXNob2xkcy5mYWxsX2JhY2spXG4gICAgcmV0dXJuIGZhbHNlXG5cbiAgdmFyIG9mZnNldCA9IGRhdGV0aW1lIC0gbmV3IERhdGUoZGF0ZXRpbWUuZ2V0RnVsbFllYXIoKSwgMCwgMSwgMCwgMClcbiAgICAsIGRzdF9pc19yZXZlcnNlZCA9IHRocmVzaG9sZHMuc3ByaW5nX2ZvcndhcmQgPiB0aHJlc2hvbGRzLmZhbGxfYmFja1xuICAgICwgbWF4ID0gTWF0aC5tYXgodGhyZXNob2xkcy5mYWxsX2JhY2ssIHRocmVzaG9sZHMuc3ByaW5nX2ZvcndhcmQpXG4gICAgLCBtaW4gPSBNYXRoLm1pbih0aHJlc2hvbGRzLmZhbGxfYmFjaywgdGhyZXNob2xkcy5zcHJpbmdfZm9yd2FyZClcblxuICBpZihtaW4gPCBvZmZzZXQgJiYgb2Zmc2V0IDwgbWF4KVxuICAgIHJldHVybiAhZHN0X2lzX3JldmVyc2VkXG4gIHJldHVybiBkc3RfaXNfcmV2ZXJzZWRcbn1cblxuRGF0ZS5wcm90b3R5cGUuaXNEU1QgPSBmdW5jdGlvbih0aHJlc2hvbGRzKSB7XG4gIHJldHVybiBpc19kc3QodGhpcywgdGhyZXNob2xkcykgXG59XG5cbmlzX2RzdC5maW5kX3RocmVzaG9sZHMgPSBmaW5kX2RzdF90aHJlc2hvbGRzXG5cbmlmKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gaXNfZHN0XG59IGVsc2Uge1xuICB3aW5kb3cuaXNfZHN0ID0gaXNfZHN0IFxufVxuXG59KSgpXG4iLCJ2YXIgdHogPSByZXF1aXJlKCcuL3R6JylcbiAgLCBpc0RTVCA9IHJlcXVpcmUoJ2RzdCcpXG5cbm1vZHVsZS5leHBvcnRzID0gdHppbmZvXG5cbmZ1bmN0aW9uIGdldF9vZmZzZXRfZm10KHR6b2Zmcykge1xuICB2YXIgb2ZmcyA9IH5+KHR6b2ZmcyAvIDYwKVxuICAgICwgbWlucyA9ICgnMDAnICsgfn5NYXRoLmFicyh0em9mZnMgJSA2MCkpLnNsaWNlKC0yKVxuXG4gIG9mZnMgPSAoKHR6b2ZmcyA+IDApID8gJy0nIDogJysnKSArICgnMDAnICsgTWF0aC5hYnMob2ZmcykpLnNsaWNlKC0yKSArIG1pbnNcblxuICByZXR1cm4gb2Zmc1xufVxuXG5mdW5jdGlvbiB0emluZm8oZGF0ZSwgdHpfbGlzdCwgZGV0ZXJtaW5lX2RzdCwgVFopIHtcblxuICB2YXIgZm10ID0gZ2V0X29mZnNldF9mbXQoZGF0ZS5nZXRUaW1lem9uZU9mZnNldCgpKVxuXG4gIFRaID0gVFogfHwgdHpcbiAgdHpfbGlzdCA9IHR6X2xpc3QgfHwgVFpbZm10XVxuICBkZXRlcm1pbmVfZHN0ID0gZGV0ZXJtaW5lX2RzdCB8fCBpc0RTVFxuXG4gIHZhciBkYXRlX2lzX2RzdCA9IGRldGVybWluZV9kc3QoZGF0ZSlcbiAgICAsIGRhdGVfZHN0X3RocmVzaG9sZHMgPSBkZXRlcm1pbmVfZHN0LmZpbmRfdGhyZXNob2xkcygpXG4gICAgLCBoYXNfZHN0ID0gZGF0ZV9kc3RfdGhyZXNob2xkcy5zcHJpbmdfZm9yd2FyZCAhPT0gZGF0ZV9kc3RfdGhyZXNob2xkcy5mYWxsX2JhY2tcbiAgICAsIGlzX25vcnRoID0gaGFzX2RzdCAmJiBkYXRlX2RzdF90aHJlc2hvbGRzLnNwcmluZ19mb3J3YXJkIDwgZGF0ZV9kc3RfdGhyZXNob2xkcy5mYWxsX2JhY2sgXG4gICAgLCBsaXN0ID0gKHR6X2xpc3QgfHwgW10pLnNsaWNlKClcbiAgICAsIGZpbHRlcmVkID0gW11cblxuICB2YXIgZGF0ZXN0cm9mZnNldCA9IC9cXCgoLio/KVxcKS8uZXhlYygnJyArIG5ldyBEYXRlKCkpXG5cbiAgaWYoZGF0ZXN0cm9mZnNldCkge1xuICAgIGRhdGVzdHJvZmZzZXQgPSBkYXRlc3Ryb2Zmc2V0WzFdXG5cbiAgICBmb3IodmFyIGkgPSAwLCBsZW4gPSBsaXN0Lmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICBpZihsaXN0W2ldLmFiYnIgPT09IGRhdGVzdHJvZmZzZXQpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICduYW1lJzogbGlzdFtpXS5uYW1lXG4gICAgICAgICAgLCAnbG9jJzogbGlzdFtpXS5sb2NcbiAgICAgICAgICAsICdhYmJyJzogbGlzdFtpXS5hYmJyXG4gICAgICAgICAgLCAnb2Zmc2V0JzogZm10XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuXG4gIGlmKCFpc19ub3J0aClcbiAgICBsaXN0ID0gbGlzdC5yZXZlcnNlKClcblxuICBmb3IodmFyIGkgPSAwLCBsZW4gPSBsaXN0Lmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYoZGF0ZV9pc19kc3QgPT09IC8oW0RkXWF5bGlnaHR8W1NzXXVtbWVyKS8udGVzdChsaXN0W2ldLm5hbWUpKSB7XG4gICAgICBmaWx0ZXJlZC5wdXNoKGxpc3RbaV0pXG4gICAgfVxuICB9XG4gIGxpc3QgPSBmaWx0ZXJlZFxuICBpZighbGlzdC5sZW5ndGgpIHJldHVybiB7fVxuXG4gIHJldHVybiB7XG4gICAgICAnbmFtZSc6ICAgICBsaXN0WzBdLm5hbWVcbiAgICAsICdsb2MnOiAgICAgIGxpc3RbMF0ubG9jXG4gICAgLCAnYWJicic6ICAgICBsaXN0WzBdLmFiYnJcbiAgICAsICdvZmZzZXQnOiAgIGZtdFxuICB9XG59IFxuXG50emluZm8uZ2V0X29mZnNldF9mb3JtYXQgPSBnZXRfb2Zmc2V0X2ZtdFxudHppbmZvLnR6X2xpc3QgPSB0elxuXG5EYXRlLnByb3RvdHlwZS50emluZm8gPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHR6aW5mbyh0aGlzKVxufVxuXG5EYXRlLnByb3RvdHlwZS50em9mZnNldCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gJ0dNVCcrZ2V0X29mZnNldF9mbXQodGhpcy5nZXRUaW1lem9uZU9mZnNldCgpKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIFwiKzA5MDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkpTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkphcGFuIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIktTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIktvcmVhIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXVzdHJhbGlhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiV0RUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiV2VzdGVybiBEYXlsaWdodCBUaW1lXCJcbiAgICB9IFxuICBdLCBcbiAgXCIrMTM0NVwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ0hBRFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDaGF0aGFtIElzbGFuZCBEYXlsaWdodCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIiswNTAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJQS1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJQYWtpc3RhbiBTdGFuZGFyZCBUaW1lXCJcbiAgICB9IFxuICBdLCBcbiAgXCIrMDQzMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQUZUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQWZnaGFuaXN0YW4gVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSVJEVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIklyYW4gRGF5bGlnaHQgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCIrMTIwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQU5BU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJBbmFkeXIgU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkFOQVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJBbmFkeXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRkpUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRmlqaSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJHSUxUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiR2lsYmVydCBJc2xhbmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTUFHU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJNYWdhZGFuIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJNSFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJNYXJzaGFsbCBJc2xhbmRzIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIk5aU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJOZXcgWmVhbGFuZCBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJQRVRTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkthbWNoYXRrYSBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiUEVUVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkthbWNoYXRrYSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJUVlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJUdXZhbHUgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiV0ZUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiV2FsbGlzIGFuZCBGdXR1bmEgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCItMTEwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiU1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiU2Ftb2EgU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiV1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiV2VzdCBTYW1vYSBUaW1lXCJcbiAgICB9IFxuICBdLCBcbiAgXCIrMTQwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTElOVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkxpbmUgSXNsYW5kcyBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIi0wMjMwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJIQVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJIZXVyZSBBdmFuY1xcdTAwZTllIGRlIFRlcnJlLU5ldXZlXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJORFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJOZXdmb3VuZGxhbmQgRGF5bGlnaHQgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCItMDEwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBZnJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJDVlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDYXBlIFZlcmRlIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVHVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkVhc3QgR3JlZW5sYW5kIFRpbWVcIlxuICAgIH0gXG4gIF0sIFxuICBcIi0xMjAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk1pbGl0YXJ5XCIsIFxuICAgICAgXCJhYmJyXCI6IFwiWVwiLCBcbiAgICAgIFwibmFtZVwiOiBcIllhbmtlZSBUaW1lIFpvbmVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzA4MDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNoaW5hIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIktSQVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiS3Jhc25veWFyc2sgU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXVzdHJhbGlhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiV1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiV2VzdGVybiBTdGFuZGFyZCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIiswNjMwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJNTVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJNeWFubWFyIFRpbWVcIlxuICAgIH0sXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJJbmRpYW4gT2NlYW5cIiwgXG4gICAgICBcImFiYnJcIjogXCJDQ1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDb2NvcyBJc2xhbmRzIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiLTA0MzBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiU291dGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkhMVlwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkhvcmEgTGVnYWwgZGUgVmVuZXp1ZWxhXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJWRVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJWZW5lenVlbGFuIFN0YW5kYXJkIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiLTA3MDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIk1TVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk1vdW50YWluIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlBEVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlBhY2lmaWMgRGF5bGlnaHQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSEFQXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSGV1cmUgQXZhbmNcXHUwMGU5ZSBkdSBQYWNpZmlxdWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkhOUlwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkhldXJlIE5vcm1hbGUgZGVzIFJvY2hldXNlc1wiXG4gICAgfSBcbiAgXSwgXG4gIFwiLTAyMDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiU291dGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkZOVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkZlcm5hbmRvIGRlIE5vcm9uaGEgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiV0dTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIldlc3Rlcm4gR3JlZW5sYW5kIFN1bW1lciBUaW1lXCJcbiAgICB9LFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlBNRFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJQaWVycmUgJiBNaXF1ZWxvbiBEYXlsaWdodCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJVWVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiVXJ1Z3VheSBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJTb3V0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQlJTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkJyYXNpbGlhIFN1bW1lciBUaW1lXCJcbiAgICB9IFxuICBdLCBcbiAgXCIrMTAzMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBdXN0cmFsaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJDRFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDZW50cmFsIERheWxpZ2h0IFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXVzdHJhbGlhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTEhTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkxvcmQgSG93ZSBTdGFuZGFyZCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIiswMzAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkV1cm9wZVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIk1TS1wiLCBcbiAgICAgIFwibmFtZVwiOiBcIk1vc2NvdyBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIklEVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIklzcmFlbCBEYXlsaWdodCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJBU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJBcmFiaWEgU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJJbmRpYW4gT2NlYW5cIiwgXG4gICAgICBcImFiYnJcIjogXCJFQVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFYXN0IEFmcmljYSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkV1cm9wZVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVFU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFYXN0ZXJuIEV1cm9wZWFuIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVBVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkVhc3Rlcm4gQWZyaWNhIFRpbWVcIlxuICAgIH0gXG4gIF0sIFxuICBcIlVUQ1wiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBdGxhbnRpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIkFaT1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQXpvcmVzIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJFR1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWFzdGVybiBHcmVlbmxhbmQgU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQWZyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiR01UXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiR3JlZW53aWNoIE1lYW4gVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJFdXJvcGVcIiwgXG4gICAgICBcImFiYnJcIjogXCJHTVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJHcmVlbndpY2ggTWVhbiBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIldFVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIldlc3Rlcm4gRXVyb3BlYW4gVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJFdXJvcGVcIiwgXG4gICAgICBcImFiYnJcIjogXCJXRVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJXZXN0ZXJuIEV1cm9wZWFuIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQWZyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiV1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJXZXN0ZXJuIFNhaGFyYSBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk1pbGl0YXJ5XCIsIFxuICAgICAgXCJhYmJyXCI6IFwiWlwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlp1bHUgVGltZSBab25lXCJcbiAgICB9XG4gIF0sIFxuICBcIiswNDAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJBTVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJBcm1lbmlhIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkFaVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkF6ZXJiYWlqYW4gVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJNaWxpdGFyeVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJEZWx0YSBUaW1lIFpvbmVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkdFVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkdlb3JnaWEgU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiR1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiR3VsZiBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkV1cm9wZVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIktVWVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJLdXlieXNoZXYgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJFdXJvcGVcIiwgXG4gICAgICBcImFiYnJcIjogXCJNU0RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJNb3Njb3cgRGF5bGlnaHQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBZnJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJNVVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJNYXVyaXRpdXMgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBZnJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJSRVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJSZXVuaW9uIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiRXVyb3BlXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiU0FNVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlNhbWFyYSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlNDVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlNleWNoZWxsZXMgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCIrMDcwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBdXN0cmFsaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJDWFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDaHJpc3RtYXMgSXNsYW5kIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQW50YXJjdGljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkRBVlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJEYXZpcyBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk1pbGl0YXJ5XCIsIFxuICAgICAgXCJhYmJyXCI6IFwiR1wiLCBcbiAgICAgIFwibmFtZVwiOiBcIkdvbGYgVGltZSBab25lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJIT1ZUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSG92ZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJJQ1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJJbmRvY2hpbmEgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiS1JBVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIktyYXNub3lhcnNrIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIk5PVlNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTm92b3NpYmlyc2sgU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIk9NU1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiT21zayBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiV0lCXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiV2VzdGVybiBJbmRvbmVzaWFuIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzAyMDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTWlsaXRhcnlcIiwgXG4gICAgICBcImFiYnJcIjogXCJCXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQnJhdm8gVGltZSBab25lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNBVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNlbnRyYWwgQWZyaWNhIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiRXVyb3BlXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ0VTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNlbnRyYWwgRXVyb3BlYW4gU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQWZyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRUVUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWFzdGVybiBFdXJvcGVhbiBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJFRVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFYXN0ZXJuIEV1cm9wZWFuIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiRXVyb3BlXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRUVUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWFzdGVybiBFdXJvcGVhbiBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJJU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJJc3JhZWwgU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBZnJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJTQVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiU291dGggQWZyaWNhIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQWZyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiV0FTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIldlc3QgQWZyaWNhIFN1bW1lciBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIi0xMDAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJDS1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDb29rIElzbGFuZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJIQVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSGF3YWlpLUFsZXV0aWFuIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkhTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkhhd2FpaS1BbGV1dGlhbiBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJUQUhUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiVGFoaXRpIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIlRLVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlRva2VsYXUgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJNaWxpdGFyeVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIldcIiwgXG4gICAgICBcIm5hbWVcIjogXCJXaGlza2V5IFRpbWUgWm9uZVwiXG4gICAgfVxuICBdLCBcbiAgXCIrMDkzMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBdXN0cmFsaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJDU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDZW50cmFsIFN0YW5kYXJkIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzA1MzBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIklTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkluZGlhIFN0YW5kYXJkIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzEzMDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIkZKU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJGaWppIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFudGFyY3RpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJOWkRUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTmV3IFplYWxhbmQgRGF5bGlnaHQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTlpEVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk5ldyBaZWFsYW5kIERheWxpZ2h0IFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIlBIT1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJQaG9lbml4IElzbGFuZCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIiswNTQ1XCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJOUFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJOZXBhbCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIisxMDAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJDaFNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2hhbW9ycm8gU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBdXN0cmFsaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJFU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFYXN0ZXJuIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTWlsaXRhcnlcIiwgXG4gICAgICBcImFiYnJcIjogXCJLXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiS2lsbyBUaW1lIFpvbmVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIlBHVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlBhcHVhIE5ldyBHdWluZWEgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiVkxBVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlZsYWRpdm9zdG9rIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIllBS1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiWWFrdXRzayBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiWUFQVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIllhcCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIi0wNjAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJDU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDZW50cmFsIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIk1EVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk1vdW50YWluIERheWxpZ2h0IFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIkdBTFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJHYWxhcGFnb3MgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSEFSXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSGV1cmUgQXZhbmNcXHUwMGU5ZSBkZXMgUm9jaGV1c2VzXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJITkNcIiwgXG4gICAgICBcIm5hbWVcIjogXCJIZXVyZSBOb3JtYWxlIGR1IENlbnRyZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJDZW50cmFsIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJITkNcIiwgXG4gICAgICBcIm5hbWVcIjogXCJIZXVyZSBOb3JtYWxlIGR1IENlbnRyZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJDZW50cmFsIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJDU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDZW50cmFsIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVBU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFYXN0ZXIgSXNsYW5kIFN0YW5kYXJkIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzAxMDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiRXVyb3BlXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ0VUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2VudHJhbCBFdXJvcGVhbiBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkV1cm9wZVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkJTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkJyaXRpc2ggU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQWZyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ0VUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2VudHJhbCBFdXJvcGVhbiBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIldFU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJXZXN0ZXJuIEV1cm9wZWFuIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkV1cm9wZVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIldFU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJXZXN0ZXJuIEV1cm9wZWFuIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIldTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIldlc3Rlcm4gU2FoYXJhIFN1bW1lciBUaW1lXCJcbiAgICB9LFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQWZyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiV0FUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiV2VzdCBBZnJpY2EgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCItMDQwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQXRsYW50aWMgU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRURUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWFzdGVybiBEYXlsaWdodCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJDTFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDaGlsZSBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJGS1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJGYWxrbGFuZCBJc2xhbmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJTb3V0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiR1lUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiR3V5YW5hIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiU291dGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlBZVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlBhcmFndWF5IFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiU291dGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkFNVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkFtYXpvbiBUaW1lXCJcbiAgICB9IFxuICBdLCBcbiAgXCItMDMzMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTlNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTmV3Zm91bmRsYW5kIFN0YW5kYXJkIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiLTA1MDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkVhc3Rlcm4gU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ0RUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2VudHJhbCBEYXlsaWdodCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJDT1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDb2xvbWJpYSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkNhcmliYmVhblwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkN1YmEgU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRUFTU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFYXN0ZXIgSXNsYW5kIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJFQ1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFY3VhZG9yIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQ2VudHJhbCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWFzdGVybiBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkNhcmliYmVhblwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkVhc3Rlcm4gU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJDZW50cmFsIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJFVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlRpZW1wbyBkZWwgRXN0ZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJDYXJpYmJlYW5cIiwgXG4gICAgICBcImFiYnJcIjogXCJFVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlRpZW1wbyBkZWwgRXN0ZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJUaWVtcG8gRGVsIEVzdGVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkhBQ1wiLCBcbiAgICAgIFwibmFtZVwiOiBcIkhldXJlIEF2YW5jXFx1MDBlOWUgZHUgQ2VudHJlXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJQRVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJQZXJ1IFRpbWVcIlxuICAgIH0gXG4gIF0sIFxuICBcIi0wOTAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJBS1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQWxhc2thIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkhBRFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJIYXdhaWktQWxldXRpYW4gRGF5bGlnaHQgVGltZVwiXG4gICAgfSBcbiAgXSwgXG4gIFwiLTAzMDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkFEVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkF0bGFudGljIERheWxpZ2h0IFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiU291dGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkFNU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJBbWF6b24gU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiU291dGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkJSVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkJyYXNcXHUwMGVkbGlhIHRpbWVcIlxuICAgIH0gXG4gIF0sIFxuICBcIisxMjQ1XCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJDSEFTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNoYXRoYW0gSXNsYW5kIFN0YW5kYXJkIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzA2MDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkJTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkJhbmdsYWRlc2ggU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiWUVLU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJZZWthdGVyaW5idXJnIFN1bW1lciBUaW1lXCJcbiAgICB9LFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkJTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkJhbmdsYWRlc2ggU3RhbmRhcmQgVGltZVwiXG4gICAgfSBcbiAgXSwgXG4gIFwiLTA5MzBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIk1BUlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJNYXJxdWVzYXMgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCIrMDMzMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSVJTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIklyYW4gU3RhbmRhcmQgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCIrMTEzMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBdXN0cmFsaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJORlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJOb3Jmb2xrIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzExMDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlZMQVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiVmxhZGl2b3N0b2sgU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXVzdHJhbGlhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRURUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWFzdGVybiBEYXlsaWdodCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJOQ1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJOZXcgQ2FsZWRvbmlhIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIlBPTlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJQb2hucGVpIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIlNCVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlNvbG9tb24gSXNsYW5kc1RpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIlZVVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlZhbnVhdHUgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCItMDgwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiUFNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiUGFjaWZpYyBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJBS0RUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQWxhc2thIERheWxpZ2h0IFRpbWVcIlxuICAgIH0gXG4gIF1cbn1cbiJdfQ==(1)
});
;