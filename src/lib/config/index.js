import essentialConfig from "essential-config"
import logger from "lib/logger"

import defaults from "./defaults.yml"

const configResult = essentialConfig(_PKG_TITLE, {
  defaults,
  sensitiveKeys: [
    "apiUser",
    "apiKey",
  ],
})

/**
 * @typedef {Object} Config
 * @prop {string} apiUser
 * @prop {string} apiKey
 * @prop {string} apiHost
 * @prop {string} apiProtocol
 * @prop {number} apiPort
 * @prop {{title: string, depotId: string, handle: string}[]} steamGameUpdates
 * @prop {boolean|string} startupHandle
 */

/**
 * @type {Config}
 */
const config = configResult.config

if (!config) {
  logger.warn("Set up default config, please edit and restart")
  process.exit(2)
}

/**
 * @type {string}
 */
export const appFolder = configResult.appFolder

export default config