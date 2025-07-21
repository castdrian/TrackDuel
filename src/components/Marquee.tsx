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
				const containerWidth = containerRef.current.offsetWidth;
				const textWidth = textRef.current.scrollWidth;

				if (textWidth > containerWidth) {
					setShouldScroll(true);
					const duration = textWidth / speed;
					setAnimationDuration(duration);
				} else {
					setShouldScroll(false);
				}
			}
		};

		// Check on mount and text change
		checkOverflow();

		// Check on resize
		const resizeObserver = new ResizeObserver(checkOverflow);
		if (containerRef.current) {
			resizeObserver.observe(containerRef.current);
		}

		return () => {
			resizeObserver.disconnect();
		};
	}, [speed]);

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
