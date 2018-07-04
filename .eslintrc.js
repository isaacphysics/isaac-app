module.exports = {
    parserOptions: {
        parser: "babel-eslint",
        ecmaVersion: 2017,
        sourceType: "module",
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