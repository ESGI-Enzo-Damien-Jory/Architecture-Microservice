import React from 'react';
import type { Achievement } from '@/types';

interface AchievementCardProps {
    achievement: Achievement;
    index: number;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, index }) => {
    const { icon: Icon, title, description } = achievement;

    return (
        <div
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 transition-all duration-500 hover:bg-white/10 hover:border-emerald-500/30 hover:scale-105 group"
            style={{ animationDelay: `${index * 200}ms` }}
        >
            <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                    <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h4 className="text-lg font-bold text-white mb-2 transition-colors duration-300 group-hover:text-emerald-400">
                        {title}
                    </h4>
                    <p className="text-white/70 text-sm leading-relaxed transition-colors duration-300 group-hover:text-white/90">
                        {description}
                    </p>
                </div>
            </div>
        </div>
    );
};