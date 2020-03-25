import schedule from "node-schedule"

import Tweeter from "lib/Tweeter"

/**
 * @typedef {Object} Info
 * @prop {string} cron
 */

export default class extends Tweeter {

  /**
   * @constructor
   * @param {Info} info
   */
  constructor(info) {
    super(info.handle)
    this.info = info
    this.start()
  }

  start() {
    schedule.scheduleJob(this.info.cron, () => {
      console.log("Triggered")
    })
  }

}