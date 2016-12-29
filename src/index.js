'use strict';
var parser = require('./parser');
require('./interpreter');

/**
* Evaluates a script along with the context
* @param {String} script which needs to be evalulated
* @param {Object} the context for the script evalulation
* @returns {Object} resultant object
*/
var evaluate = function(script, ctx) {
  try {
    return parser
            .parse(script)
            .eval(ctx);
  } catch (err) {
    throw new Error('Error occured parsing script ' + err.toString());
  }
};

module.exports = {
  eval: evaluate,
};
