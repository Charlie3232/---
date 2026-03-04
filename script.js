// 注意：請將此處替換為您正確部署的 GAS 網址
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwx2MaNqRJPhM_6avrcmP0iaiMyAv_fLbKKABg1MZNdmrCzSOKuTVlN437Kl0vmMXqS/exec'; 
let allIssues = [];
let dataConfig = {};
let isMutating = false; 
// 新增：儲存從試算表抓取的帳密清單
let userList = []; 
// 新增：記錄當前登入的使用者資訊
let currentUser = { id: "", name: "", role: "" };

let currentModalType = 'TS';

// 行事曆相關變數與 init 呼叫已移除

// 保持原樣
function fillFormSelect(id, list) {
  const el = document.getElementById(id);
  if(el && dataConfig[list]) {
    let options = dataConfig[list].map(t => `<option value="${t}">${t}</option>`);
    options.unshift('<option value="" disabled selected>請選擇...</option>');
    el.innerHTML = options.join('');
  }
}

// 改動：修改登入邏輯，吃試算表 JK 欄
function handleLogin() {
  const inputID = document.getElementById('login-user').value.trim();
  const inputPWD = document.getElementById('login-pwd').value.trim();
  
  if (!inputID || !inputPWD) { alert("請輸入識別碼與密碼"); return; }

  // 優先抓取基礎資料 (包含使用者清單)
  if (userList.length === 0) {
      alert("正在連線伺服器，請稍候再試或檢查網路...");
      return; 
  }

  // 尋對對應的使用者 (比對 ID 與 PWD)
  const user = userList.find(u => u.id === inputID && u.pwd === inputPWD);

  if (user) {
    // 登入成功
    currentUser = { 
        id: user.id, 
        name: user.name, 
        // 預設預設帳號 G0006 為主管帳號
        role: (user.id === "G0006" ? "MANAGER" : "USER") 
    };

    // 在 Header 顯示使用者名稱
    document.getElementById('current-username-display').innerText = currentUser.name;
    
    // 顯示主 UI
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('main-ui').style.display = 'block';

    // 權限控制
    if (currentUser.role === "MANAGER") {
        document.getElementById('btn-tab-main').style.display = 'block'; // 主管才顯示儀表板
        document.getElementById('btn-tab-manager').style.display = 'block';
    } else {
        document.getElementById('btn-tab-main').style.display = 'none';
        document.getElementById('btn-tab-manager').style.display = 'none';
    }

    // 初始化介面 (不包含日曆)
    initUI();
  } else { 
    alert("識別碼或密碼錯誤，存取拒絕"); 
  }
}

// 改動： init 拆分為二， fetchData 頁面載入即執行，initUI 登入後執行
async function fetchDataOnLoad() {
    try {
        const resp = await fetch(SCRIPT_URL + '?action=getData');
        const data = await resp.json();
        allIssues = data.issues || [];
        dataConfig = data.config || {};
        userList = data.users || []; // 從 GAS 取得使用者清單

        // 頁面未登入前不需 render，僅準備資料
    } catch (e) { console.error("Data fetch failed on load", e); }
}

// 頁面載入即抓取資料
window.onload = fetchDataOnLoad;

function initUI() {
  renderIssues();
  renderManagerIssues();
  // 行事曆 render 已移除
  renderStats();
  setInterval(silentSync, 30000); // 延長同步時間為 30秒
}

async function silentSync() {
  if (isMutating || document.getElementById('main-ui').style.display === 'none') return; 
  try {
    const resp = await fetch(SCRIPT_URL + '?action=getData');
    const data = await resp.json();
    if (isMutating) return; 
    allIssues = data.issues || [];
    // config 通常不變，不需頻繁更新
    renderIssues();
    renderManagerIssues();
    renderStats();
  } catch (e) { }
}

// 保持原樣 (顏色變更靠 CSS)
function switchTab(tabId) {
  document.querySelectorAll('.tab-section').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(tabId).style.display = 'block';
  document.getElementById('btn-' + tabId).classList.add('active');
  if(tabId === 'tab-main' && currentUser.role === "MANAGER") { renderStats(); }
}

document.addEventListener('click', function(e) {
  if (!e.target.matches('.select-selected')) {
    document.querySelectorAll('.select-items').forEach(el => el.style.display = 'none');
  }
});

