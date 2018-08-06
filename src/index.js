'use strict';
var _ = require('lodash')

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

var isFunctionCall = function (token) {
  if (_.isEmpty(token)) {
    return false
  }
  return token.tokenType === '('
}

var isAssignment = function (token) {
  if (_.isEmpty(token)) {
    return false
  }
  return token.tokenType === '='
}

var extractIdentifiers = function (script, omitAssignments) {
  var tokens = tokenize(script)
  var identifiers = []
  var omittedIdentifiers = []
  var currentToken, nextToken

  for (var i = 0, len = tokens.length; i < len; i++) {
    currentToken = tokens[i]
    nextToken = i === len - 1 ? null : tokens [i + 1]
    if (currentToken.tokenType === 'IDENTIFIER') {

      // Omit function calls
      if (isFunctionCall(nextToken)) {
        continue;
      }

      // If omit assignment is set to true and next token is of type assignment
      // omit the current token and continue with next
      if (omitAssignments === true && isAssignment(nextToken)) {
        omittedIdentifiers.push(Object.assign({}, currentToken))
        continue;
      }
      // Ensure that the token is not contained in the omitted list and ensure it is not duplicated.
      if (!_.find(omittedIdentifiers, currentToken) && !_.find(identifiers, currentToken)){
        identifiers.push(Object.assign({}, currentToken))
      }
    }
  }
  return identifiers
}

var extractAssignments = function (script) {
  var tokens = tokenize(script)
  var identifiers = []
  var currentToken, nextToken

  for (var i = 0, len = tokens.length; i < len; i++) {
    currentToken = tokens[i]
    nextToken = i === len - 1 ? null : tokens [i + 1]

    // Omit function calls
    if (isFunctionCall(nextToken)) {
      continue;
    }
    // Check for assignments
    if (isAssignment(nextToken) && !_.find(identifiers, currentToken)) {
      identifiers.push(Object.assign({}, currentToken))
    }
  }
  return identifiers
}

module.exports = {
  eval: evaluate,
  parse: parse,
  tokenize: tokenize,
  extractAssignments: extractAssignments,
  extractIdentifiers: extractIdentifiers
};
