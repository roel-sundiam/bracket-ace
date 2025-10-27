# Club Request and Approval Cypress Test

## 📋 What This Test Does

This Cypress test (`club-request-approval.cy.ts`) verifies the **complete club creation request and approval workflow**.

### Test Objective
**Verify that when a regular user requests a club and a superadmin approves it, ONLY that specific user becomes the club admin.**

### Test Scenarios

#### **Scenario 1: Request → Approval → Role Upgrade**
1. ✅ Regular user registers (as 'member')
2. ✅ Regular user requests a new club
3. ✅ Superadmin logs in
4. ✅ Superadmin approves the club request
5. ✅ Regular user's role upgrades to 'club_admin'
6. ✅ User gains access to Club Admin features

#### **Scenario 2: Isolation Test**
1. ✅ Another user registers (as 'member')
2. ✅ Verifies they remain a regular 'member'
3. ✅ Confirms they are NOT affected by the club approval
4. ✅ **Proves only the requesting user becomes club admin**

---

## 🚀 Before Running the Test

### **Step 1: Start the Servers**

#### Backend Server
```bash
cd backend
npm run dev
```
- ✅ Backend should be running on: `http://localhost:3001`
- ✅ GraphQL endpoint: `http://localhost:3001/graphql`
- ✅ MongoDB must be connected

#### Frontend Server
```bash
cd bracket-ace
npm start
```
- ✅ Frontend should be running on: `http://localhost:4204`

### **Step 2: Create Superadmin Account**

⚠️ **CRITICAL**: You MUST have a superadmin account before running the test.

#### **Option A - Use MongoDB Compass/Shell (Recommended)**

1. Open MongoDB Compass or MongoDB Shell
2. Connect to your database
3. Find the `users` collection
4. Find your user (e.g., `sundiamr@aol.com`)
5. Update the role:

```javascript
// MongoDB Shell command
db.users.updateOne(
  { email: "sundiamr@aol.com" },
  { $set: { role: "superadmin" } }
)
```

**MongoDB Compass:**
- Find the user document
- Click "Edit Document"
- Change `"role": "member"` to `"role": "superadmin"`
- Click "Update"

#### **Option B - Use GraphQL Playground**

If you have a `promoteToSuperadmin` mutation:

```graphql
mutation {
  promoteToSuperadmin(email: "sundiamr@aol.com") {
    id
    email
    role
  }
}
```

### **Step 3: Update Test Credentials**

1. Open: `cypress/e2e/club-request-approval.cy.ts`
2. Find lines 11-14
3. Update with your superadmin credentials:

```typescript
const superAdmin = {
  email: 'sundiamr@aol.com',        // ← Your superadmin email
  password: 'your_actual_password'   // ← Your superadmin password
};
```

### **Step 4: Verify Routes Are Accessible**

Open your browser and manually check these routes work:
- ✅ `http://localhost:4204/register` - Registration page loads
- ✅ `http://localhost:4204/login` - Login page loads
- ✅ `http://localhost:4204/clubs/request` - Club request form loads (after login)
- ✅ `http://localhost:4204/admin/club-requests` - Admin panel loads (superadmin only)

---

## ▶️ How to Run the Test

### **Method 1: Cypress UI** (Recommended - Better Debugging)

1. Open terminal in the `bracket-ace` folder
2. Run:
```bash
npm run cypress:open
```
or
```bash
npx cypress open
```

3. **In Cypress window:**
   - Click **"E2E Testing"**
   - Choose your browser (Chrome recommended)
   - Click on **`club-request-approval.cy.ts`**
   - Watch the test run in the browser

### **Method 2: Headless Mode** (Faster, No UI)

```bash
npm run cypress:run --spec "cypress/e2e/club-request-approval.cy.ts"
```
or
```bash
npx cypress run --spec "cypress/e2e/club-request-approval.cy.ts"
```

---

## 📝 What The Test Does (Step-by-Step)

### **Test 1: Complete Request → Approval → Role Upgrade Flow**

