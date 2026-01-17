import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import { X, FileText, Plus, Save, Trash2, ArrowLeft, Loader2, Edit2 } from 'lucide-react';
import { API_ENDPOINTS, buildApiUrl, getAuthHeaders } from '../../config/api';

interface GeneralNote {
    notes_id: number;
    therapist_id: number;
    date: string;
    note_title: string | null;
    note_content: string;
    created_at: string;
    last_edited_at: string;
}

interface GeneralNotesEditorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedDate?: Date;
    onBack?: () => void;
}

export const GeneralNotesEditor: React.FC<GeneralNotesEditorProps> = ({
    open,
    onOpenChange,
    selectedDate,
    onBack,
}) => {
    const [notes, setNotes] = useState<GeneralNote[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newNoteTitle, setNewNoteTitle] = useState('');
    const [newNoteContent, setNewNoteContent] = useState('');
    const [editingNoteId, setEditingNoteId] = useState<number | null>(null);

    const formattedDate = selectedDate?.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    // Fix timezone issue - use local date string
    const dateString = selectedDate ? (() => {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    })() : '';

    // Fetch notes when dialog opens
    useEffect(() => {
        if (open && selectedDate) {
            fetchNotes();
        }
    }, [open, selectedDate]);

    const fetchNotes = async () => {
        if (!selectedDate) return;

        setLoading(true);
        try {
            const response = await fetch(
                buildApiUrl(API_ENDPOINTS.GENERAL_NOTES_BY_DATE(dateString)),
                {
                    headers: getAuthHeaders(),
                }
            );

            if (response.ok) {
                const data = await response.json();
                setNotes(data.notes || []);
            }
        } catch (error) {
            console.error('Error fetching general notes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNote = async () => {
        if (!newNoteContent.trim()) return;

        setSaving(true);
        try {
            const response = await fetch(
                buildApiUrl(API_ENDPOINTS.GENERAL_NOTES_CREATE),
                {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        date: dateString,
                        note_title: newNoteTitle.trim() || null,
                        note_content: newNoteContent.trim(),
                    }),
                }
            );

            if (response.ok) {
                const data = await response.json();
                setNotes([...notes, data.note]);
                setNewNoteTitle('');
                setNewNoteContent('');
                setShowAddForm(false);
            }
        } catch (error) {
            console.error('Error creating note:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateNote = async (noteId: number, title: string, content: string) => {
        setSaving(true);
        try {
            const response = await fetch(
                buildApiUrl(API_ENDPOINTS.GENERAL_NOTES_UPDATE(noteId)),
                {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                        note_title: title.trim() || null,
                        note_content: content.trim(),
                    }),
                }
            );

            if (response.ok) {
                const data = await response.json();
                setNotes(notes.map(n => n.notes_id === noteId ? data.note : n));
                setEditingNoteId(null);
            }
        } catch (error) {
            console.error('Error updating note:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteNote = async (noteId: number) => {
        if (!confirm('Are you sure you want to delete this note?')) return;

        setSaving(true);
        try {
            const response = await fetch(
                buildApiUrl(API_ENDPOINTS.GENERAL_NOTES_DELETE(noteId)),
                {
                    method: 'DELETE',
                    headers: getAuthHeaders(),
                }
            );

            if (response.ok) {
                setNotes(notes.filter(n => n.notes_id !== noteId));
            }
        } catch (error) {
            console.error('Error deleting note:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            onOpenChange(false);
        }
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
                                        animate={{
                                            x: [0, 30, 0],
                                            y: [0, -20, 0],
                                            scale: [1, 1.1, 1]
                                        }}
                                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute top-10 right-10 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 blur-2xl"
                                    />
                                    <motion.div
                                        animate={{
                                            x: [0, -25, 0],
                                            y: [0, 15, 0],
                                            scale: [1, 0.9, 1]
                                        }}
                                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                                        className="absolute bottom-10 left-10 h-24 w-24 rounded-full bg-gradient-to-br from-violet-400/20 to-blue-400/20 blur-2xl"
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
                                            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-600 to-cyan-600 text-white">
                                                <FileText className="h-6 w-6" />
                                            </div>
                                            <div>
                                                General Notes
                                                <p className="text-sm font-normal text-slate-600 dark:text-slate-400 mt-1">
                                                    {formattedDate}
                                                </p>
                                            </div>
                                        </Dialog.Title>
                                    </div>

                                    <Dialog.Close asChild>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                            className="p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/50 dark:border-slate-700/50"
                                        >
                                            <X className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                        </motion.button>
                                    </Dialog.Close>
                                </div>

                                {/* Content */}
                                <div className="relative z-10 flex-1 overflow-y-auto p-8">
                                    {loading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {/* Existing Notes */}
                                            {notes.length > 0 && !showAddForm && (
                                                <div className="space-y-4">
                                                    <AnimatePresence>
                                                        {notes.map((note, index) => (
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
                                                                        onSave={handleUpdateNote}
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
                                                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                                                Last edited: {new Date(note.last_edited_at).toLocaleString()}
                                                                            </span>
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
                                                                                    onClick={() => handleDeleteNote(note.notes_id)}
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

                                            {/* Empty State or Add Button */}
                                            {!showAddForm && (
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => setShowAddForm(true)}
                                                    className="w-full flex items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 transition-all duration-200 group"
                                                >
                                                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors">
                                                        <Plus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                                    </div>
                                                    <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                                                        {notes.length === 0 ? 'Add Your First Note' : 'Add Another Note'}
                                                    </span>
                                                </motion.button>
                                            )}

                                            {/* Add Note Form */}
                                            {showAddForm && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20 border-2 border-emerald-200 dark:border-emerald-700"
                                                >
                                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                                        <Plus className="h-5 w-5" />
                                                        Add New Note
                                                    </h3>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                                Title (Optional)
                                                            </label>
                                                            <input
                                                                type="text"
                                                                placeholder="Note title..."
                                                                value={newNoteTitle}
                                                                onChange={(e) => setNewNoteTitle(e.target.value)}
                                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                                                Note Content
                                                            </label>
                                                            <textarea
                                                                placeholder="• Reminder for tomorrow&#10;• Important observation&#10;• Follow-up needed..."
                                                                value={newNoteContent}
                                                                onChange={(e) => setNewNoteContent(e.target.value)}
                                                                rows={6}
                                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none font-mono text-sm"
                                                            />
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <motion.button
                                                                whileHover={{ scale: 1.02 }}
                                                                whileTap={{ scale: 0.98 }}
                                                                onClick={handleCreateNote}
                                                                disabled={!newNoteContent.trim() || saving}
                                                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-medium hover:from-emerald-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                                                                    setShowAddForm(false);
                                                                    setNewNoteTitle('');
                                                                    setNewNoteContent('');
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
    note: GeneralNote;
    onSave: (noteId: number, title: string, content: string) => void;
    onCancel: () => void;
    saving: boolean;
}

const EditNoteForm: React.FC<EditNoteFormProps> = ({ note, onSave, onCancel, saving }) => {
    const [title, setTitle] = useState(note.note_title || '');
    const [content, setContent] = useState(note.note_content);

    return (
        <div className="space-y-4">
            <input
                type="text"
                placeholder="Title (Optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
            <textarea
                placeholder="Note content..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none font-mono text-sm"
            />
            <div className="flex gap-3">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSave(note.notes_id, title, content)}
                    disabled={!content.trim() || saving}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-medium hover:from-emerald-700 hover:to-cyan-700 disabled:opacity-50 transition-all"
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
