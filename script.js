import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCBCswyQbffEn5dVIXHjoJau4Htf3hcG5Y",
    authDomain: "fffrrr-406d1.firebaseapp.com",
    projectId: "fffrrr-406d1",
    storageBucket: "fffrrr-406d1.firebasestorage.app",
    messagingSenderId: "857903652305",
    appId: "1:857903652305:web:771aeff515d2ec4b9814f0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function getListFromDB(listName, defaultValue = []) {
    try {
        const docRef = doc(db, "storeData", listName);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data().value;
        }
    } catch (e) {
        console.error(e);
    }
    return defaultValue;
}

async function saveListToDB(listName, value) {
    try {
        await setDoc(doc(db, "storeData", listName), { value: value });
    } catch (e) {
        console.error(e);
    }
}

// ==================== 1. نظام الحماية (تسجيل الدخول) ====================
const correctPIN = "1234";

let editingDailyIndex = -1;
let editingCreditorIndex = -1;
let editingDebtorIndex = -1;
let editingExpenseIndex = -1;

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById('install-btn');
    if (installBtn) {
        installBtn.style.display = 'block';
        installBtn.addEventListener('click', () => {
            installBtn.style.display = 'none';
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                deferredPrompt = null;
            });
        });
    }
});

function formatMoney(num) {
    return Number(num).toLocaleString('en-US');
}

