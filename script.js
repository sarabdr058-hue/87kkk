// script.js
// ==================== 1. نظام الحماية (تسجيل الدخول) ====================
const correctPIN = "1234";

function checkPIN() {
    const pin = document.getElementById('pin-input').value;
    if (pin === correctPIN) {
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('app-screen').classList.add('active');
        loadDashboardData();
        updateDebtsUI();
        loadAllLists();
        Swal.fire({
            icon: 'success',
            title: 'أهلاً بك في شهد روز!',
            showConfirmButton: false,
            timer: 1500
        });
    } else {
        Swal.fire({
            icon: 'error',
            title: 'خطأ',
            text: 'رمز PIN غير صحيح!',
            confirmButtonColor: '#f28cae'
        });
    }
}

function logout() {
    document.getElementById('app-screen').classList.remove('active');
    document.getElementById('login-screen').classList.add('active');
    document.getElementById('pin-input').value = "";
}

// ==================== 2. التنقل بين الأقسام ====================
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');

    if(tabId === 'dashboard') {
        loadDashboardData();
    } else if (tabId === 'comparison') {
        compareDebts();
    }
}

// ==================== 3. لوحة القيادة والحسابات ====================
function loadDashboardData() {
    let sales = parseFloat(localStorage.getItem('totalSales') || 0);
    let purchases = parseFloat(localStorage.getItem('totalPurchases') || 0);
    let expenses = parseFloat(localStorage.getItem('totalExpenses') || 0);

    let profit = sales - (purchases + expenses);
    let profitMargin = sales > 0 ? ((profit / sales) * 100).toFixed(1) : 0;

    document.getElementById('monthly-sales').innerText = sales.toLocaleString() + ' IQD';
    document.getElementById('monthly-purchases').innerText = purchases.toLocaleString() + ' IQD';
    document.getElementById('daily-expense').innerText = expenses.toLocaleString() + ' IQD';
    
    let marginElement = document.getElementById('profit-margin');
    marginElement.innerText = profitMargin + '%';

    if (profitMargin < 25 && sales > 0) {
        marginElement.style.color = 'red';
    } else {
        marginElement.style.color = '#f28cae';
    }
}

// ==================== التعديلات المطلوبة (الدائن والمدين والمصروفات والمبيعات) ====================

function loadAllLists() {
    renderCreditors();
    renderDebtors();
    renderExpenses();
    renderDailySales();
}

function saveCreditor() {
    let name = document.getElementById('cred-name').value;
    let phone = document.getElementById('cred-phone').value;
    let address = document.getElementById('cred-address').value;
    let amount = parseFloat(document.getElementById('creditor-amount').value) || 0;
    let details = document.getElementById('cred-details').value;
    let date = document.getElementById('cred-date').value;

    if (!name && amount === 0) return alertError('الرجاء إدخال البيانات المطلوبة');

    let total = parseFloat(localStorage.getItem('totalCreditor') || 0) + amount;
    localStorage.setItem('totalCreditor', total);

    let list = JSON.parse(localStorage.getItem('creditorsList') || '[]');
    list.push({ name, phone, address, amount, details, date });
    localStorage.setItem('creditorsList', JSON.stringify(list));

    updateDebtsUI();
    renderCreditors();

    document.getElementById('cred-name').value = '';
    document.getElementById('cred-phone').value = '';
    document.getElementById('cred-address').value = '';
    document.getElementById('creditor-amount').value = '';
    document.getElementById('cred-details').value = '';
    document.getElementById('cred-date').value = '';

    alertSuccess('تم حفظ الدائن وتصفير الحقول');
}

function renderCreditors() {
    let list = JSON.parse(localStorage.getItem('creditorsList') || '[]');
    let container = document.getElementById('creditor-list');
    container.innerHTML = '';
    list.forEach(item => {
        container.innerHTML += `
            <div class="list-item">
                <p><strong>الاسم:</strong> ${item.name}</p>
                <p><strong>المبلغ:</strong> ${item.amount} IQD</p>
                <p><strong>التاريخ:</strong> ${item.date}</p>
                <p><strong>التفاصيل:</strong> ${item.details}</p>
            </div>
        `;
    });
}

