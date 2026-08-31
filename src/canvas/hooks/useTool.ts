import { useCallback, useState } from "react";
import type { ToolType } from "../types";

export function useTool(initial: ToolType = "select") {
  const [tool, setTool] = useState<ToolType>(initial);

  const selectTool = useCallback((next: ToolType) => {
    setTool(next);
  }, []);

  return { tool, selectTool };
}
