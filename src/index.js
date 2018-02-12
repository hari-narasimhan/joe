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

var parse = function (script) {
  try {
    return parser.parse(script)
  } catch (err) {
    throw new Error('Error occured parsing script', + err.toString())
  }
}

var tokenize = function (script) {
  var tokens = [], tokenType, token
  try {
    var _parser = parser.parser
    var lexer = _parser.lexer
    lexer.setInput(script)
    while(!lexer.done) {
      tokenType = lexer.lex()
      if (token in _parser.terminals_) {
        token = _parser.terminals_[token];
      }
      tokens.push({tokenType: tokenType, token: lexer.yytext})
    }
    return tokens
  } catch (err) {
    throw new Error('Error occured parsing script', + err.toString())
  }  
}

module.exports = {
  eval: evaluate,
  parse: parse,
  tokenize: tokenize
};
