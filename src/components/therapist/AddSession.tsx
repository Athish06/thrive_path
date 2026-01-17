import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Plus, ArrowRight } from 'lucide-react';

export const AddSession = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.6 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Add New Session</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Quickly schedule a new session for any learner.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-medium hover:shadow-lg transition-all duration-300"
          >
            <Plus className="h-4 w-4" />
            Schedule Session
            <ArrowRight className="h-4 w-4" />
          </motion.button>
        </CardContent>
      </Card>
    </motion.div>
  );
};
