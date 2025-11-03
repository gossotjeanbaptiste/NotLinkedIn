from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
import hashlib
from datetime import datetime
import os
from mysql.connector import Error
import mysql.connector

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'  # Change this in production

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'database': 'job_board',
    'user': 'jobboard',  # Nouvel utilisateur créé
    'password': 'jobboard123',  # Mot de passe de l'utilisateur
    'charset': 'utf8mb4'
}


def get_db_connection():
    """Get database connection"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None


def hash_password(password):
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()


def get_db_connection():
    """Get database connection"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None


def hash_password(password):
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

# ============= MAIN PAGES =============


@app.route("/api/applications/<int:id_application>", methods=["DELETE", "PUT"])
def application_update_delete(id_application):
    if not session.get('user_id'):
        return jsonify({"error": "Non authentifié"}), 403
    connection = get_db_connection()
    if connection is None:
        return jsonify({"error": "Erreur de connexion à la base de données"}), 500
    cursor = connection.cursor()
    try:
        # Vérifier que la candidature appartient bien à l'utilisateur
        cursor.execute(
            "SELECT id_people FROM job_applications WHERE id_application = %s", (id_application,))
        result = cursor.fetchone()
        if not result or result[0] != session['user_id']:
            return jsonify({"error": "Accès refusé"}), 403
        if request.method == "DELETE":
            cursor.execute(
                "DELETE FROM job_applications WHERE id_application = %s", (id_application,))
            connection.commit()
            return jsonify({"success": True})
        elif request.method == "PUT":
            data = request.get_json()
            message = data.get('message', '')
            cursor.execute(
                "UPDATE job_applications SET message = %s WHERE id_application = %s", (message, id_application))
            connection.commit()
            return jsonify({"success": True})
    except Exception as e:
        print(f"Error update/delete application: {e}")
        return jsonify({"error": "Erreur serveur"}), 500
    finally:
        cursor.close()
        connection.close()


@app.route("/")
def index():
    """Display job advertisements"""
    connection = get_db_connection()
    if connection is None:
        return "Erreur de connexion à la base de données", 500

    try:
        cursor = connection.cursor(dictionary=True)
        query = """
            SELECT a.*, c.name as company_name 
            FROM advertisements a 
            JOIN companies c ON a.company_id = c.id_company 
            WHERE a.is_active = TRUE 
            ORDER BY a.created_at DESC
        """
        cursor.execute(query)
        ads = cursor.fetchall()
        cursor.close()
        connection.close()

        return render_template('index.html', advertisements=ads)
    except Error as e:
        print(f"Error fetching advertisements: {e}")
        return "Erreur lors de la récupération des annonces", 500


@app.route("/login", methods=['GET', 'POST'])
def login():
    """User login"""
    if request.method == 'POST':
        login = request.form['login']
        password = hash_password(request.form['password'])

        connection = get_db_connection()
        if connection is None:
            flash('Erreur de connexion à la base de données', 'error')
            return redirect(url_for('login'))

        try:
            cursor = connection.cursor(dictionary=True)
            cursor.execute(
                "SELECT * FROM people WHERE login = %s AND password = %s", (login, password))
            user = cursor.fetchone()
            cursor.close()
            connection.close()

            if user:
                session['user_id'] = user['id_people']
                session['username'] = user['first_name'] + \
                    ' ' + user['surname']
                session['is_admin'] = user['is_admin']

                if user['is_admin']:
                    return redirect(url_for('admin'))
                else:
                    return redirect(url_for('index'))
            else:
                flash('Identifiants incorrects', 'error')
        except Error as e:
            print(f"Error during login: {e}")
            flash('Erreur lors de la connexion', 'error')

    return render_template('login.html')


