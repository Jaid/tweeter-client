import JaidCore from "jaid-core"

import defaults from "./defaults.yml"

const core = new JaidCore({
  name: _PKG_TITLE,
  version: _PKG_VERSION,
  gotLogLevel: "info",
  useGot: true,
  configSetup: {
    defaults,
    secretKeys: ["apiKey"],
  },
})

/**
 * @typedef {Object} SteamGameUpdate
 * @prop {string} title
 * @prop {number} depotId
 * @prop {string} handle
 * @prop {string} backgroundFile
 * @prop {number} randomHue
 */

/**
 * @typedef {Object} TweeterSetup
 * @prop {string} handle
 * @prop {bool} dry
 * @prop {string} type
 */

/**
 * @typedef {Object} Config
 * @prop {string} apiUser
 * @prop {string} apiKey
 * @prop {string} apiHost
 * @prop {string} apiProtocol
 * @prop {string} apiPort
 * @prop {string} startupHandle
 * @prop {TweeterSetup[]} tweeters
 */

/**
 * @type {import("jaid-logger").JaidLogger}
 */
export const logger = core.logger

/**
 * @type {import("jaid-core").BaseConfig & Config}
 */
export const config = core.config

export default core