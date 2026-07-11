import React, { useRef, useState, useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { apiFetch } from '../api/api';

import { getCachedItem, setCachedItem } from '../utils/idb';

/**
 * Lazy-loading player photo component.
 * 
 * Uses IntersectionObserver to fetch the player's photo only when
 * the element scrolls into the viewport — prevents hundreds of
 * simultaneous API calls when the player list loads.
 * 
 * Props:
 *   playerId     – the player's database ID
 *   playerName   – used as alt text and initials fallback
 *   imageUrl     - optional direct base64 image data (skips fetch if provided)
 *   imageUrlHash - used for cache invalidation
 *   size         – CSS size string (default '40px')
 *   borderRadius – CSS border-radius (default '50%' for circle)
 *   style        – additional inline styles
 */
const PlayerPhoto = ({ playerId, playerName, imageUrl: propImageUrl = null, imageUrlHash, size = '40px', borderRadius = '50%', style = {} }) => {
  const { city } = useContext(AppContext);
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState(false);
  const ref = useRef(null);

  // Sync state with propImageUrl or reset when playerId/propImageUrl changes
  useEffect(() => {
    if (propImageUrl) {
      setImageUrl(propImageUrl);
      setError(false);
    } else {
      setImageUrl(null);
      setError(false);
    }
  }, [propImageUrl, playerId]);

  useEffect(() => {
    // If a direct imageUrl prop is provided, skip lazy loading from endpoint
    if (propImageUrl) return;
    if (!playerId || !city) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting) {
          observer.disconnect();

          const cacheKey = `player_photo_${playerId}_${imageUrlHash || 'none'}`;
          
          if (imageUrlHash) {
            const cached = await getCachedItem(cacheKey);
            if (cached) {
              setImageUrl(cached);
              return;
            }
          }

          apiFetch(`/api/${city}/players/${playerId}/photo`)
            .then((data) => {
              if (data.imageUrl) {
                setImageUrl(data.imageUrl);
                setCachedItem(cacheKey, data.imageUrl);
              } else {
                setError(true);
              }
            })
            .catch(() => setError(true));
        }
      },
      { rootMargin: '100px' }  // start loading 100px before entering viewport
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [playerId, city, propImageUrl, imageUrlHash]);

  const initials = playerName
    ? playerName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const containerStyle = {
    width: size,
    height: size,
    borderRadius,
    overflow: 'hidden',
    flexShrink: 0,
    background: 'rgba(255,255,255,0.05)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `calc(${size} * 0.35)`,
    fontWeight: '700',
    color: 'var(--color-primary)',
    border: '1px solid rgba(255,255,255,0.1)',
    position: 'relative',
    ...style,
  };

  return (
    <div ref={ref} style={containerStyle}>
      {imageUrl && !error ? (
        <img
          src={imageUrl}
          alt={playerName}
          onError={() => setError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
};

export default PlayerPhoto;

