declare module "@mapbox/mapbox-sdk" {
  const mbxClient: (options: { accessToken: string }) => any;
  export default mbxClient;
}

declare module "@mapbox/mapbox-sdk/services/geocoding" {
  const mbxGeocoding: (client: any) => any;
  export default mbxGeocoding;
}