function toggleDropdown(id, event) {
  event.stopPropagation();
  document.querySelectorAll('.select-items').forEach(el => { if(el.id !== id) el.style.display = 'none'; });
  const el = document.getElementById(id);
  el.style.display = el.style.display === 'block' ? 'none' : 'block';
}

const fillCheckboxes = (id, listKey, onChangeCode) => {
  const el = document.getElementById(id);
  if(el && dataConfig[listKey]) {
    let html = dataConfig[listKey].map(t => `<label class="checkbox-label" onclick="event.stopPropagation()"><input type="checkbox" value="${t}" onchange="${onChangeCode}"> ${t}</label>`).join('');
    el.innerHTML = html; // 每次直接覆蓋，確保資料準確
  }
};

function updateStatsStatusText() {
  const vals = getCheckedValues('stats-status');
  const txt = document.getElementById('stats-status-text');
  if (vals.length === 0) txt.innerText = "狀態: 全狀態 ▾";
  else txt.innerText = vals.length > 1 ? `狀態: 已選(${vals.length}) ▾` : `狀態: ${vals[0]} ▾`;
  renderStats();
}

// 改動： fetchData 邏輯調整，分離出 fillUI 邏輯
function fillUIConfigs() {
  // 行事曆 Category 已移除

  fillCheckboxes('items-owner', 'owners', 'renderIssues()');
  fillCheckboxes('items-status', 'statusList', 'renderIssues()');
  fillCheckboxes('items-customer', 'customers', 'renderIssues()');
  
  fillCheckboxes('items-status-mgr', 'statusList', 'renderManagerIssues()');
  fillCheckboxes('items-customer-mgr', 'customers', 'renderManagerIssues()');
  fillCheckboxes('stats-status', 'statusList', 'updateStatsStatusText()');
  
  fillFormSelect('input-owner', 'owners');
  fillFormSelect('input-status', 'statusList');
  fillFormSelect('input-customer', 'customers');
  // 改動：新增產品別(D欄)，專案別吃E欄
  fillFormSelect('input-product', 'products');
  fillFormSelect('input-project', 'projects');
}

// 原 fetchData 邏輯整併到 fetchDataOnLoad 與 handleLogin / initUI 中

const getCheckedValues = (id) => {
  return Array.from(document.querySelectorAll(`#${id} input[type="checkbox"]:checked`)).map(cb => cb.value);
};

// 行事曆相關函數已移除 (updateParticipantsText, toggleEndDate, getCategoryColor, changeCalendarWeek, parseDateSafe, renderCalendar, openEventModal, openEditEvent, closeEventModal, submitEvent, deleteEvent)

// ================= 負責人統計 =================
function renderStats() {
  const container = document.getElementById('stats-bars');
  const ownerCounts = {};
  let totalIssues = 0;

  const fStats = getCheckedValues('stats-status'); 
  const startMonth = document.getElementById('stats-month-start').value; 
  const endMonth = document.getElementById('stats-month-end').value;     

  allIssues.forEach(i => {
    if (i.id && String(i.id).startsWith('MGR-')) return;

    const stat = String(i.status);
    if(fStats.length > 0 && !fStats.includes(stat)) return; 
    
    let issueMonth = "";
    if (i.date) {
      let dParts = String(i.date).split(/[-/T ]/); 
      if (dParts.length >= 2) {
        issueMonth = `${dParts[0]}-${dParts[1].padStart(2, '0')}`;
      }
    }
    if (startMonth || endMonth) {
      if (!issueMonth) return; 
      if (startMonth && issueMonth < startMonth) return;
      if (endMonth && issueMonth > endMonth) return;
    }
    
    const owner = String(i.owner);
    if(!owner) return;
    ownerCounts[owner] = (ownerCounts[owner] || 0) + 1;
    totalIssues++;
  });

  if(totalIssues === 0) { container.innerHTML = "<p style='color:#888;'>此區間/狀態內沒有任務記錄。</p>"; return; }

  // 改動：統計圖表顏色維持原本列表，僅 CSS 變綠
  const colors = ['#0f0', '#ffeb3b', '#ff0055', '#a020f0', '#ff9800', '#00bcd4', '#00d2ff'];

  container.innerHTML = Object.keys(ownerCounts).sort((a,b) => ownerCounts[b] - ownerCounts[a]).map((owner, idx) => {
    const count = ownerCounts[owner];
    const pct = Math.round((count / totalIssues) * 100);
    const color = colors[idx % colors.length];
    return `
      <div class="stat-row">
        <div class="stat-label" title="${owner}">${owner}</div>
        <div class="stat-bar-bg">
          <div class="stat-bar-fill" style="width: ${pct}%; background: ${color};"></div>
          <div class="stat-value">${count} 件 (${pct}%)</div>
        </div>
      </div>
    `;
  }).join('');
}

