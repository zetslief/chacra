import {LineCollider, Point, collideLL} from "./lib/math";


function lineDataset(): [number[], number[], boolean][] {
    // x1 y1 x2 y2
    // [line, line, collider]
    return [
        // horizontal
        [[0, 0, 0, 1], [0, 0, 0, 1], true],
        [[0, 0, 0, 1], [1, 0, 1, 1], false],
        [[1, 0, 1, 1], [0, 0, 0, 1], false],

        //vertical
        [[0, 0, 1, 0], [0, 0, 1, 0], true],
        [[0, 0, 1, 0], [0, 1, 1, 1], false],
        [[0, 1, 1, 1], [0, 0, 1, 0], false],

        [[0, 0, 3, 3], [1, 0, 1, 1], true],
        [[0, 0, 3, 3], [1, 0, 1, 0.9], false], // expected to fail now

        [[0, 0, 3, 3], [1, 2, 1, 1], true],
        [[0, 0, 3, 3], [1, 2, 1, 1.1], false], // expected to fail now
    ]
}

for (const [first, second, collide] of lineDataset()) {
    const line1 = { 
        A: { x: first[0], y: first[1] },
        B: { x: first[2], y: first[2] },
    };
    const line2 = { 
        A: { x: second[0], y: second[1] },
        B: { x: second[2], y: second[2] },
    };
    if (collideLL(line1, line2) != collide) {
        console.error("Incorrect collision", line1, line2);
    }
}
