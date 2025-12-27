const API_BASE = "/api";

let authToken = window.localStorage.getItem("authToken") || null;
let currentUser = null;
let currentFamily = null;

function setAuthToken(token) {
  authToken = token;
  if (token) {
    window.localStorage.setItem("authToken", token);
  } else {
    window.localStorage.removeItem("authToken");
  }
}

function buildHeaders(isJson) {
  const headers = {};
  if (isJson) {
    headers["Content-Type"] = "application/json";
  }
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  return headers;
}

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: buildHeaders(false)
  });
  if (!res.ok) throw new Error(`GET ${path} failed`);
  return res.json();
}

async function apiPost(path, payload) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: buildHeaders(true),
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`POST ${path} failed`);
  return res.json();
}

async function apiDelete(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: buildHeaders(false)
  });
  if (!res.ok) throw new Error(`DELETE ${path} failed`);
  try {
    return await res.json();
  } catch {
    return {};
  }
}

// =======================
// 导航切换
// =======================

function initNav() {
  const navItems = document.querySelectorAll(".nav-item");
  const sections = document.querySelectorAll(".section");

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const targetId = item.getAttribute("data-section");
      navItems.forEach((i) => i.classList.remove("active"));
      item.classList.add("active");

      sections.forEach((sec) => {
        sec.classList.toggle("active", sec.id === targetId);
      });
    });
  });
}

// =======================
// 账号与家庭模块
// =======================

function initAccountForms() {
  const formRegisterAdmin = document.getElementById("form-register-admin");
  const formLogin = document.getElementById("form-login");
  const formAddMember = document.getElementById("form-add-member");
  const btnRefreshAccount = document.getElementById("btn-refresh-account");
  const btnLogout = document.getElementById("btn-logout");

  if (formRegisterAdmin) {
    formRegisterAdmin.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(formRegisterAdmin);
      const payload = Object.fromEntries(formData.entries());
      payload.role = "admin";
      try {
        const result = await apiPost("/auth/register", payload);
        setAuthToken(result.token);
        currentUser = result.user;
        currentFamily = result.family || null;
        formRegisterAdmin.reset();
        alert("家庭管理员注册成功，并已自动登录");
        refreshAccountInfo();
      } catch (err) {
        console.error(err);
        alert("管理员注册失败，请检查输入信息");
      }
    });
  }

  if (formLogin) {
    formLogin.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(formLogin);
      const payload = Object.fromEntries(formData.entries());
      try {
        const result = await apiPost("/auth/login", payload);
        setAuthToken(result.token);
        currentUser = result.user;
        currentFamily = result.family || null;
        alert("登录成功");
        refreshAccountInfo();
      } catch (err) {
        console.error(err);
        alert("登录失败，请检查邮箱或密码");
      }
    });
  }

  if (formAddMember) {
    formAddMember.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!currentFamily || !currentUser || currentUser.role !== "admin") {
        alert("仅家庭管理员可以邀请成员");
        return;
      }
      const formData = new FormData(formAddMember);
      const payload = Object.fromEntries(formData.entries());
      try {
        await apiPost(`/families/${currentFamily.id}/members`, payload);
        formAddMember.reset();
        alert("成员已创建，可通过邮箱密码登录");
        refreshAccountInfo();
      } catch (err) {
        console.error(err);
        alert("邀请成员失败，请查看控制台日志");
      }
    });
  }

  if (btnRefreshAccount) {
    btnRefreshAccount.addEventListener("click", () => {
      refreshAccountInfo();
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener("click", () => {
      setAuthToken(null);
      currentUser = null;
      currentFamily = null;
      refreshAccountInfo();
    });
  }
}

async function refreshAccountInfo() {
  const userInfoEl = document.getElementById("account-user-info");
  const familyInfoEl = document.getElementById("account-family-info");
  const membersTbody = document.getElementById("table-family-members");

  if (!userInfoEl || !familyInfoEl || !membersTbody) return;

  if (!authToken) {
    userInfoEl.textContent = "尚未登录";
    familyInfoEl.textContent = "";
    membersTbody.innerHTML = "";
    return;
  }

  try {
    const me = await apiGet("/auth/me");
    currentUser = me.user;
    currentFamily = me.family || null;
    if (currentUser) {
      userInfoEl.textContent = `当前用户：${currentUser.email}（${currentUser.role}）`;
    } else {
      userInfoEl.textContent = "尚未登录";
    }
  } catch (e) {
    console.error(e);
    setAuthToken(null);
    currentUser = null;
    currentFamily = null;
    userInfoEl.textContent = "登录状态已失效，请重新登录";
    familyInfoEl.textContent = "";
    membersTbody.innerHTML = "";
    return;
  }

  if (!currentFamily) {
    familyInfoEl.textContent = "尚未加入任何家庭";
    membersTbody.innerHTML = "";
    return;
  }

  try {
    const fam = await apiGet("/families/me");
    currentFamily = fam.family;
    const members = fam.members || [];
    familyInfoEl.textContent = `家庭：${currentFamily.name}（ID: ${currentFamily.id}）`;
    membersTbody.innerHTML = "";

    members.forEach((m) => {
      const tr = document.createElement("tr");
      const isSelf = currentUser && m.id === currentUser.id;
      const actionHtml = !currentUser || currentUser.role !== "admin" || isSelf
        ? "—"
        : `<button class="btn-secondary btn-kick" data-id="${m.id}">踢出</button>`;
      tr.innerHTML = `
        <td>${m.email}</td>
        <td>${m.role}</td>
        <td>${actionHtml}</td>
      `;
      membersTbody.appendChild(tr);
    });

    const kickButtons = membersTbody.querySelectorAll(".btn-kick");
    kickButtons.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const targetId = btn.getAttribute("data-id");
        if (!currentFamily || !currentUser || currentUser.role !== "admin") {
          alert("仅家庭管理员可以踢出成员");
          return;
        }
        if (!confirm("确定要将该成员移出家庭吗？")) return;
        try {
          await apiDelete(`/families/${currentFamily.id}/members/${targetId}`);
          refreshAccountInfo();
        } catch (err) {
          console.error(err);
          alert("踢出成员失败");
        }
      });
    });
  } catch (e) {
    console.error(e);
  }
}

