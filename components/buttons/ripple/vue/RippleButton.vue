<template>
  <button ref="btn" class="rp-btn" type="button" @click="onClick">Click me</button>
</template>

<script>
export default {
  methods: {
    onClick(e) {
      const btn = this.$refs.btn;
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const ripple = document.createElement('span');
      ripple.className = 'rp-ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      const x = e.clientX ? e.clientX - rect.left : rect.width / 2;
      const y = e.clientY ? e.clientY - rect.top : rect.height / 2;
      ripple.style.left = x - size / 2 + 'px';
      ripple.style.top = y - size / 2 + 'px';
      btn.appendChild(ripple);
      ripple.addEventListener('animationend', (ev) => {
        if (ev.animationName === 'rp-fade') ripple.remove();
      });
    },
  },
};
</script>

<style>
/* Click-position ripple — technique after "Brown Kangaroo" by SelfMadeSystem
   (uiverse.io/SelfMadeSystem/brown-kangaroo-43, MIT). Original: a grid of
   cells whose ::after grows 0 -> 13em in 0.5s ease-out while opacity fades
   over 1s, isolation: isolate keeps layers inside the button. Rebuilt with
   a single positioned span per click (exact pointer coordinates, keyboard
   centered) running the same two-clock timing: fast growth, slow fade. */
.rp-btn {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  padding: 0.8rem 2.2rem;
  font: 600 1rem/1 system-ui, sans-serif;
  color: #fff;
  background: hsl(218 68% 52%);
  border: 0;
  border-radius: 0.5rem;
  cursor: pointer;
  box-shadow: 1px 2px 4px rgb(0 0 0 / 0.45);
  transition: background-color 0.2s;
}
.rp-btn:hover { background: hsl(218 68% 47%); }
.rp-btn:focus-visible { outline: 2px solid hsl(218 68% 52%); outline-offset: 3px; }

.rp-ripple {
  position: absolute;
  border-radius: 50%;
  background: hsl(218 68% 65%);
  transform: scale(0);
  pointer-events: none;
  animation:
    rp-grow 0.5s cubic-bezier(0, 0, 0.2, 1) forwards,
    rp-fade 1s ease-out forwards;
}
@keyframes rp-grow {
  to { transform: scale(3); }
}
@keyframes rp-fade {
  0%, 40% { opacity: 1; }
  100% { opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .rp-ripple { animation-duration: 0.01s, 0.01s; }
}</style>
