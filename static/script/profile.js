// Suppression d'une candidature
window.deleteApplication = function(btn) {
    const appId = btn.getAttribute('data-app-id');
    if (!appId) return;
    if (!confirm('Voulez-vous vraiment supprimer cette candidature ?')) return;
    fetch(`/api/applications/${appId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(res => {
        if (res.ok) {
            btn.closest('.application-card').remove();
            alert('Candidature supprimée !');
        } else {
            alert('Erreur lors de la suppression.');
        }
    });
}

// Modification d'une candidature (affiche un prompt pour le message)
window.editApplication = function(btn) {
    const appId = btn.getAttribute('data-app-id');
    if (!appId) return;
    const card = btn.closest('.application-card');
    const messageDiv = card.querySelector('.application-message');
    const modal = card.querySelector('.application-edit-modal');
    if (!modal || !messageDiv) return;
    // Forcer l'affichage de la modal (évite display:none persistant)
    modal.style.display = 'block';
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    document.body.classList.add('modal-open');
    // Préremplit le textarea (fallback si vide)
    const textarea = modal.querySelector('.edit-message-input');
    textarea.value = messageDiv.textContent || textarea.value || '';
    textarea.focus();
    // Fermer la modal (croix ou Annuler)
    const closeBtn = modal.querySelector('.close-modal');
    const cancelBtn = modal.querySelector('.btn-cancel-edit');
    function closeModal() {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
    closeBtn.onclick = closeModal;
    cancelBtn.onclick = closeModal;
    // Valider la modification
    const saveBtn = modal.querySelector('.btn-save-edit');
    saveBtn.onclick = function(e) {
        e.preventDefault();
        const newMessage = textarea.value;
        fetch(`/api/applications/${appId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: newMessage })
        })
        .then(res => {
            if (res.ok) {
                messageDiv.textContent = newMessage;
                closeModal();
                alert('Message modifié !');
            } else {
                alert('Erreur lors de la modification.');
            }
        });
    };
}
// Profile page JavaScript functionality

document.addEventListener('DOMContentLoaded', function() {
    // Gestion du changement de mot de passe
    const passwordForm = document.querySelector('form[action*="change_password"]');
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            const newPassword = document.getElementById('new_password').value;
            const confirmPassword = document.getElementById('confirm_password').value;
            
            if (newPassword !== confirmPassword) {
                e.preventDefault();
                alert('Les nouveaux mots de passe ne correspondent pas !');
                return false;
            }
            
            if (newPassword.length < 6) {
                e.preventDefault();
                alert('Le mot de passe doit contenir au moins 6 caractères !');
                return false;
            }
        });
    }
    
    // Gestion de l'édition du profil
    const editBtn = document.getElementById('editProfileBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const profileView = document.getElementById('profileView');
    const profileEdit = document.getElementById('profileEdit');
    
    if (editBtn && cancelBtn && profileView && profileEdit) {
        editBtn.addEventListener('click', function() {
            profileView.style.display = 'none';
            profileEdit.style.display = 'block';
        });
        
        cancelBtn.addEventListener('click', function() {
            profileView.style.display = 'block';
            profileEdit.style.display = 'none';
        });
    }
    
    // Validation du formulaire de profil
    const profileForm = document.querySelector('form[action*="update_profile"]');
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            const email = document.getElementById('email').value;
            const firstName = document.getElementById('first_name').value;
            const surname = document.getElementById('surname').value;
            const login = document.getElementById('login').value;
            
            // Validation email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                e.preventDefault();
                alert('Veuillez entrer une adresse email valide !');
                return false;
            }
            
            // Validation champs requis
            if (!firstName.trim() || !surname.trim() || !login.trim()) {
                e.preventDefault();
                alert('Les champs prénom, nom et login sont obligatoires !');
                return false;
            }
            
            if (login.length < 3) {
                e.preventDefault();
                alert('Le nom d\'utilisateur doit contenir au moins 3 caractères !');
                return false;
            }
        });
    }
    
    // Gestion de la suppression du compte
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', function() {
            const confirmMessage = `⚠️ ATTENTION ⚠️
            
Vous êtes sur le point de supprimer définitivement votre compte.

Cette action :
• Supprimera toutes vos données personnelles
• Effacera toutes vos candidatures
• Ne peut pas être annulée

Êtes-vous absolument sûr(e) de vouloir continuer ?`;

            if (confirm(confirmMessage)) {
                const doubleConfirm = prompt('Pour confirmer la suppression, tapez "SUPPRIMER" en majuscules :');
                
                if (doubleConfirm === 'SUPPRIMER') {
                    // Créer un formulaire invisible pour envoyer la requête POST
                    const form = document.createElement('form');
                    form.method = 'POST';
                    form.action = '/delete_account'; // L'URL devra être créée côté Flask
                    form.style.display = 'none';
                    
                    // Ajouter un token CSRF si nécessaire
                    const csrfToken = document.querySelector('meta[name="csrf-token"]');
                    if (csrfToken) {
                        const csrfInput = document.createElement('input');
                        csrfInput.type = 'hidden';
                        csrfInput.name = 'csrf_token';
                        csrfInput.value = csrfToken.getAttribute('content');
                        form.appendChild(csrfInput);
                    }
                    
                    document.body.appendChild(form);
                    form.submit();
                } else if (doubleConfirm !== null) {
                    alert('Suppression annulée. Vous devez taper exactement "SUPPRIMER" pour confirmer.');
                }
            }
        });
    }
});

// ===== GESTION DE L'ENTREPRISE =====

