import joi from "@hapi/joi"
import {Op} from "sequelize"

import parseTime from "lib/parseTime"

import Reaction from "src/tweeters/Reaction"

import TargetAction from "./TargetAction"

export default class ReactionWithCooldown extends Reaction {

  static models = {
    TargetAction: require("./TargetAction"),
  }

  static baseSchema = {
    ...Reaction.baseSchema,
    userCooldown: joi.string().default("1h"),
  }

  async start() {
    await super.start()
    await this.initDatabase(ReactionWithCooldown.models)
  }

  /**
   * @param {string} userId
   * @param {Object} [payload]
   * @return {Promise<void>}
   */
  async registerTargetActionFromId(userId, payload) {
    await TargetAction.create({
      targetUserId: userId,
      payload,
    })
  }

  /**
   * @param {string} userId
   * @param {Object} [payload]
   * @return {Promise<void>}
   */
  async registerTargetActionFromTweet(tweet, payload) {
    await TargetAction.create({
      targetUserId: tweet.user.id_str,
      targetUserHandle: tweet.user.screen_name,
      payload,
    })
  }

  async shouldHandleTweet(tweet) {
    if (this.options.userCooldown) {
      const userCooldownMs = parseTime(this.options.userCooldown)
      const previousTweetForUser = await TargetAction.findOne({
        where: {
          targetUserId: tweet.user.id_str,
          createdAt: {
            [Op.gt]: Date.now() - userCooldownMs,
          },
        },
      })
      if (previousTweetForUser) {
        this.logger.debug(`Recently made a tweet for @${tweet.user.screen_name}, cooling down before making another`)
        return false
      }
    }
    return true
  }

}