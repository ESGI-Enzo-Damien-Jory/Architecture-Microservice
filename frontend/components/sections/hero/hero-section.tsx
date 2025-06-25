import React from 'react';
import {Badge} from '@/components/ui/badge';
import {HeroShowcase} from './hero-showcase';
import {StatsSection} from './stats-section';

export const HeroSection: React.FC = () => (
    <section className="pt-32 pb-20 px-6 relative">
        <div className="max-w-6xl mx-auto text-center">
            {/* Header */}
            <div className="mb-16">
                <Badge
                    className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 px-6 py-2 text-sm font-medium mb-8 transition-all duration-300 hover:bg-emerald-500/20 hover:scale-105">
                    ✨ Gastronomie rapide premium
                </Badge>

                <h1 className="text-7xl md:text-8xl font-black text-white mb-6 leading-tight transition-all duration-700 hover:scale-105">
          <span
              className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent animate-pulse">
            AMS
          </span>
                </h1>

                <p className="text-2xl text-white/70 mb-12 max-w-2xl mx-auto font-light transition-all duration-500 hover:text-white/90">
                    Où l&apos;excellence culinaire rencontre la rapidité moderne
                </p>
            </div>

            <HeroShowcase/>
            <StatsSection/>
        </div>
    </section>
);