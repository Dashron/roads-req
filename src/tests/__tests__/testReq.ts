"use strict";

import apireq, { RoadsRequestResponse, RoadsReqOptions } from '../../index';
import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import createServer, {port} from '../createServer';

// TODO: This is missing failure tests, such as "bad un/pw are not accepted for basic auth"

/**
 * Clean up request options
 * @param {object} options 
 */
function setOptionsToUseTestServer(options: RoadsReqOptions) {
    if (!options.request) {
        options.request = {};
    }

    options.request.port = port;
    options.request.hostname = 'localhost';
}

/**
 * Helper functions
 * 
 * @param {object} options 
 * @param {*} shouldSucceed 
 */
let makeRequest = function (options: RoadsReqOptions): Promise<RoadsRequestResponse> {
    setOptionsToUseTestServer(options);
    return apireq(options);
};

describe('all tests', () => {
    let server: HttpServer | HttpsServer;

    /**
     * Setup
     */
    beforeAll(() => {
        return createServer()
        .then((newServer: HttpServer | HttpsServer) => {
            server = newServer;
        });
    });

    /**
     * Shutdown
     */
    afterAll(() => {
        return server.close();
    });

    /**
     * Tests
     */
    test('basic get request', () => {
        expect.assertions(2);

        return makeRequest({
            request: {
                path: '/basic'
            }
        })
        .then((response) => {
            expect(response.response.statusCode).toEqual(200);
            expect(response.body).toBe('basic');
        });
    });

    test('JSON get request', () => {
        expect.assertions(2);

        return makeRequest({
            request: {
                path: '/usersJSON'
            }
        })
        .then((response) => {
            expect(response.response.statusCode).toEqual(200);
            expect(response.body).toEqual(JSON.stringify([{
                id: 5,
                name: 'Harvey Birdman'
            }]));
        });
    });

    test('JSON get request with encoding', () => {
        expect.assertions(2);

        return makeRequest({
            request: {
                path: '/usersJSONWithCharset'
            }
        })
        .then((response) => {
            expect(response.response.statusCode).toEqual(200);
            expect(response.body).toEqual(JSON.stringify([{
                id: 5,
                name: 'Harvey Birdman'
            }]));
        });
    });

    test('post request with body', () => {
        expect.assertions(2);

        return makeRequest({
            request: {
                method: 'POST',
                path: '/echo'
            },
            requestBody: "test test test"
        })
        .then((response) => {
            expect(response.response.statusCode).toEqual(200);
            expect(response.body).toBe("test test test");
        });
    });

    test('get request with basic auth', () => {
        expect.assertions(1);

        return makeRequest({
            request: {
                method: 'GET',
                path: '/auth'
            },
            basicAuth: {
                un: "harvey",
                pw: "birdman"
            }
        })
        .then((response) => {
            expect(response.response.statusCode).toEqual(200);
        });
    });

    test('dont follow redirect', () => {
        expect.assertions(2);

        return makeRequest({
            request: {
                method: 'GET',
                path: '/redirect'
            },
            followRedirects: false
        })
        .then((response) => {
            expect(response.response.statusCode).toEqual(302);
            expect(response.response.headers.location).toBe('http://localhost:8080/basic');
        });
    });

    test('follow redirect', () => {
        expect.assertions(2);

        return makeRequest({
            request: {
                method: 'GET',
                path: '/redirect'
            },
            followRedirects: true
        })
        .then((response) => {
            expect(response.response.statusCode).toEqual(200);
            expect(response.body).toBe('basic');
        });
    });

    test('content type without body doesn\'t error', () => {
        expect.assertions(2);

        return makeRequest({
            request: {
                method: 'GET',
                path: '/contentTypeNoBody'
            }
        })
        .then((response) => {
            expect(response.response.statusCode).toEqual(200);
            expect(response.body).toBe('');
        });
    });

    
});
