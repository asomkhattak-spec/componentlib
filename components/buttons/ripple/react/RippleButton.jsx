import { useRef } from 'react';

export default function RippleButton() {
  const ref = useRef(null);

  function onClick(e) {
    const btn = ref.current;
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
  }

  return (
    <button ref={ref} className="rp-btn" type="button" onClick={onClick}>
      Click me
    </button>
  );
}
