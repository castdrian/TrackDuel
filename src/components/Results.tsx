'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAppStore } from '@/stores/useAppStore';
import {
	TrophyIcon,
	ArrowLeftIcon,
	ClipboardDocumentIcon,
	PlayIcon
} from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export function Results() {
	const [showShareModal, setShowShareModal] = useState(false);
	const {
		currentPlaylist,
		calculateRankings,
		setCurrentPlaylist,
		generateNextBattle,
		setCurrentBattle
	} = useAppStore();

	const continueBattle = () => {
		const nextBattle = generateNextBattle();
		if (nextBattle) {
			setCurrentBattle(nextBattle);
			toast.success('Battle continues!');
		} else {
			toast('All battles are complete!', { icon: '✅' });
		}
	};

	if (!currentPlaylist) {
		return null;
	}

	const rankings = calculateRankings();
	const totalBattles = currentPlaylist.battles.length;
	const isComplete = currentPlaylist.isComplete;

	const generateShareableList = () => {
		return rankings
			.map((track, index) =>
				`${index + 1}. ${track.name} - ${track.artist}`
			)
			.join('\n');
	};

	const copyToClipboard = async () => {
		try {
			const shareableText = `My TrackDuel Rankings for "${currentPlaylist.name}":\n\n${generateShareableList()}\n\nCreated with TrackDuel 🎵`;

			// Check if clipboard API is available
			if (navigator.clipboard && navigator.clipboard.writeText) {
				await navigator.clipboard.writeText(shareableText);
				toast.success('Rankings copied to clipboard!');
			} else {
				// Fallback for browsers that don't support clipboard API
				const textArea = document.createElement('textarea');
				textArea.value = shareableText;
				textArea.style.position = 'fixed';
				textArea.style.left = '-999999px';
				textArea.style.top = '-999999px';
				document.body.appendChild(textArea);
				textArea.focus();
				textArea.select();

				try {
					document.execCommand('copy');
					toast.success('Rankings copied to clipboard!');
				} catch {
					toast.error('Please manually copy the text');
				}

				document.body.removeChild(textArea);
			}
		} catch (error) {
			console.error('Failed to copy:', error);
			toast.error('Failed to copy to clipboard');
		}
	};

	const continueRanking = () => {
		continueBattle();
	};

	const backToPlaylists = () => {
		setCurrentPlaylist(null);
	};

	const getRankIcon = (rank: number) => {
		switch (rank) {
			case 1: return '🥇';
			case 2: return '🥈';
			case 3: return '🥉';
			default: return `#${rank}`;
		}
	};

	const getWinPercentage = (track: typeof rankings[0]) => {
		if (track.battles === 0) return 0;
		return Math.round((track.wins / track.battles) * 100);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
				<div className="flex items-center justify-between mb-4">
					<button
						onClick={backToPlaylists}
						className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
					>
						<ArrowLeftIcon className="w-5 h-5" />
						Back to Playlists
					</button>

					<div className="flex gap-2">
						<button
							onClick={copyToClipboard}
							className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
						>
							<ClipboardDocumentIcon className="w-4 h-4" />
							Copy Rankings
						</button>

						{!isComplete && (
							<button
								onClick={continueRanking}
								className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
							>
								<PlayIcon className="w-4 h-4" />
								Continue Ranking
							</button>
						)}
					</div>
				</div>

				<div className="text-center">
					<TrophyIcon className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
					<h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
						{currentPlaylist.name} Rankings
					</h1>
					<p className="text-gray-300">
						Based on {totalBattles} battles
						{isComplete ? (
							<span className="text-green-400 ml-2">✓ Complete</span>
						) : (
							<span className="text-yellow-400 ml-2">🔄 In Progress</span>
						)}
					</p>
				</div>
			</div>

			{/* Rankings */}
			<div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
				<div className="space-y-3">
					{rankings.map((track, index) => (
						<motion.div
							key={track.id}
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: index * 0.05 }}
							className={`
                bg-white/10 rounded-lg p-4 flex items-center gap-4
                ${index === 0 ? 'ring-2 ring-yellow-400 bg-yellow-400/10' : ''}
                ${index === 1 ? 'ring-1 ring-gray-300 bg-gray-300/5' : ''}
                ${index === 2 ? 'ring-1 ring-orange-400 bg-orange-400/5' : ''}
              `}
						>
							{/* Rank */}
							<div className="text-2xl font-bold min-w-[3rem] text-center">
								{typeof getRankIcon(index + 1) === 'string' && getRankIcon(index + 1).includes('#') ? (
									<span className="text-gray-300">{getRankIcon(index + 1)}</span>
								) : (
									<span>{getRankIcon(index + 1)}</span>
								)}
							</div>

							{/* Album Art */}
							<Image
								src={track.image_url || '/placeholder-album.svg'}
								alt={track.album}
								width={48}
								height={48}
								className="w-12 h-12 rounded object-cover"
							/>

							{/* Track Info */}
							<div className="flex-1 min-w-0">
								<h3 className="font-semibold text-white truncate">
									{track.name}
								</h3>
								<p className="text-sm text-gray-300 truncate">
									{track.artist}
								</p>
							</div>							{/* Stats */}
							<div className="text-right min-w-[5rem]">
								<div className="text-white font-semibold">
									{getWinPercentage(track)}%
								</div>
								<div className="text-xs text-gray-400">
									{track.wins}W - {track.losses}L
								</div>
							</div>
						</motion.div>
					))}
				</div>
			</div>

			{/* Battle Summary */}
			<div className="bg-white/5 backdrop-blur-lg rounded-xl p-4">
				<h3 className="text-lg font-semibold text-white mb-3">Battle Summary</h3>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
					<div>
						<div className="text-2xl font-bold text-green-400">{currentPlaylist.tracks.length}</div>
						<div className="text-sm text-gray-400">Total Songs</div>
					</div>
					<div>
						<div className="text-2xl font-bold text-blue-400">{totalBattles}</div>
						<div className="text-sm text-gray-400">Battles Fought</div>
					</div>
					<div>
						<div className="text-2xl font-bold text-yellow-400">
							{Math.round((totalBattles / ((currentPlaylist.tracks.length * (currentPlaylist.tracks.length - 1)) / 2)) * 100)}%
						</div>
						<div className="text-sm text-gray-400">Complete</div>
					</div>
					<div>
						<div className="text-2xl font-bold text-purple-400">
							{rankings[0]?.name.length > 15 ?
								rankings[0]?.name.substring(0, 15) + '...' :
								rankings[0]?.name
							}
						</div>
						<div className="text-sm text-gray-400">Champion</div>
					</div>
				</div>
			</div>

			{/* Share Modal */}
			{showShareModal && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
					<div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-md w-full">
						<h3 className="text-xl font-bold text-white mb-4">Share Your Rankings</h3>
						<textarea
							value={generateShareableList()}
							readOnly
							className="w-full h-40 bg-white/10 border border-white/20 rounded-lg p-3 text-white text-sm resize-none"
						/>
						<div className="flex gap-3 mt-4">
							<button
								onClick={copyToClipboard}
								className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors"
							>
								Copy to Clipboard
							</button>
							<button
								onClick={() => setShowShareModal(false)}
								className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
							>
								Close
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
