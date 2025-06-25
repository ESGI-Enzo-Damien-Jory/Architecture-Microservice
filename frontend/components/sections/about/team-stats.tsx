import React from 'react';
import type { TeamStat } from '@/types';

interface TeamStatsProps {
    stats: TeamStat[];
}

export const TeamStats: React.FC<TeamStatsProps> = ({ stats }) => (
    <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-12 border border-white/10 transition-all duration-500 hover:bg-white/8">
        <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-white mb-4 transition-colors duration-300 hover:text-emerald-400">
                Notre Équipe d&apos;Excellence
            </h3>
            <p className="text-white/70 max-w-2xl mx-auto transition-colors duration-300 hover:text-white/90">
                Des professionnels passionnés qui portent les valeurs de l&apos;artisanat français
            </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(({ value, label }, index) => (
                <div
                    key={label}
                    className="text-center group"
                    style={{ animationDelay: `${index * 100}ms` }}
                >
                    <div className="text-4xl font-bold text-emerald-400 mb-2 transition-all duration-300 group-hover:scale-110 group-hover:text-emerald-300">
                        {value}
                    </div>
                    <div className="text-white/60 text-sm transition-colors duration-300 group-hover:text-white/80">
                        {label}
                    </div>
                </div>
            ))}
        </div>
    </div>
);