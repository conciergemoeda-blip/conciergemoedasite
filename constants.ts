import { Property, Lead, Stats } from './types';

// Approximate coordinates for Moeda, MG region
const MOEDA_CENTER = { lat: -20.3387, lng: -44.0544 };

export const MOCK_PROPERTIES: Property[] = [
  {
    id: '1',
    title: 'Fazenda Goiabeira',
    description: 'Aconchegante fazenda no lugarejo chamado Taquaraçu, em Moeda-MG. Ampla área de lazer com piscina, gramado extenso e casa com varanda colonial. Ideal para grandes famílias.',
    location: 'Taquaraçu, Moeda-MG',
    price: 1250,
    rating: 4.95,
    reviews: 84,
    guests: 16,
    bedrooms: 5,
    beds: 10,
    baths: 4,
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop', // Pool/Farm vibe
    gallery: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1583533272956-61386d38e88e?q=80&w=2070&auto=format&fit=crop'
    ],
    amenities: ['Piscina Grande', 'Playground', 'Churrasqueira', 'Varanda Colonial', 'Wi-Fi'],
    tags: ['Superhost'],
    featured: true,
    ownerPhone: '5531988881111',
    coordinates: { lat: -20.3520, lng: -44.0250 },
    owner: {
      name: "Dona Maria Helena",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1888&auto=format&fit=crop",
      isSuperhost: true,
      joinedDate: "Membro desde 2015",
      responseRate: "100%",
      responseTime: "Responde em até 1 hora",
      bio: "Apaixonada pela vida no campo. Cuido da Fazenda Goiabeira com muito carinho para receber famílias que buscam paz e natureza."
    }
  },
  {
    id: '2',
    title: 'Sítio da Barra',
    description: 'Localizado na região da Barra, apenas 60km de BH. Espaço gourmet completo com fogão a lenha e churrasqueira, perfeito para confraternizações.',
    location: 'Barra, Moeda-MG',
    price: 1100,
    rating: 4.88,
    reviews: 42,
    guests: 10,
    bedrooms: 7,
    beds: 8,
    baths: 5,
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop', // Rustic Kitchen/BBQ
    gallery: [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop'
    ],
    amenities: ['Área Gourmet', 'Fogão a Lenha', 'Churrasqueira', 'Piscina'],
    tags: [],
    featured: true,
    ownerPhone: '5531988882222',
    coordinates: { lat: -20.3200, lng: -44.0700 },
    owner: {
      name: "Sr. Antônio",
      avatar: "https://images.unsplash.com/photo-1552058544-f2b08422138a?q=80&w=1887&auto=format&fit=crop",
      isSuperhost: false,
      joinedDate: "Membro desde 2019",
      responseRate: "90%",
      responseTime: "Responde em algumas horas",
      bio: "Adoro churrasco e modas de viola. O Sítio da Barra é o meu lugar preferido para reunir os amigos."
    }
  },
  {
    id: '3',
    title: 'Fazendinha',
    description: 'Espaço amplo com piscina infantil e adulto. Acomoda grandes grupos com conforto. Área verde preservada e muita tranquilidade.',
    location: 'Moeda-MG',
    price: 1250,
    rating: 4.90,
    reviews: 56,
    guests: 17,
    bedrooms: 5,
    beds: 12,
    baths: 4,
    imageUrl: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=2070&auto=format&fit=crop', // Pool with lawn
    gallery: [],
    amenities: ['Piscina Infantil', 'Piscina Adulto', 'Campo de Grama', 'Playground'],
    tags: [],
    featured: false,
    ownerPhone: '5531988883333',
    coordinates: { lat: -20.3450, lng: -44.0500 },
    owner: {
      name: "Cláudia",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=1961&auto=format&fit=crop",
      isSuperhost: true,
      joinedDate: "Membro desde 2020",
      responseRate: "98%",
      responseTime: "Responde em até 1 hora",
      bio: "Mãe de três e anfitriã dedicada. Preparei a Fazendinha pensando na segurança e diversão das crianças."
    }
  },
  {
    id: '4',
    title: 'Toca do Rei Leão',
    description: 'Sítio rústico com pesque-e-solte e piscina. Acomoda até 20 pessoas, sendo ideal para retiros e grandes encontros familiares.',
    location: 'Moeda-MG',
    price: 1100,
    rating: 4.85,
    reviews: 30,
    guests: 20,
    bedrooms: 6,
    beds: 15,
    baths: 5,
    imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop', // Rustic exterior
    gallery: [],
    amenities: ['Pesque e Solte', 'Piscina', 'Campo de Futebol', 'Área de Lazer'],
    tags: [],
    featured: false,
    ownerPhone: '5531988884444',
    coordinates: { lat: -20.3600, lng: -44.0600 },
    owner: {
      name: "Ricardo",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1887&auto=format&fit=crop",
      isSuperhost: false,
      joinedDate: "Membro desde 2021",
      responseRate: "85%",
      responseTime: "Responde no mesmo dia",
      bio: "Amante da pesca e da natureza. Venha conhecer nosso lago!"
    }
  },
  {
    id: '5',
    title: 'Lapinha do Sertão',
    description: 'Casa de campo com acabamento premium e vista panorâmica através de janelas de vidro. Cozinha integrada e varanda suspensa.',
    location: 'Sertão, Moeda-MG',
    price: 1550,
    rating: 5.0,
    reviews: 18,
    guests: 10,
    bedrooms: 5,
    beds: 6,
    baths: 3,
    imageUrl: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=2070&auto=format&fit=crop', // View/Glass
    gallery: [],
    amenities: ['Vista Panorâmica', 'Acabamento Premium', 'Wi-Fi', 'Cozinha Gourmet'],
    tags: ['Superhost', 'Novo'],
    featured: true,
    ownerPhone: '5531988885555',
    coordinates: { lat: -20.3800, lng: -44.0400 },
    owner: {
      name: "Fernanda Arquiteta",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1888&auto=format&fit=crop",
      isSuperhost: true,
      joinedDate: "Membro desde 2022",
      responseRate: "100%",
      responseTime: "Responde em até 30 min",
      bio: "Arquiteta apaixonada por design e paisagens. A Lapinha do Sertão é meu projeto de vida."
    }
  },
  {
    id: '6',
    title: 'Chalés Luas da Serra',
    description: 'Charme e privacidade nas alturas. Conjunto de chalés coloridos, cada um sendo uma suíte com ar-condicionado e café da manhã incluso.',
    location: 'Serra da Moeda, MG',
    price: 350,
    rating: 4.98,
    reviews: 112,
    guests: 3,
    bedrooms: 1,
    beds: 1,
    baths: 1,
    imageUrl: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=2070&auto=format&fit=crop', // Chalet/Cabin
    gallery: [],
    amenities: ['Café da Manhã', 'Ar Condicionado', 'Suíte Privativa', 'Vista para Serra'],
    tags: ['Ecológico'],
    featured: true,
    ownerPhone: '5531988886666',
    coordinates: { lat: -20.3100, lng: -44.0100 },
    owner: {
      name: "Pousada Luas",
      avatar: "https://images.unsplash.com/photo-1596815064285-45ed8a9c0463?q=80&w=1889&auto=format&fit=crop",
      isSuperhost: true,
      joinedDate: "Membro desde 2017",
      responseRate: "100%",
      responseTime: "Responde imediatamente",
      bio: "Nossa equipe está pronta para tornar seu fim de semana romântico inesquecível na Serra da Moeda."
    }
  }
];

