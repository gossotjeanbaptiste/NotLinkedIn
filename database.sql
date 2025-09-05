CREATE TABLE advertisements (
    id_ad SERIAL PRIMARY KEY,
    post VARCHAR(255),
    description VARCHAR(8000),
    company_id INT
);


CREATE TABLE companies (
    id_company SERIAL PRIMARY KEY,
    name VARCHAR(255),
    adress VARCHAR(8000)
);

CREATE TABLE peoples (
    id_people SERIAL PRIMARY KEY,
    first_name VARCHAR(255),
    surname VARCHAR(255),
    login VARCHAR(255)
);

CREATE TABLE job_application (
    id_jobapp SERIAL PRIMARY KEY,
    id_ad INT,
    as_applied INT
);