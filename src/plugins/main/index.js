import ensureArray from "ensure-array"
import {isEmpty} from "has-content"
import {JaidCorePlugin} from "jaid-core"

import Tweeter from "lib/Tweeter"
import tweeterTypes from "lib/tweeterTypes"

class Main extends JaidCorePlugin {

  /**
   * @type {import("../../tweeters/Tweeter).default")[]}
   */
  tweeters = []

  setCoreReference(core) {
    this.core = core
  }

  async init() {
    Tweeter.initStatic()

    const configuredTweeters = ensureArray(this.core.config.tweeters)

    if (isEmpty(configuredTweeters)) {
      this.log("No tweeters configured!")
      return
    }

    for (const {type, handle, dry, ...options} of configuredTweeters) {
      const tweeterType = tweeterTypes[type]
      if (!tweeterType) {
        this.logger.warn(`Unknown tweeter type ${type}`)
        return
      }
      const Type = tweeterType.Type
      let finalOptions = options
      if (Type.schema) {
        const result = Type.schema.validate(options)
        if (result.error) {
          this.logger.warn(`Invalid configuration for tweeter type ${type}`)
          this.logger.warn(result.error.message)
          throw new Error(result.error.message)
        }
        finalOptions = result.value
      }
      const tweeter = new Type(handle, dry, finalOptions)
      if (!handle) {
        this.log(`Tweeter #${tweeter.index} does not have a handle`)
        return
      }
      this.tweeters.push(tweeter)
      this.log("Registered tweeter #%s (%s) for @%s", tweeter.index, Type.displayName, handle)
    }

    for (const tweeter of this.tweeters) {
      await tweeter.start?.()
    }
  }

}

export default new Main