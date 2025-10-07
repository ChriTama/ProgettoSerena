// Database iniziale
let inventory = [
    { id: 1, name: 'Zaino', quantity: 10 },
    { id: 2, name: 'Borsa', quantity: 15 },
    { id: 3, name: 'Portadocumenti', quantity: 20 },
    { id: 4, name: 'Pochette', quantity: 12 }
];

// Carica il database dal localStorage all'avvio
function loadDatabase() {
    const savedData = localStorage.getItem('inventoryDB');
    if (savedData) {
        inventory = JSON.parse(savedData);
    } else {
        // Se non ci sono dati salvati, salva quelli di default
        saveDatabase();
    }
}

// Salva il database nel localStorage
function saveDatabase() {
    localStorage.setItem('inventoryDB', JSON.stringify(inventory));
}

// Aggiorna la visualizzazione dell'inventario
function updateInventoryDisplay() {
    const inventoryContainer = document.getElementById('inventory');
    inventoryContainer.innerHTML = '';
    
    inventory.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item';
        itemElement.innerHTML = `
            <span>${item.name}</span>
            <div class="item-controls">
                <button onclick="updateQuantity(${item.id}, -1)">-</button>
                <span class="quantity">${item.quantity}</span>
                <button onclick="updateQuantity(${item.id}, 1)">+</button>
                <button onclick="removeItem(${item.id})" style="margin-left: 10px;">Elimina</button>
            </div>
        `;
        inventoryContainer.appendChild(itemElement);
    });
}

// Aggiorna la quantità di un articolo
function updateQuantity(itemId, change) {
    const item = inventory.find(i => i.id === itemId);
    if (item) {
        const newQuantity = item.quantity + change;
        // Impedisci quantità negative
        if (newQuantity >= 0) {
            item.quantity = newQuantity;
            saveDatabase();
            updateInventoryDisplay();
        }
    }
}

// Rimuovi un articolo
function removeItem(itemId) {
    if (confirm('Sei sicuro di voler rimuovere questo articolo?')) {
        inventory = inventory.filter(item => item.id !== itemId);
        saveDatabase();
        updateInventoryDisplay();
    }
}

// Aggiungi un nuovo articolo
function addNewItem() {
    const nameInput = document.getElementById('newItemName');
    const quantityInput = document.getElementById('newItemQuantity');
    
    const name = nameInput.value.trim();
    const quantity = parseInt(quantityInput.value) || 0;
    
    if (name && !isNaN(quantity) && quantity >= 0) {
        // Crea un nuovo ID univoco
        const newId = inventory.length > 0 ? Math.max(...inventory.map(i => i.id)) + 1 : 1;
        
        inventory.push({
            id: newId,
            name: name,
            quantity: quantity
        });
        
        saveDatabase();
        updateInventoryDisplay();
        
        // Resetta i campi di input
        nameInput.value = '';
        quantityInput.value = '';
    } else {
        alert('Inserisci un nome valido e una quantità non negativa');
    }
}

// Inizializza l'applicazione
function init() {
    loadDatabase();
    updateInventoryDisplay();
}

// Avvia l'applicazione quando la pagina è caricata
window.onload = init;
