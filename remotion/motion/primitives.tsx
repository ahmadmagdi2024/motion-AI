import React from 'react';
import { AbsoluteFill, Img, Video, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Asset, Scene, VideoProject } from '../../lib/schema';
import { mediaSrc } from '../helpers';

const clamp = { extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const };
export const progress = (frame: number, from: number, to: number) => interpolate(frame, [from, to], [0, 1], clamp);
export const smooth = (frame: number, fps: number, delay = 0) =>
  spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 110, mass: 0.75 } });
export const elastic = (frame: number, fps: number, delay = 0) =>
  spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 150, mass: 0.6 } });
export const sceneOpacity = (frame: number, duration: number) =>
  interpolate(frame, [0, 10, Math.max(11, duration - 10), duration], [0, 1, 1, 0], clamp);

export function cameraTransform(scene: Scene, frame: number) {
  const d = Math.max(1, scene.durationInFrames);
  const t = progress(frame, 0, d);
  const i = scene.intensity || 1;
  const map: Record<string, string> = {
    static: 'scale(1.02)',
    'push-in': `scale(${1.02 + t * 0.12 * i}) translate3d(0, ${-t * 12 * i}px, 0)`,
    'pull-out': `scale(${1.14 - t * 0.10 * i})`,
    'pan-left': `scale(1.10) translate3d(${30 - t * 60 * i}px, 0, 0)`,
    'pan-right': `scale(1.10) translate3d(${-30 + t * 60 * i}px, 0, 0)`,
    drift: `scale(${1.06 + t * 0.05 * i}) translate3d(${Math.sin(t * Math.PI) * 25 * i}px, ${-t * 20 * i}px, 0)`
  };
  return map[scene.camera || 'push-in'];
}