function saveDebtor() {
    let name = document.getElementById('debt-name').value;
    let phone = document.getElementById('debt-phone').value;
    let address = document.getElementById('debt-address').value;
    let amount = parseFloat(document.getElementById('debtor-amount').value) || 0;
    let details = document.getElementById('debt-details').value;
    let date = document.getElementById('debt-date').value;

    if (!name && amount === 0) return alertError('الرجاء إدخال البيانات المطلوبة');

    let total = parseFloat(localStorage.getItem('totalDebtor') || 0) + amount;
    localStorage.setItem('totalDebtor', total);

    let list = JSON.parse(localStorage.getItem('debtorsList') || '[]');
    list.push({ name, phone, address, amount, details, date });
    localStorage.setItem('debtorsList', JSON.stringify(list));

    updateDebtsUI();
    renderDebtors();

    document.getElementById('debt-name').value = '';
    document.getElementById('debt-phone').value = '';
    document.getElementById('debt-address').value = '';
    document.getElementById('debtor-amount').value = '';
    document.getElementById('debt-details').value = '';
    document.getElementById('debt-date').value = '';

    alertSuccess('تم حفظ المدين وتصفير الحقول');
}

function renderDebtors() {
    let list = JSON.parse(localStorage.getItem('debtorsList') || '[]');
    let container = document.getElementById('debtor-list');
    container.innerHTML = '';
    list.forEach(item => {
        container.innerHTML += `
            <div class="list-item">
                <p><strong>الاسم:</strong> ${item.name}</p>
                <p><strong>المبلغ:</strong> ${item.amount} IQD</p>
                <p><strong>التاريخ:</strong> ${item.date}</p>
                <p><strong>التفاصيل:</strong> ${item.details}</p>
            </div>
        `;
    });
}

function saveExpense() {
    let type = document.getElementById('exp-type').value;
    let amount = parseFloat(document.getElementById('exp-amount').value) || 0;
    let date = document.getElementById('exp-date').value;
    let notes = document.getElementById('exp-notes').value;
    let method = document.getElementById('exp-method').value;

    if (!type && amount === 0) return alertError('الرجاء إدخال البيانات المطلوبة');

    let list = JSON.parse(localStorage.getItem('expensesList') || '[]');
    list.push({ type, amount, date, notes, method });
    localStorage.setItem('expensesList', JSON.stringify(list));

    let totalExp = parseFloat(localStorage.getItem('totalExpenses') || 0) + amount;
    localStorage.setItem('totalExpenses', totalExp);

    renderExpenses();

    document.getElementById('exp-type').value = '';
    document.getElementById('exp-amount').value = '';
    document.getElementById('exp-date').value = '';
    document.getElementById('exp-notes').value = '';
    document.getElementById('exp-method').value = '';

    alertSuccess('تم حفظ المصروف وتصفير الحقول');
}

function renderExpenses() {
    let list = JSON.parse(localStorage.getItem('expensesList') || '[]');
    let container = document.getElementById('expenses-list');
    container.innerHTML = '';
    list.forEach(item => {
        container.innerHTML += `
            <div class="list-item">
                <p><strong>الصنف:</strong> ${item.type}</p>
                <p><strong>المبلغ:</strong> ${item.amount} IQD</p>
                <p><strong>التاريخ:</strong> ${item.date}</p>
                <p><strong>ملاحظات:</strong> ${item.notes}</p>
                <p><strong>طريقة الدفع:</strong> ${item.method}</p>
            </div>
        `;
    });
}

function updateDebtsUI() {
    let cred = parseFloat(localStorage.getItem('totalCreditor') || 0);
    let debt = parseFloat(localStorage.getItem('totalDebtor') || 0);
    
    let totalCreditorEl = document.getElementById('total-creditor');
    if(totalCreditorEl) totalCreditorEl.innerText = cred.toLocaleString() + ' IQD';
    
    let totalDebtorEl = document.getElementById('total-debtor');
    if(totalDebtorEl) totalDebtorEl.innerText = debt.toLocaleString() + ' IQD';
}

