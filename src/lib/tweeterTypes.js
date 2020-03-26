import DeadByDaylightBuild from "src/tweeters/DeadByDaylightBuild"
import SteamGameUpdate from "src/tweeters/SteamGameUpdate"
import Test from "src/tweeters/Test"

export default {
  test: {
    Type: Test,
  },
  steamGameUpdate: {
    Type: SteamGameUpdate,
  },
  deadByDaylightBuild: {
    Type: DeadByDaylightBuild,
  },
}