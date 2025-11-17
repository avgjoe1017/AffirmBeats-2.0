# How to Sign In to Admin Dashboard

## Quick Start

1. **Open the login page:**
   ```
   http://localhost:3000/admin/login
   ```

2. **Sign in with your email and password**

3. **If you don't have an account:**
   - Click "Don't have an account? Sign up"
   - Enter your email, password, and name
   - Then sign in

4. **Set up admin access:**
   - Add your email to `ADMIN_EMAILS` in `backend/.env`:
     ```bash
     ADMIN_EMAILS=your@email.com
     ```
   - Restart the server

5. **Access admin dashboard:**
   - After signing in, you'll be redirected to `/admin`
   - Or manually go to `http://localhost:3000/admin`

## Using cURL (Command Line)

### Sign Up
```bash
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword","name":"Your Name"}' \
  -c cookies.txt
```

### Sign In
```bash
curl -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}' \
  -c cookies.txt
```

### Access Admin (with cookies)
```bash
curl http://localhost:3000/api/admin/dashboard \
  -b cookies.txt
```

## Using Browser DevTools

1. Open browser DevTools (F12)
2. Go to Console tab
3. Run:

```javascript
// Sign in
fetch('/api/auth/sign-in/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    email: 'your@email.com',
    password: 'yourpassword'
  })
}).then(r => r.json()).then(console.log);

// Check session
fetch('/api/auth/session', {
  credentials: 'include'
}).then(r => r.json()).then(console.log);
```

## Troubleshooting

**"UNAUTHORIZED" error:**
- Make sure you're signed in (check `/api/auth/session`)
- Verify your email is in `ADMIN_EMAILS` env var
- Clear cookies and sign in again

**"FORBIDDEN" error:**
- Your email is not in the admin list
- Add it to `ADMIN_EMAILS` in `.env` and restart server

**Can't sign up:**
- Check database is running
- Verify `DATABASE_URL` in `.env` is correct
- Check server logs for errors

**Session not persisting:**
- Make sure cookies are enabled
- Check `BETTER_AUTH_SECRET` is set in `.env`
- Verify `BACKEND_URL` matches your server URL

## Environment Setup

Make sure your `.env` file has:
```bash
BETTER_AUTH_SECRET=your-secret-key-here-min-32-chars
ADMIN_EMAILS=your@email.com
BACKEND_URL=http://localhost:3000
DATABASE_URL=postgresql://...
```

## Next Steps

After signing in:
1. Go to `/admin` to see the dashboard
2. Configure admin settings at `/admin/config`
3. Manage affirmations at `/admin/affirmations`
4. View users at `/admin/users`