// =======================
// 资产模块
// =======================

async function refreshAssets() {
  try {
    const tbody = document.getElementById("table-assets-body");
    const selectResaleAsset = document.getElementById("select-resale-asset");
    tbody.innerHTML = "";
    selectResaleAsset.innerHTML =
      '<option value="">请选择已录入的资产</option>';

    const data = await apiGet("/assets");
    data.forEach((asset) => {
      const tr = document.createElement("tr");
      const warrantyInfo = asset.warrantyInfo;
      let statusHtml = "<span class='pill'>无保修信息</span>";
      if (warrantyInfo) {
        let badgeClass = "badge-green";
        if (warrantyInfo.daysLeft < 0) badgeClass = "badge-red";
        else if (warrantyInfo.daysLeft <= 7) badgeClass = "badge-amber";
        statusHtml = `<span class="pill ${badgeClass}">剩余 ${warrantyInfo.daysLeft} 天</span><br/><span class="hint">至 ${warrantyInfo.warrantyEndDate}</span>`;
      }

      tr.innerHTML = `
        <td>${asset.name || "-"}</td>
        <td>${asset.model || "-"}</td>
        <td>${asset.purchaseDate || "-"}</td>
        <td>${asset.purchasePrice || "-"}</td>
        <td>${statusHtml}</td>
        <td>
          <button class="btn-secondary btn-resale" data-id="${asset.id}">残值</button>
        </td>
      `;
      tbody.appendChild(tr);

      const option = document.createElement("option");
      option.value = asset.id;
      option.textContent = asset.name || asset.model || `资产 #${asset.id}`;
      selectResaleAsset.appendChild(option);
    });

    updateRiskSummary();
  } catch (e) {
    console.error(e);
  }
}

function initAssetForm() {
  const form = document.getElementById("form-asset");
  const btnRefresh = document.getElementById("btn-refresh-assets");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    if (payload.warrantyMonths) {
      payload.warrantyMonths = Number(payload.warrantyMonths);
    }
    try {
      await apiPost("/assets", payload);
      form.reset();
      refreshAssets();
    } catch (err) {
      console.error(err);
      alert("保存资产失败，请查看控制台日志");
    }
  });

  btnRefresh.addEventListener("click", () => refreshAssets());
}

// =======================
// 订阅模块
// =======================

