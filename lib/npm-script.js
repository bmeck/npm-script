var path = require('path');
var merge = require('merge-recursive');
var fs = require('fs');
//
// getNPMSpawnOptions(process.cwd(), process.argv[2] || 'start', {
//   env: {
//     PATH: process.env.PATH
//   }
// }, function (err, spawnOptions) {
//   var script = require('child_process').spawn.apply(null, spawnOptions);
//   script.stderr.pipe(process.stderr);
//   script.stdout.pipe(process.stdout);
//   script.on('exit', process.exit.bind(process));
// });
//
function getNPMSpawnOptions(dir, lifecycle, options, callback) {
  //
  // Find our root package directory, need to know this for various env stuff (path in particular)
  //
  findPackage(dir, function (err, packageFile) {
    if (err) {
      callback(err, null);
      return;
    }
    fs.readFile(packageFile, function (err, packageContents) {
      if (err) {
        callback(err, null);
        return;
      }
      var packageJSON;
      //
      // Try and read in the package
      //
      try {
        packageJSON = JSON.parse(packageContents);
      }
      catch (e) {
        callback(e, null);
        return;
      }
      var root = path.dirname(packageFile);
      //
      // Generate general options
      //
      getBasicSpawnOptions(lifecycle, packageJSON, root, dir, function (err, spawnOptions) {
        if (err) {
          callback(err, null);
          return;
        }
        var env = spawnOptions[2].env;
        //
        // Add in overrides for config
        //
        if (options.config) {
          var to_replace = flattenAndPrefix(options.config, 'npm_config_');
          Object.keys(to_replace).forEach(function (key) {
            env[key] = to_replace[key];
          });
          for (var configKey in options.config) {
            if (semverMatchesPackage(configKey, packageJSON)) {
              var to_replace = flattenAndPrefix(options.config[packageJSON.name],'npm_package_config_');
              for(var key in to_replace) {
                env[key] = to_replace[key];
              }
            }
          }
        }
        env.npm_config_root = root;
        options.env = options.env || {};
        var PATH = options.env[getPathVariable()];
        if (PATH) {
          env[getPathVariable()] = concatPaths(PATH, env[getPathVariable()]);
        }
        merge({},options.env,env);
        callback(null, spawnOptions);
      });
    });
  });
}

function getPathVariable() {
  return process.platform === 'windows' ? 'path' : 'PATH';
}

function semverMatchesPackage(configKey, packageJSON) {
  return configKey === packageJSON.name || configKey === packageJSON.name + '@' + packageJSON.version;
}

function getBasicSpawnOptions(lifecycle, packageJSON, root, cwd, callback) {
  if (typeof packageJSON !== 'object' || packageJSON === null || Array.isArray(packageJSON)) {
    callback(new Error('package.json is not an object'));
    return;
  }
  if (!packageJSON.scripts || !packageJSON.scripts[lifecycle]) {
    callback(new Error('no script for ' + lifecycle));
    return;
  }
  //
  // Convert relevant info into an flat env object
  //
  var env = getEnv(lifecycle, packageJSON);
  //
  // Add in the path
  //
  var paths = [path.join(root, 'node_modules', '.bin')];
  env[getPathVariable()] = paths.reduce(concatPaths);
  //
  // Look for hooks
  //
  var hookFile = path.join(root, 'node_modules', '.hooks', lifecycle);
  fs.stat(hookFile, function (err, stat) {
    var script = packageJSON.scripts[lifecycle];
    //
    // Only run a hook if it is executable
    //
    if (!err && (process.platform === 'windows' || (stat.mode & parseInt(111, 8)))) {
      script += ' && ' + hookFile;
    }
    var argv = getRunnerArgs([script]);
    callback(null, [argv[0], argv[1], {
      env: env,
      cwd: cwd
    }]);
  });
}

function concatPaths(path1, path2) {
  if (path1) {
    if (path2) {
      return path1 + (process.platform === 'windows' ? ';' : ':') + path2;
    }
    return path1;
  }
  if (path2) {
    return path2;
  }
  return '';
}

function getRunnerArgs(argv) {
  var shell;
  argv = [ [argv.map(String).join(' ')] ];
  if (process.platform === 'windows') {
    shell = 'cmd.exe';
  }
  else {
    shell = process.env.SHELL || 'sh';
    argv.unshift('-c');
  };
  return [shell, argv];
}

function findPackage(dir, callback) {
  if (!dir || dir === '/') {
    callback(new Error('Not in a package'), null);
    return;
  }
  var file = path.join(dir, 'package.json');
  fs.stat(file, function (err, stat) {
    if (!err) {
      callback(null, file);
      return;
    }
    dir = path.join(dir, '..');
    findPackage(dir, callback);
  });
}

function getEnv(lifecycle, obj, config) {
  var env = flattenAndPrefix(obj, 'npm_package_');
  env.npm_lifecycle_event = lifecycle;
  return env;
}

function sluggify(str) {
  return str.replace(/[^0-9a-zA-Z\_]/g,'_');
}

function flattenAndPrefix(obj, prefix) {
  var result = {};
  for (var key in obj) {
    var value = obj[key];
    key = sluggify(key);
    if (typeof value === 'object' && value && !Array.isArray(value)) {
      var subvalue = flattenAndPrefix(value, '_');
      for (var subkey in subvalue) {
        result[prefix + key + sluggify(subkey)] = subvalue[subkey];
      }
    }
    else {
      result [prefix + key] = value + '';
    }
  }
  return result;
}
