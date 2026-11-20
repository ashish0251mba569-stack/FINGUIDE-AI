# FinGuide AI Firestore Security Specification

## Data Invariants
1. All user data (`/users/{userId}` and subcollections `assessments`, `comparisons`, `learningProgress`) is strictly private to the authenticated, email-verified owner (`request.auth.uid == userId`).
2. `userId` and `uid` fields inside documents must match `request.auth.uid` on create and remain immutable on update.
3. Timestamps (`createdAt`, `updatedAt`) must equal `request.time` (server timestamp) and `createdAt` is immutable on update.
4. All document IDs (`userId`, `assessmentId`, `comparisonId`, `docId`) must match `^[a-zA-Z0-9_\-]+$` and be at most 128 characters.
5. Numeric fields (`score`, `monthlyAmount`, `durationYears`, `fdRate`, `sipRate`, `ppfRate`) are bounded to safe ranges (`score` 0–100, `durationYears` 1–40, rates 0–35).
6. Arrays (`completedTopics`) are strictly bounded (`size() <= 10`) and allowlisted to valid educational topic IDs.

## Dirty Dozen Payloads (Expected: PERMISSION_DENIED)
1. Unauthenticated read or write to `/users/uid1`.
2. Unverified email user (`email_verified: false`) attempting to write an assessment.
3. User `uid2` attempting to read or list `/users/uid1/assessments`.
4. User `uid1` writing an assessment with `userId: "uid2"` (identity spoofing).
5. User `uid1` adding a shadow field `isAdmin: true` to `/users/uid1`.
6. User `uid1` updating `createdAt` or `userId` on an existing assessment.
7. User `uid1` writing a client-spoofed timestamp instead of `request.time`.
8. User `uid1` injecting a 1500-char document ID (resource/ID poisoning).
9. User `uid1` writing `score: 999` (out-of-bounds score).
10. User `uid1` writing `durationYears: 0` or `monthlyAmount: -500` in a comparison.
11. User `uid1` injecting 50 elements or non-allowlisted strings into `completedTopics`.
12. User `uid1` attempting to write to an undeclared collection `/public/anything`.
