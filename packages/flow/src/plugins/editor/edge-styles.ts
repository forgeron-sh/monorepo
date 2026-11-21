// The edge styles, editor halves: the path is the core half's, drawing it is the edge layer's, so
// a style needs nothing more than its core half in the list.

import { defineEditorPlugin } from "../../react/plugin";
import { bezier as bezierCore, orthogonal as orthogonalCore } from "../edges";

export const bezier = defineEditorPlugin({ core: bezierCore });
export const orthogonal = defineEditorPlugin({ core: orthogonalCore });
