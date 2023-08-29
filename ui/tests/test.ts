import { runTest as runCollisionTest } from "./line_collision";
import { runSerializationTests } from "./game_state_serialization";

function main() {
    console.log("Collisions: ");
    if (!runCollisionTest()) {
        return;
    }

    console.log("\nSerialization: ");
    if (!runSerializationTests()) {
        return;
    }
}

main()