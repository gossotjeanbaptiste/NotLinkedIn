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