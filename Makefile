# Makefile pour NotLinkedIn

.PHONY: all new run db clean

VENV := .venv
PYTHON := $(VENV)/bin/python

all: run

new: db
	python3 -m venv $(VENV)
	$(PYTHON) -m pip install -r requirements.txt

run: new
	$(PYTHON) app.py

db:
	bash setup_db_auto.sh

clean:
	mysql -u jobboard -pjobboard123 -e "DROP DATABASE IF EXISTS job_board;" 2>/dev/null || true