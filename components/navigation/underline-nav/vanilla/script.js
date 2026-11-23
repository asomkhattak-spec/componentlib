(function () {
  var nav = document.querySelector('.un-nav');
  var links = Array.prototype.slice.call(nav.querySelectorAll('a'));

  function move(link) {
    nav.style.setProperty('--un-x', link.offsetLeft + 'px');
    nav.style.setProperty('--un-w', link.offsetWidth + 'px');
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
