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

  const table = tables.find((t) => t.name === name)

  if (!table || !table.values || !table.values[0]) {
    return null;
  }

  return table.values;
}

module.exports = {
  print: function() { console.log(arguments); },
  lookup: function (name, row, col) {

    if (!this.lookupTables) {
      return null;
    }

    const table = this.lookupTables.find((t) => t.name === name);

    if (!table || !table.values || !table.values[0]) {
      return null;
    }
    const values = table.values;
    const i1 = values.findIndex((d) => d[0] === row);
    const i2 = values[0].findIndex((d) => d === col);

    if (i1 < 0 || i2 < 0) {
      return null;
    }
    return values[i1][i2];
  },
  mlookup: function (name, key, attrib) {

    const values = getTableValues(this.lookupTables, name)

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
    const values = getTableValues(this.lookupTables, name)

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
  }
};
