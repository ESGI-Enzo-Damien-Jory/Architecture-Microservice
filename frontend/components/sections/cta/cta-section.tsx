import React from 'react';
import {Button} from '@/components/ui/button';

export const CTASection: React.FC = () => (
    <section className="py-20 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"/>
            <div
                className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-white/5 rounded-full blur-lg animate-bounce"
                style={{animationDuration: '3s'}}
            />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-5xl font-bold text-white mb-6 transition-all duration-500 hover:scale-105">
                Prêt pour l&apos;expérience AMS ?
            </h2>
            <p className="text-xl text-white/90 mb-12 leading-relaxed transition-colors duration-300 hover:text-white">
                Rejoignez notre communauté de gourmets et découvrez une nouvelle façon de savourer
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Button
                    size="lg"
                    className="bg-white text-emerald-600 hover:bg-white/90 font-semibold px-12 py-4 text-lg rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl"
                >
                     Réserver
                </Button>

            </div>
        </div>
    </section>
);