import DeadByDaylightBuild from "src/tweeters/DeadByDaylightBuild"
import QrCodeReactions from "src/tweeters/QrCodeReactions"
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
  qrCodeReactions: {
    Type: QrCodeReactions,
  },
}