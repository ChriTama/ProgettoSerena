// Stato dell'applicazione
let inventory = [];
const INVENTORY_KEY = 'inventoryData';

// Elementi del DOM
const inventoryContainer = document.getElementById('inventory');
const emptyState = document.getElementById('emptyState');
const lastUpdatedEl = document.getElementById('lastUpdated');
const addItemBtn = document.getElementById('addItemBtn');
const saveBtn = document.createElement('button');

// Crea il pulsante di salvataggio
function createSaveButton() {
    saveBtn.id = 'saveBtn';
    saveBtn.className = 'btn-save';
    saveBtn.innerHTML = '<i class="fas fa-save"></i> Salva Modifiche';
    saveBtn.onclick = saveDatabase;
    lastUpdatedEl.insertAdjacentElement('afterend', saveBtn);
}

// Crea i pulsanti di esportazione e importazione
function createExportImportButtons() {
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const importFile = document.getElementById('importFile');

    exportBtn.onclick = exportDatabase;
    importBtn.onclick = () => importFile.click();
    importFile.onchange = importDatabase;
}

// Esporta i dati in un file JSON scaricabile
function exportDatabase() {
    if (inventory.length === 0) {
        showNotification('Nessun dato da esportare', 'error');
        return;
    }

    try {
        const data = {
            items: inventory,
            lastUpdated: new Date().toISOString(),
            version: '1.0',
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `inventario_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);

        showNotification('Dati esportati con successo!', 'success');
    } catch (e) {
        console.error('Errore nell\'esportazione:', e);
        showNotification('Errore nell\'esportazione dei dati', 'error');
    }
}

// Importa i dati da un file JSON
function importDatabase(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);

            if (!data.items || !Array.isArray(data.items)) {
                showNotification('Formato file non valido', 'error');
                return;
            }

            // Backup dei dati attuali
            const currentData = {
                items: [...inventory],
                lastUpdated: new Date().toISOString()
            };

            // Importa i nuovi dati
            inventory = data.items.map(item => ({
                id: item.id || Date.now() + Math.random(),
                name: item.name,
                quantity: item.quantity || 0
            }));

            // Salva nel localStorage
            saveDatabase();

            // Aggiorna l'interfaccia
            updateInventoryDisplay();

            showNotification(`Importati ${inventory.length} articoli con successo!`, 'success');

            // Salva automaticamente il backup nel localStorage per sicurezza
            localStorage.setItem('inventory_backup', JSON.stringify(currentData));

        } catch (e) {
            console.error('Errore nell\'importazione:', e);
            showNotification('Errore nella lettura del file', 'error');
        }
    };

    reader.readAsText(file);

    // Resetta l'input file
    event.target.value = '';
}

// Carica i dati dal localStorage
function loadDatabase() {
    const savedData = localStorage.getItem(INVENTORY_KEY);
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            inventory = data.items || [];
            updateLastUpdatedText(data.lastUpdated);
        } catch (e) {
            console.error('Errore nel caricamento dei dati:', e);
            showNotification('Errore nel caricamento dei dati', 'error');
        }
    }
    updateInventoryDisplay();
}

// Salva i dati nel localStorage
function saveDatabase() {
    try {
        const data = {
            items: inventory,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(INVENTORY_KEY, JSON.stringify(data));
        updateLastUpdatedText(data.lastUpdated);
        showNotification('Modifiche salvate con successo!', 'success');
        return true;
    } catch (e) {
        console.error('Errore nel salvataggio:', e);
        showNotification('Errore nel salvataggio dei dati', 'error');
        return false;
    }
}

// Aggiorna la visualizzazione
function updateInventoryDisplay() {
    inventoryContainer.innerHTML = '';

    if (inventory.length === 0) {
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    inventory.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'item';
        itemEl.innerHTML = `
            <div class="item-info">
                <span class="item-name">${item.name}</span>
                ${item.quantity < 5 ? '<span class="low-stock">Scarsa disponibilità</span>' : ''}
            </div>
            <div class="item-controls">
                <button onclick="updateQuantity(${item.id}, -1)" class="btn-decrease" title="Rimuovi">
                    <i class="fas fa-minus"></i>
                </button>
                <span class="quantity-display">${item.quantity}</span>
                <button onclick="updateQuantity(${item.id}, 1)" class="btn-increase" title="Aggiungi">
                    <i class="fas fa-plus"></i>
                </button>
                <button onclick="removeItem(${item.id})" class="btn-delete" title="Elimina">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        inventoryContainer.appendChild(itemEl);
    });
}

