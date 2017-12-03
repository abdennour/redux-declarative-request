import expect from 'expect';
import sinon from 'sinon';
import { generate as generateString } from 'randomstring';
import {
  isLiteralObject,
  isFunction,
  isRequest,
  getUrl,
  getResponseHandlersKeys,
  requestCallback,
  request,
  declarativeRequest
} from '../src';

const fakedAgent = {
  get: (url, params) =>
    Promise[Date.now() % 2 ? 'resolve' : 'reject'](generateString())
};
describe(`redux-declarative-request`, () => {
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
        '200|204|406': sinon.spy()
      };
    });

    it('filters function callbacks from action that matches response status', () => {
     let responseCode = 200;
     const callbacks = getResponseHandlersKeys(action, 200);
     expect(callbacks).toInclude('200');
     expect(callbacks).toInclude('200|204|406');
     expect(callbacks).toInclude('200|204|406');

    });
  });
});