// Création d'entreprise
document.addEventListener('DOMContentLoaded', function() {
    const createCompanyBtn = document.getElementById('createCompanyBtn');
    const createCompanyForm = document.getElementById('createCompanyForm');
    const cancelCreateCompanyBtn = document.getElementById('cancelCreateCompanyBtn');
    const newCompanyForm = document.getElementById('newCompanyForm');

    // Afficher le formulaire de création
    if (createCompanyBtn) {
        createCompanyBtn.addEventListener('click', function() {
            createCompanyForm.style.display = 'block';
            createCompanyBtn.style.display = 'none';
        });
    }

    // Annuler la création
    if (cancelCreateCompanyBtn) {
        cancelCreateCompanyBtn.addEventListener('click', function() {
            createCompanyForm.style.display = 'none';
            if (createCompanyBtn) createCompanyBtn.style.display = 'inline-block';
            newCompanyForm.reset();
        });
    }

    // Soumettre la création d'entreprise
    if (newCompanyForm) {
        newCompanyForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validation du nom d'entreprise
            const companyName = document.getElementById('new_company_name').value.trim();
            if (!companyName) {
                alert('Le nom de l\'entreprise est obligatoire.');
                return;
            }
            
            const formData = new FormData(newCompanyForm);
            const data = Object.fromEntries(formData);
            
            fetch('/api/my-company', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    alert('Entreprise créée avec succès !');
                    location.reload(); // Recharger pour afficher la nouvelle entreprise
                } else {
                    alert('Erreur : ' + data.message);
                }
            })
            .catch(error => {
                console.error('Erreur:', error);
                alert('Erreur lors de la création de l\'entreprise');
            });
        });
    }

    // Édition d'entreprise
    const editCompanyBtn = document.getElementById('editCompanyBtn');
    const companyView = document.getElementById('companyView');
    const companyEdit = document.getElementById('companyEdit');
    const cancelCompanyEditBtn = document.getElementById('cancelCompanyEditBtn');
    const companyForm = document.getElementById('companyForm');
    const deleteCompanyBtn = document.getElementById('deleteCompanyBtn');

    // Afficher le formulaire d'édition
    if (editCompanyBtn) {
        editCompanyBtn.addEventListener('click', function() {
            companyView.style.display = 'none';
            companyEdit.style.display = 'block';
        });
    }

    // Supprimer l'entreprise
    if (deleteCompanyBtn) {
        deleteCompanyBtn.addEventListener('click', function() {
            if (confirm('⚠️ Êtes-vous sûr de vouloir supprimer votre entreprise ?\n\nCette action est irréversible et supprimera également toutes vos offres d\'emploi et candidatures associées.')) {
                fetch('/api/my-company', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        alert('Entreprise supprimée avec succès !');
                        location.reload(); // Recharger pour masquer la section entreprise
                    } else {
                        alert('Erreur : ' + data.message);
                    }
                })
                .catch(error => {
                    console.error('Erreur:', error);
                    alert('Erreur lors de la suppression de l\'entreprise');
                });
            }
        });
    }

    // Annuler l'édition
    if (cancelCompanyEditBtn) {
        cancelCompanyEditBtn.addEventListener('click', function() {
            companyView.style.display = 'block';
            companyEdit.style.display = 'none';
        });
    }

    // Soumettre l'édition d'entreprise
    if (companyForm) {
        companyForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validation du nom d'entreprise
            const companyName = document.getElementById('company_name').value.trim();
            if (!companyName) {
                alert('Le nom de l\'entreprise est obligatoire.');
                return;
            }
            
            const formData = new FormData(companyForm);
            const data = Object.fromEntries(formData);
            
            fetch('/api/my-company', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    alert('Entreprise mise à jour avec succès !');
                    location.reload(); // Recharger pour afficher les modifications
                } else {
                    alert('Erreur : ' + data.message);
                }
            })
            .catch(error => {
                console.error('Erreur:', error);
                alert('Erreur lors de la mise à jour de l\'entreprise');
            });
        });
    }
});

// Voir les candidatures pour une offre d'emploi
window.viewJobApplications = function(jobId) {
    // Rediriger vers la page dédiée aux candidatures
    window.location.href = `/candidatures/${jobId}`;
};

// Mettre à jour le statut d'une candidature
window.updateApplicationStatus = function(applicationId, newStatus) {
    fetch(`/api/my-company/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            alert('Statut mis à jour avec succès !');
        } else {
            alert('Erreur : ' + data.message);
        }
    })
    .catch(error => {
        console.error('Erreur:', error);
        alert('Erreur lors de la mise à jour du statut');
    });
};

// Obtenir le badge de statut
function getStatusBadge(status) {
    switch(status) {
        case 'en_attente':
            return '<span class="status-badge status-pending">⏳ En attente</span>';
        case 'acceptee':
            return '<span class="status-badge status-accepted">✅ Acceptée</span>';
        case 'refusee':
            return '<span class="status-badge status-rejected">❌ Refusée</span>';
        default:
            return '<span class="status-badge status-pending">⏳ En attente</span>';
    }
}

// Modifier une offre d'emploi
window.editJob = function(jobId) {
    // Rediriger vers la page d'ajout/modification d'offre avec l'ID de l'offre
    window.location.href = `/ajouter-offre?job_id=${jobId}`;
};

// Supprimer une offre d'emploi
window.deleteJob = async function(jobId, jobTitle) {
    // Confirmation de suppression
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'offre "${jobTitle}" ?\n\nCette action est irréversible et supprimera également toutes les candidatures associées.`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/my-company/jobs/${jobId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            alert('Offre d\'emploi supprimée avec succès !');
            // Recharger la page pour mettre à jour la liste
            window.location.reload();
        } else {
            const error = await response.json();
            alert('Erreur: ' + (error.message || 'Impossible de supprimer l\'offre'));
        }
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'offre:', error);
        alert('Erreur de connexion. Veuillez réessayer.');
    }
};