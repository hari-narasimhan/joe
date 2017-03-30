'use strict';

module.exports = {
  print: function() { console.log(arguments); },
  lookup: function (name, row, col) {
    const table = this.lookupTables.find((t) => t.name === name);

    if (!table || !table.values) {
      return null;
    }

    const values = table.values;
    const i1 = values.findIndex((d) => d[0] === row);
    const i2 = values[0].findIndex((d) => d === col);
    return values[i1][i2];
  }
};
