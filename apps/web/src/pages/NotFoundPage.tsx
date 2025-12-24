import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <>
      <Helmet>
        <title>Page Not Found | Lilnouns.wtf</title>
        <meta name="description" content="The page you are looking for does not exist." />
        <meta name="robots" content="noindex" />
      </Helmet>
      
      <div className="flex w-full max-w-4xl flex-col items-center justify-center p-20 text-center">
        <h1 className="heading-1 mb-4">404</h1>
        <h2 className="heading-2 mb-4">Page Not Found</h2>
        <p className="paragraph-lg mb-8 text-content-secondary">
          The page you are looking for does not exist.
        </p>
        <Link 
          to="/" 
          className="inline-flex items-center rounded-lg bg-semantic-accent px-6 py-3 text-white transition-colors hover:bg-semantic-accent-dark"
        >
          Go Home
        </Link>
      </div>
    </>
  )
}