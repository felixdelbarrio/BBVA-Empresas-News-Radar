function parseFeed_(xml) {
  const channel=XmlService.parse(xml).getRootElement().getChild('channel');
  if(!channel)throw Error('Se requiere RSS 2.0 con channel/item.');
  const items=channel.getChildren('item');
  if(items.length>RADAR.maxItems)throw Error('Feed demasiado grande (máximo '+RADAR.maxItems+' entradas).');
  return items.map(item=>({title:item.getChildText('title'),url:item.getChildText('link'),date:item.getChildText('pubDate'),excerpt:item.getChildText('description'),source:item.getChildText('source')}));
}
function newsRecord_(item,feed,now) {
  const record={id:Utilities.getUuid(),fecha:Utilities.formatDate(item.date,RADAR.timezone,'yyyy-MM-dd'),pais:feed.country,medio:item.publisher||feed.name,entidad:feed.entity,titular:item.title,extracto:item.excerpt,tema:item.topic,url:item.url,capturada:now.toISOString(),fuente:feed.name};
  return RADAR.sheets.Noticias.map(key=>record[key]);
}
function ingestFeed_(feed,known,cycle,now) {
  const response=UrlFetchApp.fetch(feed.url,{muteHttpExceptions:true,followRedirects:false,headers:{Accept:'application/rss+xml, application/xml'}});
  if(response.getResponseCode()!==200)throw Error('HTTP '+response.getResponseCode());
  const xml=response.getContentText();if(xml.length>RADAR.maxFeedBytes)throw Error('Feed excede el tamaño máximo permitido.');
  const items=parseFeed_(xml),news=[],audit=[],date=now.toISOString();
  for(const raw of items){
    const result=evaluate_(raw,feed,now),item=result.item;
    let state='Excluida',reason=result.reason;
    if(item){
      if(known.has(item.url)){state='Duplicada';reason='URL ya recopilada';}
      else{known.add(item.url);state='Incluida';reason=feed.kind==='profile'?'Noticia integrada desde RSS de Google News':'Noticia integrada desde RSS del editor';news.push(newsRecord_(item,feed,now));}
    }
    audit.push([cycle,date,feed.name,item?.url||String(raw.url||''),state,reason]);
  }
  audit.push([cycle,date,feed.name,feed.url,'Fuente consultada',items.length+' evaluadas; '+news.length+' nuevas']);
  return {news,audit,evaluated:items.length};
}
function knownUrls_() {
  const sheet=book_().getSheetByName('Noticias'),count=Math.min(sheet.getLastRow()-1,RADAR.newsReadLimit);
  return new Set(count>0?sheet.getRange(sheet.getLastRow()-count+1,9,count,1).getDisplayValues().flat():[]);
}
