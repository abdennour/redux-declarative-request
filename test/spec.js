import 'jsdom-global/register';
import expect from 'expect';
import sinon from 'sinon';

import { isLiteralObject, isFunction } from '../src';

const fakedAgent = {
  get: (url, params) => Promise[Date.now() % 2 ? 'resolve' : 'reject']('hi')
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
});
