# Makefile pour NotLinkedIn

.PHONY: run db install venv

run: db install
	. venv/bin/activate && flask run

db:
	bash create_mysql_user_sudo.sh

install: venv
	. venv/bin/activate && pip install -r requirements.txt
# Création de l'environnement virtuel
venv:
	python3 -m venv venv
