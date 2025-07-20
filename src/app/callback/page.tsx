'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppStore } from '@/stores/useAppStore';
import { spotifyApi } from '@/lib/spotify';
import { MusicalNoteIcon } from '@heroicons/react/24/solid';

export default function CallbackPage() {
	const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
	const [error, setError] = useState<string>('');
	const router = useRouter();
	const searchParams = useSearchParams();
	const { setSpotifyToken } = useAppStore();

	useEffect(() => {
		const handleCallback = async () => {
			try {
				const code = searchParams.get('code');
				const error = searchParams.get('error');

				if (error) {
					throw new Error(`Spotify authorization failed: ${error}`);
				}

				if (!code) {
					throw new Error('No authorization code received');
				}

				// Exchange code for token
				const token = await spotifyApi.exchangeCodeForToken(code);
				setSpotifyToken(token);
				setStatus('success');

				// Redirect to home page after a short delay
				setTimeout(() => {
					router.push('/');
				}, 2000);

			} catch (err) {
				console.error('Callback error:', err);
				setError(err instanceof Error ? err.message : 'Unknown error occurred');
				setStatus('error');

				// Redirect to home page after error
				setTimeout(() => {
					router.push('/');
				}, 3000);
			}
		};

		handleCallback();
	}, [searchParams, setSpotifyToken, router]);

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
			<div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center max-w-md w-full">
				<MusicalNoteIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />

				{status === 'loading' && (
					<>
						<div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-4" />
						<h2 className="text-2xl font-bold text-white mb-2">
							Connecting to Spotify...
						</h2>
						<p className="text-gray-300">
							Please wait while we set up your account.
						</p>
					</>
				)}

				{status === 'success' && (
					<>
						<div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
							<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
							</svg>
						</div>
						<h2 className="text-2xl font-bold text-white mb-2">
							Successfully Connected!
						</h2>
						<p className="text-gray-300">
							Redirecting you to TrackDuel...
						</p>
					</>
				)}

				{status === 'error' && (
					<>
						<div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
							<svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</div>
						<h2 className="text-2xl font-bold text-white mb-2">
							Connection Failed
						</h2>
						<p className="text-gray-300 mb-4">
							{error}
						</p>
						<p className="text-sm text-gray-400">
							Redirecting you back to try again...
						</p>
					</>
				)}
			</div>
		</div>
	);
}
