import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { BookOpen, Clock, CheckCircle, Upload, FileText, Filter } from 'lucide-react';

export const HomeworkManager: React.FC = () => {
  const { homework, updateHomework } = useData();
  const [filter, setFilter] = useState('all');
  const [selectedHomework, setSelectedHomework] = useState<string | null>(null);

  const filteredHomework = homework.filter(hw => {
    if (filter === 'all') return true;
    if (filter === 'due_soon') {
      const dueDate = new Date(hw.dueDate);
      const today = new Date();
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 3 && diffDays >= 0;
    }
    return hw.status === filter;
  });

  const handleStatusUpdate = (id: string, newStatus: 'not_started' | 'in_progress' | 'completed') => {
    updateHomework(id, { status: newStatus });
  };

  const handleNotesUpdate = (id: string, notes: string) => {
    updateHomework(id, { parentNotes: notes });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'not_started': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'Overdue', color: 'text-red-600' };
    if (diffDays === 0) return { text: 'Due today', color: 'text-orange-600' };
    if (diffDays === 1) return { text: 'Due tomorrow', color: 'text-yellow-600' };
    return { text: `Due in ${diffDays} days`, color: 'text-gray-600' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Homework Manager</h1>
        <p className="text-gray-600 mt-1">Track and manage {homework[0]?.learnerId ? "Emma's" : "your child's"} homework assignments</p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All ({homework.length})
            </button>
            <button
              onClick={() => setFilter('due_soon')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'due_soon' 
                  ? 'bg-orange-100 text-orange-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Due Soon
            </button>
            <button
              onClick={() => setFilter('in_progress')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'in_progress' 
                  ? 'bg-yellow-100 text-yellow-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'completed' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Completed
            </button>
          </div>
        </div>
      </div>

      {/* Homework Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredHomework.map((hw) => {
          const dueInfo = getDaysUntilDue(hw.dueDate);
          return (
            <div key={hw.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{hw.title}</h3>
                  <p className="text-gray-600 mb-3">{hw.description}</p>
                  
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className={dueInfo.color}>{dueInfo.text}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(hw.status)}`}>
                      {hw.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>

              {/* Status Update Buttons */}
              <div className="flex space-x-2 mb-4">
                <button
                  onClick={() => handleStatusUpdate(hw.id, 'not_started')}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    hw.status === 'not_started' 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-red-50'
                  }`}
                >
                  Not Started
                </button>
                <button
                  onClick={() => handleStatusUpdate(hw.id, 'in_progress')}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    hw.status === 'in_progress' 
                      ? 'bg-yellow-100 text-yellow-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-yellow-50'
                  }`}
                >
                  In Progress
                </button>
                <button
                  onClick={() => handleStatusUpdate(hw.id, 'completed')}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                    hw.status === 'completed' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-green-50'
                  }`}
                >
                  Completed
                </button>
              </div>

              {/* Resources */}
              {hw.resources && hw.resources.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Resources:</p>
                  <div className="space-y-1">
                    {hw.resources.map((resource, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm text-blue-600">
                        <FileText className="h-4 w-4" />
                        <span>{resource}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Parent Notes */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-900">
                  Your Notes:
                </label>
                <textarea
                  value={hw.parentNotes || ''}
                  onChange={(e) => handleNotesUpdate(hw.id, e.target.value)}
                  placeholder="Add notes about progress, challenges, or observations..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  rows={3}
                />
              </div>

              {/* Upload Evidence Button */}
              <button className="w-full mt-4 flex items-center justify-center space-x-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Upload className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-600">Upload Photo/Video Evidence</span>
              </button>
            </div>
          );
        })}
      </div>

      {filteredHomework.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl">
          <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No homework found</h3>
          <p className="text-gray-600">
            {filter === 'all' 
              ? 'No homework assignments have been given yet'
              : `No homework matches the "${filter.replace('_', ' ')}" filter`
            }
          </p>
        </div>
      )}
    </div>
  );
};