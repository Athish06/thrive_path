import { useState, useRef, useEffect, ReactNode } from 'react';
import { MagicHover } from './MagicHover';
import { gsap } from 'gsap';
import './HorizontalDropdown.css';

export interface DropdownItem {
  label: string;
  action: () => void;
  icon: ReactNode;
}

interface HorizontalDropdownProps {
  button: ReactNode;
  items: DropdownItem[];
  theme: 'light' | 'dark';
  onToggle?: (isOpen: boolean) => void;
}

export default function HorizontalDropdown({ button, items, theme, onToggle }: HorizontalDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggle = (forceState?: boolean) => {
    const newState = typeof forceState === 'boolean' ? forceState : !isOpen;
    setIsOpen(newState);
    onToggle?.(newState);
  };

  useEffect(() => {
    const menu = menuRef.current;
    const menuItems = itemsRef.current.filter(Boolean);

    if (!menu) return;

    if (isOpen) {
      gsap.set(menu, { display: 'flex' });
      gsap.fromTo(
        menu,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power3.out' }
      );
      gsap.fromTo(
        menuItems,
        { opacity: 0, y: -15 },
        {
          opacity: 1,
          y: 0,
          duration: 0.3,
          stagger: 0.08,
          ease: 'power3.out',
          delay: 0.1,
        }
      );
    } else {
      gsap.to(menuItems, {
        opacity: 0,
        y: -15,
        duration: 0.2,
        stagger: 0.05,
        ease: 'power3.in',
      });
      gsap.to(menu, {
        opacity: 0,
        y: -10,
        duration: 0.2,
        ease: 'power3.in',
        delay: 0.15,
        onComplete: () => {
          gsap.set(menu, { display: 'none' });
        },
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        handleToggle(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="horizontal-dropdown" ref={dropdownRef}>
      <div onClick={() => handleToggle()}>{button}</div>
      <div ref={menuRef} className="dropdown-menu-items">
        {items.map((item, idx) => (
          <MagicHover
            key={idx}
            glowColor={theme === 'dark' ? '#6d28d9' : '#a78bfa'}
          >
            <div
              ref={(el) => (itemsRef.current[idx] = el)}
              className="dropdown-item"
            >
              <button onClick={item.action} className="dropdown-button">
                {item.icon}
                <span>{item.label}</span>
              </button>
            </div>
          </MagicHover>
        ))}
      </div>
    </div>
  );
}
