'use strict'

const Execute = require('./execute')
const sw = require('spawn-wrap')
const onExit = require('signal-exit')
const argv = JSON.parse(process.env.COV8_OPTIONS)

// Start profiler
const executer = new Execute({
  include: argv.include,
  exclude: argv.exclude,
  directory: argv.directory
})
// Handle stop profiler on script stop
onExit(_ => executer.storeCoverage(), {alwaysLast: true})
// Run script
sw.runMain()
