'use strict'

const Execute = require('./execute')
const sw = require('spawn-wrap')
const onExit = require('signal-exit')
const argv = JSON.parse(process.env.COV8_OPTIONS)

if (argv.forks) {
  let childProcess = require('child_process')
  childProcess.fork = (execPath, args, opts) => {
    console.log(`Fork used with cov8 for file ${execPath}`)
    let child = childProcess.spawn('cov8', ['node', execPath], opts)
    return child
  }
  module.exports = childProcess
} else {
  // Start profiler
  const executer = new Execute({
    include: argv.include,
    exclude: argv.exclude,
    directory: argv.directory
  })
  if (!executer.enabled) {
    console.error('[COV8] This module only works for node > 8.0')
  }
  // Handle stop profiler on script stop
  onExit(_ => executer.storeCoverage(), {alwaysLast: true})
}
// Run script
sw.runMain()
