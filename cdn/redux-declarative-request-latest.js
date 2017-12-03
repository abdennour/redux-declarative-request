(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require('./lib/index.js');

},{"./lib/index.js":3}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var MISSING_BASE_URL = exports.MISSING_BASE_URL = "\n \"baseUrl\" is required when using \"uri\" in the action.\n Specify \"baseUrl\" when configuring the middleware.\ni.e:\n       import declarativeRequest from 'redux-declarative-request';\n\n       declarativeRequest({\n        baseUrl: 'http://your-base.url/is/here'\n      });\n";

var MISSING_REQUEST_BUILDER = exports.MISSING_REQUEST_BUILDER = "\n Request builder function (\"buildRequest\") is required.\n You are trying to use redux-declarative-request without declaring \"buildRequest\".\n .i.e:\n\n     import declarativeRequest from 'redux-declarative-request';\n\n     declarativeRequest({\n      buildRequest: ({url, method, query, body, options}) => {\n         if (method === 'get' || method === 'options')\n          return window.fetch[method](url + '?' + q.string(query), options);\n        if (method === 'post' || method === 'put')\n           return window.fetch[method](url, body, options);\n      }\n    });\n";
},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.isRequest = isRequest;

exports.default = function () {
  var settings = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {
    onBeforeRequest: function onBeforeRequest(dispatch) {},
    onReceiveResponse: function onReceiveResponse(dispatch) {},
    onCompleteHandleResponse: function onCompleteHandleResponse(dispatch) {},
    buildRequestPromise: function buildRequestPromise(_ref) {
      var url = _ref.url,
          method = _ref.method,
          params = _ref.params,
          body = _ref.body;
      return Promise.reject(Errors.MISSING_REQUEST_BUILDER);
    },
    parseResponseCode: function parseResponseCode(error, response) {
      return error ? error.response.status : response.status;
    }
  };

  return function (store) {
    return function (next) {
      return function (action) {
        if (isRequest(action, settings)) {
          return request(action, settings)(store.dispatch);
        }
        next(action);
      };
    };
  };
};

var _errors = require('./errors');

var Errors = _interopRequireWildcard(_errors);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function isRequest(action, settings) {
  if (typeof action.uri === 'string' && !('baseUrl' in settings)) throw new Error(Errors.MISSING_BASE_URL);
  return typeof action.uri === 'string' || action.url === 'string';
}

function getUrl(action, settings) {
  return action.url ? action.url : '' + settings.baseUrl + action.uri;
}

function requestCallback(action, response, responseCode, hasError) {
  return function (settings) {
    return function (dispatch) {
      if (typeof action[String(responseCode)] === 'function') {
        var newAction = action[responseCode](action, response, hasError);
        dispatch(_extends({}, newAction, {
          hasError: hasError,
          responseCode: responseCode,
          type: action.type
        }));
      }
    };
  };
}

function request(action, settings) {
  var type = action.type,
      request = _objectWithoutProperties(action, ['type']);

  request = Object.assign({
    method: 'get',
    query: {},
    body: {},
    options: {}
  }, request);
  return function (dispatch) {
    dispatch(actions.startRequestCall(action));
    dispatch(showLoading());
    axios[request.method](getEndpoint(action, settings), requestArgs(request, 1), requestArgs(request, 2)).then(function (response) {
      var responseCode = settings.parseResponseCode(false, response);
      return requestCallback(action, response, responseCode, false)(dispatch);
    }).catch(function (error) {
      var responseCode = settings.parseResponseCode(error);
      return requestCallback(action, error, responseCode, true)(dispatch);
    });
  };
}
},{"./errors":2}]},{},[1]);