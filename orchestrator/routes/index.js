var express = require('express');
var router = express.Router();
const request = require('request-promise');
const asyncHandler = require('express-async-handler');
const _ = require('lodash');

const workers = [
  { uri: 'http://worker1:3000/execute' },
  { uri: 'http://worker2:3000/execute' },
  { uri: 'http://worker3:3000/execute' }
];
resultUri = 'http://orchestrator:3000/result/';

const storage = {};

function getServicesMapping(job) {
  const nodes = Object.keys(job);
  const services = {};

  for (let i = 0; i < nodes.length; i++) {
    services[nodes[i]] = workers[i % workers.length];
  }
  return services;
}

function generateSessionKey() {
  return new Date().getTime().toString();
}

function canEvaluate(serviceConfig) {
  const res = !_.some(serviceConfig.inputs, input => _.isString(input) && (input.indexOf('$') !== -1));
  console.log('can evaluate: ', serviceConfig.inputs, res);
  return res;
}

router.post('/execute', asyncHandler(async (req, res, next) => {
  const job = req.body;
  const services = getServicesMapping(job);
  const sessionKey = generateSessionKey();
  services['$result'] = { uri: resultUri + sessionKey };
  for (let subtask in job) {
    console.log('parsing subtask: ', subtask);
    if (canEvaluate(job[subtask])) {
      console.log('sending job to: ', services[subtask].uri);
      request({
        uri: services[subtask].uri,
        method: 'POST',
        body: {
          job,
          services,
          label: subtask,
          sessionKey,
          operationKey: 0
        },
        json: true
      });
    }
  }

  res.json({ sessionKey });
}));


router.post('/result/:key', asyncHandler(async (req, res, next) => {
  const key = req.params.key;
  const result = req.body;
  console.log(`[${key}] got result: ${result.result}`);
  storage[key] = result;
  res.send()
}));

router.get('/result/:key', asyncHandler(async (req, res, next) => {
  const key = req.params.key;
  res.json(storage[key]);
}));

module.exports = router;
