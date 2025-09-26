// ================== Data Model ==================
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let accounts = JSON.parse(localStorage.getItem("accounts")) || [];

let budgets = JSON.parse(localStorage.getItem("budgets")) || {
    "budget_1": { name: "New Sheet 1", transactions: [], accounts: [] }
};

let currentBudgetKey = Object.keys(budgets)[0] || "budget_1";
let editingBudgetKey = null; // Track which sheet we are editing

const presetColors = [
    "#667eea", "#764ba2", "#4facfe", "#00f2fe", "#a8edea",
    "#fed6e3", "#ff9a9e", "#fecfef", "#ffeaa7", "#fab1a0"
];

let selectedColor = presetColors[0];
let editMode = false;
let pendingDeleteKey = null;

// ================== Init Dates ==================
document.getElementById('incomeDate').value = new Date().toISOString().split('T')[0];
document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];

// ================== Persistence ==================
function saveData() {
    if (currentBudgetKey && budgets[currentBudgetKey]) {
        budgets[currentBudgetKey].transactions = transactions;
        budgets[currentBudgetKey].accounts = accounts;
    }
    localStorage.setItem("budgets", JSON.stringify(budgets));
}
// ================== Show/Hide Modal ==================
function openSheetModal(key) {
    editingBudgetKey = key;
    const budget = budgets[key];

    // Pre-fill fields
    document.getElementById("sheetName").value = budget.name || "";
    renderColorChoices(budget.color || presetColors[0]);

    document.getElementById("sheetModal").classList.remove("hidden");
}

function closeSheetModal() {
    document.getElementById("sheetModal").classList.add("hidden");
    editingBudgetKey = null;
}

// ================== Color Choices in Modal ==================
function renderColorChoices(currentColor) {
    const container = document.getElementById("colorChoices");
    container.innerHTML = "";
    presetColors.forEach(color => {
        const circle = document.createElement("div");
        circle.className = "color-circle";
        circle.style.background = color;
        if (color === currentColor) {
            circle.classList.add("selected");
            selectedColor = color;
        }
        circle.onclick = () => {
            document.querySelectorAll(".color-circle").forEach(c => c.classList.remove("selected"));
            circle.classList.add("selected");
            selectedColor = color;
        };
        container.appendChild(circle);
    });
}


// ================== Budgets (Tabs) ==================
function loadBudget(key) {
    const blankState = document.getElementById("blankState");
    const appContent = document.getElementById("appContent");

    if (!key || !budgets[key]) {
        currentBudgetKey = null;
        transactions = [];
        accounts = [];

        // Show blank state
        blankState.style.display = "block";
        appContent.style.display = "none";
        return;
    }

    // Show real app UI
    blankState.style.display = "none";
    appContent.style.display = "block";

    currentBudgetKey = key;

    const sheetTitle = document.getElementById("sheetTitle");
    if (sheetTitle) {
        if (!key || !budgets[key]) {
            sheetTitle.textContent = "No Sheet Selected";
        } else {
            sheetTitle.textContent = "Sheet: " + (budgets[key].name || "Untitled");
        }
    }

    transactions = budgets[key].transactions || [];
    accounts = budgets[key].accounts || [];
    updateDisplay();
    updateAccountsDisplay();
    highlightActiveSidebarItem();
}

function addBudget() {
    if (Object.keys(budgets).length >= 5) {
        alert("Maximum of 5 tabs reached.");
        return;
    }

    // Generate a new key but don’t save yet
    const newKey = "budget_" + Date.now();
    budgets[newKey] = { name: "", transactions: [], accounts: [], color: presetColors[0] };

    // Open modal immediately
    openSheetModal(newKey);
}

// ================== Sidebar Logic ==================

let draggedKey = null;

function handleDragStart(e) {
    draggedKey = this.dataset.key;
    e.dataTransfer.effectAllowed = "move";
}

function handleDragOver(e) {
    e.preventDefault();
    this.classList.add("drag-over");
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove("drag-over");

    const targetKey = this.dataset.key;
    if (draggedKey === targetKey) return;

    const keys = Object.keys(budgets);
    const draggedIndex = keys.indexOf(draggedKey);
    const targetIndex = keys.indexOf(targetKey);

    // Reorder keys
    const newKeys = [...keys];
    newKeys.splice(draggedIndex, 1);
    newKeys.splice(targetIndex, 0, draggedKey);

    // Rebuild budgets with new order
    const newBudgets = {};
    newKeys.forEach((k) => {
        newBudgets[k] = budgets[k];
    });
    budgets = newBudgets;

    saveData();
    renderSidebar();
}

function handleDragLeave(e) {
    this.classList.remove("drag-over");
}

