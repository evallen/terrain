const CANVAS_ID = "canvas";
const CANVAS_CONTAINER_ID = "canvas-container";

class Mover {

    canvas: HTMLCanvasElement;

    /** Starting clientX coordinate of the mouse upon drag. */
    startX: number = 0;

    /** Starting clientY coordinate of the mouse upon drag. */
    startY: number = 0;

    /** Starting X transform of canvas upon drag. */
    initialTransformX: number = 0;

    /** Starting Y transform of canvas upon drag. */
    initialTransformY: number = 0;

    /** Whether or not the user is dragging. */
    isDragging: boolean;


    constructor() {
        this.canvas = document.getElementById(CANVAS_ID) as HTMLCanvasElement;
        this.isDragging = false;
    }

    getTransformMatrix(): DOMMatrix {
        return new DOMMatrix(window.getComputedStyle(this.canvas).transform);
    }

    pointerDownListener = (ev: PointerEvent) => {
        this.startX = ev.clientX;
        this.startY = ev.clientY;

        const matrix = this.getTransformMatrix();

        this.initialTransformX = matrix.e;
        this.initialTransformY = matrix.f;

        this.isDragging = true;
    }

    pointerMoveListener = (ev: PointerEvent) => {
        if (!this.isDragging) {
            return;
        }

        let diffX = ev.clientX - this.startX;
        let diffY = ev.clientY - this.startY;

        let matrix = this.getTransformMatrix(); 

        matrix.e += diffX;
        matrix.f += diffY;

        this.canvas.style.transform = matrix.toString();

        this.startX = ev.clientX;
        this.startY = ev.clientY;
    }

    pointerDoneListener = (_: PointerEvent) => {
        this.isDragging = false;
    }

}

export function attachCanvasListeners() {
    let canvasContainer = document.getElementById(CANVAS_CONTAINER_ID) as HTMLCanvasElement;
    let mover = new Mover();
    
    canvasContainer.addEventListener("pointerdown", mover.pointerDownListener);
    canvasContainer.addEventListener("pointermove", mover.pointerMoveListener);

    canvasContainer.addEventListener("pointerup", mover.pointerDoneListener);
    canvasContainer.addEventListener("pointercancel", mover.pointerDoneListener);
    canvasContainer.addEventListener("pointerleave", mover.pointerDoneListener);
}