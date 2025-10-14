# Makefile pour NotLinkedIn

.PHONY: run db clean

run: db
	@python3 -c "import flask, mysql.connector" 2>/dev/null || (echo "Installation des dépendances..." && pip3 install --user -r requirements.txt)
	python3 app.py

db:
	bash setup_db_auto.sh

clean:
	mysql -u jobboard -pjobboard123 -e "DROP DATABASE IF EXISTS job_board;" 2>/dev/null || true