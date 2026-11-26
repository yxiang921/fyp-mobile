# FindSight — Mobile App

Mobile companion for the **missing-person face-recognition & CCTV alert system** (Final Year Project). Built with **Expo SDK 56** / React Native and backed by the existing Laravel 12 API (`fyp-system/`).

## Roles

| Role | What they can do |
| --- | --- |
| **Guest** (no login) | Browse missing persons in a **list/grid** layout, open case details, submit an **"I've seen this person"** sighting, and **submit a new missing-person case**. |
| **Super admin / PDRM officer / Patrol unit** (login) | See **notifications**, list all cases (any status), **update case status**, review sightings, receive **push notifications**, log out. |

---

## 1. Backend setup (Laravel — `../fyp-system/`)

The mobile API is an extension of the existing web backend. Before running the app, add the mobile API pieces:

```bash
cd ../fyp-system

# 1. Token auth (Laravel Sanctum)
composer require laravel/sanctum

# 2. Run the new migrations (personal_access_tokens, sightings, push_tokens)
#    ⚠️ This touches the PostgreSQL DB at 31.97.190.240 — run deliberately.
php artisan migrate

# 3. Serve on all interfaces so a phone on the same Wi-Fi can reach it
php artisan serve --host=0.0.0.0 --port=8000
```

The API key (`X-API-Key: xiang0000`, from `PYTHON_API_KEY` in the backend `.env`) is required on every request and is configured on the mobile side (see below).

### Seeded staff accounts

Sign in on the login screen with any existing **super admin / PDRM officer / patrol unit** account. If none exist, create one:

```bash
php artisan tinker
# >>> \App\Models\User::factory()->create(['role' => 'super_admin', 'email' => 'admin@findsight.test', 'password' => bcrypt('password')]);
```

---

## 2. Mobile setup

```bash
npm install
npx expo start
```

### Point the app at your backend

Edit **`app.json` → `extra`** — this is the single place the API URL and key live:

```json
"extra": {
  "apiUrl": "http://localhost:8000",
  "apiKey": "xiang0000",
  "eas": { "projectId": "" }
}
```

| Where the phone/emulator runs | `apiUrl` value |
| --- | --- |
| Android emulator (same PC) | `http://10.0.2.2:8000` |
| Physical device (same Wi-Fi) | `http://<your-LAN-IP>:8000` (e.g. `http://192.168.1.20:8000`) |
| Expo tunnel (anywhere) | the tunnel URL that `npx expo start --tunnel` prints |

> **Note:** the Android emulator maps the host machine's `localhost` to `10.0.2.2`. A physical phone cannot reach `localhost` — use your computer's LAN IP and keep `php artisan serve --host=0.0.0.0`.

---

## 3. Push notifications — setup & testing

Remote push **does not work in Expo Go on SDK 53+**. You need a **development build on a physical device**.

### Step 1 — Create the dev build

```bash
# If you don't have an EAS project yet, create one (gives you a projectId):
npx eas init

# Then copy the projectId into app.json → extra.eas.projectId, e.g.
#   "eas": { "projectId": "abc123-...." }

# Build & install the dev client on a connected physical device
npx eas build --platform android --profile development
#   … or a faster local build with Android Studio connected:
npx expo run:android
```

`extra.eas.projectId` is required so `getExpoPushTokenAsync()` resolves a real Expo Push Service token.

### Step 2 — Test from inside the app (one tap)

1. On the phone, open the dev build and **sign in** as a staff account.
2. Go to **Profile** (top-right from the Cases screen).
3. Tap **Register token** — the Expo push token appears (long-press to copy it).
4. Tap **Test push**.
5. A notification (`"Test push"`) should arrive in the device's notification tray within a few seconds — also shown as an in-app banner if the app is foregrounded.

> If **Test push** errors, check the backend log (`storage/logs/laravel.log`) for the `exp.host` response, and confirm `extra.eas.projectId` is set.

### Step 3 — Trigger-based pushes

Any notification created in the system now also fires a push (via the `Notification` model's `created` hook → `ExpoPushService`). To test the full loop:

- **Guest submits a sighting** ("I've seen this person") → all super admins + PDRM officers get a push.
- **Staff changes a case status** → the case creator (if a user) gets a push.
- **CCTV detection alert** (existing web path) → the assigned/notified user gets a push.

The token is registered automatically on login and removed on logout.

---

## 4. App structure

```
src/
  app/                 # expo-router screens
    _layout.tsx        # AuthProvider + Stack + theme
    index.tsx          # redirect gate (authed → /cases, else → /gallery)
    login.tsx          # staff sign-in + "continue as guest"
    gallery.tsx        # guest: list/grid of active cases
    person/[id].tsx    # guest: details + "I've seen this person" form
    report.tsx         # guest: submit a new missing-person case (photo upload)
    cases.tsx          # staff: all cases + status filter
    case/[id].tsx      # staff: details + status update + sightings
    notifications.tsx  # staff: notifications, mark read
    profile.tsx        # user info + push token + test push + logout
  components/          # UI primitives (ui.tsx) + PersonCard
  lib/                 # api.ts, auth-context.tsx, notifications.ts, types.ts, status.ts, format.ts
```

## 5. Useful commands

```bash
npx tsc --noEmit   # typecheck
npx expo start     # dev server (Expo Go / dev client)
npx expo run:android   # local dev build on a connected device/emulator
```
