declare namespace google {
  namespace maps {
    interface LatLngBoundsLiteral {
      east: number;
      north: number;
      south: number;
      west: number;
    }

    class LatLngBounds {
      constructor(sw?: unknown, ne?: unknown);
    }

    interface PolylineOptions {
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
    }

    class Polyline {
      setOptions(options: PolylineOptions): void;
      setMap(map: unknown): void;
    }

    namespace places {
      class AutocompleteSessionToken {}

      interface AutocompleteRequest {
        input: string;
        includedRegionCodes?: string[];
        sessionToken?: AutocompleteSessionToken;
      }

      interface Place {
        formattedAddress?: string;
        displayName?: string;
        fetchFields(options: { fields: string[] }): Promise<void>;
      }

      interface PlacePrediction {
        text: { text: string };
        toPlace(): Place;
      }

      class AutocompleteSuggestion {
        placePrediction?: PlacePrediction;
        static fetchAutocompleteSuggestions(
          request: AutocompleteRequest
        ): Promise<{ suggestions: AutocompleteSuggestion[] }>;
      }
    }
  }
}
