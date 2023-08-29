import { AreaBoosters, Color } from "../lib/types";

function createAreaBoosters(): AreaBoosters {
    return { x: [], y: [], radius: [], duration: [], color: [] };
}

function addAreaBooster(
    areaBoosters: AreaBoosters,
    x: number,
    y: number,
    radius: number,
    duration: number,
    color: Color,
): void {
    areaBoosters.x.push(x);
    areaBoosters.y.push(y);
    areaBoosters.radius.push(radius);
    areaBoosters.color.push(color);
    areaBoosters.duration.push(duration);
}

function setup(sampleCount: number): AreaBoosters {
    const areaBoosters = createAreaBoosters();
    for (let index = 0; index < sampleCount; ++index) {
        addAreaBooster(areaBoosters, Math.random(), Math.random(), Math.random(), Math.random(), "black");
    }
    return areaBoosters;
}

function testJson(sampleCount: number): number {
    const ab = setup(sampleCount);
    const result = JSON.stringify(ab);
    return result.length;
}

function main() {
    const sampleCount = 1000;
    const jsonResult = testJson(sampleCount);
    console.log("JSON: ", jsonResult);
}

main()