// Admin panel JavaScript functionality

let currentPage = {
    companies: 1,
    advertisements: 1,
    applications: 1
};

let companiesList = []; // Cache for companies

document.addEventListener('DOMContentLoaded', function() {
    showTab('companies');
    loadCompanies();
});

function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    
    // Find and activate the corresponding button
    const targetBtn = document.querySelector(`[onclick="showTab('${tabName}')"]`);
    if (targetBtn) {
        targetBtn.classList.add('active');
    }

    // Load data based on tab
    switch(tabName) {
        case 'companies':
            loadCompanies();
            break;
        case 'advertisements':
            loadAdvertisements();
            break;
        case 'applications':
            loadApplications();
            break;
    }
}

async function loadCompanies(page = 1) {
    try {
        const response = await fetch(`/api/companies?page=${page}&per_page=10`);
        const data = await response.json();
        
        companiesList = data.companies; // Cache companies
        displayCompanies(data.companies);
        displayPagination('companies', data);
    } catch (error) {
        console.error('Error loading companies:', error);
    }
}

function displayCompanies(companies) {
    const container = document.getElementById('companies-list');
    container.innerHTML = companies.map(company => `
        <div class="admin-item">
            <div class="item-info">
                <h4>${company.name}</h4>
                <p><strong>Adresse:</strong> ${company.address || 'Non spécifiée'}</p>
                <p><strong>Description:</strong> ${company.description || 'Non spécifiée'}</p>
                <p><strong>Site web:</strong> ${company.website ? `<a href="${company.website}" target="_blank" class="company-website-link">${company.website}</a>` : 'Non spécifié'}</p>
            </div>
            <div class="item-actions">
                <button class="btn btn-edit" onclick="editCompany(${company.id_company})">Modifier</button>
                <button class="btn btn-danger" onclick="deleteCompany(${company.id_company})">Supprimer</button>
            </div>
        </div>
    `).join('');
}

async function loadAdvertisements(page = 1) {
    try {
        const response = await fetch(`/api/advertisements?page=${page}&per_page=10`);
        const data = await response.json();
        
        displayAdvertisements(data.advertisements);
        displayPagination('advertisements', data);
    } catch (error) {
        console.error('Error loading advertisements:', error);
    }
}

function displayAdvertisements(advertisements) {
    const container = document.getElementById('advertisements-list');
    container.innerHTML = advertisements.map(ad => `
        <div class="admin-item">
            <div class="item-info">
                <h4>${ad.title}</h4>
                <p><strong>Entreprise:</strong> ${ad.company_name}</p>
                <p><strong>Lieu:</strong> ${ad.location}</p>
                <p><strong>Type:</strong> ${ad.work_time}</p>
                <p><strong>Salaire:</strong> ${ad.salary_min ? ad.salary_min + '€' : ''} ${ad.salary_max ? '- ' + ad.salary_max + '€' : ''}</p>
                <p><strong>Active:</strong> ${ad.is_active ? 'Oui' : 'Non'}</p>
            </div>
            <div class="item-actions">
                <button class="btn btn-edit" onclick="editAdvertisement(${ad.id_ad})">Modifier</button>
                <button class="btn btn-danger" onclick="deleteAdvertisement(${ad.id_ad})">Supprimer</button>
            </div>
        </div>
    `).join('');
}

async function loadApplications(page = 1) {
    try {
        const response = await fetch(`/api/applications?page=${page}&per_page=10`);
        const data = await response.json();
        
        displayApplications(data.applications);
        displayPagination('applications', data);
    } catch (error) {
        console.error('Error loading applications:', error);
    }
}

function displayApplications(applications) {
    const container = document.getElementById('applications-list');
    container.innerHTML = applications.map(app => `
        <div class="admin-item">
            <div class="item-info">
                <h4>${app.job_title}</h4>
                <p><strong>Candidat:</strong> ${app.first_name} ${app.surname} (${app.email})</p>
                <p><strong>Entreprise:</strong> ${app.company_name}</p>
                <p><strong>Date:</strong> ${formatDate(app.application_date)}</p>
                <p><strong>Statut:</strong> ${app.status}</p>
                <p><strong>Message:</strong> ${app.message}</p>
            </div>
        </div>
    `).join('');
}

function displayPagination(type, data) {
    const container = document.getElementById(`${type}-pagination`);
    let html = '';
    
    for (let i = 1; i <= data.total_pages; i++) {
        html += `<button class="btn ${i === data.page ? 'btn-primary' : 'btn-secondary'}" 
                 onclick="changePage('${type}', ${i})">${i}</button> `;
    }
    
    container.innerHTML = html;
}

function changePage(type, page) {
    currentPage[type] = page;
    switch(type) {
        case 'companies':
            loadCompanies(page);
            break;
        case 'advertisements':
            loadAdvertisements(page);
            break;
        case 'applications':
            loadApplications(page);
            break;
    }
}

