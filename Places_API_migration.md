<br />

**European Economic Area (EEA) developers**If your billing address is in the European Economic Area, effective on 8 July 2025, the[Google Maps Platform EEA Terms of Service](https://cloud.google.com/terms/maps-platform/eea)will apply to your use of the Services. Functionality varies by region.[Learn more](https://developers.google.com/maps/comms/eea/faq).

This guide highlights key differences between the legacy Places Service and the new Place class. Upgrading to the Place class offers significant advantages, including improved performance and a new[pricing model](https://developers.google.com/maps/documentation/javascript/usage-and-billing#places-js-library). To get the most out of Places and ensure your apps are up-to-date, familiarize yourself with the changes detailed in this guide.

<br />

## Billing best practices for migration

warning_amber

This guidance applies if your API usage is high enough to move into second-tier pricing. When migrating to a newer version of an API, you're also being billed for a different SKU. To avoid increased costs during the month of your transition, we recommend switching to the new APIs in production as close to the beginning of the month as possible. This will ensure that you reach the most cost-effective monthly pricing tiers during the migration month. For information about pricing tiers, see the[pricing page](https://developers.google.com/maps/billing-and-pricing/pricing)and the[pricing FAQ](https://developers.google.com/maps/billing-and-pricing/faq).

<br />

## Enable Places API

The Place class relies on the Places API service. To use the features of the new Place class, you must first enable Places API (New) in your Google Cloud project. For more information, see[Get started](https://developers.google.com/maps/documentation/javascript/place-get-started).

## General changes

The following table lists some of the main differences between`PlacesService`and`Place`:

|                                                      [`PlacesService`](https://developers.google.com/maps/documentation/javascript/reference/places-service)(Legacy)                                                      |                                                                              [`Place`](https://developers.google.com/maps/documentation/javascript/reference/place)(New)                                                                              |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Methods require the use of a callback to handle the results object and`google.maps.places.PlacesServiceStatus`response.                                                                                                   | Uses Promises, and works asynchronously.                                                                                                                                                                                                              |
| Methods require a`PlacesServiceStatus`check.                                                                                                                                                                              | No required status check, can use standard error handling.                                                                                                                                                                                            |
| [Place data fields](https://developers.google.com/maps/documentation/javascript/place-data-fields)are formatted using snake case.                                                                                         | [Place data fields](https://developers.google.com/maps/documentation/javascript/place-class-data-fields)are formatted using camel case.                                                                                                               |
| Limited to a fixed set of[place types](https://developers.google.com/maps/documentation/javascript/supported_types)and[place data fields](https://developers.google.com/maps/documentation/javascript/place-data-fields). | Provides an expanded selection of regularly updated[place types](https://developers.google.com/maps/documentation/javascript/place-types)and[place data fields](https://developers.google.com/maps/documentation/javascript/place-class-data-fields). |

## API-specific changes

The Place class provides an API for using the Places library, and supports modern usage patterns such as Promises. The Place class exposes the same place data fields and place types as the legacy Places Service, and includes many new values for place data fields and place types.

This table shows how features of the Places Service map to those of the Place class:

|                                                                          Places Service (Legacy)                                                                          |                                                                Place Class (New)                                                                |
|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------|
| [Place Data Fields](https://developers.google.com/maps/documentation/javascript/place-data-fields)                                                                        | [Place Class Data Fields](https://developers.google.com/maps/documentation/javascript/place-class-data-fields)                                  |
| [Place Types](https://developers.google.com/maps/documentation/javascript/supported_types)                                                                                | [Place Types](https://developers.google.com/maps/documentation/javascript/place-types)                                                          |
| [`PlacesService.findPlaceFromQuery()`](https://developers.google.com/maps/documentation/javascript/reference/places-service#PlacesService.findPlaceFromQuery)             | [`Place.searchByText()`](https://developers.google.com/maps/documentation/javascript/reference/place#Place.searchByText)                        |
| [`PlacesService.findPlaceFromPhoneNumber()`](https://developers.google.com/maps/documentation/javascript/reference/places-service#PlacesService.findPlaceFromPhoneNumber) | [`Place.searchByText()`](https://developers.google.com/maps/documentation/javascript/reference/place#Place.searchByText)                        |
| [`PlacesService.textSearch()`](https://developers.google.com/maps/documentation/javascript/reference/places-service#PlacesService.textSearch)                             | [`Place.searchByText()`](https://developers.google.com/maps/documentation/javascript/reference/place#Place.searchByText)                        |
| [`PlacesService.nearbySearch()`](https://developers.google.com/maps/documentation/javascript/reference/places-service#PlacesService.nearbySearch)                         | [`Place.searchNearby()`](https://developers.google.com/maps/documentation/javascript/reference/place#Place.searchNearby)                        |
| [`PlacesService.getDetails()`](https://developers.google.com/maps/documentation/javascript/reference/places-service#PlacesService.getDetails)                             | [`Place.fetchFields()`](https://developers.google.com/maps/documentation/javascript/reference/place#Place.fetchFields)                          |
| [`Places.AutocompletionRequest`](https://developers.google.com/maps/documentation/javascript/reference/places-autocomplete-service?db=wfrench#AutocompletionRequest)      | [`Places.AutocompleteRequest`](https://developers.google.com/maps/documentation/javascript/reference/autocomplete-data#AutocompleteRequest)     |
| [`Places.AutocompletePrediction`](https://developers.google.com/maps/documentation/javascript/reference/places-autocomplete-service#AutocompletePrediction)               | [`Places.PlacePrediction`](https://developers.google.com/maps/documentation/javascript/reference/autocomplete-data#PlacePrediction)             |
| [`Autocomplete`](https://developers.google.com/maps/documentation/javascript/reference/places-widget#Autocomplete)class                                                   | [`PlaceAutocompleteElement`](https://developers.google.com/maps/documentation/javascript/reference/places-widget#PlaceAutocompleteElement)class |
| [`SearchBox`](https://developers.google.com/maps/documentation/javascript/reference/places-widget#SearchBox)class                                                         | ---                                                                                                                                             |

## Load the Places library

How your app loads the Places library depends on which bootstrap loader is in use. If your app uses[dynamic library import](https://developers.google.com/maps/documentation/javascript/load-maps-js-api#dynamic-library-import), you can load the needed libraries at runtime by using the`await`operator to call`importLibrary()`, as shown here:  

    const { Place } = await google.maps.importLibrary("places");

If your app uses the[direct script loading tag](https://developers.google.com/maps/documentation/javascript/load-maps-js-api#use-legacy-tag), request the`places`library in the loader script:

<br />

```html
<script async
    src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&loading=async&libraries=places&callback=initMap">
</script>
```

<br />

[Learn more about loading the Maps JavaScript API.](https://developers.google.com/maps/documentation/javascript/load-maps-js-api)

This section includes the following guides to help you migrate your apps to use the newest version of the Places API:

- [Migrate to Place Details](https://developers.google.com/maps/documentation/javascript/places-migration-details)
- [Migrate to Text Search (New)](https://developers.google.com/maps/documentation/javascript/places-migration-search)
- [Migrate to Nearby Search (New)](https://developers.google.com/maps/documentation/javascript/places-migration-nearby)
- [Migrate to Place Photos](https://developers.google.com/maps/documentation/javascript/places-migration-photos)
- [Migrate to Place Reviews](https://developers.google.com/maps/documentation/javascript/places-migration-reviews)
- [Migrate to Place Autocomplete](https://developers.google.com/maps/documentation/javascript/places-migration-autocomplete)