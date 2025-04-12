// Same as @apiExample
const apiParser = require('./api_example.js');

/**
 * Exports
 */
module.exports = {
  parse: apiParser.parse,
  path: 'local.body.examples',
  method: apiParser.method,
};
