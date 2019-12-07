/// <reference types="node" />
import { RequestOptions as HttpRequestOptions, IncomingMessage } from "http";
import { RequestOptions as HttpsRequestOptions } from "https";
export interface RoadsReqOptions {
    request: HttpRequestOptions | HttpsRequestOptions;
    response?: {
        encoding: string;
    };
    requestBody?: string;
    basicAuth?: {
        un: string;
        pw: string;
    };
    followRedirects?: boolean;
}
export interface RoadsRequestResponse {
    response: IncomingMessage;
    body: string;
}
/**
    Options can take four top level fields.
    1. options.request contains all the HTTP request options (as defined in https://nodejs.org/api/http.html#http_http_request_options_callback)
    2. options.response is an object with additional information about the response. Currently this only supports the subfield "encoding" for the response encoding
    3. options.requestBody which is a static string containing the body to send with this request
    4. options.basicAuth which is an object containing "un" and "pw" fields that will be translated into the proper basic auth header
    5. options.followRedirects which is a boolean that states whether or not the client should immediately follow any HTTP redirects and return the value of the final request. This currently has NO protection against infinite redirects.
 */
export default function roadsRequest(options: RoadsReqOptions): Promise<RoadsRequestResponse>;
