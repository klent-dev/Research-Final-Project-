import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaGavel } from 'react-icons/fa';

export default function TopHeader() {
  const [isHidden, setIsHidden] = useState(false);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    function handleScroll() {
      const currentScrollY = window.scrollY || 0;
      const isScrollingDown = currentScrollY > lastScrollYRef.current;

      setIsHidden(isScrollingDown && currentScrollY > 80);
      lastScrollYRef.current = currentScrollY;
    }

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header className={`top-header ${isHidden ? 'top-header--hidden' : 'top-header--visible'}`}>
      <Link className="app-brand" to="/home" aria-label="CitizenWatch home">
        <span className="app-logo"><FaGavel aria-hidden="true" /></span>
        <span>
          <strong>CitizenWatch</strong>
        </span>
      </Link>

      <div className="top-header__actions">
        <Link className="citizen-avatar" to="/profile" aria-label="Citizen profile">C</Link>
      </div>
    </header>
  );
}