async function refreshSubscriptions() {
  try {
    const tbody = document.getElementById("table-subscriptions-body");
    const statContainer = document.getElementById("subscription-stats");
    tbody.innerHTML = "";
    statContainer.innerHTML = "";

    const list = await apiGet("/subscriptions");
    const summary = await apiGet("/subscriptions/summary");

    list.forEach((s) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${s.name}</td>
        <td>${s.category || "-"}</td>
        <td>${s.amount || "-"}</td>
        <td>${s.renewDate || "-"}</td>
        <td>${s.autoRenew ? "是" : "否"}</td>
      `;
      tbody.appendChild(tr);
    });

    const totalSpan = document.createElement("span");
    totalSpan.textContent = `月度合计（粗略）：¥${summary.total}`;
    statContainer.appendChild(totalSpan);

    Object.entries(summary.byCategory).forEach(([category, amount]) => {
      const span = document.createElement("span");
      span.textContent = `${category}: ¥${amount}`;
      statContainer.appendChild(span);
    });

    if (summary.suggestions.length > 0) {
      const hint = document.createElement("span");
      hint.textContent = `建议复盘 ${summary.suggestions.length} 个高金额订阅`;
      statContainer.appendChild(hint);
    }

    updateRiskSummary();
  } catch (e) {
    console.error(e);
  }
}

function initSubscriptionForm() {
  const form = document.getElementById("form-subscription");
  const btnRefresh = document.getElementById("btn-refresh-subscriptions");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    payload.amount = payload.amount ? Number(payload.amount) : 0;
    payload.autoRenew = payload.autoRenew === "true";
    try {
      await apiPost("/subscriptions", payload);
      form.reset();
      refreshSubscriptions();
    } catch (err) {
      console.error(err);
      alert("保存订阅失败，请查看控制台日志");
    }
  });

  btnRefresh.addEventListener("click", () => refreshSubscriptions());
}

// =======================
// 残值估算模块
// =======================

function initResale() {
  const btnCalc = document.getElementById("btn-calc-resale");
  const selectAsset = document.getElementById("select-resale-asset");
  const selectCondition = document.getElementById("select-resale-condition");
  const resultDiv = document.getElementById("resale-result");

  btnCalc.addEventListener("click", async (e) => {
    e.preventDefault();
    const assetId = selectAsset.value;
    const conditionLevel = selectCondition.value;
    if (!assetId) {
      alert("请先选择一个资产");
      return;
    }
    try {
      const data = await apiGet(
        `/assets/${assetId}/resale-value?conditionLevel=${conditionLevel}`
      );
      if (!data.resale) {
        resultDiv.textContent = "暂无估算结果，请检查资产信息";
        return;
      }
      const r = data.resale;
      resultDiv.innerHTML = `
        <div class="stat-row">
          <span>参考残值：¥${r.estimatedPrice}</span>
          <span>已使用：${r.monthsUsed} 个月</span>
          <span>时间折旧因子：${r.timeFactor}</span>
          <span>状态系数：${r.conditionFactor}</span>
        </div>
        <div class="hint" style="margin-top: 8px">
          实际实现中可对接二手平台 API，以成交价区间替代本地估算算法。
        </div>
      `;
    } catch (err) {
      console.error(err);
      alert("获取残值估算失败");
    }
  });
}

// =======================
// 家庭共享模块
// =======================

async function refreshFamilyItems() {
  try {
    const tbody = document.getElementById("table-family-items-body");
    tbody.innerHTML = "";
    const list = await apiGet("/family/items");
    list.forEach((item) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item.name}</td>
        <td>${item.type}</td>
        <td>${item.content}</td>
        <td>${(item.canEditRoles || []).join(", ")}</td>
        <td>${item.createdAt}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    console.error(e);
  }
}

function initFamilyForm() {
  const form = document.getElementById("form-family-item");
  const btnRefresh = document.getElementById("btn-refresh-family-items");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    if (payload.canEditRoles) {
      payload.canEditRoles = payload.canEditRoles
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    try {
      await apiPost("/family/items", payload);
      form.reset();
      refreshFamilyItems();
    } catch (err) {
      console.error(err);
      alert("添加家庭共享信息失败");
    }
  });

  btnRefresh.addEventListener("click", () => refreshFamilyItems());
}

// =======================
// 统一提醒 & 风险概览
// =======================

async function refreshReminders() {
  try {
    const container = document.getElementById("reminder-list");
    container.innerHTML = "";
    const list = await apiGet("/reminders/upcoming");
    if (list.length === 0) {
      container.innerHTML = '<div class="hint">未来 30 天暂无需要关注的事件</div>';
      return;
    }

    list.sort((a, b) => new Date(a.date) - new Date(b.date));

    list.forEach((r) => {
      const div = document.createElement("div");
      div.className = "reminder-item";
      const badgeClass = r.type === "warranty" ? "badge-amber" : "badge-red";
      div.innerHTML = `
        <div>
          <div class="reminder-title">${r.title}</div>
          <div class="reminder-meta">${r.date}</div>
        </div>
        <div>
          <span class="pill ${badgeClass}">
            ${r.type === "warranty" ? "保修" : "订阅"}
          </span>
          ${r.amount ? `<span class="pill">¥${r.amount}</span>` : ""}
        </div>
      `;
      container.appendChild(div);
    });
  } catch (e) {
    console.error(e);
  }
}

async function updateRiskSummary() {
  try {
    const reminders = await apiGet("/reminders/upcoming");
    let riskScore = 0;
    reminders.forEach((r) => {
      if (r.type === "subscription") {
        riskScore += Number(r.amount) >= 100 ? 3 : 1;
      }
      if (r.type === "warranty") {
        riskScore += 2;
      }
    });
    const el = document.getElementById("summary-risk");
    if (riskScore === 0) {
      el.textContent = "低";
    } else if (riskScore < 6) {
      el.textContent = `中（${riskScore}）`;
    } else {
      el.textContent = `高（${riskScore}）`;
    }
  } catch (e) {
    console.error(e);
  }
}

// =======================
// 初始化
// =======================

window.addEventListener("DOMContentLoaded", () => {
  initNav();
  initAccountForms();
  initAssetForm();
  initSubscriptionForm();
  initResale();
  initFamilyForm();

  refreshAssets();
  refreshSubscriptions();
  refreshFamilyItems();
  refreshReminders();
  updateRiskSummary();
  refreshAccountInfo();
});
