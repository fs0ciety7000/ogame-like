/* 5.16 : même jour de la semaine, même rang dans le mois, le mois suivant
   (« 2e samedi d'octobre » → « 2e samedi de novembre »), à la même heure
   locale. Un 5e jour qui n'existe pas le mois suivant devient le dernier. */
export function sameWeekdayNextMonth(ms: number): number {
  const d = new Date(ms);
  const nth = Math.ceil(d.getDate() / 7);
  const target = new Date(d.getFullYear(), d.getMonth() + 1, 1, d.getHours(), d.getMinutes(), 0, 0);
  const offset = (d.getDay() - target.getDay() + 7) % 7;
  const day = 1 + offset + (nth - 1) * 7;
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(day <= lastDay ? day : day - 7);
  return target.getTime();
}
