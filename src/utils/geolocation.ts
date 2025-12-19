/**
 * Geolocation Utility for Chat Location Features
 * Handles browser geolocation API with comprehensive error handling
 */

export interface GeolocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface ReverseGeocodeResponse {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  countryName?: string;
  localityInfo?: {
    administrative?: Array<{
      order?: number;
      name?: string;
    }>;
  };
  continent?: string;
}

export interface GeolocationError {
  code:
    | "PERMISSION_DENIED"
    | "POSITION_UNAVAILABLE"
    | "TIMEOUT"
    | "NOT_SUPPORTED";
  message: string;
}

/**
 * Check if geolocation is supported by the browser
 */
export function isGeolocationSupported(): boolean {
  return (
    "geolocation" in navigator && "getCurrentPosition" in navigator.geolocation
  );
}

/**
 * Check current permission state (if supported)
 */
export async function checkLocationPermission(): Promise<
  "granted" | "denied" | "prompt" | "unsupported"
> {
  if (!isGeolocationSupported()) {
    return "unsupported";
  }

  // Check if Permissions API is available
  if (!("permissions" in navigator)) {
    return "prompt"; // Can't check, will prompt when requested
  }

  try {
    const result = await navigator.permissions.query({ name: "geolocation" });
    return result.state as "granted" | "denied" | "prompt";
  } catch (error) {
    console.warn("Could not check geolocation permission:", error);
    return "prompt";
  }
}

/**
 * Get user's current location with high accuracy
 * @param options - Geolocation options
 * @returns Promise with location coordinates
 */
export async function getUserLocation(options?: {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}): Promise<GeolocationResult> {
  return new Promise((resolve, reject) => {
    // Check if geolocation is available
    if (!isGeolocationSupported()) {
      reject({
        code: "NOT_SUPPORTED",
        message: "Geolocation is not supported by this browser",
      } as GeolocationError);
      return;
    }

    // Default options: high accuracy, 10s timeout, accept 5min cache
    const defaultOptions: PositionOptions = {
      enableHighAccuracy: options?.enableHighAccuracy ?? true,
      timeout: options?.timeout ?? 10000,
      maximumAge: options?.maximumAge ?? 300000,
    };

    // Get position
    navigator.geolocation.getCurrentPosition(
      // Success callback
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      // Error callback
      (error) => {
        let errorCode: GeolocationError["code"] = "POSITION_UNAVAILABLE";
        let errorMessage = "Unknown error occurred";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorCode = "PERMISSION_DENIED";
            errorMessage =
              "Location permission was denied. Enable location in your browser settings for better results.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorCode = "POSITION_UNAVAILABLE";
            errorMessage =
              "Your location is currently unavailable. Please check your device settings.";
            break;
          case error.TIMEOUT:
            errorCode = "TIMEOUT";
            errorMessage = "Location request timed out. Please try again.";
            break;
        }

        reject({
          code: errorCode,
          message: errorMessage,
        } as GeolocationError);
      },
      // Options
      defaultOptions
    );
  });
}

/**
 * Get user location with balanced performance (WiFi/cell, faster)
 */
export async function getUserLocationFast(): Promise<GeolocationResult> {
  return getUserLocation({
    enableHighAccuracy: false,
    timeout: 5000,
    maximumAge: 300000,
  });
}

/**
 * Interpret location accuracy for user display
 */
export function interpretAccuracy(accuracy: number): {
  quality: "excellent" | "good" | "fair" | "poor";
  label: string;
  icon: string;
} {
  if (accuracy <= 10) {
    return {
      quality: "excellent",
      label: "Excellent (GPS)",
      icon: "📍",
    };
  } else if (accuracy <= 50) {
    return {
      quality: "good",
      label: "Good (GPS)",
      icon: "📍",
    };
  } else if (accuracy <= 500) {
    return {
      quality: "fair",
      label: "Fair (WiFi/Cell)",
      icon: "📍",
    };
  } else {
    return {
      quality: "poor",
      label: "Poor - Consider manual input",
      icon: "⚠️",
    };
  }
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(
  latitude: number,
  longitude: number,
  decimals: number = 4
): string {
  return `${latitude.toFixed(decimals)}, ${longitude.toFixed(decimals)}`;
}

/**
 * Reverse geocode coordinates into a human-readable location string.
 * Uses BigDataCloud public API (no key required).
 */
export async function reverseGeocodeLocation(
  latitude: number,
  longitude: number
): Promise<string> {
  const url = new URL(
    "https://api.bigdatacloud.net/data/reverse-geocode-client"
  );
  url.searchParams.set("latitude", latitude.toString());
  url.searchParams.set("longitude", longitude.toString());
  url.searchParams.set("localityLanguage", "en");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to reverse geocode location");
  }

  const data = (await response.json()) as ReverseGeocodeResponse;

  const hierarchy: Array<string | undefined> = [
    data.city || data.locality,
    data.principalSubdivision,
    data.countryName,
  ];

  const filteredHierarchy = hierarchy.filter(
    (part, index) => part && (index === 0 || part !== hierarchy[index - 1]) // avoid duplicates
  ) as string[];

  if (filteredHierarchy.length > 0) {
    return filteredHierarchy.join(", ");
  }

  const administrativeFallback = data.localityInfo?.administrative
    ?.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((item) => item.name)
    .filter(Boolean);

  if (administrativeFallback && administrativeFallback.length > 0) {
    return administrativeFallback.slice(0, 3).join(", ");
  }

  if (data.countryName) {
    return data.countryName;
  }

  if (data.continent) {
    return data.continent;
  }

  return formatCoordinates(latitude, longitude);
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: GeolocationError): string {
  return error.message;
}

/**
 * Watch user location (for real-time tracking)
 * Returns a cleanup function to stop watching
 */
export function watchUserLocation(
  onSuccess: (location: GeolocationResult) => void,
  onError: (error: GeolocationError) => void,
  options?: {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
  }
): () => void {
  if (!isGeolocationSupported()) {
    onError({
      code: "NOT_SUPPORTED",
      message: "Geolocation is not supported by this browser",
    });
    return () => {};
  }

  const defaultOptions: PositionOptions = {
    enableHighAccuracy: options?.enableHighAccuracy ?? true,
    timeout: options?.timeout ?? 10000,
    maximumAge: options?.maximumAge ?? 5000,
  };

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      onSuccess({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      });
    },
    (error) => {
      let errorCode: GeolocationError["code"] = "POSITION_UNAVAILABLE";
      let errorMessage = "Unknown error occurred";

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorCode = "PERMISSION_DENIED";
          errorMessage = "Location permission was denied";
          break;
        case error.POSITION_UNAVAILABLE:
          errorCode = "POSITION_UNAVAILABLE";
          errorMessage = "Location is unavailable";
          break;
        case error.TIMEOUT:
          errorCode = "TIMEOUT";
          errorMessage = "Location request timed out";
          break;
      }

      onError({
        code: errorCode,
        message: errorMessage,
      });
    },
    defaultOptions
  );

  // Return cleanup function
  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
}
