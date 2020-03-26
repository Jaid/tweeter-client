import schedule from "node-schedule"

import Tweeter from "lib/Tweeter"

/**
 * @typedef {Object} Info
 * @prop {string} cron
 */

export default class extends Tweeter {

  static displayName = "DeadByDaylightBuild"

  start() {
    schedule.scheduleJob(this.info.cron, () => {
      console.log("Triggered")
    })
  }

}