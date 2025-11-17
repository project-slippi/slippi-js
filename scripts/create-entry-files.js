#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const DIST_DIR = path.join(__dirname, "../dist");

// Create Node entry file
const nodeEntry = `'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./node/index.node.cjs.production.min.js')
} else {
  module.exports = require('./node/index.node.cjs.development.js')
}
`;

fs.writeFileSync(path.join(DIST_DIR, "index.node.js"), nodeEntry, "utf8");
console.log("✓ Generated Node.js entry: index.node.js");

// Create Browser entry file
const browserEntry = `'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./browser/slippi-js.cjs.production.min.js')
} else {
  module.exports = require('./browser/slippi-js.cjs.development.js')
}
`;

fs.writeFileSync(path.join(DIST_DIR, "index.js"), browserEntry, "utf8");
console.log("✓ Generated Browser entry: index.js");
