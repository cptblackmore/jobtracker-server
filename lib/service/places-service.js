const { readFileSync } = require('fs');
const path = require('path');
const rawPlacesData = readFileSync(path.join(__dirname, '../data/places.json'), 'utf-8');
const parsedPlaces = JSON.parse(rawPlacesData);
const Fuse = require('fuse.js');

class PlacesService {
  constructor() {
    const cities = parsedPlaces.regions.flatMap(region => 
      region.cities.map(city => ({
        id: city.id,
        name: city.name,
        type: 'city',
        original: city,
      }))
    );

    const regions = parsedPlaces.regions.map(region => ({
      id: region.id,
      name: region.name,
      type: 'region',
      original: region,
    }));

    const places = [...cities, ...regions];

    this.fusePlaces = new Fuse(places, {
      keys: ['name'],
      threshold: 0.3,
      ignoreLocation: true
    });

    this.fuseCities = new Fuse(cities, {
      keys: ['name'],
      threshold: 0.2,
      ignoreLocation: true
    });

    this.fuseRegions = new Fuse(regions, {
      keys: ['name'],
      threshold: 0.2,
      ignoreLocation: true
    });
  }

  getPlaces(searchQuery) {
    if (!searchQuery?.length) return [];

    const results = this.fusePlaces.search(searchQuery, { limit: 5 });
    return results.map(result => ({
      id: result.item.id,
      name: result.item.name,
      type: result.item.type,
    }));
  }

  findPlaceSourceIdById(placeId, source) {
    for (const region of parsedPlaces.regions) {
      if (region.id === placeId) return region[source];
      for (const city of region.cities) {
        if (city.id === placeId) return city[source];
      }
    }

    return null;
  }

  findPlaceSourceIdByName(name, source) {
    const match = this.fusePlaces.search(name, { limit: 1 })?.[0];
    return match?.item?.original?.[source] || null;
  }

  findCitySourceIdByName(name, source) {
    const match = this.fuseCities.search(name, { limit: 1 })?.[0];
    return match?.item?.original?.[source] || null;
  }

  findRegionSourceIdByName(name, source) {
    const match = this.fuseRegions.search(name, { limit: 1 })?.[0];
    return match?.item?.original?.[source] || null;
  }
}

module.exports = new PlacesService();
