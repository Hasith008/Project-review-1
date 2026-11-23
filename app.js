/* =====================================================
   EXPENSE TRACKER — Main Application Logic
   ===================================================== */

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASS  = 'admin123';

const PAYMENT_METHODS = ['Cash', 'Bank', 'Net Banking', 'Credit Card', 'UPI'];

// ---------- Utilities ----------
function formatINR(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}

function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function showToast(msg, type = 'success') {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 2800);
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function methodIcon(method) {
  const map = {
    'Cash': '💵',
    'Bank': '🏦',
    'Net Banking': '💻',
    'Credit Card': '💳',
    'UPI': '📱'
  };
  return map[method] || '💰';
}

// ---------- Auth Guards ----------
function requireUser() {
  const email = Storage.getCurrentUser();
  if (!email) {
    window.location.href = 'index.html';
    return null;
  }
  const user = Storage.findUserByEmail(email);
  if (!user) {
    Storage.clearCurrentUser();
    window.location.href = 'index.html';
    return null;
  }
  return user;
}

function requireAdmin() {
  if (!Storage.isAdminLoggedIn()) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

// ---------- Page: Signup ----------
function initSignup() {
  const form = document.getElementById('signupForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('suName').value.trim();
    const email = document.getElementById('suEmail').value.trim();
    const pass = document.getElementById('suPass').value;
    const errEl = document.getElementById('suError');

    errEl.classList.remove('show');
    errEl.textContent = '';

    if (!name || !email || !pass) {
      errEl.textContent = 'All fields are required.';
      errEl.classList.add('show');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errEl.textContent = 'Please enter a valid email address.';
      errEl.classList.add('show');
      return;
    }
    if (pass.length < 4) {
      errEl.textContent = 'Password must be at least 4 characters.';
      errEl.classList.add('show');
      return;
    }
    if (Storage.emailExists(email)) {
      errEl.textContent = 'Email already exists! Please use another email.';
      errEl.classList.add('show');
      return;
    }

    Storage.addUser({ name, email: email.toLowerCase(), password: pass, createdAt: new Date().toISOString() });
    showToast('Account created successfully! Please sign in.');
    setTimeout(() => { window.location.href = 'index.html'; }, 900);
  });
}

// ---------- Page: Login ----------
function initLogin() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('liEmail').value.trim();
    const pass = document.getElementById('liPass').value;
    const errEl = document.getElementById('liError');

    errEl.classList.remove('show');
    errEl.textContent = '';

    if (email.toLowerCase() === ADMIN_EMAIL && pass === ADMIN_PASS) {
      Storage.setAdminLoggedIn(true);
      Storage.clearCurrentUser();
      window.location.href = 'admin.html';
      return;
    }

    const user = Storage.findUserByEmail(email);
    if (!user || user.password !== pass) {
      errEl.textContent = 'Invalid email or password.';
      errEl.classList.add('show');
      return;
    }

    Storage.setCurrentUser(user.email);
    Storage.clearAdmin();
    window.location.href = 'dashboard.html';
  });

  const adminLink = document.getElementById('adminLoginLink');
  if (adminLink) {
    adminLink.addEventListener('click', () => {
      document.getElementById('liEmail').value = ADMIN_EMAIL;
      document.getElementById('liPass').value = '';
      document.getElementById('liPass').focus();
      showToast('Enter admin password to continue', 'success');
    });
  }
}

// ---------- Shared Sidebar + Topbar ----------
function renderSidebar(activePage, user) {
  const isAdmin = Storage.isAdminLoggedIn();

  return `
  <aside class="sidebar">
    <div class="sidebar-logo">
      <div class="logo-badge">ET</div>
      <span class="brand">Expense Tracker</span>
    </div>
    <nav class="sidebar-nav">
      <a class="nav-item ${activePage === 'overview' ? 'active' : ''}" href="${isAdmin ? 'admin.html' : 'dashboard.html'}">
        <span class="icon">⌂</span> <span>Overview</span>
      </a>
      ${!isAdmin ? `
      <a class="nav-item ${activePage === 'income' ? 'active' : ''}" href="income.html">
        <span class="icon">+</span> <span>Income</span>
      </a>
      <a class="nav-item ${activePage === 'expenses' ? 'active' : ''}" href="expenses.html">
        <span class="icon">−</span> <span>Expenses</span>
      </a>
      <a class="nav-item ${activePage === 'transactions' ? 'active' : ''}" href="transactions.html">
        <span class="icon">☰</span> <span>Transactions</span>
      </a>
      <a class="nav-item ${activePage === 'profile' ? 'active' : ''}" href="profile.html">
        <span class="icon">○</span> <span>Profile</span>
      </a>
      ` : ''}
    </nav>
    <div class="sidebar-bottom">
      <div class="sidebar-tip">
        <h4>Stay on track</h4>
        <p>Small habits make a big difference.</p>
      </div>
      <button class="logout-btn" onclick="doLogout()">
        <span>↩</span> <span>Log out</span>
      </button>
    </div>
  </aside>`;
}

