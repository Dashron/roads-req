"use strict";

const http = require('http');
const https = require('https');

/**
    Options can take four top level fields.
    1. options.request contains all the HTTP request options (as defined in https://nodejs.org/api/http.html#http_http_request_options_callback)
    2. options.response is an object with additional information about the response. Currently this only supports the subfield "encoding" for the response encoding
    3. options.requestBody which is a static string containing the body to send with this request
    4. options.basicAuth which is an object containing "un" and "pw" fields that will be translated into the proper basic auth header
 */
module.exports.request = function (options) {
    this._applyDefaults(options);
    this._handleRequestBody(options);
    this._handleBasicAuth(options);

    return new Promise((resolve, reject) => {
        let httpLib = options.request.protocol === 'https:' ? https : http;

        // Build the request body
        let request = httpLib.request(options.request, (res) => {
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
    ifEmptyThenSet(options.request, 'headers', {});
    ifEmptyThenSet(options.request, 'protocol', 'http:');
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

module.exports._handleBasicAuth = function (options) {
    if (options.basicAuth) {
        options.request.headers.authorization = 'Basic ' + new Buffer(options.basicAuth.un + ':' + options.basicAuth.pw).toString('base64')
    }
}

module.exports._parseResponseBody = function (response, responseBody) {
    if (response.headers['content-type'] === 'application/json') {
        return JSON.parse(responseBody);
    }

    return responseBody;
}