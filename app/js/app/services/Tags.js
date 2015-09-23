/**
 * Copyright 2014 Ian Davies
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at
 * 		http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
define([], function() {

	return function TagsConstructor() {
		this.tagArray = [

			// Subjects

			{
				id: "biology"
			}, 
			{
				id: "maths"
			}, 

			// Biology fields

			{
				id: "biodiversity",
				title: "Biodiversity",
				parent: "biology"
			}, 
			{
				id: "biophysics",
				title: "Biophysics",
				parent: "biology",
				enabled: true,
				comingSoon: false,
			},
			{
				id: "molbiol_biochem",
				title: "Molecular Biology &amp; Biochemistry",
				parent: "biology",
				enabled: true,
				comingSoon: false,
			},
			{
				id: "genetics",
				title: "Genetics",
				parent: "biology",
				enabled: true,
				comingSoon: false,
			},
			{
				id: "cell_microbiol",
				title: "Cell &amp; Microbiology",
				parent: "biology",
				enabled: true,
				comingSoon: false,
			},
			{
				id: "organisms",
				parent: "biology",
				enabled: true,
				comingSoon: false,
			},												

			// biodiversity topics
			{
				id: "ecology",
				parent: "biodiversity",
				enabled: true,
				comingSoon: false,
			},		
			{
				id: "conservation",
				parent: "biodiversity",
				enabled: true,
				comingSoon: false,
			},		
			{
				id: "taxonomy",
				parent: "biodiversity",
				enabled: true,
				comingSoon: false,
			},		
			{
				id: "evolution",
				parent: "biodiversity",
				enabled: true,
				comingSoon: false,
			},		

			// biophysics topics
			{
				id: "energy",
				parent: "biophysics",
				enabled: true,
				comingSoon: false,
			},		
			{
				id: "water",
				parent: "biophysics",
				enabled: true,
				comingSoon: false,
			},		
			{
				id: "gases",
				parent: "biophysics",
				enabled: true,
				comingSoon: false,
			},		
			{
				id: "molecular_biophys",
				title:"Molecular biophysics",
				parent: "biophysics",
				enabled: true,
				comingSoon: false,
			},	
			{
				id: "quantitative_biochem",
				title:"Quantitative biochemistry",
				parent: "biophysics",
				enabled: true,
				comingSoon: false,
			},	
			{
				id: "sepsci_massspec",
				title:"Separation science and mass spec",
				parent: "biophysics",
				enabled: true,
				comingSoon: false,
			},				

			// Molecular Biology and Biochemistry topics
			{
				id: "carbohydrates",
				parent: "molbiol_biochem",
				enabled: true,
				comingSoon: false,
			},		
			{
				id: "lipids",
				parent: "molbiol_biochem",
				enabled: true,
				comingSoon: false,
			},		
			{
				id: "proteins",
				parent: "molbiol_biochem",
				enabled: true,
				comingSoon: false,
			},		
			{
				id: "nucleic_acids",
				title:"Nucleic Acids",
				parent: "molbiol_biochem",
				enabled: true,
				comingSoon: false,
			},	
			{
				id: "monomers_polymers",
				title:"Monomers and polymers",
				parent: "molbiol_biochem",
				enabled: true,
				comingSoon: false,
			},	

			// Genetics topics
			{
				id: "heredity",
				parent: "genetics",
				enabled: true,
				comingSoon: false,
			},		
			{
				id: "molecular_gen",
				title:"Molecular genetics",				
				parent: "genetics",
				enabled: true,
				comingSoon: false,
			},		
			{
				id: "population_gen",
				title:"Population genetics",				
				parent: "genetics",
				enabled: true,
				comingSoon: false,
			},		
			{
				id: "developmental_gen",
				title:"Developmental genetics",
				parent: "genetics",
				enabled: true,
				comingSoon: false,
			},	

			// Cell and Microbiology topics
			{
				id: "cell_biol",
				title:"Cell Biology",				
				parent: "cell_microbiol",
				enabled: true,
				comingSoon: false,
			},		
			{
				id: "parasites",
				parent: "cell_microbiol",
				enabled: true,
				comingSoon: false,
			},		
			{
				id: "fungi",
				parent: "cell_microbiol",
				enabled: true,
				comingSoon: false,
			},		
			{
				id: "viruses",
				parent: "cell_microbiol",
				enabled: true,
				comingSoon: false,
			},	
			{
				id: "bacteria",
				parent: "cell_microbiol",
				enabled: true,
				comingSoon: false,
			},	

			// Organisms topics
			{
				id: "physiology",			
				parent: "organisms",
				enabled: true,
				comingSoon: false,
			},		
			{
				id: "immunology",
				parent: "organisms",
				enabled: true,
				comingSoon: false,
			},		
			{
				id: "behaviour",
				parent: "organisms",
				enabled: true,
				comingSoon: false,
			},		
			{
				id: "anatomy",
				parent: "organisms",
				enabled: true,
				comingSoon: false,
			},	
			{
				id: "pathophysiology",
				parent: "organisms",
				enabled: true,
				comingSoon: false,
			},

			// Maths fields

			{
				id: "geometry",
				parent: "maths"
			}, {
				id: "calculus",
				parent: "maths"
			}, {
				id: "algebra",
				parent: "maths"
			}, {
				id: "functions",
				parent: "maths",
			}, {
				id: "prob_stats",
				title:"Probability and statistics",
				parent: "maths",
			}, 

			// Geometry topics

			{
				id: "geom_vectors",
				title: "Vectors",
				parent: "geometry"
			}, {
				id: "trigonometry",
				parent: "geometry"
			}, {
				id: "shapes",
				parent: "geometry"
			}, {
				id: "symmetry",
				parent: "geometry",
				comingSoon: true,
			},
			
			// Calculus topics

			{
				id: "integration",
				parent: "calculus"
			}, {
				id: "differentiation",
				parent: "calculus"
			}, {
				id: "differential_eq",
				title: "Differential Equations",
				parent: "calculus"
			},

			// Algebra topics

			{
				id: "simultaneous",
				title: "Simultaneous Equations",
				parent: "algebra"
			}, {
				id: "quadratics",
				parent: "algebra"
			}, {
				id: "manipulation",
				parent: "algebra"
			}, {
				id: "series",
				parent: "algebra"
			},
			
			// Functions topics

			{
				id: "special",
				parent: "functions"
			}, {
				id: "trigonometric",
				parent: "functions"
			}, {
				id: "curve_sketching",
				parent: "functions"
			},

			// Probability topics

			{
				id: "distributions",
				parent: "prob_stats"
			}, 
			{
				id: "probability",
				title: "Functions",
				parent: "prob_stats"
			}, 
			{
				id: "parametric",
				title: "Parametric tests",				
				parent: "prob_stats"
			}, 
			{
				id: "nonparametric",
				title: "Non-parametric tests",				
				parent: "prob_stats"
			}, 
			{
				id: "corr_regress",
				title: "Correlation and regression",					
				parent: "prob_stats"
			}, 
			{
				id: "rep_data",
				title: "Representing data",					
				parent: "prob_stats"
			}

		];

		this.getById = function(id) {
			for (var i in this.tagArray) {
				if (this.tagArray[i].id === id) {
					return this.tagArray[i];
				}
			}
		};

		this.getSubjectTag = function(tagArray) {
			if (tagArray == null) return null;

			for (var i in tagArray) {
				var tag = this.getById(tagArray[i]);
				if (tag != null && tag.type === "subject") {
					return tag;
				}
			}
		};

		this.getDeepestTag = function(tagArray) {
			if (tagArray == null) return null;

			var deepestTag = null;
			for (var i in tagArray) {
				var tag = this.getById(tagArray[i]);
				if (tag != null && (deepestTag == null || tag.level > deepestTag.level)) {
					deepestTag = tag;
				}
			}
			return deepestTag;
		};

		var tagHeirarchy = ["subject", "field", "topic"];

		var generateTitle = function(tag) {
			if (tag.title)
				return tag.title;

			return tag.id.replace(/_/g, " ").replace(/\w*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
		};

		for (var i in this.tagArray) {
			this.tagArray[i].title = generateTitle(this.tagArray[i]);
			var j = 0;
			if (this.tagArray[i].parent) {
				var parent = this.getById(this.tagArray[i].parent);
				j++;
				while (parent.parent) {
					j++;
					parent = this.getById(parent.parent);
				}
			}
			this.tagArray[i].type = tagHeirarchy[j];
			this.tagArray[i].level = j;
		}
	};

});