import { useState, useEffect, useCallback } from 'react';

export const useSlideshow = (slides: any[], duration: number = 4000) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % slides.length);
        }, duration);

        return () => clearInterval(timer);
    }, [slides.length, duration]);

    const goToSlide = useCallback((index: number) => {
        setCurrentSlide(index);
    }, []);

    return { currentSlide, goToSlide };
};

export const useToggle = (initialValue: boolean = false) => {
    const [value, setValue] = useState(initialValue);

    const toggle = useCallback(() => {
        setValue(prev => !prev);
    }, []);

    return [value, toggle] as const;
};