'use strict';
const _ = require('lodash')

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
  mlookup: function (name, key, value) {

    if (!this.lookupTables) {
      return null;
    }

    const table = this.lookupTables.find((t) => t.name === name)
    if (!table || !table.values || !table.values[0]) {
      return null;
    }
    const values = table.values
    const result = _.find(values, key);

    if (!result) {
      return null;
    }

    return value ? result[value] : result;

  }
};
