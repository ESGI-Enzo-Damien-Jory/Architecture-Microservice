import type { TeamMember } from '@/types';

export const TEAM_MEMBERS: TeamMember[] = [
    {
        name: "Pierre Dubois",
        role: "Chef Exécutif",
        speciality: "Cuisine française moderne",
        experience: 18,
        stars: 3,
        avatar: "👨‍🍳",
        description: "Formé chez Alain Ducasse, Pierre apporte son expertise de la haute gastronomie française avec une approche innovante."
    },
    {
        name: "Marie Laurent",
        role: "Chef Pâtissière",
        speciality: "Desserts créatifs",
        experience: 12,
        stars: 2,
        avatar: "👩‍🍳",
        description: "Ancienne de chez Pierre Hermé, Marie révolutionne nos desserts avec des créations à la fois visuelles et gustatives."
    },
    {
        name: "Thomas Chen",
        role: "Chef de Cuisine",
        speciality: "Fusion asiatique",
        experience: 15,
        stars: 2,
        avatar: "👨‍🍳",
        description: "Expert en cuisine fusion, Thomas marie parfaitement les saveurs asiatiques avec les techniques françaises."
    },
    {
        name: "Sophie Martin",
        role: "Sous-Chef",
        speciality: "Cuisine végétale",
        experience: 10,
        stars: 1,
        avatar: "👩‍🍳",
        description: "Pionnière de la cuisine végétale haute gamme, Sophie prouve que l'excellence n'a pas besoin de protéines animales."
    },
    {
        name: "Antoine Rousseau",
        role: "Chef Saucier",
        speciality: "Sauces & Fonds",
        experience: 14,
        stars: 2,
        avatar: "👨‍🍳",
        description: "Maître saucier reconnu, Antoine élève chaque plat avec ses créations de sauces d'exception."
    },
    {
        name: "Léa Moreau",
        role: "Chef de Partie",
        speciality: "Poissons & Fruits de mer",
        experience: 8,
        stars: 1,
        avatar: "👩‍🍳",
        description: "Spécialiste des produits de la mer, Léa sélectionne et prépare les meilleurs poissons avec une précision remarquable."
    }
] as const;