@app.route("/register", methods=['GET', 'POST'])
def register():
    """User registration"""
    if request.method == 'POST':
        try:
            connection = get_db_connection()
            if connection is None:
                flash('Erreur de connexion à la base de données', 'error')
                return redirect(url_for('register'))

            cursor = connection.cursor()
            cursor.execute("""
                INSERT INTO people (first_name, surname, email, phone, address_street, 
                                  address_postal_code, address_city, address_department, 
                                  address_country, login, password) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                request.form['first_name'],
                request.form['surname'],
                request.form['email'],
                request.form.get('phone', ''),
                request.form.get('address_street', ''),
                request.form.get('address_postal_code', ''),
                request.form.get('address_city', ''),
                request.form.get('address_department', ''),
                request.form.get('address_country', 'France'),
                request.form['login'],
                hash_password(request.form['password'])
            ))
            connection.commit()
            cursor.close()
            connection.close()

            flash(
                'Inscription réussie ! Vous pouvez maintenant vous connecter.', 'success')
            return redirect(url_for('login'))

        except mysql.connector.IntegrityError:
            flash('Ce nom d\'utilisateur ou email existe déjà', 'error')
        except Error as e:
            print(f"Error during registration: {e}")
            flash('Erreur lors de l\'inscription', 'error')

    return render_template('register.html')


@app.route("/logout")
def logout():
    """User logout"""
    session.clear()
    flash('Vous êtes déconnecté', 'info')
    return redirect(url_for('index'))


@app.route("/delete_account", methods=['POST'])
def delete_account():
    """Delete user account and all associated data"""
    if not session.get('user_id'):
        flash('Vous devez être connecté pour supprimer votre compte', 'error')
        return redirect(url_for('login'))

    user_id = session.get('user_id')
    username = session.get('username')

    connection = get_db_connection()
    if connection is None:
        flash('Erreur de connexion à la base de données', 'error')
        return redirect(url_for('profile'))

    try:
        cursor = connection.cursor()

        # Supprimer toutes les candidatures de l'utilisateur
        cursor.execute(
            "DELETE FROM job_applications WHERE id_people = %s", (user_id,))

        # Supprimer l'utilisateur de la table people
        cursor.execute("DELETE FROM people WHERE id_people = %s", (user_id,))

        # Vérifier que la suppression a bien eu lieu
        if cursor.rowcount > 0:
            connection.commit()
            cursor.close()
            connection.close()

            # Déconnecter l'utilisateur
            session.clear()

            flash(
                f'Le compte de {username} a été supprimé définitivement.', 'success')
            return redirect(url_for('index'))
        else:
            flash(
                'Erreur lors de la suppression du compte. Utilisateur non trouvé.', 'error')
            return redirect(url_for('profile'))

    except Error as e:
        print(f"Error deleting account: {e}")
        flash('Erreur lors de la suppression du compte', 'error')
        if connection:
            connection.rollback()
        return redirect(url_for('profile'))
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()


@app.route("/profile")
def profile():
    """User profile page with applications history"""
    if not session.get('user_id'):
        flash('Vous devez être connecté pour accéder à votre profil', 'error')
        return redirect(url_for('login'))

    connection = get_db_connection()
    if connection is None:
        flash('Erreur de connexion à la base de données', 'error')
        return redirect(url_for('index'))

    try:
        cursor = connection.cursor(dictionary=True)

        # Get user information with company information
        cursor.execute("""
            SELECT p.*, c.id_company, c.name as company_name, c.description as company_description,
                   c.website as company_website,
                   CONCAT(c.address_street, ', ', c.address_postal_code, ' ', c.address_city) as company_address,
                   c.address_street, c.address_postal_code, c.address_city, c.address_department, c.address_country,
                   c.sector as company_sector, c.company_size as company_size
            FROM people p
            LEFT JOIN companies c ON p.owned_company_id = c.id_company
            WHERE p.id_people = %s
        """, (session['user_id'],))
        user = cursor.fetchone()

        # Get user's applications
        cursor.execute("""
            SELECT ja.*, a.title as job_title, a.location, a.work_time,
                   c.name as company_name, c.website as company_website
            FROM job_applications ja
            JOIN advertisements a ON ja.id_ad = a.id_ad
            JOIN companies c ON a.company_id = c.id_company
            WHERE ja.id_people = %s
            ORDER BY ja.application_date DESC
        """, (session['user_id'],))
        applications = cursor.fetchall()

        # If user has a company, get company job postings and applications
        company_jobs = []
        if user and user['id_company']:
            cursor.execute("""
                SELECT a.*, COUNT(ja.id_application) as applications_count
                FROM advertisements a 
                LEFT JOIN job_applications ja ON a.id_ad = ja.id_ad
                WHERE a.company_id = %s 
                GROUP BY a.id_ad
                ORDER BY a.created_at DESC
            """, (user['id_company'],))
            company_jobs = cursor.fetchall()

        cursor.close()
        connection.close()

        return render_template('profile.html', user=user, applications=applications, company_jobs=company_jobs)

    except Error as e:
        print(f"Error fetching profile data: {e}")
        flash('Erreur lors de la récupération du profil', 'error')
        return redirect(url_for('index'))


@app.route("/entreprise")
def entreprise():
    """Page dédiée à la gestion d'entreprise"""
    if not session.get('user_id'):
        flash('Vous devez être connecté pour accéder à cette page', 'error')
        return redirect(url_for('login'))

    connection = get_db_connection()
    if connection is None:
        flash('Erreur de connexion à la base de données', 'error')
        return redirect(url_for('index'))

    try:
        cursor = connection.cursor(dictionary=True)

        # Get user information with company information
        cursor.execute("""
            SELECT p.*, c.id_company, c.name as company_name, c.description as company_description,
                   c.website as company_website,
                   CONCAT(c.address_street, ', ', c.address_postal_code, ' ', c.address_city) as company_address,
                   c.address_street, c.address_postal_code, c.address_city, c.address_department, c.address_country,
                   c.sector as company_sector, c.company_size as company_size
            FROM people p
            LEFT JOIN companies c ON p.owned_company_id = c.id_company
            WHERE p.id_people = %s
        """, (session['user_id'],))
        user = cursor.fetchone()

        # If user has a company, get company job postings and applications
        company_jobs = []
        if user and user['id_company']:
            cursor.execute("""
                SELECT a.*, COUNT(ja.id_application) as applications_count
                FROM advertisements a 
                LEFT JOIN job_applications ja ON a.id_ad = ja.id_ad
                WHERE a.company_id = %s 
                GROUP BY a.id_ad
                ORDER BY a.created_at DESC
            """, (user['id_company'],))
            company_jobs = cursor.fetchall()

        cursor.close()
        connection.close()

        return render_template('entreprise.html', user=user, company_jobs=company_jobs)

    except Error as e:
        print(f"Error fetching company data: {e}")
        flash('Erreur lors de la récupération des données de l\'entreprise', 'error')
        return redirect(url_for('index'))


@app.route("/ajouter-offre")
def ajouter_offre():
    """Page dédiée à la création ou modification d'une offre d'emploi"""
    if not session.get('user_id'):
        flash('Vous devez être connecté pour accéder à cette page', 'error')
        return redirect(url_for('login'))

    # Récupérer l'ID de l'offre à modifier (optionnel)
    job_id = request.args.get('job_id')

    connection = get_db_connection()
    if connection is None:
        flash('Erreur de connexion à la base de données', 'error')
        return redirect(url_for('index'))

    try:
        cursor = connection.cursor(dictionary=True)

        # Vérifier que l'utilisateur possède une entreprise
        cursor.execute("""
            SELECT p.*, c.id_company, c.name as company_name
            FROM people p
            LEFT JOIN companies c ON p.owned_company_id = c.id_company
            WHERE p.id_people = %s
        """, (session['user_id'],))
        user = cursor.fetchone()

        # Rediriger si l'utilisateur n'a pas d'entreprise
        if not user or not user['id_company']:
            flash(
                'Vous devez créer une entreprise avant de pouvoir publier des offres d\'emploi', 'error')
            return redirect(url_for('entreprise'))

        job_data = None
        # Si c'est une modification, récupérer les données de l'offre
        if job_id:
            cursor.execute("""
                SELECT * FROM advertisements 
                WHERE id_ad = %s AND company_id = %s
            """, (job_id, user['id_company']))
            job_data = cursor.fetchone()

            if not job_data:
                flash(
                    'Offre d\'emploi non trouvée ou vous n\'avez pas les droits pour la modifier', 'error')
                return redirect(url_for('entreprise'))

        cursor.close()
        connection.close()

        return render_template('ajouter-offre.html', user=user, job_data=job_data)

    except Error as e:
        print(f"Error checking company ownership: {e}")
        flash('Erreur lors de la vérification des données', 'error')
        return redirect(url_for('index'))


@app.route("/candidatures/<int:job_id>")
def candidatures(job_id):
    """Page dédiée à l'affichage des candidatures d'une offre d'emploi"""
    if not session.get('user_id'):
        flash('Vous devez être connecté pour accéder à cette page', 'error')
        return redirect(url_for('login'))

    connection = get_db_connection()
    if connection is None:
        flash('Erreur de connexion à la base de données', 'error')
        return redirect(url_for('index'))

    try:
        cursor = connection.cursor(dictionary=True)

        # Vérifier que l'utilisateur possède l'entreprise qui a posté cette offre
        cursor.execute("""
            SELECT a.*, c.name as company_name, p.owned_company_id
            FROM advertisements a
            JOIN companies c ON a.company_id = c.id_company
            JOIN people p ON p.id_people = %s
            WHERE a.id_ad = %s
        """, (session['user_id'], job_id))

        job_info = cursor.fetchone()

        if not job_info:
            flash('Offre d\'emploi non trouvée', 'error')
            return redirect(url_for('entreprise'))

        if job_info['company_id'] != job_info['owned_company_id']:
            flash('Vous n\'avez pas les droits pour voir ces candidatures', 'error')
            return redirect(url_for('entreprise'))

        # Récupérer les candidatures avec les informations des candidats
        cursor.execute("""
            SELECT ja.*, p.first_name, p.surname, p.email, p.phone,
                   p.address_street, p.address_city
            FROM job_applications ja
            JOIN people p ON ja.id_people = p.id_people
            WHERE ja.id_ad = %s
            ORDER BY ja.application_date DESC
        """, (job_id,))

        applications = cursor.fetchall()

        cursor.close()
        connection.close()

        return render_template('candidatures.html', job_info=job_info, applications=applications)

    except Error as e:
        print(f"Error fetching applications: {e}")
        flash('Erreur lors de la récupération des candidatures', 'error')
        return redirect(url_for('entreprise'))


@app.route("/change-password", methods=['POST'])
def change_password():
    """Change user password"""
    if not session.get('user_id'):
        return jsonify({"error": "Non autorisé"}), 401

    try:
        current_password = request.form['current_password']
        new_password = request.form['new_password']
        confirm_password = request.form['confirm_password']

        if new_password != confirm_password:
            flash('Les nouveaux mots de passe ne correspondent pas', 'error')
            return redirect(url_for('profile'))

        if len(new_password) < 6:
            flash('Le mot de passe doit contenir au moins 6 caractères', 'error')
            return redirect(url_for('profile'))

        connection = get_db_connection()
        if connection is None:
            flash('Erreur de connexion à la base de données', 'error')
            return redirect(url_for('profile'))

        cursor = connection.cursor(dictionary=True)

        # Verify current password
        cursor.execute(
            "SELECT password FROM people WHERE id_people = %s", (session['user_id'],))
        user = cursor.fetchone()

        if user['password'] != hash_password(current_password):
            flash('Mot de passe actuel incorrect', 'error')
            cursor.close()
            connection.close()
            return redirect(url_for('profile'))

        # Update password
        new_password_hash = hash_password(new_password)
        cursor.execute(
            "UPDATE people SET password = %s WHERE id_people = %s",
            (new_password_hash, session['user_id'])
        )
        connection.commit()
        cursor.close()
        connection.close()

        flash('Mot de passe modifié avec succès', 'success')
        return redirect(url_for('profile'))

    except Error as e:
        print(f"Error changing password: {e}")
        flash('Erreur lors de la modification du mot de passe', 'error')
        return redirect(url_for('profile'))


@app.route("/update-profile", methods=['POST'])
def update_profile():
    """Update user profile information"""
    if not session.get('user_id'):
        return jsonify({"error": "Non autorisé"}), 401

    try:
        # Validate required fields
        required_fields = ['first_name', 'surname', 'email', 'login']
        for field in required_fields:
            if not request.form.get(field):
                flash(f'Le champ {field} est requis', 'error')
                return redirect(url_for('profile'))

        first_name = request.form['first_name']
        surname = request.form['surname']
        email = request.form['email']
        phone = request.form.get('phone', '')
        address_street = request.form.get('address_street', '')
        address_postal_code = request.form.get('address_postal_code', '')
        address_city = request.form.get('address_city', '')
        address_department = request.form.get('address_department', '')
        address_country = request.form.get('address_country', 'France')
        login = request.form['login']

        # Validate email format
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            flash('Format d\'email invalide', 'error')
            return redirect(url_for('profile'))

        connection = get_db_connection()
        if connection is None:
            flash('Erreur de connexion à la base de données', 'error')
            return redirect(url_for('profile'))

        cursor = connection.cursor()

        # Check if email or login already exists for other users
        cursor.execute("""
            SELECT id_people FROM people 
            WHERE (email = %s OR login = %s) AND id_people != %s
        """, (email, login, session['user_id']))

        if cursor.fetchone():
            flash('Cet email ou nom d\'utilisateur est déjà utilisé', 'error')
            cursor.close()
            connection.close()
            return redirect(url_for('profile'))

        # Update user information
        cursor.execute("""
            UPDATE people SET 
            first_name = %s, surname = %s, email = %s, phone = %s, 
            address_street = %s, address_postal_code = %s, address_city = %s, 
            address_department = %s, address_country = %s, login = %s 
            WHERE id_people = %s
        """, (first_name, surname, email, phone, address_street, address_postal_code,
              address_city, address_department, address_country, login, session['user_id']))

        connection.commit()
        cursor.close()
        connection.close()

        # Update session information with new data
        session['user_login'] = login
        session['username'] = first_name + ' ' + surname

        flash('Profil mis à jour avec succès', 'success')
        return redirect(url_for('profile'))

    except mysql.connector.IntegrityError:
        flash('Cet email ou nom d\'utilisateur existe déjà', 'error')
        return redirect(url_for('profile'))
    except Error as e:
        print(f"Error updating profile: {e}")
        flash('Erreur lors de la mise à jour du profil', 'error')
        return redirect(url_for('profile'))


@app.route("/admin")
def admin():
    """Admin panel"""
    if not session.get('is_admin'):
        flash('Accès refusé', 'error')
        return redirect(url_for('index'))

    return render_template('admin.html')


@app.route("/admin_ajouter_entreprise")
def admin_ajouter_entreprise():
    """Page to add a company (admin)"""
    if not session.get('is_admin'):
        flash('Accès refusé', 'error')
        return redirect(url_for('index'))

    return render_template('admin_ajouter_entreprise.html')


@app.route("/admin_modifier_entreprise")
def admin_modifier_entreprise():
    """Page to edit a company (admin)"""
    if not session.get('is_admin'):
        flash('Accès refusé', 'error')
        return redirect(url_for('index'))

    return render_template('admin_modifier_entreprise.html')


@app.route("/admin_ajouter_offre")
def admin_ajouter_offre():
    """Page to add a job advertisement (admin)"""
    if not session.get('is_admin'):
        flash('Accès refusé', 'error')
        return redirect(url_for('index'))

    return render_template('admin_ajouter_offre.html')


@app.route("/admin_modifier_offre")
def admin_modifier_offre():
    """Page to edit a job advertisement (admin)"""
    if not session.get('is_admin'):
        flash('Accès refusé', 'error')
        return redirect(url_for('index'))

    return render_template('admin_modifier_offre.html')

# ============= API ENDPOINTS =============


@app.route("/api/advertisement/<int:ad_id>")
def get_advertisement_details(ad_id):
    """Get detailed information about a specific advertisement"""
    connection = get_db_connection()
    if connection is None:
        return jsonify({"error": "Database connection error"}), 500

    try:
        cursor = connection.cursor(dictionary=True)
        query = """
            SELECT a.*, c.name as company_name, 
                   CONCAT(c.address_street, ', ', c.address_postal_code, ' ', c.address_city) as company_address,
                   c.address_street, c.address_postal_code, c.address_city, c.address_department, c.address_country,
                   c.description as company_description, c.website as company_website,
                   p.first_name, p.surname 
            FROM advertisements a 
            JOIN companies c ON a.company_id = c.id_company 
            LEFT JOIN people p ON a.posted_by = p.id_people 
            WHERE a.id_ad = %s AND a.is_active = TRUE
        """
        cursor.execute(query, (ad_id,))
        ad = cursor.fetchone()
        cursor.close()
        connection.close()

        if ad:
            return jsonify(ad)
        else:
            return jsonify({"error": "Advertisement not found"}), 404
    except Error as e:
        print(f"Error fetching advertisement details: {e}")
        return jsonify({"error": "Database error"}), 500


@app.route("/candidater/<int:ad_id>")
def apply_job_page(ad_id):
    """Display application page for a specific job"""
    if not session.get('user_id'):
        flash('Vous devez être connecté pour postuler', 'info')
        return redirect(url_for('login'))

    connection = get_db_connection()
    if connection is None:
        flash('Erreur de connexion à la base de données', 'error')
        return redirect(url_for('index'))

    try:
        cursor = connection.cursor(dictionary=True)
        query = """
            SELECT a.*, c.name as company_name, 
                   CONCAT(c.address_street, ', ', c.address_postal_code, ' ', c.address_city) as company_address,
                   c.address_street, c.address_postal_code, c.address_city, c.address_department, c.address_country,
                   c.description as company_description, c.website as company_website, c.sector as company_sector, c.company_size,
                   p.first_name, p.surname 
            FROM advertisements a 
            JOIN companies c ON a.company_id = c.id_company 
            LEFT JOIN people p ON a.posted_by = p.id_people 
            WHERE a.id_ad = %s AND a.is_active = TRUE
        """
        cursor.execute(query, (ad_id,))
        ad = cursor.fetchone()
        cursor.close()
        connection.close()

        if not ad:
            flash('Offre d\'emploi non trouvée', 'error')
            return redirect(url_for('index'))

        # Get user info for display
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            "SELECT first_name, surname FROM people WHERE id_people = %s", (session['user_id'],))
        user = cursor.fetchone()
        cursor.close()
        connection.close()

        if user:
            session['user_name'] = f"{user['first_name']} {user['surname']}"

        return render_template('candidater.html', ad=ad)

    except Error as e:
        print(f"Error loading application page: {e}")
        flash('Erreur lors du chargement de la page', 'error')
        return redirect(url_for('index'))


