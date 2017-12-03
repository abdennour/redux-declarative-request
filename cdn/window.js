const lib = require('../lib/index');

if (typeof window.redux === 'undefined') {
  window.redux = {};
}

window.redux.declarativeRequest = lib.declarativeRequest;