function renderSidebar() {
    const list = document.getElementById("budgetTabs");
    list.innerHTML = "";

    const keys = Object.keys(budgets);

    // Empty state: no sheets
    if (keys.length === 0) {
        const emptyDiv = document.createElement("div");
        emptyDiv.style.textAlign = "center";
        emptyDiv.style.padding = "20px";
        emptyDiv.style.color = "#6c757d";
        emptyDiv.style.display = "flex";
        emptyDiv.style.flexDirection = "column";
        emptyDiv.style.gap = "10px";

        const msg = document.createElement("div");
        msg.textContent = "No sheets present";

        const addBtn = document.createElement("button");
        addBtn.className = "btn btn-full";
        addBtn.textContent = "+ Add New Sheet";
        addBtn.onclick = () => addBudget();

        emptyDiv.appendChild(msg);
        emptyDiv.appendChild(addBtn);

        list.appendChild(emptyDiv);
        return; // stop here, nothing else to render
    }

    // Normal rendering when sheets exist
    keys.forEach((key) => {
        const li = document.createElement("li");
        li.dataset.key = key;
        li.className = key === currentBudgetKey ? "active" : "";
        li.style.background = budgets[key].color || "#667eea";
        li.style.color = "white"; 
        
        // Normal click loads the sheet
        li.onclick = () => {
            if (!editMode) loadBudget(key);
        };

        // Title always shown
        const title = document.createElement("span");
        title.textContent = budgets[key].name || "Untitled";
        li.appendChild(title);

        if (editMode) {
            // Drag handle
            const dragHandle = document.createElement("span");
            dragHandle.className = "icon-btn drag-handle";
            dragHandle.title = "Drag to reorder";
            dragHandle.innerHTML = "✥";
            dragHandle.onmousedown = (e) => e.stopPropagation();

            // Rename button
            const rename = document.createElement("button");
            rename.className = "icon-btn";
            rename.title = "Rename";
            rename.innerHTML = "✏️";
            rename.onclick = (e) => {
                e.stopPropagation();
                openSheetModal(key);
            };

            // Delete button
            const removeBtn = document.createElement("button");
            removeBtn.className = "icon-btn";
            removeBtn.title = "Delete";
            removeBtn.innerHTML = "🗑️";
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                pendingDeleteKey = key; // store which sheet is being deleted
                document.getElementById("deleteModal").classList.remove("hidden");
            };

            // Icon wrapper
            const iconWrapper = document.createElement("div");
            iconWrapper.className = "icon-wrapper";
            iconWrapper.appendChild(dragHandle);
            iconWrapper.appendChild(rename);
            iconWrapper.appendChild(removeBtn);

            li.appendChild(iconWrapper);

            // Drag events
            li.draggable = true;
            li.addEventListener("dragstart", handleDragStart);
            li.addEventListener("dragover", handleDragOver);
            li.addEventListener("dragleave", handleDragLeave);
            li.addEventListener("drop", handleDrop);
        }

        list.appendChild(li);
    });
}

// ================== Reorder Logic ==================

function reorderBudget(key, direction) {
    const keys = Object.keys(budgets);
    const index = keys.indexOf(key);
    const newIndex = index + direction;

    if (newIndex < 0 || newIndex >= keys.length) return;

    // Rebuild budgets object with reordered keys
    const newBudgets = {};
    keys.forEach((k, i) => {
        if (i === newIndex) {
            newBudgets[key] = budgets[key];
        }
        if (k !== key) {
            newBudgets[k] = budgets[k];
        }
    });

    budgets = newBudgets;
    saveData();
    renderSidebar();
}


// ================== Highlighting Active Sidebar Sheet ==================
function highlightActiveSidebarItem() {
    document.querySelectorAll("#budgetTabs li").forEach(li => {
        li.classList.toggle("active", li.dataset.key === currentBudgetKey);
    });
}

// ================== Tabs Switching ==================
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));

    document.getElementById(tabName).classList.add('active');
    // add active class to clicked tab
    event.target.classList.add('active');

    if (tabName === 'accounts') updateAccountsDisplay();
    else if (tabName === 'reports') updateReportsDisplay();
}

// ================== Adders ==================
function addIncome() {
    const description = document.getElementById('incomeDesc').value;
    const amount = parseFloat(document.getElementById('incomeAmount').value);
    const date = document.getElementById('incomeDate').value;
    const location = document.getElementById('incomeLocation').value;

    if (description && amount > 0 && date) {
        const transaction = {
            id: Date.now(),
            type: 'income',
            description,
            amount,
            category: 'Income',
            date,
            location: location || 'Not specified',
            notes: ''
        };
        transactions.push(transaction);
        saveData();

        // clear
        document.getElementById('incomeDesc').value = '';
        document.getElementById('incomeAmount').value = '';
        document.getElementById('incomeLocation').value = '';

        updateDisplay();
    } else {
        alert('Please enter description, amount, and date!');
    }
}

