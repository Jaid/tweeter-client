import Tweeter from "lib/Tweeter"

export default class extends Tweeter {

  async start() {
    this.post(`${_PKG_TITLE} v${_PKG_VERSION}, ${Date.now()}`)
  }

}