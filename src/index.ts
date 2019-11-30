"use strict";

import { RequestOptions as HttpRequestOptions, IncomingMessage } from "http";
import { RequestOptions as HttpsRequestOptions} from "https";
import * as http from 'http';
import * as https from 'https';
import * as contentType from 'content-type';

export interface RoadsReqOptions {
    request: HttpRequestOptions | HttpsRequestOptions, 
    response?: { encoding: string}, 
    requestBody?: string, 
    basicAuth?: {un: string, pw: string}, 
    followRedirects?: boolean
}

export interface RoadsRequestResponse {
        response: IncomingMessage,
        body: string | {[x: string]: any}
}

/**
    Options can take four top level fields.
    1. options.request contains all the HTTP request options (as defined in https://nodejs.org/api/http.html#http_http_request_options_callback)
    2. options.response is an object with additional information about the response. Currently this only supports the subfield "encoding" for the response encoding
    3. options.requestBody which is a static string containing the body to send with this request
    4. options.basicAuth which is an object containing "un" and "pw" fields that will be translated into the proper basic auth header
    5. options.followRedirects which is a boolean that states whether or not the client should immediately follow any HTTP redirects and return the value of the final request. This currently has NO protection against infinite redirects.
 */
export default function roadsRequest (options: RoadsReqOptions): Promise<RoadsRequestResponse> {
    _handleRequestBody(options);
    _handleBasicAuth(options);

    return new Promise((resolve, reject) => {
        let httpLib = options.request.protocol === 'https' ? https : http;
        delete options.request.protocol;
        
        // Build the request body
        let request = httpLib.request(options.request, (res: IncomingMessage) => {
            res.setEncoding(options.response && options.response.encoding ? options.response.encoding : 'utf8');
            let body = '';

            // Receive response body data
            res.on('data', (chunk: string) => {
                body += chunk;
            });
            
            // Handle the end of the response body
            res.on('end', () => {
                // Handle redirects
                if (options.followRedirects && [301, 302].indexOf(Number(res.statusCode)) != -1) {
                    let newUrl = new URL(String(res.headers['location']));
                    options.request.path = newUrl.pathname;
                    return resolve(roadsRequest(options));
                }

                resolve({
                    response: res,
                    body: _parseResponseBody(res, body)
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

/**
 * 
 * @param {object} options 
 * @param {function} fn 
 */
export function _handleRequestBody (options: RoadsReqOptions): void {
    if (typeof options.requestBody === "object") {
        options.requestBody = JSON.stringify(options.requestBody);

        if (typeof options.request.headers !== "object") {
            options.request.headers = {};
        }

        options.request.headers['content-type'] = 'application/json';
    }
}

export function _handleBasicAuth (options: RoadsReqOptions): void {
    if (options.basicAuth) {
        if (typeof options.request.headers !== "object") {
            options.request.headers = {};
        }

        options.request.headers.authorization = 'Basic ' + Buffer.from(options.basicAuth.un + ':' + options.basicAuth.pw).toString('base64');
    }
}

export function _parseResponseBody (response: IncomingMessage, responseBody: string): string | {[x: string]: any} {
    if (!response.headers['content-type']) {
        return responseBody;
    }

    if (responseBody === undefined || responseBody === '') {
        return responseBody;
    }

    let parsedContentType = contentType.parse(response.headers['content-type']);

    if (parsedContentType.type === 'application/json') {
        return JSON.parse(responseBody);
    }

    return responseBody;
}