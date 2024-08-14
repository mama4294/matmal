import { TLUiAssetUrlOverrides, TLUiOverrides } from "tldraw";
import arrowIcon from "@/assets/arrow-icon.svg";
import cogIcon from "@/assets/cog-icon.svg";

export const uiOverrides: TLUiOverrides = {
  tools(editor, tools) {
    // Create a tool item in the ui's context.
    tools.unitop = {
      id: "unit-op",
      icon: "cog-icon",
      label: "Unit Op",
      kbd: "o",
      onSelect: () => {
        editor.setCurrentTool("unit-op");
      },
    };

    tools.stream = {
      id: "stream",
      icon: "arrow-icon",
      label: "Stream",
      kbd: "p",
      onSelect: () => {
        editor.setCurrentTool("stream");
      },
    };

    return tools;
  },
};

export const customAssetUrls: TLUiAssetUrlOverrides = {
  icons: {
    "arrow-icon": arrowIcon,
    "cog-icon": cogIcon,
  },
};
