(defproject equality "0.1.0-SNAPSHOT"
  :description "FIXME: write description"
  :url "http://example.com/FIXME"
  :dependencies [[org.clojure/clojure "1.5.1"]
				 [org.clojure/data.json "0.2.2"]
                 [org.clojure/clojurescript "0.0-2014"
                  :exclusions [org.apache.ant/ant]]]
  :plugins [[lein-cljsbuild "1.0.2"]]
  :cljsbuild {
    :builds [{:source-paths ["src-cljs"]
              :compiler {:output-to "../app/js/lib/equation_parser.js"
                         :optimizations :whitespace
                         :pretty-print true}}]})
