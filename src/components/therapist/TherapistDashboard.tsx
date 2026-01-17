import * as React from 'react';
import { Hero } from './Hero';
import { Calendar } from './Calendar';
import { TodaysSessions } from './TodaysSessions';
import { NotesViewer } from './NotesViewer';
import { NotesSelector } from './NotesSelector';
import { GeneralNotesEditor } from './GeneralNotesEditor';

interface TherapistDashboardProps {
  isProfileOpen: boolean;
}

const TherapistDashboard: React.FC<TherapistDashboardProps> = ({ isProfileOpen }) => {
  const [notesSelectorOpen, setNotesSelectorOpen] = React.useState(false);
  const [notesViewerOpen, setNotesViewerOpen] = React.useState(false);
  const [generalNotesOpen, setGeneralNotesOpen] = React.useState(false);
  const [selectedNotesDate, setSelectedNotesDate] = React.useState<Date | undefined>();

  const handleNotesToggle = (enabled: boolean, selectedDate?: Date) => {
    if (enabled && selectedDate) {
      setSelectedNotesDate(selectedDate);
      // Show notes selector instead of directly opening notes viewer
      setNotesSelectorOpen(true);
    }
  };

  const handleSessionNotesClick = () => {
    setNotesSelectorOpen(false);
    setNotesViewerOpen(true);
  };

  const handleGeneralNotesClick = () => {
    setNotesSelectorOpen(false);
    setGeneralNotesOpen(true);
  };

  const handleBackToSelector = () => {
    setNotesViewerOpen(false);
    setGeneralNotesOpen(false);
    setNotesSelectorOpen(true);
  };

  return (
    <div className="space-y-8">
      <Hero isProfileOpen={isProfileOpen} />
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-7 space-y-6">
          <TodaysSessions />
        </div>
        <div className="xl:col-span-5">
          <Calendar onNotesToggle={handleNotesToggle} />
        </div>
      </div>

      {/* Notes Selector - Choose between Session Notes and General Notes */}
      <NotesSelector
        open={notesSelectorOpen}
        onOpenChange={setNotesSelectorOpen}
        selectedDate={selectedNotesDate}
        onSessionNotesClick={handleSessionNotesClick}
        onGeneralNotesClick={handleGeneralNotesClick}
      />

      {/* Session Notes Viewer */}
      <NotesViewer
        open={notesViewerOpen}
        onOpenChange={setNotesViewerOpen}
        selectedDate={selectedNotesDate}
        onBack={handleBackToSelector}
      />

      {/* General Notes Editor */}
      <GeneralNotesEditor
        open={generalNotesOpen}
        onOpenChange={setGeneralNotesOpen}
        selectedDate={selectedNotesDate}
        onBack={handleBackToSelector}
      />
    </div>
  );
};

export default TherapistDashboard;