function showAddCompanyForm() {
    document.getElementById('modal-form-content').innerHTML = `
        <h3>Ajouter une entreprise</h3>
        <form id="companyForm" onsubmit="saveCompany(event)">
            <div class="form-group">
                <label>Nom:</label>
                <input type="text" name="name" required>
            </div>
            <div class="form-group">
                <label>Adresse:</label>
                <input type="text" name="address">
            </div>
            <div class="form-group">
                <label>Description:</label>
                <textarea name="description" rows="3"></textarea>
            </div>
            <div class="form-group">
                <label>Site web:</label>
                <input type="url" name="website">
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-success">Enregistrer</button>
                <button type="button" class="btn btn-secondary" onclick="closeAdminModal()">Annuler</button>
            </div>
        </form>
    `;
    const modal = document.getElementById('adminModal');
    modal.classList.remove('hidden');
    modal.style.display = 'block';
}

async function saveCompany(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    // Nettoyage des salaires
    data.salary_min = data.salary_min ? parseFloat(data.salary_min) : null;
    data.salary_max = data.salary_max ? parseFloat(data.salary_max) : null;
    // Vérification et correction du company_id
    if (!data.company_id || isNaN(parseInt(data.company_id))) {
        alert('Veuillez sélectionner une entreprise valide.');
        return;
    }
    data.company_id = parseInt(data.company_id);

    try {
        const response = await fetch('/api/companies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            closeAdminModal();
            loadCompanies();
            alert('Entreprise ajoutée avec succès !');
        } else {
            alert('Erreur lors de l\'ajout de l\'entreprise');
        }
    } catch (error) {
        console.error('Error saving company:', error);
        alert('Erreur lors de l\'ajout de l\'entreprise');
    }
}

async function editCompany(companyId) {
    try {
        // Récupérer les données de l'entreprise
        const response = await fetch(`/api/companies/${companyId}`);
        if (!response.ok) {
            throw new Error('Impossible de charger les données de l\'entreprise');
        }
        
        const company = await response.json();
        
        // Afficher le formulaire pré-rempli
        document.getElementById('modal-form-content').innerHTML = `
            <h3>Modifier l'entreprise</h3>
            <form id="companyEditForm" onsubmit="updateCompany(event, ${companyId})">
                <div class="form-group">
                    <label>Nom:</label>
                    <input type="text" name="name" value="${company.name || ''}" required>
                </div>
                <div class="form-group">
                    <label>Adresse:</label>
                    <input type="text" name="address" value="${company.address || ''}">
                </div>
                <div class="form-group">
                    <label>Description:</label>
                    <textarea name="description" rows="3">${company.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Site web:</label>
                    <input type="url" name="website" value="${company.website || ''}">
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-success">Mettre à jour</button>
                    <button type="button" class="btn btn-secondary" onclick="closeAdminModal()">Annuler</button>
                </div>
            </form>
        `;
        
        const modal = document.getElementById('adminModal');
        modal.classList.remove('hidden');
        modal.style.display = 'block';
        
    } catch (error) {
        console.error('Error loading company:', error);
        alert('Erreur lors du chargement des données de l\'entreprise');
    }
}

async function updateCompany(event, companyId) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    // Nettoyage des salaires
    data.salary_min = data.salary_min ? parseFloat(data.salary_min) : null;
    data.salary_max = data.salary_max ? parseFloat(data.salary_max) : null;

    try {
        const response = await fetch(`/api/companies/${companyId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            closeAdminModal();
            loadCompanies();
            alert('Entreprise modifiée avec succès !');
        } else {
            const error = await response.json();
            alert('Erreur: ' + (error.message || 'Impossible de modifier l\'entreprise'));
        }
    } catch (error) {
        console.error('Error updating company:', error);
        alert('Erreur lors de la modification de l\'entreprise');
    }
}

async function deleteCompany(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette entreprise ?')) {
        try {
            const response = await fetch(`/api/companies/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                loadCompanies();
                alert('Entreprise supprimée avec succès !');
            } else {
                alert('Erreur lors de la suppression de l\'entreprise');
            }
        } catch (error) {
            console.error('Error deleting company:', error);
            alert('Erreur lors de la suppression de l\'entreprise');
        }
    }
}

