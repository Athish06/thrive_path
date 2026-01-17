import * as React from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useSidebar } from '../../hooks/useSidebar';
import { useAuth } from '../../context/AuthContext';
import { Sun, Moon, Menu, Settings, LogOut, UserCircle, Palette } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { Dropdown, DropdownItem, DropdownSeparator } from '../ui/dropdown';
import { NotificationIcon } from '../notifications/NotificationIcon';

interface TopNavbarProps {
  isProfileOpen: boolean;
  onProfileToggle: (isOpen: boolean) => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ isProfileOpen, onProfileToggle }) => {
  const { isOpen: isSidebarOpen, toggleMobile } = useSidebar();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [hidden, setHidden] = React.useState(false);
    const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious();
    if (previous && latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  React.useEffect(() => {
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', systemTheme);
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  return (
    <motion.nav
      variants={{
        visible: { y: 0 },
        hidden: { y: '-100%' },
      }}
      animate={hidden ? 'hidden' : 'visible'}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      className={cn(
        'fixed top-0 left-0 right-0 z-30 transition-all duration-300',
        'md:left-72',
        isSidebarOpen ? 'md:left-[260px]' : 'md:left-[72px]'
      )}
    >
      <div className="mx-4 mt-4 p-4 rounded-2xl glass-card flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={toggleMobile} className="md:hidden p-2">
            <Menu />
          </button>
          <h1 className="text-lg font-semibold">Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-accent/20">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          {/* Notification Icon */}
          <NotificationIcon />

                    
          {/* Profile Dropdown */}
          <Dropdown 
            isOpen={isProfileOpen}
            onToggle={onProfileToggle}
            trigger={
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-accent/20 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              </motion.button>
            }
          >
            <div className="py-3">
              {/* User Info */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="px-4 py-4 border-b border-slate-100/50 dark:border-slate-700/50"
              >
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-white font-semibold">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {user?.role === 'therapist' ? 'Neural Therapist' : 'Parent Guardian'}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Menu Items */}
              <div className="py-2">
                <DropdownItem 
                  icon={<UserCircle size={16} />} 
                  onClick={handleProfile}
                  delay={0}
                >
                  Profile Settings
                </DropdownItem>
                <DropdownItem 
                  icon={<Settings size={16} />} 
                  onClick={handleSettings}
                  delay={1}
                >
                  Account Settings
                </DropdownItem>
                <DropdownItem 
                  icon={<Palette size={16} />} 
                  onClick={toggleTheme}
                  delay={2}
                >
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </DropdownItem>
              </div>

              <DropdownSeparator />

              <div className="py-2">
                <DropdownItem 
                  icon={<LogOut size={16} />} 
                  onClick={handleLogout}
                  variant="danger"
                  delay={3}
                >
                  Sign Out
                </DropdownItem>
              </div>
            </div>
          </Dropdown>
        </div>
      </div>
    </motion.nav>
  );
};
