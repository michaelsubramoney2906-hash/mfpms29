/// <reference types="vite/client" />
declare module 'd3' {
  export function hierarchy<T = any>(data: T, children?: (d: T) => Iterable<T> | null | undefined): any;
  export function tree<T = any>(): any;
  const d3: Record<string, any>;
  export default d3;
}
declare module '*.css';
