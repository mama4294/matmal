import {
  createShapeId,
  StateNode,
  TLShapeId,
  TLStateNodeConstructor,
} from "tldraw";
import { Pointing } from "../unitOp/toolStates/Pointing";
import { Idle } from "./toolStates/Idle";

export class UnitOpShapeTool extends StateNode {
  static override id = "unit-op";
  static override initial = "idle";

  static override children(): TLStateNodeConstructor[] {
    return [Idle, Pointing];
  }
}
