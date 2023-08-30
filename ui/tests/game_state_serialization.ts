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
        const value = 1 / 3.33;
        addAreaBooster(areaBoosters, value, value, value, value, "black");
    }
    return areaBoosters;
}

function testJson(sampleCount: number): number {
    const ab = setup(sampleCount);
    const result = JSON.stringify(ab);
    return result.length;
}

async function testArray(sampleCount: number): Promise<number> {
    const ab = setup(sampleCount);
    const x = new Float32Array(sampleCount);
    const y = new Float32Array(sampleCount);
    const radius = new Uint8Array(sampleCount);
    const duration = new Uint8Array(sampleCount);
    // TODO: use color as RGBA value in the code, not string.
    const color = new Uint8Array(sampleCount);

    const xx = new Uint8Array(x.buffer);
    const yy = new Uint8Array(y.buffer);
    const rradius = new Uint8Array(radius.buffer);
    const dduration = new Uint8Array(duration.buffer);
    const ccolor = new Uint8Array(color.buffer);

    var blob = new Blob([xx, yy, rradius, dduration, ccolor], {type: "octet/stream"});
    return (await blob.arrayBuffer()).byteLength;
}

async function runSerializationTests() {
    const sampleCount = 1000;
    const jsonResult = testJson(sampleCount);
    console.log("JSON: ", jsonResult);
    const arrayResult = await testArray(sampleCount);
    console.log("Typed Array + Blob: ", arrayResult);
}

async function main() {
    console.log("Serialization:");
    await runSerializationTests()
}

main();