export const MOCK_LEADS: Lead[] = [
  { id: '1', name: 'Carlos Silva', property: 'Fazenda Goiabeira', date: '12 Out, 14:30', status: 'Novo', lastMessage: 'Olá, a piscina é aquecida?' },
  { id: '2', name: 'Ana Souza', property: 'Chalés Luas da Serra', date: '12 Out, 10:15', status: 'Contatado', lastMessage: 'Qual o valor para casal no fim de semana?' },
  { id: '3', name: 'Roberto Dias', property: 'Sítio da Barra', date: '11 Out, 09:20', status: 'Fechado', lastMessage: 'Comprovante do sinal enviado.' },
  { id: '4', name: 'Fernanda Lima', property: 'Lapinha do Sertão', date: '10 Out, 16:00', status: 'Contatado', lastMessage: 'Tem disponibilidade para o Natal?' },
  { id: '5', name: 'Marcos Junior', property: 'Toca do Rei Leão', date: '09 Out, 11:20', status: 'Novo', lastMessage: 'Somos 20 pessoas, o valor altera?' },
];

export const MOCK_STATS: Stats = {
  totalProperties: 6,
  activeLeads: 28,
  monthlyConversion: 15.2,
  totalRevenue: 32450
};

export const SITE_CONFIG = {
  whatsapp: '5531999999999',
  formattedWhatsapp: '(31) 99999-9999',
  email: 'contato@conciergemoeda.com.br'
};

export const ADMIN_USER = {
  name: 'Ricardo Administrador',
  email: 'ricardo@moeda.com',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop'
};