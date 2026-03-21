# APK Build TODO (Local Expo Development Build)

## [ ] Step 1: Install dependencies
```bash
cd app/frontend &amp;&amp; npm install
```

## ✅ Step 2: Prebuild (generates native projects)\n```bash\ncd app/frontend &amp;&amp; npx expo prebuild --platform android\n```\n\n## [ ] Step 3: Build APK\n```bash\ncd app/frontend &amp;&amp; npx expo run:android\n```\n*Note: Requires Android Studio/SDK. APK in `app/frontend/android/app/build/outputs/apk/debug/`*

## [ ] Step 3: Build APK
```bash
cd app/frontend &amp;&amp; npx expo run:android
```
*Note: Requires Android Studio/SDK setup. APK will be in `app/frontend/android/app/build/outputs/apk/debug/`*

## [ ] Step 4: (Optional) Production APK
```bash
cd app/frontend/android &amp;&amp; ./gradlew assembleRelease
```
*Keystore signing may be required for release.*

