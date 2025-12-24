import { Helmet } from 'react-helmet-async'
import { useParams } from 'react-router-dom'
import SuccessDynamicLayout from '@/components/SuccessDynamicLayout'

export default function SuccessPage() {
  const { txHash, nounId } = useParams<{ txHash: string; nounId: string }>()

  return (
    <>
      <Helmet>
        <title>Purchase Successful | Lilnouns.wtf</title>
        <meta name="description" content="Your Lil Noun purchase was successful!" />
        <meta name="robots" content="noindex" />
      </Helmet>
      
      <SuccessDynamicLayout txHash={txHash} nounId={nounId} />
    </>
  )
}