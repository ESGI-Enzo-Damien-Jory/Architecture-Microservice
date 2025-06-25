// /constants/index.ts
import { Crown, Zap, Heart } from 'lucide-react';
import type { HeroSlide, MenuItem, Stat, Feature, NavigationLink } from '@/types';

export const SLIDE_DURATION = 4000;

export const HERO_SLIDES: HeroSlide[] = [
    {
        title: "Burger à la Truffe",
        subtitle: "Bœuf Wagyu, aioli de truffe, gruyère maturé",
        image: "🍔",
        price: "24€"
    },
    {
        title: "Canard Laqué",
        subtitle: "Canard aux 5 épices, salade de chou asiatique, sauce hoisin glacée",
        image: "🦆",
        price: "28€"
    },
    {
        title: "Mac au Homard",
        subtitle: "Homard frais, mélange 3 fromages, croûte aux herbes",
        image: "🦞",
        price: "32€"
    }
] as const;

export const MENU_ITEMS: MenuItem[] = [
    {
        name: "Pavé de Bœuf Wagyu",
        price: "34€",
        rating: 4.9,
        time: "12 min",
        image: "🥩"
    },
    {
        name: "Risotto au Safran",
        price: "22€",
        rating: 4.8,
        time: "10 min",
        image: "🍚"
    },
    {
        name: "Ramen au Charbon",
        price: "18€",
        rating: 4.7,
        time: "12 min",
        image: "🍜"
    },
    {
        name: "Dessert à la Feuille d'Or",
        price: "16€",
        rating: 4.9,
        time: "5 min",
        image: "🍰"
    }
] as const;

export const STATS: Stat[] = [
    { value: "50K+", label: "Clients satisfaits" },
    { value: "25+", label: "Récompenses" },
    { value: "15min", label: "Livraison moyenne" },
    { value: "4.9★", label: "Note moyenne", highlight: true }
] as const;

export const FEATURES: Feature[] = [
    {
        icon: Crown,
        title: "Qualité Michelin",
        description: "Plats créés par des chefs étoilés avec des ingrédients premium"
    },
    {
        icon: Zap,
        title: "Rapidité Express",
        description: "Cuisine optimisée pour une livraison en moins de 15 minutes"
    },
    {
        icon: Heart,
        title: "Passion Artisanale",
        description: "Chaque plat est préparé avec amour et savoir-faire français"
    }
] as const;

export const NAVIGATION_LINKS: NavigationLink[] = [
    { href: "#menu", label: "Menu" },
    { href: "#about", label: "À propos" },
    { href: "#team", label: "Équipe" },
    { href: "#contact", label: "Contact" }
] as const;