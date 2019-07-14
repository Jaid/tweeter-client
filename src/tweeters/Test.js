import fsp from "@absolunet/fsp"
import {createCanvas, loadImage, registerFont} from "canvas"
import moment from "moment"

import Tweeter from "./Tweeter"

const renderImage = async () => {
  const canvas = createCanvas(1920, 1080)
  const context = canvas.getContext("2d")
  const backgroundBuffer = await fsp.readFile("dist/background.png")
  const backgroundImage = await loadImage(backgroundBuffer)
  context.drawImage(backgroundImage, 0, 0)

  context.fillStyle = "#CCC"
  context.textAlign = "center"
  context.textBaseline = "top"
  context.font = "240px Ubuntu"
  context.fillText("New Patch", 1920 / 2, 300)

  context.fillStyle = "#CCC"
  context.textAlign = "center"
  context.textBaseline = "top"
  context.font = "60px Ubuntu"
  context.fillText("in Dead by Daylight", 1920 / 2, 600)

  const dateString = moment().format("MMMM DD, YYYY")
  context.fillStyle = "#CCC"
  context.textAlign = "center"
  context.textBaseline = "bottom"
  context.font = "60px Ubuntu"
  context.fillText(dateString, 1920 / 2, 290)

  return canvas.toDataURL()
}

export default class extends Tweeter {

  /**
   * @constructor
   * @param {string} handle
   */
  constructor(handle) {
    super(handle)
    this.run()
  }

  async run() {
    this.post(`${_PKG_TITLE} v${_PKG_VERSION}, ${Date.now()}`, [dataUrl])
  }

}