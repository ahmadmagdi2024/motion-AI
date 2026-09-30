import React from 'react';
import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import type { Scene, VideoProject } from '../lib/schema';
import { findAsset, mediaSrc } from './helpers';
import { Atmosphere, CopyBlock, Grade, MediaLayer, SceneShell, progress, smooth, elastic } from './motion/primitives';
import { MotionIcon } from './motion/icons';

type Props = { scene: Scene; project: VideoProject };

function CinematicOpening({ scene, project }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bg = findAsset(project, scene.backgroundAssetId);
  const logo = findAsset(project, project.brand.logoAssetId);
  const p = smooth(frame, fps, 4);
  const accent = scene.accent || project.brand.accentColor || '#d8b56b';
  const secondary = project.brand.secondaryColor || '#2563eb';
  const icon = scene.icon || 'sparkles';
  const layout = scene.layout || 'center';

  return (
    <SceneShell scene={scene} project={project}>
      <Atmosphere scene={scene} project={project} />
      {bg && (
        <AbsoluteFill style={{ opacity: 0.35 }}>
          <MediaLayer asset={bg} scene={scene} />
        </AbsoluteFill>
      )}
      <Grade />

      {/* Dynamic Framing Architecture based on Layout */}
      {layout === 'center' ? (
        <>
          {/* Glowing Geometric Halo */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '38%',
              width: 520,
              height: 520,
              borderRadius: '50%',
              border: `2px solid ${accent}55`,
              transform: `translate(-50%, -50%) scale(${0.75 + 0.25 * p})`,
              boxShadow: `0 0 100px ${accent}33`,
              opacity: p
            }}
          />
          {/* Rotating Dotted Ring */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '38%',
              width: 620,
              height: 620,
              borderRadius: '50%',
              border: `1.5px dashed ${secondary}66`,
              transform: `translate(-50%, -50%) rotate(${frame * 0.2}deg) scale(${0.8 + 0.2 * p})`,
              opacity: p * 0.8
            }}
          />
        </>
      ) : layout === 'editorial' ? (
        <>
          {/* Architectural Modern Grid Lines */}
          <div
            style={{
              position: 'absolute',
              left: 60,
              right: 60,
              top: 80,
              bottom: 80,
              border: `1px solid ${accent}33`,
              transform: `scale(${0.96 + 0.04 * p})`,
              opacity: 0.5 * p
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 60,
              top: 80,
              width: 140,
              height: 3,
              background: accent,
              opacity: p
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: 60,
              bottom: 80,
              width: 140,
              height: 3,
              background: secondary,
              opacity: p
            }}
          />
        </>
      ) : (
        <>
          {/* Dynamic Diagonal Light Slash */}
          <div
            style={{
              position: 'absolute',
              left: '-20%',
              top: '30%',
              width: '140%',
              height: 2,
              background: `linear-gradient(90deg, transparent, ${accent}, ${secondary}, transparent)`,
              transform: 'rotate(-25deg)',
              opacity: 0.6 * p
            }}
          />
        </>
      )}

      {/* Corner Tech Crosshairs (+) */}
      {[
        { top: 60, left: 60 },
        { top: 60, right: 60 },
        { bottom: 60, left: 60 },
        { bottom: 60, right: 60 }
      ].map((pos, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            ...pos,
            color: `${accent}88`,
            fontSize: 22,
            fontFamily: 'monospace',
            opacity: p
          }}
        >
          +
        </div>
      ))}

      {/* Hero Icon or Brand Logo Header */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: layout === 'editorial' ? '18%' : '24%',
          transform: 'translateX(-50%)',
          zIndex: 30,
          opacity: p
        }}
      >
        {logo ? (
          <Img
            src={mediaSrc(logo)}
            style={{ maxHeight: 110, maxWidth: 300, objectFit: 'contain', filter: `drop-shadow(0 10px 30px ${accent}66)` }}
          />
        ) : (
          <MotionIcon
            name={icon}
            size={96}
            color={scene.iconColor || accent}
            badge
            glow
            delay={2}
          />
        )}
      </div>

      <CopyBlock
        scene={scene}
        project={project}
        position="middle"
        align={layout === 'center' ? 'center' : project.direction === 'rtl' ? 'right' : 'left'}
        titleSize={96}
      />
    </SceneShell>
  );
}

