const DISCORD_API_BASE_URL = 'https://discord.com/api/v10';

/**
 * Netlify Function to proxy Discord scheduled events requests
 * This prevents CORS issues and keeps the bot token secure on the server
 * 
 * Environment variables required:
 * - DISCORD_BOT_TOKEN: The Discord bot token (set in Netlify UI)
 * - VITE_DISCORD_GUILD_ID: Optional, Discord guild ID (can be passed as query param)
 */
exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  // Only handle GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse query string from Netlify event
    const queryString = event.queryStringParameters || {};
    const guildId = queryString.guildId;
    const withUserCount = queryString.withUserCount === 'true';

    // Get bot token from server-side environment variable (not VITE_ prefix)
    const botToken = process.env.DISCORD_BOT_TOKEN;

    if (!botToken) {
      console.warn('Discord bot token not configured on server.');
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Discord bot token not configured' }),
      };
    }

    if (!guildId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'guildId query parameter is required' }),
      };
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
        return {
          statusCode: 401,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({ error: 'Discord API authentication failed. Check bot token.' }),
        };
      }
      if (response.status === 404) {
        return {
          statusCode: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({ error: 'Discord guild not found. Check guild ID.' }),
        };
      }
      if (response.status === 403) {
        return {
          statusCode: 403,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({ error: 'Discord bot lacks required permissions.' }),
        };
      }
      
      return {
        statusCode: response.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: `Discord API error: ${response.status} ${response.statusText}` }),
      };
    }

    const events = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // Cache for 5 minutes
        'Access-Control-Allow-Origin': '*', // Allow CORS from browser
        'Access-Control-Allow-Methods': 'GET',
      },
      body: JSON.stringify(events),
    };
  } catch (error) {
    console.error('Failed to fetch Discord scheduled events:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Failed to fetch Discord events' }),
    };
  }
};
