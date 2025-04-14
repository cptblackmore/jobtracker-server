const ApiError = require('../exceptions/api-error');
const placesService = require('../service/places-service');
const querystring = require('querystring');

module.exports = function (req, res, next) {
  const query = req.query;
  const source = req.headers['x-target-source'];
  const targetUrl = req.headers['x-target-url'];

  const hasPlaceInQuery = Object.values(query).some(value => {
    if (typeof value === 'string') return value.startsWith('place~');
    if (Array.isArray(value)) return value.some(v => typeof v === 'string' && v.startsWith('place~'));
    return false;
  });
  const hasPlaceInTargetUrl = typeof targetUrl === 'string' && targetUrl.includes('place~');
  if (!hasPlaceInQuery && !hasPlaceInTargetUrl) {
    return next();
  }

  const placeKeys = {};
  for (const [param, value] of Object.entries(query)) {
    if (typeof value === 'string' && value.startsWith('place~')) {
      placeKeys[param] = value;
    } else if (Array.isArray(value)) {
      const arr = value.filter(v => typeof v === 'string' && v.startsWith('place~'));
      if (arr.length > 0) {
        placeKeys[param] = arr;
      }
    }
  }

  const resolvePlaceValue = (value) => {
    if (typeof value !== 'string') return value;

    const parts = value.split('~');
    if (parts[0] !== 'place') return value;

    const [, nameOrId, cityOrRegion, placeValue] = parts;

    if (nameOrId === 'id') {
      const result = placesService.findPlaceSourceIdById(placeValue, source);
      if (result) return result;
    }

    if (nameOrId === 'name') {
      if (cityOrRegion === 'city') {
        const result = placesService.findCitySourceIdByName(placeValue, source);
        if (result) return result;
      } else if (cityOrRegion === 'region') {
        const result = placesService.findRegionSourceIdByName(placeValue, source);
        if (result) return result;
      } else {
        const result = placesService.findPlaceSourceIdByName(placeValue, source);
        if (result) return result;
      }
    }

    return undefined;
  };

  try {
    for (const [param, value] of Object.entries(query)) {
      if (typeof value === 'string') {
        if (value.startsWith('place~')) {
          req.query[param] = resolvePlaceValue(value);
        }
      } else if (Array.isArray(value)) {
        req.query[param] = value.map(v => {
          if (typeof v === 'string' && v.startsWith('place~')) {
            return resolvePlaceValue(v);
          }
          return v;
        });
      }
    }

    let targetPlaceResolvedAny = false;
    if (hasPlaceInTargetUrl) {
      const matches = targetUrl.match(/place~[^/?&#]+(?:~[^/?&#]*){0,2}/g);
      if (matches) {
        matches.forEach(match => {
          const resolved = resolvePlaceValue(decodeURIComponent(match));
          if (resolved) {
            targetPlaceResolvedAny = true;
          }
        });
      }
      req.headers['x-target-url'] = targetUrl.replace(/place~[^/?&#]+(?:~[^/?&#]*){0,2}/g, (match) => {
        return resolvePlaceValue(decodeURIComponent(match));
      });
    }

    const newQueryString = querystring.stringify(req.query);
    const [basePath] = req.url.split('?');
    req.url = `${basePath}?${newQueryString}`;

    let anyPlaceResolved = false;
    for (const [param, originalValue] of Object.entries(placeKeys)) {
      const resolvedValue = req.query[param];
      if (typeof originalValue === 'string') {
        if (resolvedValue) {
          anyPlaceResolved = true;
          break;
        }
      } else if (Array.isArray(originalValue)) {
        if (Array.isArray(resolvedValue) && resolvedValue.some(v => v)) {
          anyPlaceResolved = true;
          break;
        }
      }
    }
    if (targetPlaceResolvedAny) {
      anyPlaceResolved = true;
    }

    if (!anyPlaceResolved) {
      return next(ApiError.PlaceNotFoundError());
    }

    next();
  } catch (e) {
    next(e);
  }
};
