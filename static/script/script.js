// Job Board JavaScript functionality

document.addEventListener('DOMContentLoaded', function() {
    // Initialize event listeners
    initializeEventListeners();
});

function initializeEventListeners() {
    // Learn more buttons
    const learnMoreBtns = document.querySelectorAll('.learn-more-btn');
    learnMoreBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const adId = this.getAttribute('data-ad-id');
            toggleJobDetails(adId);
        });
    });

    // Apply buttons
    const applyBtns = document.querySelectorAll('.apply-btn');
    applyBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const adId = this.getAttribute('data-ad-id');
            // Redirect to application page
            window.location.href = `/candidater/${adId}`;
        });
    });

    // Close modal when clicking X
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('applicationModal');
        if (event.target === modal) {
            closeModal();
        }
    });

    // Application form submission
    const applicationForm = document.getElementById('applicationForm');
    if (applicationForm) {
        applicationForm.addEventListener('submit', handleApplicationSubmit);
    }
}

async function toggleJobDetails(adId) {
    const detailsDiv = document.getElementById(`details-${adId}`);
    const btn = document.querySelector(`[data-ad-id="${adId}"].learn-more-btn`);

    if (detailsDiv.classList.contains('hidden')) {
        // Show details
        try {
            btn.textContent = 'Chargement...';
            btn.disabled = true;

            const response = await fetch(`/api/advertisement/${adId}`);
            if (!response.ok) {
                throw new Error('Erreur lors du chargement des détails');
            }

            const adDetails = await response.json();
            displayJobDetails(detailsDiv, adDetails);
            
            detailsDiv.classList.remove('hidden');
            btn.textContent = 'Masquer les détails';
            
        } catch (error) {
            console.error('Error fetching job details:', error);
            detailsDiv.innerHTML = '<p style="color: red;">Erreur lors du chargement des détails.</p>';
            detailsDiv.classList.remove('hidden');
            btn.textContent = 'En savoir plus';
        } finally {
            btn.disabled = false;
        }
    } else {
        // Hide details
        detailsDiv.classList.add('hidden');
        btn.textContent = 'En savoir plus';
    }
}

function displayJobDetails(container, details) {
    const formatSalary = (min, max) => {
        if (min && max) {
            return `${min}€ - ${max}€`;
        } else if (min) {
            return `À partir de ${min}€`;
        } else if (max) {
            return `Jusqu'à ${max}€`;
        }
        return 'Non spécifié';
    };

    const formatWorkTime = (workTime) => {
        const translations = {
            'full-time': 'Temps plein',
            'part-time': 'Temps partiel',
            'contract': 'Contrat',
            'internship': 'Stage'
        };
        return translations[workTime] || workTime;
    };

    container.innerHTML = `
        <h4>Détails de l'offre</h4>
        
        <div class="detail-section">
            <span class="detail-label">Description complète:</span>
            <div class="detail-value">${details.full_description || 'Non spécifiée'}</div>
        </div>
        
        <div class="detail-section">
            <span class="detail-label">Salaire:</span>
            <span class="detail-value">${formatSalary(details.salary_min, details.salary_max)}</span>
        </div>
        
        <div class="detail-section">
            <span class="detail-label">Localisation:</span>
            <span class="detail-value">${details.location || 'Non spécifiée'}</span>
        </div>
        
        <div class="detail-section">
            <span class="detail-label">Type de contrat:</span>
            <span class="detail-value">${formatWorkTime(details.work_time)}</span>
        </div>
        
        <div class="detail-section">
            <span class="detail-label">Entreprise:</span>
            <span class="detail-value">${details.company_name}</span>
        </div>
        
        ${details.company_address ? `
        <div class="detail-section">
            <span class="detail-label">Adresse:</span>
            <span class="detail-value">${details.company_address}</span>
        </div>
        ` : ''}
        
        ${details.company_description ? `
        <div class="detail-section">
            <span class="detail-label">À propos de l'entreprise:</span>
            <div class="detail-value">${details.company_description}</div>
        </div>
        ` : ''}
        
        ${details.company_website ? `
        <div class="detail-section">
            <span class="detail-label">Site web:</span>
            <span class="detail-value"><a href="${details.company_website}" target="_blank">${details.company_website}</a></span>
        </div>
        ` : ''}
        
        <div class="detail-section">
            <span class="detail-label">Publiée le:</span>
            <span class="detail-value">${formatDate(details.created_at)}</span>
        </div>
        
        ${details.first_name && details.surname ? `
        <div class="detail-section">
            <span class="detail-label">Publiée par:</span>
            <span class="detail-value">${details.first_name} ${details.surname}</span>
        </div>
        ` : ''}
    `;
}

function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
}

function openApplicationModal(adId) {
    const modal = document.getElementById('applicationModal');
    const adIdInput = document.getElementById('ad_id');
    
    adIdInput.value = adId;
    modal.classList.remove('hidden');
    
    // Focus on first input
    const firstInput = modal.querySelector('input[type="text"], input[type="email"], textarea');
    if (firstInput) {
        firstInput.focus();
    }
}

function closeModal() {
    const modal = document.getElementById('applicationModal');
    modal.classList.add('hidden');
    
    // Reset form
    const form = document.getElementById('applicationForm');
    if (form) {
        form.reset();
    }
}

async function handleApplicationSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // Disable submit button
    submitBtn.textContent = 'Envoi en cours...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('/api/apply', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert('Votre candidature a été envoyée avec succès !');
            closeModal();
        } else {
            alert(result.error || 'Erreur lors de l\'envoi de la candidature');
        }
        
    } catch (error) {
        console.error('Error submitting application:', error);
        alert('Erreur lors de l\'envoi de la candidature. Veuillez réessayer.');
    } finally {
        submitBtn.textContent = 'Envoyer la candidature';
        submitBtn.disabled = false;
    }
}

// Utility functions
function showMessage(message, type = 'info') {
    // Create and show a temporary message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 4px;
        color: white;
        font-weight: 500;
        z-index: 1001;
        max-width: 300px;
    `;
    
    if (type === 'success') {
        messageDiv.style.backgroundColor = '#48bb78';
    } else if (type === 'error') {
        messageDiv.style.backgroundColor = '#f56565';
    } else {
        messageDiv.style.backgroundColor = '#4299e1';
    }
    
    document.body.appendChild(messageDiv);
    
    // Remove message after 3 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 3000);
}