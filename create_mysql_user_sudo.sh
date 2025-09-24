#!/bin/bash
# Script pour créer l'utilisateur jobboard avec sudo (pour Ubuntu/Debian)
# Ce script gère l'authentification socket Unix de MySQL

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 === Script de création utilisateur MySQL jobboard (avec sudo) ===${NC}\n"

# Vérifier si on peut utiliser sudo
if ! sudo -n true 2>/dev/null; then
    echo -e "${YELLOW}🔐 Ce script nécessite les privilèges sudo pour accéder à MySQL${NC}"
fi

echo -e "${YELLOW}📋 Ce script va créer :${NC}"
echo -e "${GREEN}
  ✓ Base de données: job_board
  ✓ Utilisateur: jobboard
  ✓ Mot de passe: jobboard123
  ✓ Privilèges: ALL sur job_board.*${NC}"

echo -e "\n${YELLOW}⏳ Appuyez sur Entrée pour continuer ou Ctrl+C pour annuler...${NC}"
read

echo -e "\n${GREEN}✨ Exécution des commandes...${NC}\n"

# Commandes SQL à exécuter
SQL_COMMANDS="
CREATE DATABASE IF NOT EXISTS job_board;
CREATE USER IF NOT EXISTS 'jobboard'@'localhost' IDENTIFIED BY 'jobboard123';
GRANT ALL PRIVILEGES ON job_board.* TO 'jobboard'@'localhost';
FLUSH PRIVILEGES;
SELECT 'Configuration terminée!' as status;
"

echo -e "${BLUE}🔧 Exécution des commandes MySQL...${NC}"

# Essayer d'abord avec sudo mysql (pour les installations Ubuntu/Debian standard)
if sudo mysql -e "$SQL_COMMANDS" 2>/dev/null; then
    echo -e "${GREEN}✅ Configuration réussie avec sudo mysql${NC}"
elif mysql -u root -e "$SQL_COMMANDS" 2>/dev/null; then
    echo -e "${GREEN}✅ Configuration réussie avec mysql -u root${NC}"
else
    echo -e "${YELLOW}💡 Essayons avec mot de passe...${NC}"
    mysql -u root -p -e "$SQL_COMMANDS"
fi

# Vérifier que ça a fonctionné
echo -e "\n${BLUE}🧪 Test de connexion avec le nouvel utilisateur...${NC}"
if mysql -u jobboard -pjobboard123 -e "USE job_board; SELECT 'Test réussi!' as result;" 2>/dev/null; then
    echo -e "${GREEN}✅ Test de connexion réussi !${NC}"
else
    echo -e "${RED}❌ Test de connexion échoué${NC}"
    echo -e "${YELLOW}💡 Essayez de vous connecter manuellement avec :${NC}"
    echo -e "${BLUE}mysql -u jobboard -p${NC}"
    echo -e "${YELLOW}Mot de passe: jobboard123${NC}"
fi

echo -e "\n${GREEN}🎉 === Résumé de la configuration ===${NC}\n"
echo -e "${BLUE}📋 Informations de connexion:${NC}"
echo -e "   🔸 Host: ${YELLOW}localhost${NC}"
echo -e "   🔸 Base: ${YELLOW}job_board${NC}"
echo -e "   🔸 User: ${YELLOW}jobboard${NC}"
echo -e "   🔸 Pass: ${YELLOW}jobboard123${NC}"

echo -e "\n${BLUE}🔧 Configuration Flask:${NC}"
echo -e "${YELLOW}DB_CONFIG = {
    'host': 'localhost',
    'database': 'job_board',
    'user': 'jobboard',
    'password': 'jobboard123',
    'charset': 'utf8mb4'
}${NC}"

# Proposer l'initialisation de la base
echo -e "\n${BLUE}💡 Voulez-vous initialiser la base avec database.sql ? (y/N)${NC}"
read -p "Réponse: " INIT_DB

if [[ "$INIT_DB" =~ ^[Yy]$ ]]; then
    if [ -f "database.sql" ]; then
        echo -e "${BLUE}📥 Initialisation de la base de données...${NC}"
        if mysql -u jobboard -pjobboard123 job_board < database.sql 2>/dev/null; then
            echo -e "${GREEN}✅ Base de données initialisée avec succès${NC}"
        else
            echo -e "${RED}❌ Erreur lors de l'initialisation${NC}"
            echo -e "${YELLOW}💡 Vous pouvez l'initialiser manuellement avec :${NC}"
            echo -e "${BLUE}mysql -u jobboard -pjobboard123 job_board < database.sql${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Fichier database.sql non trouvé${NC}"
    fi
fi

echo -e "\n${GREEN}🏁 Script terminé !${NC}"