// ================= 任務清單功能 =================

const isTaskUrgent = (deadlineStr, status) => {
  if (!deadlineStr || status === "已解決" || status === "Done") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let dParts = String(deadlineStr).split(/[-/T ]/);
  if(dParts.length < 3) return false;
  const deadline = new Date(dParts[0], dParts[1] - 1, dParts[2]);
  deadline.setHours(0, 0, 0, 0);
  
  const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 2; 
};

// 改動： render 邏輯中加入 product 顯示
function renderIssues() {
  const container = document.getElementById('issue-display');
  const search = document.getElementById('search-input').value.toLowerCase();
  const fOwners = getCheckedValues('items-owner');
  const fStats = getCheckedValues('items-status');
  const fCusts = getCheckedValues('items-customer');

  let filtered = allIssues.filter(i => 
    (!i.id || !String(i.id).startsWith('MGR-')) && 
    String(i.issue).toLowerCase().includes(search) &&
    (fOwners.length === 0 || fOwners.includes(String(i.owner))) &&
    (fStats.length === 0 ? (String(i.status) !== "已解決" && String(i.status) !== "Done") : fStats.includes(String(i.status))) &&
    (fCusts.length === 0 || fCusts.includes(String(i.customer)))
  ).sort((a, b) => {
    // 排序邏輯保持不變
    const statA = String(a.status);
    const statB = String(b.status);
    const isDoneA = (statA === "已解決" || statA === "Done");
    const isDoneB = (statB === "已解決" || statB === "Done");
    if (isDoneA !== isDoneB) return isDoneA ? 1 : -1;
    
    const urgentA = isTaskUrgent(a.deadline, statA);
    const urgentB = isTaskUrgent(b.deadline, statB);
    if (urgentA !== urgentB) return urgentA ? -1 : 1;

    const priA = String(a.priority);
    const priB = String(b.priority);
    const isHighA = priA.includes('高') || priA.includes('Critical');
    const isHighB = priB.includes('高') || priB.includes('Critical');
    if (isHighA !== isHighB) return isHighA ? -1 : 1;
    
    return new Date(b.date) - new Date(a.date);
  });

  container.innerHTML = filtered.map(i => {
    const stat = String(i.status);
    const isDone = (stat === "已解決" || stat === "Done");
    const urgentClass = (!isDone && isTaskUrgent(i.deadline, stat)) ? 'urgent-card' : '';
    
    return `<div class="pebble ${isDone ? 'resolved-card' : ''} ${urgentClass}" onclick="openEdit('${i.id}')">
      <div style="font-size:12px; margin-bottom:8px; color:${(String(i.priority).includes('高') || String(i.priority).includes('Critical')) ? '#ff0055' : 'var(--pixel-green)'}">[ ${stat} ]</div>
      <div style="font-size:22px; margin-bottom:12px; line-height:1.3;">${i.issue}</div>
      <div style="font-size:14px; color:#888;">${i.owner} | ${i.customer} | ${i.product}<br><small>建立: ${i.date} | 預計: ${i.deadline || '未定'}</small></div>
    </div>`;
  }).join('');
}

