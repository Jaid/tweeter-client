import dataUrls from "data-urls"
import Jimp from "jimp"
import qrcode from "qrcode"

export default async (code, backgroundBuffer, backgroundColor = 0xFFFFFFFF) => {
  const qrUrl = await qrcode.toDataURL(code, {
    errorCorrectionLevel: "L",
    scale: 32,
    color: {
      dark: "#000000FF",
      light: "#00000000",
    },
  })
  const qrBuffer = dataUrls(qrUrl).body
  const qrJimp = await Jimp.create(qrBuffer)
  if (!backgroundBuffer) {
    qrJimp.background(backgroundColor)
    qrJimp.contain(1920, 1080)
    return qrJimp.getBufferAsync("image/png")
  }
  qrJimp.contain(1920, 1080)
  const backgroundJimp = await Jimp.read(backgroundBuffer)
  backgroundJimp.composite(qrJimp, 0, 0)
  return backgroundJimp.getBufferAsync("image/png")
}