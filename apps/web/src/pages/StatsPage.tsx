import { Helmet } from 'react-helmet-async'
import { Navigate } from 'react-router-dom'

export default function StatsPage() {
  // Redirect to treasury stats as default
  return <Navigate to="/stats/treasury" replace />
}