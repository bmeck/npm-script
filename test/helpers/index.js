var path = require('path');
exports.getFixture = function (fixturePath) {
   return path.join(__dirname, '..', 'fixtures', fixturePath);
}