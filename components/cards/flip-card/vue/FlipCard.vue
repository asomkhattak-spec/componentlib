<template>
  <article class="fc-card" tabindex="0" aria-label="Flip card: hover or focus to reveal details">
    <div class="fc-inner">
      <div class="fc-face fc-front">
        <h3>Front</h3>
        <p>Hover or focus me</p>
      </div>
      <div class="fc-face fc-back">
        <h3>Back</h3>
        <p>Hidden details live here.</p>
      </div>
    </div>
  </article>
</template>

<style>
.fc-card {
  width: 240px;
  height: 240px;
  perspective: 900px;
  border-radius: 1rem;
}
.fc-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1);
}
.fc-card:hover .fc-inner,
.fc-card:focus-visible .fc-inner,
.fc-card:focus-within .fc-inner {
  transform: rotateY(180deg);
}
.fc-card:focus-visible { outline: 2px solid #6366f1; outline-offset: 4px; }
.fc-face {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  gap: 0.4rem;
  padding: 1.2rem;
  border-radius: 1rem;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  font-family: system-ui, sans-serif;
  text-align: center;
  color: #fff;
}
.fc-front { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
.fc-back { background: linear-gradient(135deg, #0f172a, #334155); transform: rotateY(180deg); }
.fc-face h3 { margin: 0; font-size: 1.2rem; }
.fc-face p { margin: 0; font-size: 0.85rem; opacity: 0.85; }
@media (prefers-reduced-motion: reduce) {
  .fc-inner { transition: none; }
}
</style>
