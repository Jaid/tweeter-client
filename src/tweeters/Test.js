import Tweeter from "lib/Tweeter"

export default class extends Tweeter {

  static displayName = "Test"

  async start() {
    this.post(`${_PKG_TITLE} v${_PKG_VERSION}, ${Date.now()}`)
  }

}