function addExpense() {
    const description = document.getElementById('expenseDesc').value;
    const category = document.getElementById('expenseCategory').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const date = document.getElementById('expenseDate').value;
    const location = document.getElementById('expenseLocation').value;
    const notes = document.getElementById('expenseNotes').value;

    if (description && amount > 0 && date) {
        const transaction = {
            id: Date.now(),
            type: 'expense',
            description,
            amount,
            category,
            date,
            location: location || 'Not specified',
            notes: notes || ''
        };
        transactions.push(transaction);
        saveData();

        // clear
        document.getElementById('expenseDesc').value = '';
        document.getElementById('expenseAmount').value = '';
        document.getElementById('expenseLocation').value = '';
        document.getElementById('expenseNotes').value = '';

        updateDisplay();
    } else {
        alert('Please enter description, amount, and date!');
    }
}

function addAccount() {
    const name = document.getElementById('accountName').value;
    const type = document.getElementById('accountType').value;
    const amount = parseFloat(document.getElementById('accountAmount').value);

    if (name && !isNaN(amount)) {
        const idx = accounts.findIndex(acc => acc.name.toLowerCase() === name.toLowerCase());
        if (idx !== -1) {
            accounts[idx].amount = amount;
            accounts[idx].type = type;
        } else {
            accounts.push({ id: Date.now(), name, type, amount });
        }

        document.getElementById('accountName').value = '';
        document.getElementById('accountAmount').value = '';

        updateAccountsDisplay();
        updateDisplay();
        saveData();
    } else {
        alert('Please enter account name and amount!');
    }
}

// ================== Delete ==================
function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    updateDisplay();
    updateReportsDisplay();
    saveData();
}

function deleteAccount(id) {
    accounts = accounts.filter(a => a.id !== id);
    updateAccountsDisplay();
    updateDisplay();
    saveData();
}

// ================== UI Updates ==================
function updateDisplay() {
    let totalIncome = 0, totalExpenses = 0;

    transactions.forEach(t => t.type === 'income' ? totalIncome += t.amount : totalExpenses += t.amount);

    const netBalance = totalIncome - totalExpenses;
    const totalAccountBalance = accounts.reduce((sum, a) => sum + a.amount, 0);

    document.getElementById('totalIncome').textContent = '$' + totalIncome.toFixed(2);
    document.getElementById('totalExpenses').textContent = '$' + totalExpenses.toFixed(2);
    document.getElementById('netBalance').textContent = '$' + netBalance.toFixed(2);

    const balanceCheck = totalAccountBalance - netBalance;
    document.getElementById('balanceCheck').textContent = '$' + balanceCheck.toFixed(2);

    const status = document.getElementById('balanceStatus');
    if (Math.abs(balanceCheck) < 0.01) {
        status.textContent = 'Perfect Balance! ✅';
        status.style.color = '#28a745';
    } else {
        status.textContent = `Difference: $${Math.abs(balanceCheck).toFixed(2)} ${balanceCheck > 0 ? 'extra' : 'missing'} 🔍`;
        status.style.color = '#dc3545';
    }

    updateTransactionsList();
}

function updateAccountsDisplay() {
    const totalAccountBalance = accounts.reduce((sum, a) => sum + a.amount, 0);
    document.getElementById('totalAccounts').textContent = '$' + totalAccountBalance.toFixed(2);

    let totalIncome = 0, totalExpenses = 0;
    transactions.forEach(t => t.type === 'income' ? totalIncome += t.amount : totalExpenses += t.amount);
    const netBalance = totalIncome - totalExpenses;

    const balanceCheck = totalAccountBalance - netBalance;
    document.getElementById('balanceCheckAccounts').textContent = '$' + balanceCheck.toFixed(2);

    const list = document.getElementById('accountsList');
    if (accounts.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:#6c757d; padding:20px;">No accounts added yet. Start by adding your cash and bank accounts!</p>';
        return;
    }

    list.innerHTML = '';
    accounts.forEach(account => {
        const item = document.createElement('div');
        item.className = 'account-item';
        item.innerHTML = `
      <div class="account-details">
        <div class="account-name">${account.name}</div>
        <div class="account-type">${account.type}</div>
      </div>
      <div>
        <span class="account-amount cash-amount">$${account.amount.toFixed(2)}</span>
        <button class="delete-btn" onclick="deleteAccount(${account.id})">×</button>
      </div>
    `;
        list.appendChild(item);
    });
}

