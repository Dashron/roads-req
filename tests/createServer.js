"use strict";
const port = 8080;

// creates an http server specifically for testing this request library
module.exports.createServer = () => {

    return new Promise((resolve, reject) => {
        let server = require('http').createServer();

        let body = '';
        let bodyFound = false;

        server.on('request', (request, response) => {
            // Get all the streaming input data from the request
            request.on('readable', () => {
                bodyFound = true;
                let chunk = null;
    
                while (null !== (chunk = request.read())) {
                    body += chunk;
                }
            });
    
            // When the request stops sending data, wrap it all up and find the proper API response
            request.on('end', () => {
                if (!bodyFound) {
                    body = undefined;
                }
    
                let routerResponse = router(request.method, request.url)(body, request.headers);
                response.writeHead(routerResponse.status, routerResponse.headers ? routerResponse.headers : {});

                if (typeof routerResponse.body !== "undefined") {
                    response.write(routerResponse.body);
                }

                response.end();
    
            });
    
            // Handle any errors
            request.on('error', (err) => {
                throw err;
            });
        });

        server.listen(this.port, () => {
            resolve(server);
        });

        server.on('error', (err) => {
            reject(err);
        });
    });
};

// Formatting help for building the responses interpreted by this test http server
function buildResponse(status, headers, body) {
    return {
        status: status,
        headers: headers,
        body: body
    };
};

/**
 * List of all test routes
 */
let routes = {
    '/basic': {
        'GET': (body, headers) => {
            return buildResponse(200, {}, 'basic');
        }
    },
    '/usersJSON': {
        'GET': (body, headers) => {
            return buildResponse(200, {
                "content-type": "application/json"
            }, JSON.stringify([{
                id: 5,
                name: 'Harvey Birdman'
            }]));
        }
    },
    '/usersJSONWithCharset': {
        'GET': (body, headers) => {
            return buildResponse(200, {
                "content-type": "application/json;charset=utf-8"
            }, JSON.stringify([{
                id: 5,
                name: 'Harvey Birdman'
            }]));
        }
    },
    '/contentTypeNoBody': {
        'GET': (body, headers) => {
            return buildResponse(200, {
                "content-type": "application/json;charset=utf-8"
            });
        }
    },
    '/echo': {
        'POST': (body, headers) => {
            return buildResponse(200, {}, body);
        }
    },
    '/auth': {
        'GET': (body, headers) => {
            if (!headers.authorization) {
                return buildResponse(400, {}, 'No authorization header');
            }

            let authHeader = headers.authorization.split(' ');

            if (authHeader[0] !== 'Basic') {
                return buildResponse(400, {}, 'Auth header is not basic');
            }

            let authParts = new Buffer(authHeader[1], 'base64').toString().split(':');

            if (authParts[0] !== 'harvey') {
                return buildResponse(400, {}, 'Username is not harvey');
            }

            if (authParts[1] !== 'birdman') {
                return buildResponse(400, {}, 'Password is not birdman');
            }

            return buildResponse(200, {});
        }
    },
    '/redirect': {
        'GET': (body, headers) => {
            return buildResponse(302, {'location': 'http://localhost:' + port + '/basic'})
        }
    }
};

/**
 * Function to help locate test routes
 * 
 * @param {*} method 
 * @param {*} url 
 */
function router (method, url) {
    if (routes[url] && routes[url][method]) {
        return routes[url][method];
    }

    return () => {
        return buildResponse(404, {}, 'Page not found');
    };
}

module.exports.port = port;