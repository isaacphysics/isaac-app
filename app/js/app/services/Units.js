define([], function() {

	var UnitsFactory = ["api", function UnitsFactory(api) {

		var units = api.getUnits();

		return {
			getUnits: function() { return units; }
		};

	}];

	return UnitsFactory;
});