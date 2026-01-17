import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import { X, FileText, Plus, Save, AlertCircle, ArrowLeft, Clock, Edit2, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest, API_ENDPOINTS } from '../../config/api';

interface Session {
  id: number;
  child_id: number;
  child_name?: string;
  session_date: string;
  session_time: string;
  session_type?: string;
  notes?: string;
}

interface SessionNote {
  notes_id: number;
  therapist_id: number;
  session_date: string;
  note_content: string;
  note_title: string | null;
  session_time: string | null;
  session_id: number | null;
  created_at: string;
  last_edited_at: string;
}

interface NotesViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
  onBack?: () => void;
}

export const NotesViewer: React.FC<NotesViewerProps> = ({ open, onOpenChange, selectedDate: propSelectedDate, onBack }) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(propSelectedDate);
  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [selectedNotes, setSelectedNotes] = React.useState<SessionNote[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [editingNoteId, setEditingNoteId] = React.useState<number | null>(null);
  const [formData, setFormData] = React.useState({
    note_title: '',
    note_content: '',
    session_id: ''
  });

  React.useEffect(() => {
    if (propSelectedDate) {
      setSelectedDate(propSelectedDate);
    }
  }, [propSelectedDate]);

  React.useEffect(() => {
    if (open && selectedDate) {
      fetchSessionsAndNotes();
    }
  }, [selectedDate, user, open]);

  const fetchSessionsAndNotes = async () => {
    if (!selectedDate || !user) return;

    setLoading(true);
    setError(null);

    try {
      // Fix timezone issue - use local date string
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      console.log('Fetching sessions for date:', dateStr);

      // Use new optimized endpoint that returns complete session details
      const sessionsResponse = await apiRequest(
        `${API_ENDPOINTS.SESSIONS_WITH_DETAILS}?session_date=${dateStr}`
      );

      if (sessionsResponse.ok) {
        const sessionsWithDetails = await sessionsResponse.json();
        console.log('Sessions with complete details:', sessionsWithDetails);

        // Data already includes child_name and session_type from backend
        setSessions(sessionsWithDetails);
      }

      // Fetch notes for the date
      const notesResponse = await apiRequest(API_ENDPOINTS.NOTES_BY_DATE(dateStr));

      if (notesResponse.ok) {
        const notes = await notesResponse.json();
        setSelectedNotes(notes);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch sessions and notes');
    } finally {
      setLoading(false);
    }
  };

  const createNote = async () => {
    if (!selectedDate || !formData.note_content.trim() || !formData.session_id) return;

    setSaving(true);
    setError(null);

    try {
      const selectedSession = sessions.find(s => s.id.toString() === formData.session_id);

      // Fix timezone issue - use local date string
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const noteData = {
        session_date: dateStr,
        note_content: formData.note_content.trim(),
        note_title: formData.note_title.trim() || null,
        session_time: selectedSession?.session_time || null,
        session_id: parseInt(formData.session_id)
      };

      const response = await apiRequest(API_ENDPOINTS.NOTES, {
        method: 'POST',
        body: JSON.stringify(noteData)
      });

      if (response.ok) {
        setFormData({ note_title: '', note_content: '', session_id: '' });
        setShowAddModal(false);
        await fetchSessionsAndNotes();
      } else {
        throw new Error('Failed to create note');
      }
    } catch (error) {
      console.error('Error creating note:', error);
      setError('Failed to create note');
    } finally {
      setSaving(false);
    }
  };

  const updateNote = async (noteId: number, title: string, content: string) => {
    setSaving(true);
    setError(null);

    try {
      const response = await apiRequest(API_ENDPOINTS.NOTES + `/${noteId}`, {
        method: 'PUT',
        body: JSON.stringify({
          note_title: title.trim() || null,
          note_content: content.trim()
        })
      });

      if (response.ok) {
        const updatedNote = await response.json();
        setSelectedNotes(selectedNotes.map(n => n.notes_id === noteId ? updatedNote.note : n));
        setEditingNoteId(null);
      } else {
        throw new Error('Failed to update note');
      }
    } catch (error) {
      console.error('Error updating note:', error);
      setError('Failed to update note');
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (noteId: number) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    setSaving(true);
    setError(null);

    try {
      const response = await apiRequest(API_ENDPOINTS.NOTES + `/${noteId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSelectedNotes(selectedNotes.filter(n => n.notes_id !== noteId));
      } else {
        throw new Error('Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      setError('Failed to delete note');
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return 'No time set';
    try {
      const timeParts = timeStr.split(':');
      const hours = parseInt(timeParts[0]);
      const minutes = parseInt(timeParts[1]);
      const date = new Date();
      date.setHours(hours, minutes);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
      return timeStr;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      onOpenChange(false);
    }
  };

  const getSessionDisplayName = (session: Session) => {
    const time = formatTime(session.session_time);
    const name = session.child_name || 'Unknown Student';
    const type = session.session_type || 'Therapy Session';
    return `${name} • ${time} • ${type}`;
  };

  return (
    <AnimatePresence>
      {open && (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
          <Dialog.Portal forceMount>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            </motion.div>
            <Dialog.Content asChild>
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="fixed inset-0 z-50 m-auto flex flex-col h-fit max-h-[95vh] w-[95vw] max-w-4xl rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 shadow-2xl overflow-hidden"
              >
                {/* Floating orbs background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <motion.div
                    animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-10 right-10 h-32 w-32 rounded-full bg-gradient-to-br from-violet-400/20 to-blue-400/20 blur-2xl"
                  />
                  <motion.div
                    animate={{ x: [0, -25, 0], y: [0, 15, 0], scale: [1, 0.9, 1] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute bottom-10 left-10 h-24 w-24 rounded-full bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 blur-2xl"
                  />
                </div>

                {/* Header */}
                <div className="relative z-10 flex items-center justify-between p-8 border-b border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex items-center gap-4">
                    {/* ALWAYS show back button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleBack}
                      className="p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/50 dark:border-slate-700/50"
                      aria-label="Go back to notes selector"
                    >
                      <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </motion.button>
                    <Dialog.Title className="flex items-center gap-4 text-2xl font-bold text-slate-800 dark:text-white">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 text-white">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        Session Notes
                        <p className="text-sm font-normal text-slate-600 dark:text-slate-400 mt-1">
                          {selectedDate?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </Dialog.Title>
                  </div>

                  <Dialog.Close asChild>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/50 dark:border-slate-700/50"
                      aria-label="Close"
                    >
                      <X className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </motion.button>
                  </Dialog.Close>
                </div>

                <Dialog.Description className="sr-only">
                  View and manage session notes for {selectedDate?.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </Dialog.Description>

                {/* Content */}
                <div className="relative z-10 flex-1 overflow-y-auto p-8">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Existing Notes */}
                      {selectedNotes.length > 0 && !showAddModal && (
                        <div className="space-y-4">
                          <AnimatePresence>
                            {selectedNotes.map((note, index) => (
                              <motion.div
                                key={note.notes_id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="p-6 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50"
                              >
                                {editingNoteId === note.notes_id ? (
                                  <EditNoteForm
                                    note={note}
                                    onSave={updateNote}
                                    onCancel={() => setEditingNoteId(null)}
                                    saving={saving}
                                  />
                                ) : (
                                  <>
                                    {note.note_title && (
                                      <h4 className="font-bold text-lg text-slate-800 dark:text-white mb-3">
                                        {note.note_title}
                                      </h4>
                                    )}
                                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap mb-4 leading-relaxed">
                                      {note.note_content}
                                    </p>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                                        {note.session_time && (
                                          <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatTime(note.session_time)}
                                          </span>
                                        )}
                                        <span>Created: {formatDate(note.created_at)}</span>
                                        {note.created_at !== note.last_edited_at && (
                                          <span>Edited: {formatDate(note.last_edited_at)}</span>
                                        )}
                                      </div>
                                      <div className="flex gap-2">
                                        <motion.button
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          onClick={() => setEditingNoteId(note.notes_id)}
                                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                        >
                                          <Edit2 className="h-4 w-4" />
                                          Edit
                                        </motion.button>
                                        <motion.button
                                          whileHover={{ scale: 1.05 }}
                                          whileTap={{ scale: 0.95 }}
                                          onClick={() => deleteNote(note.notes_id)}
                                          disabled={saving}
                                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                          Delete
                                        </motion.button>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      )}

                      {/* Add Note Button */}
                      {!showAddModal && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setShowAddModal(true)}
                          className="w-full flex items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed border-violet-300 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-900/10 hover:bg-violet-100 dark:hover:bg-violet-900/20 transition-all duration-200 group"
                        >
                          <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30 group-hover:bg-violet-200 dark:group-hover:bg-violet-900/50 transition-colors">
                            <Plus className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                          </div>
                          <span className="font-semibold text-violet-700 dark:text-violet-300">
                            {selectedNotes.length === 0 ? 'Add Your First Note' : 'Add Another Note'}
                          </span>
                        </motion.button>
                      )}

                      {/* Add Note Form */}
                      {showAddModal && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-6 rounded-2xl bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-900/20 dark:to-blue-900/20 border-2 border-violet-200 dark:border-violet-700"
                        >
                          <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Plus className="h-5 w-5" />
                            Add New Session Note
                          </h3>
                          <div className="space-y-4">
                            {/* Session Dropdown */}
                            <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Select Session *
                              </label>
                              {sessions.length === 0 ? (
                                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-sm flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                  <span>No sessions scheduled for this date</span>
                                </div>
                              ) : (
                                <select
                                  value={formData.session_id}
                                  onChange={(e) => setFormData(prev => ({ ...prev, session_id: e.target.value }))}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                                >
                                  <option value="">Choose a session...</option>
                                  {sessions.map((session) => (
                                    <option key={session.id} value={session.id}>
                                      {getSessionDisplayName(session)}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>

                            {/* Note Title */}
                            <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Note Title (Optional)
                              </label>
                              <input
                                type="text"
                                placeholder="Enter a title for this session note..."
                                value={formData.note_title}
                                onChange={(e) => setFormData(prev => ({ ...prev, note_title: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                              />
                            </div>

                            {/* Note Content */}
                            <div>
                              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Session Notes *
                              </label>
                              <textarea
                                placeholder="Enter your session notes here..."
                                value={formData.note_content}
                                onChange={(e) => setFormData(prev => ({ ...prev, note_content: e.target.value }))}
                                rows={6}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all resize-none"
                              />
                            </div>

                            {error && (
                              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                <span className="text-sm">{error}</span>
                              </div>
                            )}

                            <div className="flex gap-3">
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={createNote}
                                disabled={!formData.note_content.trim() || !formData.session_id || saving || sessions.length === 0}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-medium hover:from-violet-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                              >
                                {saving ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving...
                                  </>
                                ) : (
                                  <>
                                    <Save className="h-4 w-4" />
                                    Save Note
                                  </>
                                )}
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  setShowAddModal(false);
                                  setFormData({ note_title: '', note_content: '', session_id: '' });
                                  setError(null);
                                }}
                                className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                              >
                                Cancel
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </AnimatePresence>
  );
};

// Edit Note Form Component
interface EditNoteFormProps {
  note: SessionNote;
  onSave: (noteId: number, title: string, content: string) => void;
  onCancel: () => void;
  saving: boolean;
}

const EditNoteForm: React.FC<EditNoteFormProps> = ({ note, onSave, onCancel, saving }) => {
  const [title, setTitle] = React.useState(note.note_title || '');
  const [content, setContent] = React.useState(note.note_content);

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Title (Optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
      />
      <textarea
        placeholder="Note content..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all resize-none"
      />
      <div className="flex gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSave(note.notes_id, title, content)}
          disabled={!content.trim() || saving}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white font-medium hover:from-violet-700 hover:to-blue-700 disabled:opacity-50 transition-all"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : 'Save'}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCancel}
          disabled={saving}
          className="px-6 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Cancel
        </motion.button>
      </div>
    </div>
  );
};
