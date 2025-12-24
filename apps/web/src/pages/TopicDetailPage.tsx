import { Helmet } from "react-helmet-async";
import {
  SidebarMainContent,
  SidebarProvider,
  SidebarSideContent,
} from "@/components/Sidebar/ProposalSidebar";
import { Link, useParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { IdentityExplorerLink } from "@/components/IdentityExplorerLink";
import { ProposalStateBadge } from "@/components/Proposal/ProposalStateBadge";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import LoadingSkeletons from "@/components/LoadingSkeletons";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import TopicSidebar from "@/components/Topic/TopicSidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getTopic,
  normalizeTopicId,
  Topic,
} from "@/data/goldsky/governance/getTopics";
import {
  ProposalIdea,
  SponsorSignature,
  FeedbackPost,
} from "@/data/goldsky/governance/ideaTypes";
import { useCancelTopic } from "@/hooks/transactions/useCancelTopic";
import { formatTimeLeft } from "@/utils/format";
import { getAddress } from "viem";
import VotingSummary from "@/components/Proposal/VotingSummary";
import FilteredSortedTopicFeedback, {
  FEEDBACK_SORT_ITEMS,
} from "@/components/Topic/FilteredSortedTopicFeedback";
import { ResponsiveContent } from "@/components/ResponsiveContet";
import { CandidateFeedbackForm as TopicFeedbackForm } from "@/components/Topic/TopicFeedbackForm";
import SortProvider, { SortSelect } from "@/components/Sort";
import TopicFeedbackProvider from "@/components/Topic/TopicFeedbackProvider";
import SearchProvider, { SearchInput } from '@/components/Search'

export default function TopicDetailPage() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return (
      <div className="flex w-full max-w-4xl flex-col items-center justify-center p-20">
        <h1 className="heading-2 mb-4">Invalid Topic ID</h1>
      </div>
    );
  }

  const topicId = normalizeTopicId(id);

  return (
    <TopicFeedbackProvider>
      <SearchProvider>
        <SortProvider defaultSortValue="recent">
          <>
            <Helmet>
              <title>{`Discussion ${id} | Lil Nouns DAO`}</title>
              <meta
                name="description"
                content={`View and discuss discussion ${id} in Lil Nouns DAO.`}
              />
              <link
                rel="canonical"
                href={`https://www.lilnouns.wtf/discussions/${id}`}
              />

              {/* OpenGraph */}
              <meta
                property="og:title"
                content={`Discussion ${id} | Lil Nouns DAO`}
              />
              <meta
                property="og:description"
                content={`View and discuss discussion ${id} in Lil Nouns DAO.`}
              />
              <meta
                property="og:url"
                content={`https://www.lilnouns.wtf/discussions/${id}`}
              />
            </Helmet>

            {/* Desktop */}
            <div className="hidden w-full lg:block">
              <SidebarProvider>
                <SidebarMainContent>
                  <div className="flex w-full max-w-[780px] flex-col gap-8 p-6 pb-[400px] md:p-10 md:pb-[400px]">
                    <div className="flex w-full flex-col gap-8 md:px-4">
                      {/* Breadcrumb */}
                      <div className="flex items-center gap-2 paragraph-sm">
                        <Link to="/topics">Topics</Link>
                        <ChevronRight
                          size={16}
                          className="stroke-content-secondary"
                        />
                        <span className="text-content-secondary">
                          Topic {id}
                        </span>
                      </div>

                      <TopicTopWrapper topicId={topicId} />
                      <TopicMarkdownWrapper topicId={topicId} />
                    </div>

                    <ResponsiveContent screenSizes={["lg"]}>
                      <CreateFeedbackWrapper topicId={topicId} />
                    </ResponsiveContent>
                  </div>
                </SidebarMainContent>

                <SidebarSideContent className="flex flex-col gap-8 p-6 pb-24 pt-10 scrollbar-thin">
                  <TopicSidebarWrapper topicId={topicId} />
                  <FeedbackSummaryWrapper topicId={topicId} />
                  <div className="flex justify-between">
                    <div>
                      <h2 className="heading-5">Feedback</h2>
                      {/* <LearnHowFeedbackWorksTooltipPopover /> */}
                      {/* todo: add tooltip */}
                    </div>
                    <div className="flex flex-col gap-2">
                      <SortSelect
                        items={FEEDBACK_SORT_ITEMS}
                        className="w-[160px]"
                      />
                    </div>
                  </div>
                  <SearchInput
                    placeholder="Search feedback"
                    className="w-full bg-background-primary"
                  />

                  <div className="flex flex-col gap-6 pb-[48px]">
                    <FeedbackWrapper topicId={topicId} />
                  </div>
                </SidebarSideContent>
              </SidebarProvider>
            </div>
          </>
        </SortProvider>
      </SearchProvider>
    </TopicFeedbackProvider>
  );
}

