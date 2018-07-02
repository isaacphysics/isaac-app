module.exports = {
    parserOptions: {
        parser: "babel-eslint",
        ecmaVersion: 6,
        sourceType: "module",
        allowImportExportEverywhere: false,
        codeFrame: false
    },
    env: {
        "browser": true,
        "jquery": true,
        "amd": true,
        "node": true,
        "es6": true
    },
    root: true,
    extends: [
        "eslint:recommended"
    ],
    rules: {
        "no-mixed-spaces-and-tabs": "off",
        "no-console": "off",
        "no-unused-vars": "off",
        "strict": 0
    }
}