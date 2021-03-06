import url from 'url';
import * as Errors from './errors';

const defaultRequest = {
  method: 'get',
  query: {},
  body: {},
  options: {}
};

const middlewareDefaultSettings = {
  //  baseUrl: process.env.REACT_APP_API _URL,
  initialThen: (response, action) => response, // For fetch: can be needed: response.json()
  //onBeforeRequest: dispatch => {},
  // onReceiveResponse: dispatch => {},
  // onCompleteHandleResponse: dispatch => {},
  buildRequestPromise: ({ url, method }, action) =>
    Promise.reject(Errors.MISSING_REQUEST_BUILDER),
  parseResponseCode: (error, response, action) =>
    error ? error.response.status : response.status
};

export function isLiteralObject(x) {
  return x && x.constructor === Object;
}

export function isFunction(x) {
  return typeof x === 'function';
}

export function isRequest(action, settings) {
  if (typeof action.uri === 'string' && !('baseUrl' in settings))
    throw new Error(Errors.MISSING_BASE_URL);
  return typeof action.uri === 'string' || typeof action.url === 'string';
}

export function getUrl(action, baseUrl) {
  if (action.url) return action.url;
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const uri = action.uri.startsWith('/') ? action.uri.slice(1) : action.uri;
  return `${base}/${uri}`;
}
/**
 * if action={method:'post',...,'200': foo, '404|405': bar}
 * and if responseCode is 404,
 * this helper will return bar as its key matches response code
 * @type {[type]}
 */
export function getResponseHandlersKeys(action, responseCode) {
  return Object.keys(action).filter(
    handlerKey =>
      handlerKey.indexOf(String(responseCode)) >= 0 &&
      (isLiteralObject(action[String(responseCode)]) ||
        isFunction(action[String(responseCode)]))
  );
}

export function getAggregatedAction(action, response, responseCode) {
  return getResponseHandlersKeys(action, responseCode).reduce(
    (all, handlerKey) => {
      let subAction = action[handlerKey]; // can be only object or export function according to filter of "getResponseHandlersKeys"
      if (isFunction(subAction)) {
        subAction = subAction(action, response); // if export function is called , should return an action (literal object)
      } // else it is already object
      return isLiteralObject(subAction) ? { ...all, ...subAction } : all;
    },
    {}
  );
}

export function handleResponse(action, response, responseCode, hasError) {
  return settings => dispatch => {
    if (isFunction(settings.onReceiveResponse)) {
      settings.onReceiveResponse(dispatch, action);
    }
    const aggregatedActions = getAggregatedAction(
      action,
      response,
      responseCode
    );

    const responseAction = {
      ...omitCallbacks(action),
      ...aggregatedActions,
      type: action.type,
      hasError,
      responseCode
    };
    delete responseAction.url;
    delete responseAction.uri;

    dispatch(responseAction);

    if (isFunction(settings.onCompleteHandleResponse)) {
      settings.onCompleteHandleResponse(dispatch, action);
    }
  };
}

export function request(action, settings) {
  let { type, ...request } = action;
  request = {
    ...defaultRequest,
    ...request
  };
  return dispatch => {
    if (isFunction(settings.onBeforeRequest)) {
      settings.onBeforeRequest(dispatch, action);
    }
    let responseCode;

    settings
      .buildRequestPromise(
        {
          url: getUrl(action, settings.baseUrl),
          method: request.method
        },
        action
      )
      .then(response => {
        responseCode = settings.parseResponseCode(
          false,
          response,
          action
        );
        return settings.initialThen(response, action);
      })
      .then(response => {
        return handleResponse(action, response, responseCode, false)(settings)(
          dispatch
        );
      })
      .catch(error => {
        responseCode = settings.parseResponseCode(error, null, action);
        return handleResponse(action, error, responseCode, true)(settings)(
          dispatch
        );
      });
  };
}

// Useful in "settings.buildRequestPromise"
// it removes all callbacks from a literal objects
export function omitCallbacks(action) {
  return Object.keys(action).filter(k => typeof action[k] !== 'function').reduce(
    (newAction, k) => ({ ...newAction, [k]: action[k] }),
    {}
  );
}

export function declarativeRequest(configuration) {
  const settings = { ...middlewareDefaultSettings, ...configuration };
  return store => next => action => {
    if (isRequest(action, settings)) {
      return request(action, settings)(store.dispatch);
    }
    next(action);
  };
}
