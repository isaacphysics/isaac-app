(ns equality.printing)

(defmulti expr-str :type)

(defmethod expr-str :default [expr]
  (str "_" (:token expr)))

(defmethod expr-str :type/num [expr]
  (str (if (:certain (meta expr)) "@" "") (:token expr)))

(defmethod expr-str :type/var [expr]
  (str (if (:certain (meta expr)) "@" "") (:token expr)))

;(defmethod expr-str :type/func [expr]
;  (str "#" (if (:certain (meta expr)) "@" "") (:token expr)))

(defmethod expr-str :type/pow [expr]
  (str (if (:certain (meta expr)) "@" "") (expr-str (:base expr)) "^[" (expr-str (:exponent expr)) "]"))

(defmethod expr-str :type/add [expr]
  (str (if (:certain (meta expr)) "@" "") (expr-str (:left-op expr)) " + " (expr-str (:right-op expr))))

(defmethod expr-str :type/sub [expr]
  (str (if (:certain (meta expr)) "@" "") (expr-str (:left-op expr)) " - " (expr-str (:right-op expr))))

(defmethod expr-str :type/pm [expr]
  (str (if (:certain (meta expr)) "@" "") (expr-str (:left-op expr)) " ± " (expr-str (:right-op expr))))

(defmethod expr-str :type/cross [expr]
  (str (if (:certain (meta expr)) "@" "") (expr-str (:left-op expr)) " × " (expr-str (:right-op expr))))

(defmethod expr-str :type/mult [expr]
  (str (if (:certain (meta expr)) "@" "") "[" (expr-str (:left-op expr)) " " (expr-str (:right-op expr)) "]"))

;(defmethod expr-str :type/function-application [expr]
;  (str (if (:certain (meta expr)) "@" "") (expr-str (:func expr)) "(" (expr-str (:arg expr)) ")"))

(defmethod expr-str :type/eq [expr]
  (str (if (:certain (meta expr)) "@" "") (expr-str (:left-op expr)) " = " (expr-str (:right-op expr))))

(defmethod expr-str :type/ineq [expr]
  (str (if (:certain (meta expr)) "@" "") (expr-str (:left-op expr)) " " (:token (:src expr)) " " (expr-str (:right-op expr))))

(defmethod expr-str :type/frac [expr]
  (str (if (:certain (meta expr)) "@" "")  "[" (expr-str (:numerator expr)) "] / [" (expr-str (:denominator expr)) "]"))

(defmethod expr-str :type/bracket [expr]
  (str (if (:certain (meta expr)) "@" "") "(" (expr-str (:child expr)) ")"))

(defmethod expr-str :type/abs [expr]
  (str (if (:certain (meta expr)) "@" "") "|" (expr-str (:child expr)) "|"))

(defmethod expr-str :type/subscript [expr]
  (str (if (:certain (meta expr)) "@" "") (expr-str (:article expr)) "_" (expr-str (:subscript expr))))

(defn print-expr [expr]
  (js/console.log (expr-str expr)))

(defmulti mathml-inner :type)

(defmethod mathml-inner nil [expr]
  "")

(defmethod mathml-inner :type/symbol [expr]
  (println "Should not have called mathml with expr of type symbol:" expr)
  "")

(defmethod mathml-inner :type/var [expr]
  (str "<mi id=\"" (:id expr) "\">" (:token expr) "</mi>"))

;(defmethod mathml-inner :type/func [expr]
;  (str "<mi id=\"" (:id expr) "\">" (:token expr) "</mi>"))

(defmethod mathml-inner :type/num [expr]
  (str "<mn id=\"" (:id expr) "\">" (:token expr) "</mn>"))

(defmethod mathml-inner :type/pow [expr]
  (str "<mrow><msup>" (mathml-inner (:base expr)) (mathml-inner (:exponent expr)) "</msup></mrow>"))

(defmethod mathml-inner :type/add [expr]
  (str "<mrow>" (mathml-inner (:left-op expr)) "<mo id=\"" (:id expr) "\">+</mo>" (mathml-inner (:right-op expr)) "</mrow>"))

(defmethod mathml-inner :type/sub [expr]
  (str "<mrow>" (mathml-inner (:left-op expr)) "<mo id=\"" (:id expr) "\">-</mo>" (mathml-inner (:right-op expr)) "</mrow>"))

(defmethod mathml-inner :type/pm [expr]
  (str "<mrow>" (mathml-inner (:left-op expr)) "<mo id=\"" (:id expr) "\">±</mo>" (mathml-inner (:right-op expr)) "</mrow>"))

(defmethod mathml-inner :type/cross [expr]
  (str "<mrow>" (mathml-inner (:left-op expr)) "<mo id=\"" (:id expr) "\">×</mo>" (mathml-inner (:right-op expr)) "</mrow>"))

(defmethod mathml-inner :type/mult [expr]
  (str "<mrow>" (mathml-inner (:left-op expr)) (mathml-inner (:right-op expr)) "</mrow>"))

;(defmethod mathml-inner :type/function-application [expr]
;  (str "<mrow>" (mathml-inner (:func expr)) (mathml-inner (:arg expr)) "</mrow>"))

(defmethod mathml-inner :type/eq [expr]
  (str "<mrow>" (mathml-inner (:left-op expr)) "<mo id=\"" (:id expr) "\">=</mo>" (mathml-inner (:right-op expr)) "</mrow>"))

(defmethod mathml-inner :type/ineq [expr]
  (str "<mrow>" (mathml-inner (:left-op expr)) "<mo id=\"" (:id expr) "\">" (:token (:src expr)) "</mo>" (mathml-inner (:right-op expr)) "</mrow>"))

