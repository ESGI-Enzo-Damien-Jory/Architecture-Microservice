import React from 'react';
import { Star, Award } from 'lucide-react';
import type { TeamMember } from '@/types';

interface ChefCardProps {
    member: TeamMember;
    index: number;
}

export const ChefCard: React.FC<ChefCardProps> = ({ member, index }) => {
    const { name, role, speciality, experience, stars, avatar, description } = member;

    return (
        <div
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 transition-all duration-500 hover:bg-white/10 hover:border-emerald-500/30 hover:scale-105 group text-center"
            style={{ animationDelay: `${index * 150}ms` }}
        >
            {/* Avatar */}
            <div className="w-24 h-24 mx-auto mb-6 text-6xl transition-transform duration-300 group-hover:scale-110">
                {avatar}
            </div>

            {/* Name and Role */}
            <h3 className="text-2xl font-bold text-white mb-2 transition-colors duration-300 group-hover:text-emerald-400">
                {name}
            </h3>

            <p className="text-emerald-400 font-semibold mb-4 transition-colors duration-300 group-hover:text-emerald-300">
                {role}
            </p>

            {/* Stars Rating */}
            <div className="flex items-center justify-center space-x-1 mb-4">
                {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-current" />
                ))}
                <span className="text-white/60 text-sm ml-2">{stars} étoile{stars > 1 ? 's' : ''}</span>
            </div>

            {/* Speciality */}
            <div className="bg-emerald-500/10 rounded-full px-4 py-2 mb-4 inline-block">
                <span className="text-emerald-400 text-sm font-medium">{speciality}</span>
            </div>

            {/* Experience */}
            <div className="flex items-center justify-center space-x-2 mb-4 text-white/60">
                <Award className="w-4 h-4" />
                <span className="text-sm">{experience} ans d&apos;expérience</span>
            </div>

            {/* Description */}
            <p className="text-white/70 text-sm leading-relaxed transition-colors duration-300 group-hover:text-white/90">
                {description}
            </p>
        </div>
    );
};