const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzByMLLdHFcDi3tPNQ3tfeNGpoKF0XtDTkj0MLxWrNpjweB-zRbjSG2KxdunwAzADiE/exec'; 
let allIssues = [];
let dataConfig = {};
let userList = []; 
let currentUser = { id: "", name: "", role: "" };
window.currentType = 'TS'; // 預設初始化

async function handleLogin() {
  const id = document.getElementById('login-user').value.trim();
  const pwd = document.getElementById('login-pwd').value.trim();
  
  if (userList.length === 0) await fetchBaseData();

  const user = userList.find(u => u.id === id && u.pwd === pwd);
  
  if (user) {
    currentUser = { id: user.id, name: user.name, role: (user.id === "G0006" ? "MANAGER" : "USER") };
    document.getElementById('current-username').innerText = currentUser.name;
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('main-ui').style.display = 'block';
    
    if (currentUser.role === "MANAGER") {
      document.getElementById('btn-tab-main').style.display = 'block';
      document.getElementById('btn-tab-manager').style.display = 'block';
    }
    init();
  } else {
    alert("驗證失敗：識別碼或密碼錯誤 (´;ω;`) ");
  }
}

async function fetchBaseData() {
  const resp = await fetch(SCRIPT_URL + '?action=getData');
  const data = await resp.json();
  allIssues = data.issues || [];
  dataConfig = data.config || {};
  userList = data.users || [];
}

async function init() {
  // 填充下拉選單
  fillFormSelect('input-owner', 'owners');
  fillFormSelect('input-status', 'statusList');
  fillFormSelect('input-customer', 'customers');
  fillFormSelect('input-product', 'products');
  fillFormSelect('input-project', 'projects');
  
  renderIssues();
  renderManagerIssues();
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-section').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(tabId).style.display = 'block';
  document.getElementById('btn-' + tabId).classList.add('active');
}

function openModal(type) {
  window.currentType = type; // 確保點擊按鈕時有賦值
  document.getElementById('issueForm').reset();
  document.getElementById('edit-id').value = "";
  document.getElementById('input-creator').value = currentUser.name;
  document.getElementById('modal-title').innerText = (type === 'MGR' ? '✿ 主管事務編輯' : '✿ 任務資料編輯');
  document.getElementById('modal-overlay').style.display = 'flex';
  document.getElementById('btn-delete').style.display = 'none';
}

function closeModal() { document.getElementById('modal-overlay').style.display = 'none'; }

function openEdit(id) {
  const i = allIssues.find(x => x.id === id);
  if(!i) return;
  openModal(id.startsWith('MGR-') ? 'MGR' : 'TS');
  document.getElementById('edit-id').value = i.id;
  document.getElementById('input-issue').value = i.issue;
  document.getElementById('input-owner').value = i.owner;
  document.getElementById('input-status').value = i.status;
  document.getElementById('input-customer').value = i.customer;
  document.getElementById('input-product').value = i.product;
  document.getElementById('input-project').value = i.project;
  document.getElementById('input-deadline').value = i.deadline;
  document.getElementById('input-description').value = i.description;
  document.getElementById('input-records').value = i.records;
  document.getElementById('input-creator').value = i.creator || 'SYSTEM';
  document.getElementById('btn-delete').style.display = 'block';
}

async function submitIssue() {
  const btn = document.getElementById('submit-btn');
  btn.innerText = "傳送中..."; btn.disabled = true;
  
  const isEdit = document.getElementById('edit-id').value !== "";
  const issueId = document.getElementById('edit-id').value || (window.currentType === 'MGR' ? 'MGR-' : 'TS-') + Date.now();
  
  const payload = {
    action: isEdit ? "edit" : "add",
    id: issueId,
    issue: document.getElementById('input-issue').value,
    owner: document.getElementById('input-owner').value,
    status: document.getElementById('input-status').value,
    customer: document.getElementById('input-customer').value,
    product: document.getElementById('input-product').value,
    project: document.getElementById('input-project').value,
    deadline: document.getElementById('input-deadline').value,
    description: document.getElementById('input-description').value,
    records: document.getElementById('input-records').value,
    creator: document.getElementById('input-creator').value,
    date: new Date().toLocaleDateString('zh-TW')
  };

  try {
    await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) });
    alert("資料已安全存檔！(•ө•)♡");
    location.reload(); 
  } catch (e) {
    alert("發生錯誤，請聯絡管理員");
    btn.disabled = false;
  }
}

// 其餘輔助函數 (renderIssues, fillFormSelect, etc.) 維持不變...
function renderIssues() {
  const container = document.getElementById('issue-display');
  const search = document.getElementById('search-input').value.toLowerCase();
  let filtered = allIssues.filter(i => !i.id.startsWith('MGR-') && i.issue.toLowerCase().includes(search));
  container.innerHTML = filtered.map(i => `<div class="pebble" onclick="openEdit('${i.id}')">
    <div style="font-size:11px; color:var(--accent-green); margin-bottom:8px;">[ ${i.status} ]</div>
    <div style="font-weight:bold; margin-bottom:10px;">${i.issue}</div>
    <div style="font-size:12px; color:#888;">負責: ${i.owner} | 客戶: ${i.customer}</div>
  </div>`).join('');
}
function renderManagerIssues() {
  const container = document.getElementById('manager-issue-display');
  if(!container) return;
  let filtered = allIssues.filter(i => i.id.startsWith('MGR-'));
  container.innerHTML = filtered.map(i => `<div class="pebble" onclick="openEdit('${i.id}')">
    <div style="font-weight:bold;">${i.issue}</div>
    <div style="font-size:12px; color:#888;">${i.status}</div>
  </div>`).join('');
}
function fillFormSelect(id, listKey) {
  const el = document.getElementById(id);
  if(el && dataConfig[listKey]) {
    el.innerHTML = '<option value="" disabled selected>請選擇...</option>' + 
      dataConfig[listKey].map(t => `<option value="${t}">${t}</option>`).join('');
  }
}
function toggleDropdown(id, event) {
    event.stopPropagation();
    const el = document.getElementById(id);
    el.style.display = el.style.display === 'block' ? 'none' : 'block';
}

