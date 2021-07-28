const { flatten } = require('lodash');

const config = require('../infrastructure/config.json');

const handlers = flatten(
  Object.entries(config.services).map(([key, value]) =>
    value.handlers.map(({ name }) => name)
  )
).join('\n');

console.log(handlers);
