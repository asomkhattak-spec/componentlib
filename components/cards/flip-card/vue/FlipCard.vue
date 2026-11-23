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
/* Double-axis 3D flip — technique after "Cold Frog" by IWhat1
   (uiverse.io/IWhat1/cold-frog-10, MIT). Original: rotateY(180deg) +
   rotateZ(180deg) over 1500ms, back face pre-rotated on both axes,
   backface-visibility hidden, hot pink -> sky gradient. Rebuilt: same
   double rotation, house out-quint curve, keyboard focus parity. */
.fc-card {
  width: 240px;
  height: 280px;
  perspective: 900px;
  border-radius: 2rem;
}
.fc-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 1.5s cubic-bezier(0.23, 1, 0.32, 1);
}
.fc-card:hover .fc-inner,
.fc-card:focus-visible .fc-inner,
.fc-card:focus-within .fc-inner {
  transform: rotateY(180deg) rotateZ(180deg);
}
.fc-card:focus-visible { outline: 2px solid #0aa4f8; outline-offset: 4px; }
.fc-face {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1.2rem;
  padding: 1.2rem;
  border-radius: 2rem;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  box-shadow: 0 0 10px 2px rgb(50 50 50 / 0.5);
  background: linear-gradient(-135deg, #f80a4a, #0aa4f8);
  font-family: system-ui, sans-serif;
  text-align: center;
  color: #fff;
}
.fc-back { transform: rotateY(180deg) rotateZ(180deg); }
.fc-face h3 { margin: 0; font-size: 1.6rem; font-weight: 700; }
.fc-face p { margin: 0; font-size: 0.9rem; opacity: 0.9; }
@media (prefers-reduced-motion: reduce) {
  .fc-inner { transition: none; }
}</style>
