import { getBlockNumber, getLogs } from "viem/actions";

type LogClient = Parameters<typeof getLogs>[0];
type GetLogsParams = Parameters<typeof getLogs>[1];
type LogRange = Pick<NonNullable<GetLogsParams>, "fromBlock" | "toBlock">;

/**
 * Every window asks for a fixed block range, so no pending logs come back and
 * the block fields are always set — which viem only narrows when `fromBlock`
 * and `toBlock` are passed to `getLogs` directly.
 */
type MinedLog = Awaited<ReturnType<typeof getLogs>>[number] & {
  blockNumber: bigint;
  blockHash: `0x${string}`;
  transactionHash: `0x${string}`;
  transactionIndex: number;
  logIndex: number;
};

/**
 * Infura and Alchemy both reject an eth_getLogs spanning more than 10k blocks
 * ("range N exceeds limit of 10000"), so `fromBlock: "earliest"` always fails
 * against them. Every scan has to be split into windows under that cap.
 */
const MAX_BLOCK_RANGE = 9_999n;

/** Default reach when no deployment block is known: roughly 70 days. */
const DEFAULT_LOOKBACK_BLOCKS = 500_000n;

/** Windows fetched at once. Enough to be quick, few enough not to be rate limited. */
const CONCURRENCY = 4;

/**
 * Like viem's `getLogs`, but split into windows the public RPCs accept.
 *
 * Bounded on purpose: scanning the whole chain from the browser would be
 * thousands of requests, so without an explicit `fromBlock` this only reaches
 * back `lookbackBlocks`. A window that fails is skipped rather than failing the
 * scan — these scans are fallbacks for missing subgraph data, so partial
 * results beat none.
 */
export async function getLogsChunked(
  client: LogClient,
  params: Omit<NonNullable<GetLogsParams>, "fromBlock" | "toBlock" | "blockHash">,
  options: { fromBlock?: bigint; lookbackBlocks?: bigint } = {},
) {
  const latest = await getBlockNumber(client);
  const lookback = options.lookbackBlocks ?? DEFAULT_LOOKBACK_BLOCKS;
  const floor =
    options.fromBlock ?? (latest > lookback ? latest - lookback : 0n);

  const ranges: LogRange[] = [];
  for (let from = floor; from <= latest; from += MAX_BLOCK_RANGE + 1n) {
    const to = from + MAX_BLOCK_RANGE;
    ranges.push({ fromBlock: from, toBlock: to > latest ? latest : to });
  }

  const collected: MinedLog[] = [];
  for (let i = 0; i < ranges.length; i += CONCURRENCY) {
    const batch = await Promise.all(
      ranges.slice(i, i + CONCURRENCY).map((range) =>
        getLogs(client, { ...params, ...range } as GetLogsParams).catch(
          () => [] as Awaited<ReturnType<typeof getLogs>>,
        ),
      ),
    );
    for (const logs of batch) {
      for (const log of logs) {
        if (log.blockNumber === null) continue;
        collected.push(log as MinedLog);
      }
    }
  }

  return collected.sort((a, b) => Number(a.blockNumber - b.blockNumber));
}