function IconBadgeScene({ scene, project }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bg = findAsset(project, scene.backgroundAssetId);
  const p = smooth(frame, fps, 3);
  const accent = scene.accent || project.brand.accentColor || '#d8b56b';
  const secondary = project.brand.secondaryColor || '#2563eb';
  const icon = scene.icon || 'rocket';
  const textColor = scene.textColor || project.brand.textColor || '#ffffff';
  const isEditorial = scene.layout === 'editorial';

  return (
    <SceneShell scene={scene} project={project}>
      <Atmosphere scene={{ ...scene, backgroundStyle: scene.backgroundStyle || 'brand-glow' }} project={project} />
      {bg && <AbsoluteFill style={{ opacity: 0.25 }}><MediaLayer asset={bg} scene={scene} /></AbsoluteFill>}
      <Grade />

      {/* Ambient Pulsing Glow Core */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: isEditorial ? '32%' : '36%',
          width: 540,
          height: 540,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}55, ${secondary}33 55%, transparent 75%)`,
          transform: `translate(-50%, -50%) scale(${0.8 + 0.2 * p})`,
          filter: 'blur(35px)'
        }}
      />

      {/* Orbital Laser Rings with Satellites */}
      {[0, 1].map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: '50%',
            top: isEditorial ? '32%' : '36%',
            width: 360 + i * 150,
            height: 360 + i * 150,
            borderRadius: '50%',
            border: `1.5px ${i ? 'dashed' : 'solid'} ${accent}${i ? '44' : '88'}`,
            transform: `translate(-50%, -50%) rotate(${frame * (i ? -0.18 : 0.25)}deg) scale(${0.75 + 0.25 * p})`
          }}
        >
          {/* Orbiting Satellite Dot */}
          <div
            style={{
              position: 'absolute',
              top: -6,
              left: '50%',
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: accent,
              boxShadow: `0 0 15px ${accent}`
            }}
          />
        </div>
      ))}

      {/* Center Hero SVG Motion Icon inside Frosted Glass Badge */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: isEditorial ? '32%' : '36%',
          transform: 'translate(-50%, -50%)',
          zIndex: 35
        }}
      >
        <MotionIcon
          name={icon}
          size={120}
          color={scene.iconColor || accent}
          badge
          glow
          delay={4}
        />
      </div>

      {/* Dynamic Text Typography */}
      <div
        style={{
          position: 'absolute',
          left: 75,
          right: 75,
          top: isEditorial ? 980 : 1060,
          textAlign: isEditorial ? (project.direction === 'rtl' ? 'right' : 'left') : 'center',
          direction: project.direction,
          zIndex: 40
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px 24px',
            borderRadius: 99,
            background: `${accent}22`,
            border: `1px solid ${accent}55`,
            color: accent,
            fontSize: 24,
            fontWeight: 800,
            marginBottom: 24,
            opacity: p
          }}
        >
          {scene.eyebrow || project.brand.name || 'مميزات متقدمة'}
        </div>
        <div
          style={{
            fontSize: 78,
            fontWeight: 900,
            lineHeight: 1.15,
            color: textColor,
            textShadow: '0 10px 40px rgba(0,0,0,0.6)',
            opacity: smooth(frame, fps, 9),
            transform: `translateY(${(1 - smooth(frame, fps, 9)) * 40}px)`
          }}
        >
          {scene.title}
        </div>
        {scene.subtitle && (
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.6,
              color: `${textColor}cc`,
              marginTop: 24,
              maxWidth: 760,
              marginInline: isEditorial ? 0 : 'auto',
              opacity: smooth(frame, fps, 15),
              transform: `translateY(${(1 - smooth(frame, fps, 15)) * 25}px)`
            }}
          >
            {scene.subtitle}
          </div>
        )}
      </div>
    </SceneShell>
  );
}

function FeatureCardsScene({ scene, project }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = scene.accent || project.brand.accentColor || '#d8b56b';
  const secondary = project.brand.secondaryColor || '#2563eb';
  const textColor = scene.textColor || project.brand.textColor || '#ffffff';

  const items = scene.items?.length
    ? scene.items
    : ['سرعة استثنائية وأداء فائق', 'حماية وأمان معتمد لأعمالك', 'تصاميم تفاعلية وهوية مبتكرة'];

  const defaultIcons = ['zap', 'shield', 'target', 'sparkles', 'award', 'rocket'];

  return (
    <SceneShell scene={scene} project={project}>
      <Atmosphere scene={scene} project={project} />
      <CopyBlock scene={scene} project={project} position="top" titleSize={76} />

      <div
        style={{
          position: 'absolute',
          left: 65,
          right: 65,
          top: 660,
          bottom: 120,
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
          justifyContent: 'center',
          direction: project.direction
        }}
      >
        {items.slice(0, 4).map((item, i) => {
          const cardP = smooth(frame, fps, 10 + i * 6);
          const iconName = defaultIcons[i % defaultIcons.length];
          return (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: project.direction === 'rtl' ? '1fr 88px' : '88px 1fr',
                alignItems: 'center',
                gap: 22,
                padding: '24px 28px',
                borderRadius: 22,
                background: `linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))`,
                border: `1.5px solid ${accent}44`,
                borderRight: project.direction === 'rtl' ? `4px solid ${accent}` : `1.5px solid ${accent}44`,
                borderLeft: project.direction === 'ltr' ? `4px solid ${accent}` : `1.5px solid ${accent}44`,
                boxShadow: `0 20px 50px -10px rgba(0,0,0,0.5)`,
                backdropFilter: 'blur(24px)',
                opacity: cardP,
                transform: `translateX(${(1 - cardP) * (project.direction === 'rtl' ? 80 : -80)}px)`
              }}
            >
              {project.direction === 'ltr' && (
                <MotionIcon
                  name={iconName}
                  size={46}
                  color={scene.iconColor || accent}
                  badge
                  delay={10 + i * 6}
                />
              )}
              <div>
                <div style={{ fontSize: 21, color: accent, fontWeight: 700, marginBottom: 5 }}>
                  {String(i + 1).padStart(2, '0')} · {project.direction === 'rtl' ? 'ميزة حصرية' : 'Feature'}
                </div>
                <div style={{ fontSize: 34, fontWeight: 800, color: textColor, lineHeight: 1.35 }}>
                  {item}
                </div>
              </div>
              {project.direction === 'rtl' && (
                <MotionIcon
                  name={iconName}
                  size={46}
                  color={scene.iconColor || accent}
                  badge
                  delay={10 + i * 6}
                />
              )}
            </div>
          );
        })}
      </div>
    </SceneShell>
  );
}

function ComparisonScene({ scene, project }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const accent = scene.accent || project.brand.accentColor || '#d8b56b';
  const textColor = scene.textColor || project.brand.textColor || '#ffffff';
  const p1 = smooth(frame, fps, 8);
  const p2 = smooth(frame, fps, 18);

  const beforeText = scene.items?.[0] || 'الأساليب التقليدية البطيئة والمكلفة';
  const afterText = scene.items?.[1] || 'حلول ذكية، سرعة فائقة وجودة استثنائية';

  return (
    <SceneShell scene={scene} project={project}>
      <Atmosphere scene={scene} project={project} />
      <CopyBlock scene={scene} project={project} position="top" titleSize={76} align="center" />

      <div
        style={{
          position: 'absolute',
          left: 65,
          right: 65,
          top: 680,
          bottom: 140,
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
          justifyContent: 'center',
          direction: project.direction
        }}
      >
        {/* Before / Problem Card */}
        <div
          style={{
            padding: '34px 30px',
            borderRadius: 22,
            background: 'rgba(255,255,255,0.03)',
            border: '1.5px solid rgba(255,255,255,0.12)',
            opacity: p1,
            transform: `translateY(${(1 - p1) * 50}px)`,
            display: 'flex',
            alignItems: 'center',
            gap: 22
          }}
        >
          <MotionIcon name="alert" size={48} color="#94a3b8" badge delay={8} />
          <div style={{ flex: 1 }}>
            <div style={{ color: '#94a3b8', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
              {project.direction === 'rtl' ? 'قبل / التحدي التقليدي' : 'Before / Legacy Workflow'}
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: `${textColor}99`, lineHeight: 1.4 }}>
              {beforeText}
            </div>
          </div>
        </div>

        {/* Central VS Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            opacity: p2
          }}
        >
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${accent}66)` }} />
          <div
            style={{
              padding: '6px 16px',
              borderRadius: 99,
              background: `${accent}22`,
              border: `1px solid ${accent}`,
              color: accent,
              fontSize: 18,
              fontWeight: 900
            }}
          >
            VS
          </div>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${accent}66, transparent)` }} />
        </div>

        {/* After / Solution Card with Radiant Brand Glow */}
        <div
          style={{
            padding: '38px 30px',
            borderRadius: 22,
            background: `linear-gradient(135deg, ${accent}28, ${project.brand.secondaryColor}22)`,
            border: `2px solid ${accent}`,
            boxShadow: `0 25px 70px -10px ${accent}44`,
            opacity: p2,
            transform: `translateY(${(1 - p2) * 50}px) scale(${0.96 + 0.04 * p2})`,
            display: 'flex',
            alignItems: 'center',
            gap: 22
          }}
        >
          <MotionIcon
            name={scene.icon || 'badge-check'}
            size={54}
            color={scene.iconColor || accent}
            badge
            glow
            delay={18}
          />
          <div style={{ flex: 1 }}>
            <div style={{ color: accent, fontSize: 23, fontWeight: 800, marginBottom: 6 }}>
              {project.direction === 'rtl' ? 'معنا / النتيجة المبتكرة' : 'With Us / The Breakthrough'}
            </div>
            <div style={{ fontSize: 36, fontWeight: 900, color: textColor, lineHeight: 1.35 }}>
              {afterText}
            </div>
          </div>
        </div>
      </div>
    </SceneShell>
  );
}

function QuoteHighlightScene({ scene, project }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = smooth(frame, fps, 5);
  const accent = scene.accent || project.brand.accentColor || '#d8b56b';
  const textColor = scene.textColor || project.brand.textColor || '#ffffff';

  return (
    <SceneShell scene={scene} project={project}>
      <Atmosphere scene={{ ...scene, backgroundStyle: scene.backgroundStyle || 'aurora' }} project={project} />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 80,
          textAlign: 'center',
          direction: project.direction
        }}
      >
        <MotionIcon
          name={scene.icon || 'award'}
          size={84}
          color={scene.iconColor || accent}
          badge
          glow
          delay={4}
        />

        <div
          style={{
            color: accent,
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: 2,
            marginTop: 36,
            marginBottom: 20,
            opacity: p
          }}
        >
          {scene.eyebrow || 'رؤية ورسالة'}
        </div>

        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            lineHeight: 1.3,
            color: textColor,
            maxWidth: 840,
            opacity: smooth(frame, fps, 10),
            transform: `scale(${0.9 + 0.1 * smooth(frame, fps, 10)})`,
            textShadow: '0 15px 45px rgba(0,0,0,0.6)'
          }}
        >
          «{scene.title}»
        </div>

        {scene.subtitle && (
          <div
            style={{
              fontSize: 30,
              color: `${textColor}bb`,
              marginTop: 32,
              maxWidth: 720,
              lineHeight: 1.6,
              opacity: smooth(frame, fps, 18)
            }}
          >
            — {scene.subtitle}
          </div>
        )}
      </div>
    </SceneShell>
  );
}

function VideoText({ scene, project }: Props) {
  const bg = findAsset(project, scene.backgroundAssetId);
  const accent = scene.accent || project.brand.accentColor || '#d8b56b';

  return (
    <SceneShell scene={scene} project={project}>
      <Atmosphere scene={scene} project={project} />
      {bg && (
        <AbsoluteFill style={{ clipPath: 'inset(0 0 37% 0)' }}>
          <MediaLayer asset={bg} scene={scene} />
        </AbsoluteFill>
      )}
      <Grade />
      <div
        style={{
          position: 'absolute',
          left: 70,
          right: 70,
          top: 1110,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
          opacity: 0.7
        }}
      />
      <CopyBlock scene={scene} project={project} position="bottom" titleSize={88} />
    </SceneShell>
  );
}

function KineticTypography({ scene, project }: Props) {
  const frame = useCurrentFrame();
  const words = scene.title.split(/\s+/);
  const loop = interpolate(frame, [0, scene.durationInFrames], [0, -260], { extrapolateRight: 'clamp' });
  const accent = scene.accent || project.brand.accentColor || '#d8b56b';
  const textColor = scene.textColor || project.brand.textColor || '#ffffff';

  return (
    <SceneShell scene={scene} project={project}>
      <Atmosphere scene={{ ...scene, backgroundStyle: scene.backgroundStyle || 'mesh-gradient' }} project={project} />

      {/* Kinetic Repeating Watermark Bands */}
      <div
        style={{
          position: 'absolute',
          inset: -120,
          transform: `rotate(-8deg) translateY(${loop}px)`,
          opacity: 0.14
        }}
      >
        {Array.from({ length: 8 }, (_, row) => (
          <div
            key={row}
            style={{
              fontSize: 125,
              fontWeight: 950,
              whiteSpace: 'nowrap',
              color: row % 2 ? accent : '#fff',
              lineHeight: 1.3
            }}
          >
            {scene.title} · {scene.title} ·
          </div>
        ))}
      </div>

      {/* High-Impact Word Punch */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          padding: 70,
          textAlign: 'center',
          direction: project.direction
        }}
      >
        <div>
          {words.map((word, i) => {
            const p = elastic(frame, useVideoConfig().fps, 4 + i * 4);
            return (
              <div
                key={i}
                style={{
                  fontSize: i % 2 ? 115 : 140,
                  fontWeight: 950,
                  lineHeight: 0.98,
                  color: i % 2 ? accent : textColor,
                  opacity: p,
                  transform: `scale(${0.6 + 0.4 * p}) translateX(${(1 - p) * (i % 2 ? -100 : 100)}px)`,
                  textShadow: '0 15px 50px rgba(0,0,0,.6)'
                }}
              >
                {word}
              </div>
            );
          })}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: 155,
          left: 80,
          right: 80,
          textAlign: 'center',
          fontSize: 30,
          color: `${textColor}cc`,
          direction: project.direction
        }}
      >
        {scene.subtitle}
      </div>
    </SceneShell>
  );
}

function SplitShowcase({ scene, project }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bg = findAsset(project, scene.backgroundAssetId);
  const fg = findAsset(project, scene.foregroundAssetId) || bg;
  const p = smooth(frame, fps, 5);
  const right = scene.layout === 'split-right';
  const accent = scene.accent || project.brand.accentColor || '#d8b56b';
  const textColor = scene.textColor || project.brand.textColor || '#ffffff';

  return (
    <SceneShell scene={scene} project={project}>
      <Atmosphere scene={scene} project={project} />
      <Grade />

      {/* Media or SVG Badge Container */}
      <div
        style={{
          position: 'absolute',
          top: 120,
          bottom: 120,
          width: '56%',
          [right ? 'right' : 'left']: -30,
          overflow: 'hidden',
          borderRadius: right ? '70px 0 0 70px' : '0 70px 70px 0',
          clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`,
          boxShadow: '0 45px 120px rgba(0,0,0,.65)',
          background: 'rgba(255,255,255,0.03)',
          display: 'grid',
          placeItems: 'center'
        }}
      >
        {fg ? (
          <MediaLayer asset={fg} scene={scene} />
        ) : (
          <MotionIcon
            name={scene.icon || 'layers'}
            size={110}
            color={scene.iconColor || accent}
            badge
            glow
          />
        )}
      </div>

      <div
        style={{
          position: 'absolute',
          top: 230,
          bottom: 230,
          width: 4,
          left: right ? '40%' : '60%',
          background: accent,
          transform: `scaleY(${p})`,
          transformOrigin: 'top'
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 260,
          bottom: 240,
          width: '40%',
          [right ? 'left' : 'right']: 65,
          direction: project.direction,
          textAlign: project.direction === 'rtl' ? 'right' : 'left',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        <div style={{ color: accent, fontSize: 24, marginBottom: 25, fontWeight: 700 }}>
          {scene.eyebrow}
        </div>
        <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 1.15, color: textColor }}>
          {scene.title}
        </div>
        <div style={{ fontSize: 28, lineHeight: 1.6, color: `${textColor}aa`, marginTop: 30 }}>
          {scene.subtitle}
        </div>
      </div>
    </SceneShell>
  );
}