function renderTopbar(user, title) {
  const isAdmin = Storage.isAdminLoggedIn();
  const name = isAdmin ? 'Admin' : (user?.name || 'User');
  const initial = isAdmin ? 'A' : getInitials(name);
  const greet = greeting();

  return `
  <div class="topbar">
    <div class="topbar-left">
      <div class="eyebrow">PERSONAL FINANCE</div>
      <h1>${title || (greet + ', ' + name.split(' ')[0])}</h1>
    </div>
    <div class="topbar-right">
      <button class="icon-btn" title="Notifications">☁</button>
      <div class="user-chip">
        <div class="user-avatar">${initial}</div>
        <span>${name.split(' ')[0]}</span>
      </div>
    </div>
  </div>`;
}

function doLogout() {
  Storage.clearCurrentUser();
  Storage.clearAdmin();
  window.location.href = 'index.html';
}

// ---------- Dashboard (Overview) ----------
function initDashboard() {
  const user = requireUser();
  if (!user) return;

  document.getElementById('sidebarMount').innerHTML = renderSidebar('overview', user);
  document.getElementById('topbarMount').innerHTML = renderTopbar(user);

  const totals = Storage.getTotals(user.email);
  const txs = Storage.getTransactions(user.email);

  document.getElementById('totalBalance').textContent = formatINR(totals.balance);
  document.getElementById('totalIncome').textContent = formatINR(totals.income);
  document.getElementById('totalExpense').textContent = formatINR(totals.expense);

  const list = document.getElementById('recentList');
  if (txs.length === 0) {
    list.innerHTML = `<div class="empty-state"><div class="icon">📋</div><h3>No transactions yet</h3><p>Add income or expenses to get started.</p></div>`;
  } else {
    list.innerHTML = txs.slice(0, 6).map(t => `
      <div class="activity-item">
        <div class="activity-icon ${t.type}">${t.type === 'income' ? '↑' : '↓'}</div>
        <div class="activity-info">
          <h4>${t.note || t.category}</h4>
          <p>${t.category} · ${methodIcon(t.method)} ${t.method || '—'} · ${formatDate(t.date)}</p>
        </div>
        <div class="activity-amount ${t.type}">${t.type === 'income' ? '+' : '−'}${formatINR(t.amount)}</div>
      </div>
    `).join('');
  }
}

// ---------- Income Page ----------
function initIncome() {
  const user = requireUser();
  if (!user) return;

  document.getElementById('sidebarMount').innerHTML = renderSidebar('income', user);
  document.getElementById('topbarMount').innerHTML = renderTopbar(user);

  const form = document.getElementById('incomeForm');
  document.getElementById('incDate').value = todayISO();

  const catSelect = document.getElementById('incCategory');
  ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'].forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    catSelect.appendChild(opt);
  });

  const methodSelect = document.getElementById('incMethod');
  PAYMENT_METHODS.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    methodSelect.appendChild(opt);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('incAmount').value);
    const category = document.getElementById('incCategory').value;
    const method = document.getElementById('incMethod').value;
    const note = document.getElementById('incNote').value.trim();
    const date = document.getElementById('incDate').value;

    if (!amount || amount <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    Storage.addTransaction(user.email, {
      type: 'income',
      amount,
      category,
      method,
      note: note || category,
      date
    });

    showToast('Income recorded successfully!');
    form.reset();
    document.getElementById('incDate').value = todayISO();
  });
}

// ---------- Expenses Page ----------
function initExpenses() {
  const user = requireUser();
  if (!user) return;

  document.getElementById('sidebarMount').innerHTML = renderSidebar('expenses', user);
  document.getElementById('topbarMount').innerHTML = renderTopbar(user);

  const form = document.getElementById('expenseForm');
  document.getElementById('expDate').value = todayISO();

  const catSelect = document.getElementById('expCategory');
  ['Food', 'Travel', 'Bills', 'Education', 'Shopping', 'Other'].forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    catSelect.appendChild(opt);
  });

  const methodSelect = document.getElementById('expMethod');
  PAYMENT_METHODS.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    methodSelect.appendChild(opt);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('expAmount').value);
    const category = document.getElementById('expCategory').value;
    const method = document.getElementById('expMethod').value;
    const note = document.getElementById('expNote').value.trim();
    const date = document.getElementById('expDate').value;

    if (!amount || amount <= 0) {
      showToast('Please enter a valid amount', 'error');
      return;
    }

    Storage.addTransaction(user.email, {
      type: 'expense',
      amount,
      category,
      method,
      note: note || category,
      date
    });

    showToast('Expense saved successfully!');
    form.reset();
    document.getElementById('expDate').value = todayISO();
  });
}

