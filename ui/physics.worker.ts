import { GameState, InputState } from './lib/types';
import { updatePhysics } from './lib/physics';

onmessage = (event) => {
    const game = event.data as GameState;
    if (game) {
        loop(game, Date.now() - 1000, (1000 / 60) * 0.001);
    }
};

const input: InputState = { click: null, dx: 0, dy: 0 };
function loop(game: GameState, previousFrame: number, dt: number) {
    const originalDt = dt; 
    const start = Date.now();
    dt = (start - previousFrame) / 1000;
    if (game.players.length > 1) {
        console.log("worker message");
        // updatePhysics(game, input, dt);
    }
    const stop = Date.now();
    const duration = (stop - start) / 1000;
    previousFrame = start;
    if (originalDt - duration < 0) {
        loop(game, previousFrame, originalDt);
    } else {
        setTimeout(() => loop(game, previousFrame, (originalDt - duration) * 1000));
    }
}
