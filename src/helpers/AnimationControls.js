import { AnimationMixer, LoopOnce } from 'three';

export function initializeMixer(scene) {
    const mixer = new AnimationMixer(scene);
    return mixer;
}

export function setupAnimations(mixer, animations) {
    const clipActions = [];
    const animationState = new Map();

    animations.forEach((animation) => {
        const clipAction = mixer.clipAction(animation);
        clipAction.setLoop(LoopOnce);
        clipAction.clampWhenFinished = true;
        clipAction.timeScale = 1;
        clipActions.push(clipAction);
        animationState.set(clipAction, {isFinished: false, cycle: 1});
    });

    mixer.addEventListener('finished', (e) => {
        let state = animationState.get(e.action);
        state.isFinished = true;
        if(state.isFinished && state.cycle === 1) {
            e.action.timeScale = -1;
            state.cycle = 2;
        } else {
            state.cycle = 1;
            e.action.timeScale = 1;
        }
        e.action.paused = false;
        e.action.setLoop(LoopOnce)
        // e.action.play();
    });

    return { clipActions, animationState };
}
