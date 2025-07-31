'use client';

import {
	ArrowLeftIcon,
	CameraIcon,
	ClipboardDocumentIcon,
	PlayIcon,
	TrophyIcon,
} from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAppStore } from '@/stores/useAppStore';
import { Marquee } from './Marquee';

export function Results() {
	const [showShareModal, setShowShareModal] = useState(false);
	const [isGeneratingScreenshot, setIsGeneratingScreenshot] = useState(false);
	const {
		currentPlaylist,
		calculateRankings,
		setCurrentPlaylist,
		generateNextBattle,
		setCurrentBattle,
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
			.map((track, index) => `${index + 1}. ${track.name} - ${track.artist}`)
			.join('\n');
	};

	const generateScreenshot = async () => {
		setIsGeneratingScreenshot(true);
		try {
			// Helper function for rounded rectangles
			const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
				ctx.beginPath();
				ctx.moveTo(x + radius, y);
				ctx.lineTo(x + width - radius, y);
				ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
				ctx.lineTo(x + width, y + height - radius);
				ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
				ctx.lineTo(x + radius, y + height);
				ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
				ctx.lineTo(x, y + radius);
				ctx.quadraticCurveTo(x, y, x + radius, y);
				ctx.closePath();
			};

			// Helper function to load images
			const loadImage = (src: string): Promise<HTMLImageElement> => {
				return new Promise((resolve, reject) => {
					const img = document.createElement('img') as HTMLImageElement;
					img.crossOrigin = 'anonymous';
					img.onload = () => resolve(img);
					img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
					img.src = src;
				});
			};

			// Create canvas directly instead of using html2canvas
			const canvas = document.createElement('canvas');
			canvas.width = 1920;
			canvas.height = 1080;
			const ctx = canvas.getContext('2d');
			
			if (!ctx) {
				throw new Error('Could not get canvas context');
			}

			// Fill background with gradient
			const bgGradient = ctx.createLinearGradient(0, 0, 1920, 1080);
			bgGradient.addColorStop(0, '#581c87');
			bgGradient.addColorStop(0.5, '#1e3a8a');
			bgGradient.addColorStop(1, '#312e81');
			ctx.fillStyle = bgGradient;
			ctx.fillRect(0, 0, 1920, 1080);

			// Set font
			ctx.fillStyle = '#ffffff';
			ctx.textAlign = 'center';

			// Draw trophy emoji (simplified)
			ctx.font = '80px Arial';
			ctx.fillText('🏆', 960, 100);

			// Draw header
			ctx.font = 'bold 72px Arial';
			ctx.fillText(currentPlaylist.name.substring(0, 30), 960, 180);

			ctx.font = '40px Arial';
			ctx.fillStyle = '#d1d5db';
			ctx.fillText(`Top ${Math.min(10, rankings.length)} Rankings`, 960, 230);

			ctx.font = '30px Arial';
			ctx.fillStyle = '#9ca3af';
			ctx.fillText(`Based on ${totalBattles} battles`, 960, 270);

			// Draw rankings
			const top10 = rankings.slice(0, 10);
			const cols = top10.length <= 5 ? 1 : 2;
			const itemWidth = cols === 1 ? 1600 : 750;
			const itemHeight = 120;
			const startY = 350;
			const spacing = 140;

			// Pre-load album images
			const albumImages: { [key: string]: HTMLImageElement } = {};
			try {
				const imagePromises = top10.slice(0, 8).map(async (track) => {
					if (track.image_url) {
						try {
							const img = await loadImage(track.image_url);
							albumImages[track.id] = img;
						} catch {
							console.log(`Failed to load image for ${track.name}`);
						}
					}
				});
				await Promise.allSettled(imagePromises);
			} catch {
				console.log('Some album images failed to load, using fallbacks');
			}

			top10.slice(0, 8).forEach((track, index) => { // Limit to 8 to fit
				const col = index % cols;
				const row = Math.floor(index / cols);
				const x = cols === 1 ? 160 : (col === 0 ? 160 : 1010);
				const y = startY + (row * spacing);

				// Add subtle shadow effect
				ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
				roundRect(ctx, x + 4, y + 4, itemWidth, itemHeight, 24);
				ctx.fill();

				// Draw rounded card background
				ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
				roundRect(ctx, x, y, itemWidth, itemHeight, 24);
				ctx.fill();

				// Draw border for top 3 with rounded corners
				if (index === 0) {
					ctx.strokeStyle = '#fbbf24';
					ctx.lineWidth = 4;
					roundRect(ctx, x, y, itemWidth, itemHeight, 24);
					ctx.stroke();
				} else if (index === 1) {
					ctx.strokeStyle = '#d1d5db';
					ctx.lineWidth = 2;
					roundRect(ctx, x, y, itemWidth, itemHeight, 24);
					ctx.stroke();
				} else if (index === 2) {
					ctx.strokeStyle = '#fb923c';
					ctx.lineWidth = 2;
					roundRect(ctx, x, y, itemWidth, itemHeight, 24);
					ctx.stroke();
				}

				// Draw rank
				ctx.fillStyle = '#ffffff';
				ctx.font = 'bold 60px Arial';
				ctx.textAlign = 'center';
				const rankText = index < 3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`;
				ctx.fillText(rankText, x + 80, y + 75);

				// Draw album art
				const albumX = x + 140;
				const albumY = y + 12;
				const albumSize = 96;
				
				if (albumImages[track.id]) {
					// Draw the actual album image
					ctx.save();
					roundRect(ctx, albumX, albumY, albumSize, albumSize, 12);
					ctx.clip();
					ctx.drawImage(albumImages[track.id], albumX, albumY, albumSize, albumSize);
					ctx.restore();
				} else {
					// Draw rounded album art placeholder with gradient
					const gradient = ctx.createLinearGradient(albumX, albumY, albumX + albumSize, albumY + albumSize);
					gradient.addColorStop(0, '#374151');
					gradient.addColorStop(1, '#1f2937');
					ctx.fillStyle = gradient;
					roundRect(ctx, albumX, albumY, albumSize, albumSize, 12);
					ctx.fill();
					
					// Add music note emoji
					ctx.fillStyle = '#ffffff';
					ctx.font = '40px Arial';
					ctx.textAlign = 'center';
					ctx.fillText('🎵', albumX + albumSize/2, albumY + albumSize/2 + 10);
				}

				// Draw track info
				ctx.fillStyle = '#ffffff';
				ctx.font = 'bold 30px Arial';
				ctx.textAlign = 'left';
				const trackName = track.name.substring(0, 20) + (track.name.length > 20 ? '...' : '');
				ctx.fillText(trackName, x + 260, y + 50);

				ctx.fillStyle = '#d1d5db';
				ctx.font = '24px Arial';
				const artistName = track.artist.substring(0, 20) + (track.artist.length > 20 ? '...' : '');
				ctx.fillText(artistName, x + 260, y + 85);

				// Draw stats
				ctx.fillStyle = '#ffffff';
				ctx.font = 'bold 40px Arial';
				ctx.textAlign = 'right';
				ctx.fillText(`${getWinPercentage(track)}%`, x + itemWidth - 40, y + 50);

				ctx.fillStyle = '#9ca3af';
				ctx.font = '20px Arial';
				ctx.fillText(`${track.wins}W - ${track.losses}L`, x + itemWidth - 40, y + 85);
			});

			// Convert canvas to blob and download
			canvas.toBlob(blob => {
				if (!blob) {
					toast.error('Failed to generate image');
					return;
				}

				// Create download link
				const url = URL.createObjectURL(blob);
				const link = document.createElement('a');
				link.href = url;
				link.download = `${currentPlaylist.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_rankings.png`;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				URL.revokeObjectURL(url);

				toast.success('Screenshot saved to Downloads!');
			}, 'image/png', 0.95);
		} catch (error) {
			console.error('Failed to generate screenshot:', error);
			toast.error('Failed to generate screenshot. Please try again.');
		} finally {
			setIsGeneratingScreenshot(false);
		}
	};

	const copyToClipboard = async () => {
		try {
			const shareableText = `My TrackDuel Rankings for "${currentPlaylist.name}":\n\n${generateShareableList()}`;

			// Check if clipboard API is available
			if (navigator.clipboard?.writeText) {
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
			case 1:
				return '🥇';
			case 2:
				return '🥈';
			case 3:
				return '🥉';
			default:
				return `#${rank}`;
		}
	};

	const getWinPercentage = (track: (typeof rankings)[0]) => {
		if (track.battles === 0) return 0;
		return Math.round((track.wins / track.battles) * 100);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
				<div className="flex items-center justify-between mb-4">
					<button
						type="button"
						onClick={backToPlaylists}
						className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
					>
						<ArrowLeftIcon className="w-5 h-5" />
						Back to Playlists
					</button>

					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							onClick={copyToClipboard}
							className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
						>
							<ClipboardDocumentIcon className="w-4 h-4" />
							<span className="hidden sm:inline">Copy Rankings</span>
							<span className="sm:hidden">Copy</span>
						</button>

						<button
							type="button"
							onClick={generateScreenshot}
							disabled={isGeneratingScreenshot}
							className="bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
						>
							<CameraIcon className="w-4 h-4" />
							<span className="hidden sm:inline">
								{isGeneratingScreenshot ? 'Generating...' : 'Share Image'}
							</span>
							<span className="sm:hidden">
								{isGeneratingScreenshot ? '...' : 'Share'}
							</span>
						</button>

						{!isComplete && (
							<button
								type="button"
								onClick={continueRanking}
								className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm"
							>
								<PlayIcon className="w-4 h-4" />
								<span className="hidden sm:inline">Continue Ranking</span>
								<span className="sm:hidden">Continue</span>
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
								{typeof getRankIcon(index + 1) === 'string' &&
								getRankIcon(index + 1).includes('#') ? (
									<span className="text-gray-300">
										{getRankIcon(index + 1)}
									</span>
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
								<div className="mb-1">
									<Marquee
										text={track.name}
										className="font-semibold text-white"
										speed={40}
									/>
								</div>
								<div>
									<Marquee
										text={track.artist}
										className="text-sm text-gray-300"
										speed={35}
									/>
								</div>
							</div>{' '}
							{/* Stats */}
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
				<h3 className="text-lg font-semibold text-white mb-3">
					Battle Summary
				</h3>
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
					<div>
						<div className="text-2xl font-bold text-green-400">
							{currentPlaylist.tracks.length}
						</div>
						<div className="text-sm text-gray-400">Total Songs</div>
					</div>
					<div>
						<div className="text-2xl font-bold text-blue-400">
							{totalBattles}
						</div>
						<div className="text-sm text-gray-400">Battles Fought</div>
					</div>
					<div>
						<div className="text-2xl font-bold text-yellow-400">
							{Math.round(
								(totalBattles /
									((currentPlaylist.tracks.length *
										(currentPlaylist.tracks.length - 1)) /
										2)) *
									100
							)}
							%
						</div>
						<div className="text-sm text-gray-400">Complete</div>
					</div>
					<div>
						<div className="text-2xl font-bold text-purple-400">
							{rankings[0]?.name.length > 15
								? `${rankings[0]?.name.substring(0, 15)}...`
								: rankings[0]?.name}
						</div>
						<div className="text-sm text-gray-400">Champion</div>
					</div>
				</div>
			</div>

			{/* Share Modal */}
			{showShareModal && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
					<div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-md w-full">
						<h3 className="text-xl font-bold text-white mb-4">
							Share Your Rankings
						</h3>
						<textarea
							value={generateShareableList()}
							readOnly
							className="w-full h-40 bg-white/10 border border-white/20 rounded-lg p-3 text-white text-sm resize-none"
						/>
						<div className="flex gap-3 mt-4">
							<button
								type="button"
								onClick={copyToClipboard}
								className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition-colors"
							>
								Copy to Clipboard
							</button>
							<button
								type="button"
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
