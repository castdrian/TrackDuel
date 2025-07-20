export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
  duration_ms: number;
  popularity: number;
}

export interface SimpleTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  preview_url: string | null;
  image_url: string;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
  release_date: string;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: SpotifyImage[];
  tracks: {
    items: {
      track: SpotifyTrack;
    }[];
    total: number;
  };
  external_urls: {
    spotify: string;
  };
}

export interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
    total: number;
  };
}

export interface BattleTrack extends SimpleTrack {
  wins: number;
  losses: number;
  battles: number;
  score: number;
}

export interface Battle {
  id: string;
  track1: BattleTrack;
  track2: BattleTrack;
  winner?: BattleTrack;
  timestamp: Date;
}

export interface Playlist {
  id: string;
  name: string;
  tracks: BattleTrack[];
  battles: Battle[];
  isComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}
