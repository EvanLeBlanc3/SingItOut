# 🎤 SingItOut

Type anything → pick one of 53 classic tunes → one of 22 singers sings your words back, ridiculously. Export it as a music video to your Photos.
Works fully **offline** on iPhone once installed. Portrait-locked (it won't rotate).

## Install on your iPhone (baby steps, same GitHub Pages method as before)

1. **Unzip** `SingItOut.zip` on your computer. You'll get a folder called `singitout`.
2. Go to **github.com** → sign in → tap **+** (top right) → **New repository**.
3. Name it `singitout`, set it to **Public**, tap **Create repository**.
4. On the new repo page, click **"uploading an existing file"**.
5. Open the `singitout` folder and drag **everything inside it** onto the page
   (`index.html`, `sw.js`, `manifest.webmanifest`, `README.md`, and the `css`, `js`, `icons` folders).
   ⚠️ Drag the *contents*, not the outer folder itself.
6. Click **Commit changes**.
7. Go to **Settings → Pages**. Under *Source* pick **Deploy from a branch**, branch **main**, folder **/(root)** → **Save**.
8. Wait 1–2 minutes. Your app lives at: `https://YOUR-USERNAME.github.io/singitout/`
9. On your iPhone, open that link in **Safari** → tap **Share** (square with arrow) → **Add to Home Screen** → **Add**.
10. Open it from the Home Screen **once while online** so it saves itself for offline use. Done! 🎉

## Make a music video 🎬
After a song finishes, tap **🎬 Video**. The app re-performs the song while recording (it takes as long as the song — keep the app open).
Then tap **📲 Save Video to Phone** → **Save Video**, and it lands in your Photos.

## Tips
- **No sound?** Turn the volume up. If it's still quiet, flip the silent switch off (older iOS versions mute web audio in silent mode).
- **Share** after a performance exports a `.wav` file you can text to friends (sorry, friends).
- **My Hits → Export** saves a backup file so clearing Safari data doesn't wipe your bangers.
- **Talky Human** uses iPhone's built-in speech voice; its timing is wobbly on purpose (okay, not on purpose, but it's funny).

## Updating later
Upload the changed files to the same repo (overwrite), and bump the version in `sw.js` (currently `singitout-v2` → `singitout-v3`) so phones grab the new version.
