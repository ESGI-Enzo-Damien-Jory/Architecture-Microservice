import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ContactForm } from './contact-form';
import { ContactInfo } from './contact-info';
import { LocationMap } from './location-map';

export const ContactSection: React.FC = () => (
    <section id="contact" className="py-20 px-6 bg-gradient-to-b from-transparent to-black/20 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0">
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-emerald-400/3 rounded-full blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
            {/* Header */}
            <div className="text-center mb-16">
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 px-6 py-2 text-sm font-medium mb-8 transition-all duration-300 hover:bg-emerald-500/20 hover:scale-105">
                    📞 Nous contacter
                </Badge>

                <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 transition-all duration-500 hover:text-emerald-400">
                    Restons en <span className="text-emerald-400">Contact</span>
                </h2>

                <p className="text-xl text-white/70 max-w-3xl mx-auto leading-relaxed transition-colors duration-300 hover:text-white/90">
                    Une question, une réservation, ou simplement envie de découvrir l'univers AMS ?
                    Notre équipe est là pour vous accompagner.
                </p>
            </div>

            {/* Contact Content */}
            <div className="grid lg:grid-cols-2 gap-16 mb-16">
                {/* Left Column - Contact Form */}
                <ContactForm />

                {/* Right Column - Contact Info */}
                <ContactInfo />
            </div>

            {/* Location Map */}
            <LocationMap />
        </div>
    </section>
);