import mbxGeocoding from '@mapbox/mapbox-sdk/services/geocoding';

const geocodingClient = mbxGeocoding({ accessToken: process.env.MAPBOX_ACCESS_TOKEN! });

export async function getRegionFromCoords(lat: number, lng: number): Promise<string> {
  try {
    const response = await geocodingClient.reverseGeocode({
      query: [lng, lat], // Mapbox uses [lng, lat] order!
      types: ['region', 'place'], // 'region' usually returns the State
      limit: 1
    }).send();

    const feature = response.body.features[0];
    // This typically returns the State name (e.g., "Lagos", "Ogun")
    return feature?.text || "Unknown";
  } catch (error) {
    console.error("Geocoding failed:", error);
    return "Unknown";
  }
}
