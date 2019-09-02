# Serverless Version Info

This Serverless plugin generates version information from `package.json` and `git` commands at the time of deployment. This can be included e.g. in a handler's response headers.

## Install

```
npm install --save-dev serverless-version-info
```

## Usage

Add `serverless-version-info` to your `serverless.yml` plugin section:

```yaml
plugins:
  - serverless-version-info
```

By default, this adds a `LAMBDA_VERSION` environment variable. Use this in your code:

```javascript
  headers['X-Lambda-Version'] = process.env.LAMBDA_VERSION;
```

Sample output header:

```
X-Lambda-Version: 0.0.1-15 (master/c9edfbe+2)
```

### Template variables

This plugin supports the following template variables:


| Variable     | Description                                                               | Example
|--------------|---------------------------------------------------------------------------|----------
| `ahead`      | Commits which have not been pushed to branch                              | 2
| `behind`     | Commits in branch which are not in the local codebase                     | 0
| `branch`     | Current `git` branch                                                      | master
| `delta`      | Number of untracked, deleted, modified, or renamed files vs latest commit | 2
| `hash`       | Short hash id of latest commit                                            | c9edfbe
| `patch`      | Patch/revision count, i.e. number of commits                              | 15
| `pkgVersion` | `version` in `package.json`                                               | 1.2.3
| `version`    | Semantic version derived from `pkgVersion` and `patch`                    | 1.2.15

These variables can be used in `serverless.yml` by prepending a `$` to them.

The default template is `$pkgVersion-$patch ($branch/$hash+$delta)`.

### Customization

By default, `serverless-version-info` sets the `LAMBDA_VERSION` environment variable. You may change this and the template(s) used in `serverless.yml`:

```yaml
custom:
  serverless-version-info:
    environment:
      LAMBDA_DEPLOYED_VERSION: true # default template
      X_VERSION_HEADER: "$version-$delta ($branch/$hash)" # 1.2.15-2 (master/c9edfbe)
```

If you define custom environment variables, `LAMBDA_VERSION` will *not* be set unless you also specify it in the configuration.

## Contribute

Please see the [Github repository](https://github.com/ibrado/serverless-version-info.git).




