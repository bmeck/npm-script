var npmScript = require('../');

var assert = require('assert');
var helpers = require('./helpers');

var __base = 'package-without-config';
npmScript.getSpawnOptions(
   helpers.getFixture(__base),
   'start',
   {
      config: require(helpers.getFixture('default-config.json')),
      defaultScript: 'node server.js'
   },
   function (err, spawnOptions) {
      assert.ifError(err);
      var script = spawnOptions[1].pop();
      var env = spawnOptions[2].env;
      var cwd = spawnOptions[2].cwd;
      assert.equal(script, 'node server.js');
      assert.equal(cwd, helpers.getFixture(__base));
      assert.equal(env.npm_lifecycle_event, 'start');
      assert.equal(env.npm_config_root, cwd);
      assert.equal(env.npm_package_name, require(helpers.getFixture(__base + '/package.json')).name);
      assert.notEqual(env.PATH.indexOf(helpers.getFixture(__base + '/node_modules/.bin')), -1);
   }
);