function updateTransactionsList() {
    const list = document.getElementById('transactionsList');
    if (transactions.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:#6c757d; padding:20px;">No transactions yet. Start by adding some income or expenses!</p>';
        return;
    }

    const sorted = transactions.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    list.innerHTML = '';
    sorted.forEach(t => {
        const item = document.createElement('div');
        item.className = 'transaction-item';
        const amountClass = t.type === 'income' ? 'income-amount' : 'expense-amount';
        const prefix = t.type === 'income' ? '+' : '-';

        item.innerHTML = `
      <div class="transaction-details">
        <div class="transaction-description">${t.description}</div>
        <div class="transaction-category">${t.category} • ${new Date(t.date).toLocaleDateString()}</div>
      </div>
      <div>
        <span class="transaction-amount ${amountClass}">${prefix}$${t.amount.toFixed(2)}</span>
        <button class="delete-btn" onclick="deleteTransaction(${t.id})">×</button>
      </div>
    `;
        list.appendChild(item);
    });
}

function updateReportsDisplay() { applyFilters(); }

function applyFilters() {
    const startDate = document.getElementById('filterStartDate').value;
    const endDate = document.getElementById('filterEndDate').value;
    const category = document.getElementById('filterCategory').value;

    let filtered = transactions.slice();
    if (startDate) filtered = filtered.filter(t => t.date >= startDate);
    if (endDate) filtered = filtered.filter(t => t.date <= endDate);
    if (category) filtered = filtered.filter(t => t.category === category);

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    const list = document.getElementById('reportsList');
    if (filtered.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:#6c757d; padding:20px;">No transactions match the selected filters.</p>';
        return;
    }

    list.innerHTML = '';
    filtered.forEach(t => {
        const amountClass = t.type === 'income' ? 'income-amount' : 'expense-amount';
        const prefix = t.type === 'income' ? '+' : '-';
        const item = document.createElement('div');
        item.className = 'report-item';
        item.innerHTML = `
      <div class="report-header">
        <div class="report-description">${t.description}</div>
        <span class="report-amount ${amountClass}">${prefix}${t.amount.toFixed(2)}</span>
      </div>
      <div class="report-details-grid">
        <div><strong>Date:</strong> ${new Date(t.date).toLocaleDateString()}</div>
        <div><strong>Category:</strong> ${t.category}</div>
        <div><strong>Location:</strong> ${t.location}</div>
        <div><strong>Type:</strong> ${t.type.charAt(0).toUpperCase() + t.type.slice(1)}</div>
        ${t.notes ? `<div class="report-notes"><strong>Notes:</strong> ${t.notes}</div>` : ''}
      </div>
    `;
        list.appendChild(item);
    });
}

// ================== Wire up buttons & Init ==================
document.getElementById("addBudgetBtn").addEventListener("click", addBudget);

// Toggle collapsed/open on the sidebar itself (handle stays visible when collapsed)
document.getElementById("sidebarToggle").addEventListener("click", () => {
    document.getElementById("sidebar").classList.toggle("collapsed");
});

document.getElementById("toggleEditBtn").addEventListener("click", () => {
    editMode = !editMode;
    renderSidebar();
    document.getElementById("toggleEditBtn").textContent = editMode ? "✅ Done" : "✏️ Edit Tabs";
});

// ================== Add modal save + cancel wiring ==================
document.getElementById("saveSheetBtn").addEventListener("click", () => {
    if (!editingBudgetKey) return;

    const newName = document.getElementById("sheetName").value.trim();
    const newColor = selectedColor;

    if (!newName) {
        alert("Please enter a name.");
        return;
    }

    // Prevent duplicate names
    if (Object.values(budgets).some(b => b.name.toLowerCase() === newName.toLowerCase() && b !== budgets[editingBudgetKey])) {
        alert("Sheet name already exists!");
        return;
    }

    budgets[editingBudgetKey].name = newName;
    budgets[editingBudgetKey].color = newColor;

    saveData();
    renderSidebar();

    // load the new sheet immediately
    loadBudget(editingBudgetKey);

    closeSheetModal();
});

document.getElementById("cancelSheetBtn").addEventListener("click", closeSheetModal);


// ================== Delete Modal GUI ==================

document.getElementById("confirmDeleteBtn").addEventListener("click", () => {
  if (!pendingDeleteKey) return;

  delete budgets[pendingDeleteKey];
  localStorage.setItem("budgets", JSON.stringify(budgets));

  const firstKey = Object.keys(budgets)[0];
  if (firstKey) {
    loadBudget(firstKey);
  } else {
    loadBudget(null);
  }

  renderSidebar();
  pendingDeleteKey = null;
  document.getElementById("deleteModal").classList.add("hidden");
});

document.getElementById("cancelDeleteBtn").addEventListener("click", () => {
  pendingDeleteKey = null;
  document.getElementById("deleteModal").classList.add("hidden");
});

renderSidebar();
loadBudget(currentBudgetKey);
