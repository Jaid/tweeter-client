import joi from "@hapi/joi"
import Sequelize, {Op} from "sequelize"

import parseTime from "lib/parseTime"

import Reaction from "src/tweeters/Reaction"

export default class ReactionWithCooldown extends Reaction {

  static createTargetActionModel = () => {
    class TargetAction extends Sequelize.Model {}

    /**
     * @type {import("sequelize").ModelAttributes}
     */
    const schema = {
      targetUserId: {
        type: Sequelize.STRING(64),
        allowNull: false,
      },
      targetUserHandle: Sequelize.STRING(64),
      payload: Sequelize.JSON,
    }

    /**
     * @type {import("sequelize").ModelOptions}
     */
    const modelOptions = {
      updatedAt: false,
    }

    return {
      default: TargetAction,
      schema,
      modelOptions,
    }
  }

  static baseSchema = {
    ...Reaction.baseSchema,
    userCooldown: joi.string().default("1h"),
  }

  async start(models) {
    await super.start()
    this.TargetAction = ReactionWithCooldown.createTargetActionModel()
    await this.initDatabase({
      TargetAction: this.TargetAction,
      ...models,
    })
  }

  /**
   * @param {string} userId
   * @param {Object} [payload]
   * @return {Promise<void>}
   */
  async registerTargetActionFromId(userId, payload) {
    await this.database.models.TargetAction.create({
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
    await this.database.models.TargetAction.create({
      targetUserId: tweet.user.id_str,
      targetUserHandle: tweet.user.screen_name,
      payload,
    })
  }

  async shouldHandleTweet(tweet) {
    if (this.options.userCooldown) {
      const userCooldownMs = parseTime(this.options.userCooldown)
      const previousTweetForUser = await this.database.models.TargetAction.findOne({
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