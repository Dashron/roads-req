"use strict";

const http = require('http');

/**
    Options can take three top level fields.
    1. options.request contains all the HTTP request options (as defined in https://nodejs.org/api/http.html#http_http_request_options_callback)
    2. options.response is an object with additional information about the response. Currently this only supports the subfield "encoding" for the response encoding
    3. options.requestBody which is a static string containing the body to send with this request
 */
module.exports.request = function (options) {
    this._applyDefaults(options);
    this._handleRequestBody(options);

    return new Promise((resolve, reject) => {

        // Build the request body
        let request = http.request(options.request, (res) => {
            res.setEncoding(options.response.encoding);
            let body = '';

            // Receive response body data
            res.on('data', (chunk) => {
                body += chunk;
            });
            
            // Handle the end of the response body
            res.on('end', () => {
                resolve({
                    response: res,
                    body: this._parseResponseBody(res, body)
                });
            });
        });

        // Handle request errors
        request.on('error', (e) => {
            reject(e);
        });

        // Send the request body
        if (options.requestBody) {
            request.write(options.requestBody);
        }

        // End the request
        request.end();
    });
}

function ifEmptyThenSet(object, key, value) {
    if (typeof object[key] === "undefined") {
        object[key] = value;
    }
}

module.exports._applyDefaults = function (options) {
    ifEmptyThenSet(options, 'request', {});
    ifEmptyThenSet(options, 'response', {});
    ifEmptyThenSet(options.response, 'encoding', 'utf8');
}

/**
 * 
 * @param {object} options 
 * @param {function} fn 
 */
module.exports._handleRequestBody = function (options) {
    if (typeof options.requestBody === "object") {
        options.requestBody = JSON.stringify(options.requestBody);
        options.request.headers['content-type'] = 'application/json';
    }
}

module.exports._parseResponseBody = function (response, responseBody) {
    if (response.headers['content-type'] === 'application/json') {
        return JSON.parse(responseBody);
    }

    return responseBody;
}