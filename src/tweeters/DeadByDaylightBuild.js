import joi from "@hapi/joi"
import deadByDaylight from "dead-by-daylight"
import schedule from "node-schedule"
import pickRandom from "pick-random"
import renderDeadByDaylightBuild from "render-dead-by-daylight-build"

import Tweeter from "lib/Tweeter"

/**
 * @typedef {Object} Info
 * @prop {string} cron
 */

export default class extends Tweeter {

  static displayName = "DeadByDaylightBuild"

  static schema = joi.object().keys({
    type: joi.string(),
    cron: joi.string(),
    backgroundFile: joi.string().required(),
  })

  start() {
    schedule.scheduleJob(this.options.cron, () => {
      console.log("Triggered")
    })
  }

}