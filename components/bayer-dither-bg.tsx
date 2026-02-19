'use client'

import { useRef, useEffect } from 'react'
import * as THREE from 'three'

const vertexSrc = /* glsl */`
void main() {
  gl_Position = vec4(position, 1.0);
}
`

const fragmentSrc = /* glsl */`
precision highp float;

uniform vec3  uColor;
uniform vec2  uResolution;
uniform float uTime;
uniform float uPixelSize;
uniform int   uShapeType;

const int MAX_CLICKS = 10;
uniform vec2  uClickPos[MAX_CLICKS];
uniform float uClickTimes[MAX_CLICKS];

out vec4 fragColor;

// --- Bayer ordered dithering ---
float Bayer2(vec2 a) {
  a = floor(a);
  return fract(a.x / 2. + a.y * a.y * .75);
}
#define Bayer4(a) (Bayer2(.5*(a))*0.25 + Bayer2(a))
#define Bayer8(a) (Bayer4(.5*(a))*0.25 + Bayer2(a))

// --- Value noise ---
float hash11(float n) { return fract(sin(n)*43758.5453); }

float vnoise(vec3 p) {
  vec3 ip = floor(p), fp = fract(p);
  float n000 = hash11(dot(ip+vec3(0,0,0), vec3(1,57,113)));
  float n100 = hash11(dot(ip+vec3(1,0,0), vec3(1,57,113)));
  float n010 = hash11(dot(ip+vec3(0,1,0), vec3(1,57,113)));
  float n110 = hash11(dot(ip+vec3(1,1,0), vec3(1,57,113)));
  float n001 = hash11(dot(ip+vec3(0,0,1), vec3(1,57,113)));
  float n101 = hash11(dot(ip+vec3(1,0,1), vec3(1,57,113)));
  float n011 = hash11(dot(ip+vec3(0,1,1), vec3(1,57,113)));
  float n111 = hash11(dot(ip+vec3(1,1,1), vec3(1,57,113)));
  vec3 w = fp*fp*fp*(fp*(fp*6.0-15.0)+10.0);
  float y0 = mix(mix(n000,n100,w.x), mix(n010,n110,w.x), w.y);
  float y1 = mix(mix(n001,n101,w.x), mix(n011,n111,w.x), w.y);
  return mix(y0, y1, w.z) * 2.0 - 1.0;
}

float fbm2(vec2 uv, float t) {
  vec3 p = vec3(uv * 4.0, t);
  float amp = 1., freq = 1., sum = 1.;
  for (int i = 0; i < 5; ++i) {
    sum  += amp * vnoise(p * freq);
    freq *= 1.25;
    amp  *= 1.0;
  }
  return sum * 0.5 + 0.5;
}

// --- Shape masks ---
float maskCircle(vec2 p, float cov) {
  float r = sqrt(cov) * .25;
  float d = length(p - 0.5) - r;
  float aa = 0.5 * fwidth(d);
  return cov * (1.0 - smoothstep(-aa, aa, d * 2.));
}
float maskDiamond(vec2 p, float cov) {
  float r = sqrt(cov) * 0.564;
  return step(abs(p.x-0.49)+abs(p.y-0.49), r);
}

void main() {
  float pixelSize  = uPixelSize;
  vec2  fragCoord  = gl_FragCoord.xy - uResolution * .5;
  float aspect     = uResolution.x / uResolution.y;

  vec2 pixelId  = floor(fragCoord / pixelSize);
  vec2 pixelUV  = fract(fragCoord / pixelSize);

  float cellPixelSize = 8. * pixelSize;
  vec2  cellId        = floor(fragCoord / cellPixelSize);
  vec2  cellCoord     = cellId * cellPixelSize;
  vec2  uv            = cellCoord / uResolution * vec2(aspect, 1.0);

  float feed = fbm2(uv, uTime * 0.05);
  feed = feed * 0.5 - 0.65;

  // Click ripples
  const float speed = 0.30;
  const float thickness = 0.10;
  for (int i = 0; i < MAX_CLICKS; ++i) {
    vec2 pos = uClickPos[i];
    if (pos.x < 0.0) continue;
    vec2 cuv = (((pos - uResolution*.5 - cellPixelSize*.5) / uResolution)) * vec2(aspect, 1.0);
    float t    = max(uTime - uClickTimes[i], 0.0);
    float r    = distance(uv, cuv);
    float ring = exp(-pow((r - speed*t) / thickness, 2.0));
    float att  = exp(-1.0*t) * exp(-10.0*r);
    feed = max(feed, ring * att);
  }

  float bayer = Bayer8(fragCoord / uPixelSize) - 0.5;
  float bw    = step(0.5, feed + bayer);

  float M;
  if (uShapeType == 1)      M = maskCircle(pixelUV, bw);
  else if (uShapeType == 3) M = maskDiamond(pixelUV, bw);
  else                       M = bw; // square (default)

  fragColor = vec4(uColor, M);
}
`

