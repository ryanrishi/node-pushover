export = Pushover;
/**
 * Creates a new Pushover instance.
 * @class
 * @param {object} opts - The options for Pushover.
 * @param {string} opts.token - The Pushover API token.
 * @param {string} opts.user - The user key for sending messages.
 * @param {object} [opts.httpOptions] - Optional HTTP options.
 * @param {boolean} [opts.debug] - Enable debug logging.
 * @param {function} [opts.onerror] - Custom error handler.
 * @param {boolean} [opts.update_sounds] - Automatically update sounds.
 */
declare function Pushover(opts: {
    token: string;
    user: string;
    httpOptions?: object;
    debug?: boolean;
    onerror?: Function;
    update_sounds?: boolean;
}): void;
declare class Pushover {
    /**
     * Creates a new Pushover instance.
     * @class
     * @param {object} opts - The options for Pushover.
     * @param {string} opts.token - The Pushover API token.
     * @param {string} opts.user - The user key for sending messages.
     * @param {object} [opts.httpOptions] - Optional HTTP options.
     * @param {boolean} [opts.debug] - Enable debug logging.
     * @param {function} [opts.onerror] - Custom error handler.
     * @param {boolean} [opts.update_sounds] - Automatically update sounds.
     */
    constructor(opts: {
        token: string;
        user: string;
        httpOptions?: object;
        debug?: boolean;
        onerror?: Function;
        update_sounds?: boolean;
    });
    boundary: string;
    token: string;
    user: string;
    httpOptions: any;
    sounds: {
        pushover: string;
        bike: string;
        bugle: string;
        cashregister: string;
        classical: string;
        cosmic: string;
        falling: string;
        gamelan: string;
        incoming: string;
        intermission: string;
        magic: string;
        mechanical: string;
        pianobar: string;
        siren: string;
        spacealarm: string;
        tugboat: string;
        alien: string;
        climb: string;
        persistent: string;
        echo: string;
        updown: string;
        none: string;
    };
    debug: true;
    onerror: Function;
    /**
     * Handles errors from Pushover API responses.
     * @param {string|object} d - The response data from the API.
     * @param {object} res - The HTTP response object.
     * @throws {Error} Throws an error if there are API errors and no error handler is provided.
     */
    errors(d: string | object, res: object): void;
    /**
     * Updates the list of available Pushover sounds.
     */
    updateSounds(): void;
    /**
     * Sends a message using Pushover.
     * @param {object} obj - The message object to send.
     * @param {string} obj.token - The API token.
     * @param {string} obj.user - The user key.
     * @param {string} [obj.file] - Optional file attachment.
     * @param {PushoverCallback} fn - The callback function that handles the response.
     */
    send(obj: {
        token: string;
        user: string;
        file?: string;
    }, fn: PushoverCallback): void;
}
declare namespace Pushover {
    export { PushoverCallback };
}
/**
 * A callback function that handles the result of the Pushover send operation.
 */
type PushoverCallback = (error: Error | null, result: any) => any;
