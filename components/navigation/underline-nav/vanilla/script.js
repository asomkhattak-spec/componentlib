(function () {
  var nav = document.querySelector('.un-nav');
  var links = Array.prototype.slice.call(nav.querySelectorAll('a'));

  function move(link) {
    nav.style.setProperty('--un-x', link.offsetLeft + 'px');
    // Unitless scale factor: the 1px bar stretches via scaleX (no layout).
    nav.style.setProperty('--un-w', String(link.offsetWidth));
  }

  links.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      links.forEach(function (l) { l.removeAttribute('aria-current'); });
      link.setAttribute('aria-current', 'page');
      move(link);
    });
  });

  move(nav.querySelector('[aria-current="page"]') || links[0]);
  window.addEventListener('resize', function () {
    move(nav.querySelector('[aria-current="page"]') || links[0]);
  });
})();
