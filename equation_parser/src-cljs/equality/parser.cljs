(ns equality.parser
  (:use [equality.printing :only [print-expr mathml tex expr-str]]
        [clojure.set :only [intersection union difference]])
  (:require [equality.geometry :as geom]
            [clojure.string]))

(set! cljs.core/*print-newline* false)

(set! cljs.core/*print-fn*
      (fn [& args]
        (.apply js/console.log js/console (into-array args))))

(derive :type/num :type/expr)
(derive :type/var :type/expr)
(derive :type/add :type/expr)
(derive :type/sub :type/expr)
(derive :type/mult :type/expr)
(derive :type/frac :type/expr)
(derive :type/pow :type/expr)
(derive :type/sqrt :type/expr)
(derive :type/bracket :type/expr)
(derive :type/subscript :type/expr)
;(derive :type/function-application :type/expr)
;; NOTE: :type/eq is not an expr!

(defn precedence [type]
  (case type
    :type/symbol 999
    :type/num 999
    :type/var 999
    :type/add 5
    :type/sub 5
    :type/pm 4
    :type/cross 8
    :type/mult 10
    :type/eq 1
    :type/frac 15
    :type/pow 20
    :type/subscript 50
    :type/sqrt 999
;    :type/func 8
;    :type/function-application 999
    :type/bracket 999))

(defmulti symbols :type)

(defmethod symbols nil [expr]
  [])

(defmethod symbols :type/symbol [expr]
  [expr])

(defmethod symbols :type/num [expr]
  (symbols (:src expr)))

(defmethod symbols :type/var [expr]
  (symbols (:src expr)))

;(defmethod symbols :type/func [expr]
;  (concat (:src expr)))

(defmethod symbols :type/add [expr]
  (concat (symbols (:src expr)) (symbols (:left-op expr)) (symbols (:right-op expr))))

(defmethod symbols :type/sub [expr]
  (concat (symbols (:src expr)) (symbols (:left-op expr)) (symbols (:right-op expr))))

(defmethod symbols :type/pm [expr]
  (concat (symbols (:src expr)) (symbols (:left-op expr)) (symbols (:right-op expr))))

(defmethod symbols :type/cross [expr]
  (concat (symbols (:src expr)) (symbols (:left-op expr)) (symbols (:right-op expr))))

(defmethod symbols :type/mult [expr]
  (concat (symbols (:left-op expr)) (symbols (:right-op expr)) (when (:id expr) (symbols (:src expr)))))

(defmethod symbols :type/eq [expr]
  (concat (symbols (:src expr)) (symbols (:left-op expr)) (symbols (:right-op expr))))

(defmethod symbols :type/frac [expr]
  (concat (symbols (:src expr)) (symbols (:numerator expr)) (symbols (:denominator expr))))

(defmethod symbols :type/pow [expr]
  (concat (symbols (:base expr)) (symbols (:exponent expr))))

(defmethod symbols :type/sqrt [expr]
  (concat (symbols (:src expr)) (symbols (:radicand expr))))

(defmethod symbols :type/bracket [expr]
  (concat (symbols (:src expr)) (symbols (:child expr))))

(defmethod symbols :type/abs [expr]
  (concat (symbols (:src expr)) (symbols (:child expr))))

(defmethod symbols :type/subscript [expr]
  (concat (symbols (:article expr)) (symbols (:subscript expr))))

;(defmethod symbols :type/function-application [expr]
;  (concat (symbols (:func expr)) (symbols (:arg expr))))

(defn numeric? [str]
  (not (js/isNaN (js/parseFloat str))))

(defn binary-op-rule [token type]
  (fn [input]

    ;; Matching operators are those of type :type/symbol whose token is correct.

    (let [ops (filter #(and (isa? (:type %) :type/symbol)
                               (= (:token %) token)) input)
          result-sets-list (for [t ops
                   :let [remaining-input (disj input t)

                         ;; Potential left operands are expressions to the left of the operator
                         ;; with precedence greater than that of this operator.

                         potential-left-ops (filter #(and (geom/boxes-intersect? (geom/left-box t (* 1.5 (:width t)) (* 0.3 (:height t))) %)
                                                          (< (geom/bbox-right %) (:x (geom/bbox-middle t)))
                                                          (< (geom/bbox-right %) (+ (:left t) (* 0.5 (:width %))))
                                                          (isa? (:type %) :type/expr)
                                                          (> (precedence (:type %)) (precedence type))) remaining-input)

                         ;; Potential right operands are expressions to the right of the operator
                         ;; with precedence greater than that of this operator.

                         potential-right-ops (filter #(and (geom/boxes-intersect? (geom/right-box t (* 1.5 (:width t)) (* 0.3 (:height t))) %)
                                                           (> (:left %) (:x (geom/bbox-middle t)))
                                                           (> (:left %) (- (geom/bbox-right t) (* 0.5 (:width %))))
                                                           (isa? (:type %) :type/expr)
                                                           (>= (precedence (:type %)) (precedence type))) remaining-input)

                         #_all-left-symbols #_(set (filter #(and (< (geom/bbox-right %) (:x (geom/bbox-middle t)))
                                                             (< (geom/bbox-right %) (+ (:left t) (* 0.5 (:width %)))))
                                                       (apply concat (map symbols remaining-input))))

                         #_all-right-symbols #_(set (filter #(and (> (:left %) (:x (geom/bbox-middle t)))
                                                              (> (:left %) (- (geom/bbox-right t) (* 0.5 (:width %)))))
                                                        (apply concat (map symbols remaining-input))))]
                   :when (and (not-empty potential-left-ops)
                              (not-empty potential-right-ops))]
               (for [left potential-left-ops
                     right potential-right-ops
                     :let [remaining-input (disj remaining-input left right)]]

                 ;; Now we have the left and right operands, create a new result set combining them with the appropriate operator.
                 (conj remaining-input (merge {:id (:id t)
                                               :type type
                                               :src t
                                               :left-op left
                                               :right-op right
                                               :symbol-count (+ 1
                                                                (:symbol-count left)
                                                                (:symbol-count right))}
                                              (geom/bbox-combine left right t)))))]

          ;; Concatenate all the result sets into a final list.
      (apply concat result-sets-list))))

(defn container-divide-fn [token]
  (fn [input]
    (let [containers (filter #(and (isa? (:type %) :type/symbol)
                                  (= (:token %) token)) input)]
      (map (fn [c]
             (let [remaining-input (disj input c)
                   contained-items (filter #(geom/box-mostly-contains-box c %) remaining-input)]
               (set contained-items))) containers))))

(def non-var-symbols #{"+" "-" "=" "\\pm" "\\wedge"})

;; Each rule has an :apply function, which takes a set of entities and returns a list of sets of entities, where
;; each element of the list is a transformation of the input set, hopefully with some entities combined into bigger ones.
(def rules
  {"num" {:apply (fn [input]
                   ;; This rule is unusual - it replaces all number symbols with :type/num expressions. No need to do one at a time.
                   (let [rtn (set (map (fn [potential-num]
                                         (if (and (isa? (:type potential-num) :type/symbol)
                                                  (numeric? (:token potential-num)))
                                           ;; Replace
                                           (merge potential-num {:type :type/num
                                                                 :src potential-num
                                                                 :symbol-count 1})
                                           ;; Do not replace
                                           potential-num)) input))]
                     (if (= rtn (set input))
                       []
                       [rtn])))
           :divide (fn [input] #{})}
   "var" {:apply (fn [input]
                   ;; This rule is unusual - it replaces all var symbols with :type/var expressions. No need to do one at a time.
                   (let [rtn (set (map (fn [potential-var]
                                         (if (and (isa? (:type potential-var) :type/symbol)
                                                  (not (numeric? (:token potential-var)))
                                                  (string? (:token potential-var))
                                                  (or (= (count (:token potential-var)) 1)
                                                      (= (first (:token potential-var)) "\\"))
                                                  (not (contains? non-var-symbols (:token potential-var))))
                                           ;; Replace
                                           (merge potential-var {:type :type/var
                                                                 :src potential-var
                                                                 :symbol-count 1})
                                           ;; Do not replace
                                           potential-var)) input))]
                     (if (= rtn (set input))
                       []
                       [rtn])))
           :divide (fn [input] #{})}
   ; "func" {:apply (fn [input]
   ;                 ;; This rule is unusual - it replaces all function symbols with :type/func expressions. No need to do one at a time.
   ;                 (let [rtn (set (map (fn [potential-func]
   ;                                       (if (and (isa? (:type potential-func) :type/symbol)
   ;                                                (not (numeric? (:token potential-func)))
   ;                                                (string? (:token potential-func))
   ;                                                (and (> (count (:token potential-func)) 1) ;; N.B. This means you can't write f(x)
   ;                                                     #_(not= (first (:token potential-func)) "\\"))
   ;                                                (not (contains? non-var-symbols (:token potential-func))))
   ;                                         ;; Replace
   ;                                         (merge potential-func {:type :type/func
   ;                                                               :src potential-func
   ;                                                               :symbol-count 1})
   ;                                         ;; Do not replace
   ;                                         potential-func)) input))]
   ;                   (if (= rtn (set input))
   ;                     []
   ;                     [rtn])))
   ;         :divide (fn [input] #{})}
   "horiz-line" {:apply (fn [input]
                          ;; Take a set of entities. Find the first :line and return a list of two sets of entities. One where the line has been replaced with subtract, one where it's been replaced with :frac
                          (let [line (first (filter #(and (isa? (:type %) :type/symbol)
                                                          (= (:token %) :line)) input))]
                            (if line
                              (let [remaining-input (disj input line)]
                                [(conj remaining-input (merge line {:token :frac
                                                                    :src line
                                                                    :symbol-count 1}))
                                 (conj remaining-input (merge line {:token "-"
                                                                    :src line
                                                                    :symbol-count 1}))])
                              [])))
           :divide (fn [input] #{})}

   "power" {:apply (fn [input]

                     ;; A potential base is any expression which has higher precedence than :type/pow

                     (let [potential-bases (filter #(and (isa? (:type %) :type/expr)
                                                         (> (precedence (:type %)) (precedence :type/pow))) input)]
                       (apply concat
                              (for [b potential-bases
                                    :let [remaining-input (disj input b)

                                          ;; A potential exponent is any expression
                                          ;; which is touched by a north-east line from the top-right corner of the base
                                          ;; and which does not extend below or left of the centre of the base

                                          potential-exponents (filter #(and (geom/line-intersects-box? {:x (geom/bbox-right b) :dx (:width b)
                                                                                                        :y (:top b) :dy (- (:width b))} %)
                                                                            (> (:left %) (+ (:left b) (* 0.5 (:width b))))
                                                                            (< (+ (:top %) (:height %)) (+ (:top b) (* 0.75 (:height b))))
                                                                            (isa? (:type %) :type/expr)) remaining-input)]
                                    :when (not-empty potential-exponents)]
                                (for [e potential-exponents
                                      :let [remaining-input (disj remaining-input e)]]

                                  ;; Now we have found b^e and removed b and e from our input.
                                  ;; Create a new :type/pow which refers to them, and add it to the set of results

                                  (conj remaining-input (merge {:type :type/pow
                                                                :base b
                                                                :exponent e
                                                                :symbol-count (+ (:symbol-count b)
                                                                                 (:symbol-count e))}
                                                               (geom/bbox-combine b e))))))))
           :divide (fn [input] #{})}

   "subscript" {:apply (fn [input]

                     ;; A potential article is any expression which has higher precedence than :type/subscript

                     (let [potential-articles (filter #(and (isa? (:type %) :type/var)
                                                         (> (precedence (:type %)) (precedence :type/subscript))) input)]
                       (apply concat
                              (for [b potential-articles
                                    :let [remaining-input (disj input b)

                                          ;; A potential exponent is any expression
                                          ;; which is touched by a north-east line from the top-right corner of the base
                                          ;; and which does not extend below or left of the centre of the base

                                          potential-subscripts (filter #(and (geom/line-intersects-box? {:x (geom/bbox-right b) :dx (:width b)
                                                                                                         :y (geom/bbox-bottom b) :dy (:width b)} %)
                                                                            (> (:left %) (+ (:left b) (* 0.5 (:width b))))
                                                                            (> (:top %) (+ (:top b) (* 0.25 (:height b))))
                                                                            (< (:fontSize %) (:fontSize b))
                                                                            (isa? (:type %) :type/expr)) remaining-input)]
                                    :when (not-empty potential-subscripts)]
                                (for [e potential-subscripts
                                      :let [remaining-input (disj remaining-input e)]]

                                  ;; Now we have found b^e and removed b and e from our input.
                                  ;; Create a new :type/pow which refers to them, and add it to the set of results

                                  (conj remaining-input (merge {:type :type/subscript
                                                                :article b
                                                                :subscript e
                                                                :symbol-count (+ (:symbol-count b)
                                                                                 (:symbol-count e))}
                                                               (geom/bbox-combine b e))))))))
           :divide (fn [input] #{})}

   "adjacent-mult" {:apply (fn [input]

                             ;; Potential coefficients are expressions that have higher precedence than :type/mult
                             ;; and are not factorials.

                             (let [potential-left-ops (filter #(and (isa? (:type %) :type/expr)
                                                                    (> (precedence (:type %)) (precedence :type/mult))
                                                                    (not= (:token %)  "!")) input)
                                   result-sets-list (for [left potential-left-ops
                                                          :let [remaining-input (disj input left)

                                                                ;; Potential multiplicands are expressions to the right of "left"
                                                                ;; which have precedence >= :type/mult, which are not numbers.
                                                                ;; If they are of type :type/pow, the base must not be a number.
                                                                ;; If they are of type :type/mult, the left operand must not be a number.

                                                                potential-right-ops (filter #(and (geom/boxes-intersect? (geom/right-box left (* 1.5 (min (:width left) (:width %))) (* 0.3 (:height left))) %)
                                                                                                  (> (:left %) (- (geom/bbox-right left) (* 0.5 (:width %))))
                                                                                                  (> (:left %) (:x (geom/bbox-middle left)))
                                                                                                  (if (= (:type left) :type/pow)
                                                                                                      (> (geom/bbox-bottom %) (- (geom/bbox-bottom (:base left)) (* 0.1 (:height (:base left)))))
                                                                                                      true #_(> (geom/bbox-bottom %) (:y (geom/bbox-middle left))))
                                                                                                  (>= (precedence (:type %)) (precedence :type/mult))
                                                                                                  (not= (:type %) :type/num) ; Don't allow this. If the left op is a function, it must use brackets for args.
                                                                                                  (if (= (:type %) :type/pow)
                                                                                                    (not= (:type (:base %)) :type/num)
                                                                                                    true)
                                                                                                  (if (= (:type %) :type/mult)
                                                                                                    (not= (:type (:left-op %)) :type/num)
                                                                                                    true)
                                                                                                  (isa? (:type %) :type/expr)) remaining-input)]
                                                          :when (not-empty potential-right-ops)]
                                                      (for [right potential-right-ops
                                                            :let [remaining-input (disj remaining-input right)]]

                                                        ;; Now we have found coefficient and multiplicand and removed them from our input.
                                                        ;; Create a new :type/mult and add it to the set of results.

                                                        (conj remaining-input (merge {:type :type/mult
                                                                                      :left-op left
                                                                                      :right-op right
                                                                                      :symbol-count (+ (:symbol-count left)
                                                                                                       (:symbol-count right))}
                                                                                     (geom/bbox-combine left right)))))]

                               ;; result-sets-list contains a list with an element for every potential coefficient
                               ;; where each element is a list of new result sets, one for each potential multiplicand.
                               ;; Join these nested lists together into a final list of results.

                               (apply concat result-sets-list)))
           :divide (fn [input] #{})}

   ; "function-application" {:apply (fn [input]
   ;                                  (let [potential-fns (filter #(isa? (:type %) :type/func) input)
   ;                                        result-sets-list (for [left potential-fns
   ;                                                              :let [remaining-input (disj input left)

   ;                                                                    potential-args (filter #(and (geom/boxes-intersect? (geom/right-box left (* 1.5 (min (:width left) (:width %))) (* 0.3 (:height left))) %)
   ;                                                                                                 (> (:left %) (- (geom/bbox-right left) (* 0.5 (:width %))))
   ;                                                                                                 (> (:left %) (:x (geom/bbox-middle left)))
   ;                                                                                                 (>= (precedence (:type %)) (precedence :type/func))
   ;                                                                                                 (isa? (:type %) :type/expr)) remaining-input)]
   ;                                                              :when (not-empty potential-args)]
   ;                                                          (for [right potential-args
   ;                                                                :let [remaining-input (disj remaining-input right)]]
   ;                                                            (conj remaining-input (merge {:type :type/function-application
   ;                                                                                          :func left
   ;                                                                                          :arg right
   ;                                                                                          :symbol-count (+ (:symbol-count left)
   ;                                                                                                           (:symbol-count right))}
   ;                                                                                         (geom/bbox-combine left right)))))]
   ;                                    (apply concat result-sets-list)))

   ;                         :divide (fn [input] #{})}

   "addition" {:apply (binary-op-rule "+" :type/add)
               :divide (fn [input] #{})}
   "subtraction" {:apply (binary-op-rule "-" :type/sub)
                  :divide (fn [input] #{})}
   "plus-or-minus" {:apply (binary-op-rule "\\pm" :type/pm)
                    :divide (fn [input] #{})}
   "cross" {:apply (binary-op-rule "\\wedge" :type/cross)
                    :divide (fn [input] #{})}
   "equals" {:apply (binary-op-rule "=" :type/eq)
             :divide (fn [input]
                       (let [eqs (filter #(and (isa? (:type %) :type/symbol)
                                               (= (:token %) "=")) input)]
                         (apply concat (for [eq eqs
                                             :let [remaining-input (disj input eq)
                                                   left-children (filter #(< (geom/bbox-right %) (:x (geom/bbox-middle eq))) remaining-input)
                                                   right-children (filter #(> (:left %) (:x (geom/bbox-middle eq))) remaining-input)]]
                                         [(set left-children) (set right-children)]))))}
   "fraction" {:apply (fn [input]
                        (let [frac-lines (filter #(and (isa? (:type %) :type/symbol)
                                                       (= (:token %) :frac)) input)
                              result-sets-list (for [t frac-lines
                                                     :let [remaining-input (disj input t)
                                                           ;; Numerators/denominators must be expressions above/below the fraction line
                                                           ;; that do not overhang the ends of the line by more than 20% of their width.

                                                           potential-numerators (filter #(and (isa? (:type %) :type/expr)
                                                                                              (geom/line-intersects-box? {:x (:left t)
                                                                                                                          :dx (:width t)
                                                                                                                          :y (- (:top t) (* 0.7 (:height %)))
                                                                                                                          :dy 0} %)
                                                                                              (> (:left %) (- (:left t) (* 0.2 (:width %))))
                                                                                              (< (geom/bbox-right %) (+ (geom/bbox-right t) (* 0.2 (:width %))))) remaining-input)
                                                           potential-denominators (filter #(and (isa? (:type %) :type/expr)
                                                                                                (geom/line-intersects-box? {:x (:left t)
                                                                                                                            :dx (:width t)
                                                                                                                            :y (+ (geom/bbox-bottom t) (* 0.7 (:height %)))
                                                                                                                            :dy 0} %)
                                                                                                (> (:left %) (- (:left t) (* 0.2 (:width %))))
                                                                                                (< (geom/bbox-right %) (+ (geom/bbox-right t) (* 0.2 (:width %))))) remaining-input)]
                                                     :when (and (= 1 (count potential-numerators))
                                                                (= 1 (count potential-denominators)))]
                                                 (for [numerator potential-numerators
                                                       denominator potential-denominators
                                                       :let [remaining-input (disj remaining-input numerator denominator)]]
                                                   (conj remaining-input (merge {:id (:id t)
                                                                                 :type :type/frac
                                                                                 :src t
                                                                                 :numerator numerator
                                                                                 :denominator denominator
                                                                                 :symbol-count (+ 1
                                                                                                  (:symbol-count numerator)
                                                                                                  (:symbol-count denominator))}
                                                                                (geom/bbox-combine t numerator denominator)))))]
                          (apply concat result-sets-list)))
               :divide (fn [input] #{})}
   "sqrt" {:apply (fn [input]
                    (let [radicals (filter #(and (isa? (:type %) :type/symbol)
                                                 (= (:token %) :sqrt)) input)
                          result-sets-list (for [r radicals
                                                 :let [remaining-input (disj input r)
                                                       potential-radicands (filter #(and (isa? (:type %) :type/expr)
                                                                                         (geom/box-mostly-contains-box r %)) remaining-input)]
                                                 :when (= 1 (count potential-radicands))]
                                             (for [radicand potential-radicands
                                                   :let [remaining-input (disj remaining-input radicand)]]
                                               (conj remaining-input (merge {:id (:id r)
                                                                             :type :type/sqrt
                                                                             :src r
                                                                             :radicand radicand
                                                                             :symbol-count (+ 1 (:symbol-count radicand))}
                                                                            (geom/bbox-combine r radicand)))))]
                      (apply concat result-sets-list)))
           :divide (container-divide-fn :sqrt)}
   "abs" {:apply (fn [input]
                    (let [abs (filter #(and (isa? (:type %) :type/symbol)
                                                 (= (:token %) :abs)) input)
                          result-sets-list (for [a abs
                                                 :let [remaining-input (disj input a)
                                                       potential-children (filter #(and (isa? (:type %) :type/expr)
                                                                                         (geom/box-mostly-contains-box a %)) remaining-input)]
                                                 :when (= 1 (count potential-children))]
                                             (for [child potential-children
                                                   :let [remaining-input (disj remaining-input child)]]
                                               (conj remaining-input (merge {:id (:id a)
                                                                             :type :type/abs
                                                                             :src a
                                                                             :child child
                                                                             :symbol-count (+ 1 (:symbol-count child))}
                                                                            (geom/bbox-combine a child)))))]
                      (apply concat result-sets-list)))
           :divide (container-divide-fn :abs)}
   "brackets" {:apply (fn [input]
                        (let [brackets (filter #(and (isa? (:type %) :type/symbol)
                                                     (= (:token %) :brackets)) input)
                              result-sets-list (for [b brackets
                                                     :let [remaining-input (disj input b)

                                                           contained-symbols (set (filter #(geom/box-mostly-contains-box b %) (apply concat (map symbols remaining-input))))
                                                           potential-children (filter #(and (isa? (:type %) :type/expr)
                                                                                            (geom/box-mostly-contains-box b %)) remaining-input)]
                                                     :when (not-empty potential-children)]
                                                 (for [child potential-children
                                                       :let [remaining-input (disj remaining-input child)]]
                                                   (conj remaining-input (merge {:id (:id b)
                                                                                 :type :type/bracket
                                                                                 :src b
                                                                                 :child child
                                                                                 :symbol-count (+ 1 (:symbol-count child))}
                                                                                (geom/bbox-combine b child)))))]
                          (apply concat result-sets-list)))
               :divide (container-divide-fn :brackets)}})

(defn expr-set-str [set]
  (apply str (interpose " | " (map expr-str set))))

(def ^:dynamic log-indent 0)
(def ^:dynamic log (fn [& args] (apply print (apply str (repeat log-indent "    ")) (map #(clojure.string/replace (str %) "\n" (apply str "\n " (repeat log-indent "    "))) args))))

(declare parse)
(defn parse [input]
  (loop [i 0
         seen {}
         results #{}
         [head & queue :as full-input] [input]]

    ;; head contains the hypothesis we're working on now.

    (let [generation             (or (:generation (meta head)) 0)
          parent                 (or (:parent (meta head)) "INPUT")
          return-on-first-result true]

      (log "Hypothesis" i "(generation" (str generation ",") "parent" (str parent ")::") (expr-set-str head))

      ;; head should have either one or many elements.


      (if (and (= 1 (count head))
               (not= (:type (first head)) :type/symbol))
        ;; If it's one, we don't need to do anything, just add it to results and move on (or possibly short-circuit and return).
        (do
          (log "SINGLETON HEAD:" (expr-set-str head) "\n")
          (let [new-results (sort-by count (conj results head))]
            (if return-on-first-result
              new-results
              (if queue
                (recur (inc i)
                       (assoc seen head true)
                       new-results
                       queue)
                new-results))))

        ;; If it's many, do some parsing, possibly generate some new stuff for the queue, and move on.

        ;; Perform a recursive divide-and-conquer parse on any subtrees the rules give us.

        (let [subtrees          (reverse (sort-by count (filter #(> (count %) 1) (apply concat (for [[k r] rules] ((:divide r) head))))))

              ;; Gather together as many non-overlapping subtrees as possible

              disjoint-subtrees (reduce (fn [acc subtree]
                                          (let [acc-items (apply union acc)]
                                            (if (empty? (intersection subtree acc-items))
                                              (conj acc subtree)
                                              acc)))
                                        [(first subtrees)] (next subtrees))

              ;; Loop through disjoint subtrees, parsing them and replacing their symbols with their result.
              ;; If a subtree parse fails, then this hypothesis (set of symbols) is guaranteed to fail, so set head to nil

              head              (loop [i 0
                                       new-head head
                                       [st & sts] disjoint-subtrees]
                                  (if st
                                    (do
                                      (log ">>>>>>>>>>>>  Parsing subtree:" (expr-set-str st))
                                      (binding [log-indent (inc log-indent)]
                                        (let [result (first (parse st))]
                                          (log "<<<<<<<<<<<<<< Got subtree result:" (expr-set-str  result))
                                          (if (not= 1 (count result))
                                            nil ;; We failed. So return nil to prevent anything else from spawning on this part of the tree.
                                            (recur (inc i) (conj (difference new-head st) (first result)) sts)))))
                                    new-head))]

          ;; Now we've parsed and combined together at least some of the symbols in subtrees, we're hopefully left with a simpler head.
          ;; Note that head cannot have a single element, because we can't have a subtree that consumes all the symbols. If we did, we'd fall into an infinite loop above.

          (let [new-results (sort-by count (conj results head))]
            (cond

             ;; head could be nil,  which means a subtree failed to parse, so we should fail.
             (= nil head) (do
                            (log "SUBTREE PARSE FAILED\n")
                            new-results)

             ;; or head could have many elements, if we're just not done yet.

             :else (let [ ;; Apply the rules in the hope of combining more symbols.
                         head-results (apply concat (for [[k r] rules] (map #(with-meta % {:generation (+ 1 generation) :parent i :rule k}) ((:apply r) head))))

                         ;; Discard any results we've already seen.
                         head-results (filter (fn [result] (not (contains? seen result))) head-results)

                         new-queue (sort-by count (distinct (concat queue head-results)))]

                     (if (not-empty head-results)
                       (log "New hypotheses:\n " (apply str (interpose "\n  " (map (fn [r] (str (expr-set-str r) "\t\t(RULE: " (:rule (meta r)) ")")) head-results))))
                       (log "No further results. Discarding hypothesis."))

                     (if (not-empty new-queue)
                       (recur (inc i)
                              (assoc seen head true)
                              new-results
                              new-queue)
                       new-results)))))))))


(defn to-clj-input [input]
  (set (map (fn [m] (apply merge (cons {:symbol-count 1} (map (fn [[k v]]
                                                               (cond (= :type k) {k (keyword v)}
                                                                     (and (= :token k)
                                                                          (string? v)
                                                                          (= (nth v 0) ":")) {k (keyword (.replace v ":" ""))}
                                                                          :else {k v})) m)))) (js->clj input :keywordize-keys true))))



(defn without-overlap [s]
  (set (filter #(not (:overlap %)) s)))


(defn map-with-meta [f m]
  (with-meta (map f m) (meta m)))

(defn compare-raw-symbol-count [a b]
  (let [symbol-count-a (count (filter #(= (:type %) :type/symbol) (apply concat (map symbols a))))
        symbol-count-b (count (filter #(= (:type %) :type/symbol) (apply concat (map symbols b))))]
    (cond
     (> symbol-count-a symbol-count-b) 1
     (< symbol-count-a symbol-count-b) -1
     :else 0)))

(defn get-best-results [input]
  (let [input       (to-clj-input input)
        all-symbols (set (map :id (flatten (map symbols input))))

        result      (time (parse input))

       ;; _           (println "Result:" result)

        best-result (first result)

        ;; Within the best result, sort by number of symbols in combined items (more is better). Then sort by number of raw symbols (not turned into var or num). Fewer is better.

        formulae    (sort (fn [a b] (cond
                                    (> (:symbol-count a) (:symbol-count b)) -1
                                    (< (:symbol-count a) (:symbol-count b)) 1
                                    :else (let [symbol-count-a (count (filter #(= (:type %) :type/symbol) (symbols a)))
                                                symbol-count-b (count (filter #(= (:type %) :type/symbol) (symbols b)))]
                                            (cond
                                             (> symbol-count-a symbol-count-b) 1
                                             (< symbol-count-a symbol-count-b) -1
                                             :else 0)))) best-result)


        ;; The the formula with most symbols

        formula     (first formulae)


        unused-symbols (difference all-symbols (map :id (symbols formula)))]

    (println "RESULT:" (expr-str formula))

    (clj->js {:mathml  (mathml formula)
              :tex     (tex formula)
              :unusedSymbols unused-symbols})))

(set! (.-onmessage js/self) (fn [e]
                              (let [symbols (.-data.symbols e)
                                    results (get-best-results symbols)
                                    ;; results (binding [log (fn [&args] nil)] (get-best-results symbols))
                                    ]
                                (.postMessage js/self results))))
