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
    this.post(`${_PKG_TITLE} v${_PKG_VERSION}, ${Date.now()}`)
  }

}