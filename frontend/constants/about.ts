import { Award, Users, Clock } from 'lucide-react';
import type { Achievement, TeamStat } from '@/types';

export const ABOUT_ACHIEVEMENTS: Achievement[] = [
    {
        icon: Award,
        title: "3 Étoiles Michelin",
        description: "Reconnus par le guide Michelin pour notre excellence culinaire"
    },
    {
        icon: Users,
        title: "50 000+ Clients",
        description: "Une communauté grandissante de gourmets satisfaits"
    },
    {
        icon: Clock,
        title: "Depuis 2020",
        description: "Pionniers de la gastronomie rapide premium en France"
    }
] as const;

export const TEAM_STATS: TeamStat[] = [
    { value: "5", label: "Chefs étoilés" },
    { value: "15", label: "Ans d'expérience moyenne" },
    { value: "100%", label: "Ingrédients français" },
    { value: "24/7", label: "Engagement qualité" }
] as const;