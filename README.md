# NotLinkedIn - Plateforme d'Offres d'Emploi 💼

Une plateforme web complète de recherche d'emploi développée avec **Python Flask**, **MySQL** et **CSS moderne (Glass Morphism)**.

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Fonctionnalités](#fonctionnalités)
- [Architecture](#architecture)
- [Installation](#installation)
- [Utilisation](#utilisation)
- [Structure du projet](#structure-du-projet)
- [Technologies](#technologies)

---

## 🎯 Vue d'ensemble

NotLinkedIn est une plateforme job board permettant aux **entreprises** de publier des offres d'emploi et aux **candidats** de postuler, gérer leur profil et suivre leurs candidatures.

### Points clés:
- ✅ **Responsive design** avec CSS Glass Morphism
- ✅ **Architecture modulaire** CSS (rework_css)
- ✅ **Admin panel** complet pour gérer les offres et candidatures
- ✅ **Authentification** sécurisée
- ✅ **Gestion des profils** utilisateur et entreprise

---

## 🚀 Fonctionnalités

### Pour les Candidats
- 📄 **Inscription/Connexion** sécurisée
- 🔍 **Recherche** d'offres avec filtres
- 📋 **Page détails** des offres complètes
- ✋ **Candidature** en ligne avec message personnalisé
- 📊 **Suivi des candidatures** (statut: en attente, examinée, acceptée, refusée)
- 👤 **Profil personnel** modifiable (informations, adresse, mot de passe)
- 📝 **Modification** des candidatures postérieures

### Pour les Entreprises
- 🏢 **Gestion du profil** entreprise
- ➕ **Création** d'offres d'emploi
- ✏️ **Modification/Suppression** d'offres
- 👥 **Consultation** des candidatures reçues
- 📊 **Suivi** des candidatures par statut
- 🗑️ **Gestion** des candidatures

### Pour les Administrateurs
- 🔐 **Accès total** au panel d'administration
- 🏪 **Gestion des entreprises** (CRUD complet)
- 💼 **Gestion des offres** (validation, modération)
- 👤 **Gestion des utilisateurs**
- 📋 **Suivi des candidatures** (modification de statut)
- 🎯 **Gestion des candidatures** (suppression, modification)

---

## 🏗️ Architecture

### Structure de fichiers

```text
NotLinkedIn/
├── templates/               # Templates Jinja2
│   ├── index.html          # Page d'accueil
│   ├── login.html          # Connexion
│   ├── register.html       # Inscription
│   ├── profile.html        # Profil utilisateur
│   ├── candidater.html     # Formulaire candidature
│   ├── candidatures.html   # Liste candidatures
│   ├── entreprise.html     # Gestion entreprise
│   ├── ajouter-offre.html  # Créer offre
│   ├── admin.html          # Admin panel
│   ├── admin_ajouter_entreprise.html
│   ├── admin_modifier_entreprise.html
│   ├── admin_ajouter_offre.html
│   └── admin_modifier_offre.html
│
├── static/
│   ├── fonts/              # Polices (Montserrat)
│   │   └── Montserrat.ttf
│   │
│   ├── icon/               # Icônes
│   │   └── NotLinkedIn_icon.ico
│   │
│   ├── images/             # Images
│   │   └── logo.png
│   │
│   ├── script/             # JavaScript
│   │   ├── script.js       # JS global
│   │   ├── profile.js      # JS profil
│   │   ├── admin.js        # JS admin
│   │   └── admin_candidatures.js
│   └── style/
│       ├── general.css         # Header, footer, animations
│       ├── variables.css       # Design tokens
│       ├── index.css           # Home page
│       ├── login.css           # Login page
│       ├── register.css        # Register page
│       ├── auth.css            # Auth shared styles
│       ├── profile.css         # Profile page
│       ├── admin.css           # Admin panel
│       ├── admin_form.css      # Admin forms
│       ├── admin_candidatures.css
│       ├── admin_items.css
│       ├── candidater.css      # Application form
│       ├── candidatures.css    # Candidatures list
│       ├── entreprise.css      # Company page
│       └── ajouter-offre.css   # Add job page
│
├── app.py                  # Application Flask principale
├── database.sql            # Script SQL
├── setup_db_auto.sh        # Script setup DB
├── Makefile                # Automatisation
├── requirements.txt        # Dépendances Python
├── TODO.md                 # Tâches en cours
└── README.md               # Ce fichier
```

### Architecture CSS

```text
style
├── admin_candidatures.css
├── admin_form.css
├── admin_items.css
├── admin.css
├── ajouter-offre.css
├── auth.css
├── candidater.css
├── candidatures.css
├── entreprise.css
├── general.css
├── index.css
├── login.css
├── profile.css
├── register.css
└── variables.css
```

Réduction: 75-81% de CSS par page

**Avantages:**

- ✅ **Performance**: Chargement sélectif par page
- ✅ **Maintenabilité**: Isolation des styles par page
- ✅ **Réutilisabilité**: Tokens partagés (variables.css)
- ✅ **Scalabilité**: Ajout facile de nouvelles pages

---

## 💾 Installation

### Prérequis

- Python 3.8+
- MySQL 5.7+
- pip

### Étapes

#### 1. Cloner le projet

```bash
git clone https://github.com/gossotjeanbaptiste/NotLinkedIn.git
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
# Puis exécuter database.sql
```

#### 5. Lancer l'application

```bash
# Avec Makefile
make run

# Ou directement
python app.py
```

---

## 🎮 Utilisation

### Comptes de test

#### Candidat

- **Email**: candidate@example.com
- **Mot de passe**: password123

#### Entreprise

- **Email**: company@example.com
- **Mot de passe**: password123

#### Admin

- **Email**: admin@example.com
- **Mot de passe**: admin123

### Workflows typiques

#### En tant que Candidat

1. S'inscrire ou se connecter
2. Parcourir les offres (recherche, filtres)
3. Cliquer sur une offre pour voir les détails
4. Cliquer "Postuler" et remplir le formulaire
5. Consulter "Mes candidatures" pour suivre le statut
6. Modifier profil et mot de passe dans "Mon Profil"

#### En tant que Entreprise

1. Se connecter
2. Accéder à "Mon Entreprise"
3. Créer une nouvelle offre
4. Consulter les candidatures reçues
5. Modifier le statut des candidatures
6. Modifier l'offre si nécessaire

#### En tant qu'Admin

1. Se connecter
2. Accéder à "Administration"
3. Naviguer entre les tabs:
   - **Entreprises**: CRUD des entreprises
   - **Offres**: Modération des offres
   - **Candidatures**: Suivi global

---

## 🛠️ Technologies

### Backend

- **Flask** 2.0+ - Framework web
- **MySQL** - Base de données
- **Python** 3.8+ - Langage

### Frontend

- **HTML5** - Structure
- **CSS3** - Styling (Glass Morphism)
- **JavaScript** - Interactivité
- **Jinja2** - Templating

### Design & UX

- **Glass Morphism** - Style design moderne
- **CSS Variables** - Design tokens
- **Responsive Design** - Mobile-first

### Outils

- **Makefile** - Automatisation
- **Virtual Environment** - Isolation Python

---

## 📊 Statut du projet

### ✅ Complété

- [x] Base de données MySQL
- [x] CRUD complet
- [x] Authentification utilisateur
- [x] Système de candidature
- [x] Admin panel
- [x] Profils utilisateur & entreprise
- [x] Design Glass Morphism
- [x] Architecture CSS modulaire
- [x] Responsive design

### ⏳ En cours / Planifié

- [ ] Tests automatisés (Unit & Integration)
- [ ] Déploiement production (Heroku/AWS)
- [ ] Notifications email
- [ ] Pagination améliorée
- [ ] Export CSV des candidatures
- [ ] Analytics et statistiques

---

## 🤝 Contribution

Les contributions sont bienvenues! Pour toute modification:

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

## 👨‍💻 Auteur

**Gossot Jean-Baptiste**

- GitHub: [@gossotjeanbaptiste](https://github.com/gossotjeanbaptiste)
- Email: jean-baptiste.gossot@epitech.eu

---

## 📞 Support

Pour toute question ou problème:

1. Consulter les issues existantes
2. Créer une nouvelle issue avec description détaillée
3. Fournir des logs/screenshots si possible

**Dernière mise à jour**: 3 novembre 2025
**Version**: 1.0.0