@app.route("/api/apply", methods=['POST'])
def apply_to_job():
    """Handle job application"""
    try:
        ad_id = request.form['ad_id']
        message = request.form['message']

        connection = get_db_connection()
        if connection is None:
            return jsonify({"error": "Database connection error"}), 500

        cursor = connection.cursor()

        if session.get('user_id'):
            # User is logged in
            user_id = session['user_id']
            cursor.execute("""
                INSERT INTO job_applications (id_ad, id_people, message) 
                VALUES (%s, %s, %s)
            """, (ad_id, user_id, message))
        else:
            # Anonymous application - create temporary user or handle differently
            return jsonify({"error": "Veuillez vous connecter pour postuler"}), 401

        connection.commit()
        cursor.close()
        connection.close()

        return jsonify({"success": True, "message": "Candidature envoyée avec succès"})

    except mysql.connector.IntegrityError:
        return jsonify({"error": "Vous avez déjà postulé à cette offre"}), 400
    except Error as e:
        print(f"Error submitting application: {e}")
        return jsonify({"error": "Erreur lors de l'envoi de la candidature"}), 500

# ============= CRUD API ENDPOINTS =============

# Companies CRUD


@app.route("/api/companies", methods=['GET', 'POST'])
def companies_crud():
    connection = get_db_connection()
    if connection is None:
        return jsonify({"error": "Database connection error"}), 500

    cursor = connection.cursor(dictionary=True)

    try:
        if request.method == 'GET':
            # Admin peut voir toutes les entreprises, utilisateur normal voit seulement les siennes
            if session.get('is_admin'):
                page = int(request.args.get('page', 1))
                per_page = int(request.args.get('per_page', 10))
                offset = (page - 1) * per_page

                cursor.execute("SELECT COUNT(*) as total FROM companies")
                total = cursor.fetchone()['total']

                cursor.execute("""
                    SELECT c.*, p.first_name, p.surname 
                    FROM companies c 
                    LEFT JOIN people p ON c.created_by = p.id_people 
                    LIMIT %s OFFSET %s
                """, (per_page, offset))
                companies = cursor.fetchall()

                return jsonify({
                    "companies": companies,
                    "total": total,
                    "page": page,
                    "per_page": per_page,
                    "total_pages": (total + per_page - 1) // per_page
                })
            else:
                # Retourner toutes les entreprises pour affichage public
                cursor.execute(
                    "SELECT * FROM companies ORDER BY created_at DESC")
                companies = cursor.fetchall()
                return jsonify({"companies": companies})

        elif request.method == 'POST':
            if not session.get('user_id'):
                return jsonify({"error": "Authentification requise"}), 401

            data = request.json
            user_id = session['user_id']

            # Vérifier si l'utilisateur possède déjà une entreprise
            cursor.execute(
                "SELECT owned_company_id FROM people WHERE id_people = %s", (user_id,))
            user_data = cursor.fetchone()

            if user_data and user_data['owned_company_id']:
                return jsonify({"error": "Vous possédez déjà une entreprise"}), 400

            # Créer la nouvelle entreprise
            cursor.execute("""
                INSERT INTO companies (name, address_street, address_postal_code, address_city, address_department, address_country, description, website, created_by, sector, company_size) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                data['name'],
                data.get('address_street'),
                data.get('address_postal_code'),
                data.get('address_city'),
                data.get('address_department'),
                data.get('address_country', 'France'),
                data.get('description'),
                data.get('website'),
                user_id,
                data.get('sector'),
                data.get('company_size')
            ))

            company_id = cursor.lastrowid

            # Mettre à jour l'utilisateur pour qu'il possède cette entreprise
            cursor.execute("""
                UPDATE people SET owned_company_id = %s WHERE id_people = %s
            """, (company_id, user_id))

            connection.commit()
            return jsonify({"success": True, "id": company_id})

    except Error as e:
        print(f"Error in companies CRUD: {e}")
        return jsonify({"error": "Database error"}), 500
    finally:
        cursor.close()
        connection.close()


@app.route("/api/companies/<int:company_id>", methods=['GET', 'PUT', 'DELETE'])
def company_crud(company_id):
    connection = get_db_connection()
    if connection is None:
        return jsonify({"error": "Database connection error"}), 500

    cursor = connection.cursor(dictionary=True)

    try:
        if request.method == 'GET':
            cursor.execute("""
                SELECT c.*, p.first_name, p.surname 
                FROM companies c 
                LEFT JOIN people p ON c.created_by = p.id_people 
                WHERE c.id_company = %s
            """, (company_id,))
            company = cursor.fetchone()

            if company:
                return jsonify(company)
            else:
                return jsonify({"error": "Not found"}), 404

        elif request.method == 'PUT':
            if not session.get('user_id'):
                return jsonify({"error": "Authentification requise"}), 401

            # Vérifier que l'utilisateur possède cette entreprise ou est admin
            user_id = session['user_id']
            is_admin = session.get('is_admin', False)

            cursor.execute(
                "SELECT created_by FROM companies WHERE id_company = %s", (company_id,))
            company = cursor.fetchone()

            if not company:
                return jsonify({"error": "Entreprise non trouvée"}), 404

            if not is_admin and company['created_by'] != user_id:
                return jsonify({"error": "Accès refusé"}), 403

            data = request.json
            cursor.execute("""
                UPDATE companies 
                SET name = %s, address_street = %s, address_postal_code = %s, address_city = %s, 
                    address_department = %s, address_country = %s, description = %s, website = %s, sector = %s, company_size = %s
                WHERE id_company = %s
            """, (
                data['name'],
                data.get('address_street'),
                data.get('address_postal_code'),
                data.get('address_city'),
                data.get('address_department'),
                data.get('address_country', 'France'),
                data.get('description'),
                data.get('website'),
                data.get('sector'),
                data.get('company_size'),
                company_id
            ))
            connection.commit()
            return jsonify({"success": True})

        elif request.method == 'DELETE':
            if not session.get('user_id'):
                return jsonify({"error": "Authentification requise"}), 401

            # Vérifier que l'utilisateur possède cette entreprise ou est admin
            user_id = session['user_id']
            is_admin = session.get('is_admin', False)

            cursor.execute(
                "SELECT created_by FROM companies WHERE id_company = %s", (company_id,))
            company = cursor.fetchone()

            if not company:
                return jsonify({"error": "Entreprise non trouvée"}), 404

            if not is_admin and company['created_by'] != user_id:
                return jsonify({"error": "Accès refusé"}), 403

            # Mettre à jour l'utilisateur qui possédait cette entreprise
            cursor.execute(
                "UPDATE people SET owned_company_id = NULL WHERE owned_company_id = %s", (company_id,))

            # Supprimer l'entreprise
            cursor.execute(
                "DELETE FROM companies WHERE id_company = %s", (company_id,))
            connection.commit()
            return jsonify({"success": True})

    except Exception as e:
        print(f"Error in company CRUD: {e}")
        return jsonify({"error": "Database error"}), 500
    finally:
        cursor.close()
        connection.close()

# ============= ENTERPRISE MANAGEMENT ROUTES =============


@app.route("/api/my-company", methods=['GET', 'POST', 'PUT', 'DELETE'])
def manage_my_company():
    """Gérer l'entreprise de l'utilisateur connecté"""
    if not session.get('user_id'):
        return jsonify({"error": "Authentification requise"}), 401

    connection = get_db_connection()
    if connection is None:
        return jsonify({"error": "Database connection error"}), 500

    cursor = connection.cursor(dictionary=True)

    try:
        user_id = session['user_id']

        if request.method == 'GET':
            # Récupérer l'entreprise de l'utilisateur
            cursor.execute("""
                SELECT c.* 
                FROM companies c 
                JOIN people p ON p.owned_company_id = c.id_company 
                WHERE p.id_people = %s
            """, (user_id,))

            company = cursor.fetchone()
            return jsonify({"company": company})

        elif request.method == 'POST':
            # Créer une nouvelle entreprise
            data = request.get_json()

            # Vérifier que l'utilisateur n'a pas déjà une entreprise
            cursor.execute(
                "SELECT owned_company_id FROM people WHERE id_people = %s", (user_id,))
            user = cursor.fetchone()

            if user and user['owned_company_id']:
                return jsonify({"status": "error", "message": "Vous possédez déjà une entreprise"}), 400

            # Créer l'entreprise
            cursor.execute("""
                INSERT INTO companies (name, address_street, address_postal_code, address_city, address_department, address_country, description, website, sector, company_size, created_by) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                data.get('name'),
                data.get('address_street'),
                data.get('address_postal_code'),
                data.get('address_city'),
                data.get('address_department'),
                data.get('address_country', 'France'),
                data.get('description'),
                data.get('website'),
                data.get('sector'),
                data.get('company_size'),
                user_id
            ))

            company_id = cursor.lastrowid

            # Associer l'entreprise à l'utilisateur
            cursor.execute("""
                UPDATE people SET owned_company_id = %s WHERE id_people = %s
            """, (company_id, user_id))

            connection.commit()
            return jsonify({"status": "success", "message": "Entreprise créée avec succès", "company_id": company_id})

        elif request.method == 'PUT':
            # Modifier l'entreprise existante
            data = request.get_json()

            # Récupérer l'ID de l'entreprise de l'utilisateur
            cursor.execute(
                "SELECT owned_company_id FROM people WHERE id_people = %s", (user_id,))
            user = cursor.fetchone()

            if not user or not user['owned_company_id']:
                return jsonify({"status": "error", "message": "Vous ne possédez pas d'entreprise"}), 400

            company_id = user['owned_company_id']

            # Mettre à jour l'entreprise
            cursor.execute("""
                UPDATE companies SET 
                name = %s, address_street = %s, address_postal_code = %s, address_city = %s,
                address_department = %s, address_country = %s, description = %s, website = %s, 
                sector = %s, company_size = %s 
                WHERE id_company = %s AND created_by = %s
            """, (
                data.get('name'),
                data.get('address_street'),
                data.get('address_postal_code'),
                data.get('address_city'),
                data.get('address_department'),
                data.get('address_country', 'France'),
                data.get('description'),
                data.get('website'),
                data.get('sector'),
                data.get('company_size'),
                company_id,
                user_id
            ))

            connection.commit()
            return jsonify({"status": "success", "message": "Entreprise mise à jour avec succès"})

        elif request.method == 'DELETE':
            # Supprimer l'entreprise de l'utilisateur
            # Récupérer l'ID de l'entreprise de l'utilisateur
            cursor.execute(
                "SELECT owned_company_id FROM people WHERE id_people = %s", (user_id,))
            user = cursor.fetchone()

            if not user or not user['owned_company_id']:
                return jsonify({"status": "error", "message": "Vous ne possédez pas d'entreprise"}), 400

            company_id = user['owned_company_id']

            # Supprimer d'abord les candidatures liées aux offres de l'entreprise
            cursor.execute("""
                DELETE ja FROM job_applications ja
                INNER JOIN advertisements a ON ja.id_ad = a.id_ad
                WHERE a.company_id = %s
            """, (company_id,))

            # Supprimer les offres d'emploi de l'entreprise
            cursor.execute(
                "DELETE FROM advertisements WHERE company_id = %s", (company_id,))

            # Dissocier l'entreprise de l'utilisateur
            cursor.execute(
                "UPDATE people SET owned_company_id = NULL WHERE id_people = %s", (user_id,))

            # Supprimer l'entreprise
            cursor.execute(
                "DELETE FROM companies WHERE id_company = %s AND created_by = %s", (company_id, user_id))

            connection.commit()
            return jsonify({"status": "success", "message": "Entreprise supprimée avec succès"})

    except Exception as e:
        print(f"Error managing user company: {e}")
        return jsonify({"status": "error", "message": "Erreur de base de données"}), 500
    finally:
        cursor.close()
        connection.close()


