import {config} from "src/core"
import ensureArray from "ensure-array"
import SteamGameUpdate from "src/tweeters/SteamGameUpdate"
import Test from "src/tweeters/Test"

class Main {

  /**
   * @type {import("../../tweeters/Tweeter).default")[]}
   */
  tweeters = []

  setCoreReference(core) {
    this.core = core
  }

  async init() {
    for (const info of ensureArray(config.steamGameUpdates)) {
      const tweeter = new SteamGameUpdate(info)
      this.tweeters.push(tweeter)
    }
    if (config.startupHandle) {
      this.tweeters.push(new Test(config.startupHandle))
    }
  }

}

export default new Main