function FeedbackSummaryWrapper({ topicId }: { topicId: string }) {
  const { data: topic, isLoading } = useQuery({
    queryKey: ["topic", topicId],
    queryFn: () => getTopic(topicId),
  });

  if (isLoading) {
    return <Skeleton className="h-[112px] w-full" />;
  }

  if (!topic) {
    return null;
  }

  const topicIdea = mapTopicToProposalIdea(topic);
  const feedbackPosts = topicIdea.feedbackPosts || [];

  const latestFeedbackByVoter = new Map<string, (typeof feedbackPosts)[0]>();
  feedbackPosts.forEach((feedback) => {
    const voterKey = feedback.voterAddress.toLowerCase();
    const existing = latestFeedbackByVoter.get(voterKey);

    if (!existing || feedback.createdTimestamp > existing.createdTimestamp) {
      latestFeedbackByVoter.set(voterKey, feedback);
    }
  });

  const uniqueFeedback = Array.from(latestFeedbackByVoter.values());
  const forCount = uniqueFeedback.filter((f) => f.support === 1).length;
  const againstCount = uniqueFeedback.filter((f) => f.support === 0).length;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="heading-6">Feedback Summary</h2>
      <VotingSummary
        forVotes={forCount}
        againstVotes={againstCount}
        abstainVotes={0}
        quorumVotes={0}
        proposal={undefined}
      />
    </div>
  );
}

function CreateFeedbackWrapper({ topicId }: { topicId: string }) {
  const {
    data: topic,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["topic", topicId],
    queryFn: () => getTopic(topicId),
  });

  if (isLoading) {
    return <LoadingSkeletons count={10} className="h-[100px] w-full" />;
  }

  if (!topic) {
    return null;
  }

  const topicIdea = mapTopicToProposalIdea(topic);

  return (
    <ResponsiveContent screenSizes={["lg"]}>
      {/* todo: look into */}
      <TopicFeedbackForm candidate={topicIdea} onSuccess={() => refetch()} />
    </ResponsiveContent>
  );
}

function FeedbackWrapper({ topicId }: { topicId: string }) {
  const {
    data: topic,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["topic", topicId],
    queryFn: () => getTopic(topicId),
  });

  if (isLoading) {
    return <LoadingSkeletons count={10} className="h-[100px] w-full" />;
  }

  if (!topic) {
    return null;
  }

  const topicIdea = mapTopicToProposalIdea(topic);

  return (
    <FilteredSortedTopicFeedback
      feedbackPosts={topicIdea.feedbackPosts || []}
      candidateCanceled={!!topicIdea.canceledTimestamp}
    />
  );
}