interface Props {
    color?: string
    pixelSize?: number
    shapeType?: 'square' | 'circle' | 'diamond'
    className?: string
}

const SHAPE_MAP = { square: 0, circle: 1, diamond: 3 } as const

export default function BayerDitherBg({
    color = '#2563EB',
    pixelSize = 4,
    shapeType = 'circle',
    className = '',
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const MAX_CLICKS = 10
        const canvas = document.createElement('canvas')
        canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;'
        container.appendChild(canvas)

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true })
        renderer.setClearColor(0x000000, 0)

        const threeColor = new THREE.Color(color)
        const uniforms = {
            uResolution: { value: new THREE.Vector2() },
            uTime:       { value: 0 },
            uColor:      { value: threeColor },
            uPixelSize:  { value: pixelSize },
            uShapeType:  { value: SHAPE_MAP[shapeType] },
            uClickPos:   { value: Array.from({ length: MAX_CLICKS }, () => new THREE.Vector2(-1, -1)) },
            uClickTimes: { value: new Float32Array(MAX_CLICKS) },
        }

        const material = new THREE.ShaderMaterial({
            vertexShader: vertexSrc,
            fragmentShader: fragmentSrc,
            uniforms,
            transparent: true,
            glslVersion: THREE.GLSL3,
        })

        const scene  = new THREE.Scene()
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
        scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material))

        let clickIx = 0
        const handleClick = (e: PointerEvent) => {
            const rect = canvas.getBoundingClientRect()
            const fx = (e.clientX - rect.left)  * (canvas.width  / rect.width)
            const fy = (rect.height - (e.clientY - rect.top)) * (canvas.height / rect.height)
            uniforms.uClickPos.value[clickIx].set(fx, fy)
            uniforms.uClickTimes.value[clickIx] = uniforms.uTime.value
            clickIx = (clickIx + 1) % MAX_CLICKS
        }

        const resize = () => {
            const w = container.clientWidth  || window.innerWidth
            const h = container.clientHeight || window.innerHeight
            renderer.setSize(w, h, false)
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
            uniforms.uResolution.value.set(
                w * Math.min(window.devicePixelRatio, 2),
                h * Math.min(window.devicePixelRatio, 2)
            )
        }

        window.addEventListener('resize', resize)
        container.addEventListener('pointerdown', handleClick)
        resize()

        const clock = new THREE.Clock()
        let rafId: number
        const animate = () => {
            uniforms.uTime.value = clock.getElapsedTime()
            renderer.render(scene, camera)
            rafId = requestAnimationFrame(animate)
        }
        rafId = requestAnimationFrame(animate)

        return () => {
            cancelAnimationFrame(rafId)
            window.removeEventListener('resize', resize)
            container.removeEventListener('pointerdown', handleClick)
            renderer.dispose()
            material.dispose()
            if (container.contains(canvas)) container.removeChild(canvas)
        }
    }, [])

    return (
        <div
            ref={containerRef}
            className={`absolute inset-0 overflow-hidden pointer-events-auto ${className}`}
        />
    )
}
