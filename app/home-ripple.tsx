'use client'

import dynamic from 'next/dynamic'

const RippleGrid = dynamic(() => import('@/components/ripple-grid'), { ssr: false })

export function HomeRipple() {
    return (
        <div className="absolute inset-0 pointer-events-none">
            <RippleGrid
                enableRainbow={false}
                gridColor="#2563EB"
                rippleIntensity={0.02}
                gridSize={24}
                gridThickness={15}
                fadeDistance={1.5}
                vignetteStrength={2}
                glowIntensity={0.55}
                opacity={1}
                gridRotation={0}
                mouseInteraction={true}
                mouseInteractionRadius={0.8}
            />
        </div>
    )
}
