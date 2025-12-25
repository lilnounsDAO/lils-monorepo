import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { buildNounTraitImage } from '@/utils/nounImages/nounImage'
import { NounTraitType, NounTrait } from '@/data/noun/types'
import {
  BACKGROUND_TRAITS,
  GLASSES_TRAITS,
  HEAD_TRAITS,
  BODY_TRAITS,
  ACCESSORY_TRAITS,
} from '@/components/NounExplorer/NounFilter'
import { Button } from '@/components/ui/button'
import Image from '@/components/OptimizedImage'
import { Download, X } from 'lucide-react'
import { downloadTraitAsSVG, downloadTraitAsPNG } from '@/utils/traitDownload'
import { cn } from '@/utils/shadcn'
import JSZip from 'jszip'


const TRAIT_CATEGORIES: Array<{ type: NounTraitType; label: string; traits: NounTrait[] }> = [
  { type: 'glasses', label: 'Noggles', traits: GLASSES_TRAITS },
  { type: 'head', label: 'Heads', traits: HEAD_TRAITS },
  { type: 'accessory', label: 'Accessories', traits: ACCESSORY_TRAITS },
  { type: 'body', label: 'Bodies', traits: BODY_TRAITS },
  { type: 'background', label: 'Backgrounds', traits: BACKGROUND_TRAITS },
]

interface SelectedTrait {
  type: NounTraitType
  seed: number
  name: string
}

export default function TraitsPage() {
  const [selectedTrait, setSelectedTrait] = useState<SelectedTrait | null>(null)
  const [isDownloadingZip, setIsDownloadingZip] = useState(false)

  const handleTraitClick = (type: NounTraitType, trait: NounTrait) => {
    setSelectedTrait({ type, seed: trait.seed, name: trait.name })
  }

  const handleDownloadSVG = () => {
    if (!selectedTrait) return
    downloadTraitAsSVG(selectedTrait.type, selectedTrait.seed, selectedTrait.name)
  }

  const handleDownloadPNG = async () => {
    if (!selectedTrait) return
    await downloadTraitAsPNG(selectedTrait.type, selectedTrait.seed, selectedTrait.name)
  }

  const handleDownloadAll = async () => {
    setIsDownloadingZip(true)
    try {
      const zip = new JSZip()
      
      // Import svgToPng and getTraitSVGString for ZIP creation
      const { svgToPng, getTraitSVGString } = await import('@/utils/traitDownload')
      
      for (const category of TRAIT_CATEGORIES) {
        const categoryFolder = zip.folder(category.type)
        if (!categoryFolder) continue
        
        for (const trait of category.traits) {
          const svgString = getTraitSVGString(category.type, trait.seed)
          const filename = `${trait.name.replace(/\s+/g, "-").toLowerCase()}`
          
          // Add SVG
          categoryFolder.file(`${filename}.svg`, svgString)
          
          // Add PNG
          try {
            const pngBlob = await svgToPng(svgString)
            const pngArrayBuffer = await pngBlob.arrayBuffer()
            categoryFolder.file(`${filename}.png`, pngArrayBuffer)
          } catch (error) {
            console.error(`Failed to convert ${category.type}-${trait.name} to PNG:`, error)
          }
        }
      }
      
      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      
      // Download ZIP
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'lilnouns-traits.zip'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to create ZIP:', error)
      alert('Failed to download traits. Please try again.')
    } finally {
      setIsDownloadingZip(false)
    }
  }

  return (
    <>
      <Helmet>
        <title>Traits | Lil Nouns DAO</title>
        <meta name="description" content="Browse and download all available Lil Nouns traits." />
      </Helmet>

      <div className="flex w-full max-w-[1400px] mx-auto flex-col gap-8 p-6 pb-20 md:gap-12 md:p-10 md:pb-20">
        <div className="flex w-full flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h3>Traits</h3>
              <p className="text-content-secondary">
                Browse and download all available Lil Nouns traits. They're CC0 so feel free to use and remix them as you please.
              </p>
            </div>
            <Button
              onClick={handleDownloadAll}
              disabled={isDownloadingZip}
              className="flex items-center gap-2"
            >
              <Download size={20} className="text-white" />
              {isDownloadingZip ? 'Downloading...' : 'Download All'}
            </Button>
          </div>
        </div>

        {/* Download menu for selected trait */}
        {selectedTrait && (
          <div className="fixed bottom-24 md:bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-white p-4 shadow-lg border-2 border-gray-200">
            <span className="text-sm font-medium text-gray-700">
              {selectedTrait.name}
            </span>
            <div className="h-6 w-px bg-gray-300" />
            <Button
              variant="secondary"
              size="default"
              onClick={handleDownloadSVG}
              className="flex items-center gap-2"
            >
              <Download size={16} />
              SVG
            </Button>
            <Button
              variant="secondary"
              size="default"
              onClick={handleDownloadPNG}
              className="flex items-center gap-2"
            >
              <Download size={16} />
              PNG
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedTrait(null)}
              className="ml-2"
            >
              <X size={16} />
            </Button>
          </div>
        )}

        {/* Trait categories */}
        <div className="flex w-full flex-col gap-12">
          {TRAIT_CATEGORIES.map((category) => (
            <div key={category.type} className="flex w-full flex-col gap-4">
              <h4 className="text-xl font-bold text-content-primary">{category.label}</h4>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {category.traits.map((trait) => {
                  const traitImage = buildNounTraitImage(category.type, trait.seed, true)
                  const isSelected =
                    selectedTrait?.type === category.type &&
                    selectedTrait?.seed === trait.seed

                  return (
                    <button
                      key={`${category.type}-${trait.seed}`}
                      onClick={() => handleTraitClick(category.type, trait)}
                      className={cn(
                        "group relative flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 transition-all hover:border-gray-400 hover:bg-gray-100",
                        isSelected && "border-content-primary bg-blue-50"
                      )}
                    >
                      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-checkerboard rounded-lg">
                        <Image
                          src={traitImage}
                          alt={trait.name}
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900">
                        {trait.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

