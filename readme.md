# npm-script

Generate spawn options for running package.json scripts

## Example

Emulates `npm run-script $SCRIPT_NAME`

**NOTE: ** Does not add in the log wrapping like NPM

```javascript
var lifecycle = process.argv[2];
getNPMSpawnOptions(process.cwd(), lifecycle, {
  defaultScript: {
    start: 'node server.js',
    preinstall: '[ -f wscript] && (node-waf clean || true; node-waf configure build)'
  }[lifecycle],
  env: {
    PATH: process.env.PATH
  }
}, function (err, spawnOptions) {
  var script = require('child_process').spawn.apply(null, spawnOptions);
  script.stderr.pipe(process.stderr);
  script.stdout.pipe(process.stdout);
  script.on('exit', process.exit.bind(process));
});
```

## Differences from NPM

1. Does not add in defaults for scripts like `npm run-scripts start` (use options.defaultScript)
2. Does not auto add in the current path, set it in options.env (will append if already has a value)
3. Does not change users for you, use something like `suspawn`

## See

`npm help scripts`
