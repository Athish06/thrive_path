import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Calendar, FileText } from 'lucide-react';

interface NotesSelectorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedDate?: Date;
    onSessionNotesClick: () => void;
    onGeneralNotesClick: () => void;
}

export const NotesSelector: React.FC<NotesSelectorProps> = ({
    open,
    onOpenChange,
    selectedDate,
    onSessionNotesClick,
    onGeneralNotesClick,
}) => {
    const formattedDate = selectedDate?.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

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
                                className="fixed inset-0 z-50 m-auto flex flex-col h-fit max-h-[90vh] w-[90vw] max-w-3xl rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-white/30 dark:border-slate-700/50 shadow-2xl overflow-hidden"
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
                                        className="absolute top-10 right-10 h-32 w-32 rounded-full bg-gradient-to-br from-violet-400/20 to-blue-400/20 blur-2xl"
                                    />
                                    <motion.div
                                        animate={{
                                            x: [0, -25, 0],
                                            y: [0, 15, 0],
                                            scale: [1, 0.9, 1]
                                        }}
                                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                                        className="absolute bottom-10 left-10 h-24 w-24 rounded-full bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 blur-2xl"
                                    />
                                </div>

                                {/* Header */}
                                <div className="relative z-10 flex items-center justify-between p-8 border-b border-slate-200/50 dark:border-slate-700/50">
                                    <Dialog.Title className="text-2xl font-bold text-slate-800 dark:text-white">
                                        Notes for {formattedDate}
                                    </Dialog.Title>

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
                                <div className="relative z-10 p-8">
                                    <p className="text-center text-slate-600 dark:text-slate-400 mb-8">
                                        Choose the type of notes you'd like to view or create:
                                    </p>

                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Session Notes Card */}
                                        <motion.button
                                            whileHover={{ scale: 1.02, y: -4 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={onSessionNotesClick}
                                            className="flex flex-col items-center justify-center p-8 rounded-2xl bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-900/20 dark:to-blue-900/20 border-2 border-violet-200/50 dark:border-violet-700/50 hover:border-violet-400 dark:hover:border-violet-500 transition-all duration-200 group"
                                        >
                                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                                                <Calendar className="h-8 w-8 text-white" />
                                            </div>
                                            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">Session Notes</h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                                                Notes tied to therapy sessions
                                            </p>
                                        </motion.button>

                                        {/* General Notes Card */}
                                        <motion.button
                                            whileHover={{ scale: 1.02, y: -4 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={onGeneralNotesClick}
                                            className="flex flex-col items-center justify-center p-8 rounded-2xl bg-gradient-to-br from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20 border-2 border-emerald-200/50 dark:border-emerald-700/50 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all duration-200 group"
                                        >
                                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-cyan-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                                                <FileText className="h-8 w-8 text-white" />
                                            </div>
                                            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">General Notes</h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                                                Daily reminders & observations
                                            </p>
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        </Dialog.Content>
                    </Dialog.Portal>
                </Dialog.Root>
            )}
        </AnimatePresence>
    );
};
