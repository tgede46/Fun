import { useCallback, useEffect, useRef, useState } from "react";
import type { FunObject, FunScene, EdgeObject } from "../types";

const INITIAL_SCENE: FunScene = {
  id: crypto.randomUUID(),
  objects: [],
  edges: [],
  camera: { x: 0, y: 0, zoom: 1 },
  grid: true,
  version: 1,
};

let nextZIndex = 1;

export function useScene(initial?: FunScene) {
  const [scene, setScene] = useState<FunScene>(initial ?? INITIAL_SCENE);
  const sceneRef = useRef(scene);
  useEffect(() => { sceneRef.current = scene; });

  const addObject = useCallback((obj: FunObject) => {
    const withZ = { ...obj, zIndex: nextZIndex++ };
    setScene((prev) => ({ ...prev, objects: [...prev.objects, withZ] }));
  }, []);

  const addEdge = useCallback((edge: EdgeObject) => {
    setScene((prev) => ({ ...prev, edges: [...(prev.edges ?? []), edge] }));
  }, []);

  const updateObject = useCallback((id: string, patch: Partial<FunObject>) => {
    setScene((prev) => ({
      ...prev,
      objects: prev.objects.map((o) => (o.id === id ? { ...o, ...patch } as FunObject : o)),
    }));
  }, []);

  const deleteObject = useCallback((id: string) => {
    setScene((prev) => ({
      ...prev,
      objects: prev.objects.filter((o) => o.id !== id),
      edges: prev.edges?.filter((e) => e.fromId !== id && e.toId !== id) ?? [],
    }));
  }, []);

  const deleteObjects = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setScene((prev) => ({
      ...prev,
      objects: prev.objects.filter((o) => !idSet.has(o.id)),
      edges: prev.edges?.filter((e) => !idSet.has(e.fromId) && !idSet.has(e.toId)) ?? [],
    }));
  }, []);

  const deleteEdge = useCallback((id: string) => {
    setScene((prev) => ({
      ...prev,
      edges: prev.edges?.filter((e) => e.id !== id) ?? [],
    }));
  }, []);

  const deleteEdges = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setScene((prev) => ({
      ...prev,
      edges: prev.edges?.filter((e) => !idSet.has(e.id)) ?? [],
    }));
  }, []);

  const replaceAllObjects = useCallback((objects: FunObject[], edges?: EdgeObject[]) => {
    setScene((prev) => ({ ...prev, objects, edges: edges ?? prev.edges }));
  }, []);

  const clearScene = useCallback(() => {
    setScene((prev) => ({ ...prev, objects: [], edges: [] }));
  }, []);

  const setSceneDirect = useCallback((newScene: FunScene) => {
    setScene(newScene);
  }, []);

  const getObject = useCallback((id: string): FunObject | undefined => {
    return sceneRef.current.objects.find((o) => o.id === id);
  }, []);

  const getEdge = useCallback((id: string): EdgeObject | undefined => {
    return sceneRef.current.edges?.find((e) => e.id === id);
  }, []);

  const getMaxZIndex = useCallback((): number => {
    let max = 0;
    for (const obj of sceneRef.current.objects) {
      if (obj.zIndex > max) max = obj.zIndex;
    }
    return max;
  }, []);

  const bringToFront = useCallback((id: string) => {
    const max = sceneRef.current.objects.reduce((m, o) => Math.max(m, o.zIndex), 0);
    setScene((prev) => ({
      ...prev,
      objects: prev.objects.map((o) =>
        o.id === id ? { ...o, zIndex: max + 1 } : o,
      ),
    }));
  }, []);

  const sendToBack = useCallback((id: string) => {
    const min = sceneRef.current.objects.reduce((m, o) => Math.min(m, o.zIndex), Infinity);
    setScene((prev) => ({
      ...prev,
      objects: prev.objects.map((o) =>
        o.id === id ? { ...o, zIndex: Math.max(0, min - 1) } : o,
      ),
    }));
  }, []);

  return {
    scene,
    objects: scene.objects,
    edges: scene.edges ?? [],
    addObject,
    addEdge,
    updateObject,
    deleteObject,
    deleteObjects,
    deleteEdge,
    deleteEdges,
    replaceAllObjects,
    clearScene,
    setSceneDirect,
    getObject,
    getEdge,
    getMaxZIndex,
    bringToFront,
    sendToBack,
  };
}
