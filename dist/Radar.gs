function radarMetrics_(rows, query) {
  const entities=new Map(),geographies=new Map(),publishers=new Map(),dates=new Map();
  const knownCountries=new Set(configuration_().geographies.map(row=>row.name));
  let unlocated=0;
  for(const row of rows){
    const entity=entityKey_(row.entidad),country=row.pais;
    entities.set(entity,(entities.get(entity)||0)+1);
    publishers.set(row.medio,(publishers.get(row.medio)||0)+1);
    if(knownCountries.has(country)){
      const area=geographies.get(country)||new Map();area.set(entity,(area.get(entity)||0)+1);geographies.set(country,area);
    }else unlocated++;
    const day=dates.get(row.fecha)||new Map();day.set(entity,(day.get(entity)||0)+1);dates.set(row.fecha,day);
  }
  const ranking=[...entities].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'es')).map(([entity,total])=>({entity,total}));
  const days=[...dates.keys()].sort(),from=query.from||days[0],to=query.to||days.at(-1);
  const start=Date.parse(from),end=Date.parse(to),span=Number.isFinite(start)&&Number.isFinite(end)?Math.max(1,Math.floor((end-start)/86400000)+1):1,intervalDays=Math.max(1,Math.ceil(span/settings_().trendPoints));
  const buckets=days.length?Array.from({length:Math.ceil(span/intervalDays)},(_,i)=>new Date(start+i*intervalDays*86400000).toISOString().slice(0,10)):[];
  const groups=ranking.length>settings_().trendSeries?[...ranking.slice(0,settings_().trendSeries-1),{entity:'Otras entidades',total:ranking.slice(settings_().trendSeries-1).reduce((n,r)=>n+r.total,0)}]:ranking;
  const series=groups.map(({entity,total})=>({entity,total,values:Array(buckets.length).fill(0)})),index=new Map(series.map((row,i)=>[row.entity,i]));
  for(const [date,counts] of dates){
    const bucket=Math.floor((Date.parse(date)-start)/(intervalDays*86400000));
    for(const [entity,count] of counts){const group=index.get(entity)??series.length-1;if(bucket>=0&&bucket<buckets.length)series[group].values[bucket]+=count;}
  }
  return {summary:{news:rows.length,entities:entities.size,sources:publishers.size,countries:geographies.size},ranking,
    geographies:[...geographies].map(([country,counts])=>({country,total:[...counts.values()].reduce((a,b)=>a+b,0),entities:[...counts].map(([entity,count])=>({entity,count}))})).sort((a,b)=>b.total-a.total||a.country.localeCompare(b.country,'es')),
    trend:{from:from||'',to:to||'',intervalDays,buckets,series},unlocated,latest:days.at(-1)||'',
    topPublisher:[...publishers].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'es'))[0]?.[0]||''};
}
