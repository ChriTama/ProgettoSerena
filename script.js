// Stato dell'applicazione
let inventory = [];
const INVENTORY_KEY = 'inventoryData';

// Elementi del DOM
const inventoryContainer = document.getElementById('inventory');
const emptyState = document.getElementById('emptyState');
const lastUpdatedEl = document.getElementById('lastUpdated');
const addItemBtn = document.getElementById('addItemBtn');

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
    const data = {
        items: inventory,
        lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(data));
    updateLastUpdatedText(data.lastUpdated);
    return true;
}

// Aggiorna la visualizzazione
function updateInventoryDisplay() {
    const container = document.getElementById('inventory');
    container.innerHTML = '';

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
        container.appendChild(itemEl);
    });
}

// Funzioni di utilità
function showNotification(message, type = 'info') {
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
    lastUpdatedEl.textContent = `Ultimo aggiornamento: ${date.toLocaleString('it-IT')}`;
}

// Gestione eventi
function handleKeyPress(event) {
    if (event.key === 'Enter') addNewItem();
}

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
    loadDatabase();
    addItemBtn.addEventListener('click', addNewItem);
    document.getElementById('newItemName').addEventListener('keypress', handleKeyPress);
    document.getElementById('newItemQuantity').addEventListener('keypress', handleKeyPress);
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
    if (saveDatabase()) {
        updateInventoryDisplay();
        showNotification(`Quantità aggiornata per ${item.name}`, 'success');
    }
};

window.removeItem = function(itemId) {
    if (!confirm('Sei sicuro di voler rimuovere questo articolo?')) return;
    
    const index = inventory.findIndex(i => i.id === itemId);
    if (index > -1) {
        const itemName = inventory[index].name;
        inventory.splice(index, 1);
        if (saveDatabase()) {
            updateInventoryDisplay();
            showNotification(`"${itemName}" rimosso dall'inventario`, 'success');
        }
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

    const newId = inventory.length > 0 ? Math.max(...inventory.map(i => i.id)) + 1 : 1;
    inventory.push({ id: newId, name, quantity });
    
    if (saveDatabase()) {
        updateInventoryDisplay();
        showNotification(`"${name}" aggiunto all'inventario`, 'success');
        nameInput.value = '';
        quantityInput.value = '1';
        nameInput.focus();
    }
};