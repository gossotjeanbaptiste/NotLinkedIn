from flask import Flask, render_template, request, jsonify, session, redirect, url_for, flash
import mysql.connector
from mysql.connector import Error
import os
from datetime import datetime
import hashlib

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

# ============= MAIN PAGES =============


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
                INSERT INTO people (first_name, surname, email, phone, login, password) 
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                request.form['first_name'],
                request.form['surname'],
                request.form['email'],
                request.form.get('phone', ''),
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

        # Get user information
        cursor.execute("SELECT * FROM people WHERE id_people = %s",
                       (session['user_id'],))
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

        cursor.close()
        connection.close()

        return render_template('profile.html', user=user, applications=applications)

    except Error as e:
        print(f"Error fetching profile data: {e}")
        flash('Erreur lors de la récupération du profil', 'error')
        return redirect(url_for('index'))


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
        address = request.form.get('address', '')
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
            first_name = %s, surname = %s, email = %s, 
            phone = %s, address = %s, login = %s 
            WHERE id_people = %s
        """, (first_name, surname, email, phone, address, login, session['user_id']))

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
            SELECT a.*, c.name as company_name, c.address as company_address, 
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
    if not session.get('is_admin'):
        return jsonify({"error": "Accès refusé"}), 403

    connection = get_db_connection()
    if connection is None:
        return jsonify({"error": "Database connection error"}), 500

    cursor = connection.cursor(dictionary=True)

    try:
        if request.method == 'GET':
            page = int(request.args.get('page', 1))
            per_page = int(request.args.get('per_page', 10))
            offset = (page - 1) * per_page

            cursor.execute("SELECT COUNT(*) as total FROM companies")
            total = cursor.fetchone()['total']

            cursor.execute(
                "SELECT * FROM companies LIMIT %s OFFSET %s", (per_page, offset))
            companies = cursor.fetchall()

            return jsonify({
                "companies": companies,
                "total": total,
                "page": page,
                "per_page": per_page,
                "total_pages": (total + per_page - 1) // per_page
            })

        elif request.method == 'POST':
            data = request.json
            cursor.execute("""
                INSERT INTO companies (name, address, description, website) 
                VALUES (%s, %s, %s, %s)
            """, (data['name'], data.get('address'), data.get('description'), data.get('website')))
            connection.commit()
            return jsonify({"success": True, "id": cursor.lastrowid})

    except Error as e:
        print(f"Error in companies CRUD: {e}")
        return jsonify({"error": "Database error"}), 500
    finally:
        cursor.close()
        connection.close()


@app.route("/api/companies/<int:company_id>", methods=['GET', 'PUT', 'DELETE'])
def company_crud(company_id):
    if not session.get('is_admin'):
        return jsonify({"error": "Accès refusé"}), 403

    connection = get_db_connection()
    if connection is None:
        return jsonify({"error": "Database connection error"}), 500

    cursor = connection.cursor(dictionary=True)

    try:
        if request.method == 'GET':
            cursor.execute(
                "SELECT * FROM companies WHERE id_company = %s", (company_id,))
            company = cursor.fetchone()
            return jsonify(company) if company else jsonify({"error": "Not found"}), 404

        elif request.method == 'PUT':
            data = request.json
            cursor.execute("""
                UPDATE companies 
                SET name = %s, address = %s, description = %s, website = %s 
                WHERE id_company = %s
            """, (data['name'], data.get('address'), data.get('description'), data.get('website'), company_id))
            connection.commit()
            return jsonify({"success": True})

        elif request.method == 'DELETE':
            cursor.execute(
                "DELETE FROM companies WHERE id_company = %s", (company_id,))
            connection.commit()
            return jsonify({"success": True})

    except Error as e:
        print(f"Error in company CRUD: {e}")
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
            cursor.execute("""
                INSERT INTO advertisements (title, short_description, full_description, 
                                         salary_min, salary_max, location, work_time, 
                                         company_id, posted_by) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                data['title'], data['short_description'], data['full_description'],
                data.get('salary_min'), data.get(
                    'salary_max'), data['location'],
                data['work_time'], data['company_id'], session['user_id']
            ))
            connection.commit()
            return jsonify({"success": True, "id": cursor.lastrowid})

    except Error as e:
        print(f"Error in advertisements CRUD: {e}")
        return jsonify({"error": "Database error"}), 500
    finally:
        cursor.close()
        connection.close()


@app.route("/api/advertisements/<int:ad_id>", methods=['PUT', 'DELETE'])
def advertisement_crud(ad_id):
    if not session.get('is_admin'):
        return jsonify({"error": "Accès refusé"}), 403

    connection = get_db_connection()
    if connection is None:
        return jsonify({"error": "Database connection error"}), 500

    cursor = connection.cursor()

    try:
        if request.method == 'PUT':
            data = request.json
            cursor.execute("""
                UPDATE advertisements 
                SET title = %s, short_description = %s, full_description = %s, 
                    salary_min = %s, salary_max = %s, location = %s, work_time = %s, 
                    company_id = %s, is_active = %s
                WHERE id_ad = %s
            """, (
                data['title'], data['short_description'], data['full_description'],
                data.get('salary_min'), data.get(
                    'salary_max'), data['location'],
                data['work_time'], data['company_id'], data.get(
                    'is_active', True), ad_id
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


if __name__ == "__main__":
    app.run(debug=True)
