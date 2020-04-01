import fsp from "@absolunet/fsp"
import joi from "@hapi/joi"
import deadByDaylight from "dead-by-daylight"
import handlebars from "handlebars"
import humanizeList from "humanize-list"
import Jimp from "jimp"
import schedule from "node-schedule"
import pickRandom from "pick-random"
import renderDeadByDaylightBuild from "render-dead-by-daylight-build"

import collator from "lib/collator"
import Tweeter from "lib/Tweeter"

/**
 * @typedef {Object} Info
 * @prop {string} cron
 */

function sortPerks(perk1, perk2) {
  return collator.compare(perk1.title, perk2.title)
}

export default class extends Tweeter {

  static schema = joi.object().keys({
    perksType: joi.string(),
    cron: joi.string(),
    backgroundFile: joi.string().required(),
    template: joi.string().default("Today's Dead by Daylight {{options.perksType}} build contains {{perks}}."),
  })

  async start() {
    this.template = handlebars.compile(this.options.template, {noEscape: true})
    if (!this.options.cron) {
      await this.run()
    }
    schedule.scheduleJob(this.options.cron, () => {
      this.run()
    })
  }

  getPerkPool() {
    const perks = Object.values(deadByDaylight.perks)
    if (this.options.perksType) {
      return perks.filter(perk => {
        if (!perk.visible) {
          return false
        }
        return perk.for === this.options.perksType
      })
    }
    return perks.filter(perk => {
      if (!perk.visible) {
        return false
      }
      return true
    })
  }

  getPicks() {
    const perks = this.getPerkPool()
    const picks = pickRandom(perks, {count: 4})
    picks.sort(sortPerks)
    return picks
  }

  getText(picks) {
    return this.template({
      perks: humanizeList(picks.map(perk => perk.title)),
      options: this.options,
    })
  }

  async getBackgroundBuffer() {
    const backgroundBuffer = await fsp.readFile(this.options.backgroundFile)
    return backgroundBuffer
  }

  async run() {
    const picks = this.getPicks()
    const pickIds = picks.map(perk => perk.id)
    const foregroundBuffer = await renderDeadByDaylightBuild(pickIds)
    const foregroundJimp = await Jimp.create(foregroundBuffer)
    const backgroundBuffer = await this.getBackgroundBuffer()
    const backgroundJimp = await Jimp.create(backgroundBuffer)
    foregroundJimp.contain(backgroundJimp.getWidth(), backgroundJimp.getHeight())
    backgroundJimp.composite(foregroundJimp, 0, 0)
    const outputBuffer = await backgroundJimp.getBase64Async(Jimp.MIME_PNG)
    await this.post(this.getText(picks), outputBuffer)
  }

}