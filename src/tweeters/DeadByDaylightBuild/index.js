import fsp from "@absolunet/fsp"
import joi from "@hapi/joi"
import bufferToDataUrl from "buffer-to-data-url"
import deadByDaylight from "dead-by-daylight"
import humanizeList from "humanize-list"
import schedule from "node-schedule"
import pickRandom from "pick-random"

import collator from "lib/collator"
import handlebars from "lib/handlebars"
import renderDeadByDaylightBuild from "lib/renderDeadByDaylightBuild"
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
    const backgroundBuffer = await this.getBackgroundBuffer()
    const renderedBuffer = await renderDeadByDaylightBuild(pickIds, backgroundBuffer)
    const dataUrl = bufferToDataUrl("image/png", renderedBuffer)
    await this.post(this.getText(picks), dataUrl)
  }

}