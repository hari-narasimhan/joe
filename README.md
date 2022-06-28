# jso-ee
## JavaScript Object Expression Evaluator

jso-ee is a simple expression parser for objects. it handles arithmetic expression, logical expression assignments and if statement. There is no need to declare variables they are created on the fly and added to the context. The expression language is similar to javascript [ECMAScript 5.1], it uses the JavaScript parser written by Colin Ihrig [https://github.com/cjihrig/jsparser] behind the scene.



## Installation
```
  npm install --save-dev jso-ee
```

## Usage
```
  var JSOEE = require('jso-ee');
  var script = `
    charges = cost * 0.5

    if (cost > 10) {
      expensive = true
    }
  `;

  var ctx = { cost : 100 }
  var result = JSOEE.eval(script, ctx);
  // result will be { cost: 100, charges: 50, expensive: true }
```

## Use Cases
jso-ee was written to run rules against a object. It can be used as a simple rule engine.
