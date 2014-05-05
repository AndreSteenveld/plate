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
  if(isNaN(input) || isNaN(value)) {
    return ''
  }
  return input + value
}

},{}],15:[function(require,module,exports){
module.exports = function(input) {
  if(input === undefined || input === null) {
    input = ''
  }
  return input.toString().replace(/'/g, "\\'")
}

},{}],16:[function(require,module,exports){
module.exports = function(input) {
  var str = input.toString();
  return [str.slice(0,1).toUpperCase(), str.slice(1)].join('')
}

},{}],17:[function(require,module,exports){
module.exports = function(input, len, ready) {
  if(input === undefined || input === null) {
    input = ''
  }

  if(ready === undefined) {
    len = 0
  }

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
  if(ready === undefined) {
    value = 'N j, Y'
  }

  return format(input.getFullYear ? input : new Date(input), value)
}

},{"../date":5}],20:[function(require,module,exports){
module.exports = function(input, def, ready) {
  return input ? input : def
}

},{}],21:[function(require,module,exports){
module.exports = function(input, key) {
  if(input === undefined || input === null) {
    input = []
  }

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
  if(isNaN(parseInt(input))) {
    throw new Error('Invalid input for divisibleby: ' + String(input))
  }

  return input % parseInt(num, 10) == 0
}

},{}],24:[function(require,module,exports){
var FilterNode = require('../filter_node')

module.exports = function(input) {
  if(input === undefined) {
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

  if(isNaN(num)) {
    num = 0
  }

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

  if(isNaN(asNumber)) {
    return ''
  }

  asNumber = Math.round((pow * asNumber) / pow_minus_one)

  if(val !== 0) {
    asNumber /= 10
  }

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
  if(input === undefined) {
    input = ''
  }

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
    } else {
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
    } else {
      return input.length === expected
    }
  }
  return 0 === expected
}

},{}],37:[function(require,module,exports){
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

},{"./safe":47}],38:[function(require,module,exports){
var safe = require('./safe')

module.exports = function(input) {
  if(input === undefined || input === null) {
    input = ''
  }

  var str = input.toString()
  return safe(str.replace(/\n/g, '<br />'))
}

},{"./safe":47}],39:[function(require,module,exports){
module.exports = function(input) {
  if(input === undefined || input === null) {
    input = ''
  }

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
  if(input === undefined || input === null) {
    input = ''
  }

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

  if(isNaN(val)) {
    val = 1
  }

  suffix = plural[plural.length-1];
  if(val === 1) {
    suffix = plural.length > 1 ? plural[0] : '';
  }

  return suffix
}

},{}],45:[function(require,module,exports){
module.exports = function(input) {
  if(!input) {
    return null
  }

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
  if(input === undefined) {
    input = ''
  }

  input = new String(input)
  input.safe = true
  return input
}

},{"../filter_node":12}],48:[function(require,module,exports){
module.exports = function(input, by) {
  if(input === undefined || input === null) {
    input = []
  }

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

  if(diff > 0) {
    return '0 minutes'
  }

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

  if(isNaN(num)) {
    return input
  }

  if(input.length <= num) {
    return input
  }

  return input.slice(0, num)+'...'
}

},{}],56:[function(require,module,exports){
module.exports = function(input, n) {
  var str = input.toString()
    , num = parseInt(n, 10)
    , words

  if(isNaN(num)) {
    return input
  }

  words = input.split(/\s+/)

  if(words.length <= num) {
    return input
  }

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

    if(item instanceof Array) {
      out.unshift('<ul>'+ulparser(item)+'</ul>')
    } else {
      out.unshift('</li><li>'+item)
    }
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
  if(input === undefined || input === null) {
    return 0
  }

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
  if(input === undefined) {
    input = false
  }

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

  if(!bits.length) {
    return {}
  }
  match = kwarg_re.exec(bits[0])
  kwarg_format = match && match[1]
  if(!kwarg_format) {
    if(bits.length < 3 || bits[1] !== 'as') {
      return {}
    }
  }

  kwargs = {}
  while(bits.length) {
    if(kwarg_format) {
      match = kwarg_re.exec(bits[0])
      if(!match || !match[1]) {
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

  for(var context_var in extra_context) {
    if(extra_context.hasOwnProperty(context_var)) {
      has_context_vars = true
      break
    }
  }

  if (!has_context_vars) {
    throw new Error('"'+bits[0]+'" expected at least one variable assignment')
  }
  if (remaining_bits.length) {
    throw new Error('"'+bits[0]+'" received an invalid token: "'+remaining_bits[0]+'"')
  }

  parser.tokens.shift()
  return new cons(nodelist, extra_context)
}

proto.render = function(context) {
  var self = this
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
      } else {
        context[key] = value
      }
    }
  }

  if(promises) {
    return promise
  }

  return self.nodes.render(context)
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
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvYnJvd3Nlci5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvYmxvY2tfY29udGV4dC5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvY29tbWVudF90b2tlbi5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvY29udGV4dC5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvZGF0ZS5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvZGVidWcuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2RlZmF1bHRmaWx0ZXJzLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9kZWZhdWx0dGFncy5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvZmlsdGVyX2FwcGxpY2F0aW9uLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9maWx0ZXJfY2hhaW4uanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcl9sb29rdXAuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcl9ub2RlLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9maWx0ZXJfdG9rZW4uanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcnMvYWRkLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9maWx0ZXJzL2FkZHNsYXNoZXMuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcnMvY2FwZmlyc3QuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcnMvY2VudGVyLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9maWx0ZXJzL2N1dC5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvZmlsdGVycy9kYXRlLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9maWx0ZXJzL2RlZmF1bHQuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcnMvZGljdHNvcnQuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcnMvZGljdHNvcnRyZXZlcnNlZC5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvZmlsdGVycy9kaXZpc2libGVieS5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvZmlsdGVycy9lc2NhcGUuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcnMvZmlsZXNpemVmb3JtYXQuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcnMvZmlyc3QuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcnMvZmxvYXRmb3JtYXQuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcnMvZm9yY2VfZXNjYXBlLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9maWx0ZXJzL2dldF9kaWdpdC5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvZmlsdGVycy9pbmRleC5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvZmlsdGVycy9pcmllbmNvZGUuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcnMvaXRlcml0ZW1zLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9maWx0ZXJzL2pvaW4uanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcnMvbGFzdC5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvZmlsdGVycy9sZW5ndGguanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcnMvbGVuZ3RoX2lzLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9maWx0ZXJzL2xpbmVicmVha3MuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcnMvbGluZWJyZWFrc2JyLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9maWx0ZXJzL2xpbmVudW1iZXJzLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9maWx0ZXJzL2xqdXN0LmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9maWx0ZXJzL2xvd2VyLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9maWx0ZXJzL21ha2VfbGlzdC5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvZmlsdGVycy9waG9uZTJudW1lcmljLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9maWx0ZXJzL3BsdXJhbGl6ZS5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvZmlsdGVycy9yYW5kb20uanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcnMvcmp1c3QuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcnMvc2FmZS5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvZmlsdGVycy9zbGljZS5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvZmlsdGVycy9zbHVnaWZ5LmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9maWx0ZXJzL3NwbGl0LmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9maWx0ZXJzL3N0cmlwdGFncy5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvZmlsdGVycy90aW1lc2luY2UuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcnMvdGltZXVudGlsLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9maWx0ZXJzL3RpdGxlLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9maWx0ZXJzL3RydW5jYXRlY2hhcnMuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcnMvdHJ1bmNhdGV3b3Jkcy5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvZmlsdGVycy91bm9yZGVyZWRfbGlzdC5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvZmlsdGVycy91cHBlci5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvZmlsdGVycy91cmxlbmNvZGUuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2ZpbHRlcnMvdXJsaXplLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9maWx0ZXJzL3VybGl6ZXRydW5jLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9maWx0ZXJzL3dvcmRjb3VudC5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvZmlsdGVycy93b3Jkd3JhcC5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvZmlsdGVycy95ZXNuby5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvaW5kZXguanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL2xpYnJhcmllcy5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvbGlicmFyeS5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvbWV0YS5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvbm9kZV9saXN0LmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi9wYXJzZXIuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL3Byb21pc2UuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL3RhZ190b2tlbi5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvdGFncy9ibG9jay5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvdGFncy9jb21tZW50LmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi90YWdzL2RlYnVnLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi90YWdzL2V4dGVuZHMuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL3RhZ3MvZm9yLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi90YWdzL2lmL2VuZC5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvdGFncy9pZi9pbmZpeC5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvdGFncy9pZi9saXRlcmFsLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi90YWdzL2lmL25vZGUuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL3RhZ3MvaWYvb3BlcmF0b3JzLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi90YWdzL2lmL3BhcnNlci5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvdGFncy9pZi9wcmVmaXguanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL3RhZ3MvaW5jbHVkZS5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvdGFncy9ub3cuanMiLCIvaG9tZS9hbmRyZXcvcHJvamVjdHMvcGxhdGUvbGliL3RhZ3Mvd2l0aC5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvdGV4dF9ub2RlLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi90ZXh0X3Rva2VuLmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL2xpYi90b2tlbi5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9saWIvdXJsX2ZpbmRlci5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9ub2RlX21vZHVsZXMvZHN0L2luZGV4LmpzIiwiL2hvbWUvYW5kcmV3L3Byb2plY3RzL3BsYXRlL25vZGVfbW9kdWxlcy90ei9pbmRleC5qcyIsIi9ob21lL2FuZHJldy9wcm9qZWN0cy9wbGF0ZS9ub2RlX21vZHVsZXMvdHovdHouanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ05BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25QQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbInJlcXVpcmUoJ2RzdCcpXG5cbnZhciBwbGF0ZSA9IHJlcXVpcmUoJy4vbGliL2luZGV4JylcbmlmKHR5cGVvZiBkZWZpbmUgIT09ICd1bmRlZmluZWQnICYmIGRlZmluZS5hbWQpIHtcbiAgZGVmaW5lKCdwbGF0ZScsIFtdLCBmdW5jdGlvbigpIHsgcmV0dXJuIHBsYXRlIH0pXG59IGVsc2Uge1xuICB3aW5kb3cucGxhdGUgPSBwbGF0ZVxufVxuXG5wbGF0ZS5kZWJ1ZyA9IHJlcXVpcmUoJy4vbGliL2RlYnVnJylcbnBsYXRlLnV0aWxzID0gcGxhdGUuZGF0ZSA9IHJlcXVpcmUoJy4vbGliL2RhdGUnKVxucGxhdGUudXRpbHMuUHJvbWlzZSA9IHJlcXVpcmUoJy4vbGliL3Byb21pc2UnKVxucGxhdGUudXRpbHMuU2FmZVN0cmluZyA9IGZ1bmN0aW9uKHN0cikge1xuICBzdHIgPSBuZXcgU3RyaW5nKHN0cilcbiAgc3RyLnNhZmUgPSB0cnVlXG4gIHJldHVybiBzdHJcbn1cbnBsYXRlLmxpYnJhcmllcyA9IHJlcXVpcmUoJy4vbGliL2xpYnJhcmllcycpXG5cbm1vZHVsZS5leHBvcnRzID0gcGxhdGVcbiIsIm1vZHVsZS5leHBvcnRzID0gQmxvY2tDb250ZXh0XG5cbmZ1bmN0aW9uIEJsb2NrQ29udGV4dCgpIHtcbiAgdGhpcy5ibG9ja3MgPSB7fVxufVxuXG52YXIgY29ucyA9IEJsb2NrQ29udGV4dFxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxuY29ucy5LRVkgPSAnX19CTE9DS19DT05URVhUX18nXG5cbmNvbnMuZnJvbSA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgcmV0dXJuIGNvbnRleHRbdGhpcy5LRVldXG59XG5cbmNvbnMuaW50byA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgcmV0dXJuIGNvbnRleHRbdGhpcy5LRVldID0gbmV3IHRoaXMoKVxufVxuXG5wcm90by5hZGQgPSBmdW5jdGlvbihibG9ja3MpIHtcbiAgZm9yKHZhciBuYW1lIGluIGJsb2Nrcykge1xuICAgICh0aGlzLmJsb2Nrc1tuYW1lXSA9IHRoaXMuYmxvY2tzW25hbWVdIHx8IFtdKS51bnNoaWZ0KGJsb2Nrc1tuYW1lXSlcbiAgfVxufVxuXG5wcm90by5nZXQgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHZhciBsaXN0ID0gdGhpcy5ibG9ja3NbbmFtZV0gfHwgW11cblxuICByZXR1cm4gbGlzdFtsaXN0Lmxlbmd0aCAtIDFdXG59XG5cbnByb3RvLnB1c2ggPSBmdW5jdGlvbihuYW1lLCBibG9jaykge1xuICAodGhpcy5ibG9ja3NbbmFtZV0gPSB0aGlzLmJsb2Nrc1tuYW1lXSB8fCBbXSkucHVzaChibG9jaylcbn1cblxucHJvdG8ucG9wID0gZnVuY3Rpb24obmFtZSkge1xuICByZXR1cm4gKHRoaXMuYmxvY2tzW25hbWVdID0gdGhpcy5ibG9ja3NbbmFtZV0gfHwgW10pLnBvcCgpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IENvbW1lbnRUb2tlblxuXG52YXIgVG9rZW4gPSByZXF1aXJlKCcuL3Rva2VuJylcblxuZnVuY3Rpb24gQ29tbWVudFRva2VuKGNvbnRlbnQsIGxpbmUpIHtcbiAgVG9rZW4uY2FsbCh0aGlzLCBjb250ZW50LCBsaW5lKVxufVxuXG52YXIgY29ucyA9IENvbW1lbnRUb2tlblxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGUgPSBuZXcgVG9rZW5cblxucHJvdG8uY29uc3RydWN0b3IgPSBjb25zXG5cbnByb3RvLm5vZGUgPSBmdW5jdGlvbihwYXJzZXIpIHtcbiAgLy8gbm8tb3BlcmF0aW9uXG4gIHJldHVybiBudWxsXG59XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gQ29udGV4dFxuXG5mdW5jdGlvbiBDb250ZXh0KGZyb20pIHtcbiAgaWYoZnJvbSAmJiBmcm9tLmNvbnN0cnVjdG9yID09PSBDb250ZXh0KSB7XG4gICAgcmV0dXJuIGZyb21cbiAgfVxuXG4gIGZyb20gPSBmcm9tIHx8IHt9XG4gIGZvcih2YXIga2V5IGluIGZyb20pIGlmKGZyb20uaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgIHRoaXNba2V5XSA9IGZyb21ba2V5XVxuICB9XG59XG5cbnZhciBjb25zID0gQ29udGV4dFxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8uY29weSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgRiA9IEZ1bmN0aW9uKClcbiAgRi5uYW1lID0gY29ucy5uYW1lXG4gIEYucHJvdG90eXBlID0gdGhpc1xuICByZXR1cm4gbmV3IEZcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0geyB0aW1lOiB0aW1lX2Zvcm1hdCwgZGF0ZTogZm9ybWF0LCBEYXRlRm9ybWF0OiBEYXRlRm9ybWF0IH1cblxudHJ5IHsgcmVxdWlyZSgndHonKSB9IGNhdGNoKGUpIHsgfVxuXG5mdW5jdGlvbiBjYXBmaXJzdCAoc3RyKSB7XG4gIHJldHVybiBzdHIucmVwbGFjZSgvXiguezF9KS8sIGZ1bmN0aW9uKGEsIG0pIHsgcmV0dXJuIG0udG9VcHBlckNhc2UoKSB9KVxufVxuXG5mdW5jdGlvbiBtYXAgKGFyciwgaXRlcikge1xuICB2YXIgb3V0ID0gW11cbiAgZm9yKHZhciBpID0gMCwgbGVuID0gYXJyLmxlbmd0aDsgaSA8IGxlbjsgKytpKVxuICAgIG91dC5wdXNoKGl0ZXIoYXJyW2ldLCBpLCBhcnIpKVxuICByZXR1cm4gb3V0XG59XG5cbmZ1bmN0aW9uIHJlZHVjZShhcnIsIGl0ZXIsIHN0YXJ0KSB7XG4gIGFyciA9IGFyci5zbGljZSgpXG4gIGlmKHN0YXJ0ICE9PSB1bmRlZmluZWQpXG4gICAgYXJyLnVuc2hpZnQoc3RhcnQpXG5cbiAgaWYoYXJyLmxlbmd0aCA9PT0gMClcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3JlZHVjZSBvZiBlbXB0eSBhcnJheScpXG5cbiAgaWYoYXJyLmxlbmd0aCA9PT0gMSlcbiAgICByZXR1cm4gYXJyWzBdXG5cbiAgdmFyIG91dCA9IGFyci5zbGljZSgpXG4gICAgLCBpdGVtID0gYXJyLnNoaWZ0KClcblxuICBkbyB7XG4gICAgaXRlbSA9IGl0ZXIoaXRlbSwgYXJyLnNoaWZ0KCkpXG4gIH0gd2hpbGUoYXJyLmxlbmd0aClcblxuICByZXR1cm4gaXRlbVxufVxuXG5mdW5jdGlvbiBzdHJ0b2FycmF5KHN0cikge1xuICB2YXIgYXJyID0gW11cbiAgZm9yKHZhciBpID0gMCwgbGVuID0gc3RyLmxlbmd0aDsgaSA8IGxlbjsgKytpKVxuICAgIGFyci5wdXNoKHN0ci5jaGFyQXQoaSkpXG4gIHJldHVybiBhcnJcbn1cblxudmFyIFdFRUtEQVlTID0gWyAnc3VuZGF5JywgJ21vbmRheScsICd0dWVzZGF5JywgJ3dlZG5lc2RheScsICd0aHVyc2RheScsICdmcmlkYXknLCAnc2F0dXJkYXknIF1cbiAgLCBXRUVLREFZU19BQkJSID0gbWFwKFdFRUtEQVlTLCBmdW5jdGlvbih4KSB7IHJldHVybiBzdHJ0b2FycmF5KHgpLnNsaWNlKDAsIDMpLmpvaW4oJycpIH0pXG4gICwgV0VFS0RBWVNfUkVWID0gcmVkdWNlKG1hcChXRUVLREFZUywgZnVuY3Rpb24oeCwgaSkgeyByZXR1cm4gW3gsIGldIH0pLCBmdW5jdGlvbihsaHMsIHJocykgeyBsaHNbcmhzWzBdXSA9IHJoc1sxXTsgcmV0dXJuIGxocyB9LCB7fSlcbiAgLCBNT05USFMgPSBbICdqYW51YXJ5JywgJ2ZlYnJ1YXJ5JywgJ21hcmNoJywgJ2FwcmlsJywgJ21heScsICdqdW5lJywgJ2p1bHknLCAnYXVndXN0JywgJ3NlcHRlbWJlcicsICdvY3RvYmVyJywgJ25vdmVtYmVyJywgJ2RlY2VtYmVyJyBdXG4gICwgTU9OVEhTXzMgPSBtYXAoTU9OVEhTLCBmdW5jdGlvbih4KSB7IHJldHVybiBzdHJ0b2FycmF5KHgpLnNsaWNlKDAsIDMpLmpvaW4oJycpIH0pXG4gICwgTU9OVEhTXzNfUkVWID0gcmVkdWNlKG1hcChNT05USFNfMywgZnVuY3Rpb24oeCwgaSkgeyByZXR1cm4gW3gsIGldIH0pLCBmdW5jdGlvbihsaHMsIHJocykgeyBsaHNbcmhzWzBdXSA9IHJoc1sxXTsgcmV0dXJuIGxocyB9LCB7fSlcbiAgLCBNT05USFNfQVAgPSBbXG4gICAgJ0phbi4nXG4gICwgJ0ZlYi4nXG4gICwgJ01hcmNoJ1xuICAsICdBcHJpbCdcbiAgLCAnTWF5J1xuICAsICdKdW5lJ1xuICAsICdKdWx5J1xuICAsICdBdWcuJ1xuICAsICdTZXB0LidcbiAgLCAnT2N0LidcbiAgLCAnTm92LidcbiAgLCAnRGVjLidcbiAgXVxuXG5cbnZhciBNT05USFNfQUxUID0ge1xuICAxOiAnSmFudWFyeScsXG4gIDI6ICdGZWJydWFyeScsXG4gIDM6ICdNYXJjaCcsXG4gIDQ6ICdBcHJpbCcsXG4gIDU6ICdNYXknLFxuICA2OiAnSnVuZScsXG4gIDc6ICdKdWx5JyxcbiAgODogJ0F1Z3VzdCcsXG4gIDk6ICdTZXB0ZW1iZXInLFxuICAxMDogJ09jdG9iZXInLFxuICAxMTogJ05vdmVtYmVyJyxcbiAgMTI6ICdEZWNlbWJlcidcbn1cblxuZnVuY3Rpb24gRm9ybWF0dGVyKHQpIHtcbiAgdGhpcy5kYXRhID0gdFxufVxuXG5Gb3JtYXR0ZXIucHJvdG90eXBlLmZvcm1hdCA9IGZ1bmN0aW9uKHN0cikge1xuICB2YXIgYml0cyA9IHN0cnRvYXJyYXkoc3RyKVxuICAsIGVzYyA9IGZhbHNlXG4gICwgb3V0ID0gW11cbiAgLCBiaXRcblxuICB3aGlsZShiaXRzLmxlbmd0aCkge1xuICAgIGJpdCA9IGJpdHMuc2hpZnQoKVxuXG4gICAgaWYoZXNjKSB7XG4gICAgICBvdXQucHVzaChiaXQpXG4gICAgICBlc2MgPSBmYWxzZVxuICAgIH0gZWxzZSBpZihiaXQgPT09ICdcXFxcJykge1xuICAgICAgZXNjID0gdHJ1ZVxuICAgIH0gZWxzZSBpZih0aGlzW2JpdF0pIHtcbiAgICAgIG91dC5wdXNoKHRoaXNbYml0XSgpKVxuICAgIH0gZWxzZSB7XG4gICAgICBvdXQucHVzaChiaXQpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG91dC5qb2luKCcnKVxufVxuXG5mdW5jdGlvbiBUaW1lRm9ybWF0KHQpIHtcbiAgRm9ybWF0dGVyLmNhbGwodGhpcywgdClcbn1cblxudmFyIHByb3RvID0gVGltZUZvcm1hdC5wcm90b3R5cGUgPSBuZXcgRm9ybWF0dGVyKClcblxucHJvdG8uYSA9IGZ1bmN0aW9uKCkge1xuICAvLyAnYS5tLicgb3IgJ3AubS4nXG4gIGlmICh0aGlzLmRhdGEuZ2V0SG91cnMoKSA+IDExKVxuICAgIHJldHVybiAncC5tLidcbiAgcmV0dXJuICdhLm0uJ1xufVxuXG5wcm90by5BID0gZnVuY3Rpb24oKSB7XG4gIC8vICdBTScgb3IgJ1BNJ1xuICBpZiAodGhpcy5kYXRhLmdldEhvdXJzKCkgPiAxMSlcbiAgICByZXR1cm4gJ1BNJ1xuICByZXR1cm4gJ0FNJ1xufVxuXG5wcm90by5mID0gZnVuY3Rpb24oKSB7XG4gIC8qXG4gIFRpbWUsIGluIDEyLWhvdXIgaG91cnMgYW5kIG1pbnV0ZXMsIHdpdGggbWludXRlcyBsZWZ0IG9mZiBpZiB0aGV5J3JlXG4gIHplcm8uXG4gIEV4YW1wbGVzOiAnMScsICcxOjMwJywgJzI6MDUnLCAnMidcbiAgUHJvcHJpZXRhcnkgZXh0ZW5zaW9uLlxuICAqL1xuICBpZiAodGhpcy5kYXRhLmdldE1pbnV0ZXMoKSA9PSAwKVxuICAgIHJldHVybiB0aGlzLmcoKVxuICByZXR1cm4gdGhpcy5nKCkgKyBcIjpcIiArIHRoaXMuaSgpXG59XG5cbnByb3RvLmcgPSBmdW5jdGlvbigpIHtcbiAgLy8gSG91ciwgMTItaG91ciBmb3JtYXQgd2l0aG91dCBsZWFkaW5nIHplcm9zIGkuZS4gJzEnIHRvICcxMidcbiAgdmFyIGggPSB0aGlzLmRhdGEuZ2V0SG91cnMoKVxuXG4gIHJldHVybiB0aGlzLmRhdGEuZ2V0SG91cnMoKSAlIDEyIHx8IDEyXG59XG5cbnByb3RvLkcgPSBmdW5jdGlvbigpIHtcbiAgLy8gSG91ciwgMjQtaG91ciBmb3JtYXQgd2l0aG91dCBsZWFkaW5nIHplcm9zIGkuZS4gJzAnIHRvICcyMydcbiAgcmV0dXJuIHRoaXMuZGF0YS5nZXRIb3VycygpXG59XG5cbnByb3RvLmggPSBmdW5jdGlvbigpIHtcbiAgLy8gSG91ciwgMTItaG91ciBmb3JtYXQgaS5lLiAnMDEnIHRvICcxMidcbiAgcmV0dXJuICgnMCcrdGhpcy5nKCkpLnNsaWNlKC0yKVxufVxuXG5wcm90by5IID0gZnVuY3Rpb24oKSB7XG4gIC8vIEhvdXIsIDI0LWhvdXIgZm9ybWF0IGkuZS4gJzAwJyB0byAnMjMnXG4gIHJldHVybiAoJzAnK3RoaXMuRygpKS5zbGljZSgtMilcbn1cblxucHJvdG8uaSA9IGZ1bmN0aW9uKCkge1xuICAvLyBNaW51dGVzIGkuZS4gJzAwJyB0byAnNTknXG4gIHJldHVybiAoJzAnICsgdGhpcy5kYXRhLmdldE1pbnV0ZXMoKSkuc2xpY2UoLTIpXG59XG5cbnByb3RvLlAgPSBmdW5jdGlvbigpIHtcbiAgLypcbiAgVGltZSwgaW4gMTItaG91ciBob3VycywgbWludXRlcyBhbmQgJ2EubS4nLydwLm0uJywgd2l0aCBtaW51dGVzIGxlZnQgb2ZmXG4gIGlmIHRoZXkncmUgemVybyBhbmQgdGhlIHN0cmluZ3MgJ21pZG5pZ2h0JyBhbmQgJ25vb24nIGlmIGFwcHJvcHJpYXRlLlxuICBFeGFtcGxlczogJzEgYS5tLicsICcxOjMwIHAubS4nLCAnbWlkbmlnaHQnLCAnbm9vbicsICcxMjozMCBwLm0uJ1xuICBQcm9wcmlldGFyeSBleHRlbnNpb24uXG4gICovXG4gIHZhciBtID0gdGhpcy5kYXRhLmdldE1pbnV0ZXMoKVxuICAgICwgaCA9IHRoaXMuZGF0YS5nZXRIb3VycygpXG5cbiAgaWYgKG0gPT0gMCAmJiBoID09IDApXG4gICAgcmV0dXJuICdtaWRuaWdodCdcbiAgaWYgKG0gPT0gMCAmJiBoID09IDEyKVxuICAgIHJldHVybiAnbm9vbidcbiAgcmV0dXJuIHRoaXMuZigpICsgXCIgXCIgKyB0aGlzLmEoKVxufVxuXG5wcm90by5zID0gZnVuY3Rpb24oKSB7XG4gIC8vIFNlY29uZHMgaS5lLiAnMDAnIHRvICc1OSdcbiAgcmV0dXJuICgnMCcrdGhpcy5kYXRhLmdldFNlY29uZHMoKSkuc2xpY2UoLTIpXG59XG5cbnByb3RvLnUgPSBmdW5jdGlvbigpIHtcbiAgLy8gTWljcm9zZWNvbmRzXG4gIHJldHVybiB0aGlzLmRhdGEuZ2V0TWlsbGlzZWNvbmRzKClcbn1cblxuLy8gRGF0ZUZvcm1hdFxuXG5mdW5jdGlvbiBEYXRlRm9ybWF0KHQpIHtcbiAgdGhpcy5kYXRhID0gdFxuICB0aGlzLnllYXJfZGF5cyA9IFswLCAzMSwgNTksIDkwLCAxMjAsIDE1MSwgMTgxLCAyMTIsIDI0MywgMjczLCAzMDQsIDMzNF1cbn1cblxucHJvdG8gPSBEYXRlRm9ybWF0LnByb3RvdHlwZSA9IG5ldyBUaW1lRm9ybWF0KClcblxucHJvdG8uY29udHJ1Y3RvciA9IERhdGVGb3JtYXRcblxucHJvdG8uYiA9IGZ1bmN0aW9uKCkge1xuICAvLyBNb250aCwgdGV4dHVhbCwgMyBsZXR0ZXJzLCBsb3dlcmNhc2UgZS5nLiAnamFuJ1xuICByZXR1cm4gTU9OVEhTXzNbdGhpcy5kYXRhLmdldE1vbnRoKCldXG59XG5cbnByb3RvLmM9IGZ1bmN0aW9uKCkge1xuICAvKlxuICBJU08gODYwMSBGb3JtYXRcbiAgRXhhbXBsZSA6ICcyMDA4LTAxLTAyVDEwOjMwOjAwLjAwMDEyMydcbiAgKi9cbiAgcmV0dXJuIHRoaXMuZGF0YS50b0lTT1N0cmluZyA/IHRoaXMuZGF0YS50b0lTT1N0cmluZygpIDogJydcbn1cblxucHJvdG8uZCA9IGZ1bmN0aW9uKCkge1xuICAvLyBEYXkgb2YgdGhlIG1vbnRoLCAyIGRpZ2l0cyB3aXRoIGxlYWRpbmcgemVyb3MgaS5lLiAnMDEnIHRvICczMSdcbiAgcmV0dXJuICgnMCcrdGhpcy5kYXRhLmdldERhdGUoKSkuc2xpY2UoLTIpXG59XG5cbnByb3RvLkQgPSBmdW5jdGlvbigpIHtcbiAgLy8gRGF5IG9mIHRoZSB3ZWVrLCB0ZXh0dWFsLCAzIGxldHRlcnMgZS5nLiAnRnJpJ1xuICByZXR1cm4gY2FwZmlyc3QoV0VFS0RBWVNfQUJCUlt0aGlzLmRhdGEuZ2V0RGF5KCldKVxufVxuXG5wcm90by5FID0gZnVuY3Rpb24oKSB7XG4gIC8vIEFsdGVybmF0aXZlIG1vbnRoIG5hbWVzIGFzIHJlcXVpcmVkIGJ5IHNvbWUgbG9jYWxlcy4gUHJvcHJpZXRhcnkgZXh0ZW5zaW9uLlxuICByZXR1cm4gTU9OVEhTX0FMVFt0aGlzLmRhdGEuZ2V0TW9udGgoKSsxXVxufVxuXG5wcm90by5GPSBmdW5jdGlvbigpIHtcbiAgLy8gTW9udGgsIHRleHR1YWwsIGxvbmcgZS5nLiAnSmFudWFyeSdcbiAgcmV0dXJuIGNhcGZpcnN0KE1PTlRIU1t0aGlzLmRhdGEuZ2V0TW9udGgoKV0pXG59XG5cbnByb3RvLkkgPSBmdW5jdGlvbigpIHtcbiAgLy8gJzEnIGlmIERheWxpZ2h0IFNhdmluZ3MgVGltZSwgJzAnIG90aGVyd2lzZS5cbiAgcmV0dXJuIHRoaXMuZGF0YS5pc0RTVCgpID8gJzEnIDogJzAnXG59XG5cbnByb3RvLmogPSBmdW5jdGlvbigpIHtcbiAgLy8gRGF5IG9mIHRoZSBtb250aCB3aXRob3V0IGxlYWRpbmcgemVyb3MgaS5lLiAnMScgdG8gJzMxJ1xuICByZXR1cm4gdGhpcy5kYXRhLmdldERhdGUoKVxufVxuXG5wcm90by5sID0gZnVuY3Rpb24oKSB7XG4gIC8vIERheSBvZiB0aGUgd2VlaywgdGV4dHVhbCwgbG9uZyBlLmcuICdGcmlkYXknXG4gIHJldHVybiBjYXBmaXJzdChXRUVLREFZU1t0aGlzLmRhdGEuZ2V0RGF5KCldKVxufVxuXG5wcm90by5MID0gZnVuY3Rpb24oKSB7XG4gIC8vIEJvb2xlYW4gZm9yIHdoZXRoZXIgaXQgaXMgYSBsZWFwIHllYXIgaS5lLiBUcnVlIG9yIEZhbHNlXG4gIC8vIFNlbGVjdHMgdGhpcyB5ZWFyJ3MgRmVicnVhcnkgMjl0aCBhbmQgY2hlY2tzIGlmIHRoZSBtb250aFxuICAvLyBpcyBzdGlsbCBGZWJydWFyeS5cbiAgcmV0dXJuIChuZXcgRGF0ZSh0aGlzLmRhdGEuZ2V0RnVsbFllYXIoKSwgMSwgMjkpLmdldE1vbnRoKCkpID09PSAxXG59XG5cbnByb3RvLm0gPSBmdW5jdGlvbigpIHtcbiAgLy8gTW9udGggaS5lLiAnMDEnIHRvICcxMidcIlxuICByZXR1cm4gKCcwJysodGhpcy5kYXRhLmdldE1vbnRoKCkrMSkpLnNsaWNlKC0yKVxufVxuXG5wcm90by5NID0gZnVuY3Rpb24oKSB7XG4gIC8vIE1vbnRoLCB0ZXh0dWFsLCAzIGxldHRlcnMgZS5nLiAnSmFuJ1xuICByZXR1cm4gY2FwZmlyc3QoTU9OVEhTXzNbdGhpcy5kYXRhLmdldE1vbnRoKCldKVxufVxuXG5wcm90by5uID0gZnVuY3Rpb24oKSB7XG4gIC8vIE1vbnRoIHdpdGhvdXQgbGVhZGluZyB6ZXJvcyBpLmUuICcxJyB0byAnMTInXG4gIHJldHVybiB0aGlzLmRhdGEuZ2V0TW9udGgoKSArIDFcbn1cblxucHJvdG8uTiA9IGZ1bmN0aW9uKCkge1xuICAvLyBNb250aCBhYmJyZXZpYXRpb24gaW4gQXNzb2NpYXRlZCBQcmVzcyBzdHlsZS4gUHJvcHJpZXRhcnkgZXh0ZW5zaW9uLlxuICByZXR1cm4gTU9OVEhTX0FQW3RoaXMuZGF0YS5nZXRNb250aCgpXVxufVxuXG5wcm90by5PID0gZnVuY3Rpb24oKSB7XG4gIC8vIERpZmZlcmVuY2UgdG8gR3JlZW53aWNoIHRpbWUgaW4gaG91cnMgZS5nLiAnKzAyMDAnXG5cbiAgdmFyIHR6b2ZmcyA9IHRoaXMuZGF0YS5nZXRUaW1lem9uZU9mZnNldCgpXG4gICAgLCBvZmZzID0gfn4odHpvZmZzIC8gNjApXG4gICAgLCBtaW5zID0gKCcwMCcgKyB+fk1hdGguYWJzKHR6b2ZmcyAlIDYwKSkuc2xpY2UoLTIpXG5cbiAgcmV0dXJuICgodHpvZmZzID4gMCkgPyAnLScgOiAnKycpICsgKCcwMCcgKyBNYXRoLmFicyhvZmZzKSkuc2xpY2UoLTIpICsgbWluc1xufVxuXG5wcm90by5yID0gZnVuY3Rpb24oKSB7XG4gIC8vIFJGQyAyODIyIGZvcm1hdHRlZCBkYXRlIGUuZy4gJ1RodSwgMjEgRGVjIDIwMDAgMTY6MDE6MDcgKzAyMDAnXG4gIHJldHVybiB0aGlzLmZvcm1hdCgnRCwgaiBNIFkgSDppOnMgTycpXG59XG5cbnByb3RvLlMgPSBmdW5jdGlvbigpIHtcbiAgLyogRW5nbGlzaCBvcmRpbmFsIHN1ZmZpeCBmb3IgdGhlIGRheSBvZiB0aGUgbW9udGgsIDIgY2hhcmFjdGVycyBpLmUuICdzdCcsICduZCcsICdyZCcgb3IgJ3RoJyAqL1xuICB2YXIgZCA9IHRoaXMuZGF0YS5nZXREYXRlKClcblxuICBpZiAoZCA+PSAxMSAmJiBkIDw9IDEzKVxuICAgIHJldHVybiAndGgnXG4gIHZhciBsYXN0ID0gZCAlIDEwXG5cbiAgaWYgKGxhc3QgPT0gMSlcbiAgICByZXR1cm4gJ3N0J1xuICBpZiAobGFzdCA9PSAyKVxuICAgIHJldHVybiAnbmQnXG4gIGlmIChsYXN0ID09IDMpXG4gICAgcmV0dXJuICdyZCdcbiAgcmV0dXJuICd0aCdcbn1cblxucHJvdG8udCA9IGZ1bmN0aW9uKCkge1xuICAvLyBOdW1iZXIgb2YgZGF5cyBpbiB0aGUgZ2l2ZW4gbW9udGggaS5lLiAnMjgnIHRvICczMSdcbiAgLy8gVXNlIGEgamF2YXNjcmlwdCB0cmljayB0byBkZXRlcm1pbmUgdGhlIGRheXMgaW4gYSBtb250aFxuICByZXR1cm4gMzIgLSBuZXcgRGF0ZSh0aGlzLmRhdGEuZ2V0RnVsbFllYXIoKSwgdGhpcy5kYXRhLmdldE1vbnRoKCksIDMyKS5nZXREYXRlKClcbn1cblxucHJvdG8uVCA9IGZ1bmN0aW9uKCkge1xuICAvLyBUaW1lIHpvbmUgb2YgdGhpcyBtYWNoaW5lIGUuZy4gJ0VTVCcgb3IgJ01EVCdcbiAgaWYodGhpcy5kYXRhLnR6aW5mbykge1xuICAgIHJldHVybiB0aGlzLmRhdGEudHppbmZvKCkuYWJiciB8fCAnPz8/J1xuICB9XG4gIHJldHVybiAnPz8/J1xufVxuXG5wcm90by5VID0gZnVuY3Rpb24oKSB7XG4gIC8vIFNlY29uZHMgc2luY2UgdGhlIFVuaXggZXBvY2ggKEphbnVhcnkgMSAxOTcwIDAwOjAwOjAwIEdNVClcbiAgLy8gVVRDKCkgcmV0dXJuIG1pbGxpc2Vjb25kcyBmcm1vIHRoZSBlcG9jaFxuICAvLyByZXR1cm4gTWF0aC5yb3VuZCh0aGlzLmRhdGEuVVRDKCkgKiAxMDAwKVxuICByZXR1cm4gfn4odGhpcy5kYXRhIC8gMTAwMClcbn1cblxucHJvdG8udyA9IGZ1bmN0aW9uKCkge1xuICAvLyBEYXkgb2YgdGhlIHdlZWssIG51bWVyaWMsIGkuZS4gJzAnIChTdW5kYXkpIHRvICc2JyAoU2F0dXJkYXkpXG4gIHJldHVybiB0aGlzLmRhdGEuZ2V0RGF5KClcbn1cblxucHJvdG8uVyA9IGZ1bmN0aW9uKCkge1xuICAvLyBJU08tODYwMSB3ZWVrIG51bWJlciBvZiB5ZWFyLCB3ZWVrcyBzdGFydGluZyBvbiBNb25kYXlcbiAgLy8gQWxnb3JpdGhtIGZyb20gaHR0cDovL3d3dy5wZXJzb25hbC5lY3UuZWR1L21jY2FydHlyL0lTT3dkQUxHLnR4dFxuICB2YXIgamFuMV93ZWVrZGF5ID0gbmV3IERhdGUodGhpcy5kYXRhLmdldEZ1bGxZZWFyKCksIDAsIDEpLmdldERheSgpXG4gICAgLCB3ZWVrZGF5ID0gdGhpcy5kYXRhLmdldERheSgpXG4gICAgLCBkYXlfb2ZfeWVhciA9IHRoaXMueigpXG4gICAgLCB3ZWVrX251bWJlclxuICAgICwgaSA9IDM2NVxuXG4gIGlmKGRheV9vZl95ZWFyIDw9ICg4IC0gamFuMV93ZWVrZGF5KSAmJiBqYW4xX3dlZWtkYXkgPiA0KSB7XG4gICAgaWYoamFuMV93ZWVrZGF5ID09PSA1IHx8IChqYW4xX3dlZWtkYXkgPT09IDYgJiYgdGhpcy5MLmNhbGwoe2RhdGE6bmV3IERhdGUodGhpcy5kYXRhLmdldEZ1bGxZZWFyKCktMSwgMCwgMSl9KSkpIHtcbiAgICAgIHdlZWtfbnVtYmVyID0gNTNcbiAgICB9IGVsc2Uge1xuICAgICAgd2Vla19udW1iZXIgPSA1MlxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZih0aGlzLkwoKSkge1xuICAgICAgaSA9IDM2NlxuICAgIH1cbiAgICBpZigoaSAtIGRheV9vZl95ZWFyKSA8ICg0IC0gd2Vla2RheSkpIHtcbiAgICAgIHdlZWtfbnVtYmVyID0gMVxuICAgIH0gZWxzZSB7XG4gICAgICB3ZWVrX251bWJlciA9IH5+KChkYXlfb2ZfeWVhciArICg3IC0gd2Vla2RheSkgKyAoamFuMV93ZWVrZGF5IC0gMSkpIC8gNylcbiAgICAgIGlmKGphbjFfd2Vla2RheSA+IDQpXG4gICAgICAgIHdlZWtfbnVtYmVyIC09IDFcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHdlZWtfbnVtYmVyXG59XG5cbnByb3RvLnkgPSBmdW5jdGlvbigpIHtcbiAgLy8gWWVhciwgMiBkaWdpdHMgZS5nLiAnOTknXG4gIHJldHVybiAoJycrdGhpcy5kYXRhLmdldEZ1bGxZZWFyKCkpLnNsaWNlKC0yKVxufVxuXG5wcm90by5ZID0gZnVuY3Rpb24oKSB7XG4gIC8vIFllYXIsIDQgZGlnaXRzIGUuZy4gJzE5OTknXG4gIHJldHVybiB0aGlzLmRhdGEuZ2V0RnVsbFllYXIoKVxufVxuXG5wcm90by56ID0gZnVuY3Rpb24oKSB7XG4gIC8vIERheSBvZiB0aGUgeWVhciBpLmUuICcwJyB0byAnMzY1J1xuXG4gIGRveSA9IHRoaXMueWVhcl9kYXlzW3RoaXMuZGF0YS5nZXRNb250aCgpXSArIHRoaXMuZGF0YS5nZXREYXRlKClcbiAgaWYgKHRoaXMuTCgpICYmIHRoaXMuZGF0YS5nZXRNb250aCgpID4gMSlcbiAgICBkb3kgKz0gMVxuICByZXR1cm4gZG95XG59XG5cbnByb3RvLlogPSBmdW5jdGlvbigpIHtcbiAgLypcbiAgVGltZSB6b25lIG9mZnNldCBpbiBzZWNvbmRzIChpLmUuICctNDMyMDAnIHRvICc0MzIwMCcpLiBUaGUgb2Zmc2V0IGZvclxuICB0aW1lem9uZXMgd2VzdCBvZiBVVEMgaXMgYWx3YXlzIG5lZ2F0aXZlLCBhbmQgZm9yIHRob3NlIGVhc3Qgb2YgVVRDIGlzXG4gIGFsd2F5cyBwb3NpdGl2ZS5cbiAgKi9cbiAgcmV0dXJuIHRoaXMuZGF0YS5nZXRUaW1lem9uZU9mZnNldCgpICogLTYwXG59XG5cblxuZnVuY3Rpb24gZm9ybWF0KHZhbHVlLCBmb3JtYXRfc3RyaW5nKSB7XG4gIHZhciBkZiA9IG5ldyBEYXRlRm9ybWF0KHZhbHVlKVxuICByZXR1cm4gZGYuZm9ybWF0KGZvcm1hdF9zdHJpbmcpXG59XG5cblxuZnVuY3Rpb24gdGltZV9mb3JtYXQodmFsdWUsIGZvcm1hdF9zdHJpbmcpIHtcbiAgdmFyIHRmID0gbmV3IFRpbWVGb3JtYXQodmFsdWUpXG4gIHJldHVybiB0Zi5mb3JtYXQoZm9ybWF0X3N0cmluZylcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGxvZzogZnVuY3Rpb24odmFsdWUpIHsgY29uc29sZS5sb2codmFsdWUpIH1cbiAgLCBlcnJvcjogZnVuY3Rpb24oZXJyKSB7IGNvbnNvbGUuZXJyb3IoZXJyLCBlcnIgJiYgZXJyLnN0YWNrKSB9XG4gICwgaW5mbzogZnVuY3Rpb24odmFsdWUpIHsgfVxufVxuIiwidmFyIExpYnJhcnkgPSByZXF1aXJlKCcuL2xpYnJhcnknKVxuXG5tb2R1bGUuZXhwb3J0cyA9IERlZmF1bHRGaWx0ZXJzXG5cbmZ1bmN0aW9uIERlZmF1bHRGaWx0ZXJzKCkge1xuICBMaWJyYXJ5LmNhbGwodGhpcywgdGhpcy5idWlsdGlucylcbn1cblxudmFyIGNvbnMgPSBEZWZhdWx0RmlsdGVyc1xuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGUgPSBuZXcgTGlicmFyeVxuXG5wcm90by5jb25zdHJ1Y3RvciA9IGNvbnNcblxucHJvdG8uYnVpbHRpbnMgPSB7XG4gICAgJ2FkZCc6IHJlcXVpcmUoJy4vZmlsdGVycy9hZGQnKVxuICAsICdhZGRzbGFzaGVzJzogcmVxdWlyZSgnLi9maWx0ZXJzL2FkZHNsYXNoZXMnKVxuICAsICdjYXBmaXJzdCc6IHJlcXVpcmUoJy4vZmlsdGVycy9jYXBmaXJzdCcpXG4gICwgJ2NlbnRlcic6IHJlcXVpcmUoJy4vZmlsdGVycy9jZW50ZXInKVxuICAsICdjdXQnOiByZXF1aXJlKCcuL2ZpbHRlcnMvY3V0JylcbiAgLCAnZGF0ZSc6IHJlcXVpcmUoJy4vZmlsdGVycy9kYXRlJylcbiAgLCAnZGVmYXVsdCc6IHJlcXVpcmUoJy4vZmlsdGVycy9kZWZhdWx0JylcbiAgLCAnZGljdHNvcnQnOiByZXF1aXJlKCcuL2ZpbHRlcnMvZGljdHNvcnQnKVxuICAsICdkaWN0c29ydHJldmVyc2VkJzogcmVxdWlyZSgnLi9maWx0ZXJzL2RpY3Rzb3J0cmV2ZXJzZWQnKVxuICAsICdkaXZpc2libGVieSc6IHJlcXVpcmUoJy4vZmlsdGVycy9kaXZpc2libGVieScpXG4gICwgJ2VzY2FwZSc6IHJlcXVpcmUoJy4vZmlsdGVycy9lc2NhcGUnKVxuICAsICdmaWxlc2l6ZWZvcm1hdCc6IHJlcXVpcmUoJy4vZmlsdGVycy9maWxlc2l6ZWZvcm1hdCcpXG4gICwgJ2ZpcnN0JzogcmVxdWlyZSgnLi9maWx0ZXJzL2ZpcnN0JylcbiAgLCAnZmxvYXRmb3JtYXQnOiByZXF1aXJlKCcuL2ZpbHRlcnMvZmxvYXRmb3JtYXQnKVxuICAsICdmb3JjZV9lc2NhcGUnOiByZXF1aXJlKCcuL2ZpbHRlcnMvZm9yY2VfZXNjYXBlJylcbiAgLCAnZ2V0X2RpZ2l0JzogcmVxdWlyZSgnLi9maWx0ZXJzL2dldF9kaWdpdCcpXG4gICwgJ2luZGV4JzogcmVxdWlyZSgnLi9maWx0ZXJzL2luZGV4JylcbiAgLCAnaXRlcml0ZW1zJzogcmVxdWlyZSgnLi9maWx0ZXJzL2l0ZXJpdGVtcycpXG4gICwgJ2lyaWVuY29kZSc6IHJlcXVpcmUoJy4vZmlsdGVycy9pcmllbmNvZGUnKVxuICAsICdqb2luJzogcmVxdWlyZSgnLi9maWx0ZXJzL2pvaW4nKVxuICAsICdsYXN0JzogcmVxdWlyZSgnLi9maWx0ZXJzL2xhc3QnKVxuICAsICdsZW5ndGgnOiByZXF1aXJlKCcuL2ZpbHRlcnMvbGVuZ3RoJylcbiAgLCAnbGVuZ3RoX2lzJzogcmVxdWlyZSgnLi9maWx0ZXJzL2xlbmd0aF9pcycpXG4gICwgJ2xpbmVicmVha3MnOiByZXF1aXJlKCcuL2ZpbHRlcnMvbGluZWJyZWFrcycpXG4gICwgJ2xpbmVicmVha3Nicic6IHJlcXVpcmUoJy4vZmlsdGVycy9saW5lYnJlYWtzYnInKVxuICAsICdsaW5lbnVtYmVycyc6IHJlcXVpcmUoJy4vZmlsdGVycy9saW5lbnVtYmVycycpXG4gICwgJ2xqdXN0JzogcmVxdWlyZSgnLi9maWx0ZXJzL2xqdXN0JylcbiAgLCAnbG93ZXInOiByZXF1aXJlKCcuL2ZpbHRlcnMvbG93ZXInKVxuICAsICdtYWtlX2xpc3QnOiByZXF1aXJlKCcuL2ZpbHRlcnMvbWFrZV9saXN0JylcbiAgLCAncGhvbmUybnVtZXJpYyc6IHJlcXVpcmUoJy4vZmlsdGVycy9waG9uZTJudW1lcmljJylcbiAgLCAncGx1cmFsaXplJzogcmVxdWlyZSgnLi9maWx0ZXJzL3BsdXJhbGl6ZScpXG4gICwgJ3JhbmRvbSc6IHJlcXVpcmUoJy4vZmlsdGVycy9yYW5kb20nKVxuICAsICdyanVzdCc6IHJlcXVpcmUoJy4vZmlsdGVycy9yanVzdCcpXG4gICwgJ3NhZmUnOiByZXF1aXJlKCcuL2ZpbHRlcnMvc2FmZScpXG4gICwgJ3NsaWNlJzogcmVxdWlyZSgnLi9maWx0ZXJzL3NsaWNlJylcbiAgLCAnc2x1Z2lmeSc6IHJlcXVpcmUoJy4vZmlsdGVycy9zbHVnaWZ5JylcbiAgLCAnc3BsaXQnOiByZXF1aXJlKCcuL2ZpbHRlcnMvc3BsaXQnKVxuICAsICdzdHJpcHRhZ3MnOiByZXF1aXJlKCcuL2ZpbHRlcnMvc3RyaXB0YWdzJylcbiAgLCAndGltZXNpbmNlJzogcmVxdWlyZSgnLi9maWx0ZXJzL3RpbWVzaW5jZScpXG4gICwgJ3RpbWV1bnRpbCc6IHJlcXVpcmUoJy4vZmlsdGVycy90aW1ldW50aWwnKVxuICAsICd0aXRsZSc6IHJlcXVpcmUoJy4vZmlsdGVycy90aXRsZScpXG4gICwgJ3RydW5jYXRlY2hhcnMnOiByZXF1aXJlKCcuL2ZpbHRlcnMvdHJ1bmNhdGVjaGFycycpXG4gICwgJ3RydW5jYXRld29yZHMnOiByZXF1aXJlKCcuL2ZpbHRlcnMvdHJ1bmNhdGV3b3JkcycpXG4gICwgJ3Vub3JkZXJlZF9saXN0JzogcmVxdWlyZSgnLi9maWx0ZXJzL3Vub3JkZXJlZF9saXN0JylcbiAgLCAndXBwZXInOiByZXF1aXJlKCcuL2ZpbHRlcnMvdXBwZXInKVxuICAsICd1cmxlbmNvZGUnOiByZXF1aXJlKCcuL2ZpbHRlcnMvdXJsZW5jb2RlJylcbiAgLCAndXJsaXplJzogcmVxdWlyZSgnLi9maWx0ZXJzL3VybGl6ZScpXG4gICwgJ3VybGl6ZXRydW5jJzogcmVxdWlyZSgnLi9maWx0ZXJzL3VybGl6ZXRydW5jJylcbiAgLCAnd29yZGNvdW50JzogcmVxdWlyZSgnLi9maWx0ZXJzL3dvcmRjb3VudCcpXG4gICwgJ3dvcmR3cmFwJzogcmVxdWlyZSgnLi9maWx0ZXJzL3dvcmR3cmFwJylcbiAgLCAneWVzbm8nOiByZXF1aXJlKCcuL2ZpbHRlcnMveWVzbm8nKVxufVxuXG4iLCJ2YXIgTGlicmFyeSA9IHJlcXVpcmUoJy4vbGlicmFyeScpXG5cbm1vZHVsZS5leHBvcnRzID0gRGVmYXVsdFRhZ3NcblxuZnVuY3Rpb24gRGVmYXVsdFRhZ3MoKSB7XG4gIExpYnJhcnkuY2FsbCh0aGlzLCB0aGlzLmJ1aWx0aW5zKVxufVxuXG52YXIgY29ucyA9IERlZmF1bHRUYWdzXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZSA9IG5ldyBMaWJyYXJ5XG5cbnByb3RvLmNvbnN0cnVjdG9yID0gY29uc1xuXG5wcm90by5idWlsdGlucyA9IHtcbiAgICAnYmxvY2snOiByZXF1aXJlKCcuL3RhZ3MvYmxvY2snKS5wYXJzZVxuICAsICdjb21tZW50JzogcmVxdWlyZSgnLi90YWdzL2NvbW1lbnQnKS5wYXJzZVxuICAsICdkZWJ1Zyc6IHJlcXVpcmUoJy4vdGFncy9kZWJ1ZycpLnBhcnNlXG4gICwgJ2V4dGVuZHMnOiByZXF1aXJlKCcuL3RhZ3MvZXh0ZW5kcycpLnBhcnNlXG4gICwgJ2Zvcic6IHJlcXVpcmUoJy4vdGFncy9mb3InKS5wYXJzZVxuICAsICdpZic6IHJlcXVpcmUoJy4vdGFncy9pZi9ub2RlJykucGFyc2VcbiAgLCAnaW5jbHVkZSc6IHJlcXVpcmUoJy4vdGFncy9pbmNsdWRlJykucGFyc2VcbiAgLCAnbm93JzogcmVxdWlyZSgnLi90YWdzL25vdycpLnBhcnNlXG4gICwgJ3dpdGgnOiByZXF1aXJlKCcuL3RhZ3Mvd2l0aCcpLnBhcnNlXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IEZpbHRlckFwcGxpY2F0aW9uXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi9wcm9taXNlJylcblxuZnVuY3Rpb24gRmlsdGVyQXBwbGljYXRpb24obmFtZSwgYml0cykge1xuICB0aGlzLm5hbWUgPSBuYW1lXG4gIHRoaXMuYXJncyA9IGJpdHNcbiAgdGhpcy5maWx0ZXIgPSBudWxsXG59XG5cbnZhciBjb25zID0gRmlsdGVyQXBwbGljYXRpb25cbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLmF0dGFjaCA9IGZ1bmN0aW9uKHBhcnNlcikge1xuICB0aGlzLmZpbHRlciA9IHBhcnNlci5maWx0ZXJzLmxvb2t1cCh0aGlzLm5hbWUpXG59XG5cbnByb3RvLnJlc29sdmUgPSBmdW5jdGlvbihjb250ZXh0LCB2YWx1ZSwgZnJvbUlEWCwgYXJnVmFsdWVzKSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICAgICwgcHJvbWlzZVxuICAgICwgc3RhcnQgPSBmcm9tSURYIHx8IDBcbiAgICAsIHJlc3VsdFxuICAgICwgdG1wXG5cbiAgYXJnVmFsdWVzID0gYXJnVmFsdWVzIHx8IFtdXG5cbiAgaWYodmFsdWUgJiYgdmFsdWUuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcbiAgICBwcm9taXNlID0gbmV3IFByb21pc2VcbiAgICB2YWx1ZS5vbmNlKCdkb25lJywgZnVuY3Rpb24odmFsKSB7XG4gICAgICBwcm9taXNlLnJlc29sdmUoc2VsZi5yZXNvbHZlKGNvbnRleHQsIHZhbCkpXG4gICAgfSlcblxuICAgIC8vIHN0YXJ0IG92ZXIgb25jZSB3ZSd2ZSByZXNvbHZlZCB0aGUgYmFzZSB2YWx1ZVxuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxuICBmb3IodmFyIGkgPSBzdGFydCwgbGVuID0gc2VsZi5hcmdzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgdmFyIGFyZ1ZhbHVlID0gc2VsZi5hcmdzW2ldLnJlc29sdmUgP1xuICAgICAgICBzZWxmLmFyZ3NbaV0ucmVzb2x2ZShjb250ZXh0KSA6XG4gICAgICAgIHNlbGYuYXJnc1tpXVxuXG4gICAgaWYoYXJnVmFsdWUgPT09IHVuZGVmaW5lZCB8fCBhcmdWYWx1ZSA9PT0gbnVsbCkge1xuICAgICAgYXJnVmFsdWVzW2ldID0gYXJnVmFsdWVcbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuXG4gICAgaWYoYXJnVmFsdWUuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcbiAgICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuXG4gICAgICBhcmdWYWx1ZS5vbmNlKCdkb25lJywgZnVuY3Rpb24odmFsKSB7XG4gICAgICAgIGFyZ1ZhbHVlc1tpXSA9IHZhbFxuICAgICAgICBwcm9taXNlLnJlc29sdmUoc2VsZi5yZXNvbHZlKFxuICAgICAgICAgICAgY29udGV4dFxuICAgICAgICAgICwgdmFsdWVcbiAgICAgICAgICAsIGlcbiAgICAgICAgICAsIGFyZ1ZhbHVlc1xuICAgICAgICApKVxuICAgICAgfSlcblxuICAgICAgcmV0dXJuIHByb21pc2VcbiAgICB9XG5cbiAgICBhcmdWYWx1ZXNbaV0gPSBhcmdWYWx1ZVxuICB9XG5cbiAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG4gIHRtcCA9IHNlbGYuZmlsdGVyLmFwcGx5KG51bGwsIFt2YWx1ZV0uY29uY2F0KGFyZ1ZhbHVlcykuY29uY2F0KFtyZWFkeV0pKVxuXG4gIGlmKHRtcCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgcmVzdWx0ID0gdG1wXG4gIH1cblxuICBpZihyZXN1bHQgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxuICByZXR1cm4gcmVzdWx0XG5cbiAgZnVuY3Rpb24gcmVhZHkoZXJyLCBkYXRhKSB7XG4gICAgaWYocHJvbWlzZS50cmlnZ2VyKVxuICAgICAgcmV0dXJuIHByb21pc2UucmVzb2x2ZShlcnIgPyBlcnIgOiBkYXRhKVxuXG4gICAgcmVzdWx0ID0gZGF0YVxuICB9XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IEZpbHRlckNoYWluXG5cbmZ1bmN0aW9uIEZpbHRlckNoYWluKGJpdHMpIHtcbiAgdGhpcy5iaXRzID0gYml0c1xufVxuXG52YXIgY29ucyA9IEZpbHRlckNoYWluXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by5hdHRhY2ggPSBmdW5jdGlvbihwYXJzZXIpIHtcbiAgZm9yKHZhciBpID0gMCwgbGVuID0gdGhpcy5iaXRzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYodGhpcy5iaXRzW2ldICYmIHRoaXMuYml0c1tpXS5hdHRhY2gpIHtcbiAgICAgIHRoaXMuYml0c1tpXS5hdHRhY2gocGFyc2VyKVxuICAgIH1cbiAgfVxufVxuXG5wcm90by5yZXNvbHZlID0gZnVuY3Rpb24oY29udGV4dCkge1xuICB2YXIgcmVzdWx0ID0gdGhpcy5iaXRzWzBdLnJlc29sdmUgP1xuICAgICAgdGhpcy5iaXRzWzBdLnJlc29sdmUoY29udGV4dCkgOlxuICAgICAgdGhpcy5iaXRzWzBdXG5cbiAgZm9yKHZhciBpID0gMSwgbGVuID0gdGhpcy5iaXRzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgcmVzdWx0ID0gdGhpcy5iaXRzW2ldLnJlc29sdmUoY29udGV4dCwgcmVzdWx0KVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdFxufVxuXG4iLCJtb2R1bGUuZXhwb3J0cyA9IEZpbHRlckxvb2t1cFxuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJy4vcHJvbWlzZScpXG5cbmZ1bmN0aW9uIEZpbHRlckxvb2t1cChiaXRzKSB7XG4gIHRoaXMuYml0cyA9IGJpdHNcbn1cblxudmFyIGNvbnMgPSBGaWx0ZXJMb29rdXBcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLnJlc29sdmUgPSBmdW5jdGlvbihjb250ZXh0LCBmcm9tSURYKSB7XG4gIGZyb21JRFggPSBmcm9tSURYIHx8IDBcblxuICB2YXIgc2VsZiA9IHRoaXNcbiAgICAsIGJpdHMgPSBzZWxmLmJpdHNcbiAgICAsIGN1cnJlbnQgPSBjb250ZXh0XG4gICAgLCB0ZW1wb3JhcnkgPSBudWxsXG4gICAgLCBwcm9taXNlXG4gICAgLCByZXN1bHRcbiAgICAsIG5leHRcblxuICBmb3IodmFyIGkgPSBmcm9tSURYLCBsZW4gPSBiaXRzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYoY3VycmVudCA9PT0gdW5kZWZpbmVkIHx8IGN1cnJlbnQgPT09IG51bGwpIHtcbiAgICAgIGJyZWFrXG4gICAgfVxuXG4gICAgLy8gZml4IGZvciBJRTpcbiAgICBpZihiaXRzW2ldID09PSAnc3VwZXInKSB7XG4gICAgICBiaXRzW2ldID0gJ19zdXBlcidcbiAgICB9XG5cbiAgICBuZXh0ID0gY3VycmVudFtiaXRzW2ldXVxuXG4gICAgLy8gY291bGQgYmUgYXN5bmMsIGNvdWxkIGJlIHN5bmMuXG4gICAgaWYodHlwZW9mIG5leHQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuXG4gICAgICBwcm9taXNlLm9uY2UoJ2RvbmUnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHRlbXBvcmFyeSA9IGRhdGFcbiAgICAgIH0pXG5cbiAgICAgIGN1cnJlbnQgPSBuZXh0LmNhbGwoY3VycmVudCwgZnVuY3Rpb24oZXJyLCBkYXRhKSB7XG4gICAgICAgIHByb21pc2UucmVzb2x2ZShlcnIgPyBudWxsIDogc2VsZi5yZXNvbHZlKGRhdGEsIGkrMSkpXG4gICAgICB9KVxuXG4gICAgICBpZih0ZW1wb3JhcnkgIT09IG51bGwpXG4gICAgICAgIGN1cnJlbnQgPSB0ZW1wb3JhcnlcblxuICAgICAgcHJvbWlzZS50cmlnZ2VyID0gdGVtcG9yYXJ5ID0gbnVsbFxuXG4gICAgICBpZihjdXJyZW50ID09PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiBwcm9taXNlXG5cbiAgICB9IGVsc2Uge1xuICAgICAgY3VycmVudCA9IG5leHRcbiAgICB9XG5cbiAgfVxuXG4gIHJldHVybiBjdXJyZW50XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IEZpbHRlck5vZGVcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCcuL3Byb21pc2UnKVxuICAsIGRlYnVnID0gcmVxdWlyZSgnLi9kZWJ1ZycpXG5cbmZ1bmN0aW9uIEZpbHRlck5vZGUoZmlsdGVyKSB7XG4gIHRoaXMuZmlsdGVyID0gZmlsdGVyXG59XG5cbnZhciBjb25zID0gRmlsdGVyTm9kZVxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxuY29ucy5lc2NhcGUgPSBlc2NhcGVIVE1MXG5cbnByb3RvLnJlbmRlciA9IHNhZmVseShmdW5jdGlvbihjb250ZXh0KSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICAgICwgcmVzdWx0ID0gc2VsZi5maWx0ZXIucmVzb2x2ZShjb250ZXh0KVxuICAgICwgcHJvbWlzZVxuXG4gIGlmKHJlc3VsdCA9PT0gdW5kZWZpbmVkKVxuICAgIHJldHVybiAnJ1xuXG4gIGlmKHJlc3VsdCAmJiByZXN1bHQuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcbiAgICBwcm9taXNlID0gbmV3IFByb21pc2VcblxuICAgIHJlc3VsdC5vbmNlKCdkb25lJywgZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICBwcm9taXNlLnJlc29sdmUoc2VsZi5mb3JtYXQocmVzdWx0KSlcbiAgICB9KVxuXG4gICAgcmV0dXJuIHByb21pc2VcbiAgfVxuXG4gIHJldHVybiBzZWxmLmZvcm1hdChyZXN1bHQpXG59KVxuXG5wcm90by5mb3JtYXQgPSBmdW5jdGlvbihyZXN1bHQpIHtcbiAgaWYocmVzdWx0ICYmIHJlc3VsdC5zYWZlKSB7XG4gICAgcmV0dXJuIHJlc3VsdC50b1N0cmluZygpXG4gIH1cblxuICBpZihyZXN1bHQgPT09IG51bGwgfHwgcmVzdWx0ID09PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuICcnXG5cbiAgcmV0dXJuIGVzY2FwZUhUTUwocmVzdWx0KycnKVxufVxuXG5mdW5jdGlvbiBzYWZlbHkoZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGZuLmNhbGwodGhpcywgY29udGV4dClcbiAgICB9IGNhdGNoKGVycikge1xuICAgICAgZGVidWcuaW5mbyhlcnIpXG4gICAgICByZXR1cm4gJydcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZXNjYXBlSFRNTChzdHIpIHtcbiAgcmV0dXJuIHN0clxuICAgIC5yZXBsYWNlKC9cXCYvZywgJyZhbXA7JylcbiAgICAucmVwbGFjZSgvPC9nLCAnJmx0OycpXG4gICAgLnJlcGxhY2UoLz4vZywgJyZndDsnKVxuICAgIC5yZXBsYWNlKC9cIi9nLCAnJnF1b3Q7JylcbiAgICAucmVwbGFjZSgvJy9nLCAnJiMzOTsnKVxufVxuIiwidmFyIFRva2VuID0gcmVxdWlyZSgnLi90b2tlbicpXG4gICwgRmlsdGVyTm9kZSA9IHJlcXVpcmUoJy4vZmlsdGVyX25vZGUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IEZpbHRlclRva2VuXG5cbmZ1bmN0aW9uIEZpbHRlclRva2VuKGNvbnRlbnQsIGxpbmUpIHtcbiAgVG9rZW4uY2FsbCh0aGlzLCBjb250ZW50LCBsaW5lKVxufVxuXG52YXIgY29ucyA9IEZpbHRlclRva2VuXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZSA9IG5ldyBUb2tlblxuXG5wcm90by5jb25zdHJ1Y3RvciA9IGNvbnNcblxucHJvdG8ubm9kZSA9IGZ1bmN0aW9uKHBhcnNlcikge1xuICByZXR1cm4gbmV3IEZpbHRlck5vZGUocGFyc2VyLmNvbXBpbGUodGhpcy5jb250ZW50KSlcbn1cblxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgdmFsdWUpIHtcbiAgaW5wdXQgPSBwYXJzZUludChpbnB1dCwgMTApO1xuICB2YWx1ZSA9IHBhcnNlSW50KHZhbHVlLCAxMClcbiAgaWYoaXNOYU4oaW5wdXQpIHx8IGlzTmFOKHZhbHVlKSkge1xuICAgIHJldHVybiAnJ1xuICB9XG4gIHJldHVybiBpbnB1dCArIHZhbHVlXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIGlmKGlucHV0ID09PSB1bmRlZmluZWQgfHwgaW5wdXQgPT09IG51bGwpIHtcbiAgICBpbnB1dCA9ICcnXG4gIH1cbiAgcmV0dXJuIGlucHV0LnRvU3RyaW5nKCkucmVwbGFjZSgvJy9nLCBcIlxcXFwnXCIpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHZhciBzdHIgPSBpbnB1dC50b1N0cmluZygpO1xuICByZXR1cm4gW3N0ci5zbGljZSgwLDEpLnRvVXBwZXJDYXNlKCksIHN0ci5zbGljZSgxKV0uam9pbignJylcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIGxlbiwgcmVhZHkpIHtcbiAgaWYoaW5wdXQgPT09IHVuZGVmaW5lZCB8fCBpbnB1dCA9PT0gbnVsbCkge1xuICAgIGlucHV0ID0gJydcbiAgfVxuXG4gIGlmKHJlYWR5ID09PSB1bmRlZmluZWQpIHtcbiAgICBsZW4gPSAwXG4gIH1cblxuICB2YXIgc3RyID0gaW5wdXQudG9TdHJpbmcoKVxuICAgICwgdmFsdWUgPSAnICdcblxuICBsZW4gLT0gc3RyLmxlbmd0aFxuICBpZihsZW4gPCAwKSB7XG4gICAgcmV0dXJuIHN0clxuICB9XG5cbiAgdmFyIGxlbl9oYWxmID0gbGVuLzIuMFxuICAgICwgYXJyID0gW11cbiAgICAsIGlkeCA9IE1hdGguZmxvb3IobGVuX2hhbGYpXG5cbiAgd2hpbGUoaWR4LS0gPiAwKSB7XG4gICAgYXJyLnB1c2godmFsdWUpXG4gIH1cblxuICBhcnIgPSBhcnIuam9pbignJylcbiAgc3RyID0gYXJyICsgc3RyICsgYXJyXG4gIGlmKChsZW5faGFsZiAtIE1hdGguZmxvb3IobGVuX2hhbGYpKSA+IDApIHtcbiAgICBzdHIgPSBpbnB1dC50b1N0cmluZygpLmxlbmd0aCAlIDIgPT0gMCA/IHZhbHVlICsgc3RyIDogc3RyICsgdmFsdWVcbiAgfVxuXG4gIHJldHVybiBzdHJcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIHZhbHVlKSB7XG4gIHZhciBzdHIgPSBpbnB1dC50b1N0cmluZygpXG4gIHJldHVybiBzdHIucmVwbGFjZShuZXcgUmVnRXhwKHZhbHVlLCBcImdcIiksICcnKVxufVxuIiwidmFyIGZvcm1hdCA9IHJlcXVpcmUoJy4uL2RhdGUnKS5kYXRlXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIHZhbHVlLCByZWFkeSkge1xuICBpZihyZWFkeSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdmFsdWUgPSAnTiBqLCBZJ1xuICB9XG5cbiAgcmV0dXJuIGZvcm1hdChpbnB1dC5nZXRGdWxsWWVhciA/IGlucHV0IDogbmV3IERhdGUoaW5wdXQpLCB2YWx1ZSlcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIGRlZiwgcmVhZHkpIHtcbiAgcmV0dXJuIGlucHV0ID8gaW5wdXQgOiBkZWZcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIGtleSkge1xuICBpZihpbnB1dCA9PT0gdW5kZWZpbmVkIHx8IGlucHV0ID09PSBudWxsKSB7XG4gICAgaW5wdXQgPSBbXVxuICB9XG5cbiAgcmV0dXJuIGlucHV0LnNvcnQoZnVuY3Rpb24oeCwgeSkge1xuICAgIGlmKHhba2V5XSA+IHlba2V5XSkgcmV0dXJuIDFcbiAgICBpZih4W2tleV0gPT0geVtrZXldKSByZXR1cm4gMFxuICAgIGlmKHhba2V5XSA8IHlba2V5XSkgcmV0dXJuIC0xXG4gIH0pXG59XG4iLCJ2YXIgZGljdHNvcnQgPSByZXF1aXJlKCcuL2RpY3Rzb3J0Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIGtleSkge1xuICByZXR1cm4gZGljdHNvcnQoaW5wdXQsIGtleSkucmV2ZXJzZSgpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBudW0pIHtcbiAgaWYoaXNOYU4ocGFyc2VJbnQoaW5wdXQpKSkge1xuICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBpbnB1dCBmb3IgZGl2aXNpYmxlYnk6ICcgKyBTdHJpbmcoaW5wdXQpKVxuICB9XG5cbiAgcmV0dXJuIGlucHV0ICUgcGFyc2VJbnQobnVtLCAxMCkgPT0gMFxufVxuIiwidmFyIEZpbHRlck5vZGUgPSByZXF1aXJlKCcuLi9maWx0ZXJfbm9kZScpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgaWYoaW5wdXQgPT09IHVuZGVmaW5lZCkge1xuICAgIGlucHV0ID0gJydcbiAgfVxuXG4gIGlmKGlucHV0ICYmIGlucHV0LnNhZmUpIHtcbiAgICByZXR1cm4gaW5wdXRcbiAgfVxuXG4gIGlucHV0ID0gbmV3IFN0cmluZyhGaWx0ZXJOb2RlLmVzY2FwZShpbnB1dCkpXG4gIGlucHV0LnNhZmUgPSB0cnVlXG4gIHJldHVybiBpbnB1dFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICB2YXIgbnVtID0gKG5ldyBOdW1iZXIoaW5wdXQpKS52YWx1ZU9mKClcbiAgICAsIHNpbmd1bGFyID0gbnVtID09IDEgPyAnJyA6ICdzJ1xuICAgICwgdmFsdWVcblxuICBpZihpc05hTihudW0pKSB7XG4gICAgbnVtID0gMFxuICB9XG5cbiAgdmFsdWUgPVxuICAgIG51bSA8IDEwMjQgPyBudW0gKyAnIGJ5dGUnK3Npbmd1bGFyIDpcbiAgICBudW0gPCAoMTAyNCoxMDI0KSA/IChudW0vMTAyNCkrJyBLQicgOlxuICAgIG51bSA8ICgxMDI0KjEwMjQqMTAyNCkgPyAobnVtIC8gKDEwMjQqMTAyNCkpICsgJyBNQicgOlxuICAgIG51bSAvICgxMDI0KjEwMjQqMTAyNCkgKyAnIEdCJ1xuXG4gIHJldHVybiB2YWx1ZVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICByZXR1cm4gaW5wdXRbMF1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIHZhbCkge1xuICB2YWwgPSBwYXJzZUludCh2YWwsIDEwKVxuICB2YWwgPSBpc05hTih2YWwpID8gLTEgOiB2YWxcblxuICB2YXIgaXNQb3NpdGl2ZSA9IHZhbCA+PSAwXG4gICAgLCBhc051bWJlciA9IHBhcnNlRmxvYXQoaW5wdXQpXG4gICAgLCBhYnNWYWx1ZSA9IE1hdGguYWJzKHZhbClcbiAgICAsIHBvdyA9IE1hdGgucG93KDEwLCBhYnNWYWx1ZSlcbiAgICAsIHBvd19taW51c19vbmUgPSBNYXRoLnBvdygxMCwgTWF0aC5tYXgoYWJzVmFsdWUtMSwgMCkpXG4gICAgLCBhc1N0cmluZ1xuXG4gIGlmKGlzTmFOKGFzTnVtYmVyKSkge1xuICAgIHJldHVybiAnJ1xuICB9XG5cbiAgYXNOdW1iZXIgPSBNYXRoLnJvdW5kKChwb3cgKiBhc051bWJlcikgLyBwb3dfbWludXNfb25lKVxuXG4gIGlmKHZhbCAhPT0gMCkge1xuICAgIGFzTnVtYmVyIC89IDEwXG4gIH1cblxuICBhc1N0cmluZyA9IGFzTnVtYmVyLnRvU3RyaW5nKClcblxuICBpZihpc1Bvc2l0aXZlKSB7XG4gICAgdmFyIHNwbGl0ID0gYXNTdHJpbmcuc3BsaXQoJy4nKVxuICAgICAgLCBkZWNpbWFsID0gc3BsaXQubGVuZ3RoID4gMSA/IHNwbGl0WzFdIDogJydcblxuICAgIHdoaWxlKGRlY2ltYWwubGVuZ3RoIDwgdmFsKSB7XG4gICAgICBkZWNpbWFsICs9ICcwJ1xuICAgIH1cblxuICAgIGFzU3RyaW5nID0gZGVjaW1hbC5sZW5ndGggPyBbc3BsaXRbMF0sIGRlY2ltYWxdLmpvaW4oJy4nKSA6IHNwbGl0WzBdXG4gIH1cblxuICByZXR1cm4gYXNTdHJpbmdcbn1cbiIsInZhciBGaWx0ZXJOb2RlID0gcmVxdWlyZSgnLi4vZmlsdGVyX25vZGUnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIGlmKGlucHV0ID09PSB1bmRlZmluZWQpIHtcbiAgICBpbnB1dCA9ICcnXG4gIH1cblxuICB2YXIgeCA9IG5ldyBTdHJpbmcoRmlsdGVyTm9kZS5lc2NhcGUoaW5wdXQrJycpKVxuICB4LnNhZmUgPSB0cnVlXG4gIHJldHVybiB4XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBkaWdpdCkge1xuICB2YXIgaXNOdW0gPSAhaXNOYU4ocGFyc2VJbnQoaW5wdXQsIDEwKSlcbiAgICAsIHN0ciA9IGlucHV0LnRvU3RyaW5nKClcbiAgICAsIGxlbiA9IHN0ci5zcGxpdCgnJykubGVuZ3RoXG5cbiAgZGlnaXQgPSBwYXJzZUludChkaWdpdCwgMTApXG4gIGlmKGlzTnVtICYmICFpc05hTihkaWdpdCkgJiYgZGlnaXQgPD0gbGVuKSB7XG4gICAgcmV0dXJuIHN0ci5jaGFyQXQobGVuIC0gZGlnaXQpXG4gIH1cblxuICByZXR1cm4gaW5wdXRcbn1cbiIsbnVsbCwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICByZXR1cm4gaW5wdXRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIG91dHB1dCA9IFtdXG4gIGZvcih2YXIgbmFtZSBpbiBpbnB1dCkgaWYoaW5wdXQuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcbiAgICBvdXRwdXQucHVzaChbbmFtZSwgaW5wdXRbbmFtZV1dKVxuICB9XG4gIHJldHVybiBvdXRwdXRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIGdsdWUpIHtcbiAgaW5wdXQgPSBpbnB1dCBpbnN0YW5jZW9mIEFycmF5ID8gaW5wdXQgOiBpbnB1dC50b1N0cmluZygpLnNwbGl0KCcnKVxuICByZXR1cm4gaW5wdXQuam9pbihnbHVlKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICB2YXIgY2IgPSBpbnB1dC5jaGFyQXQgfHwgZnVuY3Rpb24oaW5kKSB7IHJldHVybiBpbnB1dFtpbmRdOyB9XG5cbiAgcmV0dXJuIGNiLmNhbGwoaW5wdXQsIGlucHV0Lmxlbmd0aC0xKTtcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIHJlYWR5KSB7XG4gIGlmKGlucHV0KSB7XG4gICAgaWYgKHR5cGVvZiBpbnB1dC5sZW5ndGggPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBpbnB1dC5sZW5ndGgocmVhZHkpXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBpbnB1dC5sZW5ndGhcbiAgICB9XG4gIH1cbiAgcmV0dXJuIDBcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIGV4cGVjdGVkLCByZWFkeSkge1xuICB2YXIgdG1wXG4gIGlmKGlucHV0KSB7XG4gICAgaWYgKHR5cGVvZiBpbnB1dC5sZW5ndGggPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHRtcCA9IGlucHV0Lmxlbmd0aChmdW5jdGlvbihlcnIsIGxlbikge1xuICAgICAgICByZWFkeShlcnIsIGVyciA/IG51bGwgOiBsZW4gPT09IGV4cGVjdGVkKVxuICAgICAgfSlcblxuICAgICAgcmV0dXJuIHRtcCA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogdG1wID09PSBleHBlY3RlZFxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gaW5wdXQubGVuZ3RoID09PSBleHBlY3RlZFxuICAgIH1cbiAgfVxuICByZXR1cm4gMCA9PT0gZXhwZWN0ZWRcbn1cbiIsInZhciBzYWZlID0gcmVxdWlyZSgnLi9zYWZlJylcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICBpZihpbnB1dCA9PT0gdW5kZWZpbmVkIHx8IGlucHV0ID09PSBudWxsKSB7XG4gICAgaW5wdXQgPSAnJ1xuICB9XG5cbiAgdmFyIHN0ciA9IGlucHV0LnRvU3RyaW5nKClcbiAgICAsIHBhcmFzID0gc3RyLnNwbGl0KCdcXG5cXG4nKVxuICAgICwgb3V0ID0gW11cblxuICB3aGlsZShwYXJhcy5sZW5ndGgpIHtcbiAgICBvdXQudW5zaGlmdChwYXJhcy5wb3AoKS5yZXBsYWNlKC9cXG4vZywgJzxiciAvPicpKVxuICB9XG5cbiAgcmV0dXJuIHNhZmUoJzxwPicrb3V0LmpvaW4oJzwvcD48cD4nKSsnPC9wPicpXG59XG4iLCJ2YXIgc2FmZSA9IHJlcXVpcmUoJy4vc2FmZScpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgaWYoaW5wdXQgPT09IHVuZGVmaW5lZCB8fCBpbnB1dCA9PT0gbnVsbCkge1xuICAgIGlucHV0ID0gJydcbiAgfVxuXG4gIHZhciBzdHIgPSBpbnB1dC50b1N0cmluZygpXG4gIHJldHVybiBzYWZlKHN0ci5yZXBsYWNlKC9cXG4vZywgJzxiciAvPicpKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICBpZihpbnB1dCA9PT0gdW5kZWZpbmVkIHx8IGlucHV0ID09PSBudWxsKSB7XG4gICAgaW5wdXQgPSAnJ1xuICB9XG5cbiAgdmFyIHN0ciA9IGlucHV0LnRvU3RyaW5nKClcbiAgICAsIGJpdHMgPSBzdHIuc3BsaXQoJ1xcbicpXG4gICAgLCBvdXQgPSBbXVxuICAgICwgbGVuID0gYml0cy5sZW5ndGhcblxuICB3aGlsZShiaXRzLmxlbmd0aCkge1xuICAgIG91dC51bnNoaWZ0KGxlbiAtIG91dC5sZW5ndGggKyAnLiAnICsgYml0cy5wb3AoKSlcbiAgfVxuXG4gIHJldHVybiBvdXQuam9pbignXFxuJylcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIG51bSkge1xuICB2YXIgYml0cyA9IChpbnB1dCA9PT0gbnVsbCB8fCBpbnB1dCA9PT0gdW5kZWZpbmVkID8gJycgOiBpbnB1dCkudG9TdHJpbmcoKS5zcGxpdCgnJylcbiAgICAsIGRpZmZlcmVuY2UgPSBudW0gLSBiaXRzLmxlbmd0aFxuXG4gIC8vIHB1c2ggcmV0dXJucyBuZXcgbGVuZ3RoIG9mIGFycmF5LlxuICB3aGlsZShkaWZmZXJlbmNlID4gMCkge1xuICAgIGRpZmZlcmVuY2UgPSBudW0gLSBiaXRzLnB1c2goJyAnKVxuICB9XG5cbiAgcmV0dXJuIGJpdHMuam9pbignJylcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgcmV0dXJuIGlucHV0LnRvU3RyaW5nKCkudG9Mb3dlckNhc2UoKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICBpZihpbnB1dCA9PT0gdW5kZWZpbmVkIHx8IGlucHV0ID09PSBudWxsKSB7XG4gICAgaW5wdXQgPSAnJ1xuICB9XG5cbiAgaW5wdXQgPSBpbnB1dCBpbnN0YW5jZW9mIEFycmF5ID8gaW5wdXQgOiBpbnB1dC50b1N0cmluZygpLnNwbGl0KCcnKVxuXG4gIHJldHVybiBpbnB1dFxufVxuIiwiXG52YXIgTEVUVEVSUyA9IHtcbidhJzogJzInLCAnYic6ICcyJywgJ2MnOiAnMicsICdkJzogJzMnLCAnZSc6ICczJyxcbidmJzogJzMnLCAnZyc6ICc0JywgJ2gnOiAnNCcsICdpJzogJzQnLCAnaic6ICc1JywgJ2snOiAnNScsICdsJzogJzUnLFxuJ20nOiAnNicsICduJzogJzYnLCAnbyc6ICc2JywgJ3AnOiAnNycsICdxJzogJzcnLCAncic6ICc3JywgJ3MnOiAnNycsXG4ndCc6ICc4JywgJ3UnOiAnOCcsICd2JzogJzgnLCAndyc6ICc5JywgJ3gnOiAnOScsICd5JzogJzknLCAneic6ICc5J1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICB2YXIgc3RyID0gaW5wdXQudG9TdHJpbmcoKS50b0xvd2VyQ2FzZSgpLnNwbGl0KCcnKVxuICAgICwgb3V0ID0gW11cbiAgICAsIGx0clxuXG4gIHdoaWxlKHN0ci5sZW5ndGgpIHtcbiAgICBsdHIgPSBzdHIucG9wKClcbiAgICBvdXQudW5zaGlmdChMRVRURVJTW2x0cl0gPyBMRVRURVJTW2x0cl0gOiBsdHIpXG4gIH1cblxuICByZXR1cm4gb3V0LmpvaW4oJycpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBwbHVyYWwpIHtcbiAgcGx1cmFsID0gKHR5cGVvZiBwbHVyYWwgPT09ICdzdHJpbmcnID8gcGx1cmFsIDogJ3MnKS5zcGxpdCgnLCcpXG5cbiAgdmFyIHZhbCA9IE51bWJlcihpbnB1dClcbiAgICAsIHN1ZmZpeFxuXG4gIGlmKGlzTmFOKHZhbCkpIHtcbiAgICB2YWwgPSAxXG4gIH1cblxuICBzdWZmaXggPSBwbHVyYWxbcGx1cmFsLmxlbmd0aC0xXTtcbiAgaWYodmFsID09PSAxKSB7XG4gICAgc3VmZml4ID0gcGx1cmFsLmxlbmd0aCA+IDEgPyBwbHVyYWxbMF0gOiAnJztcbiAgfVxuXG4gIHJldHVybiBzdWZmaXhcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgaWYoIWlucHV0KSB7XG4gICAgcmV0dXJuIG51bGxcbiAgfVxuXG4gIHZhciBjYiA9IGlucHV0LmNoYXJBdCB8fCBmdW5jdGlvbihpZHgpIHtcbiAgICByZXR1cm4gdGhpc1tpZHhdO1xuICB9O1xuXG4gIHJldHVybiBjYi5jYWxsKGlucHV0LCBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBpbnB1dC5sZW5ndGgpKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgbnVtKSB7XG4gIHZhciBiaXRzID0gKGlucHV0ID09PSBudWxsIHx8IGlucHV0ID09PSB1bmRlZmluZWQgPyAnJyA6IGlucHV0KS50b1N0cmluZygpLnNwbGl0KCcnKVxuICAgICwgZGlmZmVyZW5jZSA9IG51bSAtIGJpdHMubGVuZ3RoXG5cbiAgLy8gcHVzaCByZXR1cm5zIG5ldyBsZW5ndGggb2YgYXJyYXkuXG4gIC8vIE5COiBbXS51bnNoaWZ0IHJldHVybnMgYHVuZGVmaW5lZGAgaW4gSUU8OS5cbiAgd2hpbGUoZGlmZmVyZW5jZSA+IDApIHtcbiAgICBkaWZmZXJlbmNlID0gKGJpdHMudW5zaGlmdCgnICcpLCBudW0gLSBiaXRzLmxlbmd0aClcbiAgfVxuXG4gIHJldHVybiBiaXRzLmpvaW4oJycpXG59XG4iLCJ2YXIgRmlsdGVyTm9kZSA9IHJlcXVpcmUoJy4uL2ZpbHRlcl9ub2RlJylcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICBpZihpbnB1dCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgaW5wdXQgPSAnJ1xuICB9XG5cbiAgaW5wdXQgPSBuZXcgU3RyaW5nKGlucHV0KVxuICBpbnB1dC5zYWZlID0gdHJ1ZVxuICByZXR1cm4gaW5wdXRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIGJ5KSB7XG4gIGlmKGlucHV0ID09PSB1bmRlZmluZWQgfHwgaW5wdXQgPT09IG51bGwpIHtcbiAgICBpbnB1dCA9IFtdXG4gIH1cblxuICBieSA9IGJ5LnRvU3RyaW5nKClcbiAgaWYoYnkuY2hhckF0KDApID09PSAnOicpIHtcbiAgICBieSA9ICcwJytieVxuICB9XG5cbiAgaWYoYnkuY2hhckF0KGJ5Lmxlbmd0aC0xKSA9PT0gJzonKSB7XG4gICAgYnkgPSBieS5zbGljZSgwLCAtMSlcbiAgfVxuXG4gIHZhciBzcGxpdEJ5ID0gYnkuc3BsaXQoJzonKVxuICAgICwgc2xpY2UgPSBpbnB1dC5zbGljZSB8fCAoZnVuY3Rpb24oKSB7XG4gICAgICAgIGlucHV0ID0gdGhpcy50b1N0cmluZygpXG4gICAgICAgIHJldHVybiBpbnB1dC5zbGljZVxuICAgICAgfSkoKVxuXG4gIHJldHVybiBzbGljZS5hcHBseShpbnB1dCwgc3BsaXRCeSlcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgaW5wdXQgPSBpbnB1dC50b1N0cmluZygpXG4gIHJldHVybiBpbnB1dFxuICAgICAgICAucmVwbGFjZSgvW15cXHdcXHNcXGRcXC1dL2csICcnKVxuICAgICAgICAucmVwbGFjZSgvXlxccyovLCAnJylcbiAgICAgICAgLnJlcGxhY2UoL1xccyokLywgJycpXG4gICAgICAgIC5yZXBsYWNlKC9bXFwtXFxzXSsvZywgJy0nKVxuICAgICAgICAudG9Mb3dlckNhc2UoKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgYnksIHJlYWR5KSB7XG4gIGJ5ID0gYXJndW1lbnRzLmxlbmd0aCA9PT0gMiA/ICcsJyA6IGJ5XG4gIGlucHV0ID0gJycraW5wdXRcbiAgcmV0dXJuIGlucHV0LnNwbGl0KGJ5KVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICB2YXIgc3RyID0gaW5wdXQudG9TdHJpbmcoKVxuICByZXR1cm4gc3RyLnJlcGxhY2UoLzxbXj5dKj8+L2csICcnKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgbiwgcmVhZHkpIHtcbiAgdmFyIGlucHV0ID0gbmV3IERhdGUoaW5wdXQpXG4gICAgLCBub3cgICA9IHJlYWR5ID09PSB1bmRlZmluZWQgPyBuZXcgRGF0ZSgpIDogbmV3IERhdGUobilcbiAgICAsIGRpZmYgID0gaW5wdXQgLSBub3dcbiAgICAsIHNpbmNlID0gTWF0aC5hYnMoZGlmZilcblxuICBpZihkaWZmID4gMCkge1xuICAgIHJldHVybiAnMCBtaW51dGVzJ1xuICB9XG5cbiAgLy8gMzY1LjI1ICogMjQgKiA2MCAqIDYwICogMTAwMCA9PT0geWVhcnNcbiAgdmFyIHllYXJzID0gICB+fihzaW5jZSAvIDMxNTU3NjAwMDAwKVxuICAgICwgbW9udGhzID0gIH5+KChzaW5jZSAtICh5ZWFycyozMTU1NzYwMDAwMCkpIC8gMjU5MjAwMDAwMClcbiAgICAsIGRheXMgPSAgICB+figoc2luY2UgLSAoeWVhcnMgKiAzMTU1NzYwMDAwMCArIG1vbnRocyAqIDI1OTIwMDAwMDApKSAvIDg2NDAwMDAwKVxuICAgICwgaG91cnMgPSAgIH5+KChzaW5jZSAtICh5ZWFycyAqIDMxNTU3NjAwMDAwICsgbW9udGhzICogMjU5MjAwMDAwMCArIGRheXMgKiA4NjQwMDAwMCkpIC8gMzYwMDAwMClcbiAgICAsIG1pbnV0ZXMgPSB+figoc2luY2UgLSAoeWVhcnMgKiAzMTU1NzYwMDAwMCArIG1vbnRocyAqIDI1OTIwMDAwMDAgKyBkYXlzICogODY0MDAwMDAgKyBob3VycyAqIDM2MDAwMDApKSAvIDYwMDAwKVxuICAgICwgcmVzdWx0ID0gW1xuICAgICAgICB5ZWFycyAgID8gcGx1cmFsaXplKHllYXJzLCAgICAneWVhcicpIDogbnVsbFxuICAgICAgLCBtb250aHMgID8gcGx1cmFsaXplKG1vbnRocywgICAnbW9udGgnKSA6IG51bGxcbiAgICAgICwgZGF5cyAgICA/IHBsdXJhbGl6ZShkYXlzLCAgICAgJ2RheScpIDogbnVsbFxuICAgICAgLCBob3VycyAgID8gcGx1cmFsaXplKGhvdXJzLCAgICAnaG91cicpIDogbnVsbFxuICAgICAgLCBtaW51dGVzID8gcGx1cmFsaXplKG1pbnV0ZXMsICAnbWludXRlJykgOiBudWxsXG4gICAgXVxuICAgICwgb3V0ID0gW11cblxuICBmb3IodmFyIGkgPSAwLCBsZW4gPSByZXN1bHQubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICByZXN1bHRbaV0gIT09IG51bGwgJiYgb3V0LnB1c2gocmVzdWx0W2ldKVxuICB9XG5cbiAgaWYoIW91dC5sZW5ndGgpIHtcbiAgICByZXR1cm4gJzAgbWludXRlcydcbiAgfVxuXG4gIHJldHVybiBvdXRbMF0gKyAob3V0WzFdID8gJywgJyArIG91dFsxXSA6ICcnKVxuXG4gIGZ1bmN0aW9uIHBsdXJhbGl6ZSh4LCBzdHIpIHtcbiAgICByZXR1cm4geCArICcgJyArIHN0ciArICh4ID09PSAxID8gJycgOiAncycpXG4gIH1cbn1cbiIsInZhciB0aW1lc2luY2UgPSByZXF1aXJlKCcuL3RpbWVzaW5jZScpLnRpbWVzaW5jZVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBuKSB7XG4gIHZhciBub3cgPSBuID8gbmV3IERhdGUobikgOiBuZXcgRGF0ZSgpXG4gIHJldHVybiB0aW1lc2luY2Uobm93LCBpbnB1dClcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgdmFyIHN0ciA9IGlucHV0LnRvU3RyaW5nKClcbiAgICAsIGJpdHMgPSBzdHIuc3BsaXQoL1xcc3sxfS9nKVxuICAgICwgb3V0ID0gW11cblxuICB3aGlsZShiaXRzLmxlbmd0aCkge1xuICAgIHZhciB3b3JkID0gYml0cy5zaGlmdCgpXG4gICAgd29yZCA9IHdvcmQuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgKyB3b3JkLnNsaWNlKDEpXG4gICAgb3V0LnB1c2god29yZClcbiAgfVxuXG4gIG91dCA9IG91dC5qb2luKCcgJylcbiAgcmV0dXJuIG91dC5yZXBsYWNlKC8oW2Etel0pJyhbQS1aXSkvZywgZnVuY3Rpb24oYSwgbSwgeCkgeyByZXR1cm4geC50b0xvd2VyQ2FzZSgpIH0pXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBuKSB7XG4gIHZhciBzdHIgPSBpbnB1dC50b1N0cmluZygpXG4gICAgLCBudW0gPSBwYXJzZUludChuLCAxMClcblxuICBpZihpc05hTihudW0pKSB7XG4gICAgcmV0dXJuIGlucHV0XG4gIH1cblxuICBpZihpbnB1dC5sZW5ndGggPD0gbnVtKSB7XG4gICAgcmV0dXJuIGlucHV0XG4gIH1cblxuICByZXR1cm4gaW5wdXQuc2xpY2UoMCwgbnVtKSsnLi4uJ1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgbikge1xuICB2YXIgc3RyID0gaW5wdXQudG9TdHJpbmcoKVxuICAgICwgbnVtID0gcGFyc2VJbnQobiwgMTApXG4gICAgLCB3b3Jkc1xuXG4gIGlmKGlzTmFOKG51bSkpIHtcbiAgICByZXR1cm4gaW5wdXRcbiAgfVxuXG4gIHdvcmRzID0gaW5wdXQuc3BsaXQoL1xccysvKVxuXG4gIGlmKHdvcmRzLmxlbmd0aCA8PSBudW0pIHtcbiAgICByZXR1cm4gaW5wdXRcbiAgfVxuXG4gIHJldHVybiB3b3Jkcy5zbGljZSgwLCBudW0pLmpvaW4oJyAnKSsnLi4uJ1xufVxuIiwidmFyIHNhZmUgPSByZXF1aXJlKCcuL3NhZmUnKTtcblxudmFyIHVscGFyc2VyID0gZnVuY3Rpb24obGlzdCkge1xuICB2YXIgb3V0ID0gW11cbiAgICAsIGwgPSBsaXN0LnNsaWNlKClcbiAgICAsIGl0ZW1cblxuICB3aGlsZShsLmxlbmd0aCkge1xuICAgIGl0ZW0gPSBsLnBvcCgpXG5cbiAgICBpZihpdGVtIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgIG91dC51bnNoaWZ0KCc8dWw+Jyt1bHBhcnNlcihpdGVtKSsnPC91bD4nKVxuICAgIH0gZWxzZSB7XG4gICAgICBvdXQudW5zaGlmdCgnPC9saT48bGk+JytpdGVtKVxuICAgIH1cbiAgfVxuXG4gIC8vIGdldCByaWQgb2YgdGhlIGxlYWRpbmcgPC9saT4sIGlmIGFueS4gYWRkIHRyYWlsaW5nIDwvbGk+LlxuICByZXR1cm4gb3V0LmpvaW4oJycpLnJlcGxhY2UoL148XFwvbGk+LywgJycpICsgJzwvbGk+J1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHJldHVybiBpbnB1dCBpbnN0YW5jZW9mIEFycmF5ID9cbiAgICBzYWZlKHVscGFyc2VyKGlucHV0KSkgOlxuICAgIGlucHV0XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0KSB7XG4gIHJldHVybiBpbnB1dC50b1N0cmluZygpLnRvVXBwZXJDYXNlKClcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgcmV0dXJuIGVzY2FwZShpbnB1dC50b1N0cmluZygpKVxufVxuIiwidmFyIHNhZmUgPSByZXF1aXJlKCcuL3NhZmUnKVxudmFyIHVybF9maW5kZXIgPSByZXF1aXJlKCcuLi91cmxfZmluZGVyJylcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCkge1xuICByZXR1cm4gc2FmZSh1cmxfZmluZGVyKGlucHV0LCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gJzxhIGhyZWY9XCInK2FyZ3VtZW50c1swXSsnXCI+Jythcmd1bWVudHNbMF0rJzwvYT4nO1xuICB9KSlcbn1cbiIsInZhciBzYWZlID0gcmVxdWlyZSgnLi9zYWZlJylcbnZhciB1cmxfZmluZGVyID0gcmVxdWlyZSgnLi4vdXJsX2ZpbmRlcicpXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIGxlbikge1xuICBsZW4gPSBwYXJzZUludChsZW4sIDEwKSB8fCAxMDAwXG4gIHJldHVybiBzYWZlKHVybF9maW5kZXIoaW5wdXQsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBsdHIgPSBhcmd1bWVudHNbMF0ubGVuZ3RoID4gbGVuID8gYXJndW1lbnRzWzBdLnNsaWNlKDAsIGxlbikgKyAnLi4uJyA6IGFyZ3VtZW50c1swXTtcbiAgICByZXR1cm4gJzxhIGhyZWY9XCInK2FyZ3VtZW50c1swXSsnXCI+JytsdHIrJzwvYT4nO1xuICB9KSlcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQpIHtcbiAgaWYoaW5wdXQgPT09IHVuZGVmaW5lZCB8fCBpbnB1dCA9PT0gbnVsbCkge1xuICAgIHJldHVybiAwXG4gIH1cblxuICB2YXIgc3RyID0gaW5wdXQudG9TdHJpbmcoKVxuICAgICwgYml0cyA9IHN0ci5zcGxpdCgvXFxzKy9nKVxuXG4gIHJldHVybiBiaXRzLmxlbmd0aFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihpbnB1dCwgbGVuKSB7XG4gIHZhciB3b3JkcyA9IGlucHV0LnRvU3RyaW5nKCkuc3BsaXQoL1xccysvZylcbiAgICAsIG91dCA9IFtdXG4gICAgLCBsZW4gPSBwYXJzZUludChsZW4sIDEwKSB8fCB3b3Jkcy5sZW5ndGhcblxuICB3aGlsZSh3b3Jkcy5sZW5ndGgpIHtcbiAgICBvdXQudW5zaGlmdCh3b3Jkcy5zcGxpY2UoMCwgbGVuKS5qb2luKCcgJykpXG4gIH1cblxuICByZXR1cm4gb3V0LmpvaW4oJ1xcbicpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGlucHV0LCBtYXApIHtcbiAgaWYoaW5wdXQgPT09IHVuZGVmaW5lZCkge1xuICAgIGlucHV0ID0gZmFsc2VcbiAgfVxuXG4gIHZhciBvdXJNYXAgPSBtYXAudG9TdHJpbmcoKS5zcGxpdCgnLCcpXG4gICAgLCB2YWx1ZVxuXG4gIG91ck1hcC5sZW5ndGggPCAzICYmIG91ck1hcC5wdXNoKG91ck1hcFsxXSlcblxuICB2YWx1ZSA9IG91ck1hcFtcbiAgICBpbnB1dCA/IDAgOlxuICAgIGlucHV0ID09PSBmYWxzZSA/IDEgOlxuICAgIDJcbiAgXVxuXG4gIHJldHVybiB2YWx1ZVxufVxuIiwidmFyIGdsb2JhbD1zZWxmO3ZhciBGaWx0ZXJUb2tlbiA9IHJlcXVpcmUoJy4vZmlsdGVyX3Rva2VuJylcbiAgLCBUYWdUb2tlbiA9IHJlcXVpcmUoJy4vdGFnX3Rva2VuJylcbiAgLCBDb21tZW50VG9rZW4gPSByZXF1aXJlKCcuL2NvbW1lbnRfdG9rZW4nKVxuICAsIFRleHRUb2tlbiA9IHJlcXVpcmUoJy4vdGV4dF90b2tlbicpXG4gICwgbGlicmFyaWVzID0gcmVxdWlyZSgnLi9saWJyYXJpZXMnKVxuICAsIFBhcnNlciA9IHJlcXVpcmUoJy4vcGFyc2VyJylcbiAgLCBDb250ZXh0ID0gcmVxdWlyZSgnLi9jb250ZXh0JylcbiAgLCBNZXRhID0gcmVxdWlyZSgnLi9tZXRhJylcbiAgLCBQcm9taXNlID0gcmVxdWlyZSgnLi9wcm9taXNlJylcblxubW9kdWxlLmV4cG9ydHMgPSBUZW1wbGF0ZVxuXG4vLyBjaXJjdWxhciBhbGlhcyB0byBzdXBwb3J0IG9sZFxuLy8gdmVyc2lvbnMgb2YgcGxhdGUuXG5UZW1wbGF0ZS5UZW1wbGF0ZSA9IFRlbXBsYXRlXG5UZW1wbGF0ZS5Db250ZXh0ID0gQ29udGV4dFxuXG52YXIgbGF0ZXIgPSB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/XG4gICAgZnVuY3Rpb24oZm4pIHsgZ2xvYmFsLnNldFRpbWVvdXQoZm4sIDApIH0gOlxuICAgIGZ1bmN0aW9uKGZuKSB7IHRoaXMuc2V0VGltZW91dChmbiwgMCkgfVxuXG5mdW5jdGlvbiBUZW1wbGF0ZShyYXcsIGxpYnJhcmllcywgcGFyc2VyKSB7XG4gIGlmKHR5cGVvZiByYXcgIT09ICdzdHJpbmcnKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignaW5wdXQgc2hvdWxkIGJlIGEgc3RyaW5nJylcbiAgfVxuXG4gIHRoaXMucmF3ID0gcmF3XG5cbiAgbGlicmFyaWVzID0gbGlicmFyaWVzIHx8IHt9XG5cbiAgdGhpcy50YWdMaWJyYXJ5ID1cbiAgICBsaWJyYXJpZXMudGFnX2xpYnJhcnkgfHwgVGVtcGxhdGUuTWV0YS5jcmVhdGVUYWdMaWJyYXJ5KClcblxuICB0aGlzLmZpbHRlckxpYnJhcnkgPVxuICAgIGxpYnJhcmllcy5maWx0ZXJfbGlicmFyeSB8fCBUZW1wbGF0ZS5NZXRhLmNyZWF0ZUZpbHRlckxpYnJhcnkoKVxuXG4gIHRoaXMucGx1Z2luTGlicmFyeSA9XG4gICAgbGlicmFyaWVzLnBsdWdpbl9saWJyYXJ5IHx8IFRlbXBsYXRlLk1ldGEuY3JlYXRlUGx1Z2luTGlicmFyeSgpXG5cbiAgdGhpcy5wYXJzZXIgPSBwYXJzZXIgfHwgUGFyc2VyXG5cbiAgdGhpcy50b2tlbnMgPSBudWxsXG59XG5cbnZhciBjb25zID0gVGVtcGxhdGVcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG4gICwgbWV0YSA9IGNvbnMuTWV0YSA9IG5ldyBNZXRhXG5cbmNvbnMuY3JlYXRlUGx1Z2luTGlicmFyeSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gbmV3IGxpYnJhcmllcy5EZWZhdWx0UGx1Z2luTGlicmFyeSgpXG59XG5cbnByb3RvLmdldE5vZGVMaXN0ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMubm9kZWxpc3QgPSB0aGlzLm5vZGVsaXN0IHx8IHRoaXMucGFyc2UoKVxuXG4gIHJldHVybiB0aGlzLm5vZGVsaXN0XG59XG5cbnByb3RvLnBhcnNlID0gZnVuY3Rpb24oKSB7XG4gIHZhciBwYXJzZXJcblxuICB0aGlzLnRva2VucyA9IHRoaXMudG9rZW5zIHx8IGNvbnMudG9rZW5pemUodGhpcy5yYXcpXG5cbiAgcGFyc2VyID0gbmV3IHRoaXMucGFyc2VyKFxuICAgICAgdGhpcy50b2tlbnNcbiAgICAsIHRoaXMudGFnTGlicmFyeVxuICAgICwgdGhpcy5maWx0ZXJMaWJyYXJ5XG4gICAgLCB0aGlzLnBsdWdpbkxpYnJhcnlcbiAgICAsIHRoaXNcbiAgKVxuXG4gIHJldHVybiBwYXJzZXIucGFyc2UoKVxufVxuXG5wcm90by5yZW5kZXIgPSBwcm90ZWN0KGZ1bmN0aW9uKGNvbnRleHQsIHJlYWR5KSB7XG4gIGNvbnRleHQgPSBuZXcgQ29udGV4dChjb250ZXh0KVxuXG4gIHZhciByZXN1bHRcblxuICByZXN1bHQgPVxuICB0aGlzXG4gICAgLmdldE5vZGVMaXN0KClcbiAgICAucmVuZGVyKGNvbnRleHQpXG5cbiAgaWYocmVzdWx0LmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgcmVzdWx0Lm9uY2UoJ2RvbmUnLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICByZWFkeShudWxsLCBkYXRhKVxuICAgIH0pXG4gIH0gZWxzZSB7XG4gICAgbGF0ZXIoZnVuY3Rpb24oKSB7XG4gICAgICByZWFkeShudWxsLCByZXN1bHQpXG4gICAgfSwgMClcbiAgfVxuXG59KVxuXG5mdW5jdGlvbiBwcm90ZWN0KGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbihjb250ZXh0LCByZWFkeSkge1xuICAgIGlmKCFjb250ZXh0IHx8ICFyZWFkeSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcigpXG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIGNvbnRleHQsIHJlYWR5KVxuICAgIH0gY2F0Y2goZSkge1xuICAgICAgbGF0ZXIoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlYWR5KGUsIG51bGwpXG4gICAgICB9LCAwKVxuICAgIH1cbiAgfVxufVxuXG5jb25zLk1BVENIX1JFID0gL1xce1slI1xce10oLio/KVtcXH0jJV1cXH0vXG5cbmNvbnMudG9rZW5pemUgPSBmdW5jdGlvbihjb250ZW50KSB7XG4gIHZhciBtYXRjaCA9IG51bGxcbiAgICAsIHRva2VucyA9IFtdXG4gICAgLCBsaW5lTm8gPSAxXG4gICAgLCBpbmNMaW5lTm8gPSBmdW5jdGlvbihzdHIpIHsgbGluZU5vICs9IHN0ci5zcGxpdCgnXFxuJykubGVuZ3RoIH1cbiAgICAsIG1hcCA9IHtcbiAgICAgICAgICAnJSc6IFRhZ1Rva2VuXG4gICAgICAgICwgJyMnOiBDb21tZW50VG9rZW5cbiAgICAgICAgLCAneyc6IEZpbHRlclRva2VuXG4gICAgICB9XG4gICAgLCByZXggPSB0aGlzLk1BVENIX1JFXG4gICAgLCBsaXRlcmFsXG5cbiAgZG8ge1xuICAgIG1hdGNoID0gcmV4LmV4ZWMoY29udGVudClcbiAgICBpZighbWF0Y2gpXG4gICAgICBjb250aW51ZVxuXG4gICAgbGl0ZXJhbCA9IGNvbnRlbnQuc2xpY2UoMCwgbWF0Y2guaW5kZXgpXG4gICAgaW5jTGluZU5vKGxpdGVyYWwpXG4gICAgaWYobWF0Y2guaW5kZXgpXG4gICAgICB0b2tlbnMucHVzaChuZXcgVGV4dFRva2VuKGxpdGVyYWwuc2xpY2UoMCwgbWF0Y2guaW5kZXgsIGxpbmVObykpKVxuXG4gICAgbWF0Y2hbMV0gPSBtYXRjaFsxXVxuICAgICAgLnJlcGxhY2UoL15cXHMrLywgJycpXG4gICAgICAucmVwbGFjZSgvXFxzKyQvLCAnJylcblxuICAgIHRva2Vucy5wdXNoKG5ldyBtYXBbbWF0Y2hbMF0uY2hhckF0KDEpXShtYXRjaFsxXSwgbGluZU5vKSlcblxuICAgIGNvbnRlbnQgPSBjb250ZW50LnNsaWNlKG1hdGNoLmluZGV4ICsgbWF0Y2hbMF0ubGVuZ3RoKVxuICB9IHdoaWxlKGNvbnRlbnQubGVuZ3RoICYmIG1hdGNoKVxuXG4gIHRva2Vucy5wdXNoKG5ldyBUZXh0VG9rZW4oY29udGVudCkpXG5cbiAgcmV0dXJuIHRva2Vuc1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgTGlicmFyeTogcmVxdWlyZSgnLi9saWJyYXJ5JylcbiAgLCBEZWZhdWx0UGx1Z2luTGlicmFyeTogcmVxdWlyZSgnLi9saWJyYXJ5JylcbiAgLCBEZWZhdWx0VGFnTGlicmFyeTogcmVxdWlyZSgnLi9kZWZhdWx0dGFncycpXG4gICwgRGVmYXVsdEZpbHRlckxpYnJhcnk6IHJlcXVpcmUoJy4vZGVmYXVsdGZpbHRlcnMnKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBMaWJyYXJ5XG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi9wcm9taXNlJylcblxuZnVuY3Rpb24gTGlicmFyeShsaWIpIHtcbiAgdGhpcy5yZWdpc3RyeSA9IGxpYiB8fCB7fVxufVxuXG52YXIgY29ucyA9IExpYnJhcnlcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLmxvb2t1cCA9IGVycm9yT25OdWxsKGZ1bmN0aW9uKG5hbWUpIHtcbiAgdmFyIG91dCA9IHRoaXMucmVnaXN0cnlbbmFtZV0gfHwgbnVsbFxuXG4gIGlmKHR5cGVvZiBvdXQgPT09ICdmdW5jdGlvbicgJiYgb3V0Lmxlbmd0aCA9PT0gMiAmJiBuYW1lID09PSAnbG9hZGVyJykge1xuICAgIG91dCA9IFByb21pc2UudG9Qcm9taXNlKG91dClcbiAgfVxuXG4gIHJldHVybiBvdXRcbn0sIFwiQ291bGQgbm90IGZpbmQgezB9IVwiKVxuXG5wcm90by5yZWdpc3RlciA9IGVycm9yT25OdWxsKGZ1bmN0aW9uKG5hbWUsIGl0ZW0pIHtcbiAgaWYodGhpcy5yZWdpc3RyeVtuYW1lXSlcbiAgICByZXR1cm4gbnVsbFxuXG4gIHRoaXMucmVnaXN0cnlbbmFtZV0gPSBpdGVtXG59LCBcInswfSBpcyBhbHJlYWR5IHJlZ2lzdGVyZWQhXCIpXG5cblxuZnVuY3Rpb24gZXJyb3JPbk51bGwoZm4sIG1zZykge1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJlc3VsdCA9IGZuLmNhbGwodGhpcywgYXJndW1lbnRzWzBdLCBhcmd1bWVudHNbMV0pXG4gICAgICAsIGFyZ3MgPSBhcmd1bWVudHNcblxuICAgIGlmKHJlc3VsdCA9PT0gbnVsbClcbiAgICAgIHRocm93IG5ldyBFcnJvcihtc2cucmVwbGFjZSgvXFx7KFxcZCs/KVxcfS9nLCBmdW5jdGlvbihhLCBtKSB7XG4gICAgICAgIHJldHVybiBhcmdzWyttXVxuICAgICAgfSkpXG5cbiAgICByZXR1cm4gcmVzdWx0XG4gIH1cbn1cblxuIiwidmFyIGxpYnJhcmllcyA9IHJlcXVpcmUoJy4vbGlicmFyaWVzJylcblxubW9kdWxlLmV4cG9ydHMgPSBNZXRhXG5cbmZ1bmN0aW9uIE1ldGEoKSB7XG4gIHRoaXMuX2F1dG9yZWdpc3RlciA9IHtcbiAgICAgIHBsdWdpbjoge31cbiAgICAsIHRhZzoge31cbiAgICAsIGZpbHRlcjoge31cbiAgfVxuXG4gIHRoaXMuX2NhY2hlID0ge31cblxuICB0aGlzLl9jbGFzc2VzID0ge1xuICAgICAgZmlsdGVyOiBsaWJyYXJpZXMuRGVmYXVsdEZpbHRlckxpYnJhcnlcbiAgICAsIHBsdWdpbjogbGlicmFyaWVzLkRlZmF1bHRQbHVnaW5MaWJyYXJ5XG4gICAgLCB0YWc6IGxpYnJhcmllcy5EZWZhdWx0VGFnTGlicmFyeVxuICB9XG59XG5cbnZhciBjb25zID0gTWV0YVxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8uY3JlYXRlUGx1Z2luTGlicmFyeSA9IGNyZWF0ZUxpYnJhcnkoJ3BsdWdpbicpXG5wcm90by5jcmVhdGVGaWx0ZXJMaWJyYXJ5ID0gY3JlYXRlTGlicmFyeSgnZmlsdGVyJylcbnByb3RvLmNyZWF0ZVRhZ0xpYnJhcnkgPSBjcmVhdGVMaWJyYXJ5KCd0YWcnKVxuXG5wcm90by5yZWdpc3RlclBsdWdpbiA9IGNyZWF0ZUF1dG9yZWdpc3RlcigncGx1Z2luJylcbnByb3RvLnJlZ2lzdGVyRmlsdGVyID0gY3JlYXRlQXV0b3JlZ2lzdGVyKCdmaWx0ZXInKVxucHJvdG8ucmVnaXN0ZXJUYWcgPSBjcmVhdGVBdXRvcmVnaXN0ZXIoJ3RhZycpXG5cbmZ1bmN0aW9uIGNyZWF0ZUF1dG9yZWdpc3RlcihuYW1lKSB7XG4gIHJldHVybiBmdW5jdGlvbihrZXksIGl0ZW0pIHtcbiAgICBpZih0aGlzLl9jYWNoZVtuYW1lXSlcbiAgICAgIHRoaXMuX2NhY2hlW25hbWVdLnJlZ2lzdGVyKGtleSwgaXRlbSk7XG4gICAgZWxzZVxuICAgICAgdGhpcy5fYXV0b3JlZ2lzdGVyW25hbWVdW2tleV0gPSBpdGVtO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUxpYnJhcnkobmFtZSkge1xuICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgaWYodGhpcy5fY2FjaGVbbmFtZV0pXG4gICAgICByZXR1cm4gdGhpcy5fY2FjaGVbbmFtZV07XG5cbiAgICB2YXIgbGliID0gbmV3IHRoaXMuX2NsYXNzZXNbbmFtZV1cblxuICAgIGZvcih2YXIga2V5IGluIHRoaXMuX2F1dG9yZWdpc3RlcltuYW1lXSkge1xuICAgICAgbGliLnJlZ2lzdGVyKGtleSwgdGhpcy5fYXV0b3JlZ2lzdGVyW25hbWVdW2tleV0pXG4gICAgfVxuXG4gICAgdGhpcy5fY2FjaGVbbmFtZV0gPSBsaWJcbiAgICByZXR1cm4gbGliXG4gIH1cbn1cblxuIiwibW9kdWxlLmV4cG9ydHMgPSBOb2RlTGlzdFxuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJy4vcHJvbWlzZScpXG5cbmZ1bmN0aW9uIE5vZGVMaXN0KG5vZGVzKSB7XG4gIHRoaXMubm9kZXMgPSBub2Rlc1xufVxuXG52YXIgY29ucyA9IE5vZGVMaXN0XG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by5yZW5kZXIgPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gIHZhciBwcm9taXNlcyA9IFtdXG4gICAgLCByZXN1bHRzID0gW11cbiAgICAsIG5vZGVzID0gdGhpcy5ub2Rlc1xuICAgICwgcmVzdWx0XG5cbiAgZm9yKHZhciBpID0gMCwgbGVuID0gbm9kZXMubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICByZXN1bHRzW2ldID0gcmVzdWx0ID0gbm9kZXNbaV0ucmVuZGVyKGNvbnRleHQpXG5cbiAgICBpZihyZXN1bHQuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcbiAgICAgIHByb21pc2VzLnB1c2gocmVzdWx0KVxuICAgIH1cbiAgfVxuXG4gIGlmKHByb21pc2VzLmxlbmd0aCkge1xuICAgIHJldHVybiB0aGlzLnJlc29sdmVQcm9taXNlcyhyZXN1bHRzLCBwcm9taXNlcylcbiAgfVxuXG4gIHJldHVybiByZXN1bHRzLmpvaW4oJycpXG59XG5cbnByb3RvLnJlc29sdmVQcm9taXNlcyA9IGZ1bmN0aW9uKHJlc3VsdHMsIHByb21pc2VzKSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICAgICwgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG4gICAgLCB0b3RhbCA9IHByb21pc2VzLmxlbmd0aFxuXG4gIGZvcih2YXIgaSA9IDAsIHAgPSAwLCBsZW4gPSByZXN1bHRzLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgaWYocmVzdWx0c1tpXS5jb25zdHJ1Y3RvciAhPT0gUHJvbWlzZSlcbiAgICAgIGNvbnRpbnVlXG5cbiAgICBwcm9taXNlc1twKytdLm9uY2UoJ2RvbmUnLCBiaW5kKGksIGZ1bmN0aW9uKGlkeCwgcmVzdWx0KSB7XG4gICAgICByZXN1bHRzW2lkeF0gPSByZXN1bHRcblxuICAgICAgaWYoIS0tdG90YWwpXG4gICAgICAgIHByb21pc2UucmVzb2x2ZShyZXN1bHRzLmpvaW4oJycpKVxuICAgIH0pKVxuICB9XG5cbiAgcmV0dXJuIHByb21pc2Vcbn1cblxuZnVuY3Rpb24gYmluZChudW0sIGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbihyZXN1bHQpIHtcbiAgICByZXR1cm4gZm4obnVtLCByZXN1bHQpXG4gIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gUGFyc2VyXG5cbnZhciBOb2RlTGlzdCA9IHJlcXVpcmUoJy4vbm9kZV9saXN0JylcblxudmFyIEZpbHRlckFwcGxpY2F0aW9uID0gcmVxdWlyZSgnLi9maWx0ZXJfYXBwbGljYXRpb24nKVxuICAsIEZpbHRlckxvb2t1cCA9IHJlcXVpcmUoJy4vZmlsdGVyX2xvb2t1cCcpXG4gICwgRmlsdGVyQ2hhaW4gPSByZXF1aXJlKCcuL2ZpbHRlcl9jaGFpbicpXG4gICwgVGFnVG9rZW4gPSByZXF1aXJlKCcuL3RhZ190b2tlbicpXG5cbmZ1bmN0aW9uIFBhcnNlcih0b2tlbnMsIHRhZ3MsIGZpbHRlcnMsIHBsdWdpbnMpIHtcbiAgdGhpcy50b2tlbnMgPSB0b2tlbnNcbiAgdGhpcy50YWdzID0gdGFnc1xuICB0aGlzLmZpbHRlcnMgPSBmaWx0ZXJzXG4gIHRoaXMucGx1Z2lucyA9IHBsdWdpbnNcblxuICAvLyBmb3IgdXNlIHdpdGggZXh0ZW5kcyAvIGJsb2NrIHRhZ3NcbiAgdGhpcy5sb2FkZWRCbG9ja3MgPSBbXVxufVxuXG52YXIgY29ucyA9IFBhcnNlclxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8uY2FjaGUgPSB7fVxuXG5wcm90by5wYXJzZSA9IGZ1bmN0aW9uKHVudGlsKSB7XG4gIHZhciBva2F5ID0gIXVudGlsXG4gICAgLCB0b2tlbiA9IG51bGxcbiAgICAsIG91dHB1dCA9IFtdXG4gICAgLCBub2RlXG5cbiAgd2hpbGUodGhpcy50b2tlbnMubGVuZ3RoID4gMCkge1xuICAgIHRva2VuID0gdGhpcy50b2tlbnMuc2hpZnQoKVxuXG4gICAgaWYodW50aWwgJiYgdG9rZW4uaXModW50aWwpICYmIHRva2VuLmNvbnN0cnVjdG9yID09PSBUYWdUb2tlbikge1xuICAgICAgdGhpcy50b2tlbnMudW5zaGlmdCh0b2tlbilcbiAgICAgIG9rYXkgPSB0cnVlXG5cbiAgICAgIGJyZWFrXG4gICAgfVxuXG4gICAgaWYobm9kZSA9IHRva2VuLm5vZGUodGhpcykpIHtcbiAgICAgIG91dHB1dC5wdXNoKG5vZGUpXG4gICAgfVxuICB9XG5cbiAgaWYoIW9rYXkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2V4cGVjdGVkIG9uZSBvZiAnICsgdW50aWwpXG4gIH1cblxuICByZXR1cm4gbmV3IE5vZGVMaXN0KG91dHB1dClcbn1cblxucHJvdG8uY29tcGlsZU51bWJlciA9IGZ1bmN0aW9uKGNvbnRlbnQsIGlkeCwgb3V0cHV0KSB7XG4gIHZhciBkZWNpbWFsID0gY29udGVudC5jaGFyQXQoaWR4KSA9PT0gJy4nXG4gICAgLCBiaXRzID0gZGVjaW1hbCA/IFsnMC4nXSA6IFtdXG4gICAgLCBwYXJzZVxuICAgICwgY1xuXG4gIGRvIHtcbiAgICBjID0gY29udGVudC5jaGFyQXQoaWR4KVxuXG4gICAgaWYoYyA9PT0gJy4nKSB7XG4gICAgICBpZihkZWNpbWFsKSB7XG4gICAgICAgIGJyZWFrXG4gICAgICB9XG5cbiAgICAgIGRlY2ltYWwgPSB0cnVlXG4gICAgICBiaXRzLnB1c2goJy4nKVxuICAgIH0gZWxzZSBpZigvXFxkLy50ZXN0KGMpKSB7XG4gICAgICBiaXRzLnB1c2goYylcbiAgICB9XG4gIH0gd2hpbGUoKytpZHggPCBjb250ZW50Lmxlbmd0aClcblxuICBwYXJzZSA9IGRlY2ltYWwgPyBwYXJzZUZsb2F0IDogcGFyc2VJbnRcbiAgb3V0cHV0LnB1c2gocGFyc2UoYml0cy5qb2luKCcnKSwgMTApKVxuXG4gIHJldHVybiBpZHhcbn1cblxucHJvdG8uY29tcGlsZVN0cmluZyA9IGZ1bmN0aW9uKGNvbnRlbnQsIGlkeCwgb3V0cHV0KSB7XG4gIHZhciB0eXBlID0gY29udGVudC5jaGFyQXQoaWR4KVxuICAgICwgZXNjYXBlZCA9IGZhbHNlXG4gICAgLCBiaXRzID0gW11cbiAgICAsIGNcblxuICArK2lkeFxuXG4gIGRvIHtcbiAgICBjID0gY29udGVudC5jaGFyQXQoaWR4KVxuXG4gICAgaWYoIWVzY2FwZWQpIHtcbiAgICAgIGlmKGMgPT09ICdcXFxcJykge1xuICAgICAgICBlc2NhcGVkID0gdHJ1ZVxuXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIGlmKGMgPT09IHR5cGUpIHtcbiAgICAgICAgYnJlYWtcbiAgICAgIH1cblxuICAgICAgYml0cy5wdXNoKGMpXG4gICAgfSBlbHNlIHtcbiAgICAgIGlmKCEvWydcIlxcXFxdLy50ZXN0KGMpKSB7XG4gICAgICAgIGJpdHMucHVzaCgnXFxcXCcpXG4gICAgICB9XG5cbiAgICAgIGJpdHMucHVzaChjKVxuICAgICAgZXNjYXBlZCA9IGZhbHNlXG4gICAgfVxuXG4gIH0gd2hpbGUoKytpZHggPCBjb250ZW50Lmxlbmd0aClcblxuICBvdXRwdXQucHVzaChiaXRzLmpvaW4oJycpKVxuXG4gIHJldHVybiBpZHhcbn1cblxucHJvdG8uY29tcGlsZU5hbWUgPSBmdW5jdGlvbihjb250ZW50LCBpZHgsIG91dHB1dCkge1xuICB2YXIgb3V0ID0gW11cbiAgICAsIGNcblxuICBkbyB7XG4gICAgYyA9IGNvbnRlbnQuY2hhckF0KGlkeClcblxuICAgIGlmKC9bXlxcd1xcZFxcX10vLnRlc3QoYykpIHtcbiAgICAgIGJyZWFrXG4gICAgfVxuXG4gICAgb3V0LnB1c2goYylcbiAgfSB3aGlsZSgrK2lkeCA8IGNvbnRlbnQubGVuZ3RoKVxuXG4gIG91dHB1dC5wdXNoKG91dC5qb2luKCcnKSlcblxuICByZXR1cm4gaWR4XG59XG5cbnByb3RvLmNvbXBpbGVGaWx0ZXIgPSBmdW5jdGlvbihjb250ZW50LCBpZHgsIG91dHB1dCkge1xuICB2YXIgZmlsdGVyTmFtZVxuICAgICwgb2xkTGVuXG4gICAgLCBiaXRzXG5cbiAgKytpZHhcblxuICBpZHggPSB0aGlzLmNvbXBpbGVOYW1lKGNvbnRlbnQsIGlkeCwgb3V0cHV0KVxuICBmaWx0ZXJOYW1lID0gb3V0cHV0LnBvcCgpXG5cbiAgaWYoY29udGVudC5jaGFyQXQoaWR4KSAhPT0gJzonKSB7XG4gICAgb3V0cHV0LnB1c2gobmV3IEZpbHRlckFwcGxpY2F0aW9uKGZpbHRlck5hbWUsIFtdKSlcblxuICAgIHJldHVybiBpZHggLSAxXG4gIH1cblxuICArK2lkeFxuXG4gIG9sZExlbiA9IG91dHB1dC5sZW5ndGhcbiAgaWR4ID0gdGhpcy5jb21waWxlRnVsbChjb250ZW50LCBpZHgsIG91dHB1dCwgdHJ1ZSlcbiAgYml0cyA9IG91dHB1dC5zcGxpY2Uob2xkTGVuLCBvdXRwdXQubGVuZ3RoIC0gb2xkTGVuKVxuXG4gIG91dHB1dC5wdXNoKG5ldyBGaWx0ZXJBcHBsaWNhdGlvbihmaWx0ZXJOYW1lLCBiaXRzKSlcblxuICByZXR1cm4gaWR4XG59XG5cbnByb3RvLmNvbXBpbGVMb29rdXAgPSBmdW5jdGlvbihjb250ZW50LCBpZHgsIG91dHB1dCkge1xuICB2YXIgYml0cyA9IFtdXG5cbiAgZG8ge1xuICAgIGlkeCA9IHRoaXMuY29tcGlsZU5hbWUoY29udGVudCwgaWR4LCBvdXRwdXQpXG4gICAgYml0cy5wdXNoKG91dHB1dC5wb3AoKSlcblxuICAgIGlmKGNvbnRlbnQuY2hhckF0KGlkeCkgIT09ICcuJykge1xuICAgICAgYnJlYWtcbiAgICB9XG4gIH0gd2hpbGUoKytpZHggPCBjb250ZW50Lmxlbmd0aClcblxuICBvdXRwdXQucHVzaChuZXcgRmlsdGVyTG9va3VwKGJpdHMpKVxuXG4gIHJldHVybiBpZHggLSAxXG59XG5cbnByb3RvLmNvbXBpbGVGdWxsID0gZnVuY3Rpb24oY29udGVudCwgaWR4LCBvdXRwdXQsIG9taXRQaXBlKSB7XG4gIHZhciBjXG5cbiAgb3V0cHV0ID0gb3V0cHV0IHx8IFtdXG4gIGlkeCA9IGlkeCB8fCAwXG4gIC8vIHNvbWV0aGluZ3xmaWx0ZXJuYW1lWzphcmcsIGFyZ11cbiAgLy8gXCJxdW90ZXNcIlxuICAvLyAxXG4gIC8vIDEuMlxuICAvLyB0cnVlIHwgZmFsc2VcbiAgLy8gc3dhbGxvdyBsZWFkaW5nIHdoaXRlc3BhY2UuXG5cbiAgd2hpbGUoL1xccy8udGVzdChjb250ZW50LmNoYXJBdChpZHgpKSkge1xuICAgICsraWR4XG4gIH1cblxuICBkbyB7XG4gICAgYyA9IGNvbnRlbnQuY2hhckF0KGlkeClcblxuICAgIGlmKC9bLFxcc10vLnRlc3QoYykpIHtcbiAgICAgIGJyZWFrXG4gICAgfVxuXG4gICAgaWYob21pdFBpcGUgJiYgYyA9PT0gJ3wnKSB7XG4gICAgICAtLWlkeFxuXG4gICAgICBicmVha1xuICAgIH1cblxuICAgIHN3aXRjaCh0cnVlKSB7XG4gICAgICBjYXNlIC9bXFxkXFwuXS8udGVzdChjKTpcbiAgICAgICAgaWR4ID0gdGhpcy5jb21waWxlTnVtYmVyKGNvbnRlbnQsIGlkeCwgb3V0cHV0KVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAvWydcIl0vLnRlc3QoYyk6XG4gICAgICAgIGlkeCA9IHRoaXMuY29tcGlsZVN0cmluZyhjb250ZW50LCBpZHgsIG91dHB1dClcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgYyA9PT0gJ3wnOlxuICAgICAgICBpZHggPSB0aGlzLmNvbXBpbGVGaWx0ZXIoY29udGVudCwgaWR4LCBvdXRwdXQpXG4gICAgICAgIGJyZWFrXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZHggPSB0aGlzLmNvbXBpbGVMb29rdXAoY29udGVudCwgaWR4LCBvdXRwdXQpXG4gICAgICAgIGJyZWFrXG4gICAgfVxuICB9IHdoaWxlKCsraWR4IDwgY29udGVudC5sZW5ndGgpXG5cbiAgcmV0dXJuIGlkeFxufVxuXG5wcm90by5jb21waWxlID0gZnVuY3Rpb24oY29udGVudCkge1xuICB2YXIgb3V0cHV0ID0gW11cblxuICBpZih0aGlzLmNhY2hlW2NvbnRlbnRdKSB7XG4gICAgcmV0dXJuIHRoaXMuY2FjaGVbY29udGVudF1cbiAgfVxuXG4gIHRoaXMuY29tcGlsZUZ1bGwoY29udGVudCwgMCwgb3V0cHV0KVxuXG4gIG91dHB1dCA9IHRoaXMuY2FjaGVbY29udGVudF0gPSBuZXcgRmlsdGVyQ2hhaW4ob3V0cHV0LCB0aGlzKVxuICBvdXRwdXQuYXR0YWNoKHRoaXMpXG5cbiAgcmV0dXJuIG91dHB1dFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBQcm9taXNlXG5cbmZ1bmN0aW9uIFByb21pc2UoKSB7XG4gIHRoaXMudHJpZ2dlciA9IG51bGxcbn1cblxudmFyIGNvbnMgPSBQcm9taXNlXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by5yZXNvbHZlID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgdmFyIHRyaWdnZXIgPSB0aGlzLnRyaWdnZXJcblxuICBpZighdmFsdWUgfHwgdmFsdWUuY29uc3RydWN0b3IgIT09IGNvbnMpIHtcbiAgICByZXR1cm4gdHJpZ2dlcih2YWx1ZSlcbiAgfVxuXG4gIHZhbHVlLm9uY2UoJ2RvbmUnLCB0cmlnZ2VyKVxufVxuXG5wcm90by5vbmNlID0gZnVuY3Rpb24oZXYsIGZuKSB7XG4gIHRoaXMudHJpZ2dlciA9IGZuXG59XG5cbmNvbnMudG9Qcm9taXNlID0gZnVuY3Rpb24oZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIHByb21pc2lmaWVkKCkge1xuICAgIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMpXG4gICAgICAsIHByb21pc2UgPSBuZXcgY29uc1xuICAgICAgLCBzZWxmID0gdGhpc1xuXG4gICAgYXJncy5wdXNoKG9ucmVhZHkpXG5cbiAgICBzZXRUaW1lb3V0KGJhbmcsIDApXG5cbiAgICByZXR1cm4gcHJvbWlzZVxuXG4gICAgZnVuY3Rpb24gYmFuZygpIHtcbiAgICAgIGZuLmFwcGx5KHNlbGYsIGFyZ3MpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gb25yZWFkeShlcnIsIGRhdGEpIHtcbiAgICAgIHByb21pc2UucmVzb2x2ZShkYXRhKVxuICAgIH1cbiAgfVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBUYWdUb2tlblxuXG52YXIgVG9rZW4gPSByZXF1aXJlKCcuL3Rva2VuJylcblxuZnVuY3Rpb24gVGFnVG9rZW4oY29udGVudCwgbGluZSkge1xuICBUb2tlbi5jYWxsKHRoaXMsIGNvbnRlbnQsIGxpbmUpXG59XG5cbnZhciBjb25zID0gVGFnVG9rZW5cbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlID0gbmV3IFRva2VuXG5cbnByb3RvLmNvbnN0cnVjdG9yID0gY29uc1xuXG5wcm90by5ub2RlID0gZnVuY3Rpb24ocGFyc2VyKSB7XG4gIHZhciB0YWcgPSBwYXJzZXIudGFncy5sb29rdXAodGhpcy5uYW1lKVxuXG4gIHJldHVybiB0YWcodGhpcy5jb250ZW50LCBwYXJzZXIpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IEJsb2NrTm9kZVxuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJy4uL3Byb21pc2UnKVxuICAsIEJsb2NrQ29udGV4dCA9IHJlcXVpcmUoJy4uL2Jsb2NrX2NvbnRleHQnKVxuXG5mdW5jdGlvbiBCbG9ja05vZGUobmFtZSwgbm9kZXMpIHtcbiAgdGhpcy5uYW1lID0gbmFtZVxuICB0aGlzLm5vZGVzID0gbm9kZXNcblxuICB0aGlzLmNvbnRleHQgPSBudWxsXG59XG5cbnZhciBjb25zID0gQmxvY2tOb2RlXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by5yZW5kZXIgPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICAgICwgYmxvY2tDb250ZXh0ID0gQmxvY2tDb250ZXh0LmZyb20oY29udGV4dClcbiAgICAsIHJlc3VsdFxuICAgICwgYmxvY2tcbiAgICAsIHB1c2hcblxuICBpZighYmxvY2tDb250ZXh0KSB7XG4gICAgY29udGV4dC5ibG9jayA9IHNlbGZcbiAgICByZXR1cm4gc2VsZi5ub2Rlcy5yZW5kZXIoY29udGV4dClcbiAgfVxuXG4gIGJsb2NrID0gcHVzaCA9IGJsb2NrQ29udGV4dC5wb3Aoc2VsZi5uYW1lKVxuXG4gIGlmKCFibG9jaykge1xuICAgIGJsb2NrID0gc2VsZlxuICB9XG5cbiAgYmxvY2sgPSBuZXcgQmxvY2tOb2RlKGJsb2NrLm5hbWUsIGJsb2NrLm5vZGVzKVxuXG4gIGJsb2NrLmNvbnRleHQgPSBjb250ZXh0XG4gIGJsb2NrLmNvbnRleHQuYmxvY2sgPSBibG9ja1xuICBjb250ZXh0LmJsb2NrID0gYmxvY2tcblxuICByZXN1bHQgPSBibG9jay5ub2Rlcy5yZW5kZXIoY29udGV4dClcblxuICBpZihwdXNoKSB7XG4gICAgYmxvY2tDb250ZXh0LnB1c2goc2VsZi5uYW1lLCBwdXNoKVxuICB9XG5cbiAgcmV0dXJuIHJlc3VsdFxuXG59XG5cbnByb3RvLmlzQmxvY2tOb2RlID0gdHJ1ZVxuXG5wcm90by5fc3VwZXIgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGJsb2NrQ29udGV4dCA9IEJsb2NrQ29udGV4dC5mcm9tKHRoaXMuY29udGV4dClcbiAgICAsIGJsb2NrXG4gICAgLCBzdHJcblxuICBpZihibG9ja0NvbnRleHQgJiYgKGJsb2NrID0gYmxvY2tDb250ZXh0LmdldCh0aGlzLm5hbWUpKSkge1xuICAgIHN0ciA9IG5ldyBTdHJpbmcoYmxvY2sucmVuZGVyKHRoaXMuY29udGV4dCkpXG4gICAgc3RyLnNhZmUgPSB0cnVlXG4gICAgcmV0dXJuIHN0clxuICB9XG5cbiAgcmV0dXJuICcnXG59XG5cbmNvbnMucGFyc2UgPSBmdW5jdGlvbihjb250ZW50cywgcGFyc2VyKSB7XG4gIHZhciBiaXRzID0gY29udGVudHMuc3BsaXQoJyAnKVxuICAgICwgbmFtZSA9IGJpdHNbMV1cbiAgICAsIGxvYWRlZCA9IHBhcnNlci5sb2FkZWRCbG9ja3NcbiAgICAsIG5vZGVzXG5cbiAgZm9yKHZhciBpID0gMCwgbGVuID0gbG9hZGVkLmxlbmd0aDsgaSA8IGxlbjsgKytpKVxuICAgIGlmKGxvYWRlZFtpXSA9PT0gbmFtZSlcbiAgICAgIHRocm93IG5ldyBFcnJvcignYmxvY2sgdGFnIHdpdGggdGhlIG5hbWUgXCInK25hbWUrJ1wiIGFwcGVhcnMgbW9yZSB0aGFuIG9uY2UnKVxuXG4gIGxvYWRlZC5wdXNoKG5hbWUpXG5cbiAgbm9kZXMgPSBwYXJzZXIucGFyc2UoWydlbmRibG9jayddKVxuICBwYXJzZXIudG9rZW5zLnNoaWZ0KClcblxuICByZXR1cm4gbmV3IGNvbnMobmFtZSwgbm9kZXMpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IENvbW1lbnROb2RlXG5cbmZ1bmN0aW9uIENvbW1lbnROb2RlKCkge1xuICAvLyBuby1vcC5cbn1cblxudmFyIGNvbnMgPSBDb21tZW50Tm9kZVxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8ucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCkge1xuICByZXR1cm4gJydcbn1cblxuY29ucy5wYXJzZSA9IGZ1bmN0aW9uKGNvbnRlbnRzLCBwYXJzZXIpIHtcbiAgbmwgPSBwYXJzZXIucGFyc2UoWydlbmRjb21tZW50J10pXG4gIHBhcnNlci50b2tlbnMuc2hpZnQoKVxuXG4gIHJldHVybiBuZXcgY29uc1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBEZWJ1Z05vZGVcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCcuLi9wcm9taXNlJylcbiAgLCBDb250ZXh0ID0gcmVxdWlyZSgnLi4vY29udGV4dCcpXG4gICwgZGVidWcgPSByZXF1aXJlKCcuLi9kZWJ1ZycpXG5cbmZ1bmN0aW9uIERlYnVnTm9kZSh2YXJuYW1lKSB7XG4gIHRoaXMudmFybmFtZSA9IHZhcm5hbWVcbn1cblxudmFyIGNvbnMgPSBEZWJ1Z05vZGVcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLnJlbmRlciA9IGZ1bmN0aW9uKGNvbnRleHQsIHZhbHVlKSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICAgICwgdGFyZ2V0ID0gY29udGV4dFxuICAgICwgcHJvbWlzZVxuXG4gIGlmKHNlbGYudmFybmFtZSAhPT0gbnVsbCkge1xuICAgIHZhbHVlID0gYXJndW1lbnRzLmxlbmd0aCA9PT0gMiA/IHZhbHVlIDogc2VsZi52YXJuYW1lLnJlc29sdmUoY29udGV4dClcbiAgICBpZih2YWx1ZSAmJiB2YWx1ZS5jb25zdHJ1Y3RvciA9PT0gUHJvbWlzZSkge1xuICAgICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG4gICAgICB2YWx1ZS5vbmNlKCdkb25lJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBwcm9taXNlLnJlc29sdmUoc2VsZi5yZW5kZXIoY29udGV4dCwgZGF0YSkpXG4gICAgICB9KVxuICAgICAgcmV0dXJuIHByb21pc2VcbiAgICB9XG4gICAgdGFyZ2V0ID0gdmFsdWVcbiAgfVxuXG4gIGlmKHRhcmdldCA9PT0gY29udGV4dCkge1xuICAgIHdoaWxlKHRhcmdldCAhPT0gQ29udGV4dC5wcm90b3R5cGUpIHtcbiAgICAgIGRlYnVnLmxvZyh0YXJnZXQpXG4gICAgICB0YXJnZXQgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YodGFyZ2V0KVxuICAgIH1cbiAgICByZXR1cm4gJydcbiAgfVxuICBkZWJ1Zy5sb2codGFyZ2V0KVxuICByZXR1cm4gJydcbn1cblxuY29ucy5wYXJzZSA9IGZ1bmN0aW9uKGNvbnRlbnRzLCBwYXJzZXIpIHtcbiAgdmFyIGJpdHMgPSBjb250ZW50cy5zcGxpdCgnICcpXG5cbiAgcmV0dXJuIG5ldyBEZWJ1Z05vZGUoYml0c1sxXSA/IHBhcnNlci5jb21waWxlKGJpdHNbMV0pIDogbnVsbClcbn1cblxuIiwibW9kdWxlLmV4cG9ydHMgPSBFeHRlbmRzTm9kZVxuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJy4uL3Byb21pc2UnKVxuICAsIEJsb2NrQ29udGV4dCA9IHJlcXVpcmUoJy4uL2Jsb2NrX2NvbnRleHQnKVxuXG5cbmZ1bmN0aW9uIEV4dGVuZHNOb2RlKHBhcmVudCwgbm9kZXMsIGxvYWRlcikge1xuICB0aGlzLnBhcmVudCA9IHBhcmVudFxuICB0aGlzLmxvYWRlciA9IGxvYWRlclxuXG4gIHRoaXMuYmxvY2tzID0ge31cblxuICBmb3IodmFyIGkgPSAwLCBsZW4gPSBub2Rlcy5ub2Rlcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIGlmKCFub2Rlcy5ub2Rlc1tpXS5pc0Jsb2NrTm9kZSlcbiAgICAgIGNvbnRpbnVlXG5cbiAgICB0aGlzLmJsb2Nrc1tub2Rlcy5ub2Rlc1tpXS5uYW1lXSA9IG5vZGVzLm5vZGVzW2ldXG4gIH1cbn1cblxudmFyIGNvbnMgPSBFeHRlbmRzTm9kZVxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8uaXNFeHRlbmRzTm9kZSA9IHRydWVcblxucHJvdG8ucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCwgcGFyZW50KSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICAgICwgcHJvbWlzZVxuXG4gIHBhcmVudCA9IHBhcmVudCB8fCB0aGlzLnBhcmVudC5yZXNvbHZlKGNvbnRleHQpXG5cbiAgaWYocGFyZW50LmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG5cbiAgICBwYXJlbnQub25jZSgnZG9uZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHByb21pc2UucmVzb2x2ZShzZWxmLnJlbmRlcihjb250ZXh0LCBkYXRhKSlcbiAgICB9KVxuXG4gICAgcmV0dXJuIHByb21pc2VcbiAgfVxuXG4gIHBhcmVudCA9IHNlbGYuZ2V0X3RlbXBsYXRlKHBhcmVudClcblxuICBpZihwYXJlbnQuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcbiAgICBwcm9taXNlID0gbmV3IFByb21pc2VcblxuICAgIHBhcmVudC5vbmNlKCdkb25lJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcHJvbWlzZS5yZXNvbHZlKHNlbGYucmVuZGVyKGNvbnRleHQsIGRhdGEpKVxuICAgIH0pXG5cbiAgICByZXR1cm4gcHJvbWlzZVxuICB9XG5cbiAgdmFyIGJsb2NrQ29udGV4dCA9IEJsb2NrQ29udGV4dC5mcm9tKGNvbnRleHQpIHx8IEJsb2NrQ29udGV4dC5pbnRvKGNvbnRleHQpXG4gICAgLCBibG9ja3MgPSB7fVxuICAgICwgbm9kZUxpc3QgPSBwYXJlbnQuZ2V0Tm9kZUxpc3QoKVxuICAgICwgZXh0ZW5kc0lEWCA9IGZhbHNlXG5cbiAgYmxvY2tDb250ZXh0LmFkZChzZWxmLmJsb2NrcylcblxuICBmb3IodmFyIGkgPSAwLCBsZW4gPSBub2RlTGlzdC5ub2Rlcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIGlmKG5vZGVMaXN0Lm5vZGVzW2ldLmlzRXh0ZW5kc05vZGUpIHtcbiAgICAgIGV4dGVuZHNJRFggPSB0cnVlXG4gICAgICBicmVha1xuICAgIH1cblxuICAgIGlmKG5vZGVMaXN0Lm5vZGVzW2ldLmlzQmxvY2tOb2RlKSB7XG4gICAgICBibG9ja3Nbbm9kZUxpc3Qubm9kZXNbaV0ubmFtZV0gPSBub2RlTGlzdC5ub2Rlc1tpXVxuICAgIH1cbiAgfVxuXG4gIGlmKCFleHRlbmRzSURYKSB7XG4gICAgYmxvY2tDb250ZXh0LmFkZChibG9ja3MpXG4gIH1cblxuICBwcm9taXNlID0gbmV3IFByb21pc2VcblxuICBwYXJlbnQucmVuZGVyKGNvbnRleHQsIGZ1bmN0aW9uKGVyciwgZGF0YSkge1xuICAgIHByb21pc2UucmVzb2x2ZShkYXRhKVxuICB9KVxuXG4gIHJldHVybiBwcm9taXNlXG59XG5cbnByb3RvLmdldF90ZW1wbGF0ZSA9IGZ1bmN0aW9uKHBhcmVudCkge1xuICBpZih0eXBlb2YgcGFyZW50ICE9PSAnc3RyaW5nJykge1xuICAgIHJldHVybiBwYXJlbnRcbiAgfVxuXG4gIHJldHVybiB0aGlzLmxvYWRlcihwYXJlbnQpXG59XG5cbmNvbnMucGFyc2UgPSBmdW5jdGlvbihjb250ZW50cywgcGFyc2VyKSB7XG4gIHZhciBiaXRzID0gY29udGVudHMuc3BsaXQoJyAnKVxuICAgICwgcGFyZW50ID0gcGFyc2VyLmNvbXBpbGUoYml0cy5zbGljZSgxKS5qb2luKCcgJykpXG4gICAgLCBub2RlcyA9IHBhcnNlci5wYXJzZSgpXG4gICAgLCBsb2FkZXIgPSBwYXJzZXIucGx1Z2lucy5sb29rdXAoJ2xvYWRlcicpXG5cbiAgcmV0dXJuIG5ldyBjb25zKHBhcmVudCwgbm9kZXMsIGxvYWRlcilcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gRm9yTm9kZVxuXG52YXIgTm9kZUxpc3QgPSByZXF1aXJlKCcuLi9ub2RlX2xpc3QnKVxuICAsIFByb21pc2UgPSByZXF1aXJlKCcuLi9wcm9taXNlJylcblxuZnVuY3Rpb24gRm9yTm9kZSh0YXJnZXQsIHVucGFjaywgbG9vcCwgZW1wdHksIHJldmVyc2VkKSB7XG4gIHRoaXMudGFyZ2V0ID0gdGFyZ2V0XG4gIHRoaXMudW5wYWNrID0gdW5wYWNrXG4gIHRoaXMubG9vcCA9IGxvb3BcbiAgdGhpcy5lbXB0eSA9IGVtcHR5XG4gIHRoaXMucmV2ZXJzZWQgPSByZXZlcnNlZFxufVxuXG52YXIgY29ucyA9IEZvck5vZGVcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbmZ1bmN0aW9uIGdldEluSW5kZXgoYml0cykge1xuICBmb3IodmFyIGkgPSAwLCBsZW4gPSBiaXRzLmxlbmd0aDsgaSA8IGxlbjsgKytpKVxuICAgIGlmKGJpdHNbaV0gPT09ICdpbicpXG4gICAgICByZXR1cm4gaVxuXG4gIHJldHVybiAtMVxufVxuXG5wcm90by5yZW5kZXIgPSBmdW5jdGlvbihjb250ZXh0LCB2YWx1ZSkge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgICAsIGFyciA9IHZhbHVlIHx8IHNlbGYudGFyZ2V0LnJlc29sdmUoY29udGV4dClcbiAgICAsIHByb21pc2VcblxuXG4gIGlmKGFyciAmJiBhcnIuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcbiAgICBwcm9taXNlID0gbmV3IFByb21pc2VcbiAgICBhcnIub25jZSgnZG9uZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHByb21pc2UucmVzb2x2ZShzZWxmLnJlbmRlcihjb250ZXh0LCBkYXRhKSlcbiAgICB9KVxuXG4gICAgcmV0dXJuIHByb21pc2VcbiAgfVxuXG4gIGlmKGFyciA9PT0gdW5kZWZpbmVkIHx8IGFyciA9PT0gbnVsbCkge1xuICAgIGFyciA9IFtdXG4gIH1cblxuICB2YXIgYml0cyA9IFtdXG4gICAgLCBwcm9taXNlcyA9IFtdXG4gICAgLCBwYXJlbnQgPSBjb250ZXh0LmZvcmxvb3BcbiAgICAsIGxvb3AgPSB7fVxuICAgICwgcmVzdWx0XG4gICAgLCBjdHh0XG4gICAgLCBzdWJcblxuICBpZighKCdsZW5ndGgnIGluIGFycikpIHtcbiAgICBmb3IodmFyIGtleSBpbiBhcnIpIGlmKGFyci5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICBiaXRzLnB1c2goa2V5KVxuICAgIH1cblxuICAgIGFyciA9IGJpdHMuc2xpY2UoKVxuICAgIGJpdHMubGVuZ3RoID0gMFxuICB9XG5cbiAgaWYoIWFyci5sZW5ndGgpIHtcbiAgICByZXR1cm4gc2VsZi5lbXB0eS5yZW5kZXIoY29udGV4dClcbiAgfVxuXG4gIHN1YiA9IHNlbGYucmV2ZXJzZWQgPyBhcnIubGVuZ3RoIC0gMSA6IDBcblxuICBmb3IodmFyIGkgPSAwLCBsZW4gPSBhcnIubGVuZ3RoLCBpZHg7IGkgPCBsZW47ICsraSkge1xuICAgIGN0eHQgPSBjb250ZXh0LmNvcHkoKVxuICAgIGlkeCA9IE1hdGguYWJzKHN1YiAtIGkpXG4gICAgbG9vcC5jb3VudGVyID0gaSArIDFcbiAgICBsb29wLmNvdW50ZXIwID0gaVxuICAgIGxvb3AucmV2Y291bnRlciA9IGxlbiAtIGlcbiAgICBsb29wLnJldmNvdW50ZXIwID0gbGVuIC0gKGkgKyAxKVxuICAgIGxvb3AuZmlyc3QgPSBpID09PSAwXG4gICAgbG9vcC5sYXN0ID0gaSA9PT0gbGVuIC0gMVxuICAgIGxvb3AucGFyZW50bG9vcCA9IHBhcmVudFxuICAgIGN0eHQuZm9ybG9vcCA9IGxvb3BcblxuICAgIGlmKHNlbGYudW5wYWNrLmxlbmd0aCA9PT0gMSlcbiAgICAgIGN0eHRbc2VsZi51bnBhY2tbMF1dID0gYXJyW2lkeF1cbiAgICBlbHNlIGZvcih2YXIgdSA9IDA7IHUgPCBzZWxmLnVucGFjay5sZW5ndGg7ICsrdSlcbiAgICAgIGN0eHRbc2VsZi51bnBhY2tbdV1dID0gYXJyW2lkeF1bdV1cblxuICAgIHJlc3VsdCA9IHNlbGYubG9vcC5yZW5kZXIoY3R4dClcbiAgICBpZihyZXN1bHQuY29uc3RydWN0b3IgPT09IFByb21pc2UpXG4gICAgICBwcm9taXNlcy5wdXNoKHJlc3VsdClcblxuICAgIGJpdHMucHVzaChyZXN1bHQpXG4gIH1cblxuICBpZihwcm9taXNlcy5sZW5ndGgpIHtcbiAgICByZXR1cm4gc2VsZi5sb29wLnJlc29sdmVQcm9taXNlcyhiaXRzLCBwcm9taXNlcylcbiAgfVxuXG4gIHJldHVybiBiaXRzLmpvaW4oJycpXG59XG5cbmNvbnMucGFyc2UgPSBmdW5jdGlvbihjb250ZW50cywgcGFyc2VyKSB7XG4gIHZhciBiaXRzID0gY29udGVudHMuc3BsaXQoL1xccysvKVxuICAgICwgcmV2ZXJzZWQgPSBiaXRzW2JpdHMubGVuZ3RoLTFdID09PSAncmV2ZXJzZWQnXG4gICAgLCBpZHhJbiA9IGdldEluSW5kZXgoYml0cylcbiAgICAsIHZhcmlhYmxlcyA9IGJpdHMuc2xpY2UoMSwgaWR4SW4pXG4gICAgLCB0YXJnZXQgPSBwYXJzZXIuY29tcGlsZShiaXRzW2lkeEluKzFdKVxuICAgICwgbm9kZWxpc3QgPSBwYXJzZXIucGFyc2UoWydlbXB0eScsICdlbmRmb3InXSlcbiAgICAsIHVucGFjayA9IFtdXG4gICAgLCBlbXB0eVxuXG5cbiAgaWYocGFyc2VyLnRva2Vucy5zaGlmdCgpLmlzKFsnZW1wdHknXSkpIHtcbiAgICBlbXB0eSA9IHBhcnNlci5wYXJzZShbJ2VuZGZvciddKVxuICAgIHBhcnNlci50b2tlbnMuc2hpZnQoKVxuICB9IGVsc2Uge1xuICAgIGVtcHR5ID0gbmV3IE5vZGVMaXN0KFtdKVxuICB9XG5cbiAgdmFyaWFibGVzID0gdmFyaWFibGVzLmpvaW4oJyAnKS5zcGxpdCgnLCcpXG4gIGZvcih2YXIgaSA9IDAsIGxlbiA9IHZhcmlhYmxlcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIHZhcmlhYmxlc1tpXSA9IHZhcmlhYmxlc1tpXS5yZXBsYWNlKC8oXlxccyt8XFxzKyQpLywgJycpXG4gICAgaWYodmFyaWFibGVzW2ldKVxuICAgICAgdW5wYWNrLnB1c2godmFyaWFibGVzW2ldKVxuICB9XG5cbiAgcmV0dXJuIG5ldyBjb25zKHRhcmdldCwgdW5wYWNrLCBub2RlbGlzdCwgZW1wdHksIHJldmVyc2VkKTtcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gRW5kVG9rZW5cblxuZnVuY3Rpb24gRW5kVG9rZW4oKSB7XG4gIHRoaXMubGJwID0gMFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBJbmZpeE9wZXJhdG9yXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi4vLi4vcHJvbWlzZScpXG5cbmZ1bmN0aW9uIEluZml4T3BlcmF0b3IoYnAsIGNtcCkge1xuICB0aGlzLmxicCA9IGJwXG4gIHRoaXMuY21wID0gY21wXG5cbiAgdGhpcy5maXJzdCA9XG4gIHRoaXMuc2Vjb25kID0gbnVsbFxufVxuXG52YXIgY29ucyA9IEluZml4T3BlcmF0b3JcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLm51ZCA9IGZ1bmN0aW9uKHBhcnNlcikge1xuICB0aHJvdyBuZXcgRXJyb3IoXCJVbmV4cGVjdGVkIHRva2VuXCIpXG59XG5cbnByb3RvLmxlZCA9IGZ1bmN0aW9uKGxocywgcGFyc2VyKSB7XG4gIHRoaXMuZmlyc3QgPSBsaHNcbiAgdGhpcy5zZWNvbmQgPSBwYXJzZXIuZXhwcmVzc2lvbih0aGlzLmxicClcbiAgcmV0dXJuIHRoaXNcbn1cblxucHJvdG8uZXZhbHVhdGUgPSBmdW5jdGlvbihjb250ZXh0LCBmaXJzdCwgc2Vjb25kLCBzZW50Rmlyc3QsIHNlbnRTZWNvbmQpIHtcbiAgdmFyIHNlbGYgPSB0aGlzXG4gICAgLCBwcm9taXNlXG5cbiAgZmlyc3QgPSBzZW50Rmlyc3QgPyBmaXJzdCA6IHNlbGYuZmlyc3QuZXZhbHVhdGUoY29udGV4dClcblxuICBpZihmaXJzdCAmJiBmaXJzdC5jb25zdHJ1Y3RvciA9PT0gUHJvbWlzZSkge1xuICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuXG4gICAgZmlyc3Qub25jZSgnZG9uZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHByb21pc2UucmVzb2x2ZShzZWxmLmV2YWx1YXRlKGNvbnRleHQsIGRhdGEsIG51bGwsIHRydWUsIGZhbHNlKSlcbiAgICB9KVxuXG4gICAgcmV0dXJuIHByb21pc2VcbiAgfVxuXG4gIHNlY29uZCA9IHNlbnRTZWNvbmQgPyBzZWNvbmQgOiBzZWxmLnNlY29uZC5ldmFsdWF0ZShjb250ZXh0KVxuXG4gIGlmKHNlY29uZCAmJiBzZWNvbmQuY29uc3RydWN0b3IgPT09IFByb21pc2UpIHtcbiAgICBwcm9taXNlID0gbmV3IFByb21pc2VcblxuICAgIHNlY29uZC5vbmNlKCdkb25lJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcHJvbWlzZS5yZXNvbHZlKHNlbGYuZXZhbHVhdGUoY29udGV4dCwgZmlyc3QsIGRhdGEsIHRydWUsIHRydWUpKVxuICAgIH0pXG5cbiAgICByZXR1cm4gcHJvbWlzZVxuICB9XG5cbiAgcmV0dXJuIHNlbGYuY21wKGZpcnN0LCBzZWNvbmQpXG59XG5cbiIsIm1vZHVsZS5leHBvcnRzID0gTGl0ZXJhbFRva2VuXG5cbmZ1bmN0aW9uIExpdGVyYWxUb2tlbih2YWx1ZSwgb3JpZ2luYWwpIHtcbiAgdGhpcy5sYnAgPSAwXG4gIHRoaXMudmFsdWUgPSB2YWx1ZVxufVxuXG52YXIgY29ucyA9IExpdGVyYWxUb2tlblxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8ubnVkID0gZnVuY3Rpb24ocGFyc2VyKSB7XG4gIHJldHVybiB0aGlzXG59XG5cbnByb3RvLmxlZCA9IGZ1bmN0aW9uKCkge1xuICB0aHJvdyBuZXcgRXJyb3IoKVxufVxuXG5wcm90by5ldmFsdWF0ZSA9IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgaWYoIXRoaXMudmFsdWUpXG4gICAgcmV0dXJuIHRoaXMudmFsdWVcblxuICBpZighdGhpcy52YWx1ZS5yZXNvbHZlKVxuICAgIHJldHVybiB0aGlzLnZhbHVlXG5cbiAgcmV0dXJuIHRoaXMudmFsdWUucmVzb2x2ZShjb250ZXh0KVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBJZk5vZGVcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCcuLi8uLi9wcm9taXNlJylcbiAgLCBOb2RlTGlzdCA9IHJlcXVpcmUoJy4uLy4uL25vZGVfbGlzdCcpXG4gICwgUGFyc2VyID0gcmVxdWlyZSgnLi9wYXJzZXInKVxuXG5mdW5jdGlvbiBJZk5vZGUocHJlZGljYXRlLCB3aGVuX3RydWUsIHdoZW5fZmFsc2UpIHtcbiAgdGhpcy5wcmVkaWNhdGUgPSBwcmVkaWNhdGVcbiAgdGhpcy53aGVuX3RydWUgPSB3aGVuX3RydWVcbiAgdGhpcy53aGVuX2ZhbHNlID0gd2hlbl9mYWxzZVxufVxuXG52YXIgY29ucyA9IElmTm9kZVxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcblxucHJvdG8ucmVuZGVyID0gZnVuY3Rpb24oY29udGV4dCwgcmVzdWx0LCB0aW1lcykge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgICAsIHByb21pc2VcblxuICByZXN1bHQgPSB0aW1lcyA9PT0gMSA/IHJlc3VsdCA6IHRoaXMucHJlZGljYXRlLmV2YWx1YXRlKGNvbnRleHQpXG5cbiAgaWYocmVzdWx0ICYmIHJlc3VsdC5jb25zdHJ1Y3RvciA9PT0gUHJvbWlzZSkge1xuICAgIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuXG4gICAgcmVzdWx0Lm9uY2UoJ2RvbmUnLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgcHJvbWlzZS5yZXNvbHZlKHNlbGYucmVuZGVyKGNvbnRleHQsIHZhbHVlLCAxKSlcbiAgICB9KVxuXG4gICAgcmV0dXJuIHByb21pc2VcbiAgfVxuXG4gIGlmKHJlc3VsdCkge1xuICAgIHJldHVybiB0aGlzLndoZW5fdHJ1ZS5yZW5kZXIoY29udGV4dClcbiAgfVxuICByZXR1cm4gdGhpcy53aGVuX2ZhbHNlLnJlbmRlcihjb250ZXh0KVxufVxuXG5jb25zLnBhcnNlID0gZnVuY3Rpb24oY29udGVudHMsIHBhcnNlcikge1xuICB2YXIgYml0cyA9IGNvbnRlbnRzLnNwbGl0KCcgJykuc2xpY2UoMSlcbiAgICAsIGlmcCA9IG5ldyBQYXJzZXIoYml0cywgcGFyc2VyKVxuICAgICwgcHJlZGljYXRlXG4gICAgLCB3aGVuX3RydWVcbiAgICAsIHdoZW5fZmFsc2VcbiAgICAsIG5leHRcblxuICBwcmVkaWNhdGUgPSBpZnAucGFyc2UoKVxuXG4gIHdoZW5fdHJ1ZSA9IHBhcnNlci5wYXJzZShbJ2Vsc2UnLCAnZWxpZicsICdlbmRpZiddKVxuXG4gIG5leHQgPSBwYXJzZXIudG9rZW5zLnNoaWZ0KClcblxuICBpZihuZXh0LmlzKFsnZW5kaWYnXSkpIHtcbiAgICB3aGVuX2ZhbHNlID0gbmV3IE5vZGVMaXN0KFtdKVxuICB9IGVsc2UgaWYobmV4dC5pcyhbJ2VsaWYnXSkpIHtcbiAgICB3aGVuX2ZhbHNlID0gY29ucy5wYXJzZShuZXh0LmNvbnRlbnQsIHBhcnNlcilcbiAgfSBlbHNlIHtcbiAgICB3aGVuX2ZhbHNlID0gcGFyc2VyLnBhcnNlKFsnZW5kaWYnXSlcbiAgICBwYXJzZXIudG9rZW5zLnNoaWZ0KClcbiAgfVxuXG4gIHJldHVybiBuZXcgY29ucyhwcmVkaWNhdGUsIHdoZW5fdHJ1ZSwgd2hlbl9mYWxzZSlcbn1cbiIsInZhciBJbmZpeE9wZXJhdG9yID0gcmVxdWlyZSgnLi9pbmZpeCcpXG4gICwgUHJlZml4T3BlcmF0b3IgPSByZXF1aXJlKCcuL3ByZWZpeCcpXG5cbnZhciBrZXlzXG5cbmtleXMgPSBPYmplY3Qua2V5cyB8fCBrZXlzaGltXG5cbmZ1bmN0aW9uIGtleXNoaW0ob2JqKSB7XG4gIHZhciBhY2N1bSA9IFtdXG5cbiAgZm9yKHZhciBuIGluIG9iaikgaWYob2JqLmhhc093blByb3BlcnR5KG4pKSB7XG4gICAgYWNjdW0ucHVzaChuKVxuICB9XG5cbiAgcmV0dXJuIGFjY3VtXG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgICdvcic6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBJbmZpeE9wZXJhdG9yKDYsIGZ1bmN0aW9uKHgsIHkpIHtcbiAgICAgICAgICByZXR1cm4geCB8fCB5XG4gICAgICB9KVxuICAgIH1cblxuICAsICdhbmQnOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgSW5maXhPcGVyYXRvcig3LCBmdW5jdGlvbih4LCB5KSB7XG4gICAgICAgICAgcmV0dXJuIHggJiYgeVxuICAgICAgfSlcbiAgICB9XG5cbiAgLCAnbm90JzogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IFByZWZpeE9wZXJhdG9yKDgsIGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgcmV0dXJuICF4XG4gICAgICB9KVxuICAgIH1cblxuICAsICdpbic6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBJbmZpeE9wZXJhdG9yKDksIGluX29wZXJhdG9yKVxuICAgIH1cblxuICAsICdub3QgaW4nOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEluZml4T3BlcmF0b3IoOSwgZnVuY3Rpb24oeCwgeSkge1xuICAgICAgcmV0dXJuICFpbl9vcGVyYXRvcih4LHkpXG4gICAgfSlcbiAgfVxuXG4gICwgJz0nOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IEluZml4T3BlcmF0b3IoMTAsIGZ1bmN0aW9uKHgsIHkpIHtcbiAgICAgIHJldHVybiB4ID09IHlcbiAgICB9KVxuICB9XG5cbiAgLCAnPT0nOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgSW5maXhPcGVyYXRvcigxMCwgZnVuY3Rpb24oeCwgeSkge1xuICAgICAgICByZXR1cm4geCA9PSB5XG4gICAgICB9KVxuICAgIH1cblxuICAsICchPSc6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBJbmZpeE9wZXJhdG9yKDEwLCBmdW5jdGlvbih4LCB5KSB7XG4gICAgICAgIHJldHVybiB4ICE9PSB5XG4gICAgICB9KVxuICAgIH1cblxuICAsICc+JzogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IEluZml4T3BlcmF0b3IoMTAsIGZ1bmN0aW9uKHgsIHkpIHtcbiAgICAgICAgcmV0dXJuIHggPiB5XG4gICAgICB9KVxuICAgIH1cblxuICAsICc+PSc6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBJbmZpeE9wZXJhdG9yKDEwLCBmdW5jdGlvbih4LCB5KSB7XG4gICAgICAgIHJldHVybiB4ID49IHlcbiAgICAgIH0pXG4gICAgfVxuXG4gICwgJzwnOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgSW5maXhPcGVyYXRvcigxMCwgZnVuY3Rpb24oeCwgeSkge1xuICAgICAgICByZXR1cm4geCA8IHlcbiAgICAgIH0pXG4gICAgfVxuXG4gICwgJzw9JzogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IEluZml4T3BlcmF0b3IoMTAsIGZ1bmN0aW9uKHgsIHkpIHtcbiAgICAgICAgcmV0dXJuIHggPD0geVxuICAgICAgfSlcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGluX29wZXJhdG9yKHgsIHkpIHtcbiAgaWYoISh4IGluc3RhbmNlb2YgT2JqZWN0KSAmJiB5IGluc3RhbmNlb2YgT2JqZWN0KSB7XG4gICAgaWYoISh5ICYmICdsZW5ndGgnIGluIHkpKSB7XG4gICAgICB5ID0ga2V5cyh5KVxuICAgIH1cbiAgfVxuXG4gIGlmKHR5cGVvZih4KSA9PSAnc3RyaW5nJyAmJiB0eXBlb2YoeSkgPT0nc3RyaW5nJykge1xuICAgIHJldHVybiB5LmluZGV4T2YoeCkgIT09IC0xXG4gIH1cblxuICBpZih4ID09PSB1bmRlZmluZWQgfHwgeCA9PT0gbnVsbClcbiAgICByZXR1cm4gZmFsc2VcblxuICBpZih5ID09PSB1bmRlZmluZWQgfHwgeSA9PT0gbnVsbClcbiAgICByZXR1cm4gZmFsc2VcblxuICBmb3IodmFyIGZvdW5kID0gZmFsc2UsIGkgPSAwLCBsZW4gPSB5Lmxlbmd0aDsgaSA8IGxlbiAmJiAhZm91bmQ7ICsraSkge1xuICAgIHZhciByaHMgPSB5W2ldXG4gICAgaWYoeCBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICBmb3IodmFyIGlkeCA9IDAsXG4gICAgICAgIGVxdWFsID0geC5sZW5ndGggPT0gcmhzLmxlbmd0aCxcbiAgICAgICAgeGxlbiA9IHgubGVuZ3RoO1xuICAgICAgICBpZHggPCB4bGVuICYmIGVxdWFsOyArK2lkeCkge1xuXG4gICAgICAgIGVxdWFsID0gKHhbaWR4XSA9PT0gcmhzW2lkeF0pXG4gICAgICB9XG4gICAgICBmb3VuZCA9IGVxdWFsXG5cbiAgICB9IGVsc2UgaWYoeCBpbnN0YW5jZW9mIE9iamVjdCkge1xuICAgICAgaWYoeCA9PT0gcmhzKSB7XG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9XG4gICAgICB2YXIgeGtleXMgPSBrZXlzKHgpLFxuICAgICAgICBya2V5cyA9IGtleXMocmhzKVxuXG4gICAgICBpZih4a2V5cy5sZW5ndGggPT09IHJrZXlzLmxlbmd0aCkge1xuICAgICAgICBmb3IodmFyIGkgPSAwLCBsZW4gPSB4a2V5cy5sZW5ndGgsIGVxdWFsID0gdHJ1ZTtcbiAgICAgICAgICBpIDwgbGVuICYmIGVxdWFsO1xuICAgICAgICAgICsraSkge1xuICAgICAgICAgIGVxdWFsID0geGtleXNbaV0gPT09IHJrZXlzW2ldICYmXG4gICAgICAgICAgICAgIHhbeGtleXNbaV1dID09PSByaHNbcmtleXNbaV1dXG4gICAgICAgIH1cbiAgICAgICAgZm91bmQgPSBlcXVhbFxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBmb3VuZCA9IHggPT0gcmhzXG4gICAgfVxuICB9XG4gIHJldHVybiBmb3VuZFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBJZlBhcnNlclxuXG52YXIgTGl0ZXJhbFRva2VuID0gcmVxdWlyZSgnLi9saXRlcmFsJylcbiAgLCBFbmRUb2tlbiA9IHJlcXVpcmUoJy4vZW5kJylcbiAgLCBvcGVyYXRvcnMgPSByZXF1aXJlKCcuL29wZXJhdG9ycycpXG5cbmZ1bmN0aW9uIElmUGFyc2VyKHRva2VucywgcGFyc2VyKSB7XG4gIHRoaXMuY3JlYXRlVmFyaWFibGUgPSBmdW5jdGlvbih0b2tlbikge1xuICAgIHJldHVybiBuZXcgTGl0ZXJhbFRva2VuKHBhcnNlci5jb21waWxlKHRva2VuKSwgdG9rZW4pXG4gIH1cblxuICB2YXIgbGVuID0gdG9rZW5zLmxlbmd0aFxuICAgICwgaSA9IDBcbiAgICAsIG1hcHBlZFRva2VucyA9IFtdXG4gICAgLCB0b2tlblxuXG4gIHdoaWxlKGkgPCBsZW4pIHtcbiAgICB0b2tlbiA9IHRva2Vuc1tpXVxuICAgIGlmKHRva2VuID09ICdub3QnICYmIHRva2Vuc1tpKzFdID09ICdpbicpIHtcbiAgICAgICsraVxuICAgICAgdG9rZW4gPSAnbm90IGluJ1xuICAgIH1cbiAgICBtYXBwZWRUb2tlbnMucHVzaCh0aGlzLnRyYW5zbGF0ZVRva2VuKHRva2VuKSlcbiAgICArK2lcbiAgfVxuXG4gIHRoaXMucG9zID0gMFxuICB0aGlzLnRva2VucyA9IG1hcHBlZFRva2Vuc1xuICB0aGlzLmN1cnJlbnRUb2tlbiA9IHRoaXMubmV4dCgpXG59XG5cbnZhciBjb25zID0gSWZQYXJzZXJcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLnRyYW5zbGF0ZVRva2VuID0gZnVuY3Rpb24odG9rZW4pIHtcbiAgdmFyIG9wID0gb3BlcmF0b3JzW3Rva2VuXVxuXG4gIGlmKG9wID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gdGhpcy5jcmVhdGVWYXJpYWJsZSh0b2tlbilcbiAgfVxuXG4gIHJldHVybiBvcCgpXG59XG5cbnByb3RvLm5leHQgPSBmdW5jdGlvbigpIHtcbiAgaWYodGhpcy5wb3MgPj0gdGhpcy50b2tlbnMubGVuZ3RoKSB7XG4gICAgcmV0dXJuIG5ldyBFbmRUb2tlbigpXG4gIH1cbiAgcmV0dXJuIHRoaXMudG9rZW5zW3RoaXMucG9zKytdXG59XG5cbnByb3RvLnBhcnNlID0gZnVuY3Rpb24oKSB7XG4gIHZhciByZXR2YWwgPSB0aGlzLmV4cHJlc3Npb24oKVxuXG4gIGlmKCEodGhpcy5jdXJyZW50VG9rZW4uY29uc3RydWN0b3IgPT09IEVuZFRva2VuKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIlVudXNlZCBcIit0aGlzLmN1cnJlbnRUb2tlbitcIiBhdCBlbmQgb2YgaWYgZXhwcmVzc2lvbi5cIilcbiAgfVxuXG4gIHJldHVybiByZXR2YWxcbn1cblxucHJvdG8uZXhwcmVzc2lvbiA9IGZ1bmN0aW9uKHJicCkge1xuICByYnAgPSByYnAgfHwgMFxuXG4gIHZhciB0ID0gdGhpcy5jdXJyZW50VG9rZW5cbiAgICAsIGxlZnRcblxuICB0aGlzLmN1cnJlbnRUb2tlbiA9IHRoaXMubmV4dCgpXG5cbiAgbGVmdCA9IHQubnVkKHRoaXMpXG4gIHdoaWxlKHJicCA8IHRoaXMuY3VycmVudFRva2VuLmxicCkge1xuICAgIHQgPSB0aGlzLmN1cnJlbnRUb2tlblxuXG4gICAgdGhpcy5jdXJyZW50VG9rZW4gPSB0aGlzLm5leHQoKVxuXG4gICAgbGVmdCA9IHQubGVkKGxlZnQsIHRoaXMpXG4gIH1cblxuICByZXR1cm4gbGVmdFxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBQcmVmaXhPcGVyYXRvclxuXG52YXIgUHJvbWlzZSA9IHJlcXVpcmUoJy4uLy4uL3Byb21pc2UnKVxuXG5mdW5jdGlvbiBQcmVmaXhPcGVyYXRvcihicCwgY21wKSB7XG4gIHRoaXMubGJwID0gYnBcbiAgdGhpcy5jbXAgPSBjbXBcblxuICB0aGlzLmZpcnN0ID1cbiAgdGhpcy5zZWNvbmQgPSBudWxsXG59XG5cbnZhciBjb25zID0gUHJlZml4T3BlcmF0b3JcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbnByb3RvLm51ZCA9IGZ1bmN0aW9uKHBhcnNlcikge1xuICB0aGlzLmZpcnN0ID0gcGFyc2VyLmV4cHJlc3Npb24odGhpcy5sYnApXG4gIHRoaXMuc2Vjb25kID0gbnVsbFxuICByZXR1cm4gdGhpc1xufVxuXG5wcm90by5sZWQgPSBmdW5jdGlvbihmaXJzdCwgcGFyc2VyKSB7XG4gIHRocm93IG5ldyBFcnJvcihcIlVuZXhwZWN0ZWQgdG9rZW5cIilcbn1cblxucHJvdG8uZXZhbHVhdGUgPSBmdW5jdGlvbihjb250ZXh0LCBmaXJzdCwgdGltZXMpIHtcbiAgdmFyIHNlbGYgPSB0aGlzXG4gICAgLCBwcm9taXNlXG5cbiAgZmlyc3QgPSB0aW1lcyA9PT0gMSA/IGZpcnN0IDogc2VsZi5maXJzdC5ldmFsdWF0ZShjb250ZXh0KVxuXG4gIGlmKGZpcnN0ICYmIGZpcnN0LmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG5cbiAgICBmaXJzdC5vbmNlKCdkb25lJywgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgcHJvbWlzZS5yZXNvbHZlKHNlbGYuZXZhbHVhdGUoY29udGV4dCwgZGF0YSwgMSkpXG4gICAgfSlcblxuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxuICByZXR1cm4gc2VsZi5jbXAoZmlyc3QpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IEluY2x1ZGVOb2RlXG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnLi4vcHJvbWlzZScpXG5cbmZ1bmN0aW9uIEluY2x1ZGVOb2RlKHRhcmdldF92YXIsIGxvYWRlcikge1xuICB0aGlzLnRhcmdldF92YXIgPSB0YXJnZXRfdmFyXG4gIHRoaXMubG9hZGVyID0gbG9hZGVyXG59XG5cbnZhciBjb25zID0gSW5jbHVkZU5vZGVcbiAgLCBwcm90byA9IGNvbnMucHJvdG90eXBlXG5cbmNvbnMucGFyc2UgPSBmdW5jdGlvbihjb250ZW50cywgcGFyc2VyKSB7XG4gIHZhciBiaXRzID0gY29udGVudHMuc3BsaXQoJyAnKVxuICAgICwgdmFybmFtZSA9IHBhcnNlci5jb21waWxlKGJpdHMuc2xpY2UoMSkuam9pbignICcpKVxuICAgICwgbG9hZGVyID0gcGFyc2VyLnBsdWdpbnMubG9va3VwKCdsb2FkZXInKVxuXG4gIHJldHVybiBuZXcgY29ucyh2YXJuYW1lLCBsb2FkZXIpXG59XG5cbnByb3RvLnJlbmRlciA9IGZ1bmN0aW9uKGNvbnRleHQsIHRhcmdldCkge1xuICB2YXIgc2VsZiA9IHRoaXNcbiAgICAsIHByb21pc2VcblxuICB0YXJnZXQgPSB0YXJnZXQgfHwgdGhpcy50YXJnZXRfdmFyLnJlc29sdmUoY29udGV4dClcblxuICBpZih0YXJnZXQgJiYgdGFyZ2V0LmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG5cbiAgICB0YXJnZXQub25jZSgnZG9uZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHByb21pc2UucmVzb2x2ZShzZWxmLnJlbmRlcihjb250ZXh0LCBkYXRhKSlcbiAgICB9KVxuXG4gICAgcmV0dXJuIHByb21pc2VcbiAgfVxuXG4gIHRhcmdldCA9IHNlbGYuZ2V0X3RlbXBsYXRlKHRhcmdldClcblxuICBpZih0YXJnZXQgJiYgdGFyZ2V0LmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG5cbiAgICB0YXJnZXQub25jZSgnZG9uZScsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHByb21pc2UucmVzb2x2ZShzZWxmLnJlbmRlcihjb250ZXh0LCBkYXRhKSlcbiAgICB9KVxuXG4gICAgcmV0dXJuIHByb21pc2VcbiAgfVxuXG4gIHByb21pc2UgPSBuZXcgUHJvbWlzZVxuXG4gIHRhcmdldC5yZW5kZXIoY29udGV4dC5jb3B5KCksIGZ1bmN0aW9uKGVyciwgZGF0YSkge1xuICAgIHByb21pc2UucmVzb2x2ZShkYXRhKVxuICB9KVxuXG4gIHJldHVybiBwcm9taXNlXG59XG5cbnByb3RvLmdldF90ZW1wbGF0ZSA9IGZ1bmN0aW9uKHRhcmdldCkge1xuICBpZih0eXBlb2YgdGFyZ2V0ID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiB0aGlzLmxvYWRlcih0YXJnZXQpXG4gIH1cblxuICAvLyBva2F5LCBpdCdzIHByb2JhYmx5IGEgdGVtcGxhdGUgb2JqZWN0XG4gIHJldHVybiB0YXJnZXRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gTm93Tm9kZVxuXG52YXIgZm9ybWF0ID0gcmVxdWlyZSgnLi4vZGF0ZScpLmRhdGVcblxuZnVuY3Rpb24gTm93Tm9kZShmb3JtYXRTdHJpbmcpIHtcbiAgdGhpcy5mb3JtYXQgPSBmb3JtYXRTdHJpbmdcbn1cblxudmFyIGNvbnMgPSBOb3dOb2RlXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by5yZW5kZXIgPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gIHJldHVybiBmb3JtYXQobmV3IERhdGUsIHRoaXMuZm9ybWF0KVxufVxuXG5jb25zLnBhcnNlID0gZnVuY3Rpb24oY29udGVudHMsIHBhcnNlcikge1xuICB2YXIgYml0cyA9IGNvbnRlbnRzLnNwbGl0KCcgJylcbiAgICAsIGZtdCA9IGJpdHMuc2xpY2UoMSkuam9pbignICcpXG5cbiAgZm10ID0gZm10XG4gICAgLnJlcGxhY2UoL15cXHMrLywgJycpXG4gICAgLnJlcGxhY2UoL1xccyskLywgJycpXG5cbiAgaWYoL1snXCJdLy50ZXN0KGZtdC5jaGFyQXQoMCkpKSB7XG4gICAgZm10ID0gZm10LnNsaWNlKDEsIC0xKVxuICB9XG5cbiAgcmV0dXJuIG5ldyBOb3dOb2RlKGZtdCB8fCAnTiBqLCBZJylcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gV2l0aE5vZGVcblxudmFyIFByb21pc2UgPSByZXF1aXJlKCcuLi9wcm9taXNlJylcblxuZnVuY3Rpb24gV2l0aE5vZGUobm9kZXMsIGV4dHJhX2NvbnRleHQpIHtcbiAgdGhpcy5ub2RlcyA9IG5vZGVzXG4gIHRoaXMuZXh0cmFfY29udGV4dCA9IGV4dHJhX2NvbnRleHQgfHwge31cbn1cblxudmFyIGNvbnMgPSBXaXRoTm9kZVxuICAsIHByb3RvID0gY29ucy5wcm90b3R5cGVcbiAgLCBrd2FyZ19yZSA9IC8oPzooXFx3Kyk9KT8oLispL1xuXG5mdW5jdGlvbiB0b2tlbl9rd2FyZ3MoYml0cywgcGFyc2VyKSB7XG4gIHZhciBtYXRjaFxuICAgICwga3dhcmdfZm9ybWF0XG4gICAgLCBrd2FyZ3NcbiAgICAsIGtleVxuICAgICwgdmFsdWVcblxuICBpZighYml0cy5sZW5ndGgpIHtcbiAgICByZXR1cm4ge31cbiAgfVxuICBtYXRjaCA9IGt3YXJnX3JlLmV4ZWMoYml0c1swXSlcbiAga3dhcmdfZm9ybWF0ID0gbWF0Y2ggJiYgbWF0Y2hbMV1cbiAgaWYoIWt3YXJnX2Zvcm1hdCkge1xuICAgIGlmKGJpdHMubGVuZ3RoIDwgMyB8fCBiaXRzWzFdICE9PSAnYXMnKSB7XG4gICAgICByZXR1cm4ge31cbiAgICB9XG4gIH1cblxuICBrd2FyZ3MgPSB7fVxuICB3aGlsZShiaXRzLmxlbmd0aCkge1xuICAgIGlmKGt3YXJnX2Zvcm1hdCkge1xuICAgICAgbWF0Y2ggPSBrd2FyZ19yZS5leGVjKGJpdHNbMF0pXG4gICAgICBpZighbWF0Y2ggfHwgIW1hdGNoWzFdKSB7XG4gICAgICAgIHJldHVybiBrd2FyZ3NcbiAgICAgIH1cbiAgICAgIGtleSA9IG1hdGNoWzFdXG4gICAgICB2YWx1ZSA9IG1hdGNoWzJdXG4gICAgICBiaXRzLnNoaWZ0KClcbiAgICB9IGVsc2Uge1xuICAgICAgaWYoYml0cy5sZW5ndGggPCAzIHx8IGJpdHNbMV0gIT0gJ2FzJykge1xuICAgICAgICByZXR1cm4ga3dhcmdzXG4gICAgICB9XG4gICAgICBrZXkgPSBiaXRzWzJdXG4gICAgICB2YWx1ZSA9IGJpdHNbMF1cbiAgICAgIGJpdHMuc3BsaWNlKDAsIDMpXG4gICAgfVxuICAgIGt3YXJnc1trZXldID0gcGFyc2VyLmNvbXBpbGUodmFsdWUpXG4gICAgaWYoYml0cy5sZW5ndGggJiYgIWt3YXJnX2Zvcm1hdCkge1xuICAgICAgaWYoYml0c1swXSAhPSAnYW5kJykge1xuICAgICAgICByZXR1cm4ga3dhcmdzXG4gICAgICB9XG4gICAgICBiaXRzLnNoaWZ0KClcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGt3YXJnc1xufVxuXG5jb25zLnBhcnNlID0gZnVuY3Rpb24oY29udGVudHMsIHBhcnNlcikge1xuICB2YXIgYml0cyA9IGNvbnRlbnRzLnNwbGl0KC9cXHMrL2cpXG4gICAgLCBub2RlbGlzdCA9IHBhcnNlci5wYXJzZShbJ2VuZHdpdGgnXSlcbiAgICAsIGhhc19jb250ZXh0X3ZhcnMgPSBmYWxzZVxuICAgICwgcmVtYWluaW5nX2JpdHNcbiAgICAsIGV4dHJhX2NvbnRleHRcblxuXG4gIHJlbWFpbmluZ19iaXRzID0gYml0cy5zbGljZSgxKVxuICBleHRyYV9jb250ZXh0ID0gdG9rZW5fa3dhcmdzKHJlbWFpbmluZ19iaXRzLCBwYXJzZXIpXG5cbiAgZm9yKHZhciBjb250ZXh0X3ZhciBpbiBleHRyYV9jb250ZXh0KSB7XG4gICAgaWYoZXh0cmFfY29udGV4dC5oYXNPd25Qcm9wZXJ0eShjb250ZXh0X3ZhcikpIHtcbiAgICAgIGhhc19jb250ZXh0X3ZhcnMgPSB0cnVlXG4gICAgICBicmVha1xuICAgIH1cbiAgfVxuXG4gIGlmICghaGFzX2NvbnRleHRfdmFycykge1xuICAgIHRocm93IG5ldyBFcnJvcignXCInK2JpdHNbMF0rJ1wiIGV4cGVjdGVkIGF0IGxlYXN0IG9uZSB2YXJpYWJsZSBhc3NpZ25tZW50JylcbiAgfVxuICBpZiAocmVtYWluaW5nX2JpdHMubGVuZ3RoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdcIicrYml0c1swXSsnXCIgcmVjZWl2ZWQgYW4gaW52YWxpZCB0b2tlbjogXCInK3JlbWFpbmluZ19iaXRzWzBdKydcIicpXG4gIH1cblxuICBwYXJzZXIudG9rZW5zLnNoaWZ0KClcbiAgcmV0dXJuIG5ldyBjb25zKG5vZGVsaXN0LCBleHRyYV9jb250ZXh0KVxufVxuXG5wcm90by5yZW5kZXIgPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gIHZhciBzZWxmID0gdGhpc1xuICAgICwgcHJvbWlzZSA9IG5ldyBQcm9taXNlXG4gICAgLCBwcm9taXNlcyA9IDBcbiAgICAsIHZhbHVlXG5cbiAgY29udGV4dCA9IGNvbnRleHQuY29weSgpXG5cbiAgZnVuY3Rpb24gcHJvbWlzZV9yZXNvbHZlZChrZXkpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgY29udGV4dFtrZXldID0gZGF0YTtcbiAgICAgIGlmICgtLXByb21pc2VzID09PSAwKSB7XG4gICAgICAgIHByb21pc2UucmVzb2x2ZShzZWxmLm5vZGVzLnJlbmRlcihjb250ZXh0KSlcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmb3IodmFyIGtleSBpbiBzZWxmLmV4dHJhX2NvbnRleHQpIHtcbiAgICBpZihzZWxmLmV4dHJhX2NvbnRleHQuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgdmFsdWUgPSBzZWxmLmV4dHJhX2NvbnRleHRba2V5XS5yZXNvbHZlKGNvbnRleHQpXG5cbiAgICAgIGlmKHZhbHVlICYmIHZhbHVlLmNvbnN0cnVjdG9yID09PSBQcm9taXNlKSB7XG4gICAgICAgIHByb21pc2VzKytcbiAgICAgICAgdmFsdWUub25jZSgnZG9uZScsIHByb21pc2VfcmVzb2x2ZWQoa2V5KSlcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnRleHRba2V5XSA9IHZhbHVlXG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYocHJvbWlzZXMpIHtcbiAgICByZXR1cm4gcHJvbWlzZVxuICB9XG5cbiAgcmV0dXJuIHNlbGYubm9kZXMucmVuZGVyKGNvbnRleHQpXG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFRleHROb2RlXG5cbmZ1bmN0aW9uIFRleHROb2RlKGNvbnRlbnQpIHtcbiAgdGhpcy5jb250ZW50ID0gY29udGVudFxufVxuXG52YXIgY29ucyA9IFRleHROb2RlXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by5yZW5kZXIgPSBmdW5jdGlvbihjb250ZXh0KSB7XG4gIHJldHVybiB0aGlzLmNvbnRlbnRcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gVGV4dFRva2VuXG5cbnZhciBUb2tlbiA9IHJlcXVpcmUoJy4vdG9rZW4nKVxuICAsIFRleHROb2RlID0gcmVxdWlyZSgnLi90ZXh0X25vZGUnKVxuXG5mdW5jdGlvbiBUZXh0VG9rZW4oY29udGVudCwgbGluZSkge1xuICBUb2tlbi5jYWxsKHRoaXMsIGNvbnRlbnQsIGxpbmUpXG59XG5cbnZhciBjb25zID0gVGV4dFRva2VuXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZSA9IG5ldyBUb2tlblxuXG5wcm90by5jb25zdHJ1Y3RvciA9IGNvbnNcblxucHJvdG8ubm9kZSA9IGZ1bmN0aW9uKHBhcnNlcikge1xuICByZXR1cm4gbmV3IFRleHROb2RlKHRoaXMuY29udGVudClcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gVG9rZW5cblxuZnVuY3Rpb24gVG9rZW4oY29udGVudCwgbGluZSkge1xuICB0aGlzLmNvbnRlbnQgPSBjb250ZW50XG4gIHRoaXMubGluZSA9IGxpbmVcblxuICB0aGlzLm5hbWUgPSBjb250ZW50ICYmIGNvbnRlbnQuc3BsaXQoJyAnKVswXVxufVxuXG52YXIgY29ucyA9IFRva2VuXG4gICwgcHJvdG8gPSBjb25zLnByb3RvdHlwZVxuXG5wcm90by50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAvLyBOQjogdGhpcyBzaG91bGQgb25seSBiZVxuICAvLyBkZWJ1ZyBvdXRwdXQsIHNvIGl0J3NcbiAgLy8gcHJvYmFibHkgc2FmZSB0byB1c2VcbiAgLy8gSlNPTi5zdHJpbmdpZnkgaGVyZS5cbiAgcmV0dXJuICc8Jyt0aGlzLmNvbnN0cnVjdG9yLm5hbWUrJzogJytKU09OLnN0cmluZ2lmeSh0aGlzLmNvbnRlbnQpKyc+J1xufVxuXG5wcm90by5pcyA9IGZ1bmN0aW9uKG5hbWVzKSB7XG4gIGZvcih2YXIgaSA9IDAsIGxlbiA9IG5hbWVzLmxlbmd0aDsgaSA8IGxlbjsgKytpKVxuICAgIGlmKG5hbWVzW2ldID09PSB0aGlzLm5hbWUpXG4gICAgICByZXR1cm4gdHJ1ZVxuICByZXR1cm4gZmFsc2Vcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oaW5wdXQsIGNhbGxiYWNrKSB7XG4gIHZhciBzdHIgPSBpbnB1dC50b1N0cmluZygpXG4gIHJldHVybiBzdHIucmVwbGFjZSgvKCgoaHR0cChzKT86XFwvXFwvKXwobWFpbHRvOikpKFtcXHdcXGRcXC1cXC46QFxcLz8mPSVdKSspL2csIGNhbGxiYWNrKVxufSIsIjsoZnVuY3Rpb24oKSB7XG5cbi8vIHNvLCB0aGUgb25seSB3YXkgd2UgKHJlbGlhYmx5KSBnZXQgYWNjZXNzIHRvIERTVCBpbiBqYXZhc2NyaXB0XG4vLyBpcyB2aWEgYERhdGUjZ2V0VGltZXpvbmVPZmZzZXRgLlxuLy9cbi8vIHRoaXMgdmFsdWUgd2lsbCBzd2l0Y2ggZm9yIGEgZ2l2ZW4gZGF0ZSBiYXNlZCBvbiB0aGUgcHJlc2VuY2Ugb3IgYWJzZW5jZVxuLy8gb2YgRFNUIGF0IHRoYXQgZGF0ZS5cblxuZnVuY3Rpb24gZmluZF9kc3RfdGhyZXNob2xkIChuZWFyLCBmYXIpIHtcbiAgdmFyIG5lYXJfZGF0ZSA9IG5ldyBEYXRlKG5lYXIpXG4gICAgLCBmYXJfZGF0ZSA9IG5ldyBEYXRlKGZhcilcbiAgICAsIG5lYXJfb2ZmcyA9IG5lYXJfZGF0ZS5nZXRUaW1lem9uZU9mZnNldCgpXG4gICAgLCBmYXJfb2ZmcyA9IGZhcl9kYXRlLmdldFRpbWV6b25lT2Zmc2V0KClcblxuICBpZihuZWFyX29mZnMgPT09IGZhcl9vZmZzKSByZXR1cm4gMFxuXG4gIGlmKE1hdGguYWJzKG5lYXJfZGF0ZSAtIGZhcl9kYXRlKSA8IDEwMDApIHJldHVybiBuZWFyX2RhdGVcblxuICByZXR1cm4gZmluZF9kc3RfdGhyZXNob2xkKG5lYXIsIG5lYXIrKGZhci1uZWFyKS8yKSB8fCBmaW5kX2RzdF90aHJlc2hvbGQobmVhcisoZmFyLW5lYXIpLzIsIGZhcilcbn1cblxuXG5mdW5jdGlvbiBmaW5kX2RzdF90aHJlc2hvbGRzKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKClcbiAgICAsIGQgPSBuZXcgRGF0ZShkLmdldEZ1bGxZZWFyKCksIDAsIDEpXG4gICAgLCBmID0gbmV3IERhdGUoZC5nZXRGdWxsWWVhcigpLCAxMSwgMzEpXG4gICAgLCB4XG4gICAgLCBmaXJzdFxuICAgICwgc2Vjb25kXG5cbiAgeCA9IChmIC0gZCkgLyAtMlxuICBmaXJzdCA9IGZpbmRfZHN0X3RocmVzaG9sZCgrZCwgZCAtIHgpXG4gIHNlY29uZCA9IGZpbmRfZHN0X3RocmVzaG9sZChkIC0geCwgK2YpXG5cbiAgcmV0dXJuIHtcbiAgICBzcHJpbmdfZm9yd2FyZCAgOiBmaXJzdCA/IChmaXJzdC5nZXRUaW1lem9uZU9mZnNldCgpIDwgc2Vjb25kLmdldFRpbWV6b25lT2Zmc2V0KCkgPyBzZWNvbmQgOiBmaXJzdCkgLSBuZXcgRGF0ZShkLmdldEZ1bGxZZWFyKCksIDAsIDEsIDAsIDApIDogMFxuICAsIGZhbGxfYmFjayAgICAgICA6IGZpcnN0ID8gKGZpcnN0LmdldFRpbWV6b25lT2Zmc2V0KCkgPCBzZWNvbmQuZ2V0VGltZXpvbmVPZmZzZXQoKSA/IGZpcnN0IDogc2Vjb25kKSAtIG5ldyBEYXRlKGQuZ2V0RnVsbFllYXIoKSwgMCwgMSwgMCwgMCkgOiAwXG4gIH1cbn1cblxudmFyIFRIUkVTSE9MRFMgPSBmaW5kX2RzdF90aHJlc2hvbGRzKClcblxuZnVuY3Rpb24gaXNfZHN0KGRhdGV0aW1lLCB0aHJlc2hvbGRzKSB7XG5cbiAgdGhyZXNob2xkcyA9IHRocmVzaG9sZHMgfHwgVEhSRVNIT0xEU1xuXG4gIGlmKHRocmVzaG9sZHMuc3ByaW5nX2ZvcndhcmQgPT09IHRocmVzaG9sZHMuZmFsbF9iYWNrKVxuICAgIHJldHVybiBmYWxzZVxuXG4gIHZhciBvZmZzZXQgPSBkYXRldGltZSAtIG5ldyBEYXRlKGRhdGV0aW1lLmdldEZ1bGxZZWFyKCksIDAsIDEsIDAsIDApXG4gICAgLCBkc3RfaXNfcmV2ZXJzZWQgPSB0aHJlc2hvbGRzLnNwcmluZ19mb3J3YXJkID4gdGhyZXNob2xkcy5mYWxsX2JhY2tcbiAgICAsIG1heCA9IE1hdGgubWF4KHRocmVzaG9sZHMuZmFsbF9iYWNrLCB0aHJlc2hvbGRzLnNwcmluZ19mb3J3YXJkKVxuICAgICwgbWluID0gTWF0aC5taW4odGhyZXNob2xkcy5mYWxsX2JhY2ssIHRocmVzaG9sZHMuc3ByaW5nX2ZvcndhcmQpXG5cbiAgaWYobWluIDwgb2Zmc2V0ICYmIG9mZnNldCA8IG1heClcbiAgICByZXR1cm4gIWRzdF9pc19yZXZlcnNlZFxuICByZXR1cm4gZHN0X2lzX3JldmVyc2VkXG59XG5cbkRhdGUucHJvdG90eXBlLmlzRFNUID0gZnVuY3Rpb24odGhyZXNob2xkcykge1xuICByZXR1cm4gaXNfZHN0KHRoaXMsIHRocmVzaG9sZHMpIFxufVxuXG5pc19kc3QuZmluZF90aHJlc2hvbGRzID0gZmluZF9kc3RfdGhyZXNob2xkc1xuXG5pZih0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykge1xuICBtb2R1bGUuZXhwb3J0cyA9IGlzX2RzdFxufSBlbHNlIHtcbiAgd2luZG93LmlzX2RzdCA9IGlzX2RzdCBcbn1cblxufSkoKVxuIiwidmFyIHR6ID0gcmVxdWlyZSgnLi90eicpXG4gICwgaXNEU1QgPSByZXF1aXJlKCdkc3QnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHR6aW5mb1xuXG5mdW5jdGlvbiBnZXRfb2Zmc2V0X2ZtdCh0em9mZnMpIHtcbiAgdmFyIG9mZnMgPSB+fih0em9mZnMgLyA2MClcbiAgICAsIG1pbnMgPSAoJzAwJyArIH5+TWF0aC5hYnModHpvZmZzICUgNjApKS5zbGljZSgtMilcblxuICBvZmZzID0gKCh0em9mZnMgPiAwKSA/ICctJyA6ICcrJykgKyAoJzAwJyArIE1hdGguYWJzKG9mZnMpKS5zbGljZSgtMikgKyBtaW5zXG5cbiAgcmV0dXJuIG9mZnNcbn1cblxuZnVuY3Rpb24gdHppbmZvKGRhdGUsIHR6X2xpc3QsIGRldGVybWluZV9kc3QsIFRaKSB7XG5cbiAgdmFyIGZtdCA9IGdldF9vZmZzZXRfZm10KGRhdGUuZ2V0VGltZXpvbmVPZmZzZXQoKSlcblxuICBUWiA9IFRaIHx8IHR6XG4gIHR6X2xpc3QgPSB0el9saXN0IHx8IFRaW2ZtdF1cbiAgZGV0ZXJtaW5lX2RzdCA9IGRldGVybWluZV9kc3QgfHwgaXNEU1RcblxuICB2YXIgZGF0ZV9pc19kc3QgPSBkZXRlcm1pbmVfZHN0KGRhdGUpXG4gICAgLCBkYXRlX2RzdF90aHJlc2hvbGRzID0gZGV0ZXJtaW5lX2RzdC5maW5kX3RocmVzaG9sZHMoKVxuICAgICwgaGFzX2RzdCA9IGRhdGVfZHN0X3RocmVzaG9sZHMuc3ByaW5nX2ZvcndhcmQgIT09IGRhdGVfZHN0X3RocmVzaG9sZHMuZmFsbF9iYWNrXG4gICAgLCBpc19ub3J0aCA9IGhhc19kc3QgJiYgZGF0ZV9kc3RfdGhyZXNob2xkcy5zcHJpbmdfZm9yd2FyZCA8IGRhdGVfZHN0X3RocmVzaG9sZHMuZmFsbF9iYWNrIFxuICAgICwgbGlzdCA9ICh0el9saXN0IHx8IFtdKS5zbGljZSgpXG4gICAgLCBmaWx0ZXJlZCA9IFtdXG5cbiAgdmFyIGRhdGVzdHJvZmZzZXQgPSAvXFwoKC4qPylcXCkvLmV4ZWMoJycgKyBuZXcgRGF0ZSgpKVxuXG4gIGlmKGRhdGVzdHJvZmZzZXQpIHtcbiAgICBkYXRlc3Ryb2Zmc2V0ID0gZGF0ZXN0cm9mZnNldFsxXVxuXG4gICAgZm9yKHZhciBpID0gMCwgbGVuID0gbGlzdC5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgICAgaWYobGlzdFtpXS5hYmJyID09PSBkYXRlc3Ryb2Zmc2V0KSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAnbmFtZSc6IGxpc3RbaV0ubmFtZVxuICAgICAgICAgICwgJ2xvYyc6IGxpc3RbaV0ubG9jXG4gICAgICAgICAgLCAnYWJicic6IGxpc3RbaV0uYWJiclxuICAgICAgICAgICwgJ29mZnNldCc6IGZtdFxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cblxuICBpZighaXNfbm9ydGgpXG4gICAgbGlzdCA9IGxpc3QucmV2ZXJzZSgpXG5cbiAgZm9yKHZhciBpID0gMCwgbGVuID0gbGlzdC5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgIGlmKGRhdGVfaXNfZHN0ID09PSAvKFtEZF1heWxpZ2h0fFtTc111bW1lcikvLnRlc3QobGlzdFtpXS5uYW1lKSkge1xuICAgICAgZmlsdGVyZWQucHVzaChsaXN0W2ldKVxuICAgIH1cbiAgfVxuICBsaXN0ID0gZmlsdGVyZWRcbiAgaWYoIWxpc3QubGVuZ3RoKSByZXR1cm4ge31cblxuICByZXR1cm4ge1xuICAgICAgJ25hbWUnOiAgICAgbGlzdFswXS5uYW1lXG4gICAgLCAnbG9jJzogICAgICBsaXN0WzBdLmxvY1xuICAgICwgJ2FiYnInOiAgICAgbGlzdFswXS5hYmJyXG4gICAgLCAnb2Zmc2V0JzogICBmbXRcbiAgfVxufSBcblxudHppbmZvLmdldF9vZmZzZXRfZm9ybWF0ID0gZ2V0X29mZnNldF9mbXRcbnR6aW5mby50el9saXN0ID0gdHpcblxuRGF0ZS5wcm90b3R5cGUudHppbmZvID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0emluZm8odGhpcylcbn1cblxuRGF0ZS5wcm90b3R5cGUudHpvZmZzZXQgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICdHTVQnK2dldF9vZmZzZXRfZm10KHRoaXMuZ2V0VGltZXpvbmVPZmZzZXQoKSlcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBcIiswOTAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJKU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJKYXBhbiBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJLU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJLb3JlYSBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkF1c3RyYWxpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIldEVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIldlc3Rlcm4gRGF5bGlnaHQgVGltZVwiXG4gICAgfSBcbiAgXSwgXG4gIFwiKzEzNDVcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNIQURUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2hhdGhhbSBJc2xhbmQgRGF5bGlnaHQgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCIrMDUwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiUEtUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiUGFraXN0YW4gU3RhbmRhcmQgVGltZVwiXG4gICAgfSBcbiAgXSwgXG4gIFwiKzA0MzBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkFGVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkFmZ2hhbmlzdGFuIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIklSRFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJJcmFuIERheWxpZ2h0IFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzEyMDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkFOQVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQW5hZHlyIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJBTkFUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQW5hZHlyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIkZKVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkZpamkgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiR0lMVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkdpbGJlcnQgSXNsYW5kIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIk1BR1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTWFnYWRhbiBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTUhUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTWFyc2hhbGwgSXNsYW5kcyBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJOWlNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTmV3IFplYWxhbmQgU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiUEVUU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJLYW1jaGF0a2EgU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlBFVFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJLYW1jaGF0a2EgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiVFZUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiVHV2YWx1IFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIldGVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIldhbGxpcyBhbmQgRnV0dW5hIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiLTExMDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIlNTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlNhbW9hIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIldTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIldlc3QgU2Ftb2EgVGltZVwiXG4gICAgfSBcbiAgXSwgXG4gIFwiKzE0MDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIkxJTlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJMaW5lIElzbGFuZHMgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCItMDIzMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSEFUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSGV1cmUgQXZhbmNcXHUwMGU5ZSBkZSBUZXJyZS1OZXV2ZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTkRUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTmV3Zm91bmRsYW5kIERheWxpZ2h0IFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiLTAxMDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQWZyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ1ZUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2FwZSBWZXJkZSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJFR1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFYXN0IEdyZWVubGFuZCBUaW1lXCJcbiAgICB9IFxuICBdLCBcbiAgXCItMTIwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJNaWxpdGFyeVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIllcIiwgXG4gICAgICBcIm5hbWVcIjogXCJZYW5rZWUgVGltZSBab25lXCJcbiAgICB9XG4gIF0sIFxuICBcIiswODAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJDU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDaGluYSBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJLUkFTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIktyYXNub3lhcnNrIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkF1c3RyYWxpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIldTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIldlc3Rlcm4gU3RhbmRhcmQgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCIrMDYzMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTU1UXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTXlhbm1hciBUaW1lXCJcbiAgICB9LFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiSW5kaWFuIE9jZWFuXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ0NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ29jb3MgSXNsYW5kcyBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIi0wNDMwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJITFZcIiwgXG4gICAgICBcIm5hbWVcIjogXCJIb3JhIExlZ2FsIGRlIFZlbmV6dWVsYVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJTb3V0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiVkVUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiVmVuZXp1ZWxhbiBTdGFuZGFyZCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIi0wNzAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJNU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJNb3VudGFpbiBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJQRFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJQYWNpZmljIERheWxpZ2h0IFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkhBUFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkhldXJlIEF2YW5jXFx1MDBlOWUgZHUgUGFjaWZpcXVlXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJITlJcIiwgXG4gICAgICBcIm5hbWVcIjogXCJIZXVyZSBOb3JtYWxlIGRlcyBSb2NoZXVzZXNcIlxuICAgIH0gXG4gIF0sIFxuICBcIi0wMjAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJGTlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJGZXJuYW5kbyBkZSBOb3JvbmhhIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIldHU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJXZXN0ZXJuIEdyZWVubGFuZCBTdW1tZXIgVGltZVwiXG4gICAgfSxcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJQTURUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiUGllcnJlICYgTWlxdWVsb24gRGF5bGlnaHQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJTb3V0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiVVlTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlVydWd1YXkgU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiU291dGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkJSU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJCcmFzaWxpYSBTdW1tZXIgVGltZVwiXG4gICAgfSBcbiAgXSwgXG4gIFwiKzEwMzBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXVzdHJhbGlhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ0RUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2VudHJhbCBEYXlsaWdodCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkF1c3RyYWxpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkxIU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJMb3JkIEhvd2UgU3RhbmRhcmQgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCIrMDMwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJFdXJvcGVcIiwgXG4gICAgICBcImFiYnJcIjogXCJNU0tcIiwgXG4gICAgICBcIm5hbWVcIjogXCJNb3Njb3cgU3RhbmRhcmQgVGltZVwiXG4gICAgfSxcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJJRFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJJc3JhZWwgRGF5bGlnaHQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQXJhYmlhIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiSW5kaWFuIE9jZWFuXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRUFUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWFzdCBBZnJpY2EgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJFdXJvcGVcIiwgXG4gICAgICBcImFiYnJcIjogXCJFRVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWFzdGVybiBFdXJvcGVhbiBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBZnJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJFQVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFYXN0ZXJuIEFmcmljYSBUaW1lXCJcbiAgICB9IFxuICBdLCBcbiAgXCJVVENcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXRsYW50aWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJBWk9TVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkF6b3JlcyBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRUdTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkVhc3Rlcm4gR3JlZW5sYW5kIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkdNVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkdyZWVud2ljaCBNZWFuIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiRXVyb3BlXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiR01UXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiR3JlZW53aWNoIE1lYW4gVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBZnJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJXRVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJXZXN0ZXJuIEV1cm9wZWFuIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiRXVyb3BlXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiV0VUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiV2VzdGVybiBFdXJvcGVhbiBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIldUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiV2VzdGVybiBTYWhhcmEgU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJNaWxpdGFyeVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlpcIiwgXG4gICAgICBcIm5hbWVcIjogXCJadWx1IFRpbWUgWm9uZVwiXG4gICAgfVxuICBdLCBcbiAgXCIrMDQwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQU1UXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQXJtZW5pYSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJBWlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJBemVyYmFpamFuIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTWlsaXRhcnlcIiwgXG4gICAgICBcImFiYnJcIjogXCJEXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRGVsdGEgVGltZSBab25lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJHRVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJHZW9yZ2lhIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkdTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkd1bGYgU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJFdXJvcGVcIiwgXG4gICAgICBcImFiYnJcIjogXCJLVVlUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiS3V5YnlzaGV2IFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiRXVyb3BlXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTVNEXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTW9zY293IERheWxpZ2h0IFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQWZyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTVVUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTWF1cml0aXVzIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQWZyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiUkVUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiUmV1bmlvbiBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkV1cm9wZVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlNBTVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJTYW1hcmEgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBZnJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJTQ1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJTZXljaGVsbGVzIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzA3MDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXVzdHJhbGlhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ1hUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2hyaXN0bWFzIElzbGFuZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFudGFyY3RpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJEQVZUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRGF2aXMgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJNaWxpdGFyeVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkdcIiwgXG4gICAgICBcIm5hbWVcIjogXCJHb2xmIFRpbWUgWm9uZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSE9WVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkhvdmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSUNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSW5kb2NoaW5hIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIktSQVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJLcmFzbm95YXJzayBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJOT1ZTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk5vdm9zaWJpcnNrIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJPTVNTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk9tc2sgU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIldJQlwiLCBcbiAgICAgIFwibmFtZVwiOiBcIldlc3Rlcm4gSW5kb25lc2lhbiBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIiswMjAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk1pbGl0YXJ5XCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQlwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkJyYXZvIFRpbWUgWm9uZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBZnJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJDQVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDZW50cmFsIEFmcmljYSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkV1cm9wZVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNFU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDZW50cmFsIEV1cm9wZWFuIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVFVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkVhc3Rlcm4gRXVyb3BlYW4gVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRUVUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWFzdGVybiBFdXJvcGVhbiBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkV1cm9wZVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVFVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkVhc3Rlcm4gRXVyb3BlYW4gVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSXNyYWVsIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQWZyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiU0FTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlNvdXRoIEFmcmljYSBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIldBU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJXZXN0IEFmcmljYSBTdW1tZXIgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCItMTAwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ0tUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ29vayBJc2xhbmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSEFTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkhhd2FpaS1BbGV1dGlhbiBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJIU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJIYXdhaWktQWxldXRpYW4gU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiVEFIVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlRhaGl0aSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJUS1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJUb2tlbGF1IFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTWlsaXRhcnlcIiwgXG4gICAgICBcImFiYnJcIjogXCJXXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiV2hpc2tleSBUaW1lIFpvbmVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzA5MzBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXVzdHJhbGlhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2VudHJhbCBTdGFuZGFyZCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIiswNTMwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJJU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJJbmRpYSBTdGFuZGFyZCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIisxMzAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJGSlNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRmlqaSBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBbnRhcmN0aWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTlpEVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk5ldyBaZWFsYW5kIERheWxpZ2h0IFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIk5aRFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJOZXcgWmVhbGFuZCBEYXlsaWdodCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJQSE9UXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiUGhvZW5peCBJc2xhbmQgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCIrMDU0NVwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBc2lhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTlBUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTmVwYWwgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCIrMTAwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ2hTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNoYW1vcnJvIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXVzdHJhbGlhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWFzdGVybiBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk1pbGl0YXJ5XCIsIFxuICAgICAgXCJhYmJyXCI6IFwiS1wiLCBcbiAgICAgIFwibmFtZVwiOiBcIktpbG8gVGltZSBab25lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJQR1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJQYXB1YSBOZXcgR3VpbmVhIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlZMQVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJWbGFkaXZvc3RvayBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJZQUtTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIllha3V0c2sgU3VtbWVyIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIllBUFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJZYXAgVGltZVwiXG4gICAgfVxuICBdLCBcbiAgXCItMDYwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2VudHJhbCBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJNRFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJNb3VudGFpbiBEYXlsaWdodCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJHQUxUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiR2FsYXBhZ29zIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkhBUlwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkhldXJlIEF2YW5jXFx1MDBlOWUgZGVzIFJvY2hldXNlc1wiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSE5DXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSGV1cmUgTm9ybWFsZSBkdSBDZW50cmVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQ2VudHJhbCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiSE5DXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSGV1cmUgTm9ybWFsZSBkdSBDZW50cmVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQ2VudHJhbCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2VudHJhbCBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJFQVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWFzdGVyIElzbGFuZCBTdGFuZGFyZCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIiswMTAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkV1cm9wZVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNFVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNlbnRyYWwgRXVyb3BlYW4gVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJFdXJvcGVcIiwgXG4gICAgICBcImFiYnJcIjogXCJCU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJCcml0aXNoIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNFVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNlbnRyYWwgRXVyb3BlYW4gVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBZnJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJXRVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiV2VzdGVybiBFdXJvcGVhbiBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJFdXJvcGVcIiwgXG4gICAgICBcImFiYnJcIjogXCJXRVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiV2VzdGVybiBFdXJvcGVhbiBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJBZnJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJXU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJXZXN0ZXJuIFNhaGFyYSBTdW1tZXIgVGltZVwiXG4gICAgfSxcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFmcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIldBVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIldlc3QgQWZyaWNhIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiLTA0MDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkFTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkF0bGFudGljIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVEVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkVhc3Rlcm4gRGF5bGlnaHQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJTb3V0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ0xUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ2hpbGUgU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJTb3V0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRktUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRmFsa2xhbmQgSXNsYW5kIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiU291dGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkdZVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkd1eWFuYSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJQWVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJQYXJhZ3VheSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJBTVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJBbWF6b24gVGltZVwiXG4gICAgfSBcbiAgXSwgXG4gIFwiLTAzMzBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIk5TVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIk5ld2ZvdW5kbGFuZCBTdGFuZGFyZCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIi0wNTAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJFU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFYXN0ZXJuIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkNEVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkNlbnRyYWwgRGF5bGlnaHQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJTb3V0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ09UXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQ29sb21iaWEgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJDYXJpYmJlYW5cIiwgXG4gICAgICBcImFiYnJcIjogXCJDU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDdWJhIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiUGFjaWZpY1wiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVBU1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWFzdGVyIElzbGFuZCBTdW1tZXIgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJTb3V0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRUNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiRWN1YWRvciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkNlbnRyYWwgQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkVhc3Rlcm4gU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJDYXJpYmJlYW5cIiwgXG4gICAgICBcImFiYnJcIjogXCJFU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJFYXN0ZXJuIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQ2VudHJhbCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJUaWVtcG8gZGVsIEVzdGVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQ2FyaWJiZWFuXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiRVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJUaWVtcG8gZGVsIEVzdGVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiVGllbXBvIERlbCBFc3RlXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJIQUNcIiwgXG4gICAgICBcIm5hbWVcIjogXCJIZXVyZSBBdmFuY1xcdTAwZTllIGR1IENlbnRyZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJTb3V0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiUEVUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiUGVydSBUaW1lXCJcbiAgICB9IFxuICBdLCBcbiAgXCItMDkwMFwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQUtTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkFsYXNrYSBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJIQURUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiSGF3YWlpLUFsZXV0aWFuIERheWxpZ2h0IFRpbWVcIlxuICAgIH0gXG4gIF0sIFxuICBcIi0wMzAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIk5vcnRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJBRFRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJBdGxhbnRpYyBEYXlsaWdodCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJBTVNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiQW1hem9uIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlNvdXRoIEFtZXJpY2FcIiwgXG4gICAgICBcImFiYnJcIjogXCJCUlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJCcmFzXFx1MDBlZGxpYSB0aW1lXCJcbiAgICB9IFxuICBdLCBcbiAgXCIrMTI0NVwiOiBbXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQ0hBU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJDaGF0aGFtIElzbGFuZCBTdGFuZGFyZCBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIiswNjAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJCU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJCYW5nbGFkZXNoIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0sIFxuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIllFS1NUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiWWVrYXRlcmluYnVyZyBTdW1tZXIgVGltZVwiXG4gICAgfSxcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJCU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJCYW5nbGFkZXNoIFN0YW5kYXJkIFRpbWVcIlxuICAgIH0gXG4gIF0sIFxuICBcIi0wOTMwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJNQVJUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTWFycXVlc2FzIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzAzMzBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXNpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIklSU1RcIiwgXG4gICAgICBcIm5hbWVcIjogXCJJcmFuIFN0YW5kYXJkIFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiKzExMzBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiQXVzdHJhbGlhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTkZUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTm9yZm9sayBUaW1lXCJcbiAgICB9XG4gIF0sIFxuICBcIisxMTAwXCI6IFtcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkFzaWFcIiwgXG4gICAgICBcImFiYnJcIjogXCJWTEFTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlZsYWRpdm9zdG9rIFN1bW1lciBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIkF1c3RyYWxpYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIkVEVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkVhc3Rlcm4gRGF5bGlnaHQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJQYWNpZmljXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiTkNUXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiTmV3IENhbGVkb25pYSBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJQT05UXCIsIFxuICAgICAgXCJuYW1lXCI6IFwiUG9obnBlaSBTdGFuZGFyZCBUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJTQlRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJTb2xvbW9uIElzbGFuZHNUaW1lXCJcbiAgICB9LCBcbiAgICB7XG4gICAgICBcImxvY1wiOiBcIlBhY2lmaWNcIiwgXG4gICAgICBcImFiYnJcIjogXCJWVVRcIiwgXG4gICAgICBcIm5hbWVcIjogXCJWYW51YXR1IFRpbWVcIlxuICAgIH1cbiAgXSwgXG4gIFwiLTA4MDBcIjogW1xuICAgIHtcbiAgICAgIFwibG9jXCI6IFwiTm9ydGggQW1lcmljYVwiLCBcbiAgICAgIFwiYWJiclwiOiBcIlBTVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIlBhY2lmaWMgU3RhbmRhcmQgVGltZVwiXG4gICAgfSwgXG4gICAge1xuICAgICAgXCJsb2NcIjogXCJOb3J0aCBBbWVyaWNhXCIsIFxuICAgICAgXCJhYmJyXCI6IFwiQUtEVFwiLCBcbiAgICAgIFwibmFtZVwiOiBcIkFsYXNrYSBEYXlsaWdodCBUaW1lXCJcbiAgICB9IFxuICBdXG59XG4iXX0=(1)
});
;