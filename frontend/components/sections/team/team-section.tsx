import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ChefCard } from './chef-card';
import { TEAM_MEMBERS } from '@/constants/team';

export const TeamSection: React.FC = () => (
    <section id="team" className="py-20 px-6 bg-white/5 backdrop-blur-sm relative">
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16">
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 px-6 py-2 text-sm font-medium mb-8 transition-all duration-300 hover:bg-emerald-500/20 hover:scale-105">
                    👨‍🍳 Les artisans du goût
                </Badge>

                <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 transition-all duration-500 hover:text-emerald-400">
                    Notre <span className="text-emerald-400">Équipe</span>
                </h2>

                <p className="text-xl text-white/70 max-w-3xl mx-auto leading-relaxed transition-colors duration-300 hover:text-white/90">
                    Rencontrez les chefs étoilés et passionnés qui créent chaque jour l&apos;excellence AMS
                </p>
            </div>

            {/* Team Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                {TEAM_MEMBERS.map((member, index) => (
                    <ChefCard key={member.name} member={member} index={index} />
                ))}
            </div>

            {/* Team Philosophy */}
            <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 backdrop-blur-xl rounded-3xl p-12 border border-emerald-500/20 text-center">
                <h3 className="text-3xl font-bold text-white mb-6 transition-colors duration-300 hover:text-emerald-400">
                    Notre Philosophie
                </h3>
                <p className="text-xl text-white/80 leading-relaxed max-w-4xl mx-auto transition-colors duration-300 hover:text-white">
                    &quot;Chaque plat raconte une histoire. Notre équipe unit tradition française et innovation moderne
                    pour créer des expériences culinaires inoubliables. Nous croyons que l&apos;excellence n&apos;a pas de compromis,
                    même dans la rapidité.&quot;
                </p>
                <div className="mt-8 text-emerald-400 font-semibold text-lg">
                    - L&apos;équipe AMS
                </div>
            </div>
        </div>
    </section>
);