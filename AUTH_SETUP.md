# Firebase sign-in and sign-up

This repository is hosted as a static GitHub Pages site. `auth.html` provides email/password sign-up, sign-in, and sign-out using Firebase Authentication; Firebase handles password storage and authentication. There is no custom authentication server in this setup.

## Firebase Console setup

1. Open **Authentication → Sign-in method** and enable **Email/Password**.
2. In **Authentication → Settings → Authorized domains**, ensure `mohammad3230.github.io` is listed. Add `localhost` for local testing.
3. Deploy the files on the same origin as the site. The page will be available at `https://mohammad3230.github.io/PROJECT/auth.html`.
4. Open that URL and test account creation and sign-in.

The web config in `firebase-config.js` is public project-identification data and is intentionally used by the browser. Do not put service-account JSON, Admin SDK credentials, or private keys in frontend files. Restrict the API key in Google Cloud Console to the APIs and website referrers appropriate for this Firebase project. Firebase Authentication and any database must also have appropriate Firebase security rules; hiding UI is not access control.

## Local testing

Serve the repository over HTTP rather than opening the file directly, for example:

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000/auth.html`. Make sure `localhost` is an authorized Firebase domain.
