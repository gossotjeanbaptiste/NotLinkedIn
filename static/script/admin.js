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
            loadAdminApplications();
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
    container.innerHTML = companies.map(company => {
        const address = [company.address_street, company.address_postal_code, company.address_city]
            .filter(part => part && part.trim())
            .join(', ') || 'Non spécifiée';
        return `
        <div class="admin-item">
            <div class="item-info">
                <h4>${company.name}</h4>
                <p><strong>Adresse:</strong> ${address}</p>
                <p><strong>Description:</strong> ${company.description || 'Non spécifiée'}</p>
                <p><strong>Site web:</strong> ${company.website ? `<a href="${company.website}" target="_blank" class="company-website-link">${company.website}</a>` : 'Non spécifié'}</p>
            </div>
            <div class="item-actions">
                <button class="btn btn-edit" onclick="editCompany(${company.id_company})">Modifier</button>
                <button class="btn btn-danger" onclick="deleteCompany(${company.id_company})">Supprimer</button>
            </div>
        </div>
    `}).join('');
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
// DEPRECATED: Use loadAdminApplications() from admin_candidatures.js instead
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

// DEPRECATED: Use admin_candidatures.js instead
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
    window.location.href = '/admin_ajouter_entreprise';
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

function editCompany(companyId) {
    window.location.href = `/admin_modifier_entreprise?id=${companyId}`;
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

function editAdvertisement(adId) {
    window.location.href = `/admin_modifier_offre?id=${adId}`;
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
    window.location.href = '/admin_ajouter_offre';
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