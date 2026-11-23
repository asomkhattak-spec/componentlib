<template>
  <div class="fl-field">
    <input :id="id" type="email" placeholder=" " autocomplete="email">
    <label :for="id">Email address</label>
  </div>
</template>

<script>
let counter = 0;
export default {
  data() {
    return { id: 'fl-email-' + ++counter };
  },
};
</script>

<style>
/* Floating label chip — technique after "Gentle Dragon" by saidbl1
   (uiverse.io/saidbl1/gentle-dragon-92, MIT). Original: on focus/:valid the
   label shrinks to 0.7em, lifts onto the border, gains a filled chip
   background + border, letter-spacing collapses, 0.4s
   cubic-bezier(0.05, 0.81, 0, 0.93). Rebuilt: same motion with transform
   scale (no font-size interpolation), :not(:placeholder-shown) instead of
   :valid so it also floats when filled-but-invalid, real <label for>. */
.fl-field {
  --fl-accent: #ee8456;
  --fl-ease: cubic-bezier(0.05, 0.81, 0, 0.93); /* original curve, kept */
  --fl-bg: #f6f7f9;
  position: relative;
  width: min(100%, 300px);
  font-family: system-ui, sans-serif;
}
html[data-scheme="dark"] .fl-field { --fl-bg: #0b0e14; }

.fl-field input {
  width: 100%;
  box-sizing: border-box;
  padding: 15px 20px;
  font-size: 1rem;
  color: inherit;
  background: transparent;
  border: 1px solid var(--fl-accent);
  border-radius: 5px;
  outline: none;
}
.fl-field input:focus { box-shadow: 0 0 0 3px rgb(238 132 86 / 0.25); }

.fl-field label {
  position: absolute;
  left: 20px;
  top: 15px;
  padding: 0 5px;
  font-size: 1rem;
  letter-spacing: 0.1em;
  color: var(--fl-accent);
  pointer-events: none;
  transform-origin: left top;
  border: 1px solid transparent;
  border-radius: 2px;
  transition: transform 0.4s var(--fl-ease), letter-spacing 0.4s var(--fl-ease),
    background-color 0.4s var(--fl-ease), border-color 0.4s var(--fl-ease);
}
.fl-field input:focus + label,
.fl-field input:not(:placeholder-shown) + label {
  transform: translate(-6px, -24px) scale(0.7);
  letter-spacing: 0;
  background: var(--fl-bg);
  border-color: var(--fl-accent);
}
@media (prefers-reduced-motion: reduce) {
  .fl-field input, .fl-field label { transition: none; }
}</style>
