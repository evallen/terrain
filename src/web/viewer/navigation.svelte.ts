const ZOOM_STEP = 1.2;

const ZOOM_MAX = 25;
const ZOOM_MIN = 0.1;

// =================================================================================================

export type Coordinate = {
    x: number,
    y: number
}

export type Transform = {
    scale: number,
    translate: Coordinate;
}

/** Class for handling movement of the canvas. */
export class Mover {

    /** The canvas object holding the map. */
    canvasGroup: HTMLDivElement;

    /** The object holding the canvas. */
    canvasViewport: HTMLElement;

    /** Transform of the canvas group. */
    canvasGroupTransform: Transform;

    /** Active pointers. */
    pointers: Map<number, Coordinate>;

    /** Midpoint of multiple pointers when there are 
     * multiple pointers down at a time.
     */
    pointerMidpoint: Coordinate = { x: 0, y: 0 };

    /** Distance between pointers when two pointers
     * are touching the screen.
     */
    pointerDistance: number = 0;

    // === CONSTRUCTOR ============================================================================

    constructor(canvasViewport: HTMLDivElement, canvasGroup: HTMLDivElement, canvasTransform: Transform) {
        this.canvasGroup = canvasGroup;
        this.canvasViewport = canvasViewport;
        this.canvasGroupTransform = canvasTransform;
        this.pointers = new Map();

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
     * Pan the canvas group a certain number of pixels in
     * the x and y directions.
     * @param x Pixels in the x direction to pan.
     * @param y Pixels in the y direction to pan.
     */
    pan(x: number, y: number) {
        let transform = this.canvasGroupTransform;

        transform.translate.x += x;
        transform.translate.y += y;

        this.canvasGroupTransform = transform;
    }

    /**
     * Zoom into the center of the canvas group by the given factor.
     * @param factor The scale to multiply the current transform matrix by.
     */
    zoomBy(factor: number) {
        this.canvasGroupTransform.scale *= factor;
    }

    /**
     * Zoom into a point on the canvas group by the given factor. Point given
     * in coordinates of the canvas viewport (i.e., the entire area on screen
     * where the canvas group may be shown).
     * @param factor The scale to multiply the current transform matrix by.
     * @param viewportPoint The point to zoom into, in pixel coordinates of the canvas viewport. 
     *                      This point should not move on screen after the zoom.
     */
    zoomByToViewportPoint(factor: number, viewportPoint: Coordinate) {
        const canvasBounds = this.canvasGroup.getBoundingClientRect();
        const canvasCenterX = (canvasBounds.left + canvasBounds.right) / 2;
        const canvasCenterY = (canvasBounds.top + canvasBounds.bottom) / 2;


        const canvasPoint = {
            x: viewportPoint.x - canvasCenterX,
            y: viewportPoint.y - canvasCenterY,
        }
        this.zoomByToCanvasPoint(factor, canvasPoint);
    }

    /**
     * Zoom into a point on the canvas group by the given factor. Point given
     * relative to the center of the canvas group.
     * @param factor The scale to multiply the current transform matrix by.
     * @param canvasPoint The point to zoom into, in pixel coordinates relative
     *                    to the center of the canvas.
     *                    This point should not move on screen after the zoom.
     */
    zoomByToCanvasPoint(factor: number, canvasPoint: Coordinate) {
        let canvasTransform = this.canvasGroupTransform;

        canvasTransform.scale *= factor;

        // The key property of this function is that it *doesn't move
        // whatever pixel the mouse is on.*
        //
        // A generic scaling of the canvas group moves all the pixels
        // of the canvas group outwards from the transform origin.
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

        this.canvasGroupTransform = canvasTransform;
    }

    constrainZoomFactor(factor: number): number {
        const newScale = this.canvasGroupTransform.scale * factor;
        const correctedScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, newScale));
        return correctedScale / this.canvasGroupTransform.scale;
    }

    static computeMidpointDistance(c0: Coordinate, c1: Coordinate): { midpoint: Coordinate, distance: number } {
        return {
            midpoint: {
                x: (c0.x + c1.x) / 2,
                y: (c0.y + c1.y) / 2
            },
            distance: Math.sqrt((c1.x - c0.x) ** 2 + (c1.y - c0.y) ** 2)
        };
    }

    // === LISTENERS ==============================================================================

    pointerDownListener = (ev: PointerEvent) => {
        // Only support two simultaneous pointers for now.
        if (this.pointers.size === 2) {
            return;
        }

        this.pointers.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });

        // Multiple pointers: initialize midpoint, distance info
        if (this.pointers.size === 2) {
            const [c0, c1] = [...this.pointers.values()];
            const result = Mover.computeMidpointDistance(c0, c1);

            this.pointerDistance = result.distance;
            this.pointerMidpoint = result.midpoint;
        }
    }

    pointerMoveListener = (ev: PointerEvent) => {
        if (ev.buttons === 0) {
            return;
        }

        // Guard against phantom move event before
        // 'pointerdown' event.
        if (!this.pointers.has(ev.pointerId)) {
            return;
        }

        let currentPointerCoords = this.pointers.get(ev.pointerId)!;

        if (this.pointers.size === 1) {
            // One pointer

            let diffX = ev.clientX - currentPointerCoords.x;
            let diffY = ev.clientY - currentPointerCoords.y;

            this.pan(diffX, diffY);

        } else {
            // Multiple pointers

            const [c0, c1] = [...this.pointers.values()];
            const { midpoint: newMidpoint, distance: newDistance } = Mover.computeMidpointDistance(c0, c1);

            // Handle multi-finger drag
            let diffX = newMidpoint.x - this.pointerMidpoint.x;
            let diffY = newMidpoint.y - this.pointerMidpoint.y;

            this.pan(diffX, diffY);

            this.pointerMidpoint = newMidpoint;

            // Handle pinch-to-zoom
            if (this.pointerDistance !== 0) {
                let factor = newDistance / this.pointerDistance;
                const constrainedFactor = this.constrainZoomFactor(factor);
                this.zoomByToViewportPoint(constrainedFactor, this.pointerMidpoint);
            }
            this.pointerDistance = newDistance;
        }

        // Changes entry within the map for the current pointer
        // being moved.
        currentPointerCoords.x = ev.clientX;
        currentPointerCoords.y = ev.clientY;
    }

    pointerDoneListener = (ev: PointerEvent) => {
        this.pointers.delete(ev.pointerId);
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