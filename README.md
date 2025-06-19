# Project Setup

## Initial Setup

```bash
# to remove any existing packages, clean setup
rm -rf node_modules package-lock.json

npm install

# to check app status
npx expo-doctor
npx expo install --check
```

## Run the App

```bash
npx expo start

# to clear cache before launch
npx expo start -c
npx expo start --clear
```

## Development Commands

> **Note:** The following commands are for development reference only
> 
> <span style="color: red;">**DO NOT USE IT**</span>

```bash
npm outdated
npx npm-check-updates -u
npm audit fix
npm uninstall react-native-responsive-screen
npm install react-native-size-matters
rm -rf node_modules package-lock.json .expo .expo-shared metro-cache
```
