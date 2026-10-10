import {escape} from '../core/dom.js';
export function activityChart(days){
  if(!days.length)return '<div class="note">No hay actividad diaria registrada en este período.</div>';
  const maximum=Math.max(1,...days.map(day=>day.users));
  return `<div class="activity-chart" role="img" aria-label="Usuarios activos por día">${days.map(day=>`<div class="activity-column" title="${escape(day.date)}: ${day.users} usuarios"><span>${day.users}</span><div class="activity-bar" style="--bar-height:calc(var(--activity-chart-height) * ${day.users/maximum})"></div><span>${escape(day.date.slice(5))}</span></div>`).join('')}</div>`;
}
