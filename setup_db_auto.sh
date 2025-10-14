#!/bin/bash
# Script automatisé pour vérifier/créer la base de données (sans prompts)

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Commandes SQL à exécuter
SQL_COMMANDS="
CREATE DATABASE IF NOT EXISTS job_board;
CREATE USER IF NOT EXISTS 'jobboard'@'localhost' IDENTIFIED BY 'jobboard123';
GRANT ALL PRIVILEGES ON job_board.* TO 'jobboard'@'localhost';
FLUSH PRIVILEGES;
"

# Créer/vérifier la base et l'utilisateur silencieusement
if sudo mysql -e "$SQL_COMMANDS" 2>/dev/null; then
    printf "${GREEN}✅ Base de données et utilisateur configurés${NC}\n"
elif mysql -u root -e "$SQL_COMMANDS" 2>/dev/null; then
    printf "${GREEN}✅ Base de données et utilisateur configurés${NC}\n"
else
    printf "${RED}❌ Erreur de configuration MySQL${NC}\n"
    exit 1
fi

# Vérifier la connexion
if mysql -u jobboard -pjobboard123 -e "USE job_board; SELECT 1;" 2>/dev/null >/dev/null; then
    printf "${GREEN}✅ Connexion à la base validée${NC}\n"
    
    # Vérifier si les tables existent
    TABLES_COUNT=$(mysql -u jobboard -pjobboard123 job_board -e "SHOW TABLES;" 2>/dev/null | wc -l)
    
    if [ "$TABLES_COUNT" -lt 2 ]; then
        printf "${BLUE}📥 Initialisation des tables...${NC}\n"
        if [ -f "database.sql" ]; then
            # Créer un fichier temporaire sans la ligne CREATE DATABASE et USE
            temp_sql=$(mktemp)
            grep -v "^CREATE DATABASE\|^USE job_board" database.sql > "$temp_sql"
            
            if mysql -u jobboard -pjobboard123 job_board < "$temp_sql" 2>/dev/null; then
                printf "${GREEN}✅ Tables initialisées${NC}\n"
            else
                printf "${YELLOW}⚠️  Initialisation partielle${NC}\n"
            fi
            rm -f "$temp_sql"
        fi
    else
        printf "${GREEN}✅ Tables déjà présentes${NC}\n"
    fi
else
    printf "${RED}❌ Erreur de connexion à la base${NC}\n"
    exit 1
fi