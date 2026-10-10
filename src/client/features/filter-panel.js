import {$} from '../core/dom.js';
export function createFilterPanel(){
  const dialog=$('filters-dialog'),filters=$('filters-section'),mobile=window.matchMedia('(max-width:767px)');
  function place(){if(dialog.open)dialog.close();$(mobile.matches?'mobile-filters':'desktop-filters').appendChild(filters);}
  $('open-filters').addEventListener('click',()=>dialog.showModal());
  for(const id of ['close-filters','apply-filters'])$(id).addEventListener('click',()=>dialog.close());
  mobile.addEventListener('change',place);place();
}
