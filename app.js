const $=id=>document.getElementById(id);
const USER_KEY="ua_demo_user", SESSION_KEY="ua_demo_session";
function status(id,msg){const el=$(id);if(el)el.textContent=msg}
function goHome(){location.href="home.html"}
function getUser(){try{return JSON.parse(localStorage.getItem(USER_KEY)||"null")}catch{return null}}
function showLoginRequired(){
  const u=getUser();
  if(!u || localStorage.getItem(SESSION_KEY)!=="active"){
    alert("No estás registrado o no has iniciado sesión. Regístrate para acceder al portal. Si no eres estudiante, no podrás ingresar al área privada.");
    location.replace("index.html");return false;
  }
  return true;
}
// Protect all internal pages; index.html remains public.
if(["home.html","carreras.html","beneficios.html"].includes(location.pathname.split("/").pop())) showLoginRequired();

document.querySelectorAll(".tab").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b===btn));
  if($("login-panel")) $("login-panel").hidden=btn.dataset.tab!=="login";
  if($("register-panel")) $("register-panel").hidden=btn.dataset.tab!=="register";
}));
function secureContextCheck(){if(!window.isSecureContext||!navigator.credentials)throw new Error("Abre la web desde localhost o HTTPS en un navegador compatible.");}
async function registerPasskey(){
  secureContextCheck();
  if(!window.PublicKeyCredential||!navigator.credentials.create)throw new Error("Este navegador no admite passkeys.");
  const userName=$("reg-email").value.trim();if(!userName)throw new Error("Escribe tu correo antes de registrar la biometría.");
  const challenge=crypto.getRandomValues(new Uint8Array(32)),userId=crypto.getRandomValues(new Uint8Array(16));
  const credential=await navigator.credentials.create({publicKey:{challenge,rp:{name:"Universidad Autónoma del Perú",id:location.hostname},user:{id:userId,name:userName,displayName:$("full-name").value.trim()||userName},pubKeyCredParams:[{type:"public-key",alg:-7},{type:"public-key",alg:-257}],authenticatorSelection:{authenticatorAttachment:"platform",residentKey:"preferred",userVerification:"required"},timeout:60000,attestation:"none"}});
  localStorage.setItem("ua_demo_credential",JSON.stringify({id:credential.id,type:credential.type,created:true}));
  status("register-status","Passkey creada en este dispositivo. La verificación local puede usar huella, rostro o PIN.");
}
if($("passkey-register")) $("passkey-register").addEventListener("click",async()=>{try{status("register-status","Solicitando verificación segura…");await registerPasskey()}catch(e){status("register-status",e.message||"No se pudo registrar la passkey.")}});
if($("passkey-login")) $("passkey-login").addEventListener("click",async()=>{
  try{
    const user=getUser();if(!user)throw new Error("No estás registrado. Crea tu cuenta primero.");
    secureContextCheck();const saved=JSON.parse(localStorage.getItem("ua_demo_credential")||"null");
    if(!saved)throw new Error("No tienes una passkey registrada en este navegador. Regístrate primero o usa tu correo y contraseña.");
    const id=Uint8Array.from(atob(saved.id.replace(/-/g,"+").replace(/_/g,"/")),c=>c.charCodeAt(0));
    await navigator.credentials.get({publicKey:{challenge:crypto.getRandomValues(new Uint8Array(32)),allowCredentials:[{type:"public-key",id}],userVerification:"required",timeout:60000}});
    localStorage.setItem(SESSION_KEY,"active");status("login-status","Identificación completada. Abriendo el portal…");setTimeout(goHome,600);
  }catch(e){status("login-status",e.message||"No se pudo completar la identificación.")}
});
if($("voice-enroll")) $("voice-enroll").addEventListener("click",async()=>{
  try{
    if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)throw new Error("Tu navegador no permite grabar audio desde esta página.");
    const stream=await navigator.mediaDevices.getUserMedia({audio:true}),recorder=new MediaRecorder(stream),chunks=[];
    recorder.ondataavailable=e=>chunks.push(e.data);
    recorder.onstop=()=>{stream.getTracks().forEach(t=>t.stop());const blob=new Blob(chunks,{type:recorder.mimeType||"audio/webm"});localStorage.setItem("ua_voice_sample_saved","true");status("register-status",`Muestra de voz grabada (${Math.round(blob.size/1024)} KB). Esto no reconoce identidad; falta un servicio biométrico y servidor.`)};
    status("register-status","Grabando durante 5 segundos. Di una frase corta…");recorder.start();setTimeout(()=>{if(recorder.state==="recording")recorder.stop()},5000);
  }catch(e){status("register-status",e.message)}
});
if($("voice-login")) $("voice-login").addEventListener("click",()=>status("login-status","La identificación por voz aún no está habilitada: requiere proveedor biométrico y validación segura en servidor. Una grabación no demuestra identidad."));
if($("create-account")) $("create-account").addEventListener("click",()=>{
  const name=$("full-name").value.trim(),email=$("reg-email").value.trim().toLowerCase(),pass=$("reg-password").value;
  if(!name||!email||!pass){status("register-status","Completa tu nombre, correo y contraseña.");return}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){status("register-status","Escribe un correo válido.");return}
  if(pass.length<8){status("register-status","La contraseña debe tener al menos 8 caracteres.");return}
  const existing=getUser();if(existing && existing.email===email){status("register-status","Este correo ya está registrado. Inicia sesión.");return}
  localStorage.setItem(USER_KEY,JSON.stringify({name,email,password:pass}));
  localStorage.setItem(SESSION_KEY,"active");
  status("register-status","Cuenta de demostración creada. Entrando al portal…");setTimeout(goHome,700);
});
if($("demo-login")) $("demo-login").addEventListener("click",()=>{
  const user=getUser(),email=$("login-email").value.trim().toLowerCase(),pass=$("login-password").value;
  if(!user){status("login-status","No estás registrado. Crea una cuenta para ingresar. Si no eres estudiante, no podrás acceder al portal privado.");return}
  if(email!==user.email || pass!==user.password){status("login-status","Correo o contraseña incorrectos. Verifica tus datos o regístrate.");return}
  localStorage.setItem(SESSION_KEY,"active");status("login-status","Inicio de sesión correcto. Entrando…");setTimeout(goHome,500);
});
document.querySelectorAll(".logout").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();localStorage.removeItem(SESSION_KEY);location.href="index.html"}));
