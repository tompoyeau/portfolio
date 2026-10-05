// Données de départ de la démo Bloom : le visiteur est « Alex », qui prépare avec ses amis
// l'anniversaire surprise de Camille. Aucune donnée réelle, aucune connexion à Firebase.
const iso = d => d.toISOString().slice(0, 10)
const inDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return d }
const ago = min => new Date(Date.now() - min * 60000)
const birth = (n, year) => { const d = inDays(n); d.setFullYear(year); return iso(d) }

const PEOPLE = {
  demo: { displayName: 'Alex Martin', pseudo: 'alex', birthdate: birth(140, 1994) },
  camille: { displayName: 'Camille Roux', pseudo: 'camille', birthdate: birth(12, 1995) },
  lea: { displayName: 'Léa Bernard', pseudo: 'lea', birthdate: birth(45, 1993) },
  mehdi: { displayName: 'Mehdi Saïdi', pseudo: 'mehdi', birthdate: birth(83, 1994) },
  sarah: { displayName: 'Sarah Lopez', pseudo: 'sarah', birthdate: birth(201, 1996) },
  julie: { displayName: 'Julie Fontaine', pseudo: 'julie', birthdate: birth(30, 1995) },
}
const prefixes = (...words) => {
  const out = new Set()
  words.join(' ').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/\s+/).filter(Boolean)
    .forEach(w => { for (let i = 1; i <= w.length; i++) out.add(w.slice(0, i)) })
  return [...out]
}

function build() {
  const docs = {}
  for (const [uid, p] of Object.entries(PEOPLE)) {
    docs['users/' + uid] = { uid, ...p, email: p.pseudo + '@exemple.fr', emailLower: p.pseudo + '@exemple.fr', photoURL: null, createdAt: ago(60 * 24 * 90) }
    docs['publicProfiles/' + uid] = { uid, displayName: p.displayName, pseudo: p.pseudo, searchPrefixes: prefixes(p.displayName, p.pseudo) }
    docs['usernames/' + p.pseudo] = { uid }
  }
  const crew = ['demo', 'camille', 'lea', 'mehdi', 'sarah']
  // Amitiés mutuelles entre les membres du groupe
  crew.forEach(a => crew.forEach(b => {
    if (a !== b) docs[`users/${a}/friends/${b}`] = { uid: b, displayName: PEOPLE[b].displayName, pseudo: PEOPLE[b].pseudo, birthdate: PEOPLE[b].birthdate, photoURL: null, addedAt: ago(60 * 24 * 60) }
  }))
  docs['friendRequests/julie_demo'] = { fromUid: 'julie', toUid: 'demo', fromDisplayName: PEOPLE.julie.displayName, fromPseudo: 'julie', fromBirthdate: PEOPLE.julie.birthdate, createdAt: ago(90) }
  docs['circles/potes'] = { name: 'Les potes', emoji: '🎉', ownerId: 'demo', memberIds: crew, createdAt: ago(60 * 24 * 60) }

  const E = 'events/anniv-camille'
  docs[E] = {
    title: 'Anniversaire de Camille', occasion: 'birthday', honoreeIds: ['camille'], date: iso(inDays(12)),
    address: 'Le Comptoir des Halles, Le Mans', addressLat: null, addressLon: null,
    createdBy: 'demo', memberIds: crew, circleId: 'potes', openInvite: false, createdAt: ago(60 * 24 * 6),
  }
  docs[E + '/channels/main'] = { eventId: 'anniv-camille', type: 'main', memberIds: crew }
  docs[E + '/channels/surprise'] = { eventId: 'anniv-camille', type: 'surprise', memberIds: crew.filter(u => u !== 'camille') }
  const msg = (ch, id, from, text, min) => { docs[`${E}/channels/${ch}/messages/${id}`] = { channelId: ch, senderId: from, senderName: PEOPLE[from].displayName, text, createdAt: ago(min) } }
  msg('main', 'm1', 'demo', 'Salut tout le monde ! On fête les 31 ans de Camille, qui est dispo ? 🎂', 60 * 30)
  msg('main', 'm2', 'camille', 'Trop bien, merci Alex ! Je ramène le gâteau 😄', 60 * 29)
  msg('main', 'm3', 'lea', 'Je serai là vers 20 h.', 60 * 5)
  msg('main', 'm4', 'mehdi', 'Pareil, je peux passer prendre Sarah.', 60 * 4)
  msg('surprise', 's1', 'demo', 'Ici Camille ne voit rien 🤫 On se cotise pour un cadeau ?', 60 * 28)
  msg('surprise', 's2', 'sarah', 'Oui ! Elle parle de l’appareil photo instantané depuis des mois.', 60 * 27)
  msg('surprise', 's3', 'lea', 'J’ai voté pour l’appareil, et j’ai avancé les ballons.', 60 * 3)
  msg('surprise', 's4', 'mehdi', 'Je m’occupe de réserver la table.', 45)
  docs[E + '/gifts/g1'] = { eventId: 'anniv-camille', title: 'Appareil photo instantané', url: null, price: 119, proposedBy: 'sarah', proposedByName: PEOPLE.sarah.displayName, votes: ['sarah', 'lea', 'demo'], status: 'chosen', createdAt: ago(60 * 27) }
  docs[E + '/gifts/g2'] = { eventId: 'anniv-camille', title: 'Coffret de pellicules', url: null, price: 35, proposedBy: 'lea', proposedByName: PEOPLE.lea.displayName, votes: ['lea'], status: 'idea', createdAt: ago(60 * 20) }
  docs[E + '/gifts/g3'] = { eventId: 'anniv-camille', title: 'Cours de céramique pour deux', url: null, price: 90, proposedBy: 'mehdi', proposedByName: PEOPLE.mehdi.displayName, votes: [], status: 'idea', createdAt: ago(60 * 10) }
  docs[E + '/expenses/x1'] = { eventId: 'anniv-camille', label: 'Ballons et déco', amount: 24, paidBy: 'lea', splitBetween: ['demo', 'lea', 'mehdi', 'sarah'], createdAt: ago(60 * 3) }
  docs[E + '/expenses/x2'] = { eventId: 'anniv-camille', label: 'Acompte restaurant', amount: 80, paidBy: 'demo', splitBetween: ['demo', 'lea', 'mehdi', 'sarah'], createdAt: ago(60 * 2) }
  docs[E + '/participation/demo'] = { participating: true, cap: null }
  docs[E + '/participation/sarah'] = { participating: true, cap: 40 }
  docs[E + '/participation/lea'] = { participating: true, cap: null }
  docs[E + '/participation/mehdi'] = { participating: true, cap: 30 }
  return docs
}

export default {
  name: 'bloom',
  user: { uid: 'demo', email: 'alex@exemple.fr', displayName: 'Alex Martin' },
  docs: build,
}
