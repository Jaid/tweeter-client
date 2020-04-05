import Sequelize from "sequelize"

class Tweet extends Sequelize.Model {

}

/**
 * @type {import("sequelize").ModelAttributes}
 */
export const schema = {
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
export const modelOptions = {
  updatedAt: false,
}

export default Tweet