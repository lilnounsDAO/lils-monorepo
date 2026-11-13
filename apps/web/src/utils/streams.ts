import { Address, encodePacked, getContractAddress, keccak256, toBytes } from 'viem'

/**
 * Nouns StreamFactory (https://github.com/nounsDAO/streamer), shared by Nouns and
 * Lil Nouns. Each stream is a Solady clone with its terms written into the
 * clone's code, deployed with CREATE2, so its address is known before it exists.
 * A proposal relies on that: it creates the stream and funds it in the same
 * execution, sending tokens to the address it predicted.
 */
export const STREAM_FACTORY: Address = '0xb2fFEEF1F68CfacDeFdAFe6F1a9D30Ff47C7cB5e'
// `streamImplementation()` on the factory, an immutable
const STREAM_IMPLEMENTATION: Address = '0x780268514e532F296b9Bf47D7c5EE515b24f8872'

export interface StreamTerms {
  /** Whoever calls the factory: the DAO executor, when a proposal creates the stream */
  msgSender: Address
  payer: Address
  recipient: Address
  tokenAmount: bigint
  tokenAddress: Address
  startTime: bigint
  stopTime: bigint
  nonce?: number
}

/**
 * Solady LibClone's init code for a clone with immutable args (at the commit the
 * streamer pins), rebuilt from the same overlapping 32-byte writes its
 * `predictDeterministicAddress` makes, so it can't drift from the contract.
 */
function cloneInitCode(implementation: Address, data: Uint8Array): Uint8Array {
  const base = 0x80
  const mem = new Uint8Array(base + 0x20 + data.length + 0x40)
  const mstore = (offset: number, value: bigint) => {
    let x = value
    for (let i = 31; i >= 0; i--) {
      mem[offset + i] = Number(x & 0xffn)
      x >>= 8n
    }
  }
  const dataEnd = base + 0x20 + data.length
  const extraLength = BigInt(data.length + 2)
  mem.set(data, base + 0x20)
  mstore(base, 0x5af43d3d93803e606057fd5bf3n)
  mstore(base - 0x0d, BigInt(implementation))
  mstore(base - 0x21, (extraLength << 0x48n) | 0x593da1005b363d3d373d3d3d3d610000806062363936013d73n)
  // keccak256("ReceiveETH(uint256)")
  mstore(base - 0x3a, 0x9e4ac34f21c619cefc926c8bd93b54bf5a39c7ab2127a895af1cc0691d7e3dffn)
  mstore(base - 0x5a, ((extraLength + 0x62n) << 0x78n) | 0x6100003d81600a3d39f336602c57343d527fn)
  mstore(dataEnd, extraLength << 0xf0n)
  return mem.slice(base - 0x4c, base - 0x4c + data.length + 2 + 0x6c)
}

/** The address `StreamFactory.predictStreamAddress` would return, computed offline. */
export function predictStreamAddress(terms: StreamTerms): Address {
  const { msgSender, payer, recipient, tokenAmount, tokenAddress, startTime, stopTime, nonce = 0 } = terms
  const data = toBytes(
    encodePacked(
      ['address', 'address', 'address', 'uint256', 'address', 'uint256', 'uint256'],
      [STREAM_FACTORY, payer, recipient, tokenAmount, tokenAddress, startTime, stopTime],
    ),
  )
  const salt = keccak256(
    encodePacked(
      ['address', 'address', 'address', 'uint256', 'address', 'uint256', 'uint256', 'uint8'],
      [msgSender, payer, recipient, tokenAmount, tokenAddress, startTime, stopTime, nonce],
    ),
  )
  return getContractAddress({
    opcode: 'CREATE2',
    from: STREAM_FACTORY,
    salt,
    bytecodeHash: keccak256(cloneInitCode(STREAM_IMPLEMENTATION, data)),
  })
}
