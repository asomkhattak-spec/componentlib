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
      ripple.addEventListener('animationend', () => ripple.remove());
    },
  },
};
</script>

<style>
.rp-btn {
  position: relative;
  overflow: hidden;
  padding: 0.8rem 2.2rem;
  font: 600 1rem/1 system-ui, sans-serif;
  color: #fff;
  background: #6366f1;
  border: 0;
  border-radius: 0.6rem;
  cursor: pointer;
  box-shadow: 0 2px 8px rgb(99 102 241 / 0.4);
}
.rp-btn:focus-visible { outline: 2px solid #6366f1; outline-offset: 3px; }
.rp-ripple {
  position: absolute;
  border-radius: 50%;
  background: rgb(255 255 255 / 0.5);
  transform: scale(0);
  animation: rp-grow 0.55s ease-out forwards;
  pointer-events: none;
}
@keyframes rp-grow {
  to { transform: scale(3); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .rp-ripple { animation-duration: 0.01s; }
}
</style>
