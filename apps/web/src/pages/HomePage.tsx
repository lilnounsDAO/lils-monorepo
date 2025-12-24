import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useSearchParams } from 'react-router-dom'
import Auction from '@/components/Auction'
import { VRGDANounPool } from '@/components/Auction/VRGDANounPool'
import NounsFundsIdeas from '@/components/home/NounsFundsIdeas'
import ThisIsNouns from '@/components/home/ThisIsNouns'
import GovernedByYou from '@/components/home/GovernedByYou'
import TheseAreNouns from '@/components/home/TheseAreNouns'
import AlreadyOwnANoun from '@/components/home/AlreadyOwnANoun'
import ByTheNumbers from '@/components/home/ByTheNumbers'
import Faq from '@/components/home/Faq'
import StartJourney from '@/components/home/StartJourney'
import GetANoun from '@/components/home/GetANoun'
import LearnAboutNounsDao from '@/components/home/LearnAboutNounsDao'
import { isVRGDANoun } from '@/utils/vrgdaUtils'
import { getCurrentAuctionNounId } from '@/data/auction/getCurrentAuctionNounId'
import JoinCommunity from '@/components/home/JoinCommunity'

export default function HomePage() {
  const [searchParams] = useSearchParams()
  const [currentAuctionId, setCurrentAuctionId] = useState<string | null>(null)
  const [showVRGDAPool, setShowVRGDAPool] = useState(false)
  
  const auctionIdParam = searchParams.get('auctionId')
  const frameParam = searchParams.get('frame')

  useEffect(() => {
    async function fetchCurrentAuction() {
      try {
        const id = await getCurrentAuctionNounId()
        setCurrentAuctionId(id)
        
        const auctionId = auctionIdParam ?? id
        const shouldShowVRGDA = auctionId ? isVRGDANoun(parseInt(auctionId)) : false
        setShowVRGDAPool(shouldShowVRGDA)
      } catch (error) {
        console.error('Failed to fetch current auction:', error)
      }
    }
    
    fetchCurrentAuction()
  }, [auctionIdParam])

  // Frame metadata for Farcaster frames
  const frameMetadata = frameParam ? {
    'fc:frame': 'vNext',
    'fc:frame:image': 'https://frames.paperclip.xyz/nounish-auction/v2/nouns',
    'fc:frame:button:1': 'Bid on Noun',
    'fc:frame:post_url': 'https://frames.paperclip.xyz/nounish-auction/v2/nouns'
  } : {}

  return (
    <>
      <Helmet>
        <title>Lilnouns.wtf | Lil Nouns DAO Governance Hub</title>
        <meta name="description" content="Into the world of lils. Learn how Lil Nouns DAO funds ideas through community governance." />
        <link rel="canonical" href="https://www.lilnouns.wtf/" />
        
        {/* Frame metadata for Farcaster */}
        {Object.entries(frameMetadata).map(([key, value]) => (
          <meta key={key} property={key} content={value} />
        ))}
      </Helmet>
      
      <div className="flex w-full flex-col items-center gap-[160px] pb-24 md:gap-[196px]">
        <div className="flex w-full flex-col items-center justify-center gap-[80px]">
          <section className="flex w-full max-w-[1680px] flex-col gap-4 px-6 pt-6 md:px-10 md:pt-10">
            <Auction initialAuctionId={auctionIdParam} />
          {/* <></> */}
          </section>

          <ThisIsNouns />
        </div>

        <NounsFundsIdeas />
        <ByTheNumbers />
        {/* <GovernedByYou /> */}
        <TheseAreNouns />
        {/* <GetANoun /> */}
        {/* <AlreadyOwnANoun /> */}
        <StartJourney />
        <JoinCommunity />
        <LearnAboutNounsDao />
        <Faq />
      </div>
    </>
  )
}