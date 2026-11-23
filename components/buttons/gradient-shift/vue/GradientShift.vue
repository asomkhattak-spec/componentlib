<template>
  <span class="gs-wrap">
    <button class="gs-btn" type="button">
      <span class="gs-fill" aria-hidden="true"></span>
      <span class="gs-label">Get started</span>
    </button>
  </span>
</template>

<style>
/* Shifting gradient fill + hover bloom — technique after "Big Dolphin" (.bn)
   by Amir10Amir (uiverse.io/Amir10Amir/big-dolphin-56, MIT). Original animates
   background-position on a 600%-sized gradient and fades in a blurred copy on
   hover. Rebuilt: the gradient layer rotates via transform (compositor-safe),
   the glow is pre-blurred and only its opacity animates. */
.gs-wrap {
  --gs-ease: cubic-bezier(0.23, 1, 0.32, 1); /* Uiverse house ease-out-quint */
  position: relative;
  isolation: isolate;
  display: inline-block;
}

/* Pre-rendered glow: static blur, opacity-only transition (original:
   ::before filter blur(8px), opacity 0 -> 1 on hover). */
.gs-wrap::before {
  content: "";
  position: absolute;
  inset: -2px;
  border-radius: 999px;
  background: linear-gradient(115deg, #f43f5e, #a855f7, #3b82f6, #22d3ee, #f43f5e);
  filter: blur(14px);
  opacity: 0;
  z-index: -1;
  transition: opacity 0.3s ease-in-out;
}
.gs-wrap:hover::before,
.gs-wrap:focus-within::before {
  opacity: 1;
}

.gs-btn {
  position: relative;
  overflow: hidden;
  padding: 0.9rem 2.6rem;
  font: 700 1rem/1 system-ui, sans-serif;
  color: #fff;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  background: #141824;
  transition: scale 0.2s var(--gs-ease);
}
.gs-btn:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
.gs-wrap:active .gs-btn { scale: 0.97; }

/* Oversized rotating gradient disc clipped by the pill — same perpetual
   color shift as the original's background-position loop, zero repaints. */
.gs-fill {
  position: absolute;
  inset: -60%;
  background: linear-gradient(115deg, #f43f5e, #a855f7, #3b82f6, #22d3ee, #f43f5e);
  animation: gs-spin 5s linear infinite;
}
.gs-label { position: relative; }

@keyframes gs-spin {
  to { transform: rotate(1turn); }
}

@media (prefers-reduced-motion: reduce) {
  .gs-fill { animation: none; }
  .gs-wrap::before, .gs-btn { transition: none; }
}</style>
