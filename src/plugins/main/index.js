import ensureArray from "ensure-array"

import {config} from "src/core"
import DeadByDaylightBuild from "src/tweeters/DeadByDaylightBuild"
import SteamGameUpdate from "src/tweeters/SteamGameUpdate"
import Test from "src/tweeters/Test"

const types = [
  {
    Type: SteamGameUpdate,
    configKey: "steamGameUpdates",
  },
  {
    Type: DeadByDaylightBuild,
    configKey: "deadByDaylightBuilds",
  },
]

class Main {

  /**
   * @type {import("../../tweeters/Tweeter).default")[]}
   */
  tweeters = []

  setCoreReference(core) {
    this.core = core
  }

  async init() {
    for (const {Type, configKey} of types) {
      const entries = ensureArray(config[configKey])
      for (const entry of entries) {
        const tweeter = new Type(entry)
        this.tweeters.push(tweeter)
      }
    }
    if (config.startupHandle) {
      this.tweeters.push(new Test(config.startupHandle))
    }
  }

}

export default new Main