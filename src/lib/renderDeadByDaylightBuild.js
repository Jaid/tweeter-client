import Jimp from "jimp"
import renderDeadByDaylightBuild from "render-dead-by-daylight-build"

export default async (perkIds, backgroundBuffer) => {
  const foregroundBuffer = await renderDeadByDaylightBuild(perkIds)
  const foregroundJimp = await Jimp.create(foregroundBuffer)
  const backgroundJimp = await Jimp.create(backgroundBuffer)
  foregroundJimp.contain(backgroundJimp.getWidth(), backgroundJimp.getHeight())
  backgroundJimp.composite(foregroundJimp, 0, 0)
  const outputBuffer = await backgroundJimp.getBufferAsync(Jimp.MIME_PNG)
  return outputBuffer
}