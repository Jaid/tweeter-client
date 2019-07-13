import EventEmitter from "events"

import "lib/startDate"
import config from "lib/config"
import ensureArray from "ensure-array"
import SteamGameUpdate from "src/tweeters/SteamGameUpdate"

class Core extends EventEmitter {

  async init() {
    const tweeters = []
    for (const info of ensureArray(config.steamGameUpdates)) {
      const tweeter = new SteamGameUpdate(info)
      tweeters.push(tweeter)
    }
    debugger
  }

}

export default new Core