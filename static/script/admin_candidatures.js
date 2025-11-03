// Admin Applications Management Functions

let currentApplicationId = null;
let deletionReasonModal = null;

/**
 * Load all applications for admin panel
 */
async function loadAdminApplications(page = 1, perPage = 10) {
    try {
        const response = await fetch(`/api/applications?page=${page}&per_page=${perPage}`);
        if (!response.ok) {
            if (response.status === 403) {
                console.error('Access denied');
                return;
            }
            throw new Error('Failed to load applications');
        }

        const data = await response.json();
        displayApplicationsList(data.applications);
        updateApplicationsStats(data.applications);

    } catch (error) {
        console.error('Error loading applications:', error);
        showErrorNotification('Erreur lors du chargement des candidatures');
    }
}

/**
 * Display applications list
 */
function displayApplicationsList(applications) {
    const container = document.getElementById('applications-list');
    
    if (!container) {
        console.error('Applications list container not found');
        return;
    }

    if (applications.length === 0) {
        container.innerHTML = `
            <div class="no-applications-message">
                <div class="no-applications-message-icon">📋</div>
                <h3>Aucune candidature</h3>
                <p>Il n'y a pas de candidatures à afficher pour le moment.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = applications.map(app => `
        <div class="admin-application-card ${app.is_deleted ? 'deleted' : ''}">
            <div class="admin-application-header">
                <div class="admin-applicant-info">
                    <div class="admin-applicant-name">${app.first_name} ${app.surname}</div>
                    <div class="admin-job-title">💼 ${app.job_title}</div>
                    <div class="admin-applicant-contact">
                        <span>📧 ${app.email}</span>
                        ${app.phone ? `<span>📱 ${app.phone}</span>` : ''}
                    </div>
                </div>
            </div>

            <div class="admin-application-meta">
                <span class="admin-status-badge status-${getStatusClass(app.status)}">
                    ${getStatusIcon(app.status)} ${getStatusLabel(app.status)}
                </span>
                <span class="admin-application-date">
                    📅 ${formatDate(app.application_date)}
                </span>
                ${app.is_deleted ? `
                    <span class="admin-status-badge admin-status-deleted">
                        🚫 Supprimée
                    </span>
                ` : ''}
            </div>

            <div class="admin-application-details">
                ${app.message ? `
                    <div class="admin-application-section">
                        <h5>💬 Message de motivation</h5>
                        <div class="admin-application-message">${app.message}</div>
                    </div>
                ` : ''}
                
                ${app.is_deleted && app.deletion_reason ? `
                    <div class="admin-application-section">
                        <h5>📌 Raison de la suppression</h5>
                        <div class="admin-deletion-info">${app.deletion_reason}</div>
                    </div>
                ` : ''}
            </div>

            <div class="admin-application-actions">
                ${!app.is_deleted ? `
                    <button class="admin-action-btn admin-action-btn-edit" onclick="editApplication(${app.id_application})">
                        ✏️ Modifier le statut
                    </button>
                    <button class="admin-action-btn admin-action-btn-delete" onclick="openDeletionReasonModal(${app.id_application})">
                        🗑️ Marquer comme supprimée
                    </button>
                    <button class="admin-action-btn admin-action-btn-delete" onclick="hardDeleteApplication(${app.id_application})">
                        ❌ Supprimer définitivement
                    </button>
                ` : `
                    <button class="admin-action-btn admin-action-btn-undelete" onclick="restoreApplication(${app.id_application})">
                        ↩️ Restaurer
                    </button>
                `}
            </div>
        </div>
    `).join('');
}

/**
 * Get status CSS class
 */
function getStatusClass(status) {
    const statusMap = {
        'pending': 'en_attente',
        'reviewed': 'reviewed',
        'accepted': 'acceptee',
        'rejected': 'refusee'
    };
    return `admin-status-${statusMap[status] || 'en_attente'}`;
}

/**
 * Get status icon
 */
function getStatusIcon(status) {
    const icons = {
        'pending': '⏳',
        'reviewed': '👀',
        'accepted': '✅',
        'rejected': '❌'
    };
    return icons[status] || '⏳';
}

/**
 * Get status label
 */
function getStatusLabel(status) {
    const labels = {
        'pending': 'En attente',
        'reviewed': 'Examinée',
        'accepted': 'Acceptée',
        'rejected': 'Refusée'
    };
    return labels[status] || 'En attente';
}

/**
 * Format date
 */
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR') + ' à ' + date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

/**
 * Edit application status
 */
function editApplication(applicationId) {
    const newStatus = prompt('Nouveau statut:\n1 = En attente\n2 = Examinée\n3 = Acceptée\n4 = Refusée');
    
    if (!newStatus) return;

    const statusMap = {
        '1': 'pending',
        '2': 'reviewed',
        '3': 'accepted',
        '4': 'rejected'
    };

    const status = statusMap[newStatus];
    if (!status) {
        showErrorNotification('Statut invalide');
        return;
    }

    // Call the existing update application status function from admin.js
    if (typeof updateApplicationStatus === 'function') {
        updateApplicationStatus(applicationId, status);
    }
}

/**
 * Open deletion reason modal
 */
function openDeletionReasonModal(applicationId) {
    currentApplicationId = applicationId;
    
    // Create modal if it doesn't exist
    if (!deletionReasonModal) {
        const modal = document.createElement('div');
        modal.className = 'admin-deletion-reason-modal';
        modal.id = 'deletionReasonModal';
        modal.innerHTML = `
            <div class="admin-deletion-reason-content">
                <h3>Raison de la suppression</h3>
                <textarea class="admin-deletion-reason-textarea" id="deletionReasonText" placeholder="Entrez la raison de la suppression (optionnel)..."></textarea>
                <div class="admin-deletion-buttons">
                    <button class="admin-deletion-cancel" onclick="closeDeletionReasonModal()">Annuler</button>
                    <button class="admin-deletion-confirm" onclick="confirmSoftDelete()">Confirmer la suppression</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        deletionReasonModal = modal;
    }

    // Show modal
    document.getElementById('deletionReasonModal').classList.add('active');
    document.getElementById('deletionReasonText').focus();
}

