var npmScript = require('../');

var assert = require('assert');
var helpers = require('./helpers');

var __base = 'invalid-package';
npmScript.getSpawnOptions(
   helpers.getFixture(__base),
   'start',
   {
      config: require(helpers.getFixture('default-config.json'))
   },
   function (err, spawnOptions) {
      assert.notEqual(err, null);
   }
);