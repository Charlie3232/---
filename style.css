@font-face { font-family: 'Cubic11'; src: url('https://cdn.jsdelivr.net/gh/ACh-K/Cubic-11@main/fonts/ttf/Cubic_11.ttf') format('truetype'); }
:root {
  --main-font: 'Cubic11', sans-serif;
  --bg-color: #051405; 
  --navy-dark: #070d1f;
  --pixel-green: #00ff41;
  --pixel-text-green: #0f0;
  --dark-green-label: #1a5c1a; 
  --mgr-pink: #ffb7c5; 
}
body { background: var(--bg-color); color: #fff; font-family: var(--main-font); margin: 0; overflow-x: hidden; position: relative; }
.watermark { position: fixed; bottom: 20px; right: 20px; font-size: 70px; color: rgba(0, 255, 65, 0.04); z-index: -1; pointer-events: none; font-weight: bold; }

/* 登入介面樣式 */
#login-overlay { position: fixed; inset: 0; background: #000; display: flex; justify-content: center; align-items: center; z-index: 10000; }
.login-card { padding: 50px; border: 6px solid var(--pixel-green); background: #111; text-align: center; box-shadow: 10px 10px 0 #000; max-width: 450px; }
.btn-login-giant { width: 100%; padding: 20px 0 !important; font-size: 22px !important; margin-top: 20px; border-width: 6px !important; cursor: pointer; }

/* 儀表板排版：並列顯示 */
.dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.stats-header-wrap { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #285428; padding-bottom: 10px; margin-bottom: 15px; }
.mini-date { width: 130px !important; font-size: 12px !important; padding: 5px !important; }

/* 樣式標籤 */
.label-dark-green { color: var(--dark-green-label) !important; font-weight: bold; }
.navy-theme { background: var(--navy-dark) !important; border: 6px solid var(--pixel-green) !important; }

/* 主管專用樣式 */
.panel-manager { border: 2px solid var(--mgr-pink) !important; }
.btn-manager-pink { background: var(--mgr-pink) !important; color: #000 !important; border-color: #fff !important; }
.modal-manager-pink { border: 6px solid var(--mgr-pink) !important; }
.modal-manager-pink .modal-header-bar { background: var(--mgr-pink) !important; color: #000 !important; }

header { display: flex; justify-content: space-between; align-items: center; width: 95%; max-width: 1600px; margin: 0 auto; padding: 15px 10px; border-bottom: 3px solid var(--pixel-green); }
.user-display { border: 2px solid var(--pixel-green); padding: 5px 15px; background: rgba(0,255,65,0.1); font-size: 14px; }

.pixel-input { background: rgba(0,0,0,0.8); border: 4px solid #3e4a6d; color: var(--pixel-text-green); padding: 12px; font-family: var(--main-font); font-size: 18px; width: 100%; box-sizing: border-box; outline: none; }
.mini-search { width: 130px !important; font-size: 14px; }

.layout-container { display: flex; height: calc(100vh - 85px); width: 95%; max-width: 1600px; margin: 0 auto; gap: 20px; padding: 20px 0; }
.sidebar { width: 180px; background: rgba(0,0,0,0.5); padding: 20px; display: flex; flex-direction: column; gap: 15px; }
.nav-btn { background: #111; color: var(--pixel-green); border: 4px solid #3e4a6d; padding: 15px 10px; cursor: pointer; text-align: center; font-family: var(--main-font); }
.nav-btn.active { background: var(--pixel-green); color: #000; border-color: #fff; }

.todo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.pebble { background: #111; border: 4px solid #fff; padding: 25px; min-height: 180px; cursor: pointer; text-align: center; border-color: #285428; }
.urgent-card { background: rgba(255, 0, 85, 0.15) !important; border-color: #ff0055 !important; box-shadow: inset 0 0 15px #ff0055; }

/* 統計圖樣式 */
.stat-row { display: flex; align-items: center; margin-bottom: 12px; gap: 10px; }
.stat-label { width: 100px; font-size: 12px; color: var(--pixel-green); text-overflow: ellipsis; overflow: hidden; white-space: nowrap; }
.stat-bar-bg { flex: 1; background: #000; border: 1px solid #285428; height: 24px; position: relative; }
.stat-bar-fill { height: 100%; transition: width 0.6s ease; }
.stat-value { position: absolute; right: 5px; top: 4px; font-size: 10px; color: #fff; text-shadow: 1px 1px 0 #000; }

.record-item-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.record-chk { width: 22px; height: 22px; accent-color: var(--pixel-green); }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.9); display: none; justify-content: center; align-items: center; z-index: 1000; }
.pixel-modal { width: 96vw; height: 92vh; background: var(--navy-dark); overflow: hidden; display: flex; flex-direction: column; }
.modal-header-bar { background: var(--pixel-green); color: #000; padding: 15px 30px; display: flex; justify-content: space-between; font-weight: bold; }
.modal-body { padding: 30px; overflow-y: auto; flex: 1; }

.mini-plus-btn { background: var(--pixel-green); color: #000; border: none; padding: 2px 8px; cursor: pointer; font-family: var(--main-font); margin-left: 10px; }
.scroll::-webkit-scrollbar { width: 8px; }
.scroll::-webkit-scrollbar-thumb { background: #285428; border-radius: 4px; }

@media (max-width: 1100px) {
  .dashboard-grid { grid-template-columns: 1fr; }
}
@media (max-width: 850px) {
  .layout-container { flex-direction: column; }
  .sidebar { width: 100%; flex-direction: row; padding: 10px; border-bottom: 4px solid #3e4a6d; overflow-x: auto; flex-wrap: nowrap; }
  .nav-btn { flex: 0 0 auto; margin: 0 5px; min-width: 80px; }
  .todo-grid { grid-template-columns: 1fr; }
}
