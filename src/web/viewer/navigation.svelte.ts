const ZOOM_STEP = 1.2;

const ZOOM_MAX = 25;
const ZOOM_MIN = 0.1;

// =================================================================================================

export type Transform = {
    scale: number,
    translate: {
        x: number,
        y: number
    };
}

/** Class for handling movement of the canvas. */
export class Mover {

    /** The canvas object holding the map. */
    canvas: HTMLCanvasElement;

    /** The object holding the canvas. */
    canvasViewport: HTMLElement;

    /** Starting clientX coordinate of the mouse upon drag. */
    startX: number = 0;

    /** Starting clientY coordinate of the mouse upon drag. */
    startY: number = 0;

    /** Whether or not the user is dragging. */
    isDragging: boolean;

    /** Transform of the canvas. */
    canvasTransform: Transform;

    // === CONSTRUCTOR ============================================================================

    constructor(canvasViewport: HTMLDivElement, canvas: HTMLCanvasElement, canvasTransform: Transform) {
        this.canvas = canvas;
        this.canvasViewport = canvasViewport;
        this.canvasTransform = canvasTransform;
        this.isDragging = false;

        this.attachCanvasListeners();
    }

    attachCanvasListeners() {
        this.canvasViewport.addEventListener("pointerdown", this.pointerDownListener);
        this.canvasViewport.addEventListener("pointermove", this.pointerMoveListener);

        this.canvasViewport.addEventListener("pointerup", this.pointerDoneListener);
        this.canvasViewport.addEventListener("pointercancel", this.pointerDoneListener);
        this.canvasViewport.addEventListener("pointerleave", this.pointerDoneListener);

        this.canvasViewport.addEventListener("wheel", this.wheelListener);
    }

    // === UTILITIES ==============================================================================

    /**
     * Pan the canvas a certain number of pixels in
     * the x and y directions.
     * @param x Pixels in the x direction to pan.
     * @param y Pixels in the y direction to pan.
     */
    pan(x: number, y: number) {
        let transform = this.canvasTransform;

        transform.translate.x += x;
        transform.translate.y += y;

        this.canvasTransform = transform;
    }

    /**
     * Zoom into the center of the canvas by the given factor.
     * @param factor The scale to multiply the current transform matrix by.
     */
    zoomBy(factor: number) {
        this.canvasTransform.scale *= factor;
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
        let canvasTransform = this.canvasTransform;

        canvasTransform.scale *= factor;

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

        canvasTransform.translate.x -= diffX;
        canvasTransform.translate.y -= diffY;

        this.canvasTransform = canvasTransform;
    }

    constrainZoomFactor(factor: number): number {
        const newScale = this.canvasTransform.scale * factor;
        const correctedScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, newScale));
        return correctedScale / this.canvasTransform.scale;
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

        const step = Math.pow(ZOOM_STEP, -delta / 100);

        const correctedStep = this.constrainZoomFactor(step);
        this.zoomByToViewportPoint(correctedStep, { x: ev.clientX, y: ev.clientY })
    }
}