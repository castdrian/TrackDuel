import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
    }

    // Use iTunes Search API instead of Spotify
    const searchResponse = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=10&country=US`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    if (!searchResponse.ok) {
      throw new Error('Failed to search tracks');
    }

    const searchData = await searchResponse.json();
    
    console.log('iTunes search response:', JSON.stringify(searchData, null, 2));
    
    // Transform the data to match our BattleTrack interface
    const tracks = searchData.results.map((track: any) => ({
      id: track.trackId.toString(),
      name: track.trackName,
      artist: track.artistName,
      album: track.collectionName,
      preview_url: track.previewUrl,
      image_url: track.artworkUrl100 || track.artworkUrl60 || '/placeholder-album.svg',
      wins: 0,
      losses: 0,
      battles: 0,
      score: 0
    }));

    console.log('Transformed tracks:', tracks.map((t: any) => ({ name: t.name, preview_url: t.preview_url })));

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error('Error searching tracks:', error);
    return NextResponse.json(
      { error: 'Failed to search tracks' },
      { status: 500 }
    );
  }
}
