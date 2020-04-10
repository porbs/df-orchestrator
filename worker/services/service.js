const got = require('got');
const moment = require('moment');
const brain = require('brain.js')

async function fetchLatestData(uri) {
    const { Ukraine } = await got(uri, { responseType: 'json', resolveBodyOnly: true });
    return Ukraine;
}

function processData(data) {
    const processed = [];

    for (let item of data) {
        const date = moment(item.date, 'YYYY-MM-DD').toDate();
        const object = {
            date,
            trainData: [item.confirmed, item.deaths, item.recovered]

        };
        processed.push(object);
    }

    const sorted = processed
        .sort((a, b) => a.date - b.date)
        .map(item => item.trainData);

    const result = [];
    for (let i = 1; i < sorted.length; i++) {
        const item = []
        for (let j = 0; j < 3; j++) {
            item.push(sorted[i][j] - sorted[i - 1][j]);
        }
        result.push(item);
    }

    return result;
}

function trainRNN(data, ndays) {
    const network = new brain.recurrent.LSTMTimeStep({
        inputSize: 3,
        hiddenLayers: [50],
        outputSize: 3
    });

    const config = {
        iterations: 70000,
        log: true,
        logPeriod: 500
    };

    network.train(data, config);
    return network.forecast(data, ndays);
}

module.exports = { fetchLatestData, processData, trainRNN };