#!/bin/sh

curl --location --request POST 'localhost:3000/execute/' \
--header 'Content-Type: application/json' \
--data-raw '{
    "$a": {
        "inputs": [
            "fetchLatestData",
            "https://pomber.github.io/covid19/timeseries.json"
        ],
        "outputs": ["$b"]
    },
   "$b": {
        "inputs": [
            "processData",
            "$a"
        ],
        "outputs": ["$c"]
    },
    "$c": {
        "inputs": [
            "trainRNN",
            "$b",
            "7"
        ],
        "outputs": ["$result"]
    }
}'