import React from 'react';
import {FeatureCard} from './feature-card';
import {FEATURES} from '@/constants';

export const FeaturesSection: React.FC = () => (
    <section className="py-20 px-6 bg-white/5 backdrop-blur-sm relative">
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-5xl font-bold text-white mb-6 transition-all duration-500 hover:text-emerald-400">
                    L&apos;Excellence <span className="text-emerald-400">AMS</span>
                </h2>
                <p className="text-xl text-white/70 max-w-2xl mx-auto transition-colors duration-300 hover:text-white/90">
                    Trois piliers qui définissent notre approche unique
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12">
                {FEATURES.map((feature, index) => (
                    <FeatureCard key={feature.title} feature={feature} index={index}/>
                ))}
            </div>
        </div>
    </section>
);