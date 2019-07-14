import EventEmitter from "events"

import "lib/startDate"
import config from "lib/config"
import ensureArray from "ensure-array"
import SteamGameUpdate from "src/tweeters/SteamGameUpdate"
import Test from "src/tweeters/Test"

class Core extends EventEmitter {

  async init() {
    /**
     * @type {Tweeter[]}
     */
    const tweeters = []
    for (const info of ensureArray(config.steamGameUpdates)) {
      const tweeter = new SteamGameUpdate(info)
      tweeters.push(tweeter)
    }
    if (config.startupHandle) {
      tweeters.push(new Test(config.startupHandle))
    }
  }

}

export default new Core