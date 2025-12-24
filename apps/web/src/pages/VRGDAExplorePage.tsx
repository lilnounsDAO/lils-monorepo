import { Helmet } from 'react-helmet-async'
import { VrgdaExploreViewer } from '@/app/vrgda/explore/components/VrgdaExploreViewer'

export default function VRGDAExplorePage() {
  return (
    <>
      <Helmet>
        <title>VRGDA Explore - Nouns Pool Viewer | Lilnouns.wtf</title>
        <meta name="description" content="Explore the Variable Rate GDA (VRGDA) noun pool and build custom Nouns combinations." />
        <link rel="canonical" href="https://www.lilnouns.wtf/vrgda/explore" />
      </Helmet>
      
      <VrgdaExploreViewer />
    </>
  )
}