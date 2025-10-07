// Configurazione di base
const CONFIG = {
    // Sostituisci con le tue informazioni
    owner: 'tu-utente',        // Il tuo nome utente GitHub
    repo: 'tuo-repo',          // Nome del repository
    path: 'db/database.json',  // Percorso del file nel repository
    branch: 'main',            // Branch del repository
    // Token di accesso personale (da creare su GitHub)
    // Vedi: https://github.com/settings/tokens/new?scopes=repo
    token: 'il-tuo-token-github'
};

// Stato dell'applicazione
let inventory = [];
let lastUpdated = new Date().toISOString();
let sha = null; // SHA dell'ultimo commit del file

// Elementi del DOM
const inventoryContainer = document.getElementById('inventory');
const emptyState = document.getElementById('emptyState');
const lastUpdatedEl = document.getElementById('lastUpdated');
const addItemBtn = document.getElementById('addItemBtn');

// Inizializza l'applicazione
async function init() {
    // Carica i dati iniziali
    await loadDatabase();
    
    // Imposta gli event listener
    addItemBtn.addEventListener('click', addNewItem);
    document.getElementById('newItemName').addEventListener('keypress', handleKeyPress);
    document.getElementById('newItemQuantity').addEventListener('keypress', handleKeyPress);
    
    // Aggiorna la visualizzazione ogni 30 secondi
    setInterval(loadDatabase, 30000);
    
    // Aggiorna la data di ultimo aggiornamento ogni minuto
    setInterval(updateLastUpdatedText, 60000);
    
    updateLastUpdatedText();
}

// Carica il database da GitHub
async function loadDatabase() {
    try {
        const octokit = new Octokit({
            auth: CONFIG.token
        });
        
        const { data } = await octokit.repos.getContent({
            owner: CONFIG.owner,
            repo: CONFIG.repo,
            path: CONFIG.path,
            ref: CONFIG.branch
        });
        
        // Salva lo SHA del file per gli aggiornamenti successivi
        sha = data.sha;
        
        // Decodifica il contenuto (è in base64)
        const content = JSON.parse(atob(data.content));
        
        // Aggiorna lo stato
        inventory = content.items || [];
        lastUpdated = content.lastUpdated || new Date().toISOString();
        
        // Aggiorna l'interfaccia
        updateInventoryDisplay();
        updateLastUpdatedText();
        
        return true;
    } catch (error) {
        console.error('Errore nel caricamento del database:', error);
        showNotification('Impossibile caricare i dati. Verifica la connessione.', 'error');
        return false;
    }
}

// Salva il database su GitHub
async function saveDatabase() {
    try {
        const octokit = new Octokit({
            auth: CONFIG.token
        });
        
        // Prepara i dati da salvare
        const content = {
            items: inventory,
            lastUpdated: new Date().toISOString()
        };
        
        // Converti in base64
        const contentBase64 = btoa(JSON.stringify(content, null, 2));
        
        // Invia la richiesta a GitHub
        await octokit.repos.createOrUpdateFileContents({
            owner: CONFIG.owner,
            repo: CONFIG.repo,
            path: CONFIG.path,
            message: `Aggiornamento inventario: ${new Date().toLocaleString()}`,
            content: contentBase64,
            sha: sha, // SHA del file esistente (per gli aggiornamenti)
            branch: CONFIG.branch
        });
        
        // Aggiorna l'ultimo aggiornamento
        lastUpdated = content.lastUpdated;
        updateLastUpdatedText();
        
        return true;
    } catch (error) {
        console.error('Errore nel salvataggio del database:', error);
        showNotification('Errore nel salvataggio dei dati', 'error');
        return false;
    }
}

// Funzioni per la gestione dell'interfaccia (rimangono simili a prima)
async function updateQuantity(itemId, change) {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;
    
    const newQuantity = item.quantity + change;
    
    if (newQuantity < 0) {
        showNotification('La quantità non può essere negativa', 'error');
        return;
    }
    
    item.quantity = newQuantity;
    
    if (await saveDatabase()) {
        updateInventoryDisplay();
        showNotification(`Quantità aggiornata per ${item.name}`, 'success');
    }
}

async function removeItem(itemId) {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;
    
    if (confirm(`Sei sicuro di voler rimuovere "${item.name}" dall'inventario?`)) {
        const itemName = item.name;
        inventory = inventory.filter(i => i.id !== itemId);
        
        if (await saveDatabase()) {
            updateInventoryDisplay();
            showNotification(`"${itemName}" rimosso dall'inventario`, 'success');
        }
    }
}

async function addNewItem() {
    const nameInput = document.getElementById('newItemName');
    const quantityInput = document.getElementById('newItemQuantity');
    
    const name = nameInput.value.trim();
    const quantity = parseInt(quantityInput.value) || 0;
    
    if (!name) {
        showNotification('Inserisci un nome per l\'articolo', 'error');
        nameInput.focus();
        return;
    }
    
    if (isNaN(quantity) || quantity < 0) {
        showNotification('Inserisci una quantità valida (numero intero positivo o zero)', 'error');
        quantityInput.focus();
        return;
    }
    
    // Controlla se l'articolo esiste già
    const existingItem = inventory.find(item => 
        item.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingItem) {
        if (confirm(`"${name}" è già presente nell'inventario. Vuoi aggiornare la quantità invece di creare un duplicato?`)) {
            existingItem.quantity += quantity;
            
            if (await saveDatabase()) {
                updateInventoryDisplay();
                showNotification(`Quantità aggiornata per "${name}"`, 'success');
                
                // Resetta i campi di input
                nameInput.value = '';
                quantityInput.value = '1';
                nameInput.focus();
            }
            return;
        }
    }
    
    // Crea un nuovo ID univoco
    const newId = inventory.length > 0 ? Math.max(...inventory.map(i => i.id)) + 1 : 1;
    
    // Aggiungi il nuovo articolo
    inventory.push({
        id: newId,
        name: name,
        quantity: quantity
    });
    
    if (await saveDatabase()) {
        updateInventoryDisplay();
        showNotification(`"${name}" aggiunto all'inventario`, 'success');
        
        // Resetta i campi di input
        nameInput.value = '';
        quantityInput.value = '1';
        nameInput.focus();
    }
}

// Funzioni di utilità
function updateLastUpdatedText() {
    if (!lastUpdated) return;
    
    const date = new Date(lastUpdated);
    const options = { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
    };
    
    lastUpdatedEl.textContent = `Ultimo aggiornamento: ${date.toLocaleString('it-IT', options)}`;
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        addNewItem();
    }
}

// Avvia l'applicazione
window.onload = init;
