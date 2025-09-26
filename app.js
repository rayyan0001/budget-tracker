// Data storage
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let accounts = JSON.parse(localStorage.getItem("accounts")) || [];
let budgets = JSON.parse(localStorage.getItem("budgets")) || {
  "budget_1": { name: "New Sheet 1", transactions: [], accounts: [] }
};
let currentBudgetKey = "budget_1";

// Initialize dates to today
document.getElementById('incomeDate').value = new Date().toISOString().split('T')[0];
document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];

// Write into current budget sheet instead of global
function saveData() {
  budgets[currentBudgetKey].transactions = transactions;
  budgets[currentBudgetKey].accounts = accounts;
  localStorage.setItem("budgets", JSON.stringify(budgets));
}

// Whenever switching budget sheets, load from it
function loadBudget(key) {
  currentBudgetKey = key;
  transactions = budgets[key].transactions || [];
  accounts = budgets[key].accounts || [];
  updateDisplay();
  updateAccountsDisplay();
}

// Add new sheet (current local max set to 5)
function addBudget() {
  if (Object.keys(budgets).length >= 5) {
    alert("Maximum of 5 budgets reached.");
    return;
  }
  let newKey = "budget_" + Date.now();
  budgets[newKey] = { name: "New Sheet", transactions: [], accounts: [] };
  saveData();
  renderSidebar();
  loadBudget(newKey);
}

// Refresh the sidebar
function renderSidebar() {
  const list = document.getElementById("budgetTabs");
  list.innerHTML = "";
  for (let key in budgets) {
    let li = document.createElement("li");
    li.textContent = budgets[key].name;

    if (key === currentBudgetKey) li.classList.add("active");
    li.onclick = () => loadBudget(key);

    // Add rename button
    let renameBtn = document.createElement("button");
    renameBtn.textContent = "✏️";
    renameBtn.style.marginLeft = "10px";
    renameBtn.onclick = (e) => {
      e.stopPropagation(); // don’t trigger loadBudget
      let newName = prompt("Enter new name:", budgets[key].name);
      if (newName) {
        budgets[key].name = newName;
        saveData();
        renderSidebar();
      }
    };

    li.appendChild(renameBtn);
    list.appendChild(li);
  }
}

// Tab switching
function switchTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab content
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked tab
    event.target.classList.add('active');
    
    // Update displays
    if (tabName === 'accounts') {
        updateAccountsDisplay();
    } else if (tabName === 'reports') {
        updateReportsDisplay();
    }
}

// Add income function
function addIncome() {
    const description = document.getElementById('incomeDesc').value;
    const amount = parseFloat(document.getElementById('incomeAmount').value);
    const date = document.getElementById('incomeDate').value;
    const location = document.getElementById('incomeLocation').value;
    
    if (description && amount > 0 && date) {
        const transaction = {
            id: Date.now(),
            type: 'income',
            description: description,
            amount: amount,
            category: 'Income',
            date: date,
            location: location || 'Not specified',
            notes: ''
        };
        
        transactions.push(transaction);
        saveData();

        // Clear fields
        document.getElementById('incomeDesc').value = '';
        document.getElementById('incomeAmount').value = '';
        document.getElementById('incomeLocation').value = '';
        
        updateDisplay();
    } else {
        alert('Please enter description, amount, and date!');
    }
}

// Add expense function
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
            description: description,
            amount: amount,
            category: category,
            date: date,
            location: location || 'Not specified',
            notes: notes || ''
        };
        
        transactions.push(transaction);
        saveData();
        
        // Clear fields
        document.getElementById('expenseDesc').value = '';
        document.getElementById('expenseAmount').value = '';
        document.getElementById('expenseLocation').value = '';
        document.getElementById('expenseNotes').value = '';
        
        updateDisplay();
    } else {
        alert('Please enter description, amount, and date!');
    }
}

// Add/Update account function
function addAccount() {
    const name = document.getElementById('accountName').value;
    const type = document.getElementById('accountType').value;
    const amount = parseFloat(document.getElementById('accountAmount').value);
    
    if (name && !isNaN(amount)) {
        // Check if account already exists
        const existingIndex = accounts.findIndex(acc => acc.name.toLowerCase() === name.toLowerCase());
        
        if (existingIndex !== -1) {
            // Update existing account
            accounts[existingIndex].amount = amount;
            accounts[existingIndex].type = type;
        } else {
            // Add new account
            const account = {
                id: Date.now(),
                name: name,
                type: type,
                amount: amount
            };
            accounts.push(account);
        }
        
        // Clear fields
        document.getElementById('accountName').value = '';
        document.getElementById('accountAmount').value = '';
        
        updateAccountsDisplay();
        updateDisplay(); // Update balance check
        saveData();

    } else {
        alert('Please enter account name and amount!');
    }
}

// Delete functions
function deleteTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);
    updateDisplay();
    updateReportsDisplay();
    saveData();
}

function deleteAccount(id) {
    accounts = accounts.filter(account => account.id !== id);
    updateAccountsDisplay();
    updateDisplay();
    saveData();
}