function Statistic({ scene, project }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bg = findAsset(project, scene.backgroundAssetId);
  const p = smooth(frame, fps, 6);
  const rings = progress(frame, 5, 45);
  const accent = scene.accent || project.brand.accentColor || '#d8b56b';
  const secondary = project.brand.secondaryColor || '#2563eb';
  const textColor = scene.textColor || project.brand.textColor || '#ffffff';
  const icon = scene.icon || 'trending-up';

  return (
    <SceneShell scene={scene} project={project}>
      <Atmosphere scene={{ ...scene, backgroundStyle: scene.backgroundStyle || 'mesh-gradient' }} project={project} />
      {bg && (
        <AbsoluteFill style={{ opacity: 0.18, filter: 'grayscale(1) contrast(1.4)' }}>
          <MediaLayer asset={bg} scene={scene} />
        </AbsoluteFill>
      )}
      <Grade />

      {/* Rotating Progress Arc Rings */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: '50%',
            top: '46%',
            width: 440 + i * 180,
            height: 440 + i * 180,
            border: `${2.5 - i * 0.5}px solid ${i === 1 ? secondary : accent}${i ? '38' : '99'}`,
            borderRadius: '50%',
            transform: `translate(-50%, -50%) scale(${0.5 + rings * 0.5}) rotate(${frame * (i % 2 ? -0.1 : 0.1)}deg)`,
            opacity: p
          }}
        />
      ))}

      {/* Metric SVG Icon */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '32%',
          transform: 'translate(-50%, -50%)',
          zIndex: 30
        }}
      >
        <MotionIcon
          name={icon}
          size={84}
          color={scene.iconColor || accent}
          badge
          glow
          delay={4}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 680,
          textAlign: 'center',
          direction: project.direction,
          zIndex: 35
        }}
      >
        {/* Giant Glowing Stat Counter */}
        <div
          style={{
            fontSize: 180,
            fontWeight: 950,
            color: accent,
            lineHeight: 1,
            transform: `scale(${0.7 + 0.3 * p})`,
            filter: `blur(${(1 - p) * 16}px)`,
            textShadow: `0 0 60px ${accent}66`
          }}
        >
          {scene.statistic || '+180%'}
        </div>
        <div style={{ fontSize: 68, fontWeight: 850, marginTop: 40, color: textColor }}>
          {scene.title}
        </div>
        <div
          style={{
            fontSize: 30,
            color: `${textColor}aa`,
            margin: '28px auto',
            maxWidth: 720,
            lineHeight: 1.55
          }}
        >
          {scene.subtitle}
        </div>
      </div>
    </SceneShell>
  );
}

