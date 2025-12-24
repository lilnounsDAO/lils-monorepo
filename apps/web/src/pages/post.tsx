import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import {
  JSXConvertersFunction,
  RichText,
} from "@payloadcms/richtext-lexical/react";
import { DefaultNodeTypes } from "@payloadcms/richtext-lexical";
import { Link } from "react-router-dom";
import { LinkExternal } from "@/components/ui/link";
import { getPostBySlug } from "@/data/cms/getPostBySlug";
import { BlogPosting, WithContext } from "schema-dts";
// Metadata type removed - not used in Vite
import Icon from "@/components/ui/Icon";
import { ClipboardCopy } from "@/components/ClipboardCopy";
import ShareToFarcaster from "@/components/ShareToFarcaster";
import ShareToX from "@/components/ShareToX";
import { normalizeCmsMediaUrl } from "@/utils/cmsUrl";

const SOCIAL_SHARE_TEXT = ""; // Nothing, just the link is fine

// generateMetadata removed - not used in Vite (handled by react-helmet-async)
export async function _generateMetadata(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const decodedSlug = decodeURIComponent(slug);
  const post = await getPostBySlug(decodedSlug);

  if (!post) {
    return {};
  }

  return {
    title: post.title + " | Lil Nouns DAO",
    description: post.description,
    alternates: {
      canonical: "./",
    },
    openGraph: {
      title: post.title,
      description: post.description,
      images: [
        {
          url: post.heroImage.url ?? "",
        },
      ],
    },
    twitter: {
      images: [
        {
          url: post.heroImage.url ?? "",
        },
      ],
    },
  };
}

export default async function LearnPostPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const decodedSlug = decodeURIComponent(slug);

  const postUrl = `${import.meta.env.VITE_URL || 'https://www.lilnouns.wtf'}/learn/${decodedSlug}`;

  return (
    <>
      <div className="flex w-full max-w-[720px] flex-col justify-center gap-4 px-6 pb-24 pt-[72px] md:px-10">
        <Link
          to="/learn"
          className="font-bold text-content-secondary label-lg"
        >
          Learn
        </Link>
        <Suspense
          fallback={Array(10)
            .fill(0)
            .map((_, i) => (
              <Skeleton className="h-[392px] w-full rounded-[32px]" key={i} />
            ))}
        >
          <LearnPostWrapper slug={decodedSlug} />
        </Suspense>
        <div className="my-8 h-[1px] w-full bg-background-secondary" />
        <div className="flex flex-col gap-11">
          <div className="flex flex-col gap-4">
            <div className="font-bold text-content-secondary label-sm">
              Share post
            </div>
            <div className="flex items-center gap-6">
              <ShareToFarcaster text={SOCIAL_SHARE_TEXT} embeds={[postUrl]}>
                <Icon
                  icon="farcaster"
                  size={20}
                  className="fill-content-primary"
                />
              </ShareToFarcaster>
              <ShareToX text={SOCIAL_SHARE_TEXT} url={postUrl}>
                <Icon
                  icon="xTwitter"
                  size={20}
                  className="fill-content-primary"
                />
              </ShareToX>

              <ClipboardCopy copyContent={postUrl}>
                <Icon icon="link" size={20} className="fill-content-primary" />
              </ClipboardCopy>
            </div>
          </div>
          <div className="text-content-secondary paragraph-sm">
            The content on this site is produced by some Lil Nouns DAO contributors and is
            for informational purposes only. The content is not intended to be
            investment advice or any other kind of professional advice. Before
            taking any action based on this content you should do you own
            research. We do not endorse any third parties referenced on this
            site. When you invest, your funds are at risk and it is possible
            that you may lose some or all of your investment. Past performance
            is not a guarantee of future results.
          </div>
        </div>
      </div>
    </>
  );
}

async function LearnPostWrapper({ slug }: { slug: string }) {
  const post = await getPostBySlug(slug);

  if (!post?.content) {
    return null;
  }

  const keywords =
    post.keywords
      ?.map((entry: any) => entry.value)
      .filter((word: any) => word != null && word != undefined) ?? [];

  const jsonLd: WithContext<BlogPosting> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    author: {
      "@type": "Organization",
      name: "Lil Nouns DAO",
      url: "https://www.lilnouns.wtf",
      logo: "https://www.lilnouns.wtf/app-icon.jpeg",
    },
    datePublished: post.createdAt ?? undefined,
    dateModified: post.updatedAt ?? undefined,
    image: post.heroImage.url ?? "",
    url: `https://lilnouns.wtf/learn/${slug}`,
    keywords: [...keywords, "Lil Nouns DAO", "Lil Nouns NFT", "Lil Nouns", "Lils", "Nouns DAO", "Nouns NFT", "Nouns", "web3", "Crypto"],
  };

  return (
    <div className="flex min-w-0 flex-col gap-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <h1>{post.title}</h1>
      <img
        src={post.heroImage.url ?? ""}
        width={800}
        height={792}
        alt={post.heroImage.alt}
        className="aspect-video rounded-[12px] object-cover md:rounded-[24px]"
      />

      <RichText data={post.content} converters={jsxConverters} />
    </div>
  );
}

const jsxConverters: JSXConvertersFunction<DefaultNodeTypes> = ({
  defaultConverters = {},
}: {
  defaultConverters: JSXConvertersFunction<DefaultNodeTypes>;
}) => ({
  ...defaultConverters,
  upload: ({ node }: { node: { value: { url: string; alt: string; filename: string } } }) => {
    const rawUrl = (node.value as any)["url"] ?? "";
    const filename = (node.value as any)["filename"] ?? "";
    const normalizedUrl = normalizeCmsMediaUrl(rawUrl, filename);

    console.log('[Upload Node] Raw URL:', rawUrl);
    console.log('[Upload Node] Filename:', filename);
    console.log('[Upload Node] Normalized URL:', normalizedUrl);
    console.log('[Upload Node] Full node.value:', node.value);

    return (
      <img
        src={normalizedUrl || rawUrl}
        width={640}
        height={362}
        className="aspect-video rounded-[12px] md:rounded-[24px]"
        alt={(node.value as any)["alt"] ?? ""}
      />
    );
  },
  link: ({ node }: any) => {
    const url = decodeURIComponent(node.fields.url ?? ""); // To ensure decoded correctly since payload encodes direct relative url (/slug => %2Fslug)
    const internal = node.fields.newTab === false;
    const content = (node.children[0] as any)["text"] as string | undefined;

    return internal ? (
      <Link
        to={url}
        className="underline transition-all hover:text-semantic-accent hover:brightness-100"
      >
        {content}
      </Link>
    ) : (
      <LinkExternal
        href={url}
        className="underline transition-all hover:text-semantic-accent hover:brightness-100"
      >
        {content}
      </LinkExternal>
    );
  },
  blocks: {},
});
