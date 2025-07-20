import axios from 'axios';
import { SpotifyTrack, SpotifyPlaylist, SpotifySearchResponse } from '@/types/spotify';

const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
const SPOTIFY_REDIRECT_URI = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI || 'http://localhost:3000/callback';

export class SpotifyAPI {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  getAuthUrl(): string {
    const scopes = [
      'user-read-private',
      'user-read-email',
      'playlist-read-private',
      'playlist-read-collaborative'
    ].join(' ');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: SPOTIFY_CLIENT_ID!,
      scope: scopes,
      redirect_uri: SPOTIFY_REDIRECT_URI,
      show_dialog: 'true'
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<string> {
    try {
      const response = await axios.post('/api/spotify/token', { code });
      return response.data.access_token;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw error;
    }
  }

  private async makeRequest(endpoint: string, params?: Record<string, any>) {
    if (!this.token) {
      throw new Error('No Spotify token available');
    }

    try {
      const response = await axios.get(`https://api.spotify.com/v1${endpoint}`, {
        headers: {
          Authorization: `Bearer ${this.token}`
        },
        params
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // Token expired
        throw new Error('Token expired');
      }
      throw error;
    }
  }

  async searchTracks(query: string, limit = 20): Promise<SpotifyTrack[]> {
    const data = await this.makeRequest('/search', {
      q: query,
      type: 'track',
      limit
    });
    return data.tracks.items;
  }

  async getPlaylist(playlistId: string): Promise<SpotifyPlaylist> {
    return await this.makeRequest(`/playlists/${playlistId}`);
  }

  async getUserPlaylists(limit = 50): Promise<SpotifyPlaylist[]> {
    const data = await this.makeRequest('/me/playlists', { limit });
    return data.items;
  }

  async getPlaylistTracks(playlistId: string): Promise<SpotifyTrack[]> {
    let allTracks: SpotifyTrack[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      const data = await this.makeRequest(`/playlists/${playlistId}/tracks`, {
        offset,
        limit,
        fields: 'items(track(id,name,artists,album,preview_url,external_urls,duration_ms,popularity)),total'
      });

      const tracks = data.items
        .map((item: any) => item.track)
        .filter((track: any) => track && track.id); // Filter out null tracks

      allTracks = [...allTracks, ...tracks];

      if (data.items.length < limit) {
        break;
      }

      offset += limit;
    }

    return allTracks;
  }

  async getTrack(trackId: string): Promise<SpotifyTrack> {
    return await this.makeRequest(`/tracks/${trackId}`);
  }

  async getCurrentUser() {
    return await this.makeRequest('/me');
  }
}

export const spotifyApi = new SpotifyAPI();
