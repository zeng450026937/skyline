if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/parallel.cjs.prod.js');
} else {
  module.exports = require('./dist/parallel.cjs.js');
}
