import init, { start } from "../../pkg/terrain";
import { attachCanvasListeners } from "./navigation";

// -----------------------------------------------

await init();

// -----------------------------------------------

attachCanvasListeners();
start();