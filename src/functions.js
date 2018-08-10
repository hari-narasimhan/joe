'use strict';
const _ = require('lodash')

function fromTuple(array) {
  const result = {};
  if (!array) {
    return result;
  }
  array.forEach(function(a){
    if (a[0] && a[1]) {
      result[a[0]] = a[1];
    }
  })
  return result;
}

function getTableValues (tables, name) {
  if (!tables) {
    return null;
  }

  const table = tables.find(function (t) { return t.name === name })

  if (!table || !table.values || !table.values[0]) {
    return null;
  }

  return table.values;
}

var fns = {
  print: function() { console.log(arguments); },
  val: function (obj, attribute) {
    return obj[attribute]
  },
  valAt: function (arr, index) {
    return _.nth(arr, index)
  },
  head: function (arr) {
    return _.head(arr)
  },
  first: function (arr) {
    return _.first(arr)
  },  
  last: function (arr) {
    return _.last(arr)
  },  
  parseDate: function (date) {
    return new Date(Date.parse(date))
  },
  lookup: function (name, row, col) {

    if (!this.lookupTables) {
      return null;
    }

    const values = getTableValues(this.lookupTables, name);

    if (!values) {
      return values
    }

    const i1 = values.findIndex(function (d) { return d[0] === row });
    const i2 = values[0].findIndex(function (d) { return d === col });

    if (i1 < 0 || i2 < 0) {
      return null;
    }
    return values[i1][i2];
  },
  mlookup: function (name, key, attrib) {

    const values = getTableValues(this.lookupTables, name);

    if (!values) {
      return values
    }

    const lookupKey = _.isArray(key) ? fromTuple(key) : key
    const result = _.find(values, lookupKey);

    if (!result) {
      return null;
    }

    return attrib ? result[attrib] : result;

  },
  rlookup: function (name,lkey, rkey, val, attrib) {
    const values = getTableValues(this.lookupTables, name);

    if (!values) {
      return values
    }

    const result = _.find(values, function (v) {
      return (val >= v[lkey]) && (val <= v[rkey])
    })

    if (!result) {
      return null;
    }

    return attrib ? result[attrib] : result;
  },
  ERROR: function (code, message) {
    this.errors = this.errors || []
    this.errors.push({code: code, message: message})
  },
  WARNING: function (code, message) {
    this.warnings = this.warnings || []
    this.warnings.push(({code: code, message: message}))
  },
  find: function (coll, predicate) {
    return _.find(coll, predicate)
  },
  minBy: function (coll, attr) {
    const result = _.minBy(coll, function (o) {
      return o[attr];
    })
    return result ? result[attr] : null;
  },
  maxBy: function (coll, attr) {
    const result = _.maxBy(coll, function (o) {
      return o[attr]
    })
    return result ? result[attr] : null;
  },
  filter: function (coll, predicate) {
    return _.filter(coll, predicate)
  },
  find: function (coll, predicate) {
    return _.find(coll, predicate)
  },  
  sumBy: function (coll, attr) {
    return _.sumBy(coll, function (o) {
      // convert null and undefined to zero
      return o[attr] || 0;
    })
  },
  collectArrays: function (coll, attr) {
    let result = []
    coll.forEach(function(c){
      if (Array.isArray(c[attr])) {
        result = _.concat(result, c[attr])
      }
    })
    return result
  },
  count: function (coll) {
    return _.isArray(coll) ? coll.length : 0;
  },
  countDistinct: function (coll, attr) {
    const uniq = _.uniqBy(coll, function (o) {
      return o[attr];
    })
    return _.isArray(uniq) ? uniq.length : 0;
  },
  avgBy: function (coll, attr) {
    return fns.sumBy(coll, attr) / fns.count(coll);
  }
};

module.exports = fns