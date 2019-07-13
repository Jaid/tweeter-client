import {createCanvas} from "canvas"
import fsp from "@absolunet/fsp"

import Tweeter from "./Tweeter"

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
    const canvas = createCanvas(1920, 1080)
    const context = canvas.getContext("2d")
    context.font = "200px \"Comic Sans\""
    context.fillStyle = "#00CC00"
    context.fillText("Everyone hates this font :(", 10, 500)
    const buffer = canvas.toBuffer("image/png", {
      compressionLevel: 9,
    })
    await fsp.outputFile("./dist/image.png", buffer)
    // this.post(`${_PKG_TITLE} v${_PKG_VERSION}, ${Date.now()}`)
  }

}