// iTunes API Types
export interface iTunesTrack {
	trackId: number;
	trackName: string;
	artistName: string;
	collectionName: string;
	artworkUrl100?: string;
	artworkUrl60?: string;
	previewUrl?: string;
	trackTimeMillis: number;
	primaryGenreName: string;
}

export interface iTunesSearchResponse {
	resultCount: number;
	results: iTunesTrack[];
}

// Simple track interface for internal use
export interface SimpleTrack {
	id: string;
	name: string;
	artist: string;
	album: string;
	preview_url: string;
	image_url: string;
	duration: number;
}

// Battle-related types
export interface BattleTrack extends SimpleTrack {
	wins: number;
	battles: number;
	losses: number;
	score: number;
}

export interface Battle {
	id: string;
	track1: BattleTrack;
	track2: BattleTrack;
	winner?: BattleTrack;
	timestamp: Date;
}

// Playlist types
export interface Playlist {
	id: string;
	name: string;
	tracks: BattleTrack[];
	battles: Battle[];
	isComplete: boolean;
	createdAt: Date;
	updatedAt: Date;
}
