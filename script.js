// ==================== 1. نظام الحماية (تسجيل الدخول) ====================
const correctPIN = "1234"; // يمكنك تغيير الرمز من هنا

function checkPIN() {
    const pin = document.getElementById('pin-input').value;
    if (pin === correctPIN) {
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('app-screen').classList.add('active');
        loadDashboardData(); // تحميل البيانات عند الدخول
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
    // إخفاء كل المحتوى
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    // إزالة اللون من كل الأزرار
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // إظهار القسم المطلوب
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');

    if(tabId === 'dashboard') {
        loadDashboardData();
    }
}

// ==================== 3. لوحة القيادة والحسابات ====================
function loadDashboardData() {
    let sales = parseFloat(localStorage.getItem('totalSales') || 0);
    let purchases = parseFloat(localStorage.getItem('totalPurchases') || 0);
    let expenses = parseFloat(localStorage.getItem('totalExpenses') || 0);

    // حساب الربح
    let profit = sales - (purchases + expenses);
    let profitMargin = sales > 0 ? ((profit / sales) * 100).toFixed(1) : 0;

    // تحديث الواجهة الأساسية
    document.getElementById('monthly-sales').innerText = sales.toLocaleString() + ' IQD';
    document.getElementById('monthly-purchases').innerText = purchases.toLocaleString() + ' IQD';
    document.getElementById('daily-expense').innerText = expenses.toLocaleString() + ' IQD';
    
    let marginElement = document.getElementById('profit-margin');
    marginElement.innerText = profitMargin + '%';

    // التنبيه إذا كانت نسبة الربح أقل من 25%
    if (profitMargin < 25 && sales > 0) {
        marginElement.style.color = 'red';
        Swal.fire({
            icon: 'warning',
            title: 'تنبيه هام!',
            text: 'نسبة الربح الحالية أقل من الهدف (25%)',
            confirmButtonColor: '#6ebd70'
        });
    } else {
        marginElement.style.color = '#f28cae';
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
