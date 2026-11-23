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
.fl-field {
  position: relative;
  width: min(100%, 300px);
  font-family: system-ui, sans-serif;
}
.fl-field input {
  width: 100%;
  box-sizing: border-box;
  padding: 1.1rem 0.9rem 0.5rem;
  font-size: 1rem;
  color: inherit;
  background: transparent;
  border: 1.5px solid #94a3b8;
  border-radius: 0.6rem;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.fl-field label {
  position: absolute;
  left: 0.9rem;
  top: 0.85rem;
  font-size: 1rem;
  color: #94a3b8;
  pointer-events: none;
  transform-origin: left top;
  transition: transform 0.18s, color 0.18s;
}
.fl-field input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgb(99 102 241 / 0.2);
}
.fl-field input:focus + label,
.fl-field input:not(:placeholder-shown) + label {
  transform: translateY(-0.55rem) scale(0.75);
  color: #6366f1;
}
@media (prefers-reduced-motion: reduce) {
  .fl-field input, .fl-field label { transition: none; }
}
</style>
