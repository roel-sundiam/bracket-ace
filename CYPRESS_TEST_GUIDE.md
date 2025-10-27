# Cypress Test: Club Request & Approval Flow

## 🎯 Test Purpose

**Verify that when a regular user requests a club and superadmin approves it, ONLY that user becomes the club admin.**

## 📍 Test Location

- **Test File**: `cypress/e2e/club-request-approval.cy.ts`
- **Documentation**: `cypress/e2e/CLUB_REQUEST_TEST_README.md`
- **Config**: `cypress.config.ts`

## ⚡ Quick Start (5 Steps)

### 1. **Start Servers**
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd bracket-ace
npm start
```

### 2. **Create Superadmin Account**
Open MongoDB Compass or Shell:
```javascript
db.users.updateOne(
  { email: "sundiamr@aol.com" },
  { $set: { role: "superadmin" } }
)
```

### 3. **Update Test Credentials**
Edit `cypress/e2e/club-request-approval.cy.ts` lines 11-14:
```typescript
const superAdmin = {
  email: 'sundiamr@aol.com',           // ← Your superadmin email
  password: 'your_actual_password'      // ← Your superadmin password
};
```

### 4. **Run Test**
```bash
npm run cypress:open
```
Then click on `club-request-approval.cy.ts`

### 5. **Watch It Run** 🎬
The test will:
- Register a user → Request club → Superadmin approves → User becomes club admin ✅
- Register another user → Verify they stay as regular member ✅

## 📊 What Gets Tested (45 Steps)

### Flow Overview:
```
Regular User          Superadmin              Regular User (Again)      Another User
    │                     │                           │                      │
    ├─ Register           │                           │                      │
    ├─ Request Club       │                           │                      │
    ├─ Logout             │                           │                      │
    │                     ├─ Login                    │                      │
    │                     ├─ See Request              │                      │
    │                     ├─ Approve ✅               │                      │
    │                     ├─ Logout                   │                      │
    │                     │                           ├─ Login               │
    │                     │                           ├─ Role = Club Admin ✅ │
    │                     │                           ├─ Access Dashboard ✅  │
    │                     │                           │                      ├─ Register
    │                     │                           │                      ├─ Role = Member ✅
    │                     │                           │                      └─ No Admin Access ✅
```

## ✅ Pass Criteria

**Test PASSES when:**
- ✅ User requests club successfully
- ✅ Superadmin sees and approves request
- ✅ **Requesting user's role → 'club_admin'**
- ✅ Club admin can create tournaments
- ✅ Club admin can access club dashboard
- ✅ **Other users remain as 'member'**
- ✅ Other users cannot access admin features

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| **Test won't start** | Check both servers running: backend (3001), frontend (4204) |
| **Login fails** | Verify superadmin exists in DB with `role: 'superadmin'` |
| **Selectors fail** | Use Cypress UI mode to inspect actual HTML elements |
| **Role not upgraded** | Check backend resolver at `clubResolvers.ts:472` |

## 🧹 Cleanup

After testing, clean MongoDB:
```javascript
db.users.deleteMany({ email: /regularuser.*@test\.com/ });
db.users.deleteMany({ email: /anotheruser.*@test\.com/ });
db.clubs.deleteMany({ name: /Test Tennis Club/ });
db.clubrequests.deleteMany({ name: /Test Tennis Club/ });
```

## 📖 Full Documentation

For detailed step-by-step guide, see: **`cypress/e2e/CLUB_REQUEST_TEST_README.md`**

Includes:
- Complete prerequisites checklist
- 45-step detailed test flow
- Comprehensive troubleshooting guide
- MongoDB cleanup commands
- Expected results analysis

---

## 🚀 TL;DR

```bash
# 1. Promote user to superadmin in MongoDB
db.users.updateOne(
  { email: "sundiamr@aol.com" },
  { $set: { role: "superadmin" } }
)

# 2. Update credentials in test file (lines 11-14)

# 3. Run Cypress
npm run cypress:open

# 4. Click: club-request-approval.cy.ts

# 5. Watch magic happen! ✨
```

**Core Test**: Only the requesting user becomes club admin. Others stay as members. 🎾
