// Quick Actions Component

import React from 'react';
import { QUICK_REPLIES } from '../utils/prompts';

interface QuickActionsProps {
    onAction: (action: string) => void;
    type?: 'initial' | 'billType' | 'grievanceCategory' | 'certificateType' | 'licenseType' | 'confirmation';
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onAction, type = 'initial' }) => {
    const actions = QUICK_REPLIES[type] || QUICK_REPLIES.initial;

    const getIcon = (action: string): string => {
        const icons: Record<string, string> = {
            'Pay a bill': '💳',
            'File a complaint': '📝',
            'Apply for certificate': '📋',
            'Track my application': '🔍',
            'Office information': 'ℹ️',
            'Electricity Bill': '⚡',
            'Water Bill': '💧',
            'Property Tax': '🏠',
            'Water Supply': '💧',
            'Roads / Potholes': '🛣️',
            'Garbage Collection': '🗑️',
            'Street Lights': '💡',
            'Drainage / Flooding': '🌊',
            'Other Issue': '📌',
            'Birth Certificate': '👶',
            'Income Certificate': '💰',
            'Caste Certificate': '📜',
            'Domicile Certificate': '🏡',
            'Shop License': '🏪',
            'Trade License': '📋',
            'Parking Permit': '🅿️',
            'Event Permission': '🎉',
            'Yes, submit': '✅',
            'No, make changes': '✏️'
        };
        return icons[action] || '•';
    };

    return (
        <div className="quick-actions-scroll">
            {actions.map((action, index) => (
                <button
                    key={index}
                    className="quick-action-chip"
                    onClick={() => onAction(action)}
                >
                    {getIcon(action)} {action}
                </button>
            ))}
        </div>
    );
};
