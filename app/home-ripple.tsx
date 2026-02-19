'use client'

import dynamic from 'next/dynamic'

const RippleGrid = dynamic(() => import('@/components/ripple-grid'), { ssr: false })

export function HomeRipple() {
    return (
        <div className="absolute inset-0 pointer-events-none">
            <RippleGrid
                enableRainbow={false}
                gridColor="#22d3ee"
                rippleIntensity={0.04}
                gridSize={10}
                gridThickness={18}
                fadeDistance={1.6}
                vignetteStrength={2.5}
                glowIntensity={0.08}
                opacity={0.35}
                mouseInteraction={true}
                mouseInteractionRadius={1.2}
            />
        </div>
    )
}
