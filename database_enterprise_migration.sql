-- Migration pour ajouter la section entreprise
-- À exécuter pour mettre à jour une base de données existante

-- Sélectionner la base de données job_board
USE job_board;

-- Ajouter une colonne pour lier les utilisateurs aux entreprises qu'ils possèdent
ALTER TABLE people ADD COLUMN owned_company_id INT DEFAULT NULL;
ALTER TABLE people ADD FOREIGN KEY (owned_company_id) REFERENCES companies(id_company) ON DELETE SET NULL;

-- Créer un index pour améliorer les performances
CREATE INDEX idx_people_owned_company ON people(owned_company_id);

-- Ajouter une colonne pour savoir qui a créé l'entreprise et quand
ALTER TABLE companies ADD COLUMN created_by INT DEFAULT NULL;
ALTER TABLE companies ADD FOREIGN KEY (created_by) REFERENCES people(id_people) ON DELETE SET NULL;

-- Créer un index pour améliorer les performances
CREATE INDEX idx_companies_created_by ON companies(created_by);

-- Ajouter une colonne logo pour les entreprises (optionnel)
ALTER TABLE companies ADD COLUMN logo_url VARCHAR(500) DEFAULT NULL;

-- Ajouter une colonne pour le secteur d'activité
ALTER TABLE companies ADD COLUMN sector VARCHAR(100) DEFAULT NULL;

-- Ajouter une colonne pour la taille de l'entreprise
ALTER TABLE companies ADD COLUMN company_size ENUM('1-10', '11-50', '51-200', '201-1000', '1000+') DEFAULT NULL;

-- Ajouter des données d'exemple pour tester
-- Supposons que l'utilisateur ID 4 (Antoine Leroy) possède FinancePlus (ID 4)
UPDATE people SET owned_company_id = 4 WHERE id_people = 4;
UPDATE companies SET created_by = 4, sector = 'Finance', company_size = '51-200' WHERE id_company = 4;
