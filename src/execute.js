'use strict'

const debug = require('debug')('cov8:execute')
const exclude = require('test-exclude')
const path = require('path')

module.exports = class Execute {
  /**
   * Construct execute instance, start v8 inspector
   * @param {Object} options
   * @param {Object} options.directory
   * @param {Object} options.include
   * @param {Object} options.exclude
   */
  constructor (options) {
    debug(`Execute with options ${JSON.stringify(options)}`)
    this.directory = options.directory
    this.enabled = Number(process.version.match(/^v(\d+\.\d+)/)[1]) > 8.0 // Check node version
    if (!this.enabled) return debug('Node < 8.0: Not enable profiler')
    this.Report = require('./report')
    this.exclude = exclude({
      include: options.include,
      exclude: options.exclude
    })
    this.startProfiler()
  }

  /**
   * Try to launch v8 inspector and start profiling coverage
   */
  startProfiler () {
    if (!this.enabled) return debug('Node < 8.0: Not enable profiler')
    debug('Start profiler')
    const inspector = require('inspector')
    inspector.open(0, true)
    this.session = new inspector.Session()
    this.session.connect()

    this.session.post('Profiler.enable')
    this.session.post('Runtime.enable')
    this.session.post(
      'Profiler.startPreciseCoverage',
      {callCount: true, detailed: true}
    )
  }

  /**
   * Stop profiling coverage
   * @param {Function} cb Callback called with <err, response>
   */
  stopProfiler (cb) {
    if (!this.enabled) return debug('Node < 8.0: Profiler not enabled')
    debug('Stop profiler')
    this.session.post('Profiler.takePreciseCoverage', (err, data) => {
      this.session.post('Profiler.stopPreciseCoverage')
      return cb(err, data)
    })
  }

  /**
   * Stop profiler and store coverage into coverage.map from /tmp/*.json
   */
  storeCoverage () {
    if (!this.enabled) return debug('Node < 8.0: Profiler not enabled')
    debug('Store coverage')
    this.stopProfiler((err, result) => {
      if (err) return debug(`Got an error on profiler stop: ${err.message}`)
      debug(`Handle profiler coverage (Reports: ${result.result.length})`)
      result = this.filterResult(result.result)
      debug(`Formatted reports: ${result.length}`)
      new this.Report(this.directory).store(result)
    })
  }

  /**
   * Filter result with include/exclude
   * @param {Object} result V8 result
   */
  filterResult (result) {
    result = result.filter((file) => {
      let url = file.url
      url = url.replace('file://', '')
      return path.isAbsolute(url) &&
        this.exclude.shouldInstrument(url) &&
        url !== __filename
    })
    return result
  }
}
