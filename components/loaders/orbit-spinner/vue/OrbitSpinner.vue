<template>
  <div class="os-spinner" role="status" aria-label="Loading">
    <div class="os-arm"></div>
    <div class="os-arm"></div>
    <div class="os-arm"></div>
  </div>
</template>

<style>
.os-spinner {
  --os-size: 56px;
  --os-dot: 12px;
  --os-color: #6366f1;
  position: relative;
  width: var(--os-size);
  height: var(--os-size);
}
.os-spinner .os-arm {
  position: absolute;
  inset: 0;
  animation: os-spin 1.4s linear infinite;
}
.os-spinner .os-arm:nth-child(2) { animation-delay: -0.18s; opacity: 0.7; }
.os-spinner .os-arm:nth-child(3) { animation-delay: -0.36s; opacity: 0.45; }
.os-spinner .os-arm::before {
  content: "";
  position: absolute;
  top: 0;
  left: calc(50% - var(--os-dot) / 2);
  width: var(--os-dot);
  height: var(--os-dot);
  border-radius: 50%;
  background: var(--os-color);
}
@keyframes os-spin {
  to { transform: rotate(360deg); }
}
@media (prefers-reduced-motion: reduce) {
  .os-spinner .os-arm { animation-duration: 3s; }
}
</style>
