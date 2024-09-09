# React native fishjam example

## Running the Example app

1. Clone the repository:

```
git clone https://github.com/fishjam-cloud/mobile-client-sdk.git
cd mobile-client-sdk
```

2. Install node_modules in project root directory:

```cmd
yarn
```

3. Install node_modules in `examples/fishjam-chat` directory:

```cmd
cd `examples/fishjam-chat` && yarn
```

4. Start Metro bundler in `examples/fishjam-chat` directory

```cmd
yarn start
```

5. Run in other terminal window command below to run app on selected platform.

```cmd
yarn ios
```

or

```cmd
yarn android
```

## Testing

> [!NOTE]  
> If you add crucial files that should affect output of android .apk file make sure to add that file to github actions files: [cache action](../.github/actions/cache_apk_file/action.yml) and [restore action](../.github/actions/restore_apk_file/action.yml).

For testing checkout [README](webdriverio-test/readme.md) in `webdriverio-test` directory.
