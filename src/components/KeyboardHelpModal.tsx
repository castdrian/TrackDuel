'use client';

import { XMarkIcon } from '@heroicons/react/24/solid';
import { AnimatePresence, motion } from 'framer-motion';

interface KeyboardHelpProps {
	isOpen: boolean;
	onClose: () => void;
}

export function KeyboardHelpModal({ isOpen, onClose }: KeyboardHelpProps) {
	// Define all shortcuts here instead of relying on passed props
	const allShortcuts = [
		// Global
		{ key: '/', description: 'Show keyboard shortcuts', context: 'Global' },
		{ key: 'Escape', description: 'Close modals/Go back', context: 'Global' },
		{ key: 'h', description: 'Go to home/playlists', context: 'Global' },

		// Battle
		{ key: '←', description: 'Choose left track', context: 'Battle' },
		{ key: '→', description: 'Choose right track', context: 'Battle' },
		{
			key: 'Space',
			description: 'Play/pause current track',
			context: 'Battle',
		},
		{ key: 'a', description: 'Play left track', context: 'Battle' },
		{ key: 'd', description: 'Play right track', context: 'Battle' },
		{ key: 's', description: 'Stop playing', context: 'Battle' },
		{ key: 'q', description: 'Toggle autoplay', context: 'Battle' },

		// Playlist
		{ key: 'n', description: 'Focus playlist name input', context: 'Playlist' },
		{ key: 'f', description: 'Focus search input', context: 'Playlist' },
		{
			key: 'Enter',
			description: 'Create playlist (when ready)',
			context: 'Playlist',
		},
		{ key: 'Escape', description: 'Cancel editing', context: 'Playlist' },

		// Results
		{ key: 'c', description: 'Continue battle', context: 'Results' },
		{ key: 's', description: 'Take screenshot', context: 'Results' },
		{ key: 't', description: 'Copy rankings as text', context: 'Results' },
		{ key: 'b', description: 'Back to playlists', context: 'Results' },
	];

	const formatKey = (key: string, modifier?: string) => {
		const modifierSymbol =
			modifier === 'ctrl'
				? '⌘'
				: modifier === 'shift'
					? '⇧'
					: modifier === 'alt'
						? '⌥'
						: '';
		const keyDisplay =
			key === 'Space'
				? 'Space'
				: key === 'Enter'
					? '↵'
					: key === 'Escape'
						? 'Esc'
						: key.toUpperCase();

		return `${modifierSymbol}${keyDisplay}`;
	};

	const groupedShortcuts = allShortcuts.reduce(
		(groups, shortcut) => {
			const context = shortcut.context || 'General';
			if (!groups[context]) {
				groups[context] = [];
			}
			groups[context].push(shortcut);
			return groups;
		},
		{} as Record<string, typeof allShortcuts>
	);

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
					onClick={onClose}
				>
					<motion.div
						initial={{ scale: 0.9, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.9, opacity: 0 }}
						className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
						onClick={e => e.stopPropagation()}
					>
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-2xl font-bold text-white flex items-center gap-2">
								⌨️ Keyboard Shortcuts
							</h2>
							<button
								type="button"
								onClick={onClose}
								className="p-2 hover:bg-white/10 rounded-lg transition-colors"
							>
								<XMarkIcon className="w-6 h-6 text-white" />
							</button>
						</div>

						<div className="space-y-6">
							{Object.entries(groupedShortcuts).map(
								([context, contextShortcuts]) => (
									<div key={context}>
										<h3 className="text-lg font-semibold text-white mb-3 border-b border-white/20 pb-1">
											{context}
										</h3>
										<div className="space-y-2">
											{contextShortcuts.map((shortcut, index) => (
												<div
													key={`${context}-${shortcut.key}-${index}`}
													className="flex items-center justify-between py-2"
												>
													<span className="text-gray-300">
														{shortcut.description}
													</span>
													<kbd className="px-3 py-1 bg-white/20 text-white rounded-lg font-mono text-sm">
														{formatKey(shortcut.key)}
													</kbd>
												</div>
											))}
										</div>
									</div>
								)
							)}
						</div>

						<div className="mt-6 pt-4 border-t border-white/20 text-center">
							<p className="text-gray-400 text-sm">
								Press{' '}
								<kbd className="px-2 py-1 bg-white/20 text-white rounded text-xs">
									/
								</kbd>{' '}
								anytime to open this help
							</p>
						</div>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
