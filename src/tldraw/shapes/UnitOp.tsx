import {
  BoundsSnapGeometry,
  Geometry2d,
  HTMLContainer,
  RecordProps,
  Rectangle2d,
  resizeBox,
  ShapeUtil,
  T,
  TLBaseShape,
  TLOnResizeHandler,
} from "tldraw";

type ICustomShape = TLBaseShape<
  "unit-op",
  {
    w: number;
    h: number;
    text: string;
  }
>;

import { BaseBoxShapeTool, TLClickEvent } from "tldraw";
export class UnitOpShapeTool extends BaseBoxShapeTool {
  static override id = "unit-op";
  static override initial = "idle";
  override shapeType = "unit-op";

  override onDoubleClick: TLClickEvent = (_info) => {
    // you can handle events in handlers like this one;
    // check the BaseBoxShapeTool source as an example
  };
}

export class UnitOpUtl extends ShapeUtil<ICustomShape> {
  // [a]
  static override type = "unit-op" as const;
  static override props: RecordProps<ICustomShape> = {
    w: T.number,
    h: T.number,
    text: T.string,
  };

  // [b]
  getDefaultProps(): ICustomShape["props"] {
    return {
      w: 200,
      h: 100,
      text: "Evaporator",
    };
  }

  // [c]
  override canEdit = () => false;
  override canResize = () => false;
  override isAspectRatioLocked = () => false;

  // [d]
  getGeometry(shape: ICustomShape): Geometry2d {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  override getBoundsSnapGeometry(shape: ICustomShape): BoundsSnapGeometry {
    return new Rectangle2d({
      width: shape.props.h,
      height: shape.props.h,
      isFilled: true,
    });
  }

  // [e]
  override onResize: TLOnResizeHandler<any> = (shape, info) => {
    return resizeBox(shape, info);
  };

  // [f]
  component(shape: ICustomShape) {
    return (
      <HTMLContainer
        style={{
          //   backgroundColor: "#efefef",
          backgroundColor: "rgba(239, 239, 239, 1)",
          display: "flex",
          boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.2)",
          justifyContent: "center",
          position: "relative",
          alignItems: "center",
          textAlign: "justify",
          border: "3px solid black",
          borderRadius: "5px",
          fontWeight: "bold",
          padding: 8,
        }}
      >
        {shape.props.text}
      </HTMLContainer>
    );
  }

  // [g]
  indicator(shape: ICustomShape) {
    //The indicator is the blue outline around a selected shape.
    return <rect width={shape.props.w} height={shape.props.h} />;
  }
}