// ---------- Transactions Page ----------
function initTransactions() {
  const user = requireUser();
  if (!user) return;

  document.getElementById('sidebarMount').innerHTML = renderSidebar('transactions', user);
  document.getElementById('topbarMount').innerHTML = renderTopbar(user, 'Transactions');

  let currentFilter = 'all';
  let currentMethod = 'all';

  function renderTable() {
    let txs = Storage.getTransactions(user.email);
    if (currentFilter === 'income') txs = txs.filter(t => t.type === 'income');
    if (currentFilter === 'expense') txs = txs.filter(t => t.type === 'expense');
    if (currentMethod !== 'all') txs = txs.filter(t => t.method === currentMethod);

    const tbody = document.getElementById('txBody');
    if (txs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="icon">📋</div><h3>No records found</h3><p>Try a different filter or add a transaction.</p></div></td></tr>`;
      return;
    }

    tbody.innerHTML = txs.map(t => `
      <tr>
        <td>${formatDate(t.date)}</td>
        <td><span class="type-badge ${t.type}">${t.type}</span></td>
        <td>${t.category}</td>
        <td><span class="method-badge">${methodIcon(t.method)} ${t.method || '—'}</span></td>
        <td>${t.note || '—'}</td>
        <td class="activity-amount ${t.type}">${t.type === 'income' ? '+' : '−'}${formatINR(t.amount)}</td>
        <td><button class="delete-btn" onclick="deleteTx('${t.id}')">Delete</button></td>
      </tr>
    `).join('');
  }

  window.deleteTx = function(id) {
    if (!confirm('Delete this transaction?')) return;
    Storage.deleteTransaction(user.email, id);
    showToast('Transaction deleted');
    renderTable();
  };

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn[data-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderTable();
    });
  });

  document.querySelectorAll('.method-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.method-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMethod = btn.dataset.method;
      renderTable();
    });
  });

  renderTable();
}

// ---------- Profile Page ----------
function initProfile() {
  const user = requireUser();
  if (!user) return;

  document.getElementById('sidebarMount').innerHTML = renderSidebar('profile', user);
  document.getElementById('topbarMount').innerHTML = renderTopbar(user, 'My Profile');

  const totals = Storage.getTotals(user.email);
  const txs = Storage.getTransactions(user.email);

  document.getElementById('profileAvatar').textContent = getInitials(user.name);
  document.getElementById('profileName').textContent = user.name;
  document.getElementById('profileEmail').textContent = user.email;
  document.getElementById('pfName').textContent = user.name;
  document.getElementById('pfEmail').textContent = user.email;
  document.getElementById('pfJoined').textContent = formatDate(user.createdAt);
  document.getElementById('pfTxCount').textContent = txs.length;
  document.getElementById('pfBalance').textContent = formatINR(totals.balance);
}

// ---------- Admin Page ----------
function initAdmin() {
  if (!requireAdmin()) return;

  document.getElementById('sidebarMount').innerHTML = renderSidebar('overview', null);
  document.getElementById('topbarMount').innerHTML = renderTopbar(null, 'Good morning');

  const stats = Storage.getGlobalStats();
  document.getElementById('admUsers').textContent = stats.userCount;
  document.getElementById('admTx').textContent = stats.txCount;
  document.getElementById('admIncome').textContent = formatINR(stats.totalIncome);
  document.getElementById('admExpense').textContent = formatINR(stats.totalExpense);

  const users = Storage.getUsers();
  const tbody = document.getElementById('usersBody');

  if (users.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state"><h3>No registered users yet</h3></div></td></tr>`;
  } else {
    tbody.innerHTML = users.map(u => {
      const count = Storage.getTransactions(u.email).length;
      return `
        <tr>
          <td><strong>${u.name}</strong></td>
          <td>${u.email}</td>
          <td>${count} records</td>
          <td><button class="delete-btn" onclick="deleteUser('${u.email}')">Delete</button></td>
        </tr>`;
    }).join('');
  }

  window.deleteUser = function(email) {
    if (!confirm(`Delete user ${email} and all their data?`)) return;
    Storage.deleteUser(email);
    showToast('User deleted');
    initAdmin();
  };
}

// ---------- Auto-init based on page ----------
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  switch (page) {
    case 'login':   initLogin(); break;
    case 'signup':  initSignup(); break;
    case 'dashboard': initDashboard(); break;
    case 'income':  initIncome(); break;
    case 'expenses': initExpenses(); break;
    case 'transactions': initTransactions(); break;
    case 'profile': initProfile(); break;
    case 'admin':   initAdmin(); break;
  }
});