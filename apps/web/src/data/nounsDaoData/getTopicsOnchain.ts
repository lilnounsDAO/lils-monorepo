"use client";
import { getLogs } from "viem/actions";
import { decodeEventLog } from "viem";

import { CHAIN_CONFIG } from "@/config";
import { Topic } from "@/data/goldsky/governance/getTopics";
import { nounsDaoDataConfig } from "../nounsDaoDataContract";

type TopicCreatedLog = {
  args: {
    creator: `0x${string}`;
    title: string;
    description: string;
    slug: string;
    encodedTopicHash: `0x${string}`;
  };
  blockNumber: bigint;
  transactionHash: `0x${string}`;
};

const topicCreatedEvent = {
  type: "event",
  name: "TopicCreated",
  inputs: [
    { name: "creator", type: "address", indexed: true },
    { name: "title", type: "string", indexed: false },
    { name: "description", type: "string", indexed: false },
    { name: "slug", type: "string", indexed: false },
    { name: "encodedTopicHash", type: "bytes32", indexed: false },
  ],
} as const;

/**
 * Fallback topic fetcher that reads TopicCreated events directly from NounsDAOData.
 * Used when subgraph/Gateway data is missing.
 */
export async function getTopicsOnchain(): Promise<Topic[]> {
  try {
    const logs = await getLogs(CHAIN_CONFIG.publicClient, {
      address: CHAIN_CONFIG.addresses.nounsDAODataProxy,
      event: topicCreatedEvent,
      fromBlock: "earliest",
      toBlock: "latest",
    });

    const decodedLogs = logs.map((log) => {
      const decoded = decodeEventLog({
        abi: [topicCreatedEvent],
        data: log.data,
        topics: log.topics,
      }) as unknown as TopicCreatedLog;
      return { decoded, blockNumber: log.blockNumber, txHash: log.transactionHash };
    });

    // Fetch block timestamps
    const withTimestamps = await Promise.all(
      decodedLogs.map(async ({ decoded, blockNumber, txHash }) => {
        const block = await CHAIN_CONFIG.publicClient.getBlock({ blockNumber });
        const createdTimestamp = Number(block.timestamp);

        const creator = decoded.args.creator.toLowerCase();
        const slug = decoded.args.slug;
        const id = `${creator}-${slug}`;

        const topic: Topic = {
          id,
          creator,
          slug,
          title: decoded.args.title,
          description: decoded.args.description,
          encodedTopicHash: decoded.args.encodedTopicHash,
          canceled: false,
          createdTimestamp,
          createdBlock: Number(blockNumber),
          createdTransactionHash: txHash,
          lastUpdatedTimestamp: createdTimestamp,
          lastUpdatedBlock: Number(blockNumber),
          lastUpdatedTransactionHash: txHash,
          feedback: [],
          signatures: [],
        };

        return topic;
      }),
    );

    // Sort newest first
    return withTimestamps.sort((a, b) => b.createdTimestamp - a.createdTimestamp);
  } catch (error) {
    console.error("Failed to fetch topics onchain:", error);
    return [];
  }
}


