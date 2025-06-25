"use client"

import React from 'react';
import { AnimatedBackground } from '@/components/common/animated-background';
import { Navigation } from '@/components/layout/header/navigation';
import { HeroSection } from '@/components/sections/hero/hero-section';
import { AboutSection } from '@/components/sections/about/about-section';
import { TeamSection } from '@/components/sections/team/team-section';
import { FeaturesSection } from '@/components/sections/features/features-section';
import { MenuSection } from '@/components/sections/menu/menu-section';
import { ContactSection } from '@/components/sections/contact/contact-section';
import { CTASection } from '@/components/sections/cta/cta-section';
import { Footer } from '@/components/layout/footer/footer';

export const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black relative">
            <AnimatedBackground />
            <Navigation />
            <HeroSection />
            <AboutSection />
            <TeamSection />
            <FeaturesSection />
            <MenuSection />
            <ContactSection />
            <CTASection />
            <Footer />
        </div>
    );
};

export default LandingPage;