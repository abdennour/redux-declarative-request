const url = require('url');
const Errors = require('./errors');

function isLiteralObject(x) {
  return x && x.constructor === Object;
}

function isFunction(x) {
  return typeof x === 'function';
}

function isRequest(action, settings) {
  if (typeof action.uri === 'string' && !('baseUrl' in settings))
    throw new Error(Errors.MISSING_BASE_URL);
  return typeof action.uri === 'string' || typeof action.url === 'string';
}

function getUrl(action, baseUrl) {
  return action.url ? action.url : url.resolve(baseUrl, action.uri);
}
/**
 * if action={method:'post',...,'200': foo, '404|405': bar}
 * and if responseCode is 404,
 * this helper will return bar as its key matches response code
 * @type {[type]}
 */
function getResponseHandlersKeys(action, responseCode) {
  return Object.keys(action).filter(
    handlerKey =>
      handlerKey.indexOf(String(responseCode)) >= 0 &&
      (isLiteralObject(action[String(responseCode)]) ||
        isFunction(action[String(responseCode)]))
  );
}

function requestCallback(action, response, responseCode, hasError) {
  return settings => dispatch => {
    if (isFunction(settings.onReceiveResponse)) {
      settings.onReceiveResponse(dispatch);
    }
    const newAction = getResponseHandlersKeys(
      action,
      responseCode
    ).reduce((all, handlerKey) => {
      let subAction = action[handlerKey]; // can be only object or function according to filter of "getResponseHandlersKeys"
      if (isFunction(subAction)) {
        subAction = subAction(action, response); // if function is called , should return an action (literal object)
      } // else it is already object
      return {
        ...all,
        ...subAction
      };
    }, {});
    if (isFunction(settings.onCompleteHandleResponse)) {
      settings.onCompleteHandleResponse(dispatch);
    }
  };
}

function request(action, settings) {
  let { type, ...request } = action;
  request = Object.assign(
    {
      method: 'get',
      query: {},
      body: {},
      options: {}
    },
    request
  );
  return dispatch => {
    if (isFunction(settings.onBeforeRequest)) {
      settings.onBeforeRequest(dispatch);
    }
    settings
      .buildRequestPromise(
        {
          url: getUrl(action, settings.baseUrl),
          method: request.method
        },
        action
      )
      .then(response => {
        const responseCode = settings.parseResponseCode(false, response);
        return requestCallback(action, response, responseCode, false)(dispatch);
      })
      .catch(error => {
        const responseCode = settings.parseResponseCode(error);
        return requestCallback(action, error, responseCode, true)(dispatch);
      });
  };
}

function declarativeRequest(
  settings = {
    //  baseUrl: process.env.REACT_APP_API _URL,
    //onBeforeRequest: dispatch => {},
    // onReceiveResponse: dispatch => {},
    // onCompleteHandleResponse: dispatch => {},
    buildRequestPromise: ({ url, method }, action) =>
      Promise.reject(Errors.MISSING_REQUEST_BUILDER),
    parseResponseCode: (error, response) =>
      error ? error.response.status : response.status
  }
) {
  return store => next => action => {
    if (isRequest(action, settings)) {
      return request(action, settings)(store.dispatch);
    }
    next(action);
  };
}

module.exports = {
  isLiteralObject,
  isFunction,
  isRequest,
  getUrl,
  getResponseHandlersKeys,
  requestCallback,
  request,
  declarativeRequest
};
