import React from 'react';

export default function VideoBackground() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, width: '100%', height: '100%',
        overflow: 'hidden', zIndex: -1,
      }}
    >
      <iframe
        src="https://www.youtube.com/embed/pmzfmoe7Jmw?autoplay=1&mute=1&loop=1&playlist=pmzfmoe7Jmw&controls=0&showinfo=0&modestbranding=1&rel=0&iv_load_policy=3"
        title="Background Video"
        allow="autoplay; encrypted-media"
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: '177.77777778vh',
          height: '56.25vw',
          minHeight: '100vh',
          minWidth: '100vw',
          transform: 'translate(-50%, -50%)',
          border: 'none',
          pointerEvents: 'none',
        }}
      />
      {/* Lighter overlay for better visibility */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(10,14,23,0.7), rgba(10,14,23,0.82))',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
