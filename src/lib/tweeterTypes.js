import AnimalCrossingQrCodes from "src/tweeters/AnimalCrossingQrCodes"
import DeadByDaylightBuild from "src/tweeters/DeadByDaylightBuild"
import Reaction from "src/tweeters/Reaction"
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
  reaction: {
    Type: Reaction,
  },
  animalCrossingQrCodes: {
    Type: AnimalCrossingQrCodes,
  },
}