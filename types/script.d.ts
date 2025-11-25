declare namespace google {
  namespace maps {
    function importLibrary(library: "places"): Promise<google.maps.places.PlacesLibrary>;
    function importLibrary(library: string): Promise<any>;
    
    namespace places {
      interface AutocompleteService {
        getPlacePredictions(request: any, callback: (predictions: any[], status: string) => void): void;
      }
      
      interface PlacesService {
        getDetails(request: any, callback: (place: any, status: string) => void): void;
      }
      
      interface PlacesServiceStatus {
        OK: string;
      }
      
      interface PlaceOptions {
        id: string;
      }
      
      interface SearchByTextRequest {
        textQuery: string;
        maxResultCount?: number;
        fields?: string[];
      }
      
      interface FetchFieldsRequest {
        fields: string[];
      }
      
      interface Place {
        id: string;
        displayName?: { text: string };
        formattedAddress?: string;
        addressComponents?: Array<{
          longName: string;
          shortName: string;
          types: string[];
        }>;
        searchByText(request: SearchByTextRequest): Promise<{ places: Place[] }>;
        fetchFields(request: FetchFieldsRequest): Promise<void>;
      }
      
      interface PlacesLibrary {
        Place: new (options: PlaceOptions) => Place;
      }
    }
  }
}

declare global {
  interface Window {
    google: {
      maps: typeof google.maps;
    };
  }

  var google: {
    maps: typeof google.maps;
  };
}

export {};

