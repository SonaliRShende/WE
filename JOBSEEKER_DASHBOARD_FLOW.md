# JobSeeker Dashboard - Complete User Flow

## What Happens When User Clicks "Explore Jobs"

### 1. **Dashboard Main Options Page** (Initial View)

User sees an options page with clear CTAs based on their status:

```
┌─────────────────────────────────────────────────────────────┐
│                 Job Seeker Hub                              │
│                                                             │
│  Welcome back! Choose what you'd like to do:               │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 👁️  View Your Profile                              │   │
│  │ Review your saved job seeker profile               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ✏️  Update Your Profile                             │   │
│  │ Edit and improve your job seeker profile           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🎯 View Matched Jobs                               │   │
│  │ See jobs recommended based on your profile        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

For New Users:
┌─────────────────────────────────────────────────────────────┐
│                 Job Seeker Hub                              │
│                                                             │
│  Welcome! Let's create your job seeker profile            │
│  to find opportunities tailored for you.                  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📝 Fill Your Job Seeker Profile                     │   │
│  │ Create your profile with your skills,              │   │
│  │ experience, and preferences                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. **View Your Profile Option**

Shows a **read-only view** of the saved profile in organized sections:

```
┌────────────────────────────────────────────────────────────┐
│ ← Back to Options                                          │
│                                                            │
│ Your Job Seeker Profile                                   │
│                                                            │
│ ┌────────────────────────────────────────────────────────┐│
│ │ 👤 Personal Information                                 ││
│ │                                                        ││
│ │ Name        Email              Contact    Location    ││
│ │ [Value]     [Value]            [Value]    [Value]    ││
│ └────────────────────────────────────────────────────────┘│
│                                                            │
│ ┌────────────────────────────────────────────────────────┐│
│ │ 🎓 Education & Experience                              ││
│ │                                                        ││
│ │ Highest Qualification                                  ││
│ │ [Value displayed]                                      ││
│ │                                                        ││
│ │ Skills                                                 ││
│ │ [Value displayed]                                      ││
│ │                                                        ││
│ │ ... (more fields)                                      ││
│ └────────────────────────────────────────────────────────┘│
│                                                            │
│ ┌────────────────────────────────────────────────────────┐│
│ │ ⚙️ Preferences & Constraints                            ││
│ │ [Value displayed]                                      ││
│ └────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────┘
```

---

## 3. **Update Your Profile Option**

Opens the full form **pre-filled with existing data**:

```
┌────────────────────────────────────────────────────────────┐
│ ← Back to Options                                          │
│                                                            │
│ Unlock Your Dream Opportunity                             │
│ Share your story with us — we'll help find the perfect match
│                                                            │
│ [Language Selector Dropdown]                             │
│                                                            │
│ Personal Information                                      │
│ ┌────────────────────────────────────────────────────────┐│
│ │ Full Name * [Pre-filled value]                        ││
│ │ Email * [Pre-filled value]  | Contact [Pre-filled]   ││
│ │ Location * [Pre-filled value]                         ││
│ │ Profile Picture [Existing or upload new]             ││
│ └────────────────────────────────────────────────────────┘│
│                                                            │
│ Educational & Work Experience                             │
│ ┌────────────────────────────────────────────────────────┐│
│ │ Qualification [Pre-filled]                            ││
│ │ Skills [Pre-filled] (with voice input)                ││
│ │ ... more fields                                        ││
│ └────────────────────────────────────────────────────────┘│
│                                                            │
│ Preferences & Constraints                                 │
│ ┌────────────────────────────────────────────────────────┐│
│ │ Your Preferences [Pre-filled]                         ││
│ └────────────────────────────────────────────────────────┘│
│                                                            │
│          [Submit Application Button]                      │
└────────────────────────────────────────────────────────────┘

