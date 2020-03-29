import fsp from "@absolunet/fsp"
import path from "path"

import AnimalCrossingFormat from "lib/AnimalCrossingFormat"
import getQrCodeFromBuffer from "lib/getQrCodeFromBuffer"
import isLikelyDesign from "lib/isLikelyDesign"

it("should parse an Animal Crossing code", async () => {
  const imageFile = path.join(__dirname, "AnimalCrossingDesign.png")
  const buffer = await fsp.readFile(imageFile)
  const qrCode = await getQrCodeFromBuffer(buffer)
  const byteArray = new Uint8Array(qrCode.binaryData)
  const animalCrossingDesign = new AnimalCrossingFormat(byteArray)
  const metadata = animalCrossingDesign.toJson()
  expect(metadata.title).toBe("Waluigi Dab")
  expect(metadata.patternTypeTitle).toBe("Normal pattern (easel)")
  expect(metadata.patternType).toBe(9)
  expect(metadata.townTitle).toBe("4chan")
  expect(metadata.authorTitle).toBe("MemeMan")
  expect(isLikelyDesign(metadata)).toBeTruthy()
})

it("should parse an Animal Crossing tune", async () => {
  const imageFile = path.join(__dirname, "AnimalCrossingTune.jpg")
  const buffer = await fsp.readFile(imageFile)
  const qrCode = await getQrCodeFromBuffer(buffer)
  const byteArray = new Uint8Array(qrCode.binaryData)
  const animalCrossingDesign = new AnimalCrossingFormat(byteArray)
  const metadata = animalCrossingDesign.toJson()
  expect(isLikelyDesign(metadata)).toBeFalsy()
})