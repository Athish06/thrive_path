import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import SplitText from '../ui/SplitText';
import { QuickActions } from './QuickActions';


interface HeroProps {
  isProfileOpen: boolean;
}

export const Hero: React.FC<HeroProps> = ({ isProfileOpen }) => {
  const { user } = useAuth();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.6 }}
      className="relative p-6"
    >
      <div className="relative flex justify-between items-center">
        <SplitText 
          tag="h1"
          text={`Welcome back, ${user?.name?.split(' ')[0] || 'Athish'}`}
          className="text-4xl font-bold text-foreground"
          textAlign="left"
        />
        {!isProfileOpen && <QuickActions />} 
              </div>
    </motion.div>
  );
};