After Submit: 
✅ Application submitted successfully!
→ Returns to Options page
```

---

## 4. **View Matched Jobs Option**

Shows **ranked job recommendations** with scores:

```
┌────────────────────────────────────────────────────────────┐
│ ← Back to Options                                          │
│                                                            │
│ 🎯 Your Matched Job Opportunities                         │
│ Found 5 job(s) matching your profile                     │
│                                                            │
│ ┌────────────────────────────────────────────────────────┐│
│ │ Software Developer        Overall: 92%                ││
│ │ 🏢 Tech Company Inc.                                   ││
│ │                                                        ││
│ │ Skills Match: 95%          Constraints Match: 85%    ││
│ └────────────────────────────────────────────────────────┘│
│                                                            │
│ ┌────────────────────────────────────────────────────────┐│
│ │ Product Manager            Overall: 87%                ││
│ │ 🏢 Innovation Labs                                     ││
│ │                                                        ││
│ │ Skills Match: 88%          Constraints Match: 85%    ││
│ └────────────────────────────────────────────────────────┘│
│                                                            │
│ ... (more jobs ranked by score)                          │
└────────────────────────────────────────────────────────────┘
```

---

## Complete Flow Diagram

```
Home Page
  │
  ├─→ "Explore Jobs" (Job Seeker Card)
  │
  └─→ JobSeekerDashboard (/job-seeker-dashboard)
      │
      ├─ NEW USER PATH:
      │  └─→ Shows: "📝 Fill Your Job Seeker Profile"
      │     └─→ Click → Form opens (JobSeekerApplication)
      │        └─→ Fill form → Submit
      │           └─→ Data saved with user_id
      │              └─→ Auto-detect changes (now returning user)
      │
      └─ RETURNING USER PATH (3 Options):
         │
         ├─ Option 1: "👁️ View Your Profile"
         │  └─→ ViewApplicationData (read-only display)
         │     └─→ Shows all saved data in organized sections
         │
         ├─ Option 2: "✏️ Update Your Profile"
         │  └─→ JobSeekerApplication (with existingData prop)
         │     └─→ Form pre-filled with saved data
         │        └─→ Edit and submit → Updates existing record
         │
         └─ Option 3: "🎯 View Matched Jobs"
            └─→ ViewJobRecommendations
               └─→ Fetches from /api/job-recommendations/{user_id}
                  └─→ Shows ranked jobs with scores
                     └─→ Skills Match %
                     └─→ Constraints Match %
                     └─→ Overall Score %
```

---

## Key Features Implemented

✅ **Smart Detection**: Automatically shows different UI for new vs returning users  
✅ **Pre-filled Forms**: Update form comes with existing data filled in  
✅ **Read-only View**: Users can verify their saved data without editing  
✅ **Ranked Recommendations**: Jobs sorted by overall match score  
✅ **Score Breakdown**: Shows skill and constraint match percentages  
✅ **Seamless Navigation**: Back buttons return to options page  
✅ **Voice Input**: All forms support multilingual voice input  
✅ **User-linked Data**: All data tied to user_id for personalization  

---

## Database Queries Behind the Scenes

**View Profile:**
```javascript
GET /api/get-job-seeker-application/{user_id}
// Returns: Complete application document
```

**Update Profile:**
```javascript
POST /api/submit-application
// Request includes: user_id + form data
// MongoDB: Updates existing doc with same user_id (upsert)
```

**View Matched Jobs:**
```javascript
GET /api/job-recommendations/{user_id}
// Returns: Array of ranked jobs with scores
// Called when clicking "View Matched Jobs"
```

---

## What Changes Happened

### Before (Direct Form):
```
Home → Click "Explore Jobs" → Direct to Form → Confusing UX
```

### After (With Dashboard):
```
Home → Click "Explore Jobs" → Dashboard Options
  → Choose what to do → Navigate clearly
```

---

## Testing Checklist

- [ ] Click "Explore Jobs" → See options page
- [ ] New user path: "Fill Form" option shown → Form opens → Submit works
- [ ] Logout/Login → Same form is pre-filled → Dashboard shows 3 options
- [ ] Click "View Your Profile" → Read-only data displayed
- [ ] Click "Update Your Profile" → Form pre-filled with existing data
- [ ] Update and submit → Single document updated (no duplicates)
- [ ] Click "View Matched Jobs" → Ranked jobs display with scores
- [ ] Navigate back between all views → Works smoothly
