'use strict'

const debug = require('debug')('cov8:report')
const fs = require('fs')
const path = require('path')
const libCoverage = require('istanbul-lib-coverage')
const CoverageMap = require('istanbul-lib-coverage/lib/coverage-map').CoverageMap
const libReport = require('istanbul-lib-report')
const reports = require('istanbul-reports')
const v8ToIstanbul = require('v8-to-istanbul')
const uuid = require('uuid')

module.exports = class Report {
  /**
   * Construct new report instance
   * @param {String} directory Coverage directory
   * @param {Array} [reporters] List of reporters
   */
  constructor (directory, reporters = []) {
    debug(`Init new report handler with reporters: [${reporters.join(', ')}] on directory ${directory}`)
    this.reporters = reporters
    this.directory = directory

    this.reportsPaths = path.resolve(this.directory, './tmp')
    debug(`reportsPaths=${this.reportsPaths}`)
  }

  /**
   * Store coverage into coverage.map
   * @param {Object} result V8 result
   */
  store (result) {
    debug('Try to store reports')
    const reportsList = this.getReports(result)
    debug('Store reports')
    reportsList.forEach((report) => {
      fs.writeFileSync(path.join(this.reportsPaths, `${uuid.v4()}.json`), JSON.stringify(report))
    })
    debug('Reports stored')
  }

  /**
   * Get reports from V8
   * @param {Object} result V8 result
   */
  getReports (reports) {
    debug(`Format ${reports.length} reports`)
    return reports.map((report) => {
      const reportFormatted = v8ToIstanbul(report.url)
      reportFormatted.applyCoverage(report.functions)
      return reportFormatted.toIstanbul()
    })
  }

  /**
   * Retrieve previous reports from previous test
   */
  getPreviousReports () {
    debug('Try to get previous map')
    let reports = []
    fs.readdirSync(this.reportsPaths).map((reportName) => {
      let report = null
      try {
        report = JSON.parse(fs.readFileSync(path.join(this.reportsPaths, reportName)))
      } catch (err) {
        return debug(`Got an error on reading a report: ${err.message}`)
      }
      reports.push(report)
    })
    debug('Previous reports got')
    return reports
  }

  /**
   * Merge previous map with reports
   * @param {CoverageMap} map
   * @param {Array} reports
   */
  mergeMap (map, reports) {
    debug('Merge map with reports')
    reports.forEach((report) => {
      this.mergeReport(map, report)
    })
    return map
  }

  /**
   * Merge previous map with one report
   * @param {CoverageMap} map
   * @param {Object} report
   */
  mergeReport (map, report) {
    debug('Merge 1 report to map')
    let sourceMap
    if (report instanceof CoverageMap) {
      sourceMap = report
    } else {
      sourceMap = new CoverageMap(report)
    }
    Object.keys(sourceMap.data).forEach((k) => {
      let fc = sourceMap.data[k]
      if (map.data[k]) {
        this.mergeReportData(map.data[k], fc)
      } else {
        map.data[k] = fc
      }
    })
  }

  /**
   * Merge previous map with one report data
   * @param {CoverageMap} map
   * @param {Object} report data
   */
  mergeReportData (map, reportData) {
    debug('Merge 1 report data to map')
    Object.keys(reportData.branchMap).forEach(function (k) {
      if (!map.data.branchMap[k]) {
        map.data.branchMap[k] = reportData.branchMap[k]
      }
    })
    Object.keys(reportData.fnMap).forEach(function (k) {
      if (!map.data.fnMap[k]) {
        map.data.fnMap[k] = reportData.fnMap[k]
      }
    })
    Object.keys(reportData.statementMap).forEach(function (k) {
      if (!map.data.statementMap[k]) {
        map.data.statementMap[k] = reportData.statementMap[k]
      }
    })
    Object.keys(reportData.s).forEach(function (k) {
      map.data.s[k] += reportData.s[k]
    })
    Object.keys(reportData.f).forEach(function (k) {
      map.data.f[k] += reportData.f[k]
    })
    Object.keys(reportData.b).forEach(function (k) {
      let retArray = map.data.b[k]
      let secondArray = reportData.b[k]
      if (!retArray) {
        map.data.b[k] = secondArray
        return
      }
      for (let i = 0; i < retArray.length; i += 1) {
        retArray[i] += secondArray[i]
      }
    })
  }

  /**
   * Generate report with coverage map and istanbul report
   */
  generateReport () {
    debug('Try to generate report')
    const reportsList = this.getPreviousReports()
    const map = this.mergeMap(libCoverage.createCoverageMap({}), reportsList)
    const context = libReport.createContext({
      dir: this.directory
    })

    const tree = libReport.summarizers.pkg(map)
    this.reporters.forEach((reporter) => {
      debug(`Generate report for reporter ${reporter}`)
      tree.visit(reports.create(reporter), context)
    })
  }
}
