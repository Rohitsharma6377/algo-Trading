
import React from 'react';

export default function LoadingSpinner({ text = "PROCESSING..." }) {
    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className="w-12 h-12 border-4 border-neon-blue border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-xs font-mono text-neon-blue animate-pulse tracking-widest">{text}</p>
        </div>
    );
}
