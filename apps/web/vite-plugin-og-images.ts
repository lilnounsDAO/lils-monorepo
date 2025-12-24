import type { Plugin } from 'vite'
import { config } from 'dotenv'
import { resolve } from 'node:path'
import sharp from 'sharp'

// Load environment variables from .env file
try {
  config({ path: resolve(process.cwd(), '.env') })
} catch (e) {
  // .env file might not exist, that's okay
}

/**
 * Vite plugin to handle OG image API routes in development
 * This allows the /api/og/* routes to work in Vite dev server
 */
export function ogImagesPlugin(): Plugin {
  return {
    name: 'og-images-api',
    configureServer(server) {
      server.middlewares.use('/api/og', async (req, res, next) => {
        // Only handle GET requests
        if (req.method !== 'GET') {
          return next()
        }

        try {
          const url = new URL(req.url || '', `http://${req.headers.host}`)
          const pathname = url.pathname

          // Handle /api/og/noun/[id]
          const nounMatch = pathname.match(/^\/noun\/(\d+)$/)
          if (nounMatch) {
            const nounId = nounMatch[1]
            
            // Use Vite's SSR module loading to properly handle TypeScript and module resolution
            const getNounByIdModule = await server.ssrLoadModule('/src/data/noun/getNounById.ts')
            const buildNounImageModule = await server.ssrLoadModule('/src/utils/nounImages/nounImage.ts')
            const ogUtilsModule = await server.ssrLoadModule('/src/utils/og.ts')
            
            const { getNounById } = getNounByIdModule
            const { buildNounImage } = buildNounImageModule
            const { loadGoogleFont } = ogUtilsModule
            
            const noun = await getNounById(nounId)
            
            if (!noun) {
              res.statusCode = 404
              res.end(`Noun ${nounId} not found`)
              return
            }

            // Get background color
            const bgColor = noun.traits.background.seed === 1 ? '#e1d7d5' : '#d5d7e1'
            
            // Build noun image as base64 SVG
            const nounImageDataUri = buildNounImage(noun.traits, 'full')
            
            // Extract SVG from data URI
            const svgBase64 = nounImageDataUri.replace('data:image/svg+xml;base64,', '')
            const svgBuffer = Buffer.from(svgBase64, 'base64')
            const svgString = svgBuffer.toString('utf-8')
            
            // Extract the inner content of the noun SVG (remove outer svg tags)
            const svgContentMatch = svgString.match(/<svg[^>]*>(.*?)<\/svg>/s)
            const svgInnerContent = svgContentMatch ? svgContentMatch[1] : ''
            
            // Build trait images for each trait type
            const traitTypes = ['head', 'glasses', 'body', 'accessory', 'background'] as const
            const traitImages: Record<string, string> = {}
            const traitNames: Record<string, string> = {}
            
            for (const traitType of traitTypes) {
              const traitImageDataUri = buildNounImage(noun.traits, traitType)
              traitImages[traitType] = traitImageDataUri
              
              // Format trait name (capitalize words)
              const traitName = noun.traits[traitType].name
                ?.split('-')
                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ') || traitType.charAt(0).toUpperCase() + traitType.slice(1)
              traitNames[traitType] = traitName
            }
            
            // Format trait type label
            const formatTraitType = (type: string) => {
              return type.charAt(0).toUpperCase() + type.slice(1)
            }
            
            // Load Londrina font for the header
            // Fetch font CSS to determine format
            const fontText = `Lil Noun ${noun.id}`
            const fontCssUrl = `https://fonts.googleapis.com/css2?family=Londrina+Solid&text=${encodeURIComponent(fontText)}`
            const fontCss = await (await fetch(fontCssUrl)).text()
            const fontUrlMatch = fontCss.match(/src: url\((.+?)\) format\('(woff2|truetype|opentype)'\)/)
            
            let fontBase64 = ''
            let fontFormat = 'woff2'
            
            if (fontUrlMatch) {
              const fontUrl = fontUrlMatch[1]
              fontFormat = fontUrlMatch[2] === 'truetype' ? 'truetype' : fontUrlMatch[2] === 'opentype' ? 'opentype' : 'woff2'
              const fontResponse = await fetch(fontUrl)
              if (fontResponse.ok) {
                const fontBuffer = Buffer.from(await fontResponse.arrayBuffer())
                fontBase64 = fontBuffer.toString('base64')
              }
            }
            
            // Fallback: use loadGoogleFont if URL method fails
            if (!fontBase64) {
              try {
                const fontData = await loadGoogleFont('Londrina Solid', fontText)
                fontBase64 = Buffer.from(fontData).toString('base64')
                fontFormat = 'woff2' // Default assumption
              } catch (e) {
                console.warn('Failed to load Londrina font, using fallback:', e)
              }
            }
            
            // Create OG image matching NounDialog layout with traits
            // Left ~45%: Noun with full colored background (warm/cool)
            // Right ~55%: White content area with title, separator, and traits
            // Bottom: Baby blue banner with lilnouns.wtf
            const ogImageSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <style>
      @font-face {
        font-family: 'Londrina Solid';
        src: url('data:font/${fontFormat};base64,${fontBase64}') format('${fontFormat}');
        font-weight: 400;
        font-style: normal;
      }
    </style>
  </defs>
  <!-- Left side: Noun with colored background (matching NounDialog bg-nouns-warm/cool) -->
  <g>
    <!-- Full colored background - takes ~45% width like NounDialog -->
    <rect width="540" height="530" fill="${bgColor}"/>
    
    <!-- Noun image centered in the colored section -->
    <g transform="translate(70, 65)">
      <svg width="400" height="400" viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
        ${svgInnerContent}
      </svg>
    </g>
  </g>
  
  <!-- Right side: Content area (matching NounDialog padding: px-8 pt-12) -->
  <g transform="translate(580, 0)">
    <!-- Title: "Lil Noun {id}" - matching NounDialog h2 with Londrina font -->
    <text x="32" y="96" font-family="Londrina Solid, Arial, sans-serif" font-size="48" font-weight="400" fill="#212529">Lil Noun ${noun.id}</text>
    
    <!-- Small line beneath header -->
    <rect x="32" y="108" width="536" height="2" fill="#E5E7EB"/>
    
    <!-- Separator (matching NounDialog Separator h-[2px]) -->
    <rect x="32" y="120" width="536" height="2" fill="#E5E7EB"/>
    
    <!-- Traits Section (matching NounDialog traits grid) -->
    <g transform="translate(32, 150)">
      <!-- Trait cards in 2 columns -->
      ${traitTypes.map((traitType, index) => {
        const x = (index % 2) * 280
        const y = Math.floor(index / 2) * 70
        const traitImage = traitImages[traitType]
        const traitName = traitNames[traitType]
        const traitTypeLabel = formatTraitType(traitType)
        
        return `
        <!-- Trait card ${traitType} -->
        <g transform="translate(${x}, ${y})">
          <!-- Trait image (48x48) -->
          <image x="0" y="0" width="48" height="48" href="${traitImage}" preserveAspectRatio="xMidYMid meet"/>
          <!-- Trait info -->
          <g transform="translate(56, 0)">
            <text x="0" y="16" font-family="Arial, sans-serif" font-size="12" fill="#6C757D">${traitTypeLabel}</text>
            <text x="0" y="32" font-family="Arial, sans-serif" font-size="14" font-weight="600" fill="#212529">${traitName}</text>
          </g>
        </g>`
      }).join('')}
    </g>
  </g>
  
  <!-- Baby blue banner at bottom -->
  <g transform="translate(0, 530)">
    <rect width="1200" height="100" fill="#7CC4F2"/>
    <!-- lilnouns.wtf text -->
    <text x="40" y="65" font-family="Arial, sans-serif" font-size="32" font-weight="600" fill="#FFFFFF">lilnouns.wtf</text>
  </g>
</svg>`
            
            // Convert SVG to PNG using sharp
            const pngBuffer = await sharp(Buffer.from(ogImageSvg))
              .resize(1200, 630)
              .png()
              .toBuffer()
            
            res.writeHead(200, {
              'Content-Type': 'image/png',
              'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
            })
            res.end(pngBuffer)
            return
          }

          // Handle /api/og/vote/[id] - delegate to Next.js route if available
          const voteMatch = pathname.match(/^\/vote\/(.+)$/)
          if (voteMatch) {
            // For now, return 404 - vote OG images work in production
            res.statusCode = 404
            res.end('Vote OG images only available in production')
            return
          }

          // No match, continue to next middleware
          next()
        } catch (error) {
          console.error('OG image API error:', error)
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'Failed to generate OG image', details: error instanceof Error ? error.message : String(error) }))
        }
      })
    }
  }
}

