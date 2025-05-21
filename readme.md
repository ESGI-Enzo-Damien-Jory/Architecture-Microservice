# 🍽️ AMS Project

AMS est une application web de gestion de commandes pour restaurants.  
Elle permet aux clients de passer commande, à la cuisine de suivre et préparer les plats, et aux livreurs (optionnel) d’assurer la livraison. Le projet repose sur une architecture **microservices** moderne et modulaire, répartie entre plusieurs technologies.

---

## Technologies

Frontend: React + shadcn
Service Client: Java
Service Cuisine: Python
Service Commandes: C++
Base de données: Supabase
Auth: JWT
Orchestration: Docker
Communication entre services: Rest HTTP
Requete inter services: HTTP via dns docker

## Services en détails

### Service Clients (@Jaden38)

Imposés par lead:
- Framework : AdonisJS (v6)
- JWT
- Interop JSON
- Supabase

Exposés:
```
POST /auth/register
POST /auth/login
GET /me
```

### Service Commandes (@Darleanow)

Imposés par lead:
- Interop JSON

Exposés:
```
POST /orders
GET /orders/:id
PATCH /orders/:id/status
```

### Service Cuisine (@Ezyrone)

Imposés par lead:
- Interop JSON

Exposés:
```
GET /kitchen/orders (toutes les commandes à traiter)
PATCH /kitchen/orders/:id (changer statut : preparing, ready)
```

### Service Livraison (@Jaden38)

- Récupération des commandes prêtes à être livrées
- Attribution des commandes à un livreur
- Mise à jour du statut de livraison (reserved, picked_up, delivered)
- Authentification des livreurs (via JWT Supabase)

Endpoints exposés :
```
GET    /deliveries/available          # Voir les livraisons à prendre
PATCH  /deliveries/:id/reserve        # Réserver une livraison
PATCH  /deliveries/:id/pickup         # Marquer comme prise en charge
PATCH  /deliveries/:id/deliver        # Marquer comme livrée
```

### Frontend (@everyone)

Imposés par lead:
- React + TS
- shadcn
- React Query pour les requetes
- Zod pour valider les formulaires
- Routage basé sur les rôles


## 🧠 Objectif du projet

Créer une plateforme complète pour la gestion de commandes dans un restaurant, avec :
- Un front-end React moderne (interface client)
- Une architecture back-end en microservices (Java, Python, C++)
- Une base de données centralisée PostgreSQL
- Une communication entre services simple mais robuste via REST
- Une authentification JWT avec rôles (client, cuisinier, livreur)

---

## 🧩 Services

| Service              | Langage   | Description                                                              |
| -------------------- | --------- | ------------------------------------------------------------------------ |
| 🧍 Service Clients   | TD      | Gère les utilisateurs, l’authentification (JWT), et les sessions.        |
| 🍔 Service Commandes | TD       | Permet de passer des commandes, les stocke et les transmet à la cuisine. |
| 🔪 Service Cuisine   | TD   | Gère les commandes reçues, leur statut (en préparation, prêt à servir).  |
| 🛵 Service Livraison | TD | À développer si besoin, pour gérer livreurs et statuts de livraison.     |

---

## 🔐 Rôles utilisateurs

* **Client** : navigue dans le menu, commande des plats
* **Cuisinier** : visualise les commandes entrantes et met à jour leur statut
* **Livreur** *(optionnel)* : voit les commandes prêtes et les marque comme livrées
* **Admin** : peut modifier le menu et gérer les horaires de service

---

## 🛠️ Stack technique

| Côté                        | Technologie                                           |
| --------------------------- | ----------------------------------------------------- |
| Frontend                    | React, TypeScript, shadcn/ui, Tailwind CSS            |
| Authentification            | JWT (gérée par le service Java)                       |
| Backend                     | Microservices REST (Java + Python + C++)              |
| Base de données             | PostgreSQL (hébergée en ligne – Railway, Supabase...) |
| Communication inter-service | HTTP REST                                             |
| Déploiement                 | Docker + Railway / Render / Vercel                    |
| CI/CD                       | GitHub Actions (build/test)                           |

---

## 🔄 Fonctionnalités principales

* ✅ Authentification avec JWT
* ✅ Gestion du menu (CRUD admin)
* ✅ Passage de commande (client)
* ✅ Suivi de commande (cuisine)
* ✅ Restriction par horaires (pas de commande hors service)
* 🟡 Livraison (si développé)
* 🟡 Suivi d’inventaire (en option)
* 🚫 Commandes pour plusieurs personnes : **non prévu**

---

## 📦 Structure du repo

TODO

---

## 🚀 Lancer le projet (dev)

> 🐋 Pré-requis : Docker, Docker Compose, Node.js, PostgreSQL en ligne ou local

```bash
# 1. Cloner le repo
git clone https://github.com/ton-org/AMS_Project.git
cd AMS_Project

# 2. Lancer tous les services
docker-compose up --build

# 3. Accéder au front
http://localhost:3000
```

---

## 📅 Roadmap simplifiée

* [x] Choix des technos
* [x] Mise en place des squelettes de services
* [x] Authentification (Service Clients)
* [ ] Commande de plats (Service Commandes)
* [ ] Suivi en cuisine (Service Cuisine)
* [ ] Intégration front
* [ ] Déploiement (Railway, Vercel…)
* [ ] CI/CD GitHub Actions

---

## 🧪 Tests & CI

À venir : tests unitaires par service + pipeline CI (GitHub Actions)

---

## 📄 Licence

Projet académique - Non destiné à la production commerciale.
