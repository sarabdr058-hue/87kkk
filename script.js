// script.js
// ==================== 1. نظام الحماية (تسجيل الدخول) ====================
const correctPIN = "1234";

// متغيرات للتحكم في التعديل
let editingDailyIndex = -1;
let editingCreditorIndex = -1;
let editingDebtorIndex = -1;
let editingExpenseIndex = -1;

function checkPIN() {
    const pin = document.getElementById('pin-input').value;
    if (pin === correctPIN) {
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('app-screen').classList.add('active');
        loadAllLists();
        loadDashboardData();
        updateDebtsUI();
        updateExpTypes(); // تحديث قوائم المصروفات
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

// ==================== 3. لوحة القيادة والحسابات التلقائية ====================
function loadDashboardData() {
    let dailySales = JSON.parse(localStorage.getItem('dailySalesList') || '[]');
    let expList = JSON.parse(localStorage.getItem('expensesList') || '[]');

    let totalSales = dailySales.reduce((sum, item) => sum + parseFloat(item.income || 0), 0);
    let totalDailyExp = dailySales.reduce((sum, item) => sum + parseFloat(item.expense || 0), 0);
    let totalPurchases = expList.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

    let profit = totalSales - (totalPurchases + totalDailyExp);
    let profitMargin = totalSales > 0 ? ((profit / totalSales) * 100).toFixed(1) : 0;

    document.getElementById('monthly-sales').innerText = totalSales.toLocaleString() + ' IQD';
    document.getElementById('monthly-purchases').innerText = totalPurchases.toLocaleString() + ' IQD';
    document.getElementById('daily-income').innerText = totalSales.toLocaleString() + ' IQD';
    document.getElementById('daily-expense').innerText = totalDailyExp.toLocaleString() + ' IQD';
    
    let marginElement = document.getElementById('profit-margin');
    marginElement.innerText = profitMargin + '%';

    if (profitMargin < 25 && totalSales > 0) {
        marginElement.style.color = 'red';
    } else {
        marginElement.style.color = '#f28cae';
    }

    // حساب أسبوعي وشهري بناءً على الطوابع الزمنية أو كل البيانات المتوفرة
    calculateTimeBasedSales(dailySales);

    calculateMonthly(false);
}

function calculateTimeBasedSales(dailySales) {
    let now = Date.now();
    let oneWeek = 7 * 24 * 60 * 60 * 1000;
    
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();

    let weeklySales = 0;
    let monthlySales = 0;

    dailySales.forEach(item => {
        let itemDate = item.timestamp ? new Date(item.timestamp) : null;
        let inc = parseFloat(item.income || 0);

        if (itemDate) {
            if (now - item.timestamp <= oneWeek) {
                weeklySales += inc;
            }
            if (itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear) {
                monthlySales += inc;
            }
        } else {
             // للبيانات القديمة التي لا تحتوي على timestamp
             monthlySales += inc;
             weeklySales += inc; 
        }
    });
    
    let weeklyInput = document.getElementById('weekly-result-input');
    let monthlyInput = document.getElementById('monthly-result-input');
    let monthlyIncomeInput = document.getElementById('monthly-income-input');

    if(weeklyInput) weeklyInput.value = weeklySales;
    if(monthlyInput) monthlyInput.value = monthlySales;
    if(monthlyIncomeInput) monthlyIncomeInput.value = monthlySales;
}

// ==================== القوائم والسجلات ====================

function loadAllLists() {
    renderCreditors();
    renderDebtors();
    renderExpenses();
    renderDailySales();
}

// ==================== قسم الدائن ====================
function saveCreditor() {
    let name = document.getElementById('cred-name').value;
    let phone = document.getElementById('cred-phone').value;
    let address = document.getElementById('cred-address').value;
    let amount = parseFloat(document.getElementById('creditor-amount').value) || 0;
    let details = document.getElementById('cred-details').value;
    let date = document.getElementById('cred-date').value;

    if (!name && amount === 0) return alertError('الرجاء إدخال البيانات المطلوبة');

    let list = JSON.parse(localStorage.getItem('creditorsList') || '[]');
    
    if (editingCreditorIndex > -1) {
        list[editingCreditorIndex] = { name, phone, address, amount, details, date };
        editingCreditorIndex = -1;
        document.getElementById('btn-save-creditor').innerText = "حفظ الدائن";
        alertSuccess('تم التعديل بنجاح');
    } else {
        list.push({ name, phone, address, amount, details, date });
        alertSuccess('تم حفظ الدائن بنجاح');
    }
    
    localStorage.setItem('creditorsList', JSON.stringify(list));
    updateDebtsUI();
    renderCreditors();

    document.getElementById('cred-name').value = '';
    document.getElementById('cred-phone').value = '';
    document.getElementById('cred-address').value = '';
    document.getElementById('creditor-amount').value = '';
    document.getElementById('cred-details').value = '';
    document.getElementById('cred-date').value = '';
}

function renderCreditors() {
    let list = JSON.parse(localStorage.getItem('creditorsList') || '[]');
    let container = document.getElementById('creditor-list');
    container.innerHTML = '';
    list.forEach((item, index) => {
        container.innerHTML += `
            <div class="list-item">
                <p><strong>الاسم:</strong> ${item.name}</p>
                <p><strong>المبلغ:</strong> ${item.amount} IQD</p>
                <p><strong>التاريخ:</strong> ${item.date}</p>
                <p><strong>التفاصيل:</strong> ${item.details}</p>
                <div class="action-btns">
                    <button class="btn-small btn-pay" onclick="payCreditor(${index})">تسديد (الواصل)</button>
                    <button class="btn-small btn-edit" onclick="editCreditor(${index})">تعديل</button>
                    <button class="btn-small btn-delete" onclick="deleteCreditor(${index})">حذف</button>
                </div>
            </div>
        `;
    });
}

function editCreditor(index) {
    let list = JSON.parse(localStorage.getItem('creditorsList') || '[]');
    let item = list[index];
    document.getElementById('cred-name').value = item.name;
    document.getElementById('cred-phone').value = item.phone;
    document.getElementById('cred-address').value = item.address;
    document.getElementById('creditor-amount').value = item.amount;
    document.getElementById('cred-details').value = item.details;
    document.getElementById('cred-date').value = item.date;
    
    editingCreditorIndex = index;
    document.getElementById('btn-save-creditor').innerText = "تحديث بيانات الدائن";
    window.scrollTo(0, 0);
}

function deleteCreditor(index) {
    let list = JSON.parse(localStorage.getItem('creditorsList') || '[]');
    list.splice(index, 1);
    localStorage.setItem('creditorsList', JSON.stringify(list));
    renderCreditors();
    updateDebtsUI();
}

async function payCreditor(index) {
    let list = JSON.parse(localStorage.getItem('creditorsList') || '[]');
    const { value: amount } = await Swal.fire({
        title: 'تسديد مبلغ (الواصل)',
        input: 'number',
        inputPlaceholder: 'أدخل المبلغ الذي تم تسديده',
        showCancelButton: true,
        confirmButtonText: 'تأكيد الخصم',
        cancelButtonText: 'إلغاء'
    });

    if (amount) {
        let deduct = parseFloat(amount);
        list[index].amount -= deduct;
        if (list[index].amount < 0) list[index].amount = 0;
        localStorage.setItem('creditorsList', JSON.stringify(list));
        renderCreditors();
        updateDebtsUI();
        alertSuccess('تم خصم المبلغ بنجاح');
    }
}

// ==================== قسم المدين ====================
function saveDebtor() {
    let name = document.getElementById('debt-name').value;
    let phone = document.getElementById('debt-phone').value;
    let address = document.getElementById('debt-address').value;
    let amount = parseFloat(document.getElementById('debtor-amount').value) || 0;
    let details = document.getElementById('debt-details').value;
    let date = document.getElementById('debt-date').value;

    if (!name && amount === 0) return alertError('الرجاء إدخال البيانات المطلوبة');

    let list = JSON.parse(localStorage.getItem('debtorsList') || '[]');
    
    if (editingDebtorIndex > -1) {
        list[editingDebtorIndex] = { name, phone, address, amount, details, date };
        editingDebtorIndex = -1;
        document.getElementById('btn-save-debtor').innerText = "حفظ المدين";
        alertSuccess('تم التعديل بنجاح');
    } else {
        list.push({ name, phone, address, amount, details, date });
        alertSuccess('تم حفظ المدين بنجاح');
    }

    localStorage.setItem('debtorsList', JSON.stringify(list));
    updateDebtsUI();
    renderDebtors();

    document.getElementById('debt-name').value = '';
    document.getElementById('debt-phone').value = '';
    document.getElementById('debt-address').value = '';
    document.getElementById('debtor-amount').value = '';
    document.getElementById('debt-details').value = '';
    document.getElementById('debt-date').value = '';
}

function renderDebtors() {
    let list = JSON.parse(localStorage.getItem('debtorsList') || '[]');
    let container = document.getElementById('debtor-list');
    container.innerHTML = '';
    list.forEach((item, index) => {
        container.innerHTML += `
            <div class="list-item">
                <p><strong>الاسم:</strong> ${item.name}</p>
                <p><strong>المبلغ:</strong> ${item.amount} IQD</p>
                <p><strong>التاريخ:</strong> ${item.date}</p>
                <p><strong>التفاصيل:</strong> ${item.details}</p>
                <div class="action-btns">
                    <button class="btn-small btn-pay" onclick="payDebtor(${index})">تسديد (الواصل)</button>
                    <button class="btn-small btn-edit" onclick="editDebtor(${index})">تعديل</button>
                    <button class="btn-small btn-delete" onclick="deleteDebtor(${index})">حذف</button>
                </div>
            </div>
        `;
    });
}

function editDebtor(index) {
    let list = JSON.parse(localStorage.getItem('debtorsList') || '[]');
    let item = list[index];
    document.getElementById('debt-name').value = item.name;
    document.getElementById('debt-phone').value = item.phone;
    document.getElementById('debt-address').value = item.address;
    document.getElementById('debtor-amount').value = item.amount;
    document.getElementById('debt-details').value = item.details;
    document.getElementById('debt-date').value = item.date;
    
    editingDebtorIndex = index;
    document.getElementById('btn-save-debtor').innerText = "تحديث بيانات المدين";
    window.scrollTo(0, 0);
}

function deleteDebtor(index) {
    let list = JSON.parse(localStorage.getItem('debtorsList') || '[]');
    list.splice(index, 1);
    localStorage.setItem('debtorsList', JSON.stringify(list));
    renderDebtors();
    updateDebtsUI();
}

async function payDebtor(index) {
    let list = JSON.parse(localStorage.getItem('debtorsList') || '[]');
    const { value: amount } = await Swal.fire({
        title: 'تسديد مبلغ (الواصل)',
        input: 'number',
        inputPlaceholder: 'أدخل المبلغ الذي تم تسديده',
        showCancelButton: true,
        confirmButtonText: 'تأكيد الخصم',
        cancelButtonText: 'إلغاء'
    });

    if (amount) {
        let deduct = parseFloat(amount);
        list[index].amount -= deduct;
        if (list[index].amount < 0) list[index].amount = 0;
        localStorage.setItem('debtorsList', JSON.stringify(list));
        renderDebtors();
        updateDebtsUI();
        alertSuccess('تم خصم المبلغ بنجاح');
    }
}

// ==================== قسم المصروفات ====================
function updateExpTypes() {
    let cat = document.getElementById('exp-category').value;
    let list = document.getElementById('exp-type-list');
    list.innerHTML = '';
    if(cat === 'ثابتة') {
        ['ايجار', 'مولد', 'عمال'].forEach(t => list.innerHTML += `<option value="${t}"></option>`);
    } else {
        ['بضاعة'].forEach(t => list.innerHTML += `<option value="${t}"></option>`);
    }
}

function saveExpense() {
    let category = document.getElementById('exp-category').value;
    let type = document.getElementById('exp-type').value;
    let amount = parseFloat(document.getElementById('exp-amount').value) || 0;
    let date = document.getElementById('exp-date').value;
    let notes = document.getElementById('exp-notes').value;
    let method = document.getElementById('exp-method').value;

    if (!type && amount === 0) return alertError('الرجاء إدخال البيانات المطلوبة');

    let list = JSON.parse(localStorage.getItem('expensesList') || '[]');
    
    if (editingExpenseIndex > -1) {
        list[editingExpenseIndex] = { category, type, amount, date, notes, method };
        editingExpenseIndex = -1;
        document.getElementById('btn-save-expense').innerText = "حفظ المصروف";
        alertSuccess('تم التعديل بنجاح');
    } else {
        list.push({ category, type, amount, date, notes, method });
        alertSuccess('تم حفظ المصروف بنجاح');
    }

    localStorage.setItem('expensesList', JSON.stringify(list));
    renderExpenses();
    loadDashboardData(); 

    document.getElementById('exp-type').value = '';
    document.getElementById('exp-amount').value = '';
    document.getElementById('exp-date').value = '';
    document.getElementById('exp-notes').value = '';
    document.getElementById('exp-method').value = '';
}

function renderExpenses() {
    let list = JSON.parse(localStorage.getItem('expensesList') || '[]');
    let container = document.getElementById('expenses-list');
    container.innerHTML = '';
    list.forEach((item, index) => {
        container.innerHTML += `
            <div class="list-item">
                <p><strong>الفئة:</strong> ${item.category || 'غير محدد'}</p>
                <p><strong>الصنف:</strong> ${item.type}</p>
                <p><strong>المبلغ:</strong> ${item.amount} IQD</p>
                <p><strong>التاريخ:</strong> ${item.date}</p>
                <p><strong>ملاحظات:</strong> ${item.notes}</p>
                <p><strong>طريقة الدفع:</strong> ${item.method}</p>
                <div class="action-btns">
                    <button class="btn-small btn-edit" onclick="editExpense(${index})">تعديل</button>
                    <button class="btn-small btn-delete" onclick="deleteExpense(${index})">حذف</button>
                </div>
            </div>
        `;
    });
}

function editExpense(index) {
    let list = JSON.parse(localStorage.getItem('expensesList') || '[]');
    let item = list[index];
    
    if(item.category) {
        document.getElementById('exp-category').value = item.category;
        updateExpTypes();
    }
    document.getElementById('exp-type').value = item.type;
    document.getElementById('exp-amount').value = item.amount;
    document.getElementById('exp-date').value = item.date;
    document.getElementById('exp-notes').value = item.notes;
    document.getElementById('exp-method').value = item.method;
    
    editingExpenseIndex = index;
    document.getElementById('btn-save-expense').innerText = "تحديث المصروف";
    window.scrollTo(0, 0);
}

function deleteExpense(index) {
    let list = JSON.parse(localStorage.getItem('expensesList') || '[]');
    list.splice(index, 1);
    localStorage.setItem('expensesList', JSON.stringify(list));
    renderExpenses();
    loadDashboardData();
}

// ==================== تحديث واجهة الديون والمقارنة ====================
function updateDebtsUI() {
    let credList = JSON.parse(localStorage.getItem('creditorsList') || '[]');
    let debtList = JSON.parse(localStorage.getItem('debtorsList') || '[]');

    let credTotal = credList.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    let debtTotal = debtList.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    
    localStorage.setItem('totalCreditor', credTotal);
    localStorage.setItem('totalDebtor', debtTotal);

    let totalCreditorEl = document.getElementById('total-creditor');
    if(totalCreditorEl) totalCreditorEl.innerText = credTotal.toLocaleString() + ' IQD';
    
    let totalDebtorEl = document.getElementById('total-debtor');
    if(totalDebtorEl) totalDebtorEl.innerText = debtTotal.toLocaleString() + ' IQD';
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

// ==================== قسم المبيعات واليومية ====================
function saveDaily() {
    let income = parseFloat(document.getElementById('daily-income-input').value) || 0;
    let expense = parseFloat(document.getElementById('daily-expense-input').value) || 0;
    
    let net = income - expense;
    document.getElementById('daily-net').innerText = net.toLocaleString() + ' IQD';
    
    let list = JSON.parse(localStorage.getItem('dailySalesList') || '[]');
    let date = new Date().toLocaleDateString('ar-IQ');
    let timestamp = Date.now();
    
    if (editingDailyIndex > -1) {
        // الحفاظ على التاريخ القديم عند التعديل
        let oldDate = list[editingDailyIndex].date;
        let oldTimestamp = list[editingDailyIndex].timestamp || timestamp;
        list[editingDailyIndex] = { income, expense, net, date: oldDate, timestamp: oldTimestamp };
        editingDailyIndex = -1;
        document.getElementById('btn-save-daily').innerText = "✅ حفظ اليومية";
        alertSuccess('تم التعديل بنجاح');
    } else {
        list.push({ income, expense, net, date, timestamp });
        alertSuccess('تم حفظ اليومية بنجاح');
    }
    
    localStorage.setItem('dailySalesList', JSON.stringify(list));

    renderDailySales();
    loadDashboardData();

    document.getElementById('daily-income-input').value = '';
    document.getElementById('daily-expense-input').value = '';
}

function renderDailySales() {
    let list = JSON.parse(localStorage.getItem('dailySalesList') || '[]');
    let container = document.getElementById('daily-sales-list');
    container.innerHTML = '';
    list.forEach((item, index) => {
        container.innerHTML += `
            <div class="list-item">
                <p><strong>التاريخ:</strong> ${item.date}</p>
                <p><strong>الدخل:</strong> ${item.income} IQD</p>
                <p><strong>المصروف:</strong> ${item.expense} IQD</p>
                <p><strong>الصافي:</strong> ${item.net} IQD</p>
                <div class="action-btns">
                    <button class="btn-small btn-edit" onclick="editDaily(${index})">تعديل</button>
                    <button class="btn-small btn-delete" onclick="deleteDaily(${index})">حذف</button>
                </div>
            </div>
        `;
    });
}

function editDaily(index) {
    let list = JSON.parse(localStorage.getItem('dailySalesList') || '[]');
    let item = list[index];
    document.getElementById('daily-income-input').value = item.income;
    document.getElementById('daily-expense-input').value = item.expense;
    
    editingDailyIndex = index;
    document.getElementById('btn-save-daily').innerText = "🔄 تحديث اليومية";
    window.scrollTo(0, 0);
}

function deleteDaily(index) {
    let list = JSON.parse(localStorage.getItem('dailySalesList') || '[]');
    list.splice(index, 1);
    localStorage.setItem('dailySalesList', JSON.stringify(list));
    renderDailySales();
    loadDashboardData();
}

function calculateMonthly(showAlert = true) {
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

    if(showAlert) {
        alertSuccess('تم الحساب بنجاح');
    }
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
