import Jimp from "jimp"
import jsqr from "jsqr"

export default async buffer => {
  const jimpImage = await Jimp.read(buffer)
  const width = jimpImage.getWidth()
  const height = jimpImage.getHeight()
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = Jimp.intToRGBA(jimpImage.getPixelColor(x, y))
      data[(y * width + x) * 4 + 0] = color.r
      data[(y * width + x) * 4 + 1] = color.g
      data[(y * width + x) * 4 + 2] = color.b
      data[(y * width + x) * 4 + 3] = color.a
    }
  }
  return jsqr(data, width, height)
}