'use strict';

window.angular || require("angular")
require("angular-mocks")
module = window.module

/* jasmine specs for services go here */

describe('service', function() {
  beforeEach(module('isaac.services'));

  describe('version', function() {
    it('should return current version', inject(function(version) {
      expect(version).toEqual('0.1');
    }));
  });
});
