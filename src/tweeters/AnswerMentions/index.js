import joi from "@hapi/joi"
import {omit} from "lodash"

import Reaction from "src/tweeters/Reaction"

export default class AnswerMentions extends Reaction {

  static schema = joi.object().keys({
    ...omit(Reaction.schema, "track"),
  })

  async start() {
    this.options.track = `@${this.options.handle}`
    await super.start()
  }

}