@app.route("/api/my-company/jobs", methods=['GET', 'POST'])
def manage_company_jobs():
    """Gérer les offres d'emploi de l'entreprise de l'utilisateur"""
    if not session.get('user_id'):
        return jsonify({"error": "Authentification requise"}), 401

    connection = get_db_connection()
    if connection is None:
        return jsonify({"error": "Database connection error"}), 500

    cursor = connection.cursor(dictionary=True)

    try:
        user_id = session['user_id']

        # Vérifier que l'utilisateur possède une entreprise
        cursor.execute(
            "SELECT owned_company_id FROM people WHERE id_people = %s", (user_id,))
        user_data = cursor.fetchone()

        if not user_data or not user_data['owned_company_id']:
            return jsonify({"error": "Vous ne possédez pas d'entreprise"}), 403

        company_id = user_data['owned_company_id']

        if request.method == 'GET':
            # Récupérer toutes les offres de l'entreprise
            cursor.execute("""
                SELECT a.*, COUNT(ja.id_application) as applications_count
                FROM advertisements a 
                LEFT JOIN job_applications ja ON a.id_ad = ja.id_ad
                WHERE a.company_id = %s 
                GROUP BY a.id_ad
                ORDER BY a.created_at DESC
            """, (company_id,))

            jobs = cursor.fetchall()
            return jsonify({"jobs": jobs})

        elif request.method == 'POST':
            # Créer une nouvelle offre d'emploi
            data = request.json
            cursor.execute("""
                INSERT INTO advertisements (title, short_description, full_description, 
                                         salary_min, salary_max, location, work_time, 
                                         company_id, posted_by) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                data['title'],
                data.get('short_description'),
                data.get('full_description'),
                data.get('salary_min'),
                data.get('salary_max'),
                data.get('location'),
                data.get('work_time', 'full-time'),
                company_id,
                user_id
            ))

            connection.commit()
            return jsonify({"success": True, "id": cursor.lastrowid})

    except Exception as e:
        print(f"Error managing company jobs: {e}")
        return jsonify({"error": "Database error"}), 500
    finally:
        cursor.close()
        connection.close()


@app.route("/api/my-company/jobs/<int:job_id>/applications", methods=['GET'])
def get_job_applications(job_id):
    """Récupérer les candidatures pour une offre d'emploi spécifique"""
    if not session.get('user_id'):
        return jsonify({"error": "Authentification requise"}), 401

    connection = get_db_connection()
    if connection is None:
        return jsonify({"error": "Database connection error"}), 500

    cursor = connection.cursor(dictionary=True)

    try:
        user_id = session['user_id']

        # Vérifier que l'utilisateur possède l'entreprise qui a posté cette offre
        cursor.execute("""
            SELECT a.company_id, p.owned_company_id 
            FROM advertisements a
            JOIN people p ON p.id_people = %s
            WHERE a.id_ad = %s
        """, (user_id, job_id))

        result = cursor.fetchone()
        if not result or result['company_id'] != result['owned_company_id']:
            return jsonify({"error": "Accès refusé"}), 403

        # Récupérer les candidatures avec les informations des candidats
        cursor.execute("""
            SELECT ja.*, p.first_name, p.surname, p.email, p.phone,
                   p.address_street, p.address_city, a.title as job_title
            FROM job_applications ja
            JOIN people p ON ja.id_people = p.id_people
            JOIN advertisements a ON ja.id_ad = a.id_ad
            WHERE ja.id_ad = %s
            ORDER BY ja.application_date DESC
        """, (job_id,))

        applications = cursor.fetchall()
        return jsonify({"applications": applications})

    except Exception as e:
        print(f"Error getting job applications: {e}")
        return jsonify({"error": "Database error"}), 500
    finally:
        cursor.close()
        connection.close()


@app.route("/api/my-company/jobs/<int:job_id>", methods=['DELETE'])
def delete_company_job(job_id):
    """Supprimer une offre d'emploi de l'entreprise de l'utilisateur"""
    if not session.get('user_id'):
        return jsonify({"error": "Authentification requise"}), 401

    connection = get_db_connection()
    if connection is None:
        return jsonify({"error": "Database connection error"}), 500

    cursor = connection.cursor(dictionary=True)

    try:
        user_id = session['user_id']

        # Vérifier que l'utilisateur possède l'entreprise qui a posté cette offre
        cursor.execute("""
            SELECT a.company_id, p.owned_company_id, a.title
            FROM advertisements a
            JOIN people p ON p.id_people = %s
            WHERE a.id_ad = %s
        """, (user_id, job_id))

        result = cursor.fetchone()
        if not result:
            return jsonify({"error": "Offre d'emploi non trouvée"}), 404

        if result['company_id'] != result['owned_company_id']:
            return jsonify({"error": "Accès refusé - vous ne pouvez supprimer que vos propres offres"}), 403

        # Supprimer l'offre d'emploi (les candidatures seront supprimées automatiquement grâce à ON DELETE CASCADE)
        cursor.execute(
            "DELETE FROM advertisements WHERE id_ad = %s", (job_id,))

        if cursor.rowcount == 0:
            return jsonify({"error": "Offre d'emploi non trouvée"}), 404

        connection.commit()
        return jsonify({"success": True, "message": f"Offre '{result['title']}' supprimée avec succès"})

    except Exception as e:
        print(f"Error deleting job: {e}")
        return jsonify({"error": "Database error"}), 500
    finally:
        cursor.close()
        connection.close()


@app.route("/api/my-company/jobs/<int:job_id>", methods=['PUT'])
def update_company_job(job_id):
    """Modifier une offre d'emploi de l'entreprise de l'utilisateur"""
    if not session.get('user_id'):
        return jsonify({"error": "Authentification requise"}), 401

    connection = get_db_connection()
    if connection is None:
        return jsonify({"error": "Database connection error"}), 500

    cursor = connection.cursor(dictionary=True)

    try:
        user_id = session['user_id']
        data = request.json

        # Vérifier que l'utilisateur possède l'entreprise qui a posté cette offre
        cursor.execute("""
            SELECT a.company_id, p.owned_company_id
            FROM advertisements a
            JOIN people p ON p.id_people = %s
            WHERE a.id_ad = %s
        """, (user_id, job_id))

        result = cursor.fetchone()
        if not result:
            return jsonify({"error": "Offre d'emploi non trouvée"}), 404

        if result['company_id'] != result['owned_company_id']:
            return jsonify({"error": "Accès refusé - vous ne pouvez modifier que vos propres offres"}), 403

        # Mettre à jour l'offre d'emploi
        cursor.execute("""
            UPDATE advertisements 
            SET title = %s, short_description = %s, full_description = %s,
                salary_min = %s, salary_max = %s, location = %s, work_time = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE id_ad = %s
        """, (
            data['title'],
            data.get('short_description'),
            data.get('full_description'),
            data.get('salary_min'),
            data.get('salary_max'),
            data.get('location'),
            data.get('work_time', 'full-time'),
            job_id
        ))

        if cursor.rowcount == 0:
            return jsonify({"error": "Offre d'emploi non trouvée"}), 404

        connection.commit()
        return jsonify({"success": True, "message": "Offre d'emploi modifiée avec succès"})

    except Exception as e:
        print(f"Error updating job: {e}")
        return jsonify({"error": "Database error"}), 500
    finally:
        cursor.close()
        connection.close()


@app.route("/api/my-company/applications/<int:application_id>/status", methods=['PUT'])
def update_application_status(application_id):
    """Mettre à jour le statut d'une candidature"""
    if not session.get('user_id'):
        return jsonify({"error": "Authentification requise"}), 401

    connection = get_db_connection()
    if connection is None:
        return jsonify({"error": "Database connection error"}), 500

    cursor = connection.cursor(dictionary=True)

    try:
        user_id = session['user_id']
        data = request.json
        new_status = data.get('status')

        if new_status not in ['pending', 'reviewed', 'accepted', 'rejected']:
            return jsonify({"error": "Statut invalide"}), 400

        # Vérifier que l'utilisateur possède l'entreprise liée à cette candidature
        cursor.execute("""
            SELECT ja.id_application, a.company_id, p.owned_company_id 
            FROM job_applications ja
            JOIN advertisements a ON ja.id_ad = a.id_ad
            JOIN people p ON p.id_people = %s
            WHERE ja.id_application = %s
        """, (user_id, application_id))

        result = cursor.fetchone()
        if not result or result['company_id'] != result['owned_company_id']:
            return jsonify({"error": "Accès refusé"}), 403

        # Mettre à jour le statut
        cursor.execute("""
            UPDATE job_applications 
            SET status = %s 
            WHERE id_application = %s
        """, (new_status, application_id))

        connection.commit()
        return jsonify({"success": True})

    except Exception as e:
        print(f"Error updating application status: {e}")
        return jsonify({"error": "Database error"}), 500
    finally:
        cursor.close()
        connection.close()

# Advertisements CRUD


@app.route("/api/advertisements", methods=['GET', 'POST'])
def advertisements_crud():
    connection = get_db_connection()
    if connection is None:
        return jsonify({"error": "Database connection error"}), 500

    cursor = connection.cursor(dictionary=True)

    try:
        if request.method == 'GET':
            page = int(request.args.get('page', 1))
            per_page = int(request.args.get('per_page', 10))
            offset = (page - 1) * per_page

            cursor.execute("""
                SELECT COUNT(*) as total FROM advertisements a 
                JOIN companies c ON a.company_id = c.id_company
            """)
            total = cursor.fetchone()['total']

            cursor.execute("""
                SELECT a.*, c.name as company_name 
                FROM advertisements a 
                JOIN companies c ON a.company_id = c.id_company 
                ORDER BY a.created_at DESC 
                LIMIT %s OFFSET %s
            """, (per_page, offset))
            ads = cursor.fetchall()

            return jsonify({
                "advertisements": ads,
                "total": total,
                "page": page,
                "per_page": per_page,
                "total_pages": (total + per_page - 1) // per_page
            })

        elif request.method == 'POST':
            if not session.get('is_admin'):
                return jsonify({"error": "Accès refusé"}), 403

            data = request.json
            salary_min = data.get('salary_min')
            salary_max = data.get('salary_max')

            cursor.execute("""
                INSERT INTO advertisements (title, short_description, full_description, 
                                         salary_min, salary_max, location, work_time, 
                                         company_id, posted_by) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                data['title'], data.get('short_description', '')[
                    :500], data.get('full_description', ''),
                salary_min, salary_max, data.get('location'),
                data.get(
                    'contract_type'), data['company_id'], session['user_id']
            ))
            connection.commit()
            return jsonify({"success": True, "id": cursor.lastrowid})

    except Error as e:
        print(f"Error in advertisements CRUD: {e}")
        return jsonify({"error": "Database error"}), 500
    finally:
        cursor.close()
        connection.close()


@app.route("/api/advertisements/<int:ad_id>", methods=['GET', 'PUT', 'DELETE'])
def advertisement_crud(ad_id):
    if not session.get('is_admin'):
        return jsonify({"error": "Accès refusé"}), 403

    connection = get_db_connection()
    if connection is None:
        return jsonify({"error": "Database connection error"}), 500

    cursor = connection.cursor(dictionary=True)

    try:
        if request.method == 'GET':
            cursor.execute("""
                SELECT id_ad, title, short_description, full_description, location, 
                       salary_min, salary_max, work_time, company_id 
                FROM advertisements WHERE id_ad = %s
            """, (ad_id,))
            advertisement = cursor.fetchone()

            if advertisement:
                # Combiner les descriptions et convertir work_time pour l'interface
                result = {
                    'id_ad': advertisement['id_ad'],
                    'title': advertisement['title'],
                    'description': advertisement['full_description'] or advertisement['short_description'] or '',
                    'location': advertisement['location'],
                    'salary': f"{advertisement['salary_min'] or ''}{' - ' + str(advertisement['salary_max']) if advertisement['salary_max'] else ''}".strip(' - '),
                    'contract_type': advertisement['work_time'],
                    'company_id': advertisement['company_id']
                }
                return jsonify(result)
            else:
                return jsonify({"error": "Not found"}), 404

        elif request.method == 'PUT':
            data = request.json
            salary_min = data.get('salary_min')
            salary_max = data.get('salary_max')

            cursor.execute("""
                UPDATE advertisements 
                SET title = %s, full_description = %s, location = %s, 
                    salary_min = %s, salary_max = %s, work_time = %s, company_id = %s
                WHERE id_ad = %s
            """, (
                data['title'], data.get(
                    'full_description', ''), data.get('location'),
                salary_min, salary_max, data.get('contract_type'),
                data['company_id'], ad_id
            ))
            connection.commit()
            return jsonify({"success": True})

        elif request.method == 'DELETE':
            cursor.execute(
                "DELETE FROM advertisements WHERE id_ad = %s", (ad_id,))
            connection.commit()
            return jsonify({"success": True})

    except Error as e:
        print(f"Error in advertisement CRUD: {e}")
        return jsonify({"error": "Database error"}), 500
    finally:
        cursor.close()
        connection.close()

# Applications CRUD (admin only)


@app.route("/api/applications", methods=['GET'])
def applications_crud():
    if not session.get('is_admin'):
        return jsonify({"error": "Accès refusé"}), 403

    connection = get_db_connection()
    if connection is None:
        return jsonify({"error": "Database connection error"}), 500

    cursor = connection.cursor(dictionary=True)

    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))
        offset = (page - 1) * per_page

        cursor.execute("SELECT COUNT(*) as total FROM job_applications")
        total = cursor.fetchone()['total']

        cursor.execute("""
            SELECT ja.*, a.title as job_title, c.name as company_name,
                   p.first_name, p.surname, p.email 
            FROM job_applications ja
            JOIN advertisements a ON ja.id_ad = a.id_ad
            JOIN companies c ON a.company_id = c.id_company
            JOIN people p ON ja.id_people = p.id_people
            ORDER BY ja.application_date DESC
            LIMIT %s OFFSET %s
        """, (per_page, offset))
        applications = cursor.fetchall()

        return jsonify({
            "applications": applications,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page
        })

    except Error as e:
        print(f"Error in applications CRUD: {e}")
        return jsonify({"error": "Database error"}), 500
    finally:
        cursor.close()
        connection.close()


@app.route("/api/applications/<int:application_id>", methods=['DELETE', 'PUT'])
def delete_or_mark_application(application_id):
    """Delete or mark an application as deleted (admin only)"""
    if not session.get('is_admin'):
        return jsonify({"error": "Accès refusé"}), 403

    connection = get_db_connection()
    if connection is None:
        return jsonify({"error": "Database connection error"}), 500

    cursor = connection.cursor(dictionary=True)

    try:
        if request.method == 'DELETE':
            # Hard delete - directly delete from database
            cursor.execute(
                "DELETE FROM job_applications WHERE id_application = %s", (application_id,))
            connection.commit()

            if cursor.rowcount > 0:
                return jsonify({"success": True, "message": "Candidature supprimée définitivement"})
            else:
                return jsonify({"error": "Candidature non trouvée"}), 404

        elif request.method == 'PUT':
            # Soft delete - mark as deleted with reason, OR restore
            data = request.json
            deletion_reason = data.get('deletion_reason')

            if deletion_reason == '':
                # Restore the application
                cursor.execute("""
                    UPDATE job_applications 
                    SET is_deleted = FALSE, deletion_reason = NULL, deleted_at = NULL
                    WHERE id_application = %s
                """, (application_id,))
            else:
                # Mark as deleted with reason
                cursor.execute("""
                    UPDATE job_applications 
                    SET is_deleted = TRUE, deletion_reason = %s, deleted_at = CURRENT_TIMESTAMP
                    WHERE id_application = %s
                """, (deletion_reason, application_id))

            connection.commit()

            if cursor.rowcount > 0:
                action = "restaurée" if deletion_reason == '' else "marquée comme supprimée"
                return jsonify({"success": True, "message": f"Candidature {action}"})
            else:
                return jsonify({"error": "Candidature non trouvée"}), 404

    except Exception as e:
        print(f"Error deleting/marking application: {e}")
        return jsonify({"error": "Database error"}), 500
    finally:
        cursor.close()
        connection.close()


if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)
