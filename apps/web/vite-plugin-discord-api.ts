import type { Plugin } from 'vite'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env file
// Vite automatically loads .env files, but we need to explicitly load for server-side vars
try {
  config({ path: resolve(process.cwd(), '.env') })
} catch (e) {
  // .env file might not exist, that's okay
}

/**
 * Vite plugin to handle Discord API proxy in development
 * This allows the /api/discord/events route to work in Vite dev server
 */
export function discordApiPlugin(): Plugin {
  return {
    name: 'discord-api-proxy',
    configureServer(server) {
      server.middlewares.use('/api/discord/events', async (req, res, next) => {
        // Only handle GET requests
        if (req.method !== 'GET') {
          return next()
        }

        try {
          const url = new URL(req.url || '', `http://${req.headers.host}`)
          const guildId = url.searchParams.get('guildId')
          const withUserCount = url.searchParams.get('withUserCount') === 'true'

          // Get bot token from environment variable
          // Check both DISCORD_BOT_TOKEN (preferred, server-side only) and VITE_DISCORD_BOT_TOKEN (for backwards compat)
          const botToken = process.env.DISCORD_BOT_TOKEN || process.env.VITE_DISCORD_BOT_TOKEN

          if (!botToken) {
            res.writeHead(500, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Discord bot token not configured' }))
            return
          }

          if (!guildId) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'guildId query parameter is required' }))
            return
          }

          // Call Discord API
          const discordUrl = `https://discord.com/api/v10/guilds/${guildId}/scheduled-events${withUserCount ? '?with_user_count=true' : ''}`
          
          const response = await fetch(discordUrl, {
            headers: {
              'Authorization': `Bot ${botToken}`,
              'Content-Type': 'application/json',
            },
          })

          if (!response.ok) {
            const errorText = await response.text()
            console.error('Discord API error:', response.status, errorText)
            
            let statusCode = response.status
            let errorMessage = `Discord API error: ${response.status} ${response.statusText}`
            
            if (response.status === 401) {
              errorMessage = 'Discord API authentication failed. Check bot token.'
            } else if (response.status === 404) {
              errorMessage = 'Discord guild not found. Check guild ID.'
            } else if (response.status === 403) {
              errorMessage = 'Discord bot lacks required permissions.'
            }

            res.writeHead(statusCode, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: errorMessage }))
            return
          }

          const events = await response.json()

          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
          })
          res.end(JSON.stringify(events))
        } catch (error) {
          console.error('Failed to fetch Discord scheduled events:', error)
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Failed to fetch Discord events' }))
        }
      })
    },
  }
}

