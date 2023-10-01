import {Point, point, collideLL } from "../lib/math";

function lineDataset(): [string, Point, Point, Point, Point, boolean][] {
    // x1 y1 x2 y2
    // [line, line, collider]
    return [
        // horizontal
        ["v_same" , point(0, 0), point(0, 1), point(0, 0), point(0, 1)  , true ],
        ["v_right", point(0, 0), point(0, 1), point(1, 0), point(1, 1)  , false],
        ["v_left" , point(1, 0), point(1, 1), point(0, 0), point(0, 1)  , false],

        ["h_same", point(0, 0), point(1, 0), point(0, 0), point(1, 0)  , true],
        ["h_up"  , point(0, 0), point(1, 0), point(0, 1), point(1, 1)  , false],
        ["h_down", point(0, 1), point(1, 1), point(0, 0), point(1, 0)  , false],

        ["y_x_down", point(0, 0), point(3, 3), point(1, 0), point(1, 1)  , true],
        ["y_x_down", point(0, 0), point(3, 3), point(1, 0), point(1, 0.9), false], // expected to fail now

        ["y_x_up", point(0, 0), point(3, 3), point(1, 2), point(1, 1)  , true],
        ["y_x_up", point(0, 0), point(3, 3), point(1, 2), point(1, 1.1), false], // expected to fail now
    ]
}

let failed = 0;
let passed = 0;
for (const [name, A1, B1, A2, B2, collide] of lineDataset()) {
    const line1 = { a: A1, b: B1 };
    const line2 = { a: A2, b: B2 };
    if (collideLL(line1, line2) == collide) {
        passed += 1;
    } else {
        console.error("Incorrect collision", name, collide);
        console.error(line1);
        console.error(line2);
        failed += 1;
    }
}
if (failed != 0) {
    console.error("FAILED: ", failed, " PASSED: ", passed);
} else {
    console.log("FAILED: ", failed, " PASSED: ", passed);
}
