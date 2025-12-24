import { useEffect, useState } from 'react';
import Image from '@/components/OptimizedImage';
import { LinkExternal } from './ui/link';
import { Button } from './ui/button';
import Icon from './ui/Icon';
import { getLilNounsSpaces } from '@/data/x-api/getSpaces';
import { SpacesGridItem } from '@/data/x-api/types';

interface SpacesGridProps {
  className?: string;
}

export default function SpacesGrid({ className }: SpacesGridProps) {
  console.log('🏗️ SpacesGrid component mounted/rendered');

  const [spaces, setSpaces] = useState<SpacesGridItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🚀 SpacesGrid useEffect triggered - starting fetchSpaces');

    const fetchSpaces = async () => {
      try {
        console.log('⏳ SpacesGrid: Setting loading state and clearing error');
        setLoading(true);
        setError(null);

        console.log('📡 SpacesGrid: Calling getLilNounsSpaces()');
        const fetchedSpaces = await getLilNounsSpaces();

        console.log(`✅ SpacesGrid: Received ${fetchedSpaces.length} spaces, updating state`);
        setSpaces(fetchedSpaces);
      } catch (err) {
        console.error('❌ SpacesGrid: Error fetching spaces:', err);
        setError('Failed to load Spaces');
      } finally {
        console.log('🏁 SpacesGrid: Setting loading to false');
        setLoading(false);
      }
    };

    fetchSpaces();
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'TBD';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'live':
        return 'text-red-400';
      case 'scheduled':
        return 'text-green-400';
      case 'ended':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-white">Loading Spaces...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  // Separate spaces into scheduled (upcoming) and ended (past)
  console.log(`🔄 SpacesGrid: Processing ${spaces.length} spaces into scheduled and ended categories`);
  const scheduledSpaces = spaces.filter(space => space.state === 'scheduled');
  const endedSpaces = spaces.filter(space => space.state === 'ended');
  console.log(`📊 SpacesGrid: Found ${scheduledSpaces.length} scheduled and ${endedSpaces.length} ended spaces`);

  const getButtonText = (state: string) => {
    switch (state) {
      case 'scheduled':
        return 'Join Space';
      case 'ended':
        return 'View Recording';
      default:
        return 'View Space';
    }
  };

  const getCardBackgroundColor = (state: string) => {
    switch (state) {
      case 'scheduled':
        return 'bg-green-900/20 border-green-700/50';
      case 'ended':
        return 'bg-gray-800 border-gray-700';
      default:
        return 'bg-gray-800 border-gray-700';
    }
  };

  console.log(`🎨 SpacesGrid: Rendering with ${scheduledSpaces.length} upcoming and ${endedSpaces.length} past spaces`);

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-6 flex items-center gap-2">
        <Icon icon="link" size={20} className="fill-white" />
        <h3 className="text-lg font-semibold text-white">Lil Nouns Spaces</h3>
      </div>

      {/* Upcoming Spaces Section */}
      {scheduledSpaces.length > 0 && (
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <Icon icon="circleArrowUp" size={16} className="fill-green-400" />
            <h4 className="text-base font-medium text-green-400">Upcoming Spaces</h4>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {scheduledSpaces.map((space) => (
              <LinkExternal
                key={space.id}
                href={space.url}
                className={`group flex flex-col rounded-lg border p-4 transition-all hover:scale-105 ${getCardBackgroundColor(space.state)}`}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="mb-1 line-clamp-2 text-sm font-medium text-white group-hover:text-green-400">
                      {space.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className={getStatusColor(space.state)}>
                        {space.state.charAt(0).toUpperCase() + space.state.slice(1)}
                      </span>
                      {space.scheduledStart && (
                        <>
                          <span>•</span>
                          <span>{formatDate(space.scheduledStart)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {space.hostProfileImage && (
                    <Image
                      src={space.hostProfileImage}
                      width={32}
                      height={32}
                      alt={`${space.hostUsername || 'Host'} profile`}
                      className="ml-2 rounded-full"
                    />
                  )}
                </div>

                {space.hostUsername && (
                  <div className="mb-3 text-xs text-gray-500">
                    Hosted by @{space.hostUsername}
                  </div>
                )}

                <Button
                  variant="secondary"
                  className="mt-auto w-full rounded-full border-green-600 text-xs text-white hover:bg-green-600"
                >
                  <Icon icon="arrowUpRight" size={12} className="mr-1 fill-white" />
                  {getButtonText(space.state)}
                </Button>
              </LinkExternal>
            ))}
          </div>
        </div>
      )}

      {/* Past Spaces Section */}
      {endedSpaces.length > 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Icon icon="clock" size={16} className="fill-gray-400" />
            <h4 className="text-base font-medium text-gray-400">Past Spaces</h4>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {endedSpaces.map((space) => (
              <LinkExternal
                key={space.id}
                href={space.url}
                className={`group flex flex-col rounded-lg border p-4 transition-all hover:scale-105 ${getCardBackgroundColor(space.state)}`}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="mb-1 line-clamp-2 text-sm font-medium text-white group-hover:text-blue-400">
                      {space.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className={getStatusColor(space.state)}>
                        {space.state.charAt(0).toUpperCase() + space.state.slice(1)}
                      </span>
                      {space.scheduledStart && (
                        <>
                          <span>•</span>
                          <span>{formatDate(space.scheduledStart)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {space.hostProfileImage && (
                    <Image
                      src={space.hostProfileImage}
                      width={32}
                      height={32}
                      alt={`${space.hostUsername || 'Host'} profile`}
                      className="ml-2 rounded-full opacity-75"
                    />
                  )}
                </div>

                {space.hostUsername && (
                  <div className="mb-3 text-xs text-gray-500">
                    Hosted by @{space.hostUsername}
                  </div>
                )}

                <Button
                  variant="secondary"
                  className="mt-auto w-full rounded-full border-gray-600 text-xs text-white hover:bg-gray-600"
                >
                  <Icon icon="arrowUpRight" size={12} className="mr-1 fill-white" />
                  {getButtonText(space.state)}
                </Button>
              </LinkExternal>
            ))}
          </div>
        </div>
      )}

      {/* No spaces message */}
      {spaces.length === 0 && (
        <div className="flex items-center justify-center p-8">
          <div className="text-gray-400">No Spaces found</div>
        </div>
      )}
    </div>
  );
}
