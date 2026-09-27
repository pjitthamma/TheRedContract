declare module "virtual:site-assets" {
  const manifest: {
    assets: { url: string; bytes: number; hash: string }[];
    missing: string[];
  };
  export default manifest;
}
