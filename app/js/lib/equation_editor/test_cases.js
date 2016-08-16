define(function(require) {
    return {
        testCases: {
            "1": [{
                "type": "Symbol",
                "position": {
                    "x": 670.29099,
                    "y": 202.04266199999998
                },
                "expression": {
                    "latex": "f^{g}h",
                    "python": "f**(g)*h"
                },
                "children": {
                    "right": {
                        "type": "Symbol",
                        "properties": {
                            "letter": "h"
                        }
                    },
                    "superscript": {
                        "type": "Symbol",
                        "properties": {
                            "letter": "g"
                        }
                    }
                },
                "properties": {
                    "letter": "f"
                }
            }],
            "2": [{
                "type": "Symbol",
                "position": {
                    "x": 453.425,
                    "y": 359
                },
                "expression": {
                    "latex": "F = ma",
                    "python": "F == m*a"
                },
                "children": {
                    "right": {
                        "type": "Relation",
                        "children": {
                            "right": {
                                "type": "Symbol",
                                "children": {
                                    "right": {
                                        "type": "Symbol",
                                        "properties": {
                                            "letter": "a"
                                        }
                                    }
                                },
                                "properties": {
                                    "letter": "m"
                                }
                            }
                        },
                        "properties": {
                            "relation": "="
                        }
                    }
                },
                "properties": {
                    "letter": "F"
                }
            }],
        }

    }
});
