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
    event.target.classList.add('active');

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
                <p><strong>Site web:</strong> ${company.website || 'Non spécifié'}</p>
            </div>
            <div class="item-actions">
                <button class="btn btn-secondary" onclick="editCompany(${company.id_company})">Modifier</button>
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
                <button class="btn btn-secondary" onclick="editAdvertisement(${ad.id_ad})">Modifier</button>
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
    document.getElementById('adminModal').style.display = 'block';
}

async function saveCompany(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

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

function closeAdminModal() {
    document.getElementById('adminModal').style.display = 'none';
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('fr-FR');
}