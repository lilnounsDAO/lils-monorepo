import { Helmet } from 'react-helmet-async'
import { Button } from '@/components/ui/button'
import Image from '@/components/OptimizedImage'
import { Download } from 'lucide-react'
import { downloadBrandAsSVG, downloadBrandAsPNG } from '@/utils/brandDownload'

interface BrandAsset {
  name: string
  imageUrl: string
  description?: string
}

const LOGO_VARIANTS: BrandAsset[] = [
  {
    name: 'Colored Noggles',
    imageUrl: '/color-noggles.png',
    description: 'The iconic colored noggles logo'
  },
  {
    name: 'Black monochrome Noggles',
    imageUrl: '/black-noggles.png',
    description: 'Black monochrome version of the noggles'
  },
  {
    name: 'White monochrome Noggles',
    imageUrl: '/white-noggles.png',
    description: 'White monochrome version of the noggles'
  },
]

export default function BrandPage() {

  const handleDownloadSVG = async (asset: BrandAsset) => {
    await downloadBrandAsSVG(asset.imageUrl, asset.name)
  }

  const handleDownloadPNG = async (asset: BrandAsset) => {
    await downloadBrandAsPNG(asset.imageUrl, asset.name)
  }

  return (
    <>
      <Helmet>
        <title>Brand Assets | Lil Nouns DAO</title>
        <meta name="description" content="Download 'official' Lil Nouns DAO brand assets including our iconic noggles in various formats." />
      </Helmet>

      <div className="flex w-full max-w-[1400px] mx-auto flex-col gap-8 p-6 pb-20 md:gap-12 md:p-10 md:pb-20">
        <div className="flex w-full flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3>Brand Assets</h3>
            <p className="text-content-secondary">
              Download official Lil Nouns DAO brand assets including our iconic noggles in various formats.
            </p>
          </div>
        </div>

        {/* Logo Section */}
        <div className="flex w-full flex-col gap-4">
          <h4 className="text-xl font-bold text-content-primary">Logo</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {LOGO_VARIANTS.map((asset) => {
              return (
                <div
                  key={asset.name}
                  className="group relative flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
                >
                  <div className="p-6 pb-4">
                    <h5 className="text-base font-bold text-gray-900">{asset.name}</h5>
                  </div>
                  
                  <div className="relative flex aspect-square w-full items-center justify-center bg-checkerboard">
                    <Image
                      src={asset.imageUrl}
                      alt={asset.name}
                      className="h-auto w-3/4 object-contain"
                    />
                  </div>

                  <div className="flex items-center gap-3 p-6 pt-4">
                    <Button
                      variant="primary"
                      size="default"
                      onClick={() => handleDownloadPNG(asset)}
                      className="flex items-center gap-2 flex-1"
                    >
                      <Download size={16} className="text-white" />
                      PNG
                    </Button>
                    <Button
                      variant="secondary"
                      size="default"
                      onClick={() => handleDownloadSVG(asset)}
                      className="flex items-center gap-2 flex-1"
                    >
                      <Download size={16} />
                      SVG
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Icon Section */}
        <div className="flex w-full flex-col gap-4">
          <h4 className="text-xl font-bold text-content-primary">Icon</h4>
          <div className="flex flex-col items-start gap-4">
            <div className="relative flex h-48 w-48 items-center justify-center bg-gray-50 rounded-lg">
              <Image
                src="/app-icon.jpeg"
                alt="App Icon"
                className="h-full w-full object-contain rounded-lg"
              />
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="default"
                onClick={() => handleDownloadPNG({ name: 'App Icon', imageUrl: '/app-icon.jpeg' })}
                className="flex items-center gap-2"
              >
                <Download size={16} className="text-white" />
                PNG
              </Button>
              <Button
                variant="secondary"
                size="default"
                onClick={() => handleDownloadSVG({ name: 'App Icon', imageUrl: '/app-icon.jpeg' })}
                className="flex items-center gap-2"
              >
                <Download size={16} />
                SVG
              </Button>
            </div>
          </div>
        </div>

        {/* License Section */}
        <div className="flex w-full flex-col gap-4">
          <h4 className="text-xl font-bold text-content-primary">License</h4>
          <p className="text-content-secondary">
            The logos, traits and every Lil Noun generated on the playground are{' '}
            <a
              href="https://creativecommons.org/publicdomain/zero/1.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-content-primary underline hover:no-underline"
            >
              CC0
            </a>
            {' '}(Creative Commons Zero), meaning they are in the public domain and free to use for any purpose without restriction.
          </p>
          <div className="mt-2">
            <Image
              src="/cc-zero.svg"
              alt="CC0 License"
              className="h-16 w-auto"
            />
          </div>
        </div>
      </div>
    </>
  )
}

