import { StateNode, TLShapeId, TLShape, createShapeId } from "@tldraw/editor";
import { IUnitOpShape } from "../unitOpShapeUtil";

//TODO:
// 1. Add snaps
// 2. Figure out layering
// 3. Don't allow shapes to overlap

export class Idle extends StateNode {
  static override id = "idle";
  private shapeId = "" as TLShapeId;
  shape = {} as IUnitOpShape;

  override onEnter = (info: { shapeId: TLShapeId }) => {
    this.shapeId = info.shapeId;
    this.editor.setCursor({ type: "cross", rotation: 0 });

    // Create a shape and give it a new id. Set the id to the shape.
    const shape = info.shapeId && this.editor.getShape<TLShape>(info.shapeId);
    console.log("Shape:", shape);
    const { currentPagePoint } = this.editor.inputs;
    if (!shape) {
      console.log("Creating shape");
      const id = createShapeId();
      this.editor.createShape({
        id: id,
        type: "unit-op",
        x: currentPagePoint.x,
        y: currentPagePoint.y,
      });
      this.editor.select(id);
      this.shape = this.editor.getShape(id)!;
    }
  };

  override onPointerMove = () => {
    if (!this.shape) return;

    //Move the center of the shape
    const { currentPagePoint } = this.editor.inputs;
    const center = getShapeCenter(this.shape);

    this.editor.updateShape({
      ...this.shape,
      x: currentPagePoint.x - center.dx,
      y: currentPagePoint.y - center.dy,
    });

    // this.parent.transition("select");

    //   override onPointerDown = () => {
    //     this.parent.transition("pointing", { shapeId: this.shapeId });
    //   };
  };

  override onPointerUp = () => {
    //Crate the shape
    const { currentPagePoint } = this.editor.inputs;
    const center = getShapeCenter(this.shape);
    this.editor.createShape({
      type: "unit-op",
      id: this.shapeId,
      x: currentPagePoint.x - center.dx,
      y: currentPagePoint.y - center.dy,
    });
  };

  override onCancel = () => {
    this.editor.deleteShape(this.shape);
    this.editor.setCurrentTool("select");
  };
}

const getShapeCenter = (shape: IUnitOpShape) => {
  return {
    dx: shape.props.w / 2,
    dy: shape.props.h / 2,
  };
};
