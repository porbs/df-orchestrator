#!/bin/sh

curl --location --request POST 'localhost:3000/execute/' \
--header 'Content-Type: application/json' \
--data-raw '{
    "$a": {
        "inputs": [3, 2],
        "outputs": ["$c"]
    },
   "$b": {
        "inputs": [3, 4],
        "outputs": ["$c"]
    },
    "$c": {
        "inputs": ["$a", "$b"],
        "outputs": ["$result"]
    }
}'