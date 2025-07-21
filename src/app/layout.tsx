import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: 'TrackDuel - Song Battle App',
	description:
		'Battle your favorite songs head-to-head and create ranked playlists based on your preferences',
	appleWebApp: {
		capable: true,
		statusBarStyle: 'black-translucent',
		title: 'TrackDuel',
	},
	other: {
		'mobile-web-app-capable': 'yes',
		'apple-mobile-web-app-capable': 'yes',
		'apple-mobile-web-app-status-bar-style': 'black-translucent',
		'msapplication-TileColor': '#1e1b4b',
	},
};

export const viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
	themeColor: '#1e1b4b', // Dark purple to match app background
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning className="bg-purple-900">
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 min-h-screen`}
			>
				{children}
			</body>
		</html>
	);
}
