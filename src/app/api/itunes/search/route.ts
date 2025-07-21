import { NextRequest, NextResponse } from 'next/server';
import { iTunesTrack, iTunesSearchResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json({ error: 'Query parameter required' }, { status: 400 });
    }

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

    const searchData: iTunesSearchResponse = await searchResponse.json();
    
    console.log('iTunes search response:', JSON.stringify(searchData, null, 2));
    
    // Transform the data to match our BattleTrack interface
    const tracks = searchData.results.map((track: iTunesTrack) => {
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

    console.log('Transformed tracks:', tracks.map((t) => ({ name: t.name, preview_url: t.preview_url })));

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error('Error searching tracks:', error);
    return NextResponse.json(
      { error: 'Failed to search tracks' },
      { status: 500 }
    );
  }
}
