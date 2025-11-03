-- Database creation
CREATE DATABASE IF NOT EXISTS job_board;
USE job_board;

-- Companies table
CREATE TABLE companies (
    id_company INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address_street VARCHAR(255),
    address_postal_code VARCHAR(10),
    address_city VARCHAR(100),
    address_department VARCHAR(100),
    address_country VARCHAR(100) DEFAULT 'France',
    description TEXT,
    website VARCHAR(255),
    logo_url VARCHAR(500) DEFAULT NULL,
    sector VARCHAR(100) DEFAULT NULL,
    company_size ENUM('1-10', '11-50', '51-200', '201-1000', '1000+') DEFAULT NULL,
    created_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_companies_created_by (created_by)
);

-- People/Users table
CREATE TABLE people (
    id_people INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    surname VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address_street VARCHAR(255),
    address_postal_code VARCHAR(10),
    address_city VARCHAR(100),
    address_department VARCHAR(100),
    address_country VARCHAR(100) DEFAULT 'France',
    login VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    owned_company_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_people_owned_company (owned_company_id),
    FOREIGN KEY (owned_company_id) REFERENCES companies(id_company) ON DELETE SET NULL
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
    is_deleted BOOLEAN DEFAULT FALSE,
    deletion_reason VARCHAR(500),
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (id_ad) REFERENCES advertisements(id_ad) ON DELETE CASCADE,
    FOREIGN KEY (id_people) REFERENCES people(id_people) ON DELETE CASCADE,
    UNIQUE KEY unique_application (id_ad, id_people)
);

-- Add foreign key constraint for companies.created_by after both tables are created
-- (circular reference: companies -> people -> companies)
ALTER TABLE companies ADD FOREIGN KEY (created_by) REFERENCES people(id_people) ON DELETE SET NULL;

-- Insert sample data
INSERT INTO companies (name, address_street, address_postal_code, address_city, address_department, address_country, description, website, sector, company_size) VALUES
('TechCorp', '123 rue de la Tech', '75015', 'Paris', 'Paris', 'France', 'Entreprise leader dans les nouvelles technologies', 'https://www.techcorp.com', 'Technologie', '201-1000'),
('WebAgency', '456 avenue du Web', '69000', 'Lyon', 'Rhône', 'France', 'Agence spécialisée dans le développement web', 'https://www.webagency.fr', 'Services numériques', '11-50'),
('StartupX', '789 boulevard Innovation', '13000', 'Marseille', 'Bouches-du-Rhône', 'France', 'Startup innovante dans l\'IA', 'https://www.startupx.io', 'Intelligence artificielle', '1-10'),
('FinancePlus', '800 avenue de la Bourse', '75002', 'Paris', 'Paris', 'France', 'Cabinet de conseil en finance et audit', 'https://www.financeplus.fr', 'Finance', '51-200'),
('GreenEnergy', '90 rue de l\'Énergie Verte', '44000', 'Nantes', 'Loire-Atlantique', 'France', 'Producteur d\'énergie renouvelable', 'https://www.green-energy.com', 'Énergie', '201-1000');

INSERT INTO people (first_name, surname, email, phone, login, password, is_admin) VALUES
('Admin', 'User', 'admin@jobboard.com', '0123456789', 'admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', TRUE),
('Jean', 'Dupont', 'jean.dupont@email.com', '0123456790', 'jdupont', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', FALSE),
('Marie', 'Martin', 'marie.martin@email.com', '0123456791', 'mmartin', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', FALSE),
('Antoine', 'Leroy', 'antoine.leroy@financeplus.com', '0123456792', 'aleroy', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', FALSE),
('Lucie', 'Petit', 'lucie.petit@email.com', '0123456793', 'lpetit', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', FALSE),
('David', 'Roux', 'david.roux@email.com', '0123456794', 'droux', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', FALSE);

-- Update enterprise ownership relationships
UPDATE people SET owned_company_id = 4 WHERE id_people = 4; -- Antoine Leroy owns FinancePlus
UPDATE companies SET created_by = 4 WHERE id_company = 4; -- FinancePlus was created by Antoine Leroy

-- Migration script pour mettre à jour la structure existante (à exécuter si la DB existe déjà)
-- ALTER TABLE people 
-- DROP COLUMN address,
-- ADD COLUMN address_street VARCHAR(255) AFTER phone,
-- ADD COLUMN address_postal_code VARCHAR(10) AFTER address_street,
-- ADD COLUMN address_city VARCHAR(100) AFTER address_postal_code,
-- ADD COLUMN address_department VARCHAR(100) AFTER address_city,
-- ADD COLUMN address_country VARCHAR(100) DEFAULT 'France' AFTER address_department;

INSERT INTO advertisements (title, short_description, full_description, salary_min, salary_max, location, work_time, company_id, posted_by) VALUES
('Développeur Full-Stack', 'Rejoignez notre équipe pour développer des applications web modernes', 'Nous recherchons un développeur full-stack expérimenté pour rejoindre notre équipe dynamique. Vous travaillerez sur des projets innovants utilisant les dernières technologies web.', 35000, 45000, 'Paris', 'full-time', 1, 1),
('Designer UX/UI', 'Créez des expériences utilisateur exceptionnelles', 'Poste de designer UX/UI pour concevoir et améliorer l\'expérience utilisateur de nos applications. Vous collaborerez étroitement avec l\'équipe de développement.', 30000, 40000, 'Lyon', 'full-time', 2, 1),
('Stagiaire Développeur Web', 'Stage de 6 mois dans une startup innovante', 'Opportunité de stage dans une startup spécialisée dans l\'intelligence artificielle. Vous participerez au développement de notre plateforme web.', 600, 1000, 'Marseille', 'internship', 3, 1),
('Consultant Junior en Audit', 'Poste junior en audit financier pour jeunes diplômés', 'Nous recherchons un Consultant Junior motivé pour rejoindre notre équipe d\'audit. Formation et accompagnement assurés. Déplacements possibles.', 32000, 38000, 'Paris', 'full-time', 4, 4),
('Assistante Administrative', 'Support administratif et gestion de bureau', 'Vous assurerez le support administratif de l\'équipe et la gestion quotidienne des locaux. Maîtrise des outils bureautiques essentielle.', 25000, 30000, 'Paris', 'full-time', 4, 4),
('Ingénieur en Énergies Renouvelables', 'Conception et suivi de projets éoliens et solaires', 'Rejoignez-nous pour concevoir et superviser l\'installation de nos nouveaux parcs énergétiques. Une passion pour la transition énergétique est indispensable.', 45000, 60000, 'Nantes', 'full-time', 5, 1),
('Développeur Mobile (React Native)', 'Contrat de 6 mois pour développement d\'application', 'Nous cherchons un expert React Native pour un contrat de 6 mois afin de finaliser notre nouvelle application mobile.', 500, 600, 'Toulouse', 'contract', 1, 1);


INSERT INTO job_applications (id_ad, id_people, message, status) VALUES
(1, 5, 'Je suis très intéressée par le poste de Développeur Full-Stack et j\'ai 3 ans d\'expérience dans les technologies mentionnées.', 'reviewed'),
(6, 5, 'Mon profil correspond parfaitement à l\'offre d\'Ingénieur en Énergies Renouvelables.', 'pending'),
(4, 6, 'Jeune diplômé d\'école de commerce, je suis très motivé par le poste de Consultant Junior en Audit.', 'accepted'),
(2, 2, 'Candidature pour le poste de Designer UX/UI. Veuillez trouver mon portfolio en pièce jointe.', 'rejected');