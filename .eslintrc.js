// eslint.config.js
module.exports = 
{
    extends: [
        "eslint"
    ],
    overrides: [{
        files: ["demo/addons/trackview/**/*.js"],
        rules: {
            semi: "error"
        }
    }]
};
