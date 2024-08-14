import { StateNode, TLEventHandlers, TLTextShape } from "tldraw";

export class Pointing extends StateNode {
  static override id = "pointing";
  private shape: TLTextShape | null = null;

  override onEnter = (info: { shape: TLTextShape | null }) => {
    this.shape = info.shape;
  };
  override onPointerUp: TLEventHandlers["onPointerUp"] = () => {
    this.parent.transition("idle");
  };

  override onPointerMove: TLEventHandlers["onPointerMove"] = () => {
    if (this.editor.inputs.isDragging) {
      this.parent.transition("dragging", { shape: this.shape });
    }
  };
}
