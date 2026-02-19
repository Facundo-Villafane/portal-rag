'use client'

import dynamic from 'next/dynamic'

const BayerDitherBg = dynamic(() => import('@/components/bayer-dither-bg'), { ssr: false })

export function HomeRipple() {
    return (
        <BayerDitherBg
            color="#2563EB"
            pixelSize={4}
            shapeType="circle"
        />
    )
}
