// Données de départ de la démo « sites restaurant » : un restaurant fictif complet.
// Les réservations d'exemple sont créées par l'application elle-même au premier lancement.
const img = id => `https://images.unsplash.com/${id}?w=900&auto=format&fit=crop`
const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0] }

export default {
  name: 'resto',
  docs: {
    'config/theme': {
      primaryColor: '#7a4b2a', primaryLight: '#9c6a45', primaryDark: '#55321b', accentColor: '#e0a84a', bgColor: '#faf6f0',
      restaurantName: 'Le Comptoir des Halles', restaurantTagline: 'Burgers & cuisine maison', fontHeading: 'Playfair Display', darkMode: false,
    },
    'config/content': {
      heroLabel: 'Restaurant · Démo',
      heroTitle1: "L'art du",
      heroTitle2: 'burger artisanal',
      heroDesc: "Restaurant fictif créé pour la démonstration. Tout ce que vous voyez se modifie depuis l'espace administrateur : la carte, les horaires, les couleurs, la galerie et les réservations.",
    },
    'config/info': {
      name: 'Le Comptoir des Halles', address: '12 place des Halles, 72000 Le Mans', phone: '02 43 00 00 00', email: 'contact@exemple.fr',
      instagram: '', facebook: '', mapsEmbed: '',
      hours: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map((d, i) => ({
        day: d, open: i !== 0, lunchOpen: true, dinnerOpen: i !== 6,
        lunch: { from: '12:00', to: '14:00' }, dinner: { from: '19:00', to: '22:30' },
      })),
    },
    'config/menu': {
      categories: [
        { id: 'burgers', name: 'Burgers', subtitle: 'Pain brioché du boulanger, frites maison', items: [
          { id: 'b1', name: 'Le Classique', desc: 'Bœuf charolais, cheddar affiné, oignons confits, sauce maison', price: '15 €', tags: ['chef-special'], allergens: ['gluten', 'lactose', 'eggs'] },
          { id: 'b2', name: 'Le Montagnard', desc: 'Bœuf, raclette fondue, lard fumé, pommes de terre grenaille', price: '17 €', tags: [], allergens: ['gluten', 'lactose'] },
          { id: 'b3', name: 'Le Jardin', desc: 'Galette de pois chiches, avocat, pickles de chou rouge', price: '14 €', tags: ['vegetarian', 'vegan'], allergens: ['gluten', 'soy'] },
          { id: 'b4', name: 'Le Brûlant', desc: 'Poulet frit, jalapeños, sauce sriracha au miel', price: '16 €', tags: ['spicy'], allergens: ['gluten', 'eggs'] },
        ] },
        { id: 'salades', name: 'Salades & bowls', subtitle: 'Légumes du marché', items: [
          { id: 's1', name: 'César revisitée', desc: 'Poulet rôti, parmesan, croûtons à l’ail, sauce César maison', price: '13 €', tags: [], allergens: ['gluten', 'lactose', 'eggs', 'fish'] },
          { id: 's2', name: 'Bowl du moment', desc: 'Quinoa, patate douce rôtie, feta, grenade, herbes fraîches', price: '12 €', tags: ['vegetarian', 'gluten-free'], allergens: ['lactose'] },
        ] },
        { id: 'desserts', name: 'Desserts', subtitle: 'Faits maison chaque matin', items: [
          { id: 'd1', name: 'Cookie tiède', desc: 'Chocolat noir et noix de pécan, boule de glace vanille', price: '6 €', tags: ['chef-special'], allergens: ['gluten', 'lactose', 'nuts', 'eggs'] },
          { id: 'd2', name: 'Cheesecake', desc: 'Coulis de fruits rouges', price: '6,50 €', tags: [], allergens: ['gluten', 'lactose', 'eggs'] },
        ] },
      ],
    },
    'menuImages/b1': { data: img('photo-1568901346375-23c9450c58cd') },
    'menuImages/b3': { data: img('photo-1520072959219-c595dc870360') },
    'menuImages/s2': { data: img('photo-1512621776951-a57141f2eefd') },
    'menuImages/d1': { data: img('photo-1499636136210-6f4ee915583e') },
    'gallery/g1': { data: img('photo-1517248135467-4c7edcad34c4'), name: 'salle.jpg', createdAt: 1 },
    'gallery/g2': { data: img('photo-1550547660-d9450f859349'), name: 'burger.jpg', createdAt: 2 },
    'gallery/g3': { data: img('photo-1414235077428-338989a2e8c0'), name: 'table.jpg', createdAt: 3 },
    'gallery/g4': { data: img('photo-1559339352-11d035aa65de'), name: 'comptoir.jpg', createdAt: 4 },
    'gallery/g5': { data: img('photo-1555396273-367ea4eb4db5'), name: 'terrasse.jpg', createdAt: 5 },
    'gallery/g6': { data: img('photo-1551782450-a2132b4ba21d'), name: 'frites.jpg', createdAt: 6 },
    'promos/p1': { id: 'p1', title: 'Formule midi', description: 'Burger + dessert + boisson du lundi au vendredi', discount: '18 €', validUntil: day(60), active: true },
    'config/googlePlaces': {
      mapsUrl: '',
      reviews: [
        { id: 'r1', author: 'Camille R.', rating: 5, date: 'il y a 2 semaines', text: 'Le meilleur burger du coin, et le cookie tiède vaut le détour.' },
        { id: 'r2', author: 'Julien M.', rating: 5, date: 'il y a 1 mois', text: 'Service rapide le midi, produits frais, on revient souvent avec les collègues.' },
        { id: 'r3', author: 'Sarah L.', rating: 4, date: 'il y a 2 mois', text: 'Très bon burger végétarien, salle agréable. Un peu de monde le samedi soir.' },
      ],
    },
    'reviews/v1': { id: 'v1', author: 'Nadia B.', rating: 5, text: 'Réservation en ligne très pratique, table prête à notre arrivée.', visible: true, createdAt: Date.now() - 86400000 * 3 },
    'reviews/v2': { id: 'v2', author: 'Marc T.', rating: 4, text: 'Bonne adresse, frites maison excellentes.', visible: false, createdAt: Date.now() - 86400000 },
  },
}
