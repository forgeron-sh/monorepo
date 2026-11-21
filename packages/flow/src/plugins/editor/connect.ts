// The connection rules, editor halves. A rule draws nothing: the editor asks the core half whether
// a wire may land (the preview wire goes grey where a rule refuses) and the reason is the core
// half's. These halves exist so that each rule is a plugin of two halves like every other.

import { defineEditorPlugin } from "../../react/plugin";
import {
  fanOut as fanOutCore,
  noCycles as noCyclesCore,
  noDuplicates as noDuplicatesCore,
  portTypes as portTypesCore,
  selfLoop as selfLoopCore,
  singleInput as singleInputCore,
} from "../connect";

export const selfLoop = defineEditorPlugin({ core: selfLoopCore });
export const portTypes = defineEditorPlugin({ core: portTypesCore });
export const noDuplicates = defineEditorPlugin({ core: noDuplicatesCore });
export const fanOut = defineEditorPlugin({ core: fanOutCore });
export const singleInput = defineEditorPlugin({ core: singleInputCore });
export const noCycles = defineEditorPlugin({ core: noCyclesCore });

/** All six, in the order the editor has always asked them. */
export const connectionPlugins = [
  selfLoop,
  portTypes,
  noDuplicates,
  fanOut,
  singleInput,
  noCycles,
] as const;
