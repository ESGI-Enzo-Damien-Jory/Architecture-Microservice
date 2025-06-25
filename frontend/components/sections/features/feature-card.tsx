import React from 'react';
import type {Feature} from '@/types';

interface FeatureCardProps {
    feature: Feature;
    index: number;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({feature, index}) => {
    const {icon: Icon, title, description} = feature;

    return (
        <div
            className="text-center group transition-all duration-500 hover:transform hover:scale-105"
            style={{animationDelay: `${index * 200}ms`}}
        >
            <div
                className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-8 transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-emerald-500/25">
                <Icon className="w-10 h-10 text-white transition-transform duration-300 group-hover:scale-110"/>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 transition-colors duration-300 group-hover:text-emerald-400">
                {title}
            </h3>
            <p className="text-white/70 leading-relaxed transition-colors duration-300 group-hover:text-white/90">
                {description}
            </p>
        </div>
    );
};