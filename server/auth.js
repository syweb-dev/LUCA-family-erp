const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const DATA_FILE = path.join(__dirname, "auth-data.json");
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

let users = [];
let families = [];
let userIdCounter = 1;
let familyIdCounter = 1;

function loadData() {
  if (!fs.existsSync(DATA_FILE)) return;
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    if (!raw) return;
    const parsed = JSON.parse(raw);
    users = parsed.users || [];
    families = parsed.families || [];
    userIdCounter = parsed.userIdCounter || 1;
    familyIdCounter = parsed.familyIdCounter || 1;
  } catch (e) {
    console.error("加载账号数据失败", e);
  }
}

function saveData() {
  const payload = {
    users,
    families,
    userIdCounter,
    familyIdCounter
  };
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), "utf8");
  } catch (e) {
    console.error("保存账号数据失败", e);
  }
}

function toSafeUser(user) {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return rest;
}

function signToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      familyId: user.familyId || null
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ message: "未登录" });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = users.find((u) => u.id === payload.userId);
    if (!user) {
      return res.status(401).json({ message: "用户不存在或已被删除" });
    }
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ message: "登录状态已失效，请重新登录" });
  }
}

function requireAdminOfFamily(req, res, next) {
  const familyId = Number(req.params.id || (req.user && req.user.familyId));
  if (!req.user) {
    return res.status(401).json({ message: "未登录" });
  }
  if (!familyId || req.user.familyId !== familyId || req.user.role !== "admin") {
    return res.status(403).json({ message: "仅家庭管理员可执行该操作" });
  }
  next();
}

function initAuth(app) {
  loadData();

  // 管理员/普通账号注册
  app.post("/api/auth/register", async (req, res) => {
    const { email, password, role = "admin", familyName, familyId } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "邮箱和密码不能为空" });
    }
    const existed = users.find((u) => u.email === email);
    if (existed) {
      return res.status(400).json({ message: "该邮箱已被注册" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let userRole = role === "member" ? "member" : "admin";
    let userFamilyId = null;
    let family = null;

    if (userRole === "admin") {
      if (!familyName) {
        return res
          .status(400)
          .json({ message: "创建管理员账号时必须填写家庭名称" });
      }
      const id = familyIdCounter++;
      family = {
        id,
        name: familyName,
        ownerId: null,
        memberIds: [],
        createdAt: new Date().toISOString()
      };
      families.push(family);
      userFamilyId = id;
    } else {
      const famIdNum = Number(familyId);
      const fam = families.find((f) => f.id === famIdNum);
      if (!fam) {
        return res.status(400).json({ message: "加入的家庭不存在" });
      }
      userFamilyId = fam.id;
      family = fam;
    }

    const user = {
      id: userIdCounter++,
      email,
      passwordHash,
      role: userRole,
      familyId: userFamilyId,
      createdAt: new Date().toISOString()
    };
    users.push(user);

    if (family) {
      if (!family.ownerId && userRole === "admin") {
        family.ownerId = user.id;
      }
      if (!family.memberIds.includes(user.id)) {
        family.memberIds.push(user.id);
      }
    }

    saveData();

    const token = signToken(user);
    res.status(201).json({
      token,
      user: toSafeUser(user),
      family
    });
  });

  // 登录
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "邮箱和密码不能为空" });
    }
    const user = users.find((u) => u.email === email);
    if (!user) {
      return res.status(400).json({ message: "邮箱或密码错误" });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(400).json({ message: "邮箱或密码错误" });
    }

    const token = signToken(user);
    const family = families.find((f) => f.id === user.familyId) || null;
    res.json({
      token,
      user: toSafeUser(user),
      family
    });
  });

  // 当前登录用户信息
  app.get("/api/auth/me", authMiddleware, (req, res) => {
    const family = families.find((f) => f.id === req.user.familyId) || null;
    res.json({
      user: toSafeUser(req.user),
      family
    });
  });

  // 当前家庭及成员信息
  app.get("/api/families/me", authMiddleware, (req, res) => {
    if (!req.user.familyId) {
      return res.json({ family: null, members: [] });
    }
    const family = families.find((f) => f.id === req.user.familyId);
    if (!family) {
      return res.json({ family: null, members: [] });
    }
    const members = users
      .filter((u) => u.familyId === family.id)
      .map((u) => toSafeUser(u));
    res.json({
      family,
      members
    });
  });

  // 管理员在自己家庭下创建普通成员（邀请）
  app.post(
    "/api/families/:id/members",
    authMiddleware,
    requireAdminOfFamily,
    async (req, res) => {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "邮箱和密码不能为空" });
      }
      const existed = users.find((u) => u.email === email);
      if (existed) {
        return res.status(400).json({ message: "该邮箱已被其他账号使用" });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const familyId = Number(req.params.id);
      const family = families.find((f) => f.id === familyId);
      if (!family) {
        return res.status(404).json({ message: "家庭不存在" });
      }

      const user = {
        id: userIdCounter++,
        email,
        passwordHash,
        role: "member",
        familyId,
        createdAt: new Date().toISOString()
      };
      users.push(user);
      family.memberIds.push(user.id);
      saveData();

      res.status(201).json({ user: toSafeUser(user) });
    }
  );

  // 管理员踢出普通成员
  app.delete(
    "/api/families/:id/members/:userId",
    authMiddleware,
    requireAdminOfFamily,
    (req, res) => {
      const familyId = Number(req.params.id);
      const targetUserId = Number(req.params.userId);
      const family = families.find((f) => f.id === familyId);
      if (!family) {
        return res.status(404).json({ message: "家庭不存在" });
      }
      if (family.ownerId === targetUserId) {
        return res.status(400).json({ message: "无法踢出家庭管理员" });
      }
      const user = users.find((u) => u.id === targetUserId);
      if (!user || user.familyId !== familyId) {
        return res.status(404).json({ message: "目标用户不在当前家庭中" });
      }

      user.familyId = null;
      family.memberIds = family.memberIds.filter((id) => id !== targetUserId);
      saveData();
      res.json({ success: true });
    }
  );
}

module.exports = {
  initAuth,
  authMiddleware
};
