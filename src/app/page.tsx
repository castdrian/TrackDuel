'use client';

import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { BattleArena } from '@/components/BattleArena';
import { PlaylistCreator } from '@/components/PlaylistCreator';
import { Results } from '@/components/Results';
import { KeyboardHelpModal } from '@/components/KeyboardHelpModal';
import { Header } from '@/components/Header';
import { useAppStore } from '@/stores/useAppStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export default function Home() {
	const { currentPlaylist, currentBattle, isHydrated, setHydrated, setCurrentPlaylist } =
		useAppStore();
	const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

	useEffect(() => {
		setHydrated();
	}, [setHydrated]);

	// Global keyboard shortcuts
	const globalShortcuts = [
		{
			key: '/',
			description: 'Show keyboard shortcuts',
			action: () => setShowKeyboardHelp(true),
			context: 'Global'
		},
		{
			key: 'Escape',
			description: 'Close modals/Go back',
			action: () => {
				if (showKeyboardHelp) {
					setShowKeyboardHelp(false);
				} else if (currentPlaylist && !currentBattle) {
					setCurrentPlaylist(null);
				}
			},
			context: 'Global'
		},
		{
			key: 'h',
			description: 'Go to home/playlists',
			action: () => setCurrentPlaylist(null),
			context: 'Navigation'
		}
	];

	useKeyboardShortcuts(globalShortcuts, isHydrated);

	// Prevent hydration issues by not rendering until hydrated
	if (!isHydrated) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center pt-16 md:pt-20">
				<div className="text-white text-center">
					<div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4" />
					<p>Loading TrackDuel...</p>
				</div>
			</div>
		);
	}

	const renderContent = () => {
		if (!currentPlaylist) {
			return <PlaylistCreator />;
		}

		if (currentBattle) {
			return <BattleArena />;
		}

		return <Results />;
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 pt-16 md:pt-20">
			{/* Fixed Header */}
			<Header />
			
			<div className="container mx-auto px-4 py-8">
				{!currentPlaylist && (
					<header className="text-center mb-8">
						<h1 className="text-4xl md:text-6xl font-bold text-white mb-2">
							Track<span className="text-green-400">Duel</span>
						</h1>
						<p className="text-gray-300 text-lg">
							Battle your favorite songs to create the ultimate ranked playlist
						</p>
					</header>
				)}

				<main className="max-w-4xl mx-auto">{renderContent()}</main>
			</div>
			
			<KeyboardHelpModal 
				isOpen={showKeyboardHelp}
				onClose={() => setShowKeyboardHelp(false)}
			/>
			
			{/* Floating Help Button - Desktop Only */}
			<button
				type="button"
				onClick={() => setShowKeyboardHelp(true)}
				className="fixed bottom-6 right-6 z-50 bg-purple-600 hover:bg-purple-500 text-white px-4 py-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 hidden md:flex items-center gap-2"
				title="Keyboard Shortcuts (Press /)"
				aria-label="Show keyboard shortcuts"
			>
				<svg 
					className="w-5 h-5" 
					fill="currentColor" 
					viewBox="0 0 24 24"
					aria-hidden="true"
				>
					<title>Keyboard</title>
					<path d="M20 5H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z"/>
				</svg>
				<span className="hidden lg:inline text-sm font-medium">Controls</span>
			</button>
			
			<Toaster position="top-center" />
		</div>
	);
}