// 主管清單 render (保持原樣，product 不顯示在縮圖)
function renderManagerIssues() {
  const container = document.getElementById('manager-issue-display');
  const search = document.getElementById('search-input-mgr').value.toLowerCase();
  const fStats = getCheckedValues('items-status-mgr');
  const fCusts = getCheckedValues('items-customer-mgr');

  let filtered = allIssues.filter(i => 
    i.id && String(i.id).startsWith('MGR-') && 
    String(i.issue).toLowerCase().includes(search) &&
    (fStats.length === 0 ? (String(i.status) !== "已解決" && String(i.status) !== "Done") : fStats.includes(String(i.status))) &&
    (fCusts.length === 0 || fCusts.includes(String(i.customer)))
  ).sort((a, b) => {
     // 排序邏輯維持原本
    const statA = String(a.status);
    const statB = String(b.status);
    const isDoneA = (statA === "已解決" || statA === "Done");
    const isDoneB = (statB === "已解決" || statB === "Done");
    if (isDoneA !== isDoneB) return isDoneA ? 1 : -1;
    
    const urgentA = isTaskUrgent(a.deadline, statA);
    const urgentB = isTaskUrgent(b.deadline, statB);
    if (urgentA !== urgentB) return urgentA ? -1 : 1;

    const priA = String(a.priority);
    const priB = String(b.priority);
    const isHighA = priA.includes('高') || priA.includes('Critical');
    const isHighB = priB.includes('高') || priB.includes('Critical');
    if (isHighA !== isHighB) return isHighA ? -1 : 1;
    
    return new Date(b.date) - new Date(a.date);
  });

  container.innerHTML = filtered.map(i => {
    const stat = String(i.status);
    const isDone = (stat === "已解決" || stat === "Done");
    const urgentClass = (!isDone && isTaskUrgent(i.deadline, stat)) ? 'urgent-card' : '';
    
    return `<div class="pebble ${isDone ? 'resolved-card' : ''} ${urgentClass}" onclick="openEdit('${i.id}')">
      <div style="font-size:12px; margin-bottom:8px; color:${(String(i.priority).includes('高') || String(i.priority).includes('Critical')) ? '#ff0055' : 'var(--pixel-green)'}">[ ${stat} ]</div>
      <div style="font-size:22px; margin-bottom:12px; line-height:1.3;">${i.issue}</div>
      <div style="font-size:14px; color:#888;">${i.owner} | ${i.customer} | ${i.project}<br><small>建立: ${i.date} | 預計: ${i.deadline || '未定'}</small></div>
    </div>`;
  }).join('');
}

function openModal(type = 'TS') {
  currentModalType = type; 
  
  // 改動：載入配置 (移到這裡，確保每次開啟都最新)
  fillUIConfigs();

  document.getElementById('edit-id').value = "";
  document.getElementById('issueForm').reset();
  document.getElementById('link-group').innerHTML = '<input type="text" class="pixel-input wide link-entry" placeholder="https://...">';
  document.getElementById('input-created-date').value = new Date().toLocaleDateString('zh-TW');
  
  // 改動：新增建立者 (吃目前使用者)
  document.getElementById('input-creator').value = currentUser.name;

  document.getElementById('modal-title').innerText = type === 'MGR' ? 'MANAGER_AFFAIRS_V7.0' : 'TASK_CONFIGURATION_V7.0';
  
  const ownerSelect = document.getElementById('input-owner');
  if (type === 'MGR') {
      ownerSelect.innerHTML = `<option value="${currentUser.name}" selected>${currentUser.name}</option>`;
      ownerSelect.disabled = true;
  } else {
      fillFormSelect('input-owner', 'owners');
      ownerSelect.disabled = false;
  }

  const btn = document.getElementById('submit-btn');
  btn.innerText = "[ 建立完成 ]";
  btn.disabled = false;
  
  document.getElementById('btn-delete').style.display = 'none'; 
  document.getElementById('modal-overlay').style.display = 'flex';
}

