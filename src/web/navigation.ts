const CANVAS_ID = "canvas";
const CANVAS_VIEWPORT_ID = "canvas-viewport";

const ZOOM_STEP = 1.2;

// =================================================================================================

/** Class for handling movement of the canvas. */
class Mover {

    /** The canvas object holding the map. */
    canvas: HTMLCanvasElement;

    /** Starting clientX coordinate of the mouse upon drag. */
    startX: number = 0;

    /** Starting clientY coordinate of the mouse upon drag. */
    startY: number = 0;

    /** Whether or not the user is dragging. */
    isDragging: boolean;

    // === CONSTRUCTOR ============================================================================

    constructor() {
        this.canvas = document.getElementById(CANVAS_ID) as HTMLCanvasElement;
        this.isDragging = false;
    }

    // === UTILITIES ==============================================================================

    /**
     * Get the current transform matrix of the canvas.
     * @returns The canvas's transform matrix.
     */
    getTransformMatrix(): DOMMatrix {
        return new DOMMatrix(window.getComputedStyle(this.canvas).transform);
    }

    /**
     * Apply a transform matrix to the canvas's actual transform
     * property.
     * @param matrix The transform matrix.
     */
    applyTransformMatrix(matrix: DOMMatrix) {
        this.canvas.style.transform = matrix.toString();
    }

    /**
     * Pan the canvas a certain number of pixels in
     * the x and y directions.
     * @param x Pixels in the x direction to pan.
     * @param y Pixels in the y direction to pan.
     */
    pan(x: number, y: number) {
        let matrix = this.getTransformMatrix();

        matrix.e += x;
        matrix.f += y;

        this.applyTransformMatrix(matrix);
    }

    /**
     * Zoom into the center of the canvas by the given factor.
     * @param factor The scale to multiply the current transform matrix by.
     */
    zoomBy(factor: number) {
        let matrix = this.getTransformMatrix();

        matrix = matrix.scale(factor, factor);

        this.applyTransformMatrix(matrix)
    }

    /**
     * Zoom into a point on the canvas by the given factor. Point given
     * in coordinates of the canvas viewport (i.e., the entire area on screen
     * where the canvas may be shown).
     * @param factor The scale to multiply the curarent transform martrix by.
     * @param viewportPoint The point to zoom into, in pixel coordinates of the canvas viewport. 
     *                      This point should not move on screen after the zoom.
     */
    zoomByToViewportPoint(factor: number, viewportPoint: { x: number, y: number }) {
        const canvasBounds = this.canvas.getBoundingClientRect();
        const canvasCenterX = (canvasBounds.left + canvasBounds.right) / 2;
        const canvasCenterY = (canvasBounds.top + canvasBounds.bottom) / 2;


        const canvasPoint = {
            x: viewportPoint.x - canvasCenterX,
            y: viewportPoint.y - canvasCenterY,
        }
        this.zoomByToCanvasPoint(factor, canvasPoint);
    }

    /**
     * Zoom into a point on the canvas by the given factor. Point given
     * relative to the center of the canvas.
     * @param factor The scale to multiply the curarent transform martrix by.
     * @param canvasPoint The point to zoom into, in pixel coordinates relative
     *                    to the center of the canvas.
     *                    This point should not move on screen after the zoom.
     */
    zoomByToCanvasPoint(factor: number, canvasPoint: { x: number, y: number }) {
        let matrix = this.getTransformMatrix();

        matrix = matrix.scale(factor, factor);

        // The key property of this function is that it *doesn't move
        // whatever pixel the mouse is on.*
        //
        // A generic scaling of the canvas moves all the pixels
        // of the canvas outwards from the transform origin.
        //
        // We can thus compute how far the pixel under the cursor moves
        // under scaling, and then apply the opposite translation 
        // to the whole canvas. This puts that pixel back under the
        // cursor where it started.

        const xAfterScaling = canvasPoint.x * factor;
        const yAfterScaling = canvasPoint.y * factor;

        const diffX = xAfterScaling - canvasPoint.x;
        const diffY = yAfterScaling - canvasPoint.y;

        matrix.e -= diffX;
        matrix.f -= diffY;

        this.applyTransformMatrix(matrix);
    }

    // === LISTENERS ==============================================================================

    pointerDownListener = (ev: PointerEvent) => {
        this.startX = ev.clientX;
        this.startY = ev.clientY;

        this.isDragging = true;
    }

    pointerMoveListener = (ev: PointerEvent) => {
        if (!this.isDragging) {
            return;
        }

        let diffX = ev.clientX - this.startX;
        let diffY = ev.clientY - this.startY;

        this.pan(diffX, diffY);

        this.startX = ev.clientX;
        this.startY = ev.clientY;
    }

    pointerDoneListener = (_: PointerEvent) => {
        this.isDragging = false;
    }

    wheelListener = (ev: WheelEvent) => {
        let delta = ev.deltaY;

        // On some systems, 'shift-scroll' may present
        // as deltaX.
        if (ev.deltaY === 0 && ev.deltaX != 0) {
            delta = ev.deltaX;
        }

        // const step = ZOOM_STEP * Math.exp(delta / 300);
        const step = Math.pow(ZOOM_STEP, -delta / 100);

        // this.zoomBy(step);
        this.zoomByToViewportPoint(step, { x: ev.clientX, y: ev.clientY })
    }
}

// =================================================================================================

export function attachCanvasListeners() {
    let canvasViewport = document.getElementById(CANVAS_VIEWPORT_ID) as HTMLCanvasElement;
    let mover = new Mover();

    canvasViewport.addEventListener("pointerdown", mover.pointerDownListener);
    canvasViewport.addEventListener("pointermove", mover.pointerMoveListener);

    canvasViewport.addEventListener("pointerup", mover.pointerDoneListener);
    canvasViewport.addEventListener("pointercancel", mover.pointerDoneListener);
    canvasViewport.addEventListener("pointerleave", mover.pointerDoneListener);

    canvasViewport.addEventListener("wheel", mover.wheelListener);
}