// Update main display
function updateDisplay() {
    let totalIncome = 0;
    let totalExpenses = 0;
    
    transactions.forEach(transaction => {
        if (transaction.type === 'income') {
            totalIncome += transaction.amount;
        } else {
            totalExpenses += transaction.amount;
        }
    });
    
    const netBalance = totalIncome - totalExpenses;
    
    // Calculate total from accounts
    const totalAccountBalance = accounts.reduce((sum, account) => sum + account.amount, 0);
    
    // Update displays
    document.getElementById('totalIncome').textContent = '$' + totalIncome.toFixed(2);
    document.getElementById('totalExpenses').textContent = '$' + totalExpenses.toFixed(2);
    document.getElementById('netBalance').textContent = '$' + netBalance.toFixed(2);
    
    // Balance check: Compare calculated balance with actual account balances
    const balanceCheck = totalAccountBalance - netBalance;
    document.getElementById('balanceCheck').textContent = '$' + balanceCheck.toFixed(2);
    
    const balanceStatusElement = document.getElementById('balanceStatus');
    if (Math.abs(balanceCheck) < 0.01) { // Account for floating point precision
        balanceStatusElement.textContent = 'Perfect Balance! ✅';
        balanceStatusElement.style.color = '#28a745';
    } else {
        balanceStatusElement.textContent = `Difference: $${Math.abs(balanceCheck).toFixed(2)} ${balanceCheck > 0 ? 'extra' : 'missing'} 🔍`;
        balanceStatusElement.style.color = '#dc3545';
    }
    
    updateTransactionsList();
}

// Update accounts display
function updateAccountsDisplay() {
    const totalAccountBalance = accounts.reduce((sum, account) => sum + account.amount, 0);
    document.getElementById('totalAccounts').textContent = '$' + totalAccountBalance.toFixed(2);
    
    // Balance check for accounts tab
    let totalIncome = 0;
    let totalExpenses = 0;
    transactions.forEach(transaction => {
        if (transaction.type === 'income') {
            totalIncome += transaction.amount;
        } else {
            totalExpenses += transaction.amount;
        }
    });
    const netBalance = totalIncome - totalExpenses;
    const balanceCheck = totalAccountBalance - netBalance;
    document.getElementById('balanceCheckAccounts').textContent = '$' + balanceCheck.toFixed(2);
    
    // Update accounts list
    const listElement = document.getElementById('accountsList');
    
    if (accounts.length === 0) {
        listElement.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">No accounts added yet. Start by adding your cash and bank accounts!</p>';
        return;
    }
    
    listElement.innerHTML = '';
    
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
        
        listElement.appendChild(item);
    });
}

// Update transactions list
function updateTransactionsList() {
    const listElement = document.getElementById('transactionsList');
    
    if (transactions.length === 0) {
        listElement.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">No transactions yet. Start by adding some income or expenses!</p>';
        return;
    }
    
    const sortedTransactions = transactions.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    listElement.innerHTML = '';
    
    sortedTransactions.forEach(transaction => {
        const item = document.createElement('div');
        item.className = 'transaction-item';
        
        const amountClass = transaction.type === 'income' ? 'income-amount' : 'expense-amount';
        const amountPrefix = transaction.type === 'income' ? '+' : '-';
        
        item.innerHTML = `
            <div class="transaction-details">
                <div class="transaction-description">${transaction.description}</div>
                <div class="transaction-category">${transaction.category} • ${new Date(transaction.date).toLocaleDateString()}</div>
            </div>
            <div>
                <span class="transaction-amount ${amountClass}">${amountPrefix}$${transaction.amount.toFixed(2)}</span>
                <button class="delete-btn" onclick="deleteTransaction(${transaction.id})">×</button>
            </div>
        `;
        
        listElement.appendChild(item);
    });
}

// Update reports display
function updateReportsDisplay() {
    applyFilters(); // Apply current filters when switching to reports tab
}

// Apply filters to reports
function applyFilters() {
    const startDate = document.getElementById('filterStartDate').value;
    const endDate = document.getElementById('filterEndDate').value;
    const category = document.getElementById('filterCategory').value;
    
    let filteredTransactions = transactions.slice();
    
    // Apply date filters
    if (startDate) {
        filteredTransactions = filteredTransactions.filter(t => t.date >= startDate);
    }
    if (endDate) {
        filteredTransactions = filteredTransactions.filter(t => t.date <= endDate);
    }
    
    // Apply category filter
    if (category) {
        filteredTransactions = filteredTransactions.filter(t => t.category === category);
    }
    
    // Sort by date (newest first)
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const listElement = document.getElementById('reportsList');
    
    if (filteredTransactions.length === 0) {
        listElement.innerHTML = '<p style="text-align: center; color: #6c757d; padding: 20px;">No transactions match the selected filters.</p>';
        return;
    }
    
    listElement.innerHTML = '';
    
    filteredTransactions.forEach(transaction => {
        const item = document.createElement('div');
        item.className = 'report-item';
        
        const amountClass = transaction.type === 'income' ? 'income-amount' : 'expense-amount';
        const amountPrefix = transaction.type === 'income' ? '+' : '-';
        
        item.innerHTML = `
            <div class="report-header">
                <div class="report-description">${transaction.description}</div>
                <span class="report-amount ${amountClass}">${amountPrefix}${transaction.amount.toFixed(2)}</span>
            </div>
            <div class="report-details-grid">
                <div><strong>Date:</strong> ${new Date(transaction.date).toLocaleDateString()}</div>
                <div><strong>Category:</strong> ${transaction.category}</div>
                <div><strong>Location:</strong> ${transaction.location}</div>
                <div><strong>Type:</strong> ${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</div>
                ${transaction.notes ? `<div class="report-notes"><strong>Notes:</strong> ${transaction.notes}</div>` : ''}
            </div>
        `;
        
        listElement.appendChild(item);
    });
}

document.getElementById("addBudgetBtn").addEventListener("click", addBudget);

document.getElementById("toggleSidebar").addEventListener("click", () => {
  document.getElementById("sidebar").classList.toggle("active");
});

// Initialize the app
renderSidebar();
loadBudget(currentBudgetKey)
