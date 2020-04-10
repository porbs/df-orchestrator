var express = require('express');
var router = express.Router();
const _ = require('lodash');
const request = require('request-promise');
const asyncHandler = require('express-async-handler');
const service = require('../services/service');

const state = {};

function operation(opName, ...args) {
  console.log(`performing: ${opName}`);
  return service[opName](...args);
}

function parseInputs(inputs) {
  console.log('before parse: ', inputs);
  const res = inputs.map(input => (_.isString(input) && (input.indexOf('$') !== -1)) ? null : input);
  console.log('parsed inputs: ', res);
  return res;
}

function canExecute(sessionKey, operationKey) {
  return !_.some(state[sessionKey][operationKey].inputs, (value) => value === null);
}

/* GET home page. */
router.post('/execute', asyncHandler(async (req, res, next) => {
  const meta = req.body;
  const label = meta.label;
  const job = meta.job[label];
  const sessionKey = meta.sessionKey;
  const operationKey = meta.operationKey;
  const parsedInputs = parseInputs(job.inputs);
  const prefix = `[${sessionKey}][${operationKey}]`;
  console.log(`${prefix} executing subtask: ${label}`);

  console.log(prefix + ' current state: ', state[sessionKey]);
  if (!_.has(state, [sessionKey, operationKey])) {
    _.set(state, [sessionKey, operationKey], { inputs: parsedInputs });
  } else {
    for (let i = 0; i < parsedInputs.length; i++) {
      if (parsedInputs[i] !== null) {
        state[sessionKey][operationKey].inputs[i] = parsedInputs[i];
      }
    }
  }
  console.log(prefix + ' new state: ', state[sessionKey]);

  if (canExecute(sessionKey, operationKey)) {
    console.log(prefix + ' can be executed');
    const result = await operation(...state[sessionKey][operationKey].inputs);
    const outputs = job.outputs;

    for (let output of outputs) {
      if (output === '$result') continue;
      const outInputs = meta.job[output].inputs;
      for (let i = 0; i < outInputs.length; i++) {
        if (outInputs[i] === label) {
          outInputs[i] = result;
        }
      }
    }

    for (let output of outputs) {
      console.log(prefix + ' sending result to: ', output);
      const uri = meta.services[output].uri;
      const body = output === '$result' ? { result } : {
        job: meta.job,
        services: meta.services,
        label: output,
        sessionKey,
        operationKey: operationKey + 1
      };
      request({
        uri,
        method: 'POST',
        body,
        json: true
      });
    }

    res.send();
  }
}));

module.exports = router;