export function Atmosphere({ scene, project }: { scene: Scene; project?: VideoProject }) {
  const frame = useCurrentFrame();
  const accent = scene.accent || project?.brand.accentColor || '#d8b56b';
  const primary = project?.brand.primaryColor || accent;
  const secondary = project?.brand.secondaryColor || '#2563eb';
  const bg = scene.backgroundColor || project?.brand.backgroundColor || '#080c14';

  const t1 = Math.sin(frame / 30);
  const t2 = Math.cos(frame / 35);
  const style = scene.backgroundStyle || 'cinematic';

  // Dynamic moving gradients according to style
  const backgrounds: Record<string, string> = {
    'mesh-gradient': `
      radial-gradient(ellipse 65% 55% at ${50 + t1 * 20}% ${25 + t2 * 15}%, ${accent}66 0%, transparent 70%),
      radial-gradient(ellipse 60% 50% at ${20 + t2 * 18}% ${75 - t1 * 15}%, ${primary}55 0%, transparent 65%),
      radial-gradient(ellipse 70% 60% at ${80 - t1 * 15}% ${80 + t2 * 12}%, ${secondary}45 0%, transparent 70%),
      linear-gradient(160deg, ${bg}, #020305 90%)
    `,
    aurora: `
      radial-gradient(ellipse 80% 40% at ${50 + t1 * 25}% ${30 + t2 * 10}%, ${accent}77 0%, transparent 60%),
      radial-gradient(ellipse 75% 45% at ${30 - t2 * 20}% ${65 + t1 * 15}%, ${secondary}66 0%, transparent 65%),
      radial-gradient(circle 500px at ${80 + t1 * 15}% ${50 - t2 * 15}%, ${primary}44 0%, transparent 60%),
      linear-gradient(175deg, ${bg}dd, #010204)
    `,
    'neon-cyber': `
      radial-gradient(circle at 50% 25%, ${accent}55, transparent 55%),
      radial-gradient(circle at 50% 85%, ${secondary}45, transparent 60%),
      linear-gradient(180deg, ${bg} 0%, #030408 100%)
    `,
    'gradient-grid': `
      radial-gradient(ellipse at 50% 20%, ${accent}55 0%, transparent 50%),
      radial-gradient(ellipse at 50% 85%, ${secondary}45 0%, transparent 55%),
      linear-gradient(180deg, ${bg} 0%, #03060f 100%)
    `,
    'brand-glow': `
      radial-gradient(circle at 50% 42%, ${accent}88 0%, ${primary}44 38%, transparent 68%),
      radial-gradient(circle at 50% 85%, ${secondary}55 0%, transparent 55%),
      linear-gradient(180deg, ${bg} 0%, #020409 100%)
    `,
    'bold-duotone': `
      linear-gradient(135deg, ${primary}33 0%, transparent 50%),
      radial-gradient(circle at 85% 15%, ${accent}55 0%, transparent 45%),
      radial-gradient(circle at 15% 85%, ${secondary}50 0%, transparent 50%),
      ${bg}
    `,
    'studio-dark': `
      radial-gradient(ellipse 70% 50% at 50% 35%, ${accent}45 0%, transparent 55%),
      radial-gradient(circle at 50% 90%, ${secondary}30 0%, transparent 45%),
      linear-gradient(180deg, ${bg} 0%, #050608 100%)
    `,
    cinematic: `
      radial-gradient(circle at 75% 20%, ${accent}55 0%, transparent 42%),
      radial-gradient(circle at 20% 80%, ${secondary}45 0%, transparent 45%),
      linear-gradient(155deg, ${bg}, #010204 90%)
    `
  };

  const bgGradient = backgrounds[style] || backgrounds.cinematic;

  return (
    <AbsoluteFill style={{ background: bgGradient }}>
      {/* 3D Moving Perspective Grid for Grid and Cyber styles */}
      {(style === 'gradient-grid' || style === 'neon-cyber') && (
        <AbsoluteFill
          style={{
            opacity: 0.28,
            backgroundImage: `linear-gradient(${accent}33 1px, transparent 1px), linear-gradient(90deg, ${accent}33 1px, transparent 1px)`,
            backgroundSize: '75px 75px',
            transform: `perspective(480px) rotateX(54deg) scale(2) translateY(${250 - frame * 0.8}px)`,
            transformOrigin: 'bottom'
          }}
        />
      )}

      {/* Floating Ambient Glowing Particles */}
      <AbsoluteFill
        style={{
          opacity: 0.25,
          backgroundImage: `radial-gradient(circle, ${accent}77 0 1.5px, transparent 2px)`,
          backgroundSize: '54px 54px',
          transform: `translate3d(${frame * 0.15}px, ${-frame * 0.12}px, 0)`
        }}
      />

      {/* Ambient Moving Glow Orb */}
      <div
        style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}33 0%, transparent 70%)`,
          left: `${40 + t1 * 15}%`,
          top: `${30 + t2 * 15}%`,
          transform: 'translate(-50%, -50%)',
          filter: 'blur(50px)',
          pointerEvents: 'none'
        }}
      />
    </AbsoluteFill>
  );
}

export function MediaLayer({
  asset,
  scene,
  mode = 'background',
  style
}: {
  asset?: Asset;
  scene: Scene;
  mode?: 'background' | 'card' | 'product';
  style?: React.CSSProperties;
}) {
  const frame = useCurrentFrame();
  const src = mediaSrc(asset);
  if (!asset || !src) return null;
  const base: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: mode === 'product' ? 'contain' : 'cover',
    objectPosition: `${scene.focusPoint?.x || 50}% ${scene.focusPoint?.y || 50}%`,
    display: 'block'
  };
  const transform =
    mode === 'background'
      ? cameraTransform(scene, frame)
      : scene.mediaAnimation === 'float'
      ? `translateY(${Math.sin(frame / 14) * 14}px) rotate(${Math.sin(frame / 25) * 1.5}deg) scale(1.02)`
      : `scale(${1.06 - frame * 0.0003})`;
  const mediaStyle = { ...base, transform, ...style };
  return asset.type === 'video' ? <Video src={src} muted style={mediaStyle} /> : <Img src={src} style={mediaStyle} />;
}

export function Grade({ strong = false }: { strong?: boolean }) {
  // Soft, rich contrast curve that preserves background saturation and vibrant colors
  return (
    <>
      <AbsoluteFill
        style={{
          background: strong
            ? 'linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.18) 50%, rgba(0,0,0,0.48))'
            : 'linear-gradient(180deg, rgba(0,0,0,0.03), transparent 45%, rgba(0,0,0,0.30))',
          pointerEvents: 'none'
        }}
      />
      <AbsoluteFill
        style={{
          boxShadow: 'inset 0 0 130px rgba(0,0,0,0.32)',
          pointerEvents: 'none'
        }}
      />
    </>
  );
}

function AnimatedWords({
  text,
  scene,
  size,
  textColor
}: {
  text: string;
  scene: Scene;
  size: number;
  textColor?: string;
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.trim().split(/\s+/);
  const color = textColor || '#ffffff';
  const anim = scene.textAnimation || 'word-stagger';

  if (anim === 'pop-elastic') {
    return (
      <div
        style={{
          fontSize: size,
          fontWeight: 850,
          lineHeight: 1.16,
          letterSpacing: '-.025em',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0 .25em',
          color
        }}
      >
        {words.map((w, i) => {
          const p = elastic(frame, fps, 5 + i * 3);
          return (
            <span
              key={`${w}-${i}`}
              style={{
                display: 'inline-block',
                opacity: p,
                transform: `scale(${0.4 + 0.6 * p}) translateY(${(1 - p) * 35}px)`,
                textShadow: '0 8px 30px rgba(0,0,0,0.6)'
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    );
  }

  if (anim === '3d-flip') {
    const p = smooth(frame, fps, 6);
    return (
      <div
        style={{
          fontSize: size,
          fontWeight: 850,
          lineHeight: 1.1,
          letterSpacing: '-.025em',
          color,
          perspective: 800,
          transform: `perspective(800px) rotateX(${(1 - p) * 55}deg) translateY(${(1 - p) * 45}px)`,
          opacity: p,
          transformOrigin: 'top center'
        }}
      >
        {text}
      </div>
    );
  }

  if (anim !== 'word-stagger') {
    const p = smooth(frame, fps, 6);
    const styles: Record<string, React.CSSProperties> = {
      rise: { opacity: p, transform: `translateY(${(1 - p) * 70}px)` },
      'mask-reveal': { clipPath: `inset(${(1 - p) * 100}% 0 0 0)`, transform: `translateY(${(1 - p) * 30}px)` },
      'scale-blur': { opacity: p, filter: `blur(${(1 - p) * 16}px)`, transform: `scale(${0.84 + 0.16 * p})` },
      slide: {
        opacity: p,
        transform: `translateX(${(1 - p) * (scene.layout === 'split-right' ? -100 : 100)}px)`
      }
    };
    return (
      <div
        style={{
          fontSize: size,
          fontWeight: 850,
          lineHeight: 1.1,
          letterSpacing: '-.025em',
          color,
          ...(styles[anim] || styles.rise)
        }}
      >
        {text}
      </div>
    );
  }

  // Default word-stagger with subtle organic rotation
  return (
    <div
      style={{
        fontSize: size,
        fontWeight: 850,
        lineHeight: 1.16,
        letterSpacing: '-.025em',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0 .24em',
        color
      }}
    >
      {words.map((w, i) => {
        const p = smooth(frame, fps, 5 + i * 3);
        return (
          <span
            key={`${w}-${i}`}
            style={{
              display: 'inline-block',
              opacity: p,
              transform: `translateY(${(1 - p) * 60}px) rotate(${(1 - p) * 2}deg)`,
              filter: `blur(${(1 - p) * 6}px)`
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
}

export function CopyBlock({
  scene,
  project,
  position = 'top',
  titleSize = 92,
  align
}: {
  scene: Scene;
  project: VideoProject;
  position?: 'top' | 'middle' | 'bottom';
  titleSize?: number;
  align?: 'left' | 'center' | 'right';
}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = smooth(frame, fps, 2);

  const isCenter = scene.layout === 'center' || align === 'center';
  const textAlign = align || (isCenter ? 'center' : project.direction === 'rtl' ? 'right' : 'left');
  const positions = { top: { top: 180 }, middle: { top: 570 }, bottom: { bottom: 180 } };
  const textColor = scene.textColor || project.brand?.textColor || '#ffffff';
  const accent = scene.accent || project.brand?.accentColor || '#d8b56b';

  return (
    <div
      style={{
        position: 'absolute',
        zIndex: 20,
        left: isCenter ? 65 : 75,
        right: isCenter ? 65 : 75,
        ...positions[position],
        direction: project.direction,
        textAlign,
        color: textColor,
        fontFamily: project.brand.fontFamily || 'Cairo, Arial, sans-serif'
      }}
    >
      {/* Category Eyebrow Tag */}
      {scene.eyebrow && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
            gap: 12,
            opacity: p,
            marginBottom: 20,
            padding: isCenter ? '6px 20px' : '0',
            borderRadius: 99,
            background: isCenter ? `${accent}18` : 'transparent',
            border: isCenter ? `1px solid ${accent}44` : 'none'
          }}
        >
          {!isCenter && <span style={{ width: 35, height: 2.5, background: accent, borderRadius: 2 }} />}
          <span
            style={{
              fontSize: 23,
              fontWeight: 800,
              color: accent,
              letterSpacing: 2,
              textTransform: 'uppercase'
            }}
          >
            {scene.eyebrow}
          </span>
          {!isCenter && project.direction === 'rtl' && (
            <span style={{ width: 35, height: 2.5, background: accent, borderRadius: 2 }} />
          )}
        </div>
      )}

      {/* Main Animated Title */}
      <AnimatedWords text={scene.title} scene={scene} size={titleSize} textColor={textColor} />

      {/* Subtitle with High-Legibility Flow */}
      {scene.subtitle && (
        <div
          style={{
            fontSize: 29,
            lineHeight: 1.6,
            maxWidth: isCenter ? 840 : 760,
            marginTop: 26,
            marginInline: isCenter ? 'auto' : 0,
            color: `${textColor}cc`,
            opacity: smooth(frame, fps, 16),
            transform: `translateY(${(1 - smooth(frame, fps, 16)) * 24}px)`
          }}
        >
          {scene.subtitle}
        </div>
      )}
    </div>
  );
}

export function FilmTexture() {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        zIndex: 80,
        pointerEvents: 'none',
        opacity: 0.05,
        mixBlendMode: 'screen',
        backgroundImage:
          'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27160%27 height=%27160%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%27.9%27 numOctaves=%274%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27 opacity=%27.7%27/%3E%3C/svg%3E")',
        transform: `translate(${frame % 3}px, ${(frame * 2) % 3}px)`
      }}
    />
  );
}

export function TransitionOverlay({ scene }: { scene: Scene }) {
  const frame = useCurrentFrame();
  const d = Math.max(2, scene.durationInFrames);
  const edge = Math.min(18, Math.max(1, Math.floor((d - 1) / 2)));
  const inputRange = [0, edge, d - edge, d];
  const incoming = progress(frame, 0, edge);
  const outgoing = progress(frame, d - edge, d);
  const accent = scene.accent;
  const edgeOpacity = Math.min(1, Math.max(0, 1 - incoming) + outgoing);

  if (scene.transition === 'wipe')
    return (
      <div
        style={{
          position: 'absolute',
          zIndex: 100,
          inset: 0,
          background: accent,
          transform: `translateX(${interpolate(frame, inputRange, [-105, 105, 105, -105], clamp)}%)`,
          mixBlendMode: 'screen',
          opacity: 0.72
        }}
      />
    );

  if (scene.transition === 'light-sweep')
    return (
      <div
        style={{
          position: 'absolute',
          zIndex: 100,
          top: -200,
          bottom: -200,
          width: 300,
          left: `${interpolate(frame, inputRange, [-35, 130, 130, -35], clamp)}%`,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)',
          filter: 'blur(28px)',
          transform: 'rotate(14deg)',
          mixBlendMode: 'screen'
        }}
      />
    );

  if (scene.transition === 'film-burn')
    return (
      <AbsoluteFill
        style={{
          zIndex: 100,
          opacity: edgeOpacity,
          background: `radial-gradient(circle at 75% 40%, #fff7c4, ${accent} 18%, #e4551a 42%, #120400 75%)`,
          mixBlendMode: 'screen'
        }}
      />
    );

  if (scene.transition === 'zoom')
    return (
      <AbsoluteFill
        style={{
          zIndex: 100,
          opacity: Math.min(1, (1 - incoming) * 0.75 + outgoing * 0.75),
          background: `radial-gradient(circle, transparent 5%, ${accent}55 45%, #000 80%)`,
          transform: `scale(${0.6 + incoming * 0.8 - outgoing * 0.4})`
        }}
      />
    );

  return <AbsoluteFill style={{ zIndex: 100, background: '#000', opacity: edgeOpacity }} />;
}

export function SceneShell({
  scene,
  project,
  children
}: {
  scene: Scene;
  project?: VideoProject;
  children: React.ReactNode;
}) {
  const frame = useCurrentFrame();
  const bg = scene.backgroundColor || project?.brand.backgroundColor || '#080c14';
  return (
    <AbsoluteFill
      style={{
        overflow: 'hidden',
        opacity: sceneOpacity(frame, scene.durationInFrames),
        background: bg
      }}
    >
      {children}
      <FilmTexture />
      <TransitionOverlay scene={scene} />
    </AbsoluteFill>
  );
}
