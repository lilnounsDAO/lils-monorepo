import { useQuery } from '@tanstack/react-query'
import { getDiscordScheduledEvents, filterUpcomingEvents, DiscordScheduledEvent } from '@/data/discord/getScheduledEvents'

/**
 * React Query hook for fetching Discord scheduled events
 * @param guildId - The Discord server/guild ID (optional, falls back to env var)
 * @param enabled - Whether the query should run
 */
export function useDiscordEvents(guildId?: string, enabled: boolean = true) {
  // Fallback to environment variable if guildId not provided
  const effectiveGuildId = guildId || import.meta.env.VITE_DISCORD_GUILD_ID

  return useQuery<DiscordScheduledEvent[]>({
    queryKey: ['discord-events', effectiveGuildId],
    queryFn: () => getDiscordScheduledEvents(effectiveGuildId || '', false),
    enabled: enabled && !!effectiveGuildId, // Bot token is checked server-side
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
    retry: 2,
    select: (data) => filterUpcomingEvents(data), // Filter to only upcoming events
  })
}

