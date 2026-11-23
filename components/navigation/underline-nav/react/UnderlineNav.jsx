import { useLayoutEffect, useRef, useState } from 'react';

const LINKS = [
  { href: '#home', label: 'Home' },
  { href: '#work', label: 'Work' },
  { href: '#about', label: 'About' },
  { href: '#contact', label: 'Contact' },
];

export default function UnderlineNav() {
  const navRef = useRef(null);
  const [active, setActive] = useState(0);
  const [bar, setBar] = useState({ x: 0, w: 0 });

  useLayoutEffect(() => {
    const nav = navRef.current;
    const link = nav.querySelectorAll('a')[active];
    const update = () => setBar({ x: link.offsetLeft, w: link.offsetWidth });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [active]);

  return (
    <nav
      ref={navRef}
      className="un-nav"
      aria-label="Demo navigation"
      style={{ '--un-x': bar.x + 'px', '--un-w': bar.w + 'px' }}
    >
      {LINKS.map((l, i) => (
        <a
          key={l.href}
          href={l.href}
          aria-current={i === active ? 'page' : undefined}
          onClick={(e) => {
            e.preventDefault();
            setActive(i);
          }}
        >
          {l.label}
        </a>
      ))}
    </nav>
  );
}