function Process({ scene, project }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items = scene.items?.length
    ? scene.items
    : ['Concept', 'Design', 'Motion', 'Polish'];
  const accent = scene.accent || project.brand.accentColor || '#d8b56b';
  const textColor = scene.textColor || project.brand.textColor || '#ffffff';

  const stepIcons = ['lightbulb', 'compass', 'layers', 'check-circle'];

  return (
    <SceneShell scene={scene} project={project}>
      <Atmosphere scene={scene} project={project} />
      <CopyBlock scene={scene} project={project} position="top" titleSize={78} />

      <div
        style={{
          position: 'absolute',
          left: 78,
          right: 78,
          top: 700,
          bottom: 110,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-around'
        }}
      >
        {items.map((item, i) => {
          const p = smooth(frame, fps, 12 + i * 6);
          const icon = stepIcons[i % stepIcons.length];
          return (
            <div
              key={i}
              style={{
                height: 155,
                display: 'grid',
                gridTemplateColumns: project.direction === 'rtl' ? '80px 1fr 90px' : '90px 1fr 80px',
                alignItems: 'center',
                gap: 20,
                padding: '0 20px',
                borderRadius: 18,
                background: 'rgba(255,255,255,0.03)',
                borderBottom: `2px solid ${accent}44`,
                opacity: p,
                transform: `translateX(${(1 - p) * (i % 2 ? 60 : -60)}px)`,
                direction: project.direction
              }}
            >
              {project.direction === 'ltr' && (
                <div style={{ fontSize: 32, fontWeight: 900, color: accent }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
              )}
              {project.direction === 'ltr' && (
                <div style={{ fontSize: 40, fontWeight: 800, color: textColor }}>{item}</div>
              )}

              {project.direction === 'rtl' && (
                <div style={{ width: 68, display: 'flex', justifyContent: 'center' }}>
                  <MotionIcon
                    name={icon}
                    size={38}
                    color={scene.iconColor || accent}
                    badge
                    delay={12 + i * 6}
                  />
                </div>
              )}
              {project.direction === 'rtl' && (
                <div style={{ fontSize: 40, fontWeight: 800, color: textColor }}>{item}</div>
              )}
              {project.direction === 'rtl' && (
                <div style={{ fontSize: 32, fontWeight: 900, color: accent }}>
                  {String(i + 1).padStart(2, '0')}
                </div>
              )}

              {project.direction === 'ltr' && (
                <div style={{ width: 68, display: 'flex', justifyContent: 'center' }}>
                  <MotionIcon
                    name={icon}
                    size={38}
                    color={scene.iconColor || accent}
                    badge
                    delay={12 + i * 6}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </SceneShell>
  );
}

function ProductHero({ scene, project }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bg = findAsset(project, scene.backgroundAssetId);
  const product = findAsset(project, scene.foregroundAssetId) || bg;
  const p = smooth(frame, fps, 7);
  const accent = scene.accent || project.brand.accentColor || '#d8b56b';

  return (
    <SceneShell scene={scene} project={project}>
      <Atmosphere scene={{ ...scene, backgroundStyle: scene.backgroundStyle || 'studio-dark' }} project={project} />
      {bg && (
        <AbsoluteFill style={{ opacity: 0.15, filter: 'blur(20px)', transform: 'scale(1.2)' }}>
          <MediaLayer asset={bg} scene={scene} />
        </AbsoluteFill>
      )}

      {/* Pedestal Radial Spot */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '49%',
          width: 720,
          height: 720,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}45, transparent 68%)`,
          transform: 'translate(-50%,-50%)'
        }}
      />
      {[0, 1].map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: '50%',
            top: '49%',
            width: 620 + i * 150,
            height: 620 + i * 150,
            border: `1px solid ${accent}${i ? '44' : '77'}`,
            borderRadius: '50%',
            transform: `translate(-50%,-50%) rotate(${frame * (i ? -0.12 : 0.17)}deg) scale(${0.6 + 0.4 * p})`,
            borderTopColor: 'transparent'
          }}
        />
      ))}

      <div
        style={{
          position: 'absolute',
          left: 170,
          right: 170,
          top: 430,
          bottom: 390,
          filter: 'drop-shadow(0 55px 45px rgba(0,0,0,.7))',
          opacity: p,
          transform: `translateY(${(1 - p) * 140}px) scale(${0.82 + 0.18 * p})`
        }}
      >
        {product ? (
          <MediaLayer asset={product} scene={{ ...scene, mediaAnimation: 'float' }} mode="product" />
        ) : (
          <MotionIcon
            name={scene.icon || 'shopping-bag'}
            size={140}
            color={accent}
            badge
            glow
          />
        )}
      </div>

      <CopyBlock scene={scene} project={project} position="bottom" align="center" titleSize={74} />
    </SceneShell>
  );
}

function LogoReveal({ scene, project }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = findAsset(project, project.brand.logoAssetId) || findAsset(project, scene.foregroundAssetId);
  const p = smooth(frame, fps, 10);
  const sweep = progress(frame, 6, 42);
  const accent = scene.accent || project.brand.accentColor || '#d8b56b';
  const textColor = scene.textColor || project.brand.textColor || '#ffffff';

  return (
    <SceneShell scene={scene} project={project}>
      <Atmosphere scene={{ ...scene, backgroundStyle: scene.backgroundStyle || 'studio-dark' }} project={project} />

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '45%',
          width: 620,
          height: 620,
          border: `1.5px solid ${accent}66`,
          borderRadius: '50%',
          transform: `translate(-50%,-50%) scale(${0.65 + 0.35 * p}) rotate(${frame * 0.13}deg)`,
          boxShadow: `0 0 130px ${accent}22`
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 200,
          right: 200,
          top: 570,
          height: 440,
          display: 'grid',
          placeItems: 'center',
          clipPath: `inset(0 ${(1 - sweep) * 100}% 0 0)`,
          filter: 'drop-shadow(0 30px 55px rgba(0,0,0,.65))'
        }}
      >
        {logo ? (
          <Img src={mediaSrc(logo)} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        ) : (
          <div style={{ textAlign: 'center' }}>
            <MotionIcon
              name={scene.icon || 'sparkles'}
              size={110}
              color={scene.iconColor || accent}
              badge
              glow
            />
            <div style={{ fontSize: 80, fontWeight: 950, color: accent, marginTop: 24 }}>
              {project.brand.name || scene.title}
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          position: 'absolute',
          left: 140,
          right: 140,
          bottom: 300,
          textAlign: 'center',
          direction: project.direction
        }}
      >
        <div style={{ fontSize: 58, fontWeight: 850, color: textColor }}>{scene.title}</div>
        <div style={{ fontSize: 28, color: `${textColor}99`, marginTop: 24 }}>
          {scene.subtitle || project.brand.tagline}
        </div>
      </div>
    </SceneShell>
  );
}

function CallToAction({ scene, project }: Props) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = findAsset(project, project.brand.logoAssetId);
  const p = smooth(frame, fps, 5);
  const accent = scene.accent || project.brand.accentColor || '#d8b56b';
  const secondary = project.brand.secondaryColor || '#2563eb';
  const icon = scene.icon || 'rocket';

  return (
    <SceneShell scene={scene} project={project}>
      <Atmosphere scene={{ ...scene, backgroundStyle: scene.backgroundStyle || 'aurora' }} project={project} />
      <Grade />

      {/* Top Header Logo or Eyebrow */}
      <div
        style={{
          position: 'absolute',
          left: 70,
          right: 70,
          top: 90,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          opacity: p
        }}
      >
        <div style={{ fontSize: 24, color: accent, fontWeight: 800 }}>{scene.eyebrow}</div>
        {logo && <Img src={mediaSrc(logo)} style={{ width: 140, height: 80, objectFit: 'contain' }} />}
      </div>

      {/* Pulsating Shockwave Glow behind Button */}
      {[0, 1].map((ring) => (
        <div
          key={ring}
          style={{
            position: 'absolute',
            bottom: 200,
            left: '50%',
            width: 480 + ring * 120,
            height: 120 + ring * 60,
            borderRadius: 999,
            background: `radial-gradient(ellipse, ${accent}44, transparent 70%)`,
            transform: `translate(-50%, -50%) scale(${1 + Math.sin(frame / 12 + ring) * 0.1})`,
            filter: 'blur(20px)',
            pointerEvents: 'none'
          }}
        />
      ))}

      <CopyBlock scene={scene} project={project} position="middle" align="center" titleSize={98} />

      {/* Action CTA Button with Pulsing Glow & Animated Icon */}
      <div
        style={{
          position: 'absolute',
          bottom: 220,
          left: 160,
          right: 160,
          padding: '24px 44px',
          borderRadius: 999,
          border: `2px solid ${accent}`,
          background: `linear-gradient(135deg, ${accent}33, ${secondary}44)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
          fontSize: 32,
          fontWeight: 850,
          color: accent,
          boxShadow: `0 20px 60px ${accent}55`,
          opacity: p,
          transform: `translateY(${(1 - p) * 45}px)`
        }}
      >
        <MotionIcon name={icon} size={38} color={scene.iconColor || accent} glow delay={6} />
        <span>{scene.cta || project.brand.tagline || scene.subtitle || 'ابدأ الآن'}</span>
      </div>
    </SceneShell>
  );
}

const registry: Record<Scene['type'], React.FC<Props>> = {
  'cinematic-opening': CinematicOpening,
  'icon-badge': IconBadgeScene,
  'feature-cards': FeatureCardsScene,
  'comparison': ComparisonScene,
  'quote-highlight': QuoteHighlightScene,
  'video-text': VideoText,
  'kinetic-typography': KineticTypography,
  statistic: Statistic,
  process: Process,
  'split-showcase': SplitShowcase,
  'product-hero': ProductHero,
  'logo-reveal': LogoReveal,
  'call-to-action': CallToAction
};

export function SceneView(props: Props) {
  const Component = registry[props.scene.type] || IconBadgeScene;
  return <Component {...props} />;
}
