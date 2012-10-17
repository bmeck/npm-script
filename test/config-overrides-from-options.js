var npmScript = require('../');

var assert = require('assert');
var helpers = require('./helpers');

var __base = 'package-without-scripts-or-hooks';
npmScript.getSpawnOptions(
   helpers.getFixture(__base),
   'start',
   {
      config: require(helpers.getFixture('overriding-config.json'))
   },
   function (err, spawnOptions) {
      assert.ifError(err);
      var script = spawnOptions[1].pop();
      var env = spawnOptions[2].env;
      var cwd = spawnOptions[2].cwd;
      assert.equal(script, '');
      assert.equal(cwd, helpers.getFixture(__base));
      assert.equal(env.npm_lifecycle_event, 'start');
      assert.equal(env.npm_config_root, cwd);
      assert.equal(env.npm_package_name, require(helpers.getFixture(__base + '/package.json')).name);
      assert.notEqual(env.PATH.indexOf(helpers.getFixture(__base + '/node_modules/.bin')), -1);
      
      assert.equal(env.npm_config_npm_script_config_value, 'in config');
      assert.equal(env.npm_package_config_config_value, 'in config');
   }
);