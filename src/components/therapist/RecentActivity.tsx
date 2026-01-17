import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { StickyNote } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useEffect } from 'react';

export const RecentActivity = () => {
  const { recentActivities, addActivity } = useData();
  const { user } = useAuth();

  // Add login activity when component first mounts and user is authenticated
  useEffect(() => {
    const hasLoggedInThisSession = sessionStorage.getItem('login_activity_added');
    
    if (user && !hasLoggedInThisSession) {
      // Check if there's a login activity from this session already
      const hasRecentLogin = recentActivities.some(
        (act) => act.type === 'login' && Date.now() - act.timestamp < 60000 // Within last minute
      );

      if (!hasRecentLogin) {
        addActivity(`You just logged in as ${user.name || user.email}`, 'login');
        sessionStorage.setItem('login_activity_added', 'true');
      }
    }
  }, [user, addActivity, recentActivities]);
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.9, duration: 0.6 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-primary" />
            <CardTitle>Recent Activity</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  No recent activities yet. Start by adding a learner, scheduling a session, or completing an assessment.
                </p>
              </div>
            ) : (
              recentActivities.map((activity: any, index: number) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + index * 0.1, duration: 0.5 }}
                className="group p-4 rounded-2xl bg-background/60 backdrop-blur-sm border border-border/50 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start gap-3">
                  <div className={`h-3 w-3 rounded-full ${activity.color} mt-1.5 flex-shrink-0`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-relaxed">
                      {activity.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
