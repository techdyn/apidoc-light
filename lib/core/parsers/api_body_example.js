// Same as @apiExample
const apiParser = require('./api_example.js');

function parse (content, source) {
  const result = apiParser.parse(content, source);
  if (typeof result.type === 'string' && result.type.toLowerCase() === 'boolean') {
    result.checked = Boolean(result.defaultValue);
  }
  return {
    group: 'Body',
    ...result
  };
}


/**
 * Exports
 */
module.exports = {
  parse: parse,
  path: 'local.body.examples',
  method: apiParser.method,
};
