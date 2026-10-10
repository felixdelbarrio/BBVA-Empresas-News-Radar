function collectionRange_(mode,now){
  if(!['today','year'].includes(mode))throw Error('Selecciona Hoy o Último año.');
  const to=calendarDate_(now),from=new Date(to);if(mode==='year'){const month=from.getUTCMonth();from.setUTCFullYear(from.getUTCFullYear()-1);if(from.getUTCMonth()!==month)from.setUTCDate(0);}
  return {from:from.toISOString().slice(0,10),to:to.toISOString().slice(0,10)};
}
function collectionWindows_(range){
  const windows=[],cursor=new Date(range.from+'T00:00:00Z'),last=new Date(range.to+'T00:00:00Z');
  while(cursor<=last){const next=new Date(cursor);next.setUTCDate(1);next.setUTCMonth(next.getUTCMonth()+1);const end=new Date(Math.min(last.getTime(),next.getTime()-86400000));windows.push({from:cursor.toISOString().slice(0,10),to:end.toISOString().slice(0,10)});cursor.setTime(next.getTime());}
  return windows;
}
let collectionFeedMemory_;
function collectionFeeds_(range){
  if(!range)return feeds_();
  const config=configuration_(),key=JSON.stringify(range);if(collectionFeedMemory_?.config===config&&collectionFeedMemory_.key===key)return collectionFeedMemory_.feeds;
  const rss=feeds_().filter(feed=>feed.kind==='rss').map(feed=>({...feed,range}));
  const feeds=rss.concat(collectionWindows_(range).flatMap(window=>defaultFeeds_(window).filter(feed=>feed.enabled&&feed.kind==='profile').map(feed=>({...feed,range:window}))));
  collectionFeedMemory_={config,key,feeds};return feeds;
}
function collectionRangeFromStore_(){const value=properties_().getProperty('COLLECTION_RANGE');return value?JSON.parse(value):null;}
