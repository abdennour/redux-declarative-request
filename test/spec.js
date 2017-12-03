import expect from 'expect';
import sinon from 'sinon';
import { generate as generateString } from 'randomstring';
import {
  isLiteralObject,
  isFunction,
  isRequest,
  getUrl,
  getResponseHandlersKeys,
  getAggregatedAction,
  handleResponse,
  request,
  declarativeRequest
} from '../src';

const fakedAgent = {
  get: (url, params) =>
    Promise[Date.now() % 2 ? 'resolve' : 'reject'](generateString())
};
describe(`redux-declarative-request`, () => {
  let dispatch;
  beforeEach(() => {
    dispatch = sinon.spy();
  });
  describe('isLiteralObject', () => {
    it('checks if variable is literal object', () => {
      let instance = {};
      expect(isLiteralObject(instance)).toBeTruthy();
      instance = { firstname: 'Yes' };
      expect(isLiteralObject(instance)).toBeTruthy();
    });

    it('checks if variable is not literal object', () => {
      let instance = [''];
      expect(isLiteralObject(instance)).toBeFalsy();
      instance = 'any string';
      expect(isLiteralObject(instance)).toBeFalsy();
      class Person {}
      instance = new Person();
      expect(isLiteralObject(instance)).toBeFalsy();
    });
    it('does not consider "null" a literal object', () => {
      expect(isLiteralObject(null)).toBeFalsy();
    });
  });

  describe('isFunction', () => {
    it('validates function type', () => {
      const variable = function() {};
      expect(isFunction(variable)).toBeTruthy();
    });

    it('considers class type as function', () => {
      class SomeClass {}
      expect(isFunction(SomeClass)).toBeTruthy();
    });

    it('considers class method type as function', () => {
      class SomeClass {
        static someMethod() {}
      }
      expect(isFunction(SomeClass.someMethod)).toBeTruthy();
    });
  });

  describe('isRequest', () => {
    let action, settings;
    beforeEach(() => {
      action = { type: generateString() };
      settings = { baseUrl: `https://${generateString()}` };
    });

    it('considers an action as an HTTP request if it includes "uri"', () => {
      action.uri = `/${generateString()}/${generateString()}`;
      expect(isRequest(action, settings)).toBeTruthy();
    });

    it('considers an action as an HTTP request if it includes "url"', () => {
      action.url = `https://${generateString()}/${generateString()}?${generateString()}`;
      expect(isRequest(action, settings)).toBeTruthy();
    });
    it('throws error if "uri" provided in the action without a baseUrl in the settings', () => {
      action.uri = `https://${generateString()}/${generateString()}`;
      delete settings.baseUrl;
      expect(() => {
        isRequest(action, settings);
      }).toThrow();
    });
  });

  describe('getUrl', () => {
    let action, baseUrl;
    beforeEach(() => {
      action = { type: generateString() };
      baseUrl = `https://${generateString()}`;
    });
    it('builds a full url from "uri" (in action) and "baseUrl"', () => {
      action.uri = 'hi';
      baseUrl = 'http://ho.co';
      expect(getUrl(action, baseUrl)).toEqual('http://ho.co/hi');
    });
    it('does not build anything if the "url" is already given ', () => {
      action.url = `ftp://${generateString()}/${generateString()}`;
      expect(getUrl(action)).toEqual(action.url);
    });
  });

  describe('getResponseHandlersKeys', () => {
    let action;
    beforeEach(() => {
      action = {
        type: generateString(),
        '200': sinon.spy(),
        '404': sinon.spy(),
        '200|204|406': sinon.spy(),
        '301': sinon.spy()
      };
    });

    it('retreives function callback names from action that matches response status', () => {
      let responseCode = 200;
      let callbacksNames = getResponseHandlersKeys(action, responseCode);
      expect(callbacksNames).toInclude('200');
      expect(callbacksNames).toInclude('200|204|406');
      expect(callbacksNames).toInclude('200|204|406');
      responseCode = 301;
      callbacksNames = getResponseHandlersKeys(action, responseCode);
      expect(callbacksNames).toInclude('301');
    });

    it('ignore non-functions even if the callback name matches the response code', () => {
      action['200'] = 'I am not a function, i am string';
      let responseCode = 200;
      let callbacksNames = getResponseHandlersKeys(action, responseCode);
      expect(callbacksNames).toNotInclude('200');
    });
  });

  describe('getAggregatedAction', () => {
    let action, response, responseCode;
    const action200 = { label_200: generateString() };
    const action404 = { label_400: generateString() };
    const action301 = { label_301: generateString() };
    const action301_or_500 = { label_301_or_500: generateString() };
    beforeEach(() => {
      responseCode = 200;
      response = {};
      action = {
        type: generateString(),
        '200': sinon.stub().returns(action200),
        '404': sinon.stub().returns(action200),
        '301': sinon.stub().returns(action301),
        '301|500': sinon.stub().returns(action301_or_500)
      };
    });

    it('calls handler that its key matches the response code', () => {
      responseCode = 200;
      getAggregatedAction(action, response, responseCode);
      expect(action['200'].callCount).toEqual(1);
      responseCode = 301;
      getAggregatedAction(action, response, responseCode);
      expect(action['301'].callCount).toEqual(1);
      expect(action['301|500'].callCount).toEqual(1);
    });

    it('returns a literal object', () => {
      expect(
        isLiteralObject(getAggregatedAction(action, response, responseCode))
      ).toBeTruthy();
    });
    it('returns & combines all outputed actions from the matched handlers', () => {
      responseCode = 301;
      const aggregatedAction = getAggregatedAction(
        action,
        response,
        responseCode
      );
      expect(aggregatedAction).toEqual({ ...action301, ...action301_or_500 });
    });
  });

  describe('handleResponse', () => {
    let action,
      response,
      responseCode,
      hasError,
      settings,
      buildRequestPromise,
      onBeforeRequest,
      onReceiveResponse,
      onCompleteHandleResponse;
    beforeEach(() => {
      buildRequestPromise = sinon.spy();
      onBeforeRequest = sinon.spy();
      onReceiveResponse = sinon.spy();
      onCompleteHandleResponse = sinon.spy();
      action = { type: generateString(), uri: `/xa/${generateString()}` };
      response = { status: 200, body: { abd: 'abc' } };
      responseCode = response.status;
      hasError = responseCode >= 400;
      settings = {
        baseUrl: `https://${generateString()}`,
        buildRequestPromise,
        onBeforeRequest,
        onReceiveResponse,
        onCompleteHandleResponse
      };
    });

    it('is two-levels carried out function', () => {
      const returnLevel1 = handleResponse(
        action,
        response,
        responseCode,
        hasError
      );
      expect(returnLevel1).toBeA(Function);
      const returnLevel2 = returnLevel1(settings);
      expect(returnLevel2).toBeA(Function);
    });

    it('dispatches the aggregated/final action', () => {
      delete settings.onReceiveResponse; // to make sure that "dispatch" is called only for this case
      delete settings.onCompleteHandleResponse; // same as above
      handleResponse(action, response, responseCode, hasError)(settings)(
        dispatch
      );
      expect(dispatch.callCount).toEqual(1);
      const dispatchFirstArg = dispatch.getCall(0).args[0];
      expect(dispatchFirstArg).toBeAn(Object);
      expect(dispatchFirstArg.type).toEqual(action.type);
      expect(dispatchFirstArg.hasError).toEqual(hasError);
      expect(dispatchFirstArg.responseCode).toEqual(responseCode);
    });

    it('calls "onReceiveResponse" callback if it is given as middleware settings', () => {
      handleResponse(action, response, responseCode, hasError)(settings)(
        dispatch
      );
      expect(onReceiveResponse.callCount).toEqual(1);
    });

    it('calls "onCompleteHandleResponse" callback if it is given as middleware settings', () => {
      handleResponse(action, response, responseCode, hasError)(settings)(
        dispatch
      );
      expect(onCompleteHandleResponse.callCount).toEqual(1);
    });
  });
});
