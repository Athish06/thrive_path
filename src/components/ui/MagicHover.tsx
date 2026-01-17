import { useRef, useEffect, useCallback, ReactNode } from 'react';
import { gsap } from 'gsap';
import './MagicHover.css';

const DEFAULT_PARTICLE_COUNT = 10;
const DEFAULT_GLOW_COLOR = '167, 139, 250'; // violet-400

const createParticleElement = (x: number, y: number, color: string) => {
  const el = document.createElement('div');
  el.className = 'particle';
  el.style.cssText = `
    background: rgba(${color}, 1);
    box-shadow: 0 0 6px rgba(${color}, 0.6);
    left: ${x}px;
    top: ${y}px;
  `;
  return el;
};

interface MagicHoverProps {
  children: ReactNode;
  className?: string;
  particleCount?: number;
  glowColor?: string;
}

export const MagicHover = ({
  children,
  className = '',
  particleCount = DEFAULT_PARTICLE_COUNT,
  glowColor = DEFAULT_GLOW_COLOR,
}: MagicHoverProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement[]>([]);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const isHoveredRef = useRef(false);

  const clearAllParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    particlesRef.current.forEach(particle => {
      gsap.to(particle, {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        ease: 'back.in(1.7)',
        onComplete: () => particle.remove(),
      });
    });
    particlesRef.current = [];
  }, []);

  const animateParticles = useCallback(() => {
    if (!containerRef.current || !isHoveredRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();

    for (let i = 0; i < particleCount; i++) {
      const timeoutId = setTimeout(() => {
        if (!isHoveredRef.current || !containerRef.current) return;
        const particle = createParticleElement(Math.random() * width, Math.random() * height, glowColor);
        containerRef.current.appendChild(particle);
        particlesRef.current.push(particle);

        gsap.fromTo(particle, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' });
        gsap.to(particle, { x: (Math.random() - 0.5) * 60, y: (Math.random() - 0.5) * 60, duration: 2 + Math.random() * 2, ease: 'power1.inOut', repeat: -1, yoyo: true });
        gsap.to(particle, { opacity: 0, duration: 1.5 + Math.random() * 1.5, ease: 'power2.inOut', delay: 0.5, onComplete: () => particle.remove() });
      }, i * 100);
      timeoutsRef.current.push(timeoutId);
    }
  }, [particleCount, glowColor]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const handleMouseEnter = () => {
      isHoveredRef.current = true;
      animateParticles();
    };

    const handleMouseLeave = () => {
      isHoveredRef.current = false;
      clearAllParticles();
      element.style.setProperty('--glow-intensity', '0');
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const relativeX = ((e.clientX - rect.left) / rect.width) * 100;
      const relativeY = ((e.clientY - rect.top) / rect.height) * 100;
      element.style.setProperty('--glow-x', `${relativeX}%`);
      element.style.setProperty('--glow-y', `${relativeY}%`);
      element.style.setProperty('--glow-intensity', '1');
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mousemove', handleMouseMove);

    return () => {
      isHoveredRef.current = false;
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mousemove', handleMouseMove);
      clearAllParticles();
    };
  }, [animateParticles, clearAllParticles]);

  return (
    <div ref={containerRef} className={`${className} particle-container`}>
      {children}
    </div>
  );
};
