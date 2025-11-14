# NotLinkedIn - Plateforme d'Offres d'Emploi 💼

Une plateforme web complète de recherche d'emploi développée avec **Python Flask**, **MySQL** et **CSS moderne (Glass Morphism)**.

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Fonctionnalités](#fonctionnalites)
- [Architecture](#architecture)
- [Installation](#installation)
- [Utilisation](#utilisation)
- [Technologies](#technologies)
- [Statut du projet](#statut-du-projet)

---

## 🎯 Vue d'ensemble {#vue-densemble}

NotLinkedIn est une plateforme job board permettant aux **entreprises** de publier des offres d'emploi et aux **candidats** de postuler, gérer leur profil et suivre leurs candidatures.

### Points clés

- ✅ **Responsive design** avec CSS Glass Morphism
- ✅ **Architecture CSS modulaire** (styles per-page)
- ✅ **Admin panel** complet pour gérer les offres et candidatures
- ✅ **Authentification** sécurisée avec sessions Flask
- ✅ **Gestion des profils** utilisateur et entreprise
- ✅ **75-81% réduction CSS** via architecture modulaire
- ✅ **Design tokens** centralisés avec variables CSS

---

## 🚀 Fonctionnalités {#fonctionnalites}

### Pour les Candidats

- 📄 **Inscription/Connexion** sécurisée
- 🔍 **Recherche** d'offres avec filtres
- 📋 **Page détails** des offres complètes
- ✋ **Candidature** en ligne avec message personnalisé
- 📊 **Suivi des candidatures** (statut: en attente, examinée, acceptée, refusée)
- 👤 **Profil personnel** modifiable (informations, adresse, mot de passe)
- 📝 **Modification** des candidatures postérieures
- 🗂️ **Historique complet** des candidatures avec détails

### Pour les Entreprises

- 🏢 **Gestion du profil** entreprise
- ➕ **Création** d'offres d'emploi avec détails complets
- ✏️ **Modification/Suppression** d'offres
- 👥 **Consultation** des candidatures reçues
- 📊 **Suivi** des candidatures par statut
- 🗑️ **Gestion** des candidatures (modification de statut)
- 📈 **Statistiques** des candidatures par offre

### Pour les Administrateurs

- 🔐 **Accès total** au panel d'administration
- 🏪 **Gestion des entreprises** (CRUD complet)
- 💼 **Gestion des offres** (validation, modération)
- 👤 **Gestion des utilisateurs**
- 📋 **Suivi global** des candidatures
- 🎯 **Modification** de statuts en masse

---

## 🏗️ Architecture {#architecture}

### Structure de fichiers

```text
NotLinkedIn/
├── templates/               # Templates Jinja2
│   ├── index.html          # Page d'accueil
│   ├── login.html          # Connexion
│   ├── register.html       # Inscription
│   ├── profile.html        # Profil utilisateur + candidatures
│   ├── candidater.html     # Formulaire candidature
│   ├── candidatures.html   # Liste candidatures entreprise
│   ├── entreprise.html     # Gestion entreprise + offres
│   ├── ajouter-offre.html  # Créer/modifier offre
│   ├── admin.html          # Admin panel (tabs)
│   ├── admin_ajouter_entreprise.html
│   ├── admin_modifier_entreprise.html
│   ├── admin_ajouter_offre.html
│   └── admin_modifier_offre.html
│
├── static/
│   ├── fonts/              # Polices
│   │   └── Montserrat.ttf
│   │
│   ├── icon/               # Icônes
│   │   └── NotLinkedIn_icon.ico
│   │
│   ├── images/             # Images
│   │   └── logo.png
│   │
│   ├── script/             # JavaScript
│   │   ├── script.js       # JS global (recherche, filtres)
│   │   ├── profile.js      # JS profil (édition, modales)
│   │   ├── admin.js        # JS admin (tabs, pagination)
│   │   └── admin_candidatures.js
│   │
│   └── style/              # CSS modulaire (14 fichiers)
│       ├── general.css         # Styles partagés (header, footer)
│       ├── variables.css       # Design tokens (couleurs, espacements)
│       ├── index.css           # Page d'accueil
│       ├── login.css           # Connexion
│       ├── register.css        # Inscription
│       ├── auth.css            # Styles communs authentification
│       ├── profile.css         # Profil utilisateur (784 lignes)
│       ├── admin.css           # Admin panel
│       ├── admin_form.css      # Formulaires admin (select, inputs)
│       ├── admin_candidatures.css
│       ├── admin_items.css
│       ├── candidater.css      # Formulaire candidature
│       ├── candidatures.css    # Liste candidatures
│       ├── entreprise.css      # Gestion entreprise
│       └── ajouter-offre.css   # Créer/modifier offre
│
├── app.py                  # Application Flask
├── database.sql            # Schéma SQL
├── setup_db_auto.sh        # Script installation DB
├── Makefile                # Commandes automatisées
├── requirements.txt        # Dépendances Python
└── README.md               # Ce fichier
```

### Architecture CSS - Système Modulaire

```text
Réduction de 75-81% CSS par page via architecture modulaire

Imports:
- Chaque page importe: general.css + variables.css + page-specifique.css
- Évite la duplication de code
- Performance optimale (seulement CSS nécessaire)

Design System:
variables.css contient:
  - Couleurs (white-1, white-2, ... white-15)
  - Espacements (spacing-xs à spacing-3xl)
  - Typographie (font-xs à font-lg)
  - Ombres (shadow-sm à shadow-xl)
  - Transitions et animations
  - Valeurs z-index

Techniques CSS:
  - Glass Morphism: backdrop-filter blur + rgba
  - Gradients: linear-gradient pour boutons
  - Animations: fadeIn, slideIn
  - Responsive: media queries @768px
```

---

## 💾 Installation {#installation}

### Prérequis

- Python 3.8+
- MySQL 5.7+
- pip

### Étapes

#### 1. Cloner le projet

```bash
git clone git@github.com/gossotjeanbaptiste/NotLinkedIn.git
cd NotLinkedIn
```

#### 2. Créer l'environnement virtuel

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows
```

#### 3. Installer les dépendances

```bash
pip install -r requirements.txt
```

#### 4. Configurer la base de données

```bash
# Option 1: Automatique (Linux/Mac)
chmod +x setup_db_auto.sh
./setup_db_auto.sh

# Option 2: Manuel
mysql -u root -p
# Exécuter database.sql
```

#### 5. Lancer l'application

```bash
# Avec Makefile
make run

# Ou directement
python app.py
```

L'application sera disponible à: `http://localhost:5000`

---

## 🎮 Utilisation {#utilisation}

### Liste des users/passwords

- admin / admin123
- aleroy / password123
- jdupont / password123
- droux / password123
- mmartin / password123
- lpetit / password123

### Workflows typiques

#### En tant que Candidat

1. S'inscrire ou se connecter
2. Parcourir les offres (recherche, filtres)
3. Cliquer sur une offre pour voir les détails
4. Cliquer "Postuler" et remplir le formulaire
5. Consulter "Mes candidatures" pour suivre le statut
6. Modifier profil et mot de passe dans "Mon Profil"

#### En tant qu'Admin

1. Se connecter
2. Accéder à "Administration"
3. Naviguer entre les sections:
   - **Entreprises**: CRUD complet
   - **Offres**: Modération et gestion
   - **Candidatures**: Suivi et modification

---

## 🛠️ Technologies {#technologies}

### Backend

- **Flask** 2.0+ - Framework web Python
- **MySQL** 5.7+ - Base de données relationnelle
- **Python** 3.8+ - Langage de programmation
- **Jinja2** - Moteur de templates (Via Flask)

### Frontend

- **HTML5** - Structure sémantique
- **CSS3** - Styling avancé
  - Glass Morphism
  - Gradients
  - CSS Variables (Custom Properties)
  - Animations
- **JavaScript Vanilla** - Interactivité
- **Montserrat Font** - Typographie

### Design & UX

- **Glass Morphism** - Effet vitreux moderne
- **CSS Variables** - Design tokens centralisés
- **Responsive Design** - Mobile-first approach
- **Accessibility** - Contraste WCAG AA

### Outils & Workflow

- **Makefile** - Automatisation des tâches
- **Virtual Environment** - Isolation Python
- **Git** - Versioning

---

## 📊 Statut du projet {#statut-du-projet}

### ✅ Complété

- [x] Base de données MySQL avec relations
- [x] CRUD complet pour toutes entités
- [x] Authentification utilisateur sécurisée
- [x] Système de candidature complet
- [x] Admin panel avec tabs et modération
- [x] Profils utilisateur et entreprise
- [x] Design Glass Morphism moderne
- [x] Architecture CSS modulaire (75-81% reduction)
- [x] Design tokens centralisés
- [x] Responsive design (mobile, tablet, desktop)
- [x] Animations et transitions fluides
- [x] Boutons stylisés avec hover effects

---

## 👨‍💻 Auteur

### GOSSOT (POGGIO) Jean-Baptiste

- GitHub: [@gossotjeanbaptiste](https://github.com/gossotjeanbaptiste)
- Portfolio: [gossotjeanbaptiste.github.io](https://gossotjeanbaptiste.github.io)
- Email: [jean-baptiste.gossot@epitech.eu](mailto:jean-baptiste.gossot@epitech.eu)

---

## 📞 Support

Pour toute question ou problème:

1. Consulter les issues existantes
2. Créer une nouvelle issue avec description détaillée
3. Fournir des logs/screenshots si possible

---

**Dernière mise à jour**: 14 novembre 2025  
**Version**: 1.0.0 - Architecture CSS modulaire complétée
