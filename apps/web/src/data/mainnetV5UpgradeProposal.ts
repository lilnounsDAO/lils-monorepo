import type { CustomTransactionAction } from '@/types/proposal-editor'

const DAO = '0x5d2C31ce16924C2a71D317e5BbFd5ce387854039' as const
const LOGIC_V5 = '0x7599C978684EC326FFbF9BdA0e76537d1458016e' as const

function call(
  signature: string,
  args: CustomTransactionAction['contractCallArguments'],
): CustomTransactionAction {
  return {
    type: 'custom-transaction',
    contractCallTarget: DAO,
    contractCallSignature: signature,
    contractCallArguments: args,
    contractCallValue: '0',
  }
}

export const MAINNET_V5_UPGRADE_TITLE = 'Upgrade governor to V5 and enable proposal candidates'

export const MAINNET_V5_UPGRADE_BODY = `This proposal upgrades the Lil Nouns governor in place from NounsDAOLogicV2 to NounsDAOLogicV5.

The DAO proxy stays ${DAO}. Existing proposals, voting delay, voting period, proposal threshold, and dynamic quorum stay in proxy storage.

After the new logic is installed, these V5 parameters are set:

Last-minute window: 600 blocks (about 2 hours).

Objection period: 14400 blocks (about 2 days).

Updatable period: 7200 blocks (about 1 day).

Future proposals snapshot votes at the start of voting.

The new logic is ${LOGIC_V5}. Proposal candidates live on NounsDAOData at 0x958C371d78d721435B1C6347084eCF6b98D0B83c. Sponsoring a candidate onto the governor works once this upgrade executes.`

export const MAINNET_V5_UPGRADE_ACTIONS: CustomTransactionAction[] = [
  call('_setImplementation(address)', [LOGIC_V5]),
  call('_setLastMinuteWindowInBlocks(uint32)', ['600']),
  call('_setObjectionPeriodDurationInBlocks(uint32)', ['14400']),
  call('_setProposalUpdatablePeriodInBlocks(uint32)', ['7200']),
  call('_setVoteSnapshotBlockSwitchProposalId()', []),
]
