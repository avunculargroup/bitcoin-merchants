declare global {
  interface Window {
    google: {
      maps: {
        places: {
          AutocompleteService: new () => google.maps.places.AutocompleteService;
          PlacesService: new (div: HTMLDivElement) => google.maps.places.PlacesService;
          PlacesServiceStatus: {
            OK: string;
          };
        };
      };
    };
  }
}

export {};

