import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChefHat, Star } from 'lucide-react';
import { AchievementCard } from './achievement-card';
import { TeamStats } from './team-stats';
import { ABOUT_ACHIEVEMENTS, TEAM_STATS as STATS } from '@/constants/about';

export const AboutSection: React.FC = () => {
    const scrollToTeam = () => {
        const teamSection = document.getElementById('team');
        if (teamSection) {
            teamSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <section id="about" className="py-20 px-6 bg-gradient-to-b from-black/20 to-transparent relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0">
                <div className="absolute top-1/3 left-0 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/3 right-0 w-96 h-96 bg-emerald-400/3 rounded-full blur-3xl" />
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Header */}
                <div className="text-center mb-16">
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 px-6 py-2 text-sm font-medium mb-8 transition-all duration-300 hover:bg-emerald-500/20 hover:scale-105">
                        🍽️ Notre histoire
                    </Badge>

                    <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 transition-all duration-500 hover:text-emerald-400">
                        À Propos d&apos;<span className="text-emerald-400">AMS</span>
                    </h2>

                    <p className="text-xl text-white/70 max-w-3xl mx-auto leading-relaxed transition-colors duration-300 hover:text-white/90">
                        Née de la vision révolutionnaire de démocratiser la haute gastronomie, AMS redéfinit l&apos;expérience culinaire moderne.
                    </p>
                </div>

                {/* Story Content */}
                <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
                    {/* Left Column - Story */}
                    <div className="space-y-8">
                        <div className="space-y-6">
                            <h3 className="text-3xl font-bold text-white mb-4 transition-colors duration-300 hover:text-emerald-400">
                                Une Révolution Culinaire
                            </h3>

                            <div className="space-y-4 text-white/80 leading-relaxed">
                                <p className="transition-colors duration-300 hover:text-white">
                                    En 2020, notre équipe de chefs étoilés s&apos;est lancé un défi audacieux :
                                    <span className="text-emerald-400 font-semibold"> créer une expérience gastronomique d&apos;exception accessible en moins de 15 minutes</span>.
                                </p>

                                <p className="transition-colors duration-300 hover:text-white">
                                    Inspirés par les techniques de la haute cuisine française et l&apos;innovation technologique,
                                    nous avons développé des processus uniques qui préservent l&apos;authenticité des saveurs
                                    tout en optimisant la rapidité de service.
                                </p>

                                <p className="transition-colors duration-300 hover:text-white">
                                    Aujourd&apos;hui, AMS est devenu la référence parisienne de la
                                    <span className="text-emerald-400 font-semibold"> gastronomie rapide premium</span>,
                                    alliant tradition française et modernité.
                                </p>
                            </div>
                        </div>

                        <div className="pt-6">
                            <Button
                                size="lg"
                                onClick={scrollToTeam}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-3 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl"
                            >
                                <ChefHat className="w-5 h-5 mr-2" />
                                Découvrir notre équipe
                            </Button>
                        </div>
                    </div>

                    {/* Right Column - Achievement Cards */}
                    <div className="space-y-6">
                        {ABOUT_ACHIEVEMENTS.map((achievement, index) => (
                            <AchievementCard key={achievement.title} achievement={achievement} index={index} />
                        ))}
                    </div>
                </div>

                {/* Team Stats Component */}
                <TeamStats stats={STATS} />

                {/* Mission Statement */}
                <div className="text-center mt-20">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-center mb-6">
                            <Star className="w-8 h-8 text-emerald-400 mr-3" />
                            <h3 className="text-2xl font-bold text-white">Notre Mission</h3>
                            <Star className="w-8 h-8 text-emerald-400 ml-3" />
                        </div>

                        <blockquote className="text-2xl text-white/90 font-light italic leading-relaxed transition-colors duration-300 hover:text-white">
                            &quot;Démocratiser l&apos;excellence culinaire française en rendant la haute gastronomie accessible à tous,
                            sans compromettre la qualité ni l&apos;authenticité des saveurs.&quot;
                        </blockquote>
                    </div>
                </div>
            </div>
        </section>
    );
};