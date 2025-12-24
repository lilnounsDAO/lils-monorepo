const DISCORD_API_BASE_URL = 'https://discord.com/api/v10';

/**
 * API Route to proxy Discord scheduled events requests
 * This prevents CORS issues and keeps the bot token secure on the server
 * Note: This is handled by vite-plugin-discord-api in development
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const guildId = searchParams.get('guildId');
    const withUserCount = searchParams.get('withUserCount') === 'true';

    // Get bot token from server-side environment variable (not VITE_ prefix)
    const botToken = process.env.DISCORD_BOT_TOKEN;

    if (!botToken) {
      console.warn('Discord bot token not configured on server.');
      return Response.json(
        { error: 'Discord bot token not configured' },
        { status: 500 }
      );
    }

    if (!guildId) {
      return Response.json(
        { error: 'guildId query parameter is required' },
        { status: 400 }
      );
    }

    const url = `${DISCORD_API_BASE_URL}/guilds/${guildId}/scheduled-events${withUserCount ? '?with_user_count=true' : ''}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Discord API error:', response.status, errorText);
      
      if (response.status === 401) {
        return Response.json(
          { error: 'Discord API authentication failed. Check bot token.' },
          { status: 401 }
        );
      }
      if (response.status === 404) {
        return Response.json(
          { error: 'Discord guild not found. Check guild ID.' },
          { status: 404 }
        );
      }
      if (response.status === 403) {
        return Response.json(
          { error: 'Discord bot lacks required permissions.' },
          { status: 403 }
        );
      }
      
      return Response.json(
        { error: `Discord API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const events = await response.json();

    return Response.json(events, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error('Failed to fetch Discord scheduled events:', error);
    return Response.json(
      { error: 'Failed to fetch Discord events' },
      { status: 500 }
    );
  }
}

