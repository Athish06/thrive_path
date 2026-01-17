import { useState, useRef, useEffect, ReactNode } from 'react';
import { gsap } from 'gsap';
import './BubbleMenu.css';

export interface MenuItem {
  label: string;
  action: () => void;
  icon: ReactNode;
}

interface BubbleMenuProps {
  button: ReactNode;
  items: MenuItem[];
}

export default function BubbleMenu({ button, items }: BubbleMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLLIElement | null)[]>([]);

  const handleToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    const menu = menuRef.current;
    const menuItems = itemsRef.current.filter(Boolean);

    if (!menu) return;

    if (isMenuOpen) {
      gsap.set(menu, { display: 'flex' });
      gsap.fromTo(
        menu,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power3.out' }
      );
      gsap.fromTo(
        menuItems,
        { opacity: 0, x: -15 },
        {
          opacity: 1,
          x: 0,
          duration: 0.3,
          stagger: 0.07,
          ease: 'power3.out',
          delay: 0.1,
        }
      );
    } else {
      gsap.to(menu, {
        opacity: 0,
        y: -20,
        duration: 0.3,
        ease: 'power3.in',
        onComplete: () => {
          gsap.set(menu, { display: 'none' });
        },
      });
    }
  }, [isMenuOpen]);

  return (
    <div className="bubble-menu">
      <div onClick={handleToggle}>{button}</div>
      <div ref={menuRef} className="bubble-menu-items">
        <ul className="pill-list">
          {items.map((item, idx) => (
            <li
              key={idx}
              ref={(el) => (itemsRef.current[idx] = el)}
              className="pill-col"
            >
              <button onClick={item.action} className="pill-link">
                {item.icon}
                <span className="pill-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
