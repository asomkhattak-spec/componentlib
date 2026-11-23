<template>
  <div class="os-spinner" role="status" aria-label="Loading">
    <div v-for="i in 8" :key="i" class="os-arm"></div>
  </div>
</template>

<style>
/* Radial pulse wave — technique after "Serious Turkey" by abrahamcalsin
   (uiverse.io/abrahamcalsin/serious-turkey-52, MIT). Original: eight full-
   size arms rotated 45deg apart, each dot pulses scale(0)->scale(1) with
   opacity 0.5->1, negative delays of speed * -0.125 steps make the wave
   chase itself around the ring. Rebuilt with the same math, custom-prop
   driven size/speed/color, soft glow kept. */
.os-spinner {
  --os-size: 3rem;
  --os-speed: 0.9s;
  --os-color: #6366f1;
  position: relative;
  width: var(--os-size);
  height: var(--os-size);
}
.os-arm {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}
.os-arm::before {
  content: "";
  width: 20%;
  height: 20%;
  border-radius: 50%;
  background: var(--os-color);
  transform: scale(0);
  opacity: 0.5;
  box-shadow: 0 0 20px rgb(99 102 241 / 0.3);
  animation: os-pulse calc(var(--os-speed) * 1.111) ease-in-out infinite;
}
.os-arm:nth-child(2) { transform: rotate(45deg); }
.os-arm:nth-child(2)::before { animation-delay: calc(var(--os-speed) * -0.875); }
.os-arm:nth-child(3) { transform: rotate(90deg); }
.os-arm:nth-child(3)::before { animation-delay: calc(var(--os-speed) * -0.75); }
.os-arm:nth-child(4) { transform: rotate(135deg); }
.os-arm:nth-child(4)::before { animation-delay: calc(var(--os-speed) * -0.625); }
.os-arm:nth-child(5) { transform: rotate(180deg); }
.os-arm:nth-child(5)::before { animation-delay: calc(var(--os-speed) * -0.5); }
.os-arm:nth-child(6) { transform: rotate(225deg); }
.os-arm:nth-child(6)::before { animation-delay: calc(var(--os-speed) * -0.375); }
.os-arm:nth-child(7) { transform: rotate(270deg); }
.os-arm:nth-child(7)::before { animation-delay: calc(var(--os-speed) * -0.25); }
.os-arm:nth-child(8) { transform: rotate(315deg); }
.os-arm:nth-child(8)::before { animation-delay: calc(var(--os-speed) * -0.125); }

@keyframes os-pulse {
  0%, 100% { transform: scale(0); opacity: 0.5; }
  50% { transform: scale(1); opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .os-arm::before { animation: none; transform: scale(0.7); opacity: 0.8; }
}</style>
