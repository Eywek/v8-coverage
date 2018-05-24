# cov8 - Native V8 coverage tool

Code-coverage using [v8's Inspector](https://nodejs.org/dist/latest-v8.x/docs/api/inspector.html)
that's compatible with [Istanbul's reporters](https://istanbul.js.org/docs/advanced/alternative-reporters/).

Like [nyc](https://github.com/istanbuljs/nyc), c8 just magically works:

```bash
npm i cov8 -g
cov8 node foo.js
```

The above example will collect coverage for `foo.js` using v8's inspector.

## How to use

Like the above example you just need to run this command to collect coverage: 

```bash
cov8 <command>
```

If you want to get a coverage report, you just need to run this:

```bash
cov8 report <reporter>
```

You can find the list of available reporters [here](https://github.com/istanbuljs/istanbuljs/tree/master/packages/istanbul-reports/lib).

If you want to clean the coverage folder, run this:

```bash
cov8 clear
```

### Options

Some options can be pass as parameter like:

- include _you can specify which files you want to cover_
- exclude _you can specify which files you want to don't cover_
- coverage-directory _where coverage files are stored (map/reports), `./coverage` by default_

You can get more help with:

```bash
cov8 --help
```


## How it Works

Before running your application cov8 creates [an inspector session](https://nodejs.org/api/inspector.html) in v8 and enables v8's
[built in coverage reporting](https://v8project.blogspot.com/2017/12/javascript-code-coverage.html).

Just before your application exits, cov8 fetches the coverage information from
v8 and writes it to disk in a format compatible with
[Istanbul's reporters](https://istanbul.js.org/).