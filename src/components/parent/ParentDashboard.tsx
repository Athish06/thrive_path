import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Calendar, Trophy, BookOpen, Target, Star, CheckCircle } from 'lucide-react';

interface ParentDashboardProps {
  isProfileOpen: boolean;
}

export const ParentDashboard: React.FC<ParentDashboardProps> = ({ isProfileOpen }) => {
  // TODO: Use isProfileOpen to manage UI elements when needed
  React.useEffect(() => {
    if (isProfileOpen) {
      console.log('Profile dropdown is open in ParentDashboard');
    }
  }, [isProfileOpen]);
  const { user } = useAuth();
  const { littleLearners, homework } = useData();

  // For demo, assume the first learner belongs to this parent
  const child = littleLearners[0];
  const childHomework = homework.filter(hw => hw.learnerId === child?.id);
  const pendingHomework = childHomework.filter(hw => hw.status !== 'completed');

  const upcomingSession = child?.nextSession ? new Date(child.nextSession) : null;

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name?.split(' ')[0]}!</h1>
        <p className="text-purple-100 text-lg">Here's how {child?.name} is thriving today</p>
      </div>

      {/* Child Profile Card */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-6 mb-8">
          {child?.photo && (
            <img
              src={child.photo}
              alt={child.name}
              className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
            />
          )}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{child?.name}</h2>
            <p className="text-gray-600 text-lg">Age {child?.age}</p>
            <div className="flex items-center space-x-2 mt-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">{child?.progressPercentage}% Overall Progress</span>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <Trophy className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">Achievements</h3>
            <p className="text-2xl font-bold text-green-600">{child?.achievements.length}</p>
            <p className="text-sm text-gray-600">This month</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-xl">
            <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">Active Goals</h3>
            <p className="text-2xl font-bold text-blue-600">{child?.goals.length}</p>
            <p className="text-sm text-gray-600">In progress</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-xl">
            <BookOpen className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900">Homework</h3>
            <p className="text-2xl font-bold text-orange-600">{pendingHomework.length}</p>
            <p className="text-sm text-gray-600">Pending</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Next Session */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            <span>Next Session</span>
          </h3>
          {upcomingSession ? (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">
                    {upcomingSession.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h4>
                  <span className="text-blue-600 font-semibold">
                    {upcomingSession.toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                <p className="text-gray-600 text-sm">with Dr. Sarah Johnson</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Planned Activities:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Communication exercises</li>
                  <li>• Fine motor skill development</li>
                  <li>• Social interaction practice</li>
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">No upcoming sessions scheduled</p>
          )}
        </div>

        {/* Recent Achievements */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Trophy className="h-6 w-6 text-yellow-600" />
            <span>Recent Achievements</span>
          </h3>
          <div className="space-y-4">
            {child?.achievements.map((achievement) => (
              <div key={achievement.id} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2"></div>
                <div>
                  <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                  <p className="text-sm text-gray-600">{achievement.domain}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(achievement.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Goals */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Target className="h-6 w-6 text-purple-600" />
            <span>Current Goals</span>
          </h3>
          <div className="space-y-3">
            {child?.goals.map((goal, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span className="text-gray-800">{goal}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Homework Status */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-green-600" />
            <span>Homework Status</span>
          </h3>
          {pendingHomework.length > 0 ? (
            <div className="space-y-3">
              {pendingHomework.slice(0, 3).map((hw) => (
                <div key={hw.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{hw.title}</h4>
                    <p className="text-sm text-gray-600">Due: {new Date(hw.dueDate).toLocaleDateString()}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    hw.status === 'not_started' ? 'bg-red-100 text-red-800' :
                    hw.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {hw.status.replace('_', ' ')}
                  </div>
                </div>
              ))}
              <button className="w-full text-center py-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All Homework
              </button>
            </div>
          ) : (
            <div className="text-center py-6">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-gray-600">All homework completed!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};