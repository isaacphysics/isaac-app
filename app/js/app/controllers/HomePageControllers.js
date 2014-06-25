define([], function() {

	var hex_filter = 
	[
	  {title:"Maths", active:true, subject:'maths', percent:65, enabled:false, symbol:'maths',
	      children:
	      [
	        {title:"Geometry", active:true, subject:'maths', percent:35, enabled:false, symbol:'geometry',
	            children:
	            [
	                {title:"Vectors", active:true, subject:'maths', percent:0, enabled:false, symbol:'mechanics'},
	                {title:"Trigonometry", active:true, subject:'maths', percent:100, enabled:false, symbol:'mechanics'},
	                {title:"Greek", active:true, subject:'maths', percent:0, enabled:false, symbol:'mechanics'},
	                {title:"Symmetry", active:true, subject:'maths', percent:5, enabled:false, symbol:'mechanics'}
	            ]},
	        {title:"Calculus", active:true, subject:'maths', percent:10, enabled:false, symbol:'calculus',
	            children:
	            [
	                {title:"One",   active:true, subject:'maths', percent:0, enabled:false, symbol:'mechanics'},
	                {title:"Two",   active:true, subject:'maths', percent:10, enabled:false, symbol:'mechanics'},
	                {title:"Three", active:true, subject:'maths', percent:50, enabled:false, symbol:'mechanics'},
	                {title:"Four",  active:true, subject:'maths', percent:23, enabled:false, symbol:'mechanics'},
	                {title:"Five",  active:true, subject:'maths', percent:80, enabled:false, symbol:'mechanics'},
	                {title:"Six",   active:true, subject:'maths', percent:100, enabled:false, symbol:'mechanics'}
	           ]},
	       {title:"Algebra", active:true, subject:'maths', percent:0, enabled:false, symbol:'algebra',
	           children:
	           [
	                {title:"One",   active:true, subject:'maths', percent:0, enabled:false, symbol:'mechanics'},
	                {title:"Two",   active:true, subject:'maths', percent:10, enabled:false, symbol:'mechanics'},
	                {title:"Three", active:true, subject:'maths', percent:50, enabled:false, symbol:'mechanics'},
	                {title:"Four",  active:true, subject:'maths', percent:23, enabled:false, symbol:'mechanics'},
	                {title:"Five",  active:true, subject:'maths', percent:80, enabled:false, symbol:'mechanics'},
	                {title:"Six",   active:true, subject:'maths', percent:100, enabled:false, symbol:'mechanics'}
	           ]},
	       {title:"Functions", active:true, subject:'maths', percent:0, enabled:false, symbol:'functions',
	           children:
	           [
	                {title:"One",   active:true, subject:'maths', percent:0, enabled:false, symbol:'mechanics'},
	                {title:"Two",   active:true, subject:'maths', percent:10, enabled:false, symbol:'mechanics'},
	                {title:"Three", active:true, subject:'maths', percent:50, enabled:false, symbol:'mechanics'},
	                {title:"Four",  active:true, subject:'maths', percent:23, enabled:false, symbol:'mechanics'},
	                {title:"Five",  active:true, subject:'maths', percent:80, enabled:false, symbol:'mechanics'},
	                {title:"Six",   active:true, subject:'maths', percent:100, enabled:false, symbol:'mechanics'}
	           ]},
	       {title:"Probaility", active:true, subject:'maths', percent:0, enabled:false, symbol:'maths',
	           children:
	           [    
	                {title:"One",   active:true, subject:'maths', percent:0, enabled:false, symbol:'mechanics'},
	                {title:"Two",   active:true, subject:'maths', percent:10, enabled:false, symbol:'mechanics'},
	                {title:"Three", active:true, subject:'maths', percent:50, enabled:false, symbol:'mechanics'},
	                {title:"Four",  active:true, subject:'maths', percent:23, enabled:false, symbol:'mechanics'},
	                {title:"Five",  active:true, subject:'maths', percent:80, enabled:false, symbol:'mechanics'},
	                {title:"Six",   active:true, subject:'maths', percent:100, enabled:false, symbol:'mechanics'}
	           ]}
	      ]
	  },
	  {title:"Physics", active:true, subject:'physics', percent:25, enabled:true, symbol:'mechanics',
	      children:
	      [
	          {title:"Mechanic", active:true, subject:'physics', percent:35, enabled:true, symbol:'mechanics',
	            children:
	            [
	                {title:"Statics", active:true, subject:'physics', percent:0, enabled:false, symbol:'mechanics'},
	                {title:"Dynamics", active:true, subject:'physics', percent:100, enabled:true, symbol:'mechanics'},
	                {title:"SHM", active:true, subject:'physics', percent:0, enabled:false, symbol:'mechanics'},
	                {title:"Angular Motion", active:true, subject:'physics', percent:5, enabled:false, symbol:'mechanics'},
	                {title:"Circular Motion", active:true, subject:'physics', percent:0, enabled:true, symbol:'mechanics'},
	                {title:"Kinematics", active:true, subject:'physics', percent:0, enabled:false, symbol:'mechanics'}
	            ]},
	          {title:"Waves", active:false, subject:'physics', percent:0, enabled:false, symbol:'mechanics',
	            children:
	            [
	            ]},
	          {title:"Fields", active:false, subject:'physics', percent:0, enabled:false, symbol:'mechanics',
	            children:
	            [
	            ]},
	          {title:"Electric Circuits", active:false, subject:'physics', percent:0, enabled:false, symbol:'mechanics',
	            children:
	            [
	            ]},
	         {title:"Electric Circuits", active:false, subject:'physics', percent:0, enabled:false, symbol:'mechanics',
	            children:
	            [
	            ]}
	      ]
	  }
	];

    var difficulty = [
    	{ level:1, selected:true, enabled:true },
        { level:2, selected:false, enabled:true },
        { level:3, selected:true, enabled:true },
        { level:4, selected:false, enabled:true },
        { level:5, selected:false, enabled:true },
        { level:6, selected:false, enabled:false }
    ];

	var PageController = ['$scope', 'api', function($scope, api) {

		$scope.gameBoard = api.gameBoards.get();
		$scope.hexFilterConfig = hex_filter;
		$scope.difficultyFilterConfig = difficulty;
		$scope.filterConcepts = [];
	}]

	return {
		PageController: PageController,
	};
})