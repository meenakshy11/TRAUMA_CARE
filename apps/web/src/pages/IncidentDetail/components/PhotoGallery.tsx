/**
 * PhotoGallery.tsx
 *
 * Responsive photo grid for incident scene photos.
 * Clicking any thumbnail opens a full-screen lightbox with:
 *   • Previous / Next navigation
 *   • Keyboard left/right/Escape support
 *   • Upload metadata (by whom, when)
 *   • Download link for the original
 *
 * Props:
 *  photos — IncidentPhoto[] (presigned MinIO URLs)
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { IncidentPhoto } from '../IncidentDetailPage';

// ─── Component ────────────────────────────────────────────────────────────────

interface PhotoGalleryProps {
  photos: IncidentPhoto[];
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photos }) => {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const isOpen = lightboxIdx !== null;

  const openAt = (idx: number) => setLightboxIdx(idx);
  const close  = () => setLightboxIdx(null);

  const prev = useCallback(() => {
    setLightboxIdx((i) => (i === null ? null : i === 0 ? photos.length - 1 : i - 1));
  }, [photos.length]);

  const next = useCallback(() => {
    setLightboxIdx((i) => (i === null ? null : i === photos.length - 1 ? 0 : i + 1));
  }, [photos.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape')      close();
      if (e.key === 'ArrowLeft')   prev();
      if (e.key === 'ArrowRight')  next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, prev, next]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (photos.length === 0) {
    return <p style={emptyStyle}>No photos uploaded.</p>;
  }

  const current = lightboxIdx !== null ? photos[lightboxIdx] : null;

  return (
    <>
      {/* ── Grid ──────────────────────────────────────────────────────── */}
      <div style={gridStyle} role="list" aria-label="Scene photos">
        {photos.map((photo, idx) => (
          <button
            key={photo.id}
            style={thumbBtn}
            onClick={() => openAt(idx)}
            aria-label={`View photo ${idx + 1} of ${photos.length}, uploaded by ${photo.uploaded_by ?? 'unknown'}`}
            role="listitem"
          >
            <img
              src={photo.url}
              alt={`Scene photo ${idx + 1}`}
              style={thumbImg}
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect width="200" height="150" fill="%231e293b"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23475569" font-family="sans-serif" font-size="12">Photo unavailable</text></svg>';
              }}
            />
            <div style={thumbOverlay}>
              <div style={thumbMeta}>
                <span style={thumbIndex}>{idx + 1}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* ── Lightbox ──────────────────────────────────────────────────── */}
      {isOpen && current && (
        <div
          style={backdropStyle}
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${(lightboxIdx! + 1)} of ${photos.length}`}
          onClick={close}
        >
          {/* Lightbox panel */}
          <div style={lightboxPanel} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={lightboxHeader}>
              <span style={lightboxCounter}>
                {lightboxIdx! + 1} / {photos.length}
              </span>
              <div style={lightboxHeaderRight}>
                {/* Download link */}
                <a
                  href={current.url}
                  download={`incident-photo-${lightboxIdx! + 1}.jpg`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={downloadBtn}
                  title="Download photo"
                  aria-label="Download this photo"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DownloadIcon />
                </a>
                <button
                  style={closeBtn}
                  onClick={close}
                  aria-label="Close lightbox (Escape)"
                  title="Close (Escape)"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            {/* Main image */}
            <div style={imageArea}>
              {/* Prev button */}
              {photos.length > 1 && (
                <button
                  style={{ ...navBtn, left: 8 }}
                  onClick={prev}
                  aria-label="Previous photo (←)"
                  title="Previous (←)"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                </button>
              )}

              <img
                src={current.url}
                alt={`Scene photo ${lightboxIdx! + 1}`}
                style={lightboxImg}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />

              {/* Next button */}
              {photos.length > 1 && (
                <button
                  style={{ ...navBtn, right: 8 }}
                  onClick={next}
                  aria-label="Next photo (→)"
                  title="Next (→)"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              )}
            </div>

            {/* Footer: metadata */}
            <div style={lightboxFooter}>
              {current.uploaded_by && (
                <span style={metaItem}>
                  <UserIcon />
                  {current.uploaded_by}
                </span>
              )}
              <time
                dateTime={current.uploaded_at}
                style={metaItem}
                title={new Date(current.uploaded_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
              >
                <ClockIcon />
                {new Date(current.uploaded_at).toLocaleString('en-IN', {
                  timeZone: 'Asia/Kolkata',
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })} IST
              </time>
            </div>

            {/* Thumbnail strip */}
            {photos.length > 1 && (
              <div style={thumbStrip}>
                {photos.map((p, idx) => (
                  <button
                    key={p.id}
                    style={{
                      ...stripThumb,
                      outline: lightboxIdx === idx ? '2px solid #ef4444' : 'none',
                      outlineOffset: 2,
                      opacity: lightboxIdx === idx ? 1 : 0.5,
                    }}
                    onClick={() => setLightboxIdx(idx)}
                    aria-label={`Go to photo ${idx + 1}`}
                    aria-current={lightboxIdx === idx}
                  >
                    <img
                      src={p.url}
                      alt={`Thumbnail ${idx + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// ─── SVG helpers ──────────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 6,
};

const thumbBtn: React.CSSProperties = {
  position: 'relative',
  aspectRatio: '4/3',
  border: '1px solid #334155',
  borderRadius: 6,
  overflow: 'hidden',
  padding: 0,
  cursor: 'pointer',
  background: '#1e293b',
  transition: 'border-color 0.15s',
};

const thumbImg: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
  transition: 'transform 0.2s',
};

const thumbOverlay: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(0,0,0,0)',
  display: 'flex',
  alignItems: 'flex-end',
  padding: 6,
  transition: 'background 0.15s',
};