async function checkPIN() {
    const pin = document.getElementById('pin-input').value;
    if (pin === correctPIN) {
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('app-screen').classList.add('active');
        
        Swal.fire({
            title: 'جاري تحميل البيانات...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        await loadAllLists();
        await loadDashboardData();
        await updateDebtsUI();
        updateExpTypes();

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
async function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');

    if(tabId === 'dashboard') {
        await loadDashboardData();
    } else if (tabId === 'comparison') {
        await compareDebts();
    }
}

// ==================== 3. لوحة القيادة والحسابات التلقائية ====================
async function loadDashboardData() {
    let dailySales = await getListFromDB('dailySalesList', []);
    let expList = await getListFromDB('expensesList', []);

    let totalSales = dailySales.reduce((sum, item) => sum + parseFloat(item.income || 0), 0);
    let totalDailyExp = dailySales.reduce((sum, item) => sum + parseFloat(item.expense || 0), 0);
    let totalPurchases = expList.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

    let profit = totalSales - (totalPurchases + totalDailyExp);
    let profitMargin = totalSales > 0 ? ((profit / totalSales) * 100).toFixed(1) : 0;

    document.getElementById('monthly-sales').innerText = formatMoney(totalSales) + ' IQD';
    document.getElementById('monthly-purchases').innerText = formatMoney(totalPurchases) + ' IQD';
    document.getElementById('daily-income').innerText = formatMoney(totalSales) + ' IQD';
    document.getElementById('daily-expense').innerText = formatMoney(totalDailyExp) + ' IQD';
    
    let marginElement = document.getElementById('profit-margin');
    marginElement.innerText = profitMargin + '%';

    if (profitMargin < 25 && totalSales > 0) {
        marginElement.style.color = 'red';
    } else {
        marginElement.style.color = '#f28cae';
    }

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

async function loadAllLists() {
    await renderCreditors();
    await renderDebtors();
    await renderExpenses();
    await renderDailySales();
}

// ==================== قسم الدائن ====================
async function saveCreditor() {
    let name = document.getElementById('cred-name').value;
    let phone = document.getElementById('cred-phone').value;
    let address = document.getElementById('cred-address').value;
    let amount = parseFloat(document.getElementById('creditor-amount').value) || 0;
    let details = document.getElementById('cred-details').value;
    let date = document.getElementById('cred-date').value;

    if (!name && amount === 0) return alertError('الرجاء إدخال البيانات المطلوبة');

    let list = await getListFromDB('creditorsList', []);
    
    if (editingCreditorIndex > -1) {
        let payments = list[editingCreditorIndex].payments || [];
        list[editingCreditorIndex] = { name, phone, address, amount, details, date, payments };
        editingCreditorIndex = -1;
        document.getElementById('btn-save-creditor').innerText = "حفظ الدائن";
        alertSuccess('تم التعديل بنجاح');
    } else {
        list.push({ name, phone, address, amount, details, date, payments: [] });
        alertSuccess('تم حفظ الدائن بنجاح');
    }
    
    await saveListToDB('creditorsList', list);
    await updateDebtsUI();
    await renderCreditors();

    document.getElementById('cred-name').value = '';
    document.getElementById('cred-phone').value = '';
    document.getElementById('cred-address').value = '';
    document.getElementById('creditor-amount').value = '';
    document.getElementById('cred-details').value = '';
    document.getElementById('cred-date').value = '';
}

async function renderCreditors() {
    let list = await getListFromDB('creditorsList', []);
    let container = document.getElementById('creditor-list');
    container.innerHTML = '';
    list.forEach((item, index) => {
        let paymentsHTML = '';
        if (item.payments && item.payments.length > 0) {
            paymentsHTML = '<div class="payments-history"><strong>تفاصيل التسديد (الواصل):</strong>';
            item.payments.forEach(p => {
                paymentsHTML += `<div>- واصل ${formatMoney(p.amount)} IQD بتاريخ ${p.date}</div>`;
            });
            paymentsHTML += '</div>';
        }

        container.innerHTML += `
            <div class="list-item">
                <p><strong>الاسم:</strong> ${item.name}</p>
                <p><strong>المبلغ المتبقي:</strong> ${formatMoney(item.amount)} IQD</p>
                <p><strong>التاريخ:</strong> ${item.date}</p>
                <p><strong>التفاصيل:</strong> ${item.details}</p>
                ${paymentsHTML}
                <div class="action-btns">
                    <button class="btn-small btn-pay" onclick="payCreditor(${index})">تسديد (الواصل)</button>
                    <button class="btn-small btn-edit" onclick="editCreditor(${index})">تعديل</button>
                    <button class="btn-small btn-delete" onclick="deleteCreditor(${index})">حذف</button>
                </div>
            </div>
        `;
    });
}

async function editCreditor(index) {
    let list = await getListFromDB('creditorsList', []);
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

async function deleteCreditor(index) {
    let list = await getListFromDB('creditorsList', []);
    list.splice(index, 1);
    await saveListToDB('creditorsList', list);
    await renderCreditors();
    await updateDebtsUI();
}

async function payCreditor(index) {
    let list = await getListFromDB('creditorsList', []);
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
        
        if (!list[index].payments) {
            list[index].payments = [];
        }
        let today = new Date().toLocaleDateString('ar-IQ');
        list[index].payments.push({
            amount: deduct,
            date: today
        });

        await saveListToDB('creditorsList', list);
        await renderCreditors();
        await updateDebtsUI();
        alertSuccess('تم خصم المبلغ بنجاح');
    }
}

// ==================== قسم المدين ====================
async function saveDebtor() {
    let name = document.getElementById('debt-name').value;
    let phone = document.getElementById('debt-phone').value;
    let address = document.getElementById('debt-address').value;
    let amount = parseFloat(document.getElementById('debtor-amount').value) || 0;
    let details = document.getElementById('debt-details').value;
    let date = document.getElementById('debt-date').value;

    if (!name && amount === 0) return alertError('الرجاء إدخال البيانات المطلوبة');

    let list = await getListFromDB('debtorsList', []);
    
    if (editingDebtorIndex > -1) {
        let payments = list[editingDebtorIndex].payments || [];
        list[editingDebtorIndex] = { name, phone, address, amount, details, date, payments };
        editingDebtorIndex = -1;
        document.getElementById('btn-save-debtor').innerText = "حفظ المدين";
        alertSuccess('تم التعديل بنجاح');
    } else {
        list.push({ name, phone, address, amount, details, date, payments: [] });
        alertSuccess('تم حفظ المدين بنجاح');
    }

    await saveListToDB('debtorsList', list);
    await updateDebtsUI();
    await renderDebtors();

    document.getElementById('debt-name').value = '';
    document.getElementById('debt-phone').value = '';
    document.getElementById('debt-address').value = '';
    document.getElementById('debtor-amount').value = '';
    document.getElementById('debt-details').value = '';
    document.getElementById('debt-date').value = '';
}

async function renderDebtors() {
    let list = await getListFromDB('debtorsList', []);
    let container = document.getElementById('debtor-list');
    container.innerHTML = '';
    list.forEach((item, index) => {
        let paymentsHTML = '';
        if (item.payments && item.payments.length > 0) {
            paymentsHTML = '<div class="payments-history"><strong>تفاصيل التسديد (الواصل):</strong>';
            item.payments.forEach(p => {
                paymentsHTML += `<div>- واصل ${formatMoney(p.amount)} IQD بتاريخ ${p.date}</div>`;
            });
            paymentsHTML += '</div>';
        }

        container.innerHTML += `
            <div class="list-item">
                <p><strong>الاسم:</strong> ${item.name}</p>
                <p><strong>المبلغ المتبقي:</strong> ${formatMoney(item.amount)} IQD</p>
                <p><strong>التاريخ:</strong> ${item.date}</p>
                <p><strong>التفاصيل:</strong> ${item.details}</p>
                ${paymentsHTML}
                <div class="action-btns">
                    <button class="btn-small btn-pay" onclick="payDebtor(${index})">تسديد (الواصل)</button>
                    <button class="btn-small btn-edit" onclick="editDebtor(${index})">تعديل</button>
                    <button class="btn-small btn-delete" onclick="deleteDebtor(${index})">حذف</button>
                </div>
            </div>
        `;
    });
}

async function editDebtor(index) {
    let list = await getListFromDB('debtorsList', []);
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

async function deleteDebtor(index) {
    let list = await getListFromDB('debtorsList', []);
    list.splice(index, 1);
    await saveListToDB('debtorsList', list);
    await renderDebtors();
    await updateDebtsUI();
}

async function payDebtor(index) {
    let list = await getListFromDB('debtorsList', []);
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
        
        if (!list[index].payments) {
            list[index].payments = [];
        }
        let today = new Date().toLocaleDateString('ar-IQ');
        list[index].payments.push({
            amount: deduct,
            date: today
        });

        await saveListToDB('debtorsList', list);
        await renderDebtors();
        await updateDebtsUI();
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

async function saveExpense() {
    let category = document.getElementById('exp-category').value;
    let type = document.getElementById('exp-type').value;
    let amount = parseFloat(document.getElementById('exp-amount').value) || 0;
    let date = document.getElementById('exp-date').value;
    let notes = document.getElementById('exp-notes').value;
    let method = document.getElementById('exp-method').value;

    if (!type && amount === 0) return alertError('الرجاء إدخال البيانات المطلوبة');

    let list = await getListFromDB('expensesList', []);
    
    if (editingExpenseIndex > -1) {
        list[editingExpenseIndex] = { category, type, amount, date, notes, method };
        editingExpenseIndex = -1;
        document.getElementById('btn-save-expense').innerText = "حفظ المصروف";
        alertSuccess('تم التعديل بنجاح');
    } else {
        list.push({ category, type, amount, date, notes, method });
        alertSuccess('تم حفظ المصروف بنجاح');
    }

    await saveListToDB('expensesList', list);
    await renderExpenses();
    await loadDashboardData(); 

    document.getElementById('exp-type').value = '';
    document.getElementById('exp-amount').value = '';
    document.getElementById('exp-date').value = '';
    document.getElementById('exp-notes').value = '';
    document.getElementById('exp-method').value = '';
}

async function renderExpenses() {
    let list = await getListFromDB('expensesList', []);
    let container = document.getElementById('expenses-list');
    container.innerHTML = '';
    list.forEach((item, index) => {
        container.innerHTML += `
            <div class="list-item">
                <p><strong>الفئة:</strong> ${item.category || 'غير محدد'}</p>
                <p><strong>الصنف:</strong> ${item.type}</p>
                <p><strong>المبلغ:</strong> ${formatMoney(item.amount)} IQD</p>
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

async function editExpense(index) {
    let list = await getListFromDB('expensesList', []);
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

async function deleteExpense(index) {
    let list = await getListFromDB('expensesList', []);
    list.splice(index, 1);
    await saveListToDB('expensesList', list);
    await renderExpenses();
    await loadDashboardData();
}

// ==================== تحديث واجهة الديون والمقارنة ====================
async function updateDebtsUI() {
    let credList = await getListFromDB('creditorsList', []);
    let debtList = await getListFromDB('debtorsList', []);

    let credTotal = credList.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    let debtTotal = debtList.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    
    await saveListToDB('totalCreditor', credTotal);
    await saveListToDB('totalDebtor', debtTotal);

    let totalCreditorEl = document.getElementById('total-creditor');
    if(totalCreditorEl) totalCreditorEl.innerText = formatMoney(credTotal) + ' IQD';
    
    let totalDebtorEl = document.getElementById('total-debtor');
    if(totalDebtorEl) totalDebtorEl.innerText = formatMoney(debtTotal) + ' IQD';
}

async function compareDebts() {
    let cred = parseFloat(await getListFromDB('totalCreditor', 0));
    let debt = parseFloat(await getListFromDB('totalDebtor', 0));
    
    document.getElementById('comp-creditor').innerText = formatMoney(cred);
    document.getElementById('comp-debtor').innerText = formatMoney(debt);
    
    let diff = Math.abs(debt - cred);
    document.getElementById('comp-diff').innerText = formatMoney(diff);
    
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
async function saveDaily() {
    let income = parseFloat(document.getElementById('daily-income-input').value) || 0;
    let expense = parseFloat(document.getElementById('daily-expense-input').value) || 0;
    
    let net = income - expense;
    document.getElementById('daily-net').innerText = formatMoney(net) + ' IQD';
    
    let list = await getListFromDB('dailySalesList', []);
    let date = new Date().toLocaleDateString('ar-IQ');
    let timestamp = Date.now();
    
    if (editingDailyIndex > -1) {
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
    
    await saveListToDB('dailySalesList', list);

    await renderDailySales();
    await loadDashboardData();

    document.getElementById('daily-income-input').value = '';
    document.getElementById('daily-expense-input').value = '';
}

async function renderDailySales() {
    let list = await getListFromDB('dailySalesList', []);
    let container = document.getElementById('daily-sales-list');
    container.innerHTML = '';
    list.forEach((item, index) => {
        container.innerHTML += `
            <div class="list-item">
                <p><strong>التاريخ:</strong> ${item.date}</p>
                <p><strong>الدخل:</strong> ${formatMoney(item.income)} IQD</p>
                <p><strong>المصروف:</strong> ${formatMoney(item.expense)} IQD</p>
                <p><strong>الصافي:</strong> ${formatMoney(item.net)} IQD</p>
                <div class="action-btns">
                    <button class="btn-small btn-edit" onclick="editDaily(${index})">تعديل</button>
                    <button class="btn-small btn-delete" onclick="deleteDaily(${index})">حذف</button>
                </div>
            </div>
        `;
    });
}

async function editDaily(index) {
    let list = await getListFromDB('dailySalesList', []);
    let item = list[index];
    document.getElementById('daily-income-input').value = item.income;
    document.getElementById('daily-expense-input').value = item.expense;
    
    editingDailyIndex = index;
    document.getElementById('btn-save-daily').innerText = "🔄 تحديث اليومية";
    window.scrollTo(0, 0);
}

async function deleteDaily(index) {
    let list = await getListFromDB('dailySalesList', []);
    list.splice(index, 1);
    await saveListToDB('dailySalesList', list);
    await renderDailySales();
    await loadDashboardData();
}

function calculateMonthly(showAlert = true) {
    let monthlyIncome = parseFloat(document.getElementById('monthly-income-input').value) || 0;
    let monthlyExp = parseFloat(document.getElementById('monthly-expenses-input').value) || 0;
    let fixedExp = parseFloat(document.getElementById('fixed-expenses-input').value) || 0;
    
    let totalExp = monthlyExp + fixedExp;
    let netMonthly = monthlyIncome - totalExp;
    
    document.getElementById('monthly-net').innerText = formatMoney(netMonthly) + ' IQD';
    
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

// ربط الدوال بنافذة المتصفح لتعمل مع HTML
window.checkPIN = checkPIN;
window.logout = logout;
window.switchTab = switchTab;
window.saveDaily = saveDaily;
window.calculateMonthly = calculateMonthly;
window.updateExpTypes = updateExpTypes;
window.saveExpense = saveExpense;
window.saveCreditor = saveCreditor;
window.saveDebtor = saveDebtor;
window.payCreditor = payCreditor;
window.editCreditor = editCreditor;
window.deleteCreditor = deleteCreditor;
window.payDebtor = payDebtor;
window.editDebtor = editDebtor;
window.deleteDebtor = deleteDebtor;
window.editExpense = editExpense;
window.deleteExpense = deleteExpense;
window.editDaily = editDaily;
window.deleteDaily = deleteDaily;
