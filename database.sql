-- Database creation
CREATE DATABASE IF NOT EXISTS job_board;
USE job_board;

-- Companies table
CREATE TABLE companies (
    id_company INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500),
    description TEXT,
    website VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- People/Users table
CREATE TABLE people (
    id_people INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    surname VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address VARCHAR(500),
    login VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Job advertisements table
CREATE TABLE advertisements (
    id_ad INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    short_description VARCHAR(500),
    full_description TEXT,
    salary_min DECIMAL(10,2),
    salary_max DECIMAL(10,2),
    location VARCHAR(255),
    work_time ENUM('full-time', 'part-time', 'contract', 'internship') DEFAULT 'full-time',
    company_id INT,
    posted_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (company_id) REFERENCES companies(id_company) ON DELETE CASCADE,
    FOREIGN KEY (posted_by) REFERENCES people(id_people) ON DELETE SET NULL
);

-- Job applications table
CREATE TABLE job_applications (
    id_application INT AUTO_INCREMENT PRIMARY KEY,
    id_ad INT,
    id_people INT,
    message TEXT,
    application_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending', 'reviewed', 'accepted', 'rejected') DEFAULT 'pending',
    FOREIGN KEY (id_ad) REFERENCES advertisements(id_ad) ON DELETE CASCADE,
    FOREIGN KEY (id_people) REFERENCES people(id_people) ON DELETE CASCADE,
    UNIQUE KEY unique_application (id_ad, id_people)
);

-- Insert sample data
INSERT INTO companies (name, address, description, website) VALUES
('TechCorp', '123 rue de la Tech, Paris', 'Entreprise leader dans les nouvelles technologies', 'www.techcorp.com'),
('WebAgency', '456 avenue du Web, Lyon', 'Agence spécialisée dans le développement web', 'www.webagency.fr'),
('StartupX', '789 boulevard Innovation, Marseille', 'Startup innovante dans l\'IA', 'www.startupx.io');

INSERT INTO people (first_name, surname, email, phone, login, password, is_admin) VALUES
('Admin', 'User', 'admin@jobboard.com', '0123456789', 'admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', TRUE),
('Jean', 'Dupont', 'jean.dupont@email.com', '0123456790', 'jdupont', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', FALSE),
('Marie', 'Martin', 'marie.martin@email.com', '0123456791', 'mmartin', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', FALSE);

INSERT INTO advertisements (title, short_description, full_description, salary_min, salary_max, location, work_time, company_id, posted_by) VALUES
('Développeur Full-Stack', 'Rejoignez notre équipe pour développer des applications web modernes', 'Nous recherchons un développeur full-stack expérimenté pour rejoindre notre équipe dynamique. Vous travaillerez sur des projets innovants utilisant les dernières technologies web.', 35000, 45000, 'Paris', 'full-time', 1, 1),
('Designer UX/UI', 'Créez des expériences utilisateur exceptionnelles', 'Poste de designer UX/UI pour concevoir et améliorer l\'expérience utilisateur de nos applications. Vous collaborerez étroitement avec l\'équipe de développement.', 30000, 40000, 'Lyon', 'full-time', 2, 1),
('Stagiaire Développeur Web', 'Stage de 6 mois dans une startup innovante', 'Opportunité de stage dans une startup spécialisée dans l\'intelligence artificielle. Vous participerez au développement de notre plateforme web.', 600, 1000, 'Marseille', 'internship', 3, 1);