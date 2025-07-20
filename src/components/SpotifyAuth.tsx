'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { spotifyApi } from '@/lib/spotify';
import { MusicalNoteIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

export function SpotifyAuth() {
	const [isLoading, setIsLoading] = useState(false);
	const { setSpotifyToken } = useAppStore();

	const handleSpotifyAuth = () => {
		setIsLoading(true);
		const authUrl = spotifyApi.getAuthUrl();
		window.location.href = authUrl;
	};

	return (
		<div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
			<div className="mb-6">
				<MusicalNoteIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />
				<h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
					Connect to Spotify
				</h2>
				<p className="text-gray-300">
					Log in with your Spotify account to access your playlists and start battling songs!
				</p>
			</div>

			<button
				onClick={handleSpotifyAuth}
				disabled={isLoading}
				className="bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white font-bold py-3 px-8 rounded-full text-lg transition-colors duration-200 inline-flex items-center gap-2"
			>
				{isLoading ? (
					<>
						<div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
						Connecting...
					</>
				) : (
					<>
						<MusicalNoteIcon className="w-5 h-5" />
						Connect Spotify
					</>
				)}
			</button>

			<div className="mt-6 text-sm text-gray-400">
				<p>We only access your public playlists and basic profile information.</p>
			</div>
		</div>
	);
}