const thumbMeta: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
};

const thumbIndex: React.CSSProperties = {
  fontSize: 10,
  color: '#fff',
  fontWeight: 700,
  textShadow: '0 1px 2px rgba(0,0,0,0.8)',
};

const emptyStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#64748b',
  margin: 0,
};

const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.92)',
  zIndex: 2000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
};

const lightboxPanel: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: 12,
  width: '100%',
  maxWidth: 900,
  maxHeight: '95vh',
  overflow: 'hidden',
};

const lightboxHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  borderBottom: '1px solid #1e293b',
  flexShrink: 0,
};

const lightboxCounter: React.CSSProperties = {
  fontSize: 12,
  color: '#94a3b8',
  fontFamily: 'monospace',
  fontWeight: 600,
};

const lightboxHeaderRight: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const downloadBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  borderRadius: 6,
  border: '1px solid #334155',
  color: '#94a3b8',
  background: 'transparent',
  cursor: 'pointer',
  textDecoration: 'none',
  transition: 'border-color 0.15s, color 0.15s',
};

const closeBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  borderRadius: 6,
  border: '1px solid #334155',
  color: '#94a3b8',
  background: 'transparent',
  cursor: 'pointer',
  transition: 'border-color 0.15s, color 0.15s',
};

const imageArea: React.CSSProperties = {
  position: 'relative',
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#000',
  minHeight: 200,
  overflow: 'hidden',
};

const lightboxImg: React.CSSProperties = {
  maxWidth: '100%',
  maxHeight: '60vh',
  objectFit: 'contain',
  display: 'block',
};

const navBtn: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  width: 40,
  height: 40,
  borderRadius: '50%',
  background: 'rgba(0,0,0,0.5)',
  border: '1px solid #334155',
  color: '#f1f5f9',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  zIndex: 1,
  transition: 'background 0.15s',
};

const lightboxFooter: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  padding: '10px 16px',
  borderTop: '1px solid #1e293b',
  flexShrink: 0,
};

const metaItem: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  fontSize: 11,
  color: '#64748b',
};

const thumbStrip: React.CSSProperties = {
  display: 'flex',
  gap: 6,
  padding: '10px 16px',
  borderTop: '1px solid #1e293b',
  overflowX: 'auto',
  flexShrink: 0,
  scrollbarWidth: 'thin',
  scrollbarColor: '#334155 transparent',
};

const stripThumb: React.CSSProperties = {
  width: 52,
  height: 38,
  borderRadius: 4,
  overflow: 'hidden',
  flexShrink: 0,
  padding: 0,
  border: 'none',
  cursor: 'pointer',
  background: '#1e293b',
  transition: 'opacity 0.15s, outline 0.1s',
};

export default PhotoGallery;