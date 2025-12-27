const express = require("express");
const cors = require("cors");
const { initAuth } = require("./auth");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 初始化账号与家庭管理相关接口
initAuth(app);

// ==========================
// 内存数据存储（示例实现）
// 真实环境可替换为数据库
// ==========================
let assets = []; // 实物资产与发票/保修信息
let subscriptions = []; // 数字订阅
let familyItems = []; // 家庭共享信息
let nextId = 1;

// 工具：生成 ID
function generateId() {
  return nextId++;
}

// 工具：计算保修到期日与剩余天数
function getWarrantyInfo(purchaseDate, warrantyMonths) {
  if (!purchaseDate || !warrantyMonths) return null;
  const start = new Date(purchaseDate);
  const end = new Date(start);
  end.setMonth(end.getMonth() + Number(warrantyMonths));
  const now = new Date();
  const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return {
    warrantyEndDate: end.toISOString().slice(0, 10),
    daysLeft
  };
}

// 工具：简单二手残值估算（示例实现）
function estimateResaleValue(purchasePrice, purchaseDate, conditionLevel) {
  if (!purchasePrice || !purchaseDate) return null;
  const base = Number(purchasePrice) || 0;
  const start = new Date(purchaseDate);
  const now = new Date();
  const months =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());

  // 按时间线性折旧：每月 3%，最低保留 10%
  let timeFactor = Math.pow(0.97, Math.max(months, 0));
  timeFactor = Math.max(timeFactor, 0.1);

  // 按使用状态系数
  const conditionMap = {
    "new": 1.0,
    "99": 0.95,
    "95": 0.9,
    "used": 0.8,
    "repaired": 0.7
  };
  const conditionFactor = conditionMap[conditionLevel] || 0.85;

  const value = base * timeFactor * conditionFactor;
  return {
    estimatedPrice: Number(value.toFixed(2)),
    monthsUsed: months < 0 ? 0 : months,
    timeFactor: Number(timeFactor.toFixed(3)),
    conditionFactor
  };
}

// ==========================
// 资产模块：发票 & 保修 & 维修
// ==========================

// 创建资产记录
app.post("/api/assets", (req, res) => {
  const {
    name,
    category,
    brand,
    model,
    purchaseDate,
    purchasePrice,
    warrantyMonths,
    warrantyType,
    notes,
    invoiceUrl,
    manualUrl
  } = req.body;

  const id = generateId();
  const warrantyInfo = getWarrantyInfo(purchaseDate, warrantyMonths);

  const asset = {
    id,
    name,
    category,
    brand,
    model,
    purchaseDate,
    purchasePrice,
    warrantyMonths,
    warrantyType, // 普通保修/延保/终身保修
    notes,
    invoiceUrl,
    manualUrl,
    warrantyInfo,
    repairs: []
  };
  assets.push(asset);
  res.status(201).json(asset);
});

// 查询全部资产
app.get("/api/assets", (req, res) => {
  res.json(assets);
});

// 查询单个资产详情
app.get("/api/assets/:id", (req, res) => {
  const id = Number(req.params.id);
  const asset = assets.find((a) => a.id === id);
  if (!asset) return res.status(404).json({ message: "资产不存在" });
  res.json(asset);
});

// 为资产添加维修记录
app.post("/api/assets/:id/repairs", (req, res) => {
  const id = Number(req.params.id);
  const asset = assets.find((a) => a.id === id);
  if (!asset) return res.status(404).json({ message: "资产不存在" });

  const { repairDate, description, provider, cost, parts } = req.body;
  const repairRecord = {
    id: generateId(),
    repairDate,
    description,
    provider,
    cost,
    parts
  };
  asset.repairs.push(repairRecord);
  res.status(201).json(repairRecord);
});

// 资产二手残值估算
app.get("/api/assets/:id/resale-value", (req, res) => {
  const id = Number(req.params.id);
  const asset = assets.find((a) => a.id === id);
  if (!asset) return res.status(404).json({ message: "资产不存在" });

  const { conditionLevel = "95" } = req.query;
  const result = estimateResaleValue(
    asset.purchasePrice,
    asset.purchaseDate,
    conditionLevel
  );

  res.json({
    assetId: id,
    conditionLevel,
    resale: result
  });
});

// ==========================
// 数字订阅模块
// ==========================

// 创建订阅
app.post("/api/subscriptions", (req, res) => {
  const {
    name,
    provider,
    category,
    renewCycle, // month/quarter/year
    renewDate,
    amount,
    payAccount,
    autoRenew,
    notes
  } = req.body;

  const id = generateId();
  const subscription = {
    id,
    name,
    provider,
    category,
    renewCycle,
    renewDate,
    amount,
    payAccount,
    autoRenew,
    notes,
    lastChargedAt: null,
    usageScore: null // 可用于后续"使用频率"分析
  };
  subscriptions.push(subscription);
  res.status(201).json(subscription);
});

// 查询全部订阅
app.get("/api/subscriptions", (req, res) => {
  res.json(subscriptions);
});

// 简单的订阅支出统计与优化建议
app.get("/api/subscriptions/summary", (req, res) => {
  const total = subscriptions.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  const byCategory = {};
  subscriptions.forEach((s) => {
    const key = s.category || "其他";
    byCategory[key] = (byCategory[key] || 0) + (Number(s.amount) || 0);
  });

  // 示例优化建议：金额高且未标记使用情况的，提示"建议复盘"
  const suggestions = subscriptions
    .filter((s) => (Number(s.amount) || 0) >= 30)
    .map((s) => ({
      id: s.id,
      name: s.name,
      reason: "订阅金额偏高，建议检查近期是否仍然频繁使用"
    }));

  res.json({
    total,
    byCategory,
    suggestions
  });
});

// ==========================
// 家庭共享模块
// ==========================

// 新增家庭共享信息项
app.post("/api/family/items", (req, res) => {
  const { name, type, content, note, canEditRoles } = req.body;
  const id = generateId();
  const item = {
    id,
    name,
    type, // wifi/account/device-maintenance 等
    content,
    note,
    canEditRoles: canEditRoles || ["parent"],
    createdAt: new Date().toISOString()
  };
  familyItems.push(item);
  res.status(201).json(item);
});

// 查询全部家庭共享信息项
app.get("/api/family/items", (req, res) => {
  res.json(familyItems);
});

// ==========================
// 统一提醒预览（示例：返回近 30 天内的关键事件）
// ==========================

app.get("/api/reminders/upcoming", (req, res) => {
  const now = new Date();
  const horizonDays = 30;
  const horizon = new Date(now.getTime() + horizonDays * 24 * 60 * 60 * 1000);

  const reminders = [];

  // 资产保修到期提醒
  assets.forEach((asset) => {
    if (!asset.warrantyInfo) return;
    const end = new Date(asset.warrantyInfo.warrantyEndDate);
    if (end >= now && end <= horizon) {
      reminders.push({
        type: "warranty",
        assetId: asset.id,
        title: `${asset.name || asset.model || "资产"} 保修即将到期`,
        date: asset.warrantyInfo.warrantyEndDate
      });
    }
  });

  // 订阅续费提醒
  subscriptions.forEach((s) => {
    if (!s.renewDate) return;
    const renew = new Date(s.renewDate);
    if (renew >= now && renew <= horizon) {
      reminders.push({
        type: "subscription",
        subscriptionId: s.id,
        title: `${s.name} 即将续费`,
        date: s.renewDate,
        amount: s.amount
      });
    }
  });

  res.json(reminders);
});

// ==========================
// 服务启动
// ==========================

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
