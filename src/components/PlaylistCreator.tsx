'use client';

import {
	ArrowDownTrayIcon,
	ArrowPathIcon,
	ArrowUpTrayIcon,
	MagnifyingGlassIcon,
	PencilIcon,
	PlayIcon,
	PlusIcon,
	TrashIcon,
} from '@heroicons/react/24/outline';
import { ListBulletIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useAppStore } from '@/stores/useAppStore';
import type { BattleTrack, Playlist } from '@/types';
import { Marquee } from './Marquee';

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
		resetPlaylistBattles,
		adaptPlaylistBattles,
	} = useAppStore();

	// Search for tracks using iTunes API
	const searchTracks = useCallback(async (query: string) => {
		if (!query.trim()) {
			setSearchResults([]);
			return;
		}

		setIsSearching(true);
		try {
			const response = await fetch(
				`/api/itunes/search?q=${encodeURIComponent(query)}`
			);
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
	}, []); // Debounced search effect
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			searchTracks(searchQuery);
		}, 500);

		return () => clearTimeout(timeoutId);
	}, [searchQuery, searchTracks]);

	const addTrackToPlaylist = (track: BattleTrack) => {
		if (tracks.find(t => t.id === track.id)) {
			toast.error('Track already added');
			return;
		}
		setTracks([...tracks, track]);
		// Removed toast for adding track - visual feedback is enough
		setSearchQuery('');
		setSearchResults([]);
	};

	const removeTrack = (trackId: string) => {
		setTracks(tracks.filter(t => t.id !== trackId));
		// Removed toast for removing track - visual feedback is enough
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

		// First adapt the battles to handle track changes
		adaptPlaylistBattles(editingPlaylist.id, tracks);

		// Then update the playlist with the new name
		const updatedPlaylist: Playlist = {
			...editingPlaylist,
			name: playlistName.trim(),
			tracks, // tracks will be updated by adaptPlaylistBattles
			updatedAt: new Date(),
		};

		updatePlaylist(updatedPlaylist);
		toast.success('Playlist updated! Battle progress preserved.');
		cancelEditing();
	};

	const handleDeletePlaylist = (playlistId: string, playlistName: string) => {
		if (confirm(`Are you sure you want to delete "${playlistName}"?`)) {
			deletePlaylist(playlistId);
			toast.success('Playlist deleted');
		}
	};

	const handleResetPlaylist = (playlistId: string, playlistName: string) => {
		if (
			confirm(
				`Are you sure you want to reset all battle progress for "${playlistName}"? This will clear all rankings and start fresh.`
			)
		) {
			resetPlaylistBattles(playlistId);
			toast.success('Battle progress reset! Ready to start fresh.');
		}
	};
	const createPlaylist = () => {
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
			updatedAt: new Date(),
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
		// Removed toast for viewing rankings - user action is clear
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
				// Removed toast for starting battles - user action is clear
			}
		}, 100);
	};

	// Export playlist data as JSON
	const exportPlaylist = (playlist: Playlist) => {
		const exportData = {
			version: '1.0',
			exportedAt: new Date().toISOString(),
			playlist: {
				id: playlist.id,
				name: playlist.name,
				tracks: playlist.tracks.map(track => ({
					id: track.id,
					name: track.name,
					artist: track.artist,
					album: track.album,
					preview_url: track.preview_url,
					image_url: track.image_url,
					wins: track.wins,
					losses: track.losses,
					battles: track.battles,
					score: track.score,
				})),
				battles: playlist.battles,
				isComplete: playlist.isComplete,
				createdAt: playlist.createdAt,
				updatedAt: playlist.updatedAt,
			},
		};

		const dataStr = JSON.stringify(exportData, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });

		const link = document.createElement('a');
		link.href = URL.createObjectURL(dataBlob);
		link.download = `trackduel-${playlist.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		toast.success(`Exported "${playlist.name}" playlist`);
	};

	// Export all playlists
	const exportAllPlaylists = () => {
		const exportData = {
			version: '1.0',
			exportedAt: new Date().toISOString(),
			playlists: playlists.map(playlist => ({
				id: playlist.id,
				name: playlist.name,
				tracks: playlist.tracks.map(track => ({
					id: track.id,
					name: track.name,
					artist: track.artist,
					album: track.album,
					preview_url: track.preview_url,
					image_url: track.image_url,
					wins: track.wins,
					losses: track.losses,
					battles: track.battles,
					score: track.score,
				})),
				battles: playlist.battles,
				isComplete: playlist.isComplete,
				createdAt: playlist.createdAt,
				updatedAt: playlist.updatedAt,
			})),
		};

		const dataStr = JSON.stringify(exportData, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });

		const link = document.createElement('a');
		link.href = URL.createObjectURL(dataBlob);
		link.download = `trackduel-all-playlists-${new Date().toISOString().split('T')[0]}.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		toast.success(`Exported ${playlists.length} playlists`);
	};

	// Import playlist(s) from JSON file
	const importPlaylist = () => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		input.onchange = e => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;

			const reader = new FileReader();
			reader.onload = e => {
				try {
					const content = e.target?.result as string;
					const importData = JSON.parse(content);

					// Validate import data structure
					if (!importData.version) {
						throw new Error('Invalid file format');
					}

					if (importData.playlist) {
						// Single playlist import
						const playlist = importData.playlist;
						const importedPlaylist: Playlist = {
							...playlist,
							id: Date.now().toString(), // Generate new ID to avoid conflicts
							createdAt: new Date(playlist.createdAt),
							updatedAt: new Date(),
						};

						addPlaylist(importedPlaylist);
						toast.success(`Imported playlist "${playlist.name}"`);
					} else if (importData.playlists) {
						// Multiple playlists import
						let importCount = 0;
						for (const playlist of importData.playlists) {
							const importedPlaylist: Playlist = {
								...playlist,
								id: (Date.now() + importCount).toString(), // Generate unique IDs
								createdAt: new Date(playlist.createdAt),
								updatedAt: new Date(),
							};
							addPlaylist(importedPlaylist);
							importCount++;
						}
						toast.success(`Imported ${importCount} playlists`);
					} else {
						throw new Error('No playlist data found in file');
					}
				} catch (error) {
					console.error('Import error:', error);
					toast.error(
						'Failed to import playlist. Please check the file format.'
					);
				}
			};
			reader.readAsText(file);
		};
		input.click();
	};

	// Keyboard shortcuts for playlist creator
	const playlistShortcuts = [
		{
			key: 'n',
			description: 'Focus playlist name input',
			action: () => {
				const nameInput = document.querySelector(
					'input[placeholder*="playlist name"]'
				) as HTMLInputElement;
				nameInput?.focus();
			},
			context: 'Playlist',
		},
		{
			key: 'f',
			description: 'Focus search input',
			action: () => {
				const searchInput = document.querySelector(
					'input[placeholder*="Search"]'
				) as HTMLInputElement;
				searchInput?.focus();
			},
			context: 'Playlist',
		},
		{
			key: 'Enter',
			description: 'Create playlist (when name is filled)',
			action: () => {
				if (playlistName.trim() && tracks.length >= 2) {
					createPlaylist();
				}
			},
			context: 'Playlist',
		},
		{
			key: 'Escape',
			description: 'Cancel editing',
			action: () => {
				if (editingPlaylist) {
					cancelEditing();
				}
			},
			context: 'Playlist',
		},
	];

	useKeyboardShortcuts(playlistShortcuts, true);

	return (
		<div className="space-y-6">
			{/* Import Section - Always visible */}
			{playlists.length === 0 && (
				<div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 text-center">
					<h2 className="text-xl font-bold text-white mb-4">Get Started</h2>
					<p className="text-gray-300 mb-4">
						Create your first playlist or import existing ones
					</p>
					<button
						type="button"
						onClick={importPlaylist}
						className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 mx-auto"
					>
						<ArrowUpTrayIcon className="w-5 h-5" />
						Import Playlists
					</button>
				</div>
			)}

			{/* Existing Playlists */}
			{playlists.length > 0 && (
				<div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-xl font-bold text-white flex items-center gap-2">
							<ListBulletIcon className="w-6 h-6" />
							Your Playlists
						</h2>
						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={importPlaylist}
								className="bg-blue-500 hover:bg-blue-600 text-white px-2 sm:px-3 py-2 rounded-lg transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
								title="Import Playlist"
							>
								<ArrowUpTrayIcon className="w-4 h-4" />
								<span className="hidden sm:inline">Import</span>
							</button>
							<button
								type="button"
								onClick={exportAllPlaylists}
								className="bg-green-500 hover:bg-green-600 text-white px-2 sm:px-3 py-2 rounded-lg transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
								title="Export All Playlists"
							>
								<ArrowDownTrayIcon className="w-4 h-4" />
								<span className="hidden sm:inline">Export All</span>
							</button>
						</div>
					</div>
					<div className="grid gap-3">
						{playlists.map(playlist => (
							<div key={playlist.id} className="bg-white/10 rounded-lg p-4">
								<div className="flex items-center justify-between">
									<button
										type="button"
										onClick={() => selectExistingPlaylist(playlist)}
										className="flex-1 text-left hover:bg-white/10 rounded-lg p-2 -m-2 transition-colors"
									>
										<h3 className="font-semibold text-white">
											{playlist.name}
										</h3>
										<p className="text-sm text-gray-300">
											{playlist.tracks.length} songs • {playlist.battles.length}{' '}
											battles
											{playlist.isComplete && (
												<span className="text-green-400 ml-2">✓ Complete</span>
											)}
										</p>
									</button>
									<div className="flex items-center gap-2 ml-4">
										<button
											type="button"
											onClick={() => startPlaylistBattle(playlist)}
											className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors"
											title={
												playlist.isComplete ? 'Re-battle' : 'Battle/Continue'
											}
										>
											<PlayIcon className="w-4 h-4" />
										</button>
										<button
											type="button"
											onClick={() => startEditingPlaylist(playlist)}
											className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
											title="Edit"
										>
											<PencilIcon className="w-4 h-4" />
										</button>
										<button
											type="button"
											onClick={() => exportPlaylist(playlist)}
											className="bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-lg transition-colors"
											title="Export Playlist"
										>
											<ArrowDownTrayIcon className="w-4 h-4" />
										</button>
										{playlist.battles.length > 0 && (
											<button
												type="button"
												onClick={() =>
													handleResetPlaylist(playlist.id, playlist.name)
												}
												className="bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-lg transition-colors"
												title="Reset Battle Progress"
											>
												<ArrowPathIcon className="w-4 h-4" />
											</button>
										)}
										<button
											type="button"
											onClick={() =>
												handleDeletePlaylist(playlist.id, playlist.name)
											}
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
						onChange={e => setPlaylistName(e.target.value)}
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
							onChange={e => setSearchQuery(e.target.value)}
							className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
						/>
					</div>

					{/* Search Results */}
					{searchResults.length > 0 && (
						<div className="mt-4">
							<h4 className="text-white font-medium mb-3">
								Search Results ({searchResults.length})
							</h4>
							<div className="bg-white/5 rounded-lg p-3 md:p-4 max-h-96 overflow-y-auto">
								<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-3">
									{searchResults.map(track => (
										<button
											type="button"
											key={track.id}
											onClick={() => addTrackToPlaylist(track)}
											className="bg-white/10 hover:bg-white/20 transition-colors rounded-lg p-2 md:p-3 text-left group"
										>
											<div className="aspect-square mb-2 relative">
												<Image
													src={track.image_url}
													alt={track.album}
													width={120}
													height={120}
													className="w-full h-full rounded object-cover"
												/>
												<div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded flex items-center justify-center">
													<PlusIcon className="w-4 h-4 md:w-6 md:h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
												</div>
											</div>
											<div className="space-y-1">
												<div
													className="text-white font-medium text-xs md:text-sm leading-tight overflow-hidden"
													style={{
														display: '-webkit-box',
														WebkitLineClamp: 2,
														WebkitBoxOrient: 'vertical' as const,
													}}
												>
													<Marquee
														text={track.name}
														className="text-white font-medium text-xs md:text-sm leading-tight"
														speed={30}
													/>
												</div>
												<div className="text-gray-300 text-xs">
													<Marquee
														text={track.artist}
														className="text-gray-300 text-xs"
														speed={25}
													/>
												</div>
												<div className="text-gray-400 text-xs hidden md:block">
													<Marquee
														text={track.album}
														className="text-gray-400 text-xs"
														speed={20}
													/>
												</div>
											</div>
										</button>
									))}
								</div>
							</div>
						</div>
					)}

					{isSearching && (
						<p className="text-gray-400 text-sm mt-2">Searching...</p>
					)}
				</div>

				{/* Current Tracks */}
				{tracks.length > 0 && (
					<div className="mb-4">
						<h3 className="text-white font-semibold mb-2">
							Tracks ({tracks.length})
						</h3>
						<div className="space-y-2 max-h-40 overflow-y-auto">
							{tracks.map(track => (
								<div
									key={track.id}
									className="bg-white/5 rounded-lg p-3 flex items-center justify-between"
								>
									<div className="flex items-center gap-3">
										<Image
											src={track.image_url}
											alt={track.album}
											width={40}
											height={40}
											className="w-10 h-10 rounded object-cover"
										/>
										<div>
											<div className="text-white font-medium">
												<Marquee
													text={track.name}
													className="text-white font-medium"
													speed={30}
												/>
											</div>
											<div className="text-gray-300 text-sm">
												<Marquee
													text={track.artist}
													className="text-gray-300 text-sm"
													speed={25}
												/>
											</div>
										</div>
									</div>
									<button
										type="button"
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
								type="button"
								onClick={saveEditedPlaylist}
								disabled={tracks.length < 2 || !playlistName.trim()}
								className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors"
							>
								Save Changes
							</button>
							<button
								type="button"
								onClick={cancelEditing}
								className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
							>
								Cancel
							</button>
						</>
					) : (
						<button
							type="button"
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
