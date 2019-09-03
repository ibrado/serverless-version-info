'use strict';

const git = require('simple-git/promise');

const DEFAULT_VARIABLE = 'LAMBDA_VERSION';
const DEFAULT_VERSION = '0.0.1';
const DEFAULT_PATTERN = '$pkgVersion-$patch ($branch/$hash+$delta)';

var pkg = { version: DEFAULT_VERSION };

try {
  pkg = require(process.cwd() + '/package.json');
  if(!pkg.version) {
    console.log('WARNING: version not defined in package.json, using '+DEFAULT_VERSION)
    pkg.version = DEFAULT_VERSION;
  }
} catch(e) {
  console.log('WARNING: package.json not found, using '+DEFAULT_VERSION+' as version');
}

class ServerlessVersionInfo {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.commands = {
      deploy: {
        lifecycleEvents: ['functions']
      }
    };

    this.hooks = {
      'before:deploy:functions': this.beforeDeployFunctions.bind(this)
    }
  }

  beforeDeployFunctions() {
    return new Promise((resolve, reject) => {
      let stats = {}

      return git().raw(['rev-list', '--count', 'HEAD'])
      .then((p) => {
        stats.patch = p.replace(/[^\d]+/, '');
        return git().revparse(['--short', 'HEAD'])
      })
      .then((h) => {
        stats.hash = h;
        return git().status()
      })
      .then((s) => {
        stats.branch = s.current;
        stats.ahead = s.ahead;
        stats.behind = s.behind;

        stats.delta = s.not_added.length 
          + s.deleted.length
          + s.modified.length
          + s.renamed.length;

        stats.pkgVersion = pkg.version;
        let ver = pkg.version.split('.') || [];

        stats.major = ver[0] || '0';
        stats.minor = ver[1] || '1';
        stats.version = ver.slice(0, 2).join('.') + '.' + stats.patch;

        let svc = this.serverless.service;

        stats.stage = process.env.STAGE || svc.provider.stage || 'unknown';

        let custom = svc.custom || {};
        let config = custom['serverless-version-info'] || {};
        let configEnv = config.environment || {};

        let env = svc.provider.environment || {};

        if(!Object.keys(configEnv).length) {
          configEnv[DEFAULT_VARIABLE] = DEFAULT_PATTERN;
        }

        let vars = Object.keys(configEnv);

        for(let i in vars) {
          let variable = vars[i];
          let pattern = (configEnv[variable] === true || !configEnv[variable]) ?
            DEFAULT_PATTERN : configEnv[variable];

          env[variable] = pattern.replace(/\$(\w+)/g, (x) => { 
            x = x.slice(1);
            return stats[x]
          });

          this.serverless.cli.log('Set '+variable+' to "'+env[variable]+'"');
        }

        resolve(stats);
      })
      .catch((err) => {
        console.log('Error in ServerlessVersionInfo:');
        console.log(JSON.stringify(err, null, 2));
        reject(err);
      })
    })
  }
}

module.exports = ServerlessVersionInfo;

