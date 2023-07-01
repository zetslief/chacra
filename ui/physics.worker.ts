import { GameState, InputState } from './lib/types';
import { updatePhysics } from './lib/physics';

let input: InputState = new InputState();

onmessage = (event) => {
    if ("type" in event.data) {
        if (event.data.type == "InputState") {
            input = event.data;
        }
        else {
            loop(
                event.data as GameState,
                Date.now() - 1000,
                (1000 / 30) * 0.001
            );
        }
    }
};

function loop(game: GameState, previousFrame: number, dt: number) {
    const originalDt = dt; 
    const start = Date.now();
    dt = (start - previousFrame) / 1000;
    if (game.players.length > 1) {
        updatePhysics(game, input, dt);
    }
    postMessage(game);
    const stop = Date.now();
    const duration = (stop - start) / 1000;
    previousFrame = start;
    if (originalDt - duration < 0) {
        loop(game, previousFrame, originalDt);
    } else {
        setTimeout(() => loop(game, previousFrame, originalDt), (originalDt - duration) * 1000);
    }
}
