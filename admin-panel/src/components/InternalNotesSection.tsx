// Internal Notes Section Component
import React, { useState } from 'react';
import type { InternalNote } from '../types/adminTypes';

interface InternalNotesSectionProps {
    notes: InternalNote[];
    canAddNote: boolean;
    onAddNote: (note: string) => Promise<void>;
}

export const InternalNotesSection: React.FC<InternalNotesSectionProps> = ({
    notes,
    canAddNote,
    onAddNote,
}) => {
    const [newNote, setNewNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newNote.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onAddNote(newNote.trim());
            setNewNote('');
        } catch (error) {
            console.error('Error adding note:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="internal-notes">
            <div className="internal-notes__header">
                <h4 className="internal-notes__title">
                    🔒 Internal Notes
                    <span className="internal-notes__badge">Staff Only</span>
                </h4>
            </div>

            {canAddNote && (
                <form className="internal-notes__form" onSubmit={handleSubmit}>
                    <textarea
                        className="internal-notes__input"
                        placeholder="Add an internal note..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        rows={3}
                    />
                    <button
                        type="submit"
                        className="internal-notes__submit"
                        disabled={!newNote.trim() || isSubmitting}
                    >
                        {isSubmitting ? 'Adding...' : 'Add Note'}
                    </button>
                </form>
            )}

            <div className="internal-notes__list">
                {notes.length === 0 ? (
                    <p className="internal-notes__empty">No internal notes yet</p>
                ) : (
                    notes.map((note) => (
                        <div key={note.id} className="internal-notes__item">
                            <div className="internal-notes__item-header">
                                <span className="internal-notes__author">{note.author_name}</span>
                                <span className="internal-notes__date">{formatDate(note.created_at)}</span>
                            </div>
                            <p className="internal-notes__text">{note.note}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
