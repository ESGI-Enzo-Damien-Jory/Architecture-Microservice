import React from 'react';

export const AnimatedBackground: React.FC = () => (
    <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Gradient orbs */}
        <div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"
            style={{animationDelay: '0s', animationDuration: '6s'}}
        />
        <div
            className="absolute top-3/4 right-1/4 w-80 h-80 bg-emerald-400/5 rounded-full blur-3xl animate-pulse"
            style={{animationDelay: '2s', animationDuration: '8s'}}
        />
        <div
            className="absolute bottom-1/4 left-1/2 w-64 h-64 bg-emerald-600/8 rounded-full blur-3xl animate-pulse"
            style={{animationDelay: '4s', animationDuration: '10s'}}
        />

        {/* Floating particles */}
        {Array.from({length: 12}).map((_, i) => (
            <div
                key={i}
                className="absolute w-2 h-2 bg-emerald-400/20 rounded-full animate-bounce"
                style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 5}s`,
                    animationDuration: `${3 + Math.random() * 4}s`
                }}
            />
        ))}
    </div>
);