#### **Part A: Regular User Requests Club**
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/register` | Registration page loads |
| 2 | Fill registration form with unique email (e.g., `regularuser1234567890@test.com`) | Form fields populate |
| 3 | Click "Submit" | User registered successfully |
| 4 | Auto redirect to `/dashboard` | Dashboard loads |
| 5 | Navigate to `/clubs/request` | Club request form loads |
| 6 | Enter club name: `Test Tennis Club 1234567890` | Name field populated |
| 7 | Enter description: `A test club for Cypress testing` | Description field populated |
| 8 | Click "Submit Request" | Success message appears |
| 9 | Verify message: "Club creation request submitted successfully!" | ✅ Message visible |
| 10 | Auto redirect to `/clubs/my-requests` | My requests page loads |
| 11 | Click user profile → "Sign out" | User logged out |

#### **Part B: Superadmin Approves Request**
| Step | Action | Expected Result |
|------|--------|-----------------|
| 12 | Navigate to `/login` | Login page loads |
| 13 | Enter superadmin credentials | Form populated |
| 14 | Click "Submit" | Superadmin logged in |
| 15 | Hover over "Admin" menu | Dropdown appears |
| 16 | Click "Club Requests" | Admin panel loads |
| 17 | Verify club request visible with club name | ✅ Request found |
| 18 | Verify requester email visible | ✅ Email matches regular user |
| 19 | Verify status badge shows "pending" | ✅ Status is pending |
| 20 | Click "Approve" button | Confirmation dialog appears |
| 21 | Confirm approval | Request processed |
| 22 | Verify success message: `Club "Test Tennis Club..." has been created successfully` | ✅ Message visible |
| 23 | Verify status changed to "approved" | ✅ Status updated |
| 24 | Click user profile → "Sign out" | Superadmin logged out |

#### **Part C: Verify Regular User is Now Club Admin**
| Step | Action | Expected Result |
|------|--------|-----------------|
| 25 | Navigate to `/login` | Login page loads |
| 26 | Enter original regular user credentials | Form populated |
| 27 | Click "Submit" | User logged in |
| 28 | Redirect to `/dashboard` | Dashboard loads |
| 29 | Click user profile dropdown | Dropdown opens |
| 30 | Verify role shows "Club Admin" | ✅ Role upgraded! |
| 31 | Hover over "Tournaments" menu | Dropdown appears |
| 32 | Verify "Create Tournament" option visible | ✅ Option now available |
| 33 | Hover over "Clubs" menu | Dropdown appears |
| 34 | Click "Club Dashboard" | Club dashboard loads |
| 35 | Verify URL is `/club/dashboard` | ✅ Access granted |
| 36 | Verify club name appears in dashboard | ✅ User manages their club |

### **Test 2: Verify Isolation (Other Users NOT Affected)**

| Step | Action | Expected Result |
|------|--------|-----------------|
| 37 | Navigate to `/register` | Registration page loads |
| 38 | Register another user (e.g., `anotheruser1234567890@test.com`) | User registered |
| 39 | Auto redirect to `/dashboard` | Dashboard loads |
| 40 | Click user profile dropdown | Dropdown opens |
| 41 | Verify role shows "Member" (NOT "Club Admin") | ✅ Still a regular member |
| 42 | Hover over "Tournaments" menu | Dropdown appears |
| 43 | Verify "Create Tournament" is NOT visible | ✅ No access to create |
| 44 | Manually navigate to `/club/dashboard` | Access denied or redirect |
| 45 | Verify URL does NOT contain `/club/dashboard` | ✅ Cannot access club dashboard |

**✅ TEST PASSES IF:** Only the user who requested the club becomes club admin. Other users remain as regular members.

---

## ✅ Expected Results

### **Test Should PASS When:**
- ✅ Regular user successfully requests a club
- ✅ Superadmin can see the pending request
- ✅ Superadmin can approve the request
- ✅ Success message appears after approval
- ✅ **ONLY the requesting user's role changes to 'club_admin'**
- ✅ Club admin gains access to:
  - "Create Tournament" menu option
  - Club Dashboard (`/club/dashboard`)
  - Their club appears in dashboard
- ✅ Other users remain as regular 'member' role
- ✅ Other users CANNOT access club admin features

### **Test Should FAIL When:**
- ❌ Club request submission fails
- ❌ Superadmin cannot see the request
- ❌ Approval doesn't upgrade the user's role
- ❌ Wrong user becomes club admin
- ❌ Multiple users become club admin
- ❌ Club admin cannot access expected features
- ❌ Regular members can access club admin features

---

## 🔧 Troubleshooting Guide

### **Problem: Test fails during user registration**

**Possible Causes:**
- Backend server not running
- GraphQL endpoint not accessible
- MongoDB not connected

**Solutions:**
```bash
# Check backend is running
curl http://localhost:3001/graphql

# Check MongoDB connection in backend logs
# Look for: "MongoDB Connected Successfully"
```

### **Problem: Test fails at club request submission**

**Possible Causes:**
- Route `/clubs/request` doesn't exist
- Form field names don't match
- GraphQL mutation `requestClubCreation` not working

**Solutions:**
1. Manually test the route: `http://localhost:4204/clubs/request`
2. Check browser console for errors
3. Test GraphQL mutation in playground:
```graphql
mutation {
  requestClubCreation(input: {
    name: "Test Club"
    description: "Test"
  }) {
    id
    name
    status
  }
}
```

