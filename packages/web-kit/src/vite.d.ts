/** 在首次绘制前应用主题，仅供 Vite 配置使用；不引入 Vite 的全局类型。 */
export declare function themeBootstrapPlugin(): {
  name: string;
  transformIndexHtml: {
    order: 'pre';
    handler: () => {
      tag: 'script';
      children: string;
      injectTo: 'head-prepend';
    }[];
  };
};