// Funzioni di utilità
function showNotification(message, type = 'info') {
    const oldNotification = document.getElementById('notification');
    if (oldNotification) oldNotification.remove();

    const notification = document.createElement('div');
    notification.id = 'notification';
    notification.className = type;
    notification.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
        ${message}
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function updateLastUpdatedText(timestamp) {
    if (!timestamp) return;
    const date = new Date(timestamp);
    lastUpdatedEl.textContent = `Ultimo salvataggio: ${date.toLocaleString('it-IT')}`;
}

// Gestione eventi
function handleKeyPress(event) {
    if (event.key === 'Enter') addNewItem();
}

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
    loadDatabase();
    createSaveButton();
    createExportImportButtons();
    addItemBtn.addEventListener('click', addNewItem);
    document.getElementById('newItemName').addEventListener('keypress', handleKeyPress);
    document.getElementById('newItemQuantity').addEventListener('keypress', handleKeyPress);
    
    // Salva automaticamente quando si chiude la pagina
    window.addEventListener('beforeunload', (e) => {
        if (inventory.length > 0) {
            saveDatabase();
        }
    });
});

// Funzioni esposte globalmente
window.updateQuantity = function(itemId, change) {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    const newQuantity = item.quantity + change;
    if (newQuantity < 0) {
        showNotification('La quantità non può essere negativa', 'error');
        return;
    }

    item.quantity = newQuantity;
    updateInventoryDisplay();
    showNotification(`Quantità aggiornata per ${item.name}`, 'info');
};

window.removeItem = function(itemId) {
    if (!confirm('Sei sicuro di voler rimuovere questo articolo?')) return;

    const index = inventory.findIndex(i => i.id === itemId);
    if (index > -1) {
        const itemName = inventory[index].name;
        inventory.splice(index, 1);
        updateInventoryDisplay();
        showNotification(`"${itemName}" rimosso dall'inventario`, 'success');
    }
};

window.addNewItem = function() {
    const nameInput = document.getElementById('newItemName');
    const quantityInput = document.getElementById('newItemQuantity');

    const name = nameInput.value.trim();
    const quantity = parseInt(quantityInput.value) || 0;

    if (!name) {
        showNotification('Inserisci un nome per l\'articolo', 'error');
        return;
    }

    if (isNaN(quantity) || quantity < 0) {
        showNotification('Inserisci una quantità valida', 'error');
        return;
    }

    // Controlla se l'articolo esiste già
    const existingItem = inventory.find(item =>
        item.name.toLowerCase() === name.toLowerCase()
    );

    if (existingItem) {
        if (confirm(`"${name}" è già presente. Vuoi aggiornare la quantità?`)) {
            existingItem.quantity += quantity;
            updateInventoryDisplay();
            showNotification(`Quantità aggiornata per ${name}`, 'success');
            nameInput.value = '';
            quantityInput.value = '1';
            nameInput.focus();
            return;
        } else {
            return;
        }
    }

    const newId = inventory.length > 0 ? Math.max(...inventory.map(i => i.id)) + 1 : 1;
    inventory.push({ id: newId, name, quantity });

    updateInventoryDisplay();
    showNotification(`"${name}" aggiunto all'inventario`, 'success');
    nameInput.value = '';
    quantityInput.value = '1';
    nameInput.focus();
};
