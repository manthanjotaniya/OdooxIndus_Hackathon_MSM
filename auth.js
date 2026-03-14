// Simple client-side auth simulation using localStorage + sessionStorage OTP

function getUsers(){
  try { return JSON.parse(localStorage.getItem('ci_users')||'[]'); } catch(e){ return []; }
}

function saveUsers(users){ localStorage.setItem('ci_users', JSON.stringify(users)); }

function signupHandler(e){
  e.preventDefault();
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim().toLowerCase();
  const pass = document.getElementById('signupPassword').value;
  const pass2 = document.getElementById('signupPassword2').value;
  const msg = document.getElementById('signupMessage');
  if (!name || !email || !pass) { msg.textContent='Please fill all fields'; return; }
  if (pass !== pass2) { msg.textContent='Passwords do not match'; return; }
  const users = getUsers();
  if (users.find(u=>u.email===email)) { msg.textContent='Account already exists'; return; }
  users.push({name, email, pass});
  saveUsers(users);
  msg.textContent = 'Account created. Redirecting to login...';
  setTimeout(()=> window.location.href='login.html', 1000);
}

function loginHandler(e){
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const pass = document.getElementById('loginPassword').value;
  const msg = document.getElementById('loginMessage');
  // UI: show loading
  msg.innerHTML = '<span class="spinner"></span> Signing in...';
  disableForm('loginForm', true);
  const users = getUsers();
  const user = users.find(u=>u.email===email && u.pass===pass);
  if (!user) { msg.textContent='Invalid credentials'; disableForm('loginForm', false); return; }
  // generate OTP and store pending user
  const otp = generateOTP();
  sessionStorage.setItem('ci_pending', JSON.stringify({email:user.email,name:user.name}));
  sessionStorage.setItem('ci_otp', otp);
  // simulate sending (for dev we reveal it)
  console.log('DEV OTP for', email, otp);
  // redirect to OTP page
  // remember email if requested
  const remember = document.getElementById('rememberMe')?.checked;
  if (remember) localStorage.setItem('ci_remember_email', email); else localStorage.removeItem('ci_remember_email');
  setTimeout(()=> window.location.href = 'otp.html', 400);
}

function generateOTP(){
  return Math.floor(100000 + Math.random()*900000).toString();
}

function verifyOTP(code){
  const expected = sessionStorage.getItem('ci_otp');
  const msg = document.getElementById('otpMessage');
  if (!expected) { msg.textContent='No OTP found. Try login again.'; return false; }
  if (code === expected) {
    const pending = JSON.parse(sessionStorage.getItem('ci_pending')||'null');
    sessionStorage.removeItem('ci_otp');
    sessionStorage.setItem('ci_auth', JSON.stringify(pending));
    return true;
  }
  msg.textContent='Invalid code';
  return false;
}

function disableForm(formId, disabled){
  const form = document.getElementById(formId);
  if (!form) return;
  Array.from(form.elements).forEach(el=>el.disabled = disabled);
}

// Resend OTP: regenerate and return true if sent
function resendOTP(){
  const pending = JSON.parse(sessionStorage.getItem('ci_pending')||'null');
  if (!pending) return false;
  const otp = generateOTP();
  sessionStorage.setItem('ci_otp', otp);
  console.log('DEV Resent OTP for', pending.email, otp);
  const devOtpEl = document.getElementById('devOtp'); if (devOtpEl) devOtpEl.textContent = 'DEV OTP: ' + otp;
  const msg = document.getElementById('otpMessage'); if (msg) msg.textContent = 'OTP resent';
  return true;
}

// Expose resendOTP globally for otp.html
window.resendOTP = resendOTP;

// Expose functions for pages
window.signupHandler = signupHandler;
window.loginHandler = loginHandler;
window.verifyOTP = verifyOTP;
