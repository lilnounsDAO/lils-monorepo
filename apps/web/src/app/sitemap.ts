import { getPostOverviews } from "@/data/cms/getPostOverviews";
import { getProposalOverviews } from "@/data/goldsky/governance/getProposalOverviews";
import { getTopics, makeTopicUrlId } from "@/data/goldsky/governance/getTopics";
import { getProposalIdeas, makeUrlId } from "@/data/goldsky/governance/getProposalIdeas";
import type { Sitemap } from "@/types/metadata";

export default async function sitemap(): Promise<Sitemap> {
  const postOverviews = await getPostOverviews();
  const learnBlogs = (postOverviews?.map((post: any) => ({
    url: `https://www.lilnouns.wtf/learn/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.9,
  })) ?? []) as Sitemap;

  const proposalOverviews = await getProposalOverviews();
  const proposals = (proposalOverviews?.map((proposal) => ({
    url: `https://www.lilnouns.wtf/vote/${proposal.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  })) ?? []) as Sitemap;

  const topics = await getTopics(1000);
  const topicPages = (topics
    ?.filter((topic) => !topic.canceled)
    ?.map((topic) => ({
      url: `https://www.lilnouns.wtf/topics/${makeTopicUrlId(topic.id)}`,
      lastModified: new Date(topic.lastUpdatedTimestamp * 1000),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })) ?? []) as Sitemap;

  const candidates = await getProposalIdeas(1000);
  const candidatePages = (candidates
    ?.filter((candidate) => !candidate.canceledTimestamp)
    ?.map((candidate) => ({
      url: `https://www.lilnouns.wtf/candidates/${makeUrlId(candidate.id)}`,
      lastModified: new Date(candidate.lastUpdatedTimestamp * 1000),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })) ?? []) as Sitemap;

  return [
    {
      url: "https://www.lilnouns.wtf",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://www.lilnouns.wtf/vote",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: "https://www.lilnouns.wtf/learn",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: "https://www.lilnouns.wtf/explore",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: "https://www.lilnouns.wtf/topics",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: "https://www.lilnouns.wtf/candidates",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: "https://www.lilnouns.wtf/profiles",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: "https://www.lilnouns.wtf/stats/treasury",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...proposals,
    ...learnBlogs,
    ...topicPages,
    ...candidatePages,
  ];
}
