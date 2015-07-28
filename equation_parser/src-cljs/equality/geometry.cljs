(ns equality.geometry)

;; Lines are {:x :y :dx :dy}
;; Boxes are {:left :top :width :height}


(defn bbox-combine [& bboxes]
  (let [left (apply min (map :left bboxes))
        top (apply min (map :top bboxes))]
    {:left left
     :top top
     :width (- (apply max (map #(+ (:left %) (:width %)) bboxes)) left)
     :height (- (apply max (map #(+ (:top %) (:height %)) bboxes)) top)}))

(defn bbox-right [bbox]
  (+ (:left bbox) (:width bbox)))

(defn bbox-bottom [bbox]
  (+ (:top bbox) (:height bbox)))

(defn bbox-middle [bbox]
  {:x (+ (:left bbox) (* 0.5 (:width bbox)))
   :y (+ (:top bbox) (* 0.5 (:height bbox)))})

(defn left-box [target width height]
  {:left (:left target) :width (- width)
   :top (- (:y (bbox-middle target)) (* 0.5 height)) :height height})

(defn right-box [target width height]
  {:left (bbox-right target) :width width
   :top (- (:y (bbox-middle target)) (* 0.5 height)) :height height})

(defn cross [v w]
  (- (* (:dx v) (:dy w))
     (* (:dy v) (:dx w))))

(defn v- [a b]
  {:dx (- (:x a) (:x b))
   :dy (- (:y a) (:y b))})

(defn lines-intersect? [l1 l2]
  ;; From http://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect
  (let [p l1
        q l2
        r l1
        s l2
        cross-rs (cross r s)]
    (when (not= cross-rs 0.0)
      (let [t (/ (cross (v- q p) s) cross-rs)
            u (/ (cross (v- q p) r) cross-rs)]
        (and (>= t 0)
             (<= t 1)
             (>= u 0)
             (<= u 1))))))

(defn box-lines [box]
  [{:x (:left box) :dx 0
    :y (:top box) :dy (:height box)}
   {:x (+ (:left box) (:width box)) :dx 0
    :y (:top box) :dy (:height box)}
   {:x (:left box) :dx (:width box)
    :y (:top box) :dy 0}
   {:x (:left box) :dx (:width box)
    :y (+ (:top box) (:height box)) :dy 0}])

(defn line-intersects-box? [line box]
  ;; Either the line is completely contained within the box,
  ;; or it intersects with one of the sides of the box.
  ;; Actually, it's enough to test if one end is inside the box.
  (or (and (> (:x line) (:left box))
           (< (:x line) (+ (:left box) (:width box)))
           (> (:y line) (:top box))
           (< (:y line) (+ (:top box) (:height box))))
      (some #(lines-intersect? line %) (box-lines box))))

(defn boxes-intersect? [box1 box2]
  ;; Either box2 is completely inside box1,
  ;; or one of the lines of box1 intersects box2.
  ;; It's enough to check one point of box2 for being inside box1
  (or (and (> (:left box2) (:left box1))
           (> (:top box2) (:top box1))
           (< (:left box2) (+ (:left box1) (:width box1)))
           (< (:top box2) (+ (:top box1) (:height box1))))

      (some #(line-intersects-box? % box2) (box-lines box1))))

(defn box-contains-box [container contained]
  (and (> (:left contained) (:left container))
       (> (:top contained) (:top container))
       (< (bbox-right contained) (bbox-right container))
       (< (bbox-bottom contained) (bbox-bottom container))))

(defn all-pairs [coll]
  (distinct (for [a coll
                  b coll
                  :when (not= a b)]
              #{a b})))

(defn remove-overlapping [set]
  (let [to-remove (apply clojure.set/union
                         (map (fn [%] #{(first (sort-by :symbol-count %))})
                              (filter #(apply boxes-intersect? %)
                                      (all-pairs set))))]
    (with-meta (apply disj set to-remove) {:removed to-remove})))
