'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { PlaylistCreator } from '@/components/PlaylistCreator';
import { BattleArena } from '@/components/BattleArena';
import { Results } from '@/components/Results';
import { Toaster } from 'react-hot-toast';

export default function Home() {
	const { currentPlaylist, currentBattle, isHydrated, setHydrated } = useAppStore();

	useEffect(() => {
		setHydrated();
	}, [setHydrated]);

	// Prevent hydration issues by not rendering until hydrated
	if (!isHydrated) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
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
		<div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
			<div className="container mx-auto px-4 py-8">
				<header className="text-center mb-8">
					<h1 className="text-4xl md:text-6xl font-bold text-white mb-2">
						Track<span className="text-green-400">Duel</span>
					</h1>
					<p className="text-gray-300 text-lg">
						Battle your favorite songs to create the ultimate ranked playlist
					</p>
				</header>

				<main className="max-w-4xl mx-auto">
					{renderContent()}
				</main>
			</div>
			<Toaster position="top-center" />
		</div>
	);
}
