// МикроТест Вижн – анимация логотипа (лягушонок) прямо в шапке по нажатию. Подключается последним.
// ----- Анимация иконки прямо в шапке (нажатие на логотип) -----
// Иконка в шапке – векторная, из отдельных групп (как «Новая иконка\MicroTest Vision – иконка.svg», id с приставкой ia-).
// По нажатию части оживают на месте, без окна: окружность чашки → зоны → диски → лягушка запрыгивает и машет лапками →
// угловые маркеры «находят» диск → линия «измеряет» зону. Повторное нажатие – начать заново
const brandLogo = document.querySelector("header .brand-logo");
function playIconAnim() {
  const q = s => brandLogo.querySelector(s), all = s => [...brandLogo.querySelectorAll(s)];
  brandLogo.getAnimations({ subtree: true }).forEach(a => a.cancel());
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const ease = "cubic-bezier(.2, .8, .2, 1)", back = "cubic-bezier(.34, 1.56, .64, 1)", hold = { fill: "backwards" };
  q("#ia-petri_outline circle").animate([{ strokeDasharray: "0 1" }, { strokeDasharray: "1 0" }], { duration: 900, easing: ease, ...hold });
  all("#ia-zones circle").forEach((c, i) => c.animate([{ transform: "scale(0)" }, { transform: "scale(1)" }], { duration: 520, delay: 450 + i * 120, easing: back, ...hold }));
  all("#ia-discs circle").forEach((c, i) => c.animate([{ transform: "scale(0)" }, { transform: "scale(1)" }], { duration: 380, delay: 800 + i * 120, easing: back, ...hold }));
  q("#ia-frog").animate([{ opacity: 0, transform: "translateY(90px) scale(.6)" }, { opacity: 1, transform: "translateY(-24px) scale(1.04)", offset: .65 }, { opacity: 1, transform: "none" }],
    { duration: 950, delay: 650, easing: ease, ...hold });
  [["#ia-frog_leg_front_left", -9], ["#ia-frog_leg_front_right", 9]].forEach(([s, a]) =>
    q(s).animate([{ transform: "rotate(0)" }, { transform: `rotate(${a}deg)` }, { transform: "rotate(0)" }], { duration: 420, delay: 1650, iterations: 2, easing: "ease-in-out" }));
  const dir = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  all("#ia-detection_markers path").forEach((p, i) => p.animate([{ opacity: 0, transform: `translate(${dir[i][0] * 40}px, ${dir[i][1] * 40}px)` }, { opacity: 1, transform: "none" }],
    { duration: 450, delay: 1900, easing: back, ...hold }));
  q("#ia-detection_markers").animate([{ opacity: 1 }, { opacity: .2 }, { opacity: 1 }, { opacity: .2 }, { opacity: 1 }], { duration: 700, delay: 2380 });
  const m = all("#ia-measurement path");
  m[0].animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: 520, delay: 2500, easing: ease, ...hold });
  m.slice(1).forEach(p => p.animate([{ opacity: 0, transform: "scaleY(0)" }, { opacity: 1, transform: "scaleY(1)" }], { duration: 260, delay: 2980, easing: back, ...hold }));
}
brandLogo.addEventListener("click", playIconAnim);
brandLogo.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); playIconAnim(); } });
