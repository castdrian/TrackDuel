import { NextRequest, NextResponse } from 'next/server';
import { iTunesTrack, iTunesSearchResponse } from '@/types';

// Helper function to perform iTunes search with different strategies
async function searchItunes(query: string, limit: number = 50): Promise<iTunesTrack[]> {
  const searchStrategies = [
    // Strategy 1: Exact query as provided
    query,
    // Strategy 2: Title case version
    query.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' '),
    // Strategy 3: All uppercase
    query.toUpperCase(),
    // Strategy 4: All lowercase 
    query.toLowerCase(),
  ];

  const allResults: iTunesTrack[] = [];
  const seenTrackIds = new Set<number>();

  for (const searchTerm of searchStrategies) {
    try {
      const searchResponse = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&media=music&entity=song&limit=20&country=US`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (searchResponse.ok) {
        const searchData: iTunesSearchResponse = await searchResponse.json();
        
        // Add unique results
        for (const track of searchData.results) {
          if (!seenTrackIds.has(track.trackId)) {
            seenTrackIds.add(track.trackId);
            allResults.push(track);
          }
        }
      }
    } catch (error) {
      console.warn(`Search strategy failed for: ${searchTerm}`, error);
    }
  }

  // Score and sort results based on relevance
  const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 0);
  
  const scoredResults = allResults.map(track => {
    let score = 0;
    const trackName = track.trackName.toLowerCase();
    const artistName = track.artistName.toLowerCase();
    const albumName = track.collectionName.toLowerCase();
    
    // Exact matches get highest score
    if (trackName === query.toLowerCase()) score += 1000;
    if (artistName === query.toLowerCase()) score += 800;
    
    // Check for word matches
    queryWords.forEach(word => {
      if (trackName.includes(word)) score += 100;
      if (artistName.includes(word)) score += 80;
      if (albumName.includes(word)) score += 20;
      
      // Bonus for word at beginning
      if (trackName.startsWith(word)) score += 50;
      if (artistName.startsWith(word)) score += 40;
    });
    
    // Bonus for preview availability
    if (track.previewUrl) score += 10;
    
    return { track, score };
  });

  // Sort by score (descending) and return top results
  return scoredResults
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.track);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
    }

    console.log('Searching for:', query);
    
    // Use improved search function
    const searchResults = await searchItunes(query.trim(), 50);
    
    console.log('Found tracks:', searchResults.map(t => ({ 
      name: t.trackName, 
      artist: t.artistName,
      preview: !!t.previewUrl 
    })));
    
    // Transform the data to match our BattleTrack interface
    const tracks = searchResults.map((track: iTunesTrack) => {
      // iTunes provides artwork URLs that can be scaled by changing the size in the URL
      // artworkUrl100 can be changed to higher resolutions like 600x600
      let highResImage = track.artworkUrl100;
      if (highResImage) {
        highResImage = highResImage.replace('100x100', '600x600');
      }
      
      return {
        id: track.trackId.toString(),
        name: track.trackName,
        artist: track.artistName,
        album: track.collectionName,
        preview_url: track.previewUrl,
        image_url: highResImage || track.artworkUrl60 || '/placeholder-album.svg',
        wins: 0,
        losses: 0,
        battles: 0,
        score: 0
      };
    });

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error('Error searching tracks:', error);
    return NextResponse.json(
      { error: 'Failed to search tracks' },
      { status: 500 }
    );
  }
}
