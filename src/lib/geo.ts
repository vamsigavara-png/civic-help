// Stubbed geocoding — wire to real reverse-geocoding before production
export async function reverseGeocode(lat: number, lng: number) {
  console.log(`[STUB] Reverse geocoding: ${lat}, ${lng}`);
  // TODO: wire to real reverse-geocoding provider (keep rounded to city/district)
  return {
    city: "City",
    district: "District",
  };
}