(defmethod mathml-inner :type/frac [expr]
  (str "<mfrac id=\"" (:id expr) "\"><mrow>" (mathml-inner (:numerator expr)) "</mrow><mrow>" (mathml-inner (:denominator expr)) "</mrow></mfrac>"))

(defmethod mathml-inner :type/sqrt [expr]
  (str "<msqrt id=\"" (:id expr) "\">" (mathml-inner (:radicand expr)) "</msqrt>"))

(defmethod mathml-inner :type/bracket [expr]
  (str "<mfenced id=\"" (:id expr) "\"><mrow>" (mathml-inner (:child expr)) "</mrow></mfenced>"))

(defmethod mathml-inner :type/abs [expr]
  (str "<mrow id=\"" (:id expr) "\"><mo>|</mo>" (mathml-inner (:child expr)) "<mo>|</mo></mrow>"))

(defmethod mathml-inner :type/subscript [expr]
  (str "<mrow id=\"" (:id expr) "\">" (mathml-inner (:article expr)) "<mo>_</mo>" (mathml-inner (:subscript expr)) "</mrow>"))

(defn mathml [expr]
  (when expr
    (str "<math display=\"block\"><mrow>" (mathml-inner expr) "</mrow></math>")))
    

(defmulti tex-inner :type)

(defmethod tex-inner nil [expr]
  "")

(defmethod tex-inner :type/symbol [expr]
  (println "Should not have called tex with expr of type symbol:" expr)
  "")

(defmethod tex-inner :type/var [expr]
  (str (:token expr)))

(defmethod tex-inner :type/num [expr]
  (str (:token expr)))

;(defmethod tex-inner :type/func [expr]
;  (str (:token expr)))

(defmethod tex-inner :type/pow [expr]
  (str "{{"(tex-inner (:base expr)) "}^{"(tex-inner (:exponent expr)) "}}"))

(defmethod tex-inner :type/add [expr]
  (str "{" (tex-inner (:left-op expr)) "}+{" (tex-inner (:right-op expr)) "}"))

(defmethod tex-inner :type/sub [expr]
  (str "{" (tex-inner (:left-op expr)) "}-{" (tex-inner (:right-op expr)) "}"))

(defmethod tex-inner :type/pm [expr]
  (str "{" (tex-inner (:left-op expr)) "}\\pm{" (tex-inner (:right-op expr)) "}"))

(defmethod tex-inner :type/cross [expr]
  (str "{" (tex-inner (:left-op expr)) "}\\wedge{" (tex-inner (:right-op expr)) "}"))

(defmethod tex-inner :type/mult [expr]
  (str (tex-inner (:left-op expr)) " " (tex-inner (:right-op expr))))

;(defmethod tex-inner :type/function-application [expr]
;  (str "{" (tex-inner (:func expr)) "}\\,{" (tex-inner (:arg expr)) "}"))

(defmethod tex-inner :type/eq [expr]
  (str "{" (tex-inner (:left-op expr)) "}={" (tex-inner (:right-op expr)) "}"))

(defmethod tex-inner :type/ineq [expr]
  (str "{" (tex-inner (:left-op expr)) "}" (:token (:src expr)) "{" (tex-inner (:right-op expr)) "}"))

(defmethod tex-inner :type/frac [expr]
  (str "\\frac{" (tex-inner (:numerator expr)) "}{" (tex-inner (:denominator expr)) "}"))

(defmethod tex-inner :type/sqrt [expr]
  (str "\\sqrt{" (tex-inner (:radicand expr)) "}"))

(defmethod tex-inner :type/bracket [expr]
  (str "(" (tex-inner (:child expr)) ")"))

(defmethod tex-inner :type/abs [expr]
  (str "|" (tex-inner (:child expr)) "|"))

(defmethod tex-inner :type/subscript [expr]
  (str "{" (tex-inner (:article expr)) "}_{" (tex-inner (:subscript expr)) "}"))

(defn tex [expr]
  (when expr
    (str (tex-inner expr))))

(defmulti py :type)

(defmethod py nil [expr] "")

(defmethod py :type/symbol [expr]
  (println "Should not have called py with expr of type symbol:" expr)
  "")

(defmethod py :type/var [expr]
  (str (:token expr)))

(defmethod py :type/num [expr]
  (str (:token expr)))

(defmethod py :type/pow [expr]
  (str "(" (py (:base expr)) ")**(" (py (:exponent expr)) ")"))

(defmethod py :type/add [expr]
  (str "(" (py (:left-op expr)) ")+(" (py (:right-op expr)) ")"))

(defmethod py :type/sub [expr]
  (str "(" (py (:left-op expr)) ")-(" (py (:right-op expr)) ")"))

(defmethod py :type/pm [expr]
  (str "(" (py (:left-op expr)) ")\\pm(" (py (:right-op expr)) ")"))

;; TODO: Add cross

(defmethod py :type/mult [expr]
  (str "(" (py (:left-op expr)) ")*(" (py (:right-op expr)) ")"))

(defmethod py :type/eq [expr]
  (str "(" (py (:left-op expr)) ")=(" (py (:right-op expr)) ")"))

;; TODO: Add ineq

(defmethod py :type/frac [expr]
  (str "(" (py (:numerator expr)) ")/(" (py (:denominator expr)) ")"))  

(defmethod py :type/sqrt [expr]
  (str "sqrt(" (py (:radicand expr)) ")"))

(defmethod py :type/bracket [expr]
  (str "(" (py (:child expr)) ")"))

(defmethod py :type/abs [expr]
  (str "abs(" (py :child expr) ")"))

(defmethod py :type/subscript [expr]
  (str "(" (py (:article expr)) "_" (py (:subscript expr)) ")"))

(defn py-expr [expr]
  (when expr
    (str (py expr))))