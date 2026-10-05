// Données de départ de la démo Hélio : une équipe fictive de 12 personnes et ses plannings
// sur les 4 derniers mois et les 2 semaines à venir. Aucune donnée réelle.
const TEAM = [
  ['MARTIN', 'Léa', true], ['BERNARD', 'Hugo'], ['PETIT', 'Chloé'], ['ROBERT', 'Nathan'], ['RICHARD', 'Inès'], ['DURAND', 'Lucas'],
  ['MOREAU', 'Manon'], ['SIMON', 'Yanis'], ['LAURENT', 'Sarah'], ['LEFEBVRE', 'Tom'], ['MICHEL', 'Jade'], ['GARCIA', 'Adam'],
]
const SLOTS = 45 // 8h00 → 19h00 par pas de 15 min
// Familles d'horaires (codes d'activité d'Hélio) : [code, plages [début, fin[ en créneaux]
const SHIFTS = [
  ['0', [[0, 16], [20, 34]]],   // Matin
  ['1', [[2, 18], [22, 36]]],   // Midi
  ['15', [[4, 18], [22, 38]]],  // Aprem
  ['2', [[5, 21], [26, 40]]],   // Soir
]
const TLT = { '0': '20', '1': '21', '15': '22', '2': '23' } // même horaire en télétravail

const pad = n => String(n).padStart(2, '0')
const dayId = d => pad(d.getDate()) + pad(d.getMonth() + 1) + d.getFullYear()
const frDate = d => pad(d.getDate()) + ' ' + pad(d.getMonth() + 1) + ' ' + d.getFullYear()
// Pseudo-hasard déterministe : la démo est la même pour tout le monde.
let s = 20261005
const rnd = () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296 }

function dayFor(pi, d, dayIndex) {
  const a = Array(SLOTS).fill('')
  const r = rnd()
  if (r < 0.06) return a.fill('30')                       // congé posé
  if (r < 0.08) { a.fill('5', 4, 32); return a }          // formation
  const [code, ranges] = SHIFTS[(pi + Math.floor(dayIndex / 5)) % 4] // rotation hebdomadaire
  const c = (pi + d.getDay()) % 3 === 0 ? TLT[code] : code
  ranges.forEach(([x, y]) => a.fill(c, x, y))
  if ((dayIndex + pi) % 12 === 0) a.fill('24', ranges[0][0] + 4, ranges[0][0] + 12) // créneau pilote
  if ((dayIndex + pi) % 17 === 0) a.fill('26', ranges[1][0], ranges[1][0] + 8)      // back-office
  return a
}

function build() {
  const docs = {}
  TEAM.forEach(([nom, prenom, admin], i) => {
    const uid = i === 0 ? 'demo' : 'p' + i
    docs['personnes/' + uid] = {
      nom, prenom, email: prenom.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') + '.' + nom.toLowerCase() + '@exemple.fr',
      isAdmin: !!admin, arrivee: '01 09 2024', depart: '', role: i < 2 ? 'Référent' : 'Conseiller', niveau: i < 4 ? 'Confirmé' : 'Junior',
      peutBO: i % 3 === 0, peutTLT: true, onRun: true, forceTlt: false, id: uid,
    }
  })
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const start = new Date(today); start.setDate(start.getDate() - 120)
  const end = new Date(today); end.setDate(end.getDate() + 14)
  let dayIndex = 0
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0 || d.getDay() === 6) continue
    docs['plannings/' + dayId(d)] = {
      ressources: TEAM.map(([nom, prenom], pi) => ({ nom, prenom, idPersonne: pi === 0 ? 'demo' : 'p' + pi, activites: dayFor(pi, d, dayIndex) })),
    }
    dayIndex++
  }
  docs['personnes/demo/notifications/bienvenue'] = {
    title: 'Bienvenue dans la démo', message: "Les données sont fictives. Vos modifications restent dans cet onglet.", read: false, createdAt: new Date(),
  }
  return docs
}

export default {
  name: 'helio',
  user: { uid: 'demo', email: 'lea.martin@exemple.fr', displayName: 'Léa Martin' },
  docs: build,
  frDate,
}
