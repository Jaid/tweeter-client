import SteamGameUpdateWatcher from "steam-game-update-watcher"
import logger from "lib/logger"

import Tweeter from "./Tweeter"

/**
 * @typedef Info
 * @type {Object}
 * @prop {string} depotId
 * @prop {string} title
 * @prop {string} handle
 */

export default class extends Tweeter {

  constructor(info) {
    super(info.handle)
    /**
     * @type {Info}
     */
    this.watcher = new SteamGameUpdateWatcher({
      depotId: info.depotId,
    })
    this.watcher.on("contentChanged", changes => {
      this.post(`Content changed! ${Math.random()}`)
    })
    this.watcher.start()
    logger.info("Started watching on Steam depot %s (%s)", info.depotId, info.title)
  }

}