# Job Board - Plateforme d'Offres d'Emploi

Ce projet est une plateforme web complète de recherche d'emploi développée avec **Python Flask** et **MySQL**. Elle permet aux entreprises de publier des offres d'emploi et aux candidats de postuler en ligne.

## 🚀 Fonctionnalités

### Fonctionnalités principales (Steps 1-8)

✅ **Step 01 - Base de données MySQL**

- Tables pour les annonces, entreprises, utilisateurs et candidatures
- Relations entre les tables avec clés étrangères
- Données d'exemple pré-chargées

✅ **Step 02 - Page d'accueil avec annonces**

- Affichage de toutes les offres d'emploi actives
- Titre, description courte, entreprise et informations essentielles
- Boutons "En savoir plus" et "Postuler"

✅ **Step 03 - Affichage dynamique des détails**

- Détails complets des offres sans rechargement de page
- Informations sur l'entreprise, salaire, lieu, type de contrat
- Interface responsive et intuitive

✅ **Step 04 - API REST avec CRUD**

- Endpoints RESTful pour toutes les entités
- Opérations Create, Read, Update, Delete
- Gestion des erreurs et réponses JSON

✅ **Step 05 - Système de candidature**

- Formulaire de candidature intégré
- Sauvegarde des candidatures en base de données
- Gestion des candidatures multiples

✅ **Step 06 - Authentification utilisateur**

- Système de connexion/inscription
- Sessions utilisateur sécurisées
- Pages spécifiques selon les droits

✅ **Step 07 - Interface d'administration**

- Panel d'admin pour la gestion CRUD
- Pagination pour les grandes listes
- Accès restreint aux administrateurs

✅ **Step 08 - Design moderne et responsive**

- Interface utilisateur moderne avec CSS avancé
- Design responsive pour mobile et desktop
- Expérience utilisateur optimisée

## 🛠️ Technologies utilisées

- **Backend:** Python 3, Flask
- **Base de données:** MySQL avec mysql-connector-python
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Sécurité:** Hashage des mots de passe, sessions Flask
- **Architecture:** Pattern MVC, API RESTful

## 📋 Prérequis

- Python 3.8+
- MySQL Server 8.0+
- Un navigateur web moderne

## ⚙️ Installation et Configuration

### 1. Cloner le projet

```bash
git clone <repository-url>
cd not_linkedin
```

### 2. Créer un environnement virtuel

```bash
python -m venv venv
# Sur Windows
venv\Scripts\activate
# Sur Linux/Mac
source venv/bin/activate
source venv/bin/activate
```

### 3. Installer les dépendances

```bash
pip install -r requirements.txt
```

### 4. Configuration de la base de données

**a) Créer la base de données MySQL :**

```bash
mysql -u root -p
```

**b) Exécuter le script SQL :**

```sql
source database.sql
```

Ou via un client MySQL, exécuter le contenu du fichier `database.sql`.

**c) Configurer la connexion dans `app.py` :**

```python
DB_CONFIG = {
    'host': 'localhost',
    'database': 'job_board',
    'user': 'votre_utilisateur_mysql',
    'password': 'votre_mot_de_passe_mysql',
    'charset': 'utf8mb4'
}
```

### 5. Lancer l'application

```bash
python app.py
```

L'application sera disponible sur `http://localhost:5000`

## 👤 Comptes de test

Les comptes suivants sont créés automatiquement :

**Administrateur :**

- Login: `admin`
- Mot de passe: `admin123`
- Accès à l'interface d'administration

**Utilisateur standard :**

- Login: `jdupont`
- Mot de passe: `password123`

**Utilisateur standard 2 :**

- Login: `mmartin`
- Mot de passe: `password123`

## 🏗️ Structure du projet

``` text
not_linkedin/
├── app.py                 # Application Flask principale
├── database.sql          # Script de création de la base de données
├── requirements.txt      # Dépendances Python
├── README.md            # Documentation
├── templates/           # Templates HTML Jinja2
│   ├── index.html      # Page d'accueil
│   ├── login.html      # Page de connexion
│   ├── register.html   # Page d'inscription
│   └── admin.html      # Interface d'administration
└── static/             # Fichiers statiques
    ├── style/
    │   └── style.css   # Feuilles de style
    ├── script/
    │   └── script.js   # JavaScript client
    └── icon/
        └── icon.ico    # Favicon
```

## 🔌 API Endpoints

### Authentification

- `GET /` - Page d'accueil avec annonces
- `GET/POST /login` - Connexion utilisateur
- `GET/POST /register` - Inscription utilisateur
- `GET /logout` - Déconnexion
- `GET /admin` - Interface d'administration (admin only)

### API REST

- `GET /api/advertisement/<id>` - Détails d'une annonce
- `POST /api/apply` - Postuler à une offre

### CRUD Admin (authentification admin requise)

**Entreprises :**

- `GET/POST /api/companies` - Liste/Création
- `GET/PUT/DELETE /api/companies/<id>` - Lecture/Modification/Suppression

**Annonces :**

- `GET/POST /api/advertisements` - Liste/Création
- `PUT/DELETE /api/advertisements/<id>` - Modification/Suppression

**Candidatures :**

- `GET /api/applications` - Liste des candidatures

## 💾 Base de données

### Tables principales

**companies** - Informations sur les entreprises

- id_company
- name
- address
- description
- website
- created_at

**people** - Utilisateurs et candidats

- id_people
- first_name
- surname
- email
- phone
- login
- password
- is_admin
- created_at

**advertisements** - Offres d'emploi

- id_ad
- title
- short_description
- full_description
- salary_min
- salary_max
- location
- work_time
- company_id
- posted_by
- created_at
- updated_at
- is_active

**job_applications** - Candidatures

- id_application
- id_ad
- id_people
- message
- application_date
- status

## 🔒 Sécurité

- Mots de passe hashés avec SHA-256
- Sessions Flask sécurisées
- Protection contre l'injection SQL avec requêtes préparées
- Contrôle d'accès basé sur les rôles (admin/utilisateur)
- Validation des données côté serveur

## 🎨 Fonctionnalités UI/UX

- Design responsive adapté mobile et desktop
- Interface moderne avec dégradés et animations
- Modales pour les formulaires
- Messages flash pour les notifications
- Pagination pour les grandes listes
- Chargement asynchrone des détails (AJAX)

## 🧪 Test local

1. Assurez-vous que MySQL est démarré
2. Créez la base de données avec le script fourni
3. Lancez l'application : `python app.py`
4. Accédez à `http://localhost:5000`
5. Testez les différentes fonctionnalités avec les comptes fournis

## 📝 Notes de développement

Ce projet respecte les meilleures pratiques de développement web :

- Architecture MVC claire
- Code commenté et documenté
- Gestion d'erreurs robuste
- API RESTful standard
- Interface utilisateur moderne
- Sécurité des données

## 🔧 Extensions possibles

- Système de notifications par email
- Upload de CV et lettres de motivation
- Recherche et filtres avancés
- Système de recommandations
- API pour applications mobiles
- Tests automatisés
