import React from 'react';
import {Button} from '@/components/ui/button';
import {HERO_SLIDES, SLIDE_DURATION} from '@/constants';
import {useSlideshow} from '@/hooks';

export const HeroShowcase: React.FC = () => {
    const {currentSlide, goToSlide} = useSlideshow(HERO_SLIDES, SLIDE_DURATION);
    const currentSlideData = HERO_SLIDES[currentSlide];

    return (
        <div className="mb-16">
            <div
                className="bg-white/5 backdrop-blur-xl rounded-3xl p-12 border border-white/10 max-w-2xl mx-auto transition-all duration-500 hover:bg-white/8 hover:border-emerald-500/30">
                <div className="text-8xl mb-8 transition-transform duration-500 hover:scale-110">
                    {currentSlideData.image}
                </div>

                <h2 className="text-3xl font-bold text-white mb-4 transition-all duration-300">
                    {currentSlideData.title}
                </h2>

                <p className="text-lg text-white/60 mb-6">
                    {currentSlideData.subtitle}
                </p>

                <div className="text-3xl font-bold text-emerald-400 mb-8 animate-pulse">
                    {currentSlideData.price}
                </div>

                <Button
                    size="lg"
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-12 py-4 text-lg rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl"
                >
                    Commander maintenant
                </Button>
            </div>

            {/* Slide Indicators */}
            <div className="flex justify-center space-x-3 mt-8">
                {HERO_SLIDES.map((_, index) => (
                    <button
                        key={index}
                        className={`h-2 rounded-full transition-all duration-300 hover:scale-110 ${
                            index === currentSlide
                                ? 'w-8 bg-emerald-500 shadow-lg'
                                : 'w-2 bg-white/30 hover:bg-white/50'
                        }`}
                        onClick={() => goToSlide(index)}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};