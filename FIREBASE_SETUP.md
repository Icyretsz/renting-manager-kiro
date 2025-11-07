# Firebase Push Notifications Setup

## Getting Your VAPID Key

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `phongtro-d674b`
3. **Navigate to Project Settings**:
   - Click the gear icon ⚙️ in the left sidebar
   - Select "Project settings"
4. **Go to Cloud Messaging tab**
5. **Find Web Push certificates section**
6. **Generate or copy your VAPID key**:
   - If no key exists, click "Generate key pair"
   - Copy the key that looks like: `BK7dVA9efHzgp...` (long string)

## Add to Environment Variables

Add this to your `client/.env` file:
```
VITE_FIREBASE_VAPID_KEY=BK7dVA9efHzgp... (your actual key)
```

## Restart Development Server

After adding the VAPID key:
```bash
npm run dev
```

## Testing Notifications

1. **Load the page** - You should see a notification permission request
2. **Click "Allow"** when prompted
3. **Check browser console** for success messages:
   - `✅ FCM token registered successfully`
   - `✅ Push notifications initialized successfully`

## Troubleshooting

- **No permission request**: Check if VAPID key is set correctly
- **Console errors**: Check Firebase configuration in `.env`
- **Service worker errors**: Make sure `firebase-messaging-sw.js` is in `public/` folder