[![Build Status](https://travis-ci.org/abdennour/redux-declarative-request.svg?branch=master)](https://travis-ci.org/abdennour/redux-declarative-request)
[![Coverage Status](https://coveralls.io/repos/github/abdennour/redux-declarative-request/badge.svg?branch=master)](https://coveralls.io/github/abdennour/redux-declarative-request?branch=master)

# Overview :

Making Promised requests following declarative programming paradigm leveraging redux actions structure

# Install

```bash
npm install redux-declarative-request --save;
```

# Example :

```js
import { declarativeRequest } from 'redux-declarative-request';

const requestMiddleware = declarativeRequest({
  baseUrl: 'https://api.example.com/xx',
  initialThen: response => response, // response.json()
  //onBeforeRequest: dispatch => {},
  // onReceiveResponse: dispatch => {},
  // onCompleteHandleResponse: dispatch => {},
  buildRequestPromise: ({ url, method }, action) =>
    Promise.reject(Errors.MISSING_REQUEST_BUILDER),
  parseResponseCode: (error, response, action) =>
    error ? error.response.status : response.status
})


const store = createStore(reducers, requestMiddleware);
```

Ready implementation for some http agents are available under package pattern : `redux-declarative-request-[REQUEST-ARGENT]`.

.i.e: `redux-declarative-request-axios`

# License:

MIT .
