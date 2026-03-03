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

// ==================== التعديلات المطلوبة (الدائن والمدين والمبيعات) ====================

function saveCreditor() {
    let amount = parseFloat(document.getElementById('creditor-amount').value) || 0;
    let total = parseFloat(localStorage.getItem('totalCreditor') || 0) + amount;
    localStorage.setItem('totalCreditor', total);
    updateDebtsUI();
    document.getElementById('creditor-amount').value = '';
    alertSuccess('تم حفظ الدائن');
}

function saveDebtor() {
    let amount = parseFloat(document.getElementById('debtor-amount').value) || 0;
    let total = parseFloat(localStorage.getItem('totalDebtor') || 0) + amount;
    localStorage.setItem('totalDebtor', total);
    updateDebtsUI();
    document.getElementById('debtor-amount').value = '';
    alertSuccess('تم حفظ المدين');
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
    
    alertSuccess('تم حفظ اليومية');
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

    alertSuccess('تم الحساب والحفظ بنجاح');
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
