import React from 'react';

/**
 * Tamil Nadu Government Emblem
 *
 * The actual Tamil Nadu Government emblem is stored in:
 * public/tn-government-emblem.png
 *
 * Usage:
 * <TnEmblem />
 * <TnEmblem size={60} />
 * <TnEmblem size={100} opacity={0.5} />
 */
export default function TnEmblem({
  size = 40,
  className = '',
  opacity = 1,
}) {
  return (
    <img
      src="/Emblem_of_Tamil_Nadu.svg"
      alt="Tamil Nadu Government Emblem"
      className={className}
      style={{
        width: `${size}px`,
        height: 'auto',
        opacity: opacity,
        objectFit: 'contain',
        display: 'block',
      }}
    />
  );
}