/**
 * Close deletion reason modal
 */
function closeDeletionReasonModal() {
    if (deletionReasonModal) {
        deletionReasonModal.classList.remove('active');
        document.getElementById('deletionReasonText').value = '';
        currentApplicationId = null;
    }
}

/**
 * Confirm soft delete (mark as deleted)
 */
async function confirmSoftDelete() {
    if (!currentApplicationId) return;

    const deletionReason = document.getElementById('deletionReasonText').value;

    try {
        const response = await fetch(`/api/applications/${currentApplicationId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ deletion_reason: deletionReason })
        });

        if (!response.ok) {
            throw new Error('Failed to mark application as deleted');
        }

        closeDeletionReasonModal();
        showSuccessNotification('Candidature marquée comme supprimée');
        loadAdminApplications();

    } catch (error) {
        console.error('Error marking application as deleted:', error);
        showErrorNotification('Erreur lors de la suppression de la candidature');
    }
}

/**
 * Hard delete application
 */
async function hardDeleteApplication(applicationId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement cette candidature ? Cette action est irréversible.')) {
        return;
    }

    try {
        const response = await fetch(`/api/applications/${applicationId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete application');
        }

        showSuccessNotification('Candidature supprimée définitivement');
        loadAdminApplications();

    } catch (error) {
        console.error('Error deleting application:', error);
        showErrorNotification('Erreur lors de la suppression de la candidature');
    }
}

/**
 * Restore deleted application
 */
async function restoreApplication(applicationId) {
    if (!confirm('Êtes-vous sûr de vouloir restaurer cette candidature ?')) {
        return;
    }

    try {
        const response = await fetch(`/api/applications/${applicationId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ deletion_reason: '' })
        });

        if (!response.ok) {
            throw new Error('Failed to restore application');
        }

        showSuccessNotification('Candidature restaurée');
        loadAdminApplications();

    } catch (error) {
        console.error('Error restoring application:', error);
        showErrorNotification('Erreur lors de la restauration de la candidature');
    }
}

/**
 * Update applications statistics
 */
function updateApplicationsStats(applications) {
    const statsContainer = document.querySelector('.applications-stats-grid');
    
    if (!statsContainer) return;

    const stats = {
        total: applications.length,
        pending: applications.filter(a => a.status === 'pending' && !a.is_deleted).length,
        reviewed: applications.filter(a => a.status === 'reviewed' && !a.is_deleted).length,
        accepted: applications.filter(a => a.status === 'accepted' && !a.is_deleted).length,
        rejected: applications.filter(a => a.status === 'rejected' && !a.is_deleted).length,
        deleted: applications.filter(a => a.is_deleted).length
    };

    statsContainer.innerHTML = `
        <div class="admin-stat-card">
            <div class="admin-stat-number">${stats.total}</div>
            <div class="admin-stat-label">Candidatures totales</div>
        </div>
        <div class="admin-stat-card">
            <div class="admin-stat-number">${stats.pending}</div>
            <div class="admin-stat-label">En attente</div>
        </div>
        <div class="admin-stat-card">
            <div class="admin-stat-number">${stats.reviewed}</div>
            <div class="admin-stat-label">Examinées</div>
        </div>
        <div class="admin-stat-card">
            <div class="admin-stat-number">${stats.accepted}</div>
            <div class="admin-stat-label">Acceptées</div>
        </div>
        <div class="admin-stat-card">
            <div class="admin-stat-number">${stats.rejected}</div>
            <div class="admin-stat-label">Refusées</div>
        </div>
        <div class="admin-stat-card">
            <div class="admin-stat-number">${stats.deleted}</div>
            <div class="admin-stat-label">Supprimées</div>
        </div>
    `;
}

/**
 * Show success notification
 */
function showSuccessNotification(message) {
    alert(message); // Simple implementation - can be replaced with toast notification
}

/**
 * Show error notification
 */
function showErrorNotification(message) {
    alert(message); // Simple implementation - can be replaced with toast notification
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.id === 'deletionReasonModal') {
        closeDeletionReasonModal();
    }
});

// Load applications when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadAdminApplications();
});
