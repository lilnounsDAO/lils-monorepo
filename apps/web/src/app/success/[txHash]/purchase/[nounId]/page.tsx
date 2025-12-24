import SuccessDynamicLayout from "@/components/SuccessDynamicLayout";

export default async function DepositSuccessPage(props: {
  params: Promise<{ txHash: string; nounId: string }>;
}) {
  const params = await props.params;
  const shareUrl = `${window.location.origin}/explore?lilnounId=${params.nounId}`;
  return (
    <SuccessDynamicLayout
      shareUrl={shareUrl}
      title={`You purchased Lil Noun ${params.nounId}!`}
      subtitle={`Share the news and let everyone know you own a new Lil Noun!`}
      socialShareCopy={`I just purchased Lil Noun ${params.nounId} on Lilnouns.wtf!`}
    />
  );
}
