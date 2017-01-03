'use strict'

var parser = require('./parser').parser;
var ast = parser.ast;
var _ = require('lodash');
var functions = require('./functions');

ast.ProgramNode.prototype.eval = function(ctx) {

  var locals = _.merge({}, ctx);
  var elements = this.body;

  for (var i = 0; i < elements.length; i += 1) {
    elements[i].eval(locals);
  }

  return locals;
};


ast.EmptyStatementNode.prototype.eval = function(ctx) { return ctx; };

ast.BlockStatementNode.prototype.eval = function(ctx) {
  var statements = this.body;
  for (var i = 0, len = statements.length; i < len; i += 1) {
    statements[i].eval(ctx);
  }
  return ctx;
};

ast.ExpressionStatementNode.prototype.eval = function(ctx) {
  return this.expression.eval(ctx);
};

ast.IfStatementNode.prototype.eval = function(ctx) {
  var result;
  if (this.test.eval(ctx)) {
    result = this.consequent.eval(ctx);
  } else if (this.alternate) {
    result = this.alternate.eval(ctx);
  }
  return result;
};

ast.ArrayExpressionNode.prototype.eval = function(ctx) {
  var arr = [];
  var elements = this.elements;

  for (var i = 0, len = elements.length; i < len; i += 1) {
    arr.push(elements[i].eval(ctx));
  }
  return arr;
};

ast.ObjectExpressionNode.prototype.eval = function(ctx) {
  var properties = this.properties;
  var result = {};

  for (var i = 0, len = properties.length; i < len; i++) {
    var prop = properties[i];
    var kind = prop.kind;
    var key = prop.key;
    var value = prop.value;

    if (kind === 'init') {
      result[key] = value;
    } else {
      result[key] = value.eval(ctx);
    }
  }
  return result;
};

ast.SequenceExpressionNode.prototype.eval = function(ctx) {
  var expressions = this.expressions;

  for (var i = 0, len = expressions.length; i < len; i++) {
    expressions[i].eval(ctx);
  }
  return ctx;
};

ast.UnaryExpressionNode.prototype.eval = function(ctx) {
  var operator = this.operator;
  var result;
  switch (operator) {
    case '+': {
      result = +this.argument.eva(ctx);
      break;
    }
    case '-': {
      result = -this.argument.eval(ctx);
      break;
    }
    case '!': {
      result = !this.argument.eval(ctx);
      break;
    }
    default: {
      throw new Error ('runtime error: unrecognized unary operator '
                                                        + operator);
    }
  }

  return result;
};

ast.BinaryExpressionNode.prototype.eval = function(ctx) {
  var operator = this.operator;
  var left = this.left;
  var right = this.right;
  var result;

  switch (operator) {
    case '+': {
      result = left.eval(ctx) + right.eval(ctx);
      break;
    }
    case '-': {
      result = left.eval(ctx) - right.eval(ctx);
      break;
    }
    case '*': {
      result = left.eval(ctx) * right.eval(ctx);
      break;
    }
    case '/': {
      result = left.eval(ctx) / right.eval(ctx);
      break;
    }
    case '%': {
      result = left.eval(ctx) % right.eval(ctx);
      break;
    }
    case '<<': {
      result = left.eval(ctx) << right.eval(ctx);
      break;
    }
    case '>>': {
      result = left.eval(ctx) >> right.eval(ctx);
      break;
    }
    case '>>>': {
      result = left.eval(ctx) >>> right.eval(ctx);
      break;
    }
    case '>': {
      result = left.eval(ctx) > right.eval(ctx);
      break;
    }
    case '<': {
      result = left.eval(ctx) < right.eval(ctx);
      break;
    }
    case '>=': {
      result = left.eval(ctx) >= right.eval(ctx);
      break;
    }
    case '<=': {
      result = left.eval(ctx) <= right.eval(ctx);
      break;
    }
    case '==': {
      result = left.eval(ctx) === right.eval(ctx);
      break;
    }
    case '!=': {
      result = left.eval(ctx) !== right.eval(ctx);
      break;
    }
    case '&': {
      result = left.eval(ctx) & right.eval(ctx);
      break;
    }
    case '|': {
      result = left.eval(ctx) | right.eval(ctx);
      break;
    }
    case '^': {
      result = left.eval(ctx) ^ right.eval(ctx);
      break;
    }
    default: {
      throw new Error ('runtime error: unrecognized binary operator '
                                                        + operator);
    }
  };
  return result;
};

ast.AssignmentExpressionNode.prototype.eval = function(ctx) {
  ctx[this.left.name] = this.right.eval(ctx);
  return ctx;
};

ast.LogicalExpressionNode.prototype.eval = function(ctx) {
  var operator = this.operator;
  var left = this.left;
  var right = this.right;
  var result;
  switch (operator) {
    case '&&': {
      result = left.eval(ctx) && right.eval(ctx);
      break;
    }
    case '||': {
      result = left.eval(ctx) || right.eval(ctx);
      break;
    }
    default: {
      throw new Error ('runtime error: unrecognized logical operator '
                                                        + operator);
    }
  };
  return result;
};

ast.ConditionalExpressionNode.prototype.eval = function(ctx) {
  var test = this.test;
  var consequent = this.consequent;
  var alternate = this.alternate;

  return test.eval(ctx) ? consequent.eval(ctx) : alternate.eval(ctx);
};

ast.CallExpressionNode.prototype.eval = function(ctx) {
  var fn = functions[this.callee.name];

  // Check if the function is available in math library
  fn = fn || Math[this.callee.name];

  if (!fn) {
    throw new Error ('Unable to find function '
                      + JSON.stringify(this.callee.name));
  }
  var args = this.arguments.map(function(item) { return item.value; });
  return fn.apply(ctx, args);
};

ast.MemberExpressionNode.prototype.eval = function(ctx) {
  return this.object.eval(ctx)[this.property.name];
};

ast.IdentifierNode.prototype.eval = function(ctx) {
  return ctx[this.name];
};

ast.LiteralNode.prototype.eval = function(ctx) {
  var value = this.value;
  // For string strip the starting quotes (", ')

  if (!_.isEmpty(value) && _.isString(value)) {
    value = value.substring(1, value.length - 1);
  }

  return value;
};
