import EventEmitter from "events"

import authServer from "./authServer"
import twitterClient from "./twitterClient"
import api from "./api"

import "lib/startDate"

class Core extends EventEmitter {

  async init() {
    await twitterClient.init()
    await authServer.init()
    await api.init()
  }

}

export default new Core