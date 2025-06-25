import React from 'react';
import {STATS} from '@/constants';

export const StatsSection: React.FC = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
        {STATS.map(({value, label, highlight}) => (
            <div key={label} className="text-center group">
                <div
                    className={`text-3xl font-bold mb-2 transition-all duration-300 group-hover:scale-110 ${
                        highlight ? 'text-emerald-400' : 'text-white'
                    }`}
                >
                    {value}
                </div>
                <div className="text-white/60 transition-colors duration-300 group-hover:text-white/80">
                    {label}
                </div>
            </div>
        ))}
    </div>
);