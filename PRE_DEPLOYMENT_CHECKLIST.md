# Pre-Deployment Checklist

## Backend Setup

- [ ] **app.py**
  - [ ] Updated `/api/submit-application` with user_id handling
  - [ ] Added `/api/get-job-seeker-application/<user_id>` endpoint
  - [ ] Added `/api/job-recommendations/<user_id>` endpoint
  - [ ] No syntax errors

- [ ] **job_score_calculation.py**
  - [ ] Updated `generate_job_recommendations()` to use user_id
  - [ ] Changed lookup from `application_id` to `user_id`
  - [ ] Stores results with `user_id` in job_scores collection
  - [ ] No syntax errors

- [ ] **embedding_service.py**
  - [ ] Updated `embed_job_seeker_data()` to capture user_id
  - [ ] Stores embeddings with user_id field
  - [ ] No syntax errors

- [ ] **migrate_existing_applications.py**
  - [ ] Script created and ready to run
  - [ ] Matches emails between users and applications
  - [ ] Handles missing user cases gracefully

## Frontend Setup

- [ ] **Home.jsx**
  - [ ] Job Seeker link changed to `/job-seeker-dashboard`
  - [ ] Job Provider link changed to `/job-provider-dashboard`
  - [ ] No styling issues

- [ ] **JobSeekerApplication.jsx**
  - [ ] `handleSubmit()` gets user_id from localStorage
  - [ ] `handleSubmit()` includes user_id in API request
  - [ ] Validates user is logged in
  - [ ] No syntax errors

- [ ] **JobProviderApplication.jsx**
  - [ ] `handleSubmit()` gets user_id from localStorage
  - [ ] `handleSubmit()` includes user_id in API request
  - [ ] Validates user is logged in
  - [ ] No syntax errors

- [ ] **JobSeekerDashboard.jsx (NEW)**
  - [ ] Created and in correct location
  - [ ] Imports all dependencies
  - [ ] Shows correct options for new vs returning users
  - [ ] Fetches job recommendations correctly
  - [ ] No syntax errors

- [ ] **JobProviderDashboard.jsx (NEW)**
  - [ ] Created and in correct location
  - [ ] Imports all dependencies
  - [ ] Shows correct options for new vs returning users
  - [ ] No syntax errors

## Routing Configuration

- [ ] Router file updated with new routes:
  ```jsx
  { path: '/job-seeker-dashboard', element: <JobSeekerDashboard /> }
  { path: '/job-provider-dashboard', element: <JobProviderDashboard /> }
  ```
- [ ] Old routes `/find-job` and `/offer-job` can be removed or kept for backward compatibility
- [ ] No duplicate route definitions

## Database Preparation

- [ ] MongoDB Atlas backup created
- [ ] Backup verified and downloadable
- [ ] MONGO_URI in .env is correct
- [ ] Database connection tested

## Pre-Deployment Testing

### Local Testing

- [ ] Backend server starts without errors: `python app.py`
- [ ] No connection errors to MongoDB
- [ ] Frontend builds without errors: `npm run build`
- [ ] Frontend dev server starts: `npm run dev`
- [ ] No console errors when opening pages

### User Registration & Login

- [ ] Can register new user
- [ ] Login stores user object with `id` in localStorage
- [ ] Can verify localStorage has correct structure:
  ```javascript
  JSON.parse(localStorage.getItem('user'))
  // Should return: { id: "...", name: "...", email: "..." }
  ```

### Dashboard Tests

- [ ] **New User:**
  - [ ] Navigate to home after login
  - [ ] Click "Explore Jobs"
  - [ ] See JobSeekerDashboard with single "Fill Form" option
  - [ ] Click form option → Form opens
  - [ ] Fill form with test data
  - [ ] Submit → Success message appears
  - [ ] Check MongoDB for document with `user_id` field

- [ ] **Returning User:**
  - [ ] Logout and login again
  - [ ] Click "Explore Jobs"
  - [ ] See JobSeekerDashboard with 3 options
  - [ ] Test "View Your Application" → Shows saved form
  - [ ] Test "Update Your Application" → Can edit and save
  - [ ] Check MongoDB - should be 1 document (not 2) for this user

### Job Recommendations Test

- [ ] Submit a complete application
- [ ] Run embedding service: `python embedding_service.py`
- [ ] Run job score calculation: `python job_score_calculation.py`
- [ ] Go back to dashboard
- [ ] Click "View Matched Job Opportunities"
- [ ] See job list with scores
- [ ] Check MongoDB job_scores collection has entry with this user_id

## Migration Execution

- [ ] ~~Backup confirmed~~ (Skip - starting fresh)
- [ ] ~~Migration script ready~~ (Not needed - deleting old data)
- [ ] (Optional) Old data deleted from MongoDB if desired
- [ ] (Optional) Verified deletions in MongoDB:
  ```javascript
  db.job_applications.countDocuments() // Should be 0 if cleaned
  ```

## Deployment

### Backend Deployment

- [ ] All Python files updated and tested
- [ ] No uncommitted changes
- [ ] Deploy/copy files to production server
- [ ] Stop old Flask server
- [ ] Restart Flask server
- [ ] Verify server is running: `curl http://localhost:5000/api/login`

### Frontend Deployment

- [ ] All React files updated and tested
- [ ] Run `npm run build` to create optimized build
- [ ] Build completes without errors
- [ ] Deploy to hosting platform (Vercel, Netlify, etc.)
- [ ] Verify frontend loads
- [ ] Test login flow end-to-end

## Post-Deployment Verification

- [ ] Access application in browser
- [ ] Login works correctly
- [ ] Can navigate to dashboards
- [ ] Forms submit successfully
- [ ] Job recommendations load
- [ ] No console errors
- [ ] MongoDB has expected data structure
- [ ] Can view/update/delete operations work

## Monitoring

- [ ] Monitor server logs for errors
- [ ] Check MongoDB for data consistency
- [ ] Test with multiple user accounts
- [ ] Monitor performance (response times)
- [ ] Check disk usage

## Rollback Readiness

- [ ] Previous version of app.py saved
- [ ] Rollback procedure documented (simple - just redeploy old code)
- [ ] Team aware of rollback plan

## Documentation

- [ ] IMPLEMENTATION_SUMMARY.md reviewed
- [ ] QUICK_REFERENCE.md reviewed
- [ ] Team trained on new dashboard flow
- [ ] User documentation updated (if applicable)
- [ ] Known issues documented

## Sign-Off

- [ ] Backend team approves changes
- [ ] Frontend team approves changes
- [ ] Database team approves changes
- [ ] Ready for production deployment

---

## Notes

Use this checklist before deploying to ensure all changes are properly integrated and tested.

**No migration needed** - Users will start fresh with new applications tied to their user IDs.

Any issues? Refer to QUICK_REFERENCE.md for troubleshooting.
