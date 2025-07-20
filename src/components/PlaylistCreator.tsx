'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { BattleTrack, Playlist } from '@/types/spotify';
import {
	PlusIcon,
	TrashIcon,
	PlayIcon,
	MagnifyingGlassIcon,
	PencilIcon
} from '@heroicons/react/24/outline';
import { ListBulletIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

export function PlaylistCreator() {
	const [playlistName, setPlaylistName] = useState('');
	const [tracks, setTracks] = useState<BattleTrack[]>([]);
	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<BattleTrack[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);

	const {
		playlists,
		addPlaylist,
		setCurrentPlaylist,
		generateNextBattle,
		setCurrentBattle,
		updatePlaylist,
		deletePlaylist,
		resetPlaylistBattles
	} = useAppStore();

	// Search for tracks using iTunes API
	const searchTracks = async (query: string) => {
		if (!query.trim()) {
			setSearchResults([]);
			return;
		}

		setIsSearching(true);
		try {
			const response = await fetch(`/api/itunes/search?q=${encodeURIComponent(query)}`);
			if (response.ok) {
				const data = await response.json();
				setSearchResults(data.tracks || []);
			} else {
				toast.error('Failed to search tracks');
				setSearchResults([]);
			}
		} catch (error) {
			console.error('Search error:', error);
			toast.error('Failed to search tracks');
			setSearchResults([]);
		} finally {
			setIsSearching(false);
		}
	};	// Debounced search effect
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			searchTracks(searchQuery);
		}, 500);

		return () => clearTimeout(timeoutId);
	}, [searchQuery]);

	const addTrackToPlaylist = (track: BattleTrack) => {
		if (tracks.find(t => t.id === track.id)) {
			toast.error('Track already added');
			return;
		}
		setTracks([...tracks, track]);
		toast.success(`Added "${track.name}"`);
		setSearchQuery('');
		setSearchResults([]);
	};

	const removeTrack = (trackId: string) => {
		setTracks(tracks.filter(t => t.id !== trackId));
		toast.success('Track removed');
	};

	const startEditingPlaylist = (playlist: Playlist) => {
		setEditingPlaylist(playlist);
		setPlaylistName(playlist.name);
		setTracks([...playlist.tracks]);
	};

	const cancelEditing = () => {
		setEditingPlaylist(null);
		setPlaylistName('');
		setTracks([]);
	};

	const saveEditedPlaylist = () => {
		if (!editingPlaylist) return;

		if (!playlistName.trim()) {
			toast.error('Please enter a playlist name');
			return;
		}

		if (tracks.length < 2) {
			toast.error('You need at least 2 tracks to battle');
			return;
		}

		const updatedPlaylist: Playlist = {
			...editingPlaylist,
			name: playlistName.trim(),
			tracks,
			updatedAt: new Date()
		};

		updatePlaylist(updatedPlaylist);
		toast.success('Playlist updated!');
		cancelEditing();
	};

	const handleDeletePlaylist = (playlistId: string, playlistName: string) => {
		if (confirm(`Are you sure you want to delete "${playlistName}"?`)) {
			deletePlaylist(playlistId);
			toast.success('Playlist deleted');
		}
	}; const createPlaylist = () => {
		if (!playlistName.trim()) {
			toast.error('Please enter a playlist name');
			return;
		}

		if (tracks.length < 2) {
			toast.error('You need at least 2 tracks to battle');
			return;
		}

		const playlist: Playlist = {
			id: `playlist-${Date.now()}`,
			name: playlistName.trim(),
			tracks,
			battles: [],
			isComplete: false,
			createdAt: new Date(),
			updatedAt: new Date()
		};

		addPlaylist(playlist);
		setCurrentPlaylist(playlist);

		// Reset form
		setPlaylistName('');
		setTracks([]);

		// Generate the first battle
		setTimeout(() => {
			const firstBattle = generateNextBattle();
			if (firstBattle) {
				setCurrentBattle(firstBattle);
			}
		}, 100);

		toast.success(`Created "${playlist.name}" with ${tracks.length} tracks!`);
	};

	const selectExistingPlaylist = (playlist: Playlist) => {
		setCurrentPlaylist(playlist);
		// Just show rankings, don't start battles automatically
		toast.success(`Viewing "${playlist.name}" rankings`);
	};

	const startPlaylistBattle = (playlist: Playlist) => {
		setCurrentPlaylist(playlist);

		// Reset battles if playlist is complete, or continue if not
		if (playlist.isComplete) {
			resetPlaylistBattles(playlist.id);
		}

		// Generate the first/next battle
		setTimeout(() => {
			const battle = generateNextBattle();
			if (battle) {
				setCurrentBattle(battle);
				const battleType = playlist.isComplete ? 'Restarted' : 'Continuing';
				toast.success(`${battleType} battles for "${playlist.name}"`);
			}
		}, 100);
	};

	return (
		<div className="space-y-6">
			{/* Existing Playlists */}
			{playlists.length > 0 && (
				<div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
					<h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
						<ListBulletIcon className="w-6 h-6" />
						Your Playlists
					</h2>
					<div className="grid gap-3">
						{playlists.map(playlist => (
							<div key={playlist.id} className="bg-white/10 rounded-lg p-4">
								<div className="flex items-center justify-between">
									<button
										onClick={() => selectExistingPlaylist(playlist)}
										className="flex-1 text-left hover:bg-white/10 rounded-lg p-2 -m-2 transition-colors"
									>
										<h3 className="font-semibold text-white">{playlist.name}</h3>
										<p className="text-sm text-gray-300">
											{playlist.tracks.length} songs • {playlist.battles.length} battles
											{playlist.isComplete && (
												<span className="text-green-400 ml-2">✓ Complete</span>
											)}
										</p>
									</button>
									<div className="flex items-center gap-2 ml-4">
										<button
											onClick={() => startPlaylistBattle(playlist)}
											className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors"
											title={playlist.isComplete ? "Re-battle" : "Battle/Continue"}
										>
											<PlayIcon className="w-4 h-4" />
										</button>
										<button
											onClick={() => startEditingPlaylist(playlist)}
											className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
											title="Edit"
										>
											<PencilIcon className="w-4 h-4" />
										</button>
										<button
											onClick={() => handleDeletePlaylist(playlist.id, playlist.name)}
											className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
											title="Delete"
										>
											<TrashIcon className="w-4 h-4" />
										</button>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Create/Edit Playlist */}
			<div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
				<h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
					<PlusIcon className="w-6 h-6" />
					{editingPlaylist ? 'Edit Playlist' : 'Create New Playlist'}
				</h2>

				{/* Playlist Name */}
				<div className="mb-4">
					<input
						type="text"
						placeholder="Enter playlist name..."
						value={playlistName}
						onChange={(e) => setPlaylistName(e.target.value)}
						className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
					/>
				</div>

				{/* Search for Tracks */}
				<div className="mb-4">
					<div className="relative">
						<MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
						<input
							type="text"
							placeholder="Search for tracks..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
						/>
					</div>

					{/* Search Results */}
					{searchResults.length > 0 && (
						<div className="mt-2 bg-white/5 rounded-lg max-h-40 overflow-y-auto">
							{searchResults.map(track => (
								<button
									key={track.id}
									onClick={() => addTrackToPlaylist(track)}
									className="w-full p-3 text-left hover:bg-white/10 transition-colors flex items-center gap-3"
								>
									<img
										src={track.image_url}
										alt={track.album}
										className="w-10 h-10 rounded object-cover"
									/>
									<div>
										<p className="text-white font-medium">{track.name}</p>
										<p className="text-gray-300 text-sm">{track.artist}</p>
									</div>
								</button>
							))}
						</div>
					)}

					{isSearching && (
						<p className="text-gray-400 text-sm mt-2">Searching...</p>
					)}
				</div>

				{/* Current Tracks */}
				{tracks.length > 0 && (
					<div className="mb-4">
						<h3 className="text-white font-semibold mb-2">Tracks ({tracks.length})</h3>
						<div className="space-y-2 max-h-40 overflow-y-auto">
							{tracks.map(track => (
								<div key={track.id} className="bg-white/5 rounded-lg p-3 flex items-center justify-between">
									<div className="flex items-center gap-3">
										<img
											src={track.image_url}
											alt={track.album}
											className="w-10 h-10 rounded object-cover"
										/>
										<div>
											<p className="text-white font-medium">{track.name}</p>
											<p className="text-gray-300 text-sm">{track.artist}</p>
										</div>
									</div>
									<button
										onClick={() => removeTrack(track.id)}
										className="text-red-400 hover:text-red-300 transition-colors"
									>
										<TrashIcon className="w-4 h-4" />
									</button>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Action Buttons */}
				<div className="flex gap-2">
					{editingPlaylist ? (
						<>
							<button
								onClick={saveEditedPlaylist}
								disabled={tracks.length < 2 || !playlistName.trim()}
								className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors"
							>
								Save Changes
							</button>
							<button
								onClick={cancelEditing}
								className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
							>
								Cancel
							</button>
						</>
					) : (
						<button
							onClick={createPlaylist}
							disabled={tracks.length < 2 || !playlistName.trim()}
							className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors"
						>
							Create Playlist & Start Battle
						</button>
					)}
				</div>

				{tracks.length < 2 && (
					<p className="text-gray-400 text-center text-sm mt-2">
						Add at least 2 tracks to create a playlist
					</p>
				)}
			</div>
		</div>
	);
}
