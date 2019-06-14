'use strict';

var _ = require('lodash');
var dateFormat = require('dateformat')
var isoDate = require('@segment/isodate')
var math = require('mathjs')

function fromTuple(array) {
  var result = {};
  if (!array) {
    return result;
  }
  array.forEach(function (a) {
    if (a[0] && a[1]) {
      result[a[0]] = a[1];
    }
  });
  return result;
}

function getTableValues(tables, name) {
  if (!tables) {
    return null;
  }

  var table = tables.find(function (t) {
    return t.name === name;
  });

  if (!table || !table.values || !table.values[0]) {
    return null;
  }

  return table.values;
}

var fns = {
  print: function print() {
    console.log(arguments);
  },
  // Override math.round with ours
  round: function round (number, precision) {
    precision = precision || 0
    return math.round(number, precision)
  },
  ceil: function ceil (number, precision) {
    precision = precision || 0
    return math.ceil(number, precision)
  },
  floor: function floor (number, precision) {
    precision = precision || 0
    return math.floor(number, precision)
  },
  set: function set(obj, attribute, value) {
    _.set(obj, attribute, value);
  },
  unset: function unset(obj, attribute) {
    _.set(obj, attribute);
  },
  val: function val(obj, attribute, defaultValue) {
    return _.get(obj, attribute, defaultValue);
  },
  valAt: function valAt(arr, index) {
    return _.nth(arr, index);
  },
  head: function head(arr) {
    return _.head(arr);
  },
  first: function first(arr) {
    return _.first(arr);
  },
  last: function last(arr) {
    return _.last(arr);
  },
  parseDate: function parseDate(date) {
    return new Date(Date.parse(date));
  },
  isValidISODate: function (date, isStrict) {
    isStrict = isStrict || true
    // Enforce strict checking
    return isoDate.is(date, isStrict)
  },
  isValidDate: function (date) {
    return _.isDate(date)
  },
  lookup: function lookup(name, row, col) {

    if (!this.lookupTables) {
      return null;
    }

    var values = getTableValues(this.lookupTables, name);

    if (!values) {
      return values;
    }

    var i1 = values.findIndex(function (d) {
      return d[0] === row;
    });
    var i2 = values[0].findIndex(function (d) {
      return d === col;
    });

    if (i1 < 0 || i2 < 0) {
      return null;
    }
    return values[i1][i2];
  },
  mlookup: function mlookup(name, key, attrib) {

    var values = getTableValues(this.lookupTables, name);

    if (!values) {
      return values;
    }

    var lookupKey = _.isArray(key) ? fromTuple(key) : key;
    var result = _.find(values, lookupKey);

    if (!result) {
      return null;
    }

    return attrib ? result[attrib] : result;
  },
  rlookup: function rlookup(name, lkey, rkey, val, attrib) {
    var values = getTableValues(this.lookupTables, name);

    if (!values) {
      return values;
    }

    var result = _.find(values, function (v) {
      return val >= v[lkey] && val <= v[rkey];
    });

    if (!result) {
      return null;
    }

    return attrib ? result[attrib] : result;
  },
  ERROR: function ERROR(code, message) {
    this.errors = this.errors || [];
    this.errors.push({ code: code, message: message });
  },
  WARNING: function WARNING(code, message) {
    this.warnings = this.warnings || [];
    this.warnings.push({ code: code, message: message });
  },
  minBy: function minBy(coll, attr) {
    var result = _.minBy(coll, function (o) {
      return _.get(o, attr);
    });
    return result ? _.get(result, attr) : null;
  },
  maxBy: function maxBy(coll, attr) {
    var result = _.maxBy(coll, function (o) {
      return _.get(o, attr);
    });
    return result ? _.get(result, attr) : null;
  },
  filter: function filter(coll, predicate) {
    return _.filter(coll, predicate);
  },
  find: function find(coll, predicate) {
    return _.find(coll, predicate);
  },
  sumBy: function sumBy(coll, attr) {
    return _.sumBy(coll, function (o) {
      // convert null and undefined to zero
      return _.get(o, attr, 0);
    });
  },
  collectArrays: function collectArrays(coll, attr) {
    var result = [];
    coll.forEach(function (c) {
      if (Array.isArray(c[attr])) {
        result = _.concat(result, c[attr]);
      }
    });
    return result;
  },
  count: function count(coll) {
    return _.isArray(coll) ? coll.length : 0;
  },
  countDistinct: function countDistinct (coll, attr) {
    var uniq = _.uniqBy(coll, function (o) {
      return _.get(o, attr);
    });
    return _.isArray(uniq) ? uniq.length : 0;
  },
  avgBy: function avgBy (coll, attr) {
    return fns.sumBy(coll, attr) / fns.count(coll);
  },
  currentYear: function () {
    var now = new Date()
    return parseInt(dateFormat(now, 'yyyy'))
  },
  formatDate: function (format, date) {
    format = format || 'yyyymmdd'
    var now = date || new Date()
    return dateFormat(now, format)
  },
  filterExpression: function (expression, ctx) {
    expression = expression || ''
    ctx = ctx || 'ctx'
    return new Function (ctx, 'return ' + expression)
  },
  isEmpty: function (val) {
    return _.isEmpty(val)
  },
  strContains: function (string, pattern) {
    if (!string) {
      return false
    }
    return string.indexOf(pattern) !== -1
  },
  substr: function (string, start, end) {
    if (!string) {
      return null
    }
    return string.substr(start, end)
  },
  substring: function (string, start, end) {
    if (!string) {
      return null
    }
    return string.substring(start, end)
  },
  matchRegex: function (string, regexStr) {
    if (!string || !regexStr) {
      return false
    }
    var regex = new RegExp(regexStr)
    return regex.test(string)
  }
};

module.exports = fns;