### **Problem: Superadmin login fails**

**Possible Causes:**
- Superadmin account doesn't exist
- Wrong credentials in test file
- User role is not 'superadmin'

**Solutions:**
1. Verify in MongoDB:
```javascript
db.users.findOne({ email: "sundiamr@aol.com" })
// Should show: role: "superadmin"
```

2. Update role if needed:
```javascript
db.users.updateOne(
  { email: "sundiamr@aol.com" },
  { $set: { role: "superadmin" } }
)
```

3. Double-check password in test file matches actual password

### **Problem: Approval doesn't work**

**Possible Causes:**
- Route `/admin/club-requests` not accessible
- GraphQL mutation `approveClubRequest` failing
- Backend resolver not updating user role

**Solutions:**
1. Manually test as superadmin:
   - Login as superadmin
   - Go to `http://localhost:4204/admin/club-requests`
   - Try approving a request manually

2. Test GraphQL mutation:
```graphql
mutation {
  approveClubRequest(requestId: "your_request_id") {
    id
    name
    clubAdmin {
      role
    }
  }
}
```

3. Check backend resolver (`approveClubRequest` in `clubResolvers.ts`):
   - Line 472: Should update user role to 'club_admin'
   ```typescript
   await User.findByIdAndUpdate(requester._id, { role: 'club_admin' });
   ```

### **Problem: User role doesn't upgrade**

**Solutions:**
1. Check MongoDB after approval:
```javascript
db.users.findOne({ email: "regularuser...@test.com" })
// role should be "club_admin" not "member"
```

2. Check backend logs for errors during approval

3. Verify the resolver updates the user:
   - File: `backend/src/graphql/resolvers/clubResolvers.ts`
   - Line: ~472

### **Problem: Wrong selector errors (element not found)**

**Solutions:**
1. Inspect the actual HTML elements
2. Update selectors in test file:
   - Example: `input[name="email"]` → Update to match actual HTML
3. Use Cypress UI mode to debug selectors interactively

---

## 🧹 Cleanup After Testing

After running tests, clean up test data from MongoDB:

### **Option 1: MongoDB Compass**
1. Open MongoDB Compass
2. Navigate to your database
3. Delete test users and clubs manually:
   - Users: `regularuser...@test.com`, `anotheruser...@test.com`
   - Clubs: `Test Tennis Club ...`
   - Club Requests: Search by name pattern

### **Option 2: MongoDB Shell**
```javascript
// Delete test users
db.users.deleteMany({
  email: { $regex: /^regularuser.*@test\.com$/ }
});

db.users.deleteMany({
  email: { $regex: /^anotheruser.*@test\.com$/ }
});

// Delete test clubs
db.clubs.deleteMany({
  name: { $regex: /^Test Tennis Club/ }
});

// Delete test club requests
db.clubrequests.deleteMany({
  name: { $regex: /^Test Tennis Club/ }
});

// Verify cleanup
db.users.find({ email: { $regex: /test\.com$/ } }).count();
// Should return 0
```

---

## 📌 Important Notes

### **Key Points to Remember:**
1. ⏰ **Timestamps**: Test uses `Date.now()` to generate unique emails/club names
   - Example: `regularuser1702345678901@test.com`
   - Example: `Test Tennis Club 1702345678901`

2. 🔐 **Superadmin Required**: Must exist before running test
   - Cannot be created during test
   - Must update test file with real credentials

3. 🎯 **Core Test Goal**: Verify **isolation** - only requester becomes admin

4. 🔄 **Re-runnable**: Test generates new data each run (timestamps)

5. 🧪 **Two Tests in One File**:
   - Test 1: Full workflow (45 steps)
   - Test 2: Isolation verification (9 steps)

### **What Makes This Test Pass:**
The key assertion is in **Test 1, Step 30**:
```typescript
cy.contains('Club Admin').should('be.visible');
```

And **Test 2, Step 41**:
```typescript
cy.contains('Member').should('be.visible');
```

**If both are true → Only the requester became club admin ✅**

---

## 🚀 Quick Start Checklist

Before running, verify:
- [ ] Backend running on `http://localhost:3001`
- [ ] Frontend running on `http://localhost:4204`
- [ ] MongoDB connected
- [ ] Superadmin account exists (check MongoDB)
- [ ] Test file updated with superadmin credentials
- [ ] Routes accessible (manually visit each)

**Then run:**
```bash
npm run cypress:open
```

**Select:** `club-request-approval.cy.ts` → Watch it run! 🎾
