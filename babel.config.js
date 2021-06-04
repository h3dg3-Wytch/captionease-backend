module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "12.9.1" } }],
    "@babel/preset-typescript"
  ],
  "plugins": [
    [
      "module-resolver",
      {
        "root": ["./"],
        "extensions": [".js", ".ts"]
      }
    ],
    "@babel/proposal-class-properties",
    "@babel/proposal-object-rest-spread",
    "babel-plugin-inline-import",
    "@babel/plugin-transform-runtime",
    "const-enum",
    "import-graphql"
  ]
};

