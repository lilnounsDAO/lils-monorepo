import { Address } from 'viem'
import { keccak256, toBytes, stringToBytes } from 'viem'
import { imageData } from '@/utils/nounImages/imageData'

/**
 * Generate a deterministic noun seed from an address for whimsical display
 * Uses keccak256 hash of the address to generate pseudorandom trait indices
 */
export function getNounSeedFromAddress(address: Address): {
  background: number
  body: number
  accessory: number
  head: number
  glasses: number
} {
  // Access imageData properties directly inside the function to avoid initialization issues
  const bgcolors = imageData.bgcolors
  const bodies = imageData.images.bodies
  const accessories = imageData.images.accessories
  const heads = imageData.images.heads
  const glasses = imageData.images.glasses
  
  // Hash the address to get deterministic randomness
  const hash = keccak256(stringToBytes(address.toLowerCase()))
  const hashBytes = toBytes(hash)
  
  // Extract bytes for each trait (using different byte positions)
  const background = hashBytes[0] % bgcolors.length
  const body = hashBytes[1] % bodies.length
  const accessory = hashBytes[2] % accessories.length
  const head = hashBytes[3] % heads.length
  const glassesIndex = hashBytes[4] % glasses.length
  
  return {
    background,
    body,
    accessory,
    head,
    glasses: glassesIndex,
  }
}

