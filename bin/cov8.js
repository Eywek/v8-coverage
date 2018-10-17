#!/usr/bin/env node
'use strict'

const yargs = require('yargs')
const exclude = require('test-exclude')
const sw = require('spawn-wrap')
const foreground = require('foreground-child')
const mkdirp = require('mkdirp')
const rimraf = require('rimraf')
const path = require('path')

yargs // eslint-disable-line
  .usage('$0 [opts] <script> [opts]')
  .pkgConf('nyc')
  .option('exclude', {
    alias: 'x',
    default: exclude.defaultExclude,
    describe: 'a list of specific files and directories that should be excluded from coverage, glob patterns are supported.'
  })
  .option('include', {
    alias: 'n',
    default: [],
    describe: 'a list of specific files that should be covered, glob patterns are supported'
  })
  .option('coverage-directory', {
    alias: 'd',
    default: './coverage',
    describe: 'directory to output coverage JSON and reports'
  })
  .option('forks', {
    alias: 'f',
    default: false,
    boolean: true,
    describe: 'only cover fork processes'
  })
  .command('<script>')
  .describe('default', 'Execute test')
  .example('$0 mocha test.js', 'Execute test and generate coverage')
  .command('report <reporter>')
  .describe('report', 'Generate reporting')
  .example('$0 report lcov', 'Generate lcov coverage report')
  .command('clear')
  .describe('clear', 'Clear coverage directory')
  .demandCommand(1)
  .argv

mkdirp.sync(path.join(yargs.argv['coverage-directory'], './tmp'))

if (yargs.argv._[0] === 'clear') {
  rimraf.sync(yargs.argv['coverage-directory'])
} else if (yargs.argv._[0] === 'report') {
  // reporting
  const reporters = yargs.argv._
  reporters.shift()
  if (Number(process.version.match(/^v(\d+\.\d+)/)[1]) > 8.0) {
    const Report = require('../src/report')
    new Report(yargs.argv['coverage-directory'], reporters).generateReport()
  } else {
    console.error('[COV8] This module only works for node > 8.0')
  }
} else {
  // launch coverage
  sw([require.resolve('../src/launch.js')], {
    COV8_OPTIONS: JSON.stringify({
      include: yargs.argv.include,
      exclude: yargs.argv.exclude,
      directory: yargs.argv['coverage-directory'],
      forks: yargs.argv.forks
    })
  })
  // launch test
  foreground(yargs.argv._)
}
