import fs from 'node:fs';
import {createRequire} from 'node:module';
import {feature} from 'topojson-client';
import {geoEqualEarth,geoPath,geoGraticule10,geoCentroid} from 'd3-geo';
const require=createRequire(import.meta.url);
export function worldMap(){
  const topology=JSON.parse(fs.readFileSync(require.resolve('world-atlas/countries-110m.json'),'utf8'));
  const countries=feature(topology,topology.objects.countries),projection=geoEqualEarth().fitExtent([[12,12],[988,452]],{type:'Sphere'}),path=geoPath(projection).digits(1);
  const shapes=countries.features.filter(country=>country.id!=='010').map(country=>`<path d="${path(country)}" data-code="${country.id}" class="map-country" aria-hidden="true"/>`).join('');
  const markers=countries.features.filter(country=>country.id!=='010').map(country=>{
    const [x,y]=projection(geoCentroid(country));
    return `<g class="map-marker" data-code="${country.id}" hidden aria-hidden="true" transform="translate(${x.toFixed(1)},${y.toFixed(1)})"><circle r="11" class="map-ring"/><circle r="4"/><title></title></g>`;
  }).join('');
  return `<svg viewBox="0 0 1000 464" role="group" aria-label="Mapa mundial de publicaciones por ámbito" id="world-map"><path class="map-graticule" aria-hidden="true" d="${path(geoGraticule10())}"/><g class="map-land">${shapes}</g>${markers}</svg>`;
}
