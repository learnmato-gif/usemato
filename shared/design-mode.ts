export type ResolvedElement = {
  element: Element;
};

export type GetStyleInfo = (resolved: ResolvedElement) => {
  className: string;
  styles: Record<string, string> | null;
};

export function initDesignMode(_getStyleInfo: GetStyleInfo): () => void {
  return () => {};
}
