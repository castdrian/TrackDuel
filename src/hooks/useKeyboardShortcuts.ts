'use client';

import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
	key: string;
	description: string;
	action: () => void;
	context?: string;
	modifier?: 'ctrl' | 'shift' | 'alt';
}

export function useKeyboardShortcuts(
	shortcuts: KeyboardShortcut[],
	enabled = true
) {
	const handleKeyDown = useCallback(
		(event: KeyboardEvent) => {
			if (!enabled) return;

			// Don't trigger shortcuts when typing in inputs
			if (
				event.target instanceof HTMLInputElement ||
				event.target instanceof HTMLTextAreaElement
			) {
				return;
			}

			for (const shortcut of shortcuts) {
				let keyMatches = false;

				// Handle special keys
				if (shortcut.key === 'Space') {
					keyMatches = event.code === 'Space';
				} else if (shortcut.key === 'Enter') {
					keyMatches = event.key === 'Enter';
				} else if (shortcut.key === 'Escape') {
					keyMatches = event.key === 'Escape';
				} else if (shortcut.key === 'ArrowLeft') {
					keyMatches = event.key === 'ArrowLeft';
				} else if (shortcut.key === 'ArrowRight') {
					keyMatches = event.key === 'ArrowRight';
				} else if (shortcut.key === 'ArrowUp') {
					keyMatches = event.key === 'ArrowUp';
				} else if (shortcut.key === 'ArrowDown') {
					keyMatches = event.key === 'ArrowDown';
				} else {
					keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
				}

				if (keyMatches) {
					// Check modifiers
					const ctrlMatch =
						shortcut.modifier === 'ctrl'
							? event.ctrlKey || event.metaKey
							: !event.ctrlKey && !event.metaKey;
					const shiftMatch =
						shortcut.modifier === 'shift' ? event.shiftKey : !event.shiftKey;
					const altMatch =
						shortcut.modifier === 'alt' ? event.altKey : !event.altKey;

					if (ctrlMatch && shiftMatch && altMatch) {
						event.preventDefault();
						shortcut.action();
						break;
					}
				}
			}
		},
		[shortcuts, enabled]
	);

	useEffect(() => {
		if (enabled) {
			document.addEventListener('keydown', handleKeyDown);
			return () => document.removeEventListener('keydown', handleKeyDown);
		}
	}, [handleKeyDown, enabled]);
}
