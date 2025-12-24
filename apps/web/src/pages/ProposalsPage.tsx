import { Helmet } from 'react-helmet-async'
import { useParams } from 'react-router-dom'
import { Profile } from '@/components/profile/Profile'

export default function ProposalsPage() {
  const params = useParams<{ address?: string }>()
  
  return (
    <>
      <Helmet>
        <title>Profile - Lil Nouns DAO Governance | Lilnouns.wtf</title>
        <meta name="description" content="View and manage all your Lil Nouns Props. Track your governance participation in Lil Nouns DAO." />
        <link rel="canonical" href="https://www.lilnouns.wtf/profile" />
      </Helmet>
      
      <Profile address={params.address} />
    </>
  )
}