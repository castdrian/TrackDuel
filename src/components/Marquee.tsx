'use client';

import { useEffect, useRef, useState } from 'react';

interface MarqueeProps {
	text: string;
	className?: string;
	speed?: number; // pixels per second
}

export function Marquee({ text, className = '', speed = 50 }: MarqueeProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const textRef = useRef<HTMLSpanElement>(null);
	const [shouldScroll, setShouldScroll] = useState(false);
	const [animationDuration, setAnimationDuration] = useState(0);

	useEffect(() => {
		const checkOverflow = () => {
			if (containerRef.current && textRef.current) {
				// Force a reflow to ensure accurate measurements
				containerRef.current.offsetHeight;

				const containerWidth = containerRef.current.offsetWidth;
				const textWidth = textRef.current.scrollWidth;

				// Add a small buffer to prevent unnecessary scrolling for very close widths
				const buffer = 5;

				if (textWidth > containerWidth + buffer) {
					setShouldScroll(true);
					// Calculate duration based on total distance (text width + gap)
					const totalDistance = textWidth + 32; // 32px for pr-8 gap
					const duration = totalDistance / speed;
					setAnimationDuration(duration);
				} else {
					setShouldScroll(false);
				}
			}
		};

		// Use a timeout to ensure the element is fully rendered
		const timeoutId = setTimeout(checkOverflow, 0);

		// Check on resize
		const resizeObserver = new ResizeObserver(() => {
			// Debounce resize checks
			setTimeout(checkOverflow, 50);
		});

		if (containerRef.current) {
			resizeObserver.observe(containerRef.current);
		}

		return () => {
			clearTimeout(timeoutId);
			resizeObserver.disconnect();
		};
	}, [speed]);

	// Re-check overflow when text changes
	useEffect(() => {
		if (containerRef.current && textRef.current) {
			// Small delay to ensure DOM has updated
			const timeoutId = setTimeout(() => {
				if (containerRef.current && textRef.current) {
					const containerWidth = containerRef.current.offsetWidth;
					const textWidth = textRef.current.scrollWidth;
					const buffer = 5;

					if (textWidth > containerWidth + buffer) {
						setShouldScroll(true);
						const totalDistance = textWidth + 32;
						const duration = totalDistance / speed;
						setAnimationDuration(duration);
					} else {
						setShouldScroll(false);
					}
				}
			}, 10);

			return () => clearTimeout(timeoutId);
		}
	}, [speed]); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<div
			ref={containerRef}
			className={`relative overflow-hidden whitespace-nowrap ${className}`}
		>
			{shouldScroll ? (
				<div
					className="flex animate-marquee"
					style={{
						animationDuration: `${animationDuration}s`,
						animationTimingFunction: 'linear',
						animationIterationCount: 'infinite',
						animationFillMode: 'forwards',
					}}
				>
					<span ref={textRef} className="flex-shrink-0 pr-8">
						{text}
					</span>
					<span className="flex-shrink-0 pr-8">{text}</span>
				</div>
			) : (
				<span ref={textRef} className="inline-block">
					{text}
				</span>
			)}
		</div>
	);
}