function TopicTopWrapper({ topicId }: { topicId: string }) {
  const { data: topic, isLoading } = useQuery({
    queryKey: ["topic", topicId],
    queryFn: () => getTopic(topicId),
  });

  if (isLoading) {
    return <LoadingSkeletons count={3} className="h-[80px] w-full" />;
  }

  if (!topic) {
    return (
      <div className="flex h-screen w-full flex-col items-center gap-4 py-8 text-center">
        <h2>Topic not found.</h2>
        <Link to="/topics">
          <Button className="rounded-full">Back to topics</Button>
        </Link>
      </div>
    );
  }

  const topicIdea = mapTopicToProposalIdea(topic);
  const nowTimestamp = Math.floor(Date.now() / 1000);
  const timeDelta = Math.max(nowTimestamp - topicIdea.createdTimestamp, 0);
  const timeAgo = formatTimeLeft(timeDelta, true);

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="heading-3">{topicIdea.latestVersion.content.title}</h1>
          <div className="flex items-center gap-2"></div>
        </div>
        <div className="flex gap-2 text-content-secondary label-sm">
          <span>{timeAgo} ago</span>
          {topic.canceled && <ProposalStateBadge state="cancelled" />}
          {topicIdea.latestVersion.proposalId && (
            <ProposalStateBadge state="executed" />
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center whitespace-pre-wrap border-b border-t py-6 leading-7 text-content-secondary">
        From{" "}
        <IdentityExplorerLink
          address={getAddress(topicIdea.proposerAddress)}
          showAvatar
        />
      </div>
    </>
  );
}

function TopicMarkdownWrapper({ topicId }: { topicId: string }) {
  const { data: topic, isLoading } = useQuery({
    queryKey: ["topic", topicId],
    queryFn: () => getTopic(topicId),
  });

  if (isLoading) {
    return <LoadingSkeletons count={20} className="h-[200px] w-full" />;
  }

  if (!topic) {
    return null;
  }

  const topicIdea = mapTopicToProposalIdea(topic);
  let description = topicIdea.latestVersion.content.description;
  const title = topicIdea.latestVersion.content.title;
  if (title && description.startsWith(`# ${title}\n\n`)) {
    description = description.substring(`# ${title}\n\n`.length);
  } else if (title && description.startsWith(`# ${title}\n`)) {
    description = description.substring(`# ${title}\n`.length);
  }

  return <MarkdownRenderer className="gap-4">{description}</MarkdownRenderer>;
}

function TopicSidebarWrapper({ topicId }: { topicId: string }) {
  const queryClient = useQueryClient();
  const {
    data: topic,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["topic", topicId],
    queryFn: () => getTopic(topicId),
  });

  const {
    cancelTopic,
    state: cancelState,
    error: cancelError,
  } = useCancelTopic();

  const topicIdea = topic ? mapTopicToProposalIdea(topic) : null;

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  if (!topic || !topicIdea) {
    return null;
  }

  const handleCancel = async () => {
    try {
      await cancelTopic(topic);
      queryClient.invalidateQueries({ queryKey: ["topic", topicId] });
      setTimeout(async () => {
        await refetch();
      }, 3000);
    } catch (error) {
      console.error("Failed to cancel topic:", error);
    }
  };

  const hasBeenPromoted = !!topicIdea.latestVersion.proposalId;

  return (
    <TopicSidebar
      topic={topicIdea}
      onCancel={!topic.canceled && !hasBeenPromoted ? handleCancel : undefined}
      cancelState={
        !topic.canceled && !hasBeenPromoted ? cancelState : undefined
      }
      cancelError={
        !topic.canceled && !hasBeenPromoted
          ? cancelError
            ? new Error(cancelError.message)
            : null
          : null
      }
    />
  );
}

function mapTopicToProposalIdea(topic: Topic): ProposalIdea {
  const signatures: SponsorSignature[] = (topic.signatures || []).map(
    (sig) => ({
      sig: sig.sig,
      signer: {
        id: getAddress(sig.signerAddress),
        nounsRepresented: [],
      },
      expirationTimestamp: sig.expirationTimestamp,
      canceled: sig.status === "expired",
      status: sig.status,
    })
  );

  const feedbackPosts: FeedbackPost[] = (topic.feedback || []).map((fb) => ({
    id: fb.id,
    voterAddress: getAddress(fb.voterAddress),
    support: fb.support,
    reason: fb.reason,
    votes: 0,
    createdTimestamp: fb.createdTimestamp,
  }));

  return {
    id: topic.id,
    proposerAddress: getAddress(topic.creator),
    slug: topic.slug,
    createdTimestamp: topic.createdTimestamp,
    canceledTimestamp: topic.canceled ? topic.lastUpdatedTimestamp : null,
    lastUpdatedTimestamp: topic.lastUpdatedTimestamp,
    latestVersion: {
      id: topic.id,
      createdTimestamp: topic.lastUpdatedTimestamp,
      content: {
        title: topic.title,
        description: topic.description,
        targets: [],
        values: [],
        signatures: [],
        calldatas: [],
      },
      targetProposalId: null,
      proposalId: null,
      contentSignatures: signatures,
    },
    versions: [
      {
        id: topic.id,
        createdTimestamp: topic.createdTimestamp,
      },
    ],
    feedbackPosts,
    sponsors: signatures,
  };
}
