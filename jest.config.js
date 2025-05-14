module.exports = {
  testTimeout: 300000, // 5 minutes in milliseconds
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        //the content originally placed at "global"
        diagnostics: false,
      },
    ],
  },
};
