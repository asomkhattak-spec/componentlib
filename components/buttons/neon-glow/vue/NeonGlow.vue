<template>
  <button class="ng-btn" type="button">Launch</button>
</template>

<style>
.ng-btn {
  --ng: #22d3ee;
  padding: 0.8rem 2.4rem;
  font: 600 1rem/1 system-ui, sans-serif;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ng);
  background: transparent;
  border: 2px solid var(--ng);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: color 0.25s, background-color 0.25s, box-shadow 0.25s;
}
.ng-btn:hover,
.ng-btn:focus-visible {
  color: #06121a;
  background: var(--ng);
  box-shadow: 0 0 12px var(--ng), 0 0 42px color-mix(in srgb, var(--ng) 55%, transparent);
}
.ng-btn:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
.ng-btn:active { transform: translateY(1px); }
@media (prefers-reduced-motion: reduce) {
  .ng-btn { transition: none; }
}
</style>
