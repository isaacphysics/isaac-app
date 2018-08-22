'use strict';

window.angular || require("angular")
require("angular-mocks")
module = window.module

describe('controllers', function(){
  beforeEach(module('isaac.controllers'));

  it('should...', function() {
    expect(1).toEqual(1);
  })
  // it('should ....', inject(function($controller) {
  //   //spec body
  //   var myCtrl1 = $controller('MyCtrl1', { $scope: {} });
  //   expect(myCtrl1).toBeDefined();
  // }));

  // it('should ....', inject(function($controller) {
  //   //spec body
  //   var myCtrl2 = $controller('MyCtrl2', { $scope: {} });
  //   expect(myCtrl2).toBeDefined();
  // }));
});