async function editAdvertisement(adId) {
    try {
        // Récupérer les données de l'annonce
        const response = await fetch(`/api/advertisements/${adId}`);
        if (!response.ok) {
            throw new Error('Impossible de charger les données de l\'annonce');
        }
        
        const advertisement = await response.json();
        
        // Afficher le formulaire pré-rempli
        document.getElementById('modal-form-content').innerHTML = `
            <h3>Modifier l'annonce</h3>
            <form id="adEditForm" onsubmit="updateAdvertisement(event, ${adId})">
                <div class="form-group">
                    <label>Titre:</label>
                    <input type="text" name="title" value="${advertisement.title || ''}" required>
                </div>
                <div class="form-group">
                    <label>Entreprise:</label>
                    <select name="company_id" required>
                        <option value="">Sélectionner une entreprise</option>
                        ${companiesList.map(company => 
                            `<option value="${company.id_company}" ${company.id_company == advertisement.company_id ? 'selected' : ''}>${company.name}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Petite description:</label>
                    <input type="text" name="short_description" maxlength="500" required value="${advertisement.short_description || ''}">
                </div>
                <div class="form-group">
                    <label>Description complète:</label>
                    <textarea name="full_description" rows="4" required>${advertisement.full_description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Localisation:</label>
                    <input type="text" name="location" value="${advertisement.location || ''}">
                </div>
                <div class="form-group">
                    <label>Salaire min:</label>
                    <input type="number" name="salary_min" min="0" step="0.01" value="${advertisement.salary_min || ''}">
                </div>
                <div class="form-group">
                    <label>Salaire max:</label>
                    <input type="number" name="salary_max" min="0" step="0.01" value="${advertisement.salary_max || ''}">
                </div>
                <div class="form-group">
                    <label>Type de contrat:</label>
                    <select name="contract_type">
                        <option value="">Sélectionner un type</option>
                        <option value="full-time" ${advertisement.contract_type == 'full-time' ? 'selected' : ''}>Temps plein</option>
                        <option value="part-time" ${advertisement.contract_type == 'part-time' ? 'selected' : ''}>Temps partiel</option>
                        <option value="contract" ${advertisement.contract_type == 'contract' ? 'selected' : ''}>Contrat</option>
                        <option value="internship" ${advertisement.contract_type == 'internship' ? 'selected' : ''}>Stage</option>
                    </select>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-success">Mettre à jour</button>
                    <button type="button" class="btn btn-secondary" onclick="closeAdminModal()">Annuler</button>
                </div>
            </form>
        `;
        
        const modal = document.getElementById('adminModal');
        modal.classList.remove('hidden');
        modal.style.display = 'block';
        
    } catch (error) {
        console.error('Error loading advertisement:', error);
        alert('Erreur lors du chargement des données de l\'annonce');
    }
}

async function updateAdvertisement(event, adId) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch(`/api/advertisements/${adId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            closeAdminModal();
            loadAdvertisements();
            alert('Annonce modifiée avec succès !');
        } else {
            const error = await response.json();
            alert('Erreur: ' + (error.message || 'Impossible de modifier l\'annonce'));
        }
    } catch (error) {
        console.error('Error updating advertisement:', error);
        alert('Erreur lors de la modification de l\'annonce');
    }
}

function showAddAdForm() {
    document.getElementById('modal-form-content').innerHTML = `
        <h3>Ajouter une annonce</h3>
        <form id="adForm" onsubmit="saveAdvertisement(event)">
            <div class="form-group">
                <label>Titre:</label>
                <input type="text" name="title" required>
            </div>
            <div class="form-group">
                <label>Entreprise:</label>
                <select name="company_id" required>
                    <option value="">Sélectionner une entreprise</option>
                    ${companiesList.map(company => `<option value="${company.id_company}">${company.name}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label>Petite description:</label>
                <input type="text" name="short_description" maxlength="500" required>
            </div>
            <div class="form-group">
                <label>Description complète:</label>
                <textarea name="full_description" rows="4" required></textarea>
            </div>
            <div class="form-group">
                <label>Localisation:</label>
                <input type="text" name="location">
            </div>
            <div class="form-group">
                <label>Salaire min:</label>
                <input type="number" name="salary_min" min="0" step="0.01">
            </div>
            <div class="form-group">
                <label>Salaire max:</label>
                <input type="number" name="salary_max" min="0" step="0.01">
            </div>
            <div class="form-group">
                <label>Type de contrat:</label>
                <select name="contract_type">
                    <option value="">Sélectionner un type</option>
                    <option value="full-time">Temps plein</option>
                    <option value="part-time">Temps partiel</option>
                    <option value="contract">Contrat</option>
                    <option value="internship">Stage</option>
                </select>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-success">Enregistrer</button>
                <button type="button" class="btn btn-secondary" onclick="closeAdminModal()">Annuler</button>
            </div>
        </form>
    `;
    const modal = document.getElementById('adminModal');
    modal.classList.remove('hidden');
    modal.style.display = 'block';
}

async function saveAdvertisement(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('/api/advertisements', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            closeAdminModal();
            loadAdvertisements(); // Recharger la liste
            alert('Annonce ajoutée avec succès !');
        } else {
            const error = await response.json();
            alert('Erreur: ' + (error.message || 'Impossible d\'ajouter l\'annonce'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Erreur de connexion');
    }
}

async function deleteAdvertisement(adId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
        return;
    }

    try {
        const response = await fetch(`/api/advertisements/${adId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadAdvertisements(); // Recharger la liste
            alert('Annonce supprimée avec succès !');
        } else {
            const error = await response.json();
            alert('Erreur: ' + (error.message || 'Impossible de supprimer l\'annonce'));
        }
    } catch (error) {
        console.error('Error deleting advertisement:', error);
        alert('Erreur lors de la suppression de l\'annonce');
    }
}

function closeAdminModal() {
    const modal = document.getElementById('adminModal');
    modal.style.display = 'none';
    modal.classList.add('hidden');
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('fr-FR');
}