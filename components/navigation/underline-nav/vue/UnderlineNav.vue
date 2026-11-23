<template>
  <nav ref="nav" class="un-nav" aria-label="Demo navigation"
       :style="{ '--un-x': bar.x + 'px', '--un-w': bar.w + 'px' }">
    <a v-for="(link, i) in links" :key="link.href" :href="link.href"
       :aria-current="i === active ? 'page' : null"
       @click.prevent="select(i)">{{ link.label }}</a>
  </nav>
</template>

<script>
export default {
  data() {
    return {
      links: [
        { href: '#home', label: 'Home' },
        { href: '#work', label: 'Work' },
        { href: '#about', label: 'About' },
        { href: '#contact', label: 'Contact' },
      ],
      active: 0,
      bar: { x: 0, w: 0 },
    };
  },
  mounted() {
    this.update();
    this.onResize = () => this.update();
    window.addEventListener('resize', this.onResize);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.onResize);
  },
  methods: {
    select(i) {
      this.active = i;
      this.$nextTick(this.update);
    },
    update() {
      const link = this.$refs.nav.querySelectorAll('a')[this.active];
      this.bar = { x: link.offsetLeft, w: link.offsetWidth };
    },
  },
};
</script>

<style>
.un-nav {
  --un-x: 0px;
  --un-w: 0px;
  position: relative;
  display: flex;
  gap: 0.4rem;
  padding: 0.4rem;
  font-family: system-ui, sans-serif;
  border-radius: 0.7rem;
  background: rgb(148 163 184 / 0.12);
}
.un-nav::after {
  content: "";
  position: absolute;
  bottom: 0.25rem;
  left: var(--un-x);
  width: var(--un-w);
  height: 3px;
  border-radius: 2px;
  background: #6366f1;
  transition: left 0.25s cubic-bezier(0.4, 0, 0.2, 1), width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.un-nav a {
  padding: 0.55rem 1.1rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: inherit;
  text-decoration: none;
  border-radius: 0.5rem;
  opacity: 0.65;
  transition: opacity 0.2s;
}
.un-nav a:hover { opacity: 0.9; }
.un-nav a[aria-current="page"] { opacity: 1; color: #6366f1; }
.un-nav a:focus-visible { outline: 2px solid #6366f1; outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) {
  .un-nav::after { transition: none; }
}
</style>
