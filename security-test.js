const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_ACCOUNTS = {
  admin: { username: 'admin', password: 'admin123' },
  user: { username: 'user', password: 'user123' }
};

// Helper function to make requests
async function makeRequest(method, url, data = null, cookies = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    if (cookies) {
      config.headers.Cookie = cookies;
    }
    
    const response = await axios(config);
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      status: error.response?.status || 0, 
      error: error.message 
    };
  }
}

// Test functions
async function testAuthentication() {
  console.log('\n=== تست احرازهویت ===');
  
  // Test 1: Login with correct admin credentials
  console.log('1. تست ورود با اطلاعات صحیح ادمین...');
  const adminLogin = await makeRequest('POST', '/login', 
    `username=${TEST_ACCOUNTS.admin.username}&password=${TEST_ACCOUNTS.admin.password}`);
  
  if (adminLogin.success && adminLogin.status === 302) {
    console.log('✅ ورود ادمین موفق');
  } else {
    console.log('❌ ورود ادمین ناموفق');
  }
  
  // Test 2: Login with wrong credentials
  console.log('2. تست ورود با اطلاعات نادرست...');
  const wrongLogin = await makeRequest('POST', '/login', 
    'username=wrong&password=wrong');
  
  if (!wrongLogin.success || wrongLogin.status === 302) {
    console.log('✅ ورود با اطلاعات نادرست مسدود شد');
  } else {
    console.log('❌ ورود با اطلاعات نادرست موفق شد (مشکل امنیتی)');
  }
}

async function testAccessControl() {
  console.log('\n=== تست کنترل دسترسی ===');
  
  // Test 1: Access protected route without authentication
  console.log('1. تست دسترسی به داشبورد بدون احرازهویت...');
  const dashboardAccess = await makeRequest('GET', '/dashboard');
  
  if (dashboardAccess.status === 302) {
    console.log('✅ دسترسی به داشبورد بدون احرازهویت مسدود شد');
  } else {
    console.log('❌ دسترسی به داشبورد بدون احرازهویت ممکن شد (مشکل امنیتی)');
  }
  
  // Test 2: Access admin panel without admin role
  console.log('2. تست دسترسی به پنل ادمین با نقش کاربر عادی...');
  
  // First login as regular user
  const userLogin = await makeRequest('POST', '/login', 
    `username=${TEST_ACCOUNTS.user.username}&password=${TEST_ACCOUNTS.user.password}`);
  
  if (userLogin.success) {
    // Try to access admin panel
    const adminAccess = await makeRequest('GET', '/admin');
    
    if (adminAccess.status === 403) {
      console.log('✅ دسترسی به پنل ادمین با نقش کاربر عادی مسدود شد');
    } else {
      console.log('❌ دسترسی به پنل ادمین با نقش کاربر عادی ممکن شد (مشکل امنیتی)');
    }
  }
}

async function testAPIEndpoints() {
  console.log('\n=== تست API Endpoints ===');
  
  // Test 1: Access API without authentication
  console.log('1. تست دسترسی به API بدون احرازهویت...');
  const apiUsers = await makeRequest('GET', '/api/users');
  
  if (apiUsers.status === 401 || apiUsers.status === 302) {
    console.log('✅ دسترسی به API بدون احرازهویت مسدود شد');
  } else {
    console.log('❌ دسترسی به API بدون احرازهویت ممکن شد (مشکل امنیتی)');
  }
  
  // Test 2: Access API with authentication
  console.log('2. تست دسترسی به API با احرازهویت...');
  
  // Login first
  const login = await makeRequest('POST', '/login', 
    `username=${TEST_ACCOUNTS.admin.username}&password=${TEST_ACCOUNTS.admin.password}`);
  
  if (login.success) {
    const apiProfile = await makeRequest('GET', '/api/profile');
    
    if (apiProfile.success && apiProfile.status === 200) {
      console.log('✅ دسترسی به API با احرازهویت موفق');
    } else {
      console.log('❌ دسترسی به API با احرازهویت ناموفق');
    }
  }
}

async function testInputValidation() {
  console.log('\n=== تست اعتبارسنجی ورودی ===');
  
  // Test 1: SQL Injection attempt
  console.log('1. تست SQL Injection...');
  const sqlInjection = await makeRequest('POST', '/login', 
    'username=admin\' OR 1=1--&password=anything');
  
  if (!sqlInjection.success || sqlInjection.status === 302) {
    console.log('✅ SQL Injection مسدود شد');
  } else {
    console.log('❌ SQL Injection ممکن شد (مشکل امنیتی)');
  }
  
  // Test 2: XSS attempt
  console.log('2. تست XSS...');
  const xssAttempt = await makeRequest('POST', '/register', 
    'username=<script>alert("xss")</script>&password=test123');
  
  if (xssAttempt.success) {
    console.log('⚠️ XSS ممکن است در صفحه نمایش داده شود');
  } else {
    console.log('✅ XSS مسدود شد');
  }
}

async function testSessionManagement() {
  console.log('\n=== تست مدیریت نشست ===');
  
  // Test 1: Session after logout
  console.log('1. تست نشست پس از خروج...');
  
  // Login first
  const login = await makeRequest('POST', '/login', 
    `username=${TEST_ACCOUNTS.admin.username}&password=${TEST_ACCOUNTS.admin.password}`);
  
  if (login.success) {
    // Logout
    const logout = await makeRequest('GET', '/logout');
    
    if (logout.success) {
      // Try to access protected route after logout
      const dashboardAfterLogout = await makeRequest('GET', '/dashboard');
      
      if (dashboardAfterLogout.status === 302) {
        console.log('✅ نشست پس از خروج باطل شد');
      } else {
        console.log('❌ نشست پس از خروج باطل نشد (مشکل امنیتی)');
      }
    }
  }
}

// Main test runner
async function runSecurityTests() {
  console.log('🔒 شروع تست‌های امنیتی Passport.js Demo');
  console.log('=====================================');
  
  try {
    await testAuthentication();
    await testAccessControl();
    await testAPIEndpoints();
    await testInputValidation();
    await testSessionManagement();
    
    console.log('\n✅ تمام تست‌های امنیتی تکمیل شد');
    console.log('\nنکته: این تست‌ها فقط نمونه‌ای از تست‌های امنیتی هستند.');
    console.log('برای تست‌های کامل‌تر از ابزارهای تخصصی استفاده کنید.');
    
  } catch (error) {
    console.error('❌ خطا در اجرای تست‌ها:', error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runSecurityTests();
}

module.exports = {
  testAuthentication,
  testAccessControl,
  testAPIEndpoints,
  testInputValidation,
  testSessionManagement,
  runSecurityTests
};