function openEdit(id) {
  // 改動：載入配置
  fillUIConfigs();

  const i = allIssues.find(x => x.id === id);
  if(!i) return;
  
  currentModalType = String(id).startsWith('MGR-') ? 'MGR' : 'TS';
  document.getElementById('modal-title').innerText = currentModalType === 'MGR' ? 'MANAGER_AFFAIRS_V7.0' : 'TASK_CONFIGURATION_V7.0';

  document.getElementById('edit-id').value = i.id;
  document.getElementById('input-issue').value = i.issue;
  
  const setSelectSafe = (id, val) => {
    const el = document.getElementById(id);
    if(!el) return;
    el.value = val;
    if(!el.value) {
      if(id === 'input-priority' && val) {
        if(val.includes('高') || val.includes('Critical')) el.value = "1_高";
        else if(val.includes('低') || val.includes('Low')) el.value = "3_低";
        else el.value = "2_一般";
      } else el.value = "";
    }
  };

  const ownerSelect = document.getElementById('input-owner');
  if (currentModalType === 'MGR') {
      ownerSelect.innerHTML = `<option value="${i.owner}" selected>${i.owner}</option>`;
      ownerSelect.disabled = true;
  } else {
      fillFormSelect('input-owner', 'owners');
      ownerSelect.disabled = false;
      setSelectSafe('input-owner', i.owner);
  }

  setSelectSafe('input-status', i.status);
  setSelectSafe('input-customer', i.customer);
  // 改動：填充 product/project
  setSelectSafe('input-product', i.product);
  setSelectSafe('input-project', i.project);
  setSelectSafe('input-priority', i.priority);
  
  let safeDeadline = i.deadline || "";
  if(safeDeadline.includes('/')) safeDeadline = safeDeadline.replace(/\//g, '-');
  document.getElementById('input-deadline').value = safeDeadline;
  
  document.getElementById('input-description').value = i.description || "";
  document.getElementById('input-records').value = i.records || "";
  document.getElementById('input-created-date').value = i.date;
  
  // 改動：顯示紀錄上的建立者
  document.getElementById('input-creator').value = i.creator || "未知";

  const btn = document.getElementById('submit-btn');
  btn.innerText = "[ 編輯完成 ]";
  btn.disabled = false;
  
  document.getElementById('btn-delete').style.display = 'inline-block'; 

  const linkGroup = document.getElementById('link-group');
  linkGroup.innerHTML = "";
  (i.link || "").split(' | ').forEach(url => {
    if(!url) return;
    const input = document.createElement('input');
    input.className = "pixel-input wide link-entry"; input.value = url; input.style.marginTop = "10px";
    linkGroup.appendChild(input);
  });
  if(!linkGroup.innerHTML) addLinkField();
  document.getElementById('modal-overlay').style.display = 'flex';
}

function addLinkField() {
  const input = document.createElement('input');
  input.className = "pixel-input wide link-entry"; input.style.marginTop = "10px";
  document.getElementById('link-group').appendChild(input);
}
function closeModal() { 
  document.getElementById('modal-overlay').style.display = 'none'; 
  document.getElementById('submit-btn').disabled = false;
}

async function deleteIssue() {
  // 原本刪除邏輯硬編碼密碼，保留原本邏輯，僅顏色隨 CSS 變綠
  const pwd = prompt("請輸入確認刪除咒語:");
  // 注意：這裡仍硬編碼舊密碼，若要隨登入帳號變更，需改成 currentUser.role === 'MANAGER' 判斷，但您要求其餘不變，故保留。
  if (pwd !== "13091309" && pwd !== "13321332") { alert("咒語錯誤，取消刪除"); return; }
  const issueId = document.getElementById('edit-id').value;
  if (!issueId) return;
  allIssues = allIssues.filter(issue => issue.id !== issueId);
  renderIssues(); renderManagerIssues(); renderStats(); closeModal();
  
  isMutating = true;
  try { await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: "delete", id: issueId }) }); } catch(err) {}
  isMutating = false;
}

async function submitIssue() {
  const form = document.getElementById('issueForm');
  if (!form.checkValidity()) { form.reportValidity(); return; }
  
  const btn = document.getElementById('submit-btn');
  btn.innerText = "[ 同步中... ]"; 
  btn.disabled = true;
  
  const linkVal = Array.from(document.querySelectorAll('.link-entry')).map(el => el.value).filter(v => v).join(' | ');
  const isEdit = document.getElementById('edit-id').value !== "";
  
  const prefix = currentModalType === 'MGR' ? 'MGR-' : 'TS-';
  const issueId = document.getElementById('edit-id').value || prefix + Date.now();

  let finalOwner = document.getElementById('input-owner').value;
  // 主管事務 Owner 維持原本邏輯

  // 改動：Payload 加入 product 與 creator
  const payload = {
    action: isEdit ? "edit" : "add", id: issueId, issue: document.getElementById('input-issue').value,
    owner: finalOwner, status: document.getElementById('input-status').value,
    customer: document.getElementById('input-customer').value, 
    product: document.getElementById('input-product').value, // 新增
    project: document.getElementById('input-project').value,
    date: document.getElementById('input-created-date').value, deadline: document.getElementById('input-deadline').value,
    priority: document.getElementById('input-priority').value, description: document.getElementById('input-description').value,
    records: document.getElementById('input-records').value, link: linkVal,
    creator: document.getElementById('input-creator').value // 新增
  };

  if (isEdit) {
    const idx = allIssues.findIndex(x => x.id === issueId);
    if (idx > -1) allIssues[idx] = payload;
  } else { allIssues.push(payload); }
  
  renderIssues(); renderManagerIssues(); renderStats(); closeModal();

  isMutating = true;
  try { await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) }); } catch (e) { console.error(e); }
  isMutating = false;
  
  btn.innerText = isEdit ? "[ 編輯完成 ]" : "[ 建立完成 ]";
  btn.disabled = false;
}

