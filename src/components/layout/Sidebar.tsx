import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from '../../hooks/useSidebar';
import { cn } from '../../lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import {
  Home,
  Users,
  BarChart3,
  Settings,
  Baby,
  BookOpen,
  Target,
  ChevronRight,
  GraduationCap,
  Calendar,
  Layers,
  HeadphonesIcon,
  PanelLeftClose,
  PanelRightClose,
} from 'lucide-react';

interface MenuItemType {
  icon: React.ComponentType<any>;
  label: string;
  path: string;
  submenu?: { label: string; path: string }[];
}

interface MenuSectionType {
  title: string;
  items: MenuItemType[];
}

const therapistMenuItems: MenuSectionType[] = [
  {
    title: "Overview",
    items: [
      { 
        icon: Home, 
        label: 'Dashboard', 
        path: '/dashboard' 
      },
      
    ]
  },
  {
    title: "Little Learners",
    items: [
      { 
        icon: Users, 
        label: 'My Caseload', 
        path: '/learners',
        submenu: [
          { label: 'All Learners', path: '/learners' },
          { label: 'My Learners', path: '/learners/my-learners' },
          { label: 'Temporary Enrollment', path: '/learners/temp-students' },
          { label: 'Activities', path: '/activities' },
        ]
      },
      { 
        icon: GraduationCap, 
        label: 'Assessment Tools', 
        path: '/assessments' 
      },
      
    ]
  },
  {
    title: "Management",
    items: [
      { 
        icon: Calendar, 
        label: 'Sessions', 
        path: '/sessions'
      },
      { 
        icon: Layers, 
        label: 'Active Sessions', 
        path: '/sessions/active'
      },
      { 
        icon: BarChart3, 
        label: 'Progress Analysis', 
        path: '/progress-analysis' 
      },
    ]
  }
];

const parentMenuItems: MenuSectionType[] = [
  {
    title: "Home",
    items: [
      { 
        icon: Home, 
        label: 'Dashboard', 
        path: '/dashboard' 
      },
      { 
        icon: Baby, 
        label: 'My Little Learner', 
        path: '/child' 
      },
    ]
  },
  {
    title: "Learning & Progress",
    items: [
      { 
        icon: BarChart3, 
        label: 'Progress Reports', 
        path: '/progress' 
      },
      { 
        icon: BookOpen, 
        label: 'Homework & Activities', 
        path: '/homework' 
      },
      { 
        icon: Target, 
        label: 'Goals & Milestones', 
        path: '/goals' 
      },
    ]
  },
  {
    title: "Communication",
    items: [
      { 
        icon: HeadphonesIcon, 
        label: 'Therapist Messages', 
        path: '/messages' 
      },
      { 
        icon: Calendar, 
        label: 'Appointments', 
        path: '/appointments' 
      },
    ]
  }
];

const SidebarMenu = ({ items, title }: MenuSectionType) => {
  const { isOpen } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const [openSubmenu, setOpenSubmenu] = React.useState<string | null>(null);

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="space-y-1">
      <AnimatePresence>
        {isOpen && (
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="px-4 text-sm font-semibold text-primary/80 tracking-wider"
          >
            {title}
          </motion.h2>
        )}
      </AnimatePresence>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.label}>
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    onClick={() => item.submenu ? setOpenSubmenu(openSubmenu === item.label ? null : item.label) : navigate(item.path)}
                    className={cn(
                      'flex items-center p-2 mx-2 rounded-lg cursor-pointer transition-colors',
                      'hover:bg-accent/80 hover:text-white',
                      isActive(item.path) && 'bg-accent text-white shadow-lg'
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <AnimatePresence>
                      {isOpen && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="ml-3 whitespace-nowrap"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {item.submenu && isOpen && (
                      <ChevronRight
                        className={cn('ml-auto h-4 w-4 transition-transform',
                          openSubmenu === item.label && 'rotate-90'
                        )}
                      />
                    )}
                  </div>
                </TooltipTrigger>
                {!isOpen && <TooltipContent side="right">{item.label}</TooltipContent>}
              </Tooltip>
            </TooltipProvider>
            {item.submenu && openSubmenu === item.label && isOpen && (
              <ul className="pl-8 mt-1 space-y-1">
                {item.submenu.map(subItem => (
                  <li key={subItem.label} onClick={() => navigate(subItem.path)} className={cn(
                    'p-2 rounded-lg cursor-pointer text-sm',
                    'hover:bg-accent/20',
                    location.pathname === subItem.path && 'text-accent font-semibold'
                  )}>
                    {subItem.label}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export const AppSidebar: React.FC = () => {
  const { user } = useAuth();
  const { isOpen, toggle } = useSidebar();
  const menuItems = user?.role === 'therapist' ? therapistMenuItems : parentMenuItems;

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 260 : 72 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="hidden md:flex flex-col h-screen bg-surface border-r border-border fixed top-0 left-0 z-40"
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="font-bold text-lg"
          >
            ThrivePath
          </motion.div>
        )}
        </AnimatePresence>
        <button onClick={toggle} className="p-1 rounded-full hover:bg-accent/20">
          {isOpen ? <PanelLeftClose /> : <PanelRightClose />}
        </button>
      </div>
      <nav className="flex-1 p-2 space-y-4 overflow-y-auto">
        {menuItems.map(section => <SidebarMenu key={section.title} {...section} />)}
      </nav>
      <div className="p-4 border-t border-border">
        <SidebarMenu items={[{ icon: Settings, label: 'Settings', path: '/settings' }]} title="" />
      </div>
    </motion.aside>
  );
};