document.querySelector('.rp-btn').addEventListener('click', function (e) {
  var rect = this.getBoundingClientRect();
  var size = Math.max(rect.width, rect.height);
  var ripple = document.createElement('span');
  ripple.className = 'rp-ripple';
  ripple.style.width = ripple.style.height = size + 'px';
  // Keyboard clicks report (0,0): center the ripple instead.
  var x = e.clientX ? e.clientX - rect.left : rect.width / 2;
  var y = e.clientY ? e.clientY - rect.top : rect.height / 2;
  ripple.style.left = x - size / 2 + 'px';
  ripple.style.top = y - size / 2 + 'px';
  this.appendChild(ripple);
  ripple.addEventListener('animationend', function (e) {
    // Two clocks run (grow 0.5s, fade 1s) — remove only after the fade ends.
    if (e.animationName === 'rp-fade') ripple.remove();
  });
});
