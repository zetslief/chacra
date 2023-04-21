import {Point, point, collideLL} from "./lib/math";

function lineDataset(): [[Point, Point], [Point, Point], boolean][] {
    // x1 y1 x2 y2
    // [line, line, collider]
    return [
        // horizontal
        [[point(0, 0), point(0, 1)], [point(0, 0), point(0, 1)  ], true],
        [[point(0, 0), point(0, 1)], [point(1, 0), point(1, 1)  ], false],
        [[point(1, 0), point(1, 1)], [point(0, 0), point(0, 1)  ], false],

        [[point(0, 0), point(1, 0)], [point(0, 0), point(1, 0)  ], true],
        [[point(0, 0), point(1, 0)], [point(0, 1), point(1, 1)  ], false],
        [[point(0, 1), point(1, 1)], [point(0, 0), point(1, 0)  ], false],

        [[point(0, 0), point(3, 3)], [point(1, 0), point(1, 1)  ], true],
        [[point(0, 0), point(3, 3)], [point(1, 0), point(1, 0.9)], false], // expected to fail now

        [[point(0, 0), point(3, 3)], [point(1, 2), point(1, 1)  ], true],
        [[point(0, 0), point(3, 3)], [point(1, 2), point(1, 1.1)], false], // expected to fail now
    ]
}

for (const [[A1, B1], [A2, B2], collide] of lineDataset()) {
    const line1 = { A: A1, B: B1 };
    const line2 = { A: A2, B: B2 };
    if (collideLL(line1, line2) != collide) {
        console.error("Incorrect collision", line1, line2);
    }
}
