'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import {
	HeartIcon as HeartSolid,
	PauseIcon,
	PlayIcon,
	SpeakerWaveIcon,
} from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useAppStore } from '@/stores/useAppStore';
import type { BattleTrack } from '@/types';
import { Marquee } from './Marquee';

export function BattleArena() {
	const [playingTrack, setPlayingTrack] = useState<string | null>(null);
	const [currentTime, setCurrentTime] = useState<Record<string, number>>({});
	const [autoplayEnabled, setAutoplayEnabled] = useState(true);
	const [autoplaySequence, setAutoplaySequence] = useState<'left' | 'right' | 'complete'>('left');
	const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

	const {
		currentBattle,
		completeBattle,
		generateNextBattle,
		setCurrentBattle,
		currentPlaylist,
	} = useAppStore();

	useEffect(() => {
		if (!currentBattle) {
			const nextBattle = generateNextBattle();
			if (nextBattle) {
				setCurrentBattle(nextBattle);
			}
		}
	}, [currentBattle, generateNextBattle, setCurrentBattle]);

	// Autoplay effect - plays left track first, then right track after it ends
	useEffect(() => {
		if (!currentBattle || !autoplayEnabled) return;

		// Reset autoplay sequence for new battle
		setAutoplaySequence('left');
		
		// Small delay to ensure audio elements are ready
		const autoplayTimer = setTimeout(() => {
			if (currentBattle.track1.preview_url) {
				playTrack(currentBattle.track1, true);
			}
		}, 500);

		return () => clearTimeout(autoplayTimer);
	}, [currentBattle, autoplayEnabled]);

	const playTrack = (track: BattleTrack, isAutoplay = false) => {
		console.log(
			'Playing track:',
			track.name,
			'Preview URL:',
			track.preview_url
		);

		// If this is a manual play (not autoplay), stop the autoplay sequence
		if (!isAutoplay) {
			setAutoplaySequence('complete');
		}

		// Stop any currently playing track
		Object.values(audioRefs.current).forEach(audio => {
			if (audio) {
				audio.pause();
				audio.currentTime = 0;
			}
		});

		if (!track.preview_url) {
			toast.error('No preview available for this track');
			return;
		}

		const trackId = track.id;

		if (playingTrack === trackId) {
			setPlayingTrack(null);
			return;
		}

		// Create or get audio element
		if (!audioRefs.current[trackId]) {
			const audio = new Audio(track.preview_url);
			audio.volume = 0.7;
			audio.preload = 'metadata';

			audio.addEventListener('timeupdate', () => {
				setCurrentTime(prev => ({
					...prev,
					[trackId]: audio.currentTime,
				}));
			});

			audio.addEventListener('ended', () => {
				setPlayingTrack(null);
				setCurrentTime(prev => ({
					...prev,
					[trackId]: 0,
				}));

				// Handle autoplay sequence
				if (autoplayEnabled && currentBattle) {
					if (trackId === currentBattle.track1.id && autoplaySequence === 'left') {
						// Left track finished, play right track
						setAutoplaySequence('right');
						if (currentBattle.track2.preview_url) {
							setTimeout(() => playTrack(currentBattle.track2, true), 1000);
						}
					} else if (trackId === currentBattle.track2.id && autoplaySequence === 'right') {
						// Right track finished, autoplay sequence complete
						setAutoplaySequence('complete');
					}
				}
			});

			audio.addEventListener('error', e => {
				console.error('Audio error:', e);
				setPlayingTrack(null);
			});

			audioRefs.current[trackId] = audio;
		}

		const audio = audioRefs.current[trackId];

		// For mobile compatibility, handle the promise gracefully
		const playPromise = audio.play();

		if (playPromise !== undefined) {
			playPromise
				.then(() => {
					setPlayingTrack(trackId);
				})
				.catch(error => {
					console.error('Error playing audio:', error);
					// Only show toast on first interaction error, not subsequent ones
					if (error.name === 'NotAllowedError') {
						toast.error('Tap again to play audio', { duration: 2000 });
					}
				});
		} else {
			setPlayingTrack(trackId);
		}
	};

	const handleVote = (winnerId: string) => {
		// Stop any playing audio
		Object.values(audioRefs.current).forEach(audio => {
			if (audio) {
				audio.pause();
				audio.currentTime = 0;
			}
		});
		setPlayingTrack(null);
		setCurrentTime({});

		// Complete the battle
		completeBattle(winnerId);

		// Check if there are more battles immediately
		// Use a small delay to ensure state is updated
		setTimeout(() => {
			const nextBattle = generateNextBattle();
			if (nextBattle) {
				setCurrentBattle(nextBattle);
				// Removed toast for next battle
			} else {
				// All battles complete - clear current battle to show results
				setCurrentBattle(null);
				// Keep the completion toast as it's important
				toast.success('🎉 All battles complete! Check out your rankings!');
			}
		}, 100);
	};

	// Keyboard shortcuts for battle arena
	const battleShortcuts = [
		{
			key: 'ArrowLeft',
			description: 'Choose left track',
			action: () => currentBattle && handleVote(currentBattle.track1.id),
			context: 'Battle',
		},
		{
			key: 'ArrowRight',
			description: 'Choose right track',
			action: () => currentBattle && handleVote(currentBattle.track2.id),
			context: 'Battle',
		},
		{
			key: 'Space',
			description: 'Play/pause current track',
			action: () => {
				if (playingTrack && currentBattle) {
					// Stop current track
					Object.values(audioRefs.current).forEach(audio => {
						if (audio) {
							audio.pause();
							audio.currentTime = 0;
						}
					});
					setPlayingTrack(null);
				} else if (currentBattle) {
					// Play the last played track, or default to left track
					const trackToPlay =
						playingTrack === currentBattle.track2.id
							? currentBattle.track2
							: currentBattle.track1;
					playTrack(trackToPlay);
				}
			},
			context: 'Battle',
		},
		{
			key: 'a',
			description: 'Play left track',
			action: () => currentBattle && playTrack(currentBattle.track1),
			context: 'Battle',
		},
		{
			key: 'd',
			description: 'Play right track',
			action: () => currentBattle && playTrack(currentBattle.track2),
			context: 'Battle',
		},
		{
			key: 's',
			description: 'Stop playing',
			action: () => {
				Object.values(audioRefs.current).forEach(audio => {
					if (audio) {
						audio.pause();
						audio.currentTime = 0;
					}
				});
				setPlayingTrack(null);
			},
			context: 'Battle',
		},
		{
			key: 'q',
			description: 'Toggle autoplay',
			action: () => setAutoplayEnabled(!autoplayEnabled),
			context: 'Battle',
		},
	];

	useKeyboardShortcuts(battleShortcuts, !!currentBattle);

	const cancelBattle = () => {
		// Stop any playing audio
		Object.values(audioRefs.current).forEach(audio => {
			if (audio) {
				audio.pause();
				audio.currentTime = 0;
			}
		});
		setPlayingTrack(null);
		setCurrentTime({});

		// Save progress and return to playlist view (don't clear playlist data)
		setCurrentBattle(null);
		toast.success('Battle progress saved');
	};

	const formatTime = (seconds: number) => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = Math.floor(seconds % 60);
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
	};

	const getProgress = (trackId: string) => {
		const time = currentTime[trackId] || 0;
		return (time / 30) * 100; // 30 seconds preview
	};

	if (!currentBattle) {
		return (
			<div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
				<h2 className="text-2xl font-bold text-white mb-4">
					🎉 Battle Complete!
				</h2>
				<p className="text-gray-300 mb-6">
					All songs have been ranked. Check out your results!
				</p>
			</div>
		);
	}

	const { track1, track2 } = currentBattle;
	const battleNumber = currentPlaylist?.battles.length
		? currentPlaylist.battles.length + 1
		: 1;
	const totalBattles = currentPlaylist
		? (currentPlaylist.tracks.length * (currentPlaylist.tracks.length - 1)) / 2
		: 0;

	return (
		<div className="space-y-6">
			{/* Battle Progress */}
			<div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4">
				<div className="flex items-center justify-between text-white mb-2">
					<span className="text-sm">
						Battle {battleNumber} of {totalBattles}
					</span>
					<button
						type="button"
						onClick={cancelBattle}
						className="text-gray-400 hover:text-white transition-colors p-1"
						title="Save Progress & Exit"
					>
						<XMarkIcon className="w-5 h-5" />
					</button>
				</div>
				<div className="flex items-center justify-between text-white mb-2">
					<span className="text-sm">
						{Math.round((battleNumber / totalBattles) * 100)}% Complete
					</span>
				</div>
				<div className="w-full bg-white/20 rounded-full h-2 mt-2">
					<div
						className="bg-green-400 h-2 rounded-full transition-all duration-300"
						style={{ width: `${(battleNumber / totalBattles) * 100}%` }}
					/>
				</div>
			</div>

			{/* Autoplay Controls */}
			<div className="flex justify-center mb-4">
				<div className="flex items-center gap-3 bg-white/10 backdrop-blur-lg rounded-xl px-4 py-2">
					<span className="text-sm text-gray-300">Autoplay Previews</span>
					<button
						type="button"
						onClick={() => setAutoplayEnabled(!autoplayEnabled)}
						className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 group ${
							autoplayEnabled ? 'bg-purple-600' : 'bg-gray-600'
						}`}
						title={`${autoplayEnabled ? 'Disable' : 'Enable'} autoplay previews (Q)`}
					>
						<span
							className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
								autoplayEnabled ? 'translate-x-6' : 'translate-x-1'
							}`}
						/>
						{/* Keyboard hint */}
						<span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
							Press Q
						</span>
					</button>
				</div>
			</div>

			{/* Battle Arena */}
			<div className="text-center mb-6">
				<h2 className="text-2xl font-bold text-white mb-2">
					Choose Your Favorite
				</h2>
				<p className="text-gray-300">
					Tap a song to preview, then pick the winner!
				</p>
			</div>

			<div className="grid grid-cols-2 gap-3 md:gap-6">
				{[track1, track2].map((track, index) => (
					<motion.div
						key={track.id}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.1 }}
						className="bg-white/10 backdrop-blur-lg rounded-2xl p-3 md:p-6"
					>
						{/* Album Art */}
						<div className="relative mb-4">
							<Image
								src={track.image_url || '/placeholder-album.svg'}
								alt={track.album}
								width={400}
								height={400}
								className="w-full aspect-square object-cover rounded-lg"
							/>

							{/* Play Button Overlay */}
							<button
								type="button"
								onClick={() => playTrack(track)}
								disabled={!track.preview_url}
								className="absolute inset-0 bg-black/40 hover:bg-black/60 disabled:bg-black/40 disabled:cursor-not-allowed flex items-center justify-center rounded-lg transition-colors duration-200 group"
							>
								{playingTrack === track.id ? (
									<PauseIcon className="w-16 h-16 text-white" />
								) : (
									<PlayIcon className="w-16 h-16 text-white" />
								)}

								{/* Keyboard hint */}
								<span className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
									{index === 0 ? 'A' : 'D'}
								</span>
							</button>

							{/* Audio Progress */}
							{playingTrack === track.id && (
								<div className="absolute bottom-2 left-2 right-2">
									<div className="bg-white/20 rounded-full h-1">
										<div
											className="bg-white h-1 rounded-full transition-all duration-100"
											style={{ width: `${getProgress(track.id)}%` }}
										/>
									</div>
								</div>
							)}

							{!track.preview_url && (
								<div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
									No Preview
								</div>
							)}
						</div>

						{/* Track Info */}
						<div className="text-center mb-4 h-20 flex flex-col justify-center">
							<div className="mb-1">
								<Marquee
									text={track.name}
									className="font-bold text-white text-base md:text-lg"
									speed={30}
								/>
							</div>
							<div className="mb-1">
								<Marquee
									text={track.artist}
									className="text-gray-300 text-xs md:text-sm"
									speed={25}
								/>
							</div>
							<div>
								<Marquee
									text={track.album}
									className="text-gray-400 text-xs"
									speed={25}
								/>
							</div>
						</div>

						{/* Audio Status - Always reserve space */}
						<div className="flex items-center justify-center gap-2 mb-4 text-sm text-gray-300 h-6">
							{playingTrack === track.id ? (
								<>
									<SpeakerWaveIcon className="w-4 h-4" />
									<span>{formatTime(currentTime[track.id] || 0)} / 0:30</span>
								</>
							) : !track.preview_url ? (
								<span className="text-red-400">No preview available</span>
							) : null}
						</div>

						{/* Vote Button */}
						<button
							type="button"
							onClick={() => handleVote(track.id)}
							className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white font-bold py-2 md:py-3 px-4 md:px-6 rounded-full transition-all duration-200 flex items-center justify-center gap-2 text-sm md:text-lg"
						>
							<HeartSolid className="w-4 h-4 md:w-6 md:h-6" />
							<span className="hidden sm:inline">Choose This Song</span>
							<span className="sm:hidden">Choose</span>
						</button>
					</motion.div>
				))}
			</div>

			{/* Battle Stats */}
			<div className="bg-white/5 backdrop-blur-lg rounded-xl p-4">
				<div className="grid grid-cols-2 gap-4 text-center text-sm">
					<div>
						<p className="text-gray-400">&quot;{track1.name}&quot; Stats</p>
						<p className="text-white">
							{track1.wins}W - {track1.losses}L
							{track1.battles > 0 && (
								<span className="text-green-400 ml-1">
									({Math.round((track1.wins / track1.battles) * 100)}%)
								</span>
							)}
						</p>
					</div>
					<div>
						<p className="text-gray-400">&quot;{track2.name}&quot; Stats</p>
						<p className="text-white">
							{track2.wins}W - {track2.losses}L
							{track2.battles > 0 && (
								<span className="text-green-400 ml-1">
									({Math.round((track2.wins / track2.battles) * 100)}%)
								</span>
							)}
						</p>
					</div>
				</div>
			</div>

			{/* Keyboard Shortcuts Hint Bar - Desktop Only */}
			<div className="bg-white/5 backdrop-blur-lg rounded-xl p-3 mt-4 hidden md:block">
				<div className="text-center text-xs text-gray-300">
					<span className="font-semibold text-white">Quick Keys:</span>{' '}
					<kbd className="bg-white/20 px-1.5 py-0.5 rounded text-xs">A</kbd> /{' '}
					<kbd className="bg-white/20 px-1.5 py-0.5 rounded text-xs">D</kbd>{' '}
					play tracks •{' '}
					<kbd className="bg-white/20 px-1.5 py-0.5 rounded text-xs">Space</kbd>{' '}
					play/pause •{' '}
					<kbd className="bg-white/20 px-1.5 py-0.5 rounded text-xs">← →</kbd>{' '}
					choose winner •{' '}
					<kbd className="bg-white/20 px-1.5 py-0.5 rounded text-xs">/</kbd>{' '}
					help
				</div>
			</div>
		</div>
	);
}
