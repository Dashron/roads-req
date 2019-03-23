"use strict";

let apireq = require('./index.js');
let createServer = require('./tests/createServer.js');
// TODO: This is missing failure tests, such as "bad un/pw are not accepted for basic auth"

/**
 * Clean up request options
 * @param {object} options 
 */
function setOptionsToUseTestServer(options) {
    if (!options.request) {
        options.request = {};
    }

    options.request.port = createServer.port;
    options.request.hostname = 'localhost';
}

/**
 * Helper functions
 * 
 * @param {object} options 
 * @param {*} shouldSucceed 
 */
let makeRequest = function (options, shouldSucceed) {
    setOptionsToUseTestServer(options);
    return apireq.request(options);
};

describe('all tests', () => {
    let server = null;

    /**
     * Setup
     */
    beforeAll(() => {
        return createServer.createServer()
        .then((newServer) => {
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
        }, true)
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
        }, true)
        .then((response) => {
            expect(response.response.statusCode).toEqual(200);
            expect(response.body).toEqual([{
                id: 5,
                name: 'Harvey Birdman'
            }]);
        });
    });

    test('JSON get request with encoding', () => {
        expect.assertions(2);

        return makeRequest({
            request: {
                path: '/usersJSONWithCharset'
            }
        }, true)
        .then((response) => {
            expect(response.response.statusCode).toEqual(200);
            expect(response.body).toEqual([{
                id: 5,
                name: 'Harvey Birdman'
            }]);
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
        }, true)
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
        }, true)
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
        }, true)
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
        }, true)
        .then((response) => {
            expect(response.response.statusCode).toEqual(200);
            expect(response.body).toBe('basic');
        });
    });
});
