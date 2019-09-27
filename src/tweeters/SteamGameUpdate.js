import SteamGameUpdateWatcher from "steam-game-update-watcher"
import {logger} from "src/core"
import fsp from "@absolunet/fsp"
import {createCanvas, loadImage, registerFont} from "canvas"
import moment from "moment"
import jimp from "jimp"

import Tweeter from "./Tweeter"

/**
 * @typedef Info
 * @type {Object}
 * @prop {string} depotId
 * @prop {string} title
 * @prop {string} handle
 * @prop {string} [backgroundFile]
 * @prop {number} [randomHue]
 */

export default class extends Tweeter {

  /**
   * @constructor
   * @param {Info} info
   */
  constructor(info) {
    super(info.handle)
    this.info = info
    this.watcher = new SteamGameUpdateWatcher({
      depotId: info.depotId,
    })
    this.watcher.on("contentChanged", async () => {
      try {
        const dataUrl = await this.renderImage()
        logger.info(dataUrl.substring(0, 50))
        await this.postMedia(dataUrl)
      } catch (error) {
        logger.error("Tweeter %s could not generate tweet: %s", this.id, error)
      }
    })
    this.watcher.start()
    logger.info("Started watching on Steam depot %s (%s)", info.depotId, info.title)
  }

  async renderImage() {
    const canvas = createCanvas(1920, 1080)
    const context = canvas.getContext("2d")

    if (this.info.backgroundFile) {
      let backgroundBuffer = await fsp.readFile(this.info.backgroundFile)
      if (this.info.randomHue) {
        const jimpImage = await jimp.read(backgroundBuffer)
        jimpImage.color([
          {
            apply: "hue",
            params: [Math.random() * this.info.randomHue - this.info.randomHue / 2],
          },
        ])
        backgroundBuffer = await jimpImage.getBufferAsync("image/png")
      }
      const backgroundImage = await loadImage(backgroundBuffer)
      context.drawImage(backgroundImage, 0, 0)
    } else {
      context.fillStyle = "#000"
      context.fillRect(0, 0, 1920, 1080)
    }

    context.fillStyle = "#DDD"
    context.textAlign = "center"
    context.textBaseline = "top"
    context.font = "240px Ubuntu"
    context.fillText("New Patch", 1920 / 2, 300)

    context.fillStyle = "#DDD"
    context.textAlign = "center"
    context.textBaseline = "top"
    context.font = "60px Ubuntu"
    context.fillText(`in ${this.info.title}`, 1920 / 2, 600)

    const dateString = moment().format("MMMM DD, YYYY")
    context.fillStyle = "#DDD"
    context.textAlign = "center"
    context.textBaseline = "bottom"
    context.font = "60px Ubuntu"
    context.fillText(dateString, 1920 / 2, 290)

    return canvas.toDataURL()
  }

}