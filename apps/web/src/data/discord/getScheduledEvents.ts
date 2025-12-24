/**
 * Discord Scheduled Events API
 * Fetches scheduled events from a Discord server
 * 
 * API Documentation: https://discord.com/developers/docs/resources/guild-scheduled-event#list-scheduled-events-for-guild
 */

export interface DiscordScheduledEvent {
  id: string
  guild_id: string
  channel_id: string | null
  creator_id: string | null
  name: string
  description: string | null
  scheduled_start_time: string
  scheduled_end_time: string | null
  privacy_level: number
  status: number
  entity_type: number
  entity_id: string | null
  entity_metadata: {
    location?: string
  } | null
  creator?: {
    id: string
    username: string
    discriminator: string
    avatar: string | null
  }
  user_count?: number
  image: string | null
}

/**
 * Fetches all scheduled events for a Discord guild/server
 * Uses our API proxy route to avoid CORS issues and keep bot token secure
 * @param guildId - The Discord server/guild ID
 * @param withUserCount - Whether to include user count (requires additional permissions)
 * @returns Array of scheduled events
 */
export async function getDiscordScheduledEvents(
  guildId: string,
  withUserCount: boolean = false
): Promise<DiscordScheduledEvent[]> {
  if (!guildId) {
    console.warn('Discord guild ID not provided.')
    return []
  }

  try {
    // Call OUR API endpoint (same domain, no CORS issues)
    // Our server-side API route then calls Discord API securely
    // This is necessary because:
    // 1. Discord blocks browser requests (CORS)
    // 2. Bot token must stay server-side for security
    const apiUrl = `/api/discord/events?guildId=${encodeURIComponent(guildId)}${withUserCount ? '&withUserCount=true' : ''}`
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      console.error('Discord API proxy error:', response.status, errorData)
      
      if (response.status === 401) {
        console.warn('Discord bot token authentication failed. Check server environment variables.')
        return []
      }
      if (response.status === 404) {
        console.warn('Discord guild not found. Check guild ID.')
        return []
      }
      if (response.status === 403) {
        console.warn('Discord bot lacks required permissions.')
        return []
      }
      // Return empty array on error to prevent UI breakage
      return []
    }

    const events: DiscordScheduledEvent[] = await response.json()
    return events
  } catch (error) {
    console.error('Failed to fetch Discord scheduled events:', error)
    // Return empty array on error to prevent UI breakage
    return []
  }
}

/**
 * Filters events to only show upcoming ones
 */
export function filterUpcomingEvents(events: DiscordScheduledEvent[]): DiscordScheduledEvent[] {
  const now = new Date().toISOString()
  return events.filter(event => {
    // Status 1 = SCHEDULED, Status 2 = ACTIVE
    const isUpcoming = event.status === 1 || event.status === 2
    const isInFuture = event.scheduled_start_time >= now
    return isUpcoming && isInFuture
  }).sort((a, b) => {
    // Sort by scheduled start time, earliest first
    return new Date(a.scheduled_start_time).getTime() - new Date(b.scheduled_start_time).getTime()
  })
}

/**
 * Formats event date/time for display
 */
export function formatEventDateTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
  } else if (diffDays === 1) {
    return `Tomorrow at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
  } else if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' })
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  }
}

/**
 * Generates a Discord event URL
 * Format: https://discord.com/events/{guild_id}/{event_id}
 */
export function getDiscordEventUrl(event: DiscordScheduledEvent): string {
  return `https://discord.com/events/${event.guild_id}/${event.id}`
}

