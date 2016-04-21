declare module p5 {

    export interface instance {
        new (s: (context: context) => void);
        Vector : Vector;
        resizeCanvas(width: number, height: number);
        touchX: Vector;
        touchY: Vector;
    }

    export interface context {

        preload(): any;
        setup(): any;
        draw(): any;

        createCanvas(width: number, height: number): void;
        noCursor(): void;
        noStroke(): void;
        noFill(): void;

        loadImage(image: string): Image;
        createVector(x: number, y: number): Vector;

        random(min: number, max?: number): number;

        background(grayValue: number): void;
        background(color: string): void;
        background(red: number, green: number, blue: number, opacity?: number): void;
        background(hue: number, saturation: string[], brightness: string[], opacity: string[]): void;

        //Calculation
        floor(n: number): number;

        //Random
        random(min: number, max: number): number;

        //Shape
        //>2D Primitives
        ellipse(x: number, y: number, width: number, height: number): void;
        line(x1: number, y1: number, x2: number, y2: number);

        //Color
        red(obj: any): number;
        //>Setting
        fill(color: string[]);
        fill(red: number, green: number, blue: number, opacity?: number);
        fill(red: string[], green: string[], blue: string[], opacity?: number);
        stroke(color: string[]);
        stroke(red: number, green: number, blue: number, opacity?: number);
        stroke(red: string[], green: string[], blue: string[], opacity?: number);
        strokeWeight(weight: number);


        //Noise
        noise(x: number, y: number, z: number);

        //Time & Date
        millis(): number;

        //Text
        text(str: string, x: number, y: number, x2?: number, y2?: number);
        textFont(f: Object);
        textFont(f: string);
        textStyle(theStyle: number);
        textSize(size: number);
        loadFont(path: string, callback?: () => void);
    }

    export interface Image {
        width: number;
        height: number;
        pixels: number[];
        loadPixels(): number[];
        get(): any;
        get(x: number, y: number): any;
    }

    export interface Vector {
        x: number;
        y: number;
        z: number;
        new(x: number, y: number, z?: number);
        lerp(x: any, y?: any, z?: any, amt?: any): void;
        dist(v1: Vector, v2?: Vector): number;
        add(v1: Vector, v2?: Vector): Vector;
        sub(v1: Vector, v2: Vector): Vector;
        mult(v: Vector, n: number): Vector;
        mult(n: number);
    }

    export interface Font {
        font: any;
        textBounds(line: string, x: number, y: number, fontSize?: number, options?: Object);
    }
}

declare var p5: p5.instance;