function compareDebts() {
    let cred = parseFloat(localStorage.getItem('totalCreditor') || 0);
    let debt = parseFloat(localStorage.getItem('totalDebtor') || 0);
    
    document.getElementById('comp-creditor').innerText = cred.toLocaleString();
    document.getElementById('comp-debtor').innerText = debt.toLocaleString();
    
    let diff = Math.abs(debt - cred);
    document.getElementById('comp-diff').innerText = diff.toLocaleString();
    
    let statusEl = document.getElementById('comp-status');
    if (debt > cred) {
        statusEl.innerText = '✔️ لك';
        statusEl.style.color = 'green';
    } else if (cred > debt) {
        statusEl.innerText = '❌ عليك';
        statusEl.style.color = 'red';
    } else {
        statusEl.innerText = 'متعادل';
        statusEl.style.color = 'black';
    }
}

function saveDaily() {
    let income = parseFloat(document.getElementById('daily-income-input').value) || 0;
    let expense = parseFloat(document.getElementById('daily-expense-input').value) || 0;
    
    let net = income - expense;
    document.getElementById('daily-net').innerText = net.toLocaleString() + ' IQD';
    
    let totalIncome = parseFloat(localStorage.getItem('totalIncome') || 0) + income;
    localStorage.setItem('totalIncome', totalIncome);
    document.getElementById('monthly-income-input').value = totalIncome;

    let list = JSON.parse(localStorage.getItem('dailySalesList') || '[]');
    let date = new Date().toLocaleDateString('ar-IQ');
    list.push({ income, expense, net, date });
    localStorage.setItem('dailySalesList', JSON.stringify(list));

    renderDailySales();

    document.getElementById('daily-income-input').value = '';
    document.getElementById('daily-expense-input').value = '';

    alertSuccess('تم حفظ اليومية وتصفير الحقول');
}

function renderDailySales() {
    let list = JSON.parse(localStorage.getItem('dailySalesList') || '[]');
    let container = document.getElementById('daily-sales-list');
    container.innerHTML = '';
    list.forEach(item => {
        container.innerHTML += `
            <div class="list-item">
                <p><strong>التاريخ:</strong> ${item.date}</p>
                <p><strong>الدخل:</strong> ${item.income} IQD</p>
                <p><strong>المصروف:</strong> ${item.expense} IQD</p>
                <p><strong>الصافي:</strong> ${item.net} IQD</p>
            </div>
        `;
    });
}

function calculateMonthly() {
    let monthlyIncome = parseFloat(document.getElementById('monthly-income-input').value) || 0;
    let monthlyExp = parseFloat(document.getElementById('monthly-expenses-input').value) || 0;
    let fixedExp = parseFloat(document.getElementById('fixed-expenses-input').value) || 0;
    
    let totalExp = monthlyExp + fixedExp;
    let netMonthly = monthlyIncome - totalExp;
    
    document.getElementById('monthly-net').innerText = netMonthly.toLocaleString() + ' IQD';
    
    let profitPercent = monthlyIncome > 0 ? ((netMonthly / monthlyIncome) * 100).toFixed(1) : 0;
    let profitStatus = document.getElementById('profit-status');
    
    if (profitPercent >= 25) {
        profitStatus.innerText = profitPercent + '% (✔️ أكثر من 25%)';
        profitStatus.style.color = 'green';
    } else {
        profitStatus.innerText = profitPercent + '% (❌ أقل من 25%)';
        profitStatus.style.color = 'red';
    }

    document.getElementById('monthly-income-input').value = '';
    document.getElementById('weekly-result-input').value = '';
    document.getElementById('monthly-result-input').value = '';
    document.getElementById('monthly-expenses-input').value = '';
    document.getElementById('fixed-expenses-input').value = '';

    alertSuccess('تم الحساب والحفظ بنجاح وتصفير الحقول');
}

// ==================== 4. دوال مساعدة للتنبيهات ====================
function alertSuccess(msg) {
    Swal.fire({
        icon: 'success',
        title: 'ممتاز!',
        text: msg,
        timer: 2000,
        showConfirmButton: false
    });
}

function alertError(msg) {
    Swal.fire({
        icon: 'error',
        title: 'عذراً',
        text: msg,
        confirmButtonColor: '#f28cae'
    });
}
