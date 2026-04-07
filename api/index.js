const handler = require('../dist/serverless.js').default;

module.exports = function (req, res) {
  return handler(req, res);
};
