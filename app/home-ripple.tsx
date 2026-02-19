'use client'

import dynamic from 'next/dynamic'

const BayerDitherBg = dynamic(() => import('@/components/bayer-dither-bg'), { ssr: false })

export function HomeRipple() {
    return (
        <BayerDitherBg
            color="#3B82F6"
            pixelSize={4}
            shapeType="circle"
        />
    )
}
