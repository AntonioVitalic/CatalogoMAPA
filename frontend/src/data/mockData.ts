import { CollectionItem, User } from "@/types";

export const mockUsers: User[] = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@mapa.cl",
    role: "admin"
  },
  {
    id: "2",
    name: "Editor User",
    email: "editor@mapa.cl",
    role: "editor"
  },
  {
    id: "3",
    name: "Visitor User",
    email: "visitor@example.com",
    role: "visitor"
  }
];

export const mockCollections: string[] = [
  "Cerámica",
  "Textil",
  "Cestería",
  "Madera",
  "Metales",
  "Instrumentos Musicales",
  "Pinturas",
  "Esculturas"
];

export const mockCountries: string[] = [
  "Chile",
  "Perú",
  "Bolivia",
  "Argentina",
  "Ecuador",
  "Colombia",
  "México",
  "Guatemala"
];

export const mockMaterials: string[] = [
  "Arcilla",
  "Madera",
  "Lana",
  "Algodón",
  "Plata",
  "Oro",
  "Cobre",
  "Piedra",
  "Cuero",
  "Fibra vegetal"
];

export const mockAuthors: string[] = [
  "Anónimo",
  "Violeta Parra",
  "Artesanos de Quinchamalí",
  "Comunidad Ayoreo",
  "Artesanos de Pomaire",
  "Comunidad Mapuche",
  "Maestros de Tonalá"
];

export const mockLocalities: string[] = [
  "Santiago",
  "Pomaire",
  "Quinchamalí",
  "Rari",
  "Chiloé",
  "Oaxaca",
  "Cusco",
  "Otavalo"
];

export const mockItems: CollectionItem[] = [
  {
    id: "1",
    inventoryNumber: "MAP-00001",
    previousRegistryNumber: "OLD-001",
    surdoc: "SURDOC123",
    commonName: "Mate con bombilla",
    attributedName: "Calabaza para mate",
    country: "Argentina",
    locality: "Buenos Aires",
    creationDate: "1950",
    materials: ["Calabaza", "Plata"],
    collectionDescription: "Mate tradicional argentino con decoraciones en plata.",
    conservationState: "Bueno",
    location: "Sala 1",
    deposit: "Depósito Principal",
    shelf: "Estante A3",
    imageUrl: "/lovable-uploads/6897bc49-7036-4f19-aff1-1dafd6bb51ec.png",
    thumbnailUrl: "/lovable-uploads/6897bc49-7036-4f19-aff1-1dafd6bb51ec.png",
    collection: "Metales",
    author: "Anónimo"
  },
  {
    id: "2",
    inventoryNumber: "MAP-00002",
    commonName: "Chuspas",
    country: "Perú",
    locality: "Cusco",
    creationDate: "1980",
    materials: ["Lana", "Fibras naturales", "Tintes naturales"],
    collectionDescription: "Bolsas tradicionales para transportar hojas de coca.",
    conservationState: "Bueno",
    imageUrl: "/lovable-uploads/411acf14-16a3-4c5b-a4f7-13ca24f4a03b.png",
    thumbnailUrl: "/lovable-uploads/411acf14-16a3-4c5b-a4f7-13ca24f4a03b.png",
    collection: "Textil",
    author: "Comunidad de tejedores de Chinchero"
  },
  {
    id: "3",
    inventoryNumber: "MAP-00003",
    commonName: "Vasija de cerámica",
    country: "Perú",
    locality: "Cusco",
    creationDate: "1930",
    materials: ["Arcilla", "Pigmentos naturales"],
    collectionDescription: "Cerámica decorativa con iconografía inca.",
    conservationState: "Bueno",
    imageUrl: "/lovable-uploads/d4e8c4c2-0c72-4f41-bce9-be383004ff66.png",
    thumbnailUrl: "/lovable-uploads/d4e8c4c2-0c72-4f41-bce9-be383004ff66.png",
    collection: "Cerámica",
    author: "Anónimo"
  },
  {
    id: "4",
    inventoryNumber: "MAP-00004",
    commonName: "Canasto tradicional",
    country: "Colombia",
    locality: "Amazonas",
    creationDate: "1995",
    materials: ["Fibra vegetal"],
    collectionDescription: "Canasto tejido usado para recolección de frutos.",
    conservationState: "Regular",
    imageUrl: "/lovable-uploads/1418717b-1054-452c-85f8-140df5dba6a6.png",
    thumbnailUrl: "/lovable-uploads/1418717b-1054-452c-85f8-140df5dba6a6.png",
    collection: "Cestería",
    author: "Comunidad indígena Tikuna"
  },
  {
    id: "5",
    inventoryNumber: "MAP-00005",
    commonName: "Figura de madera",
    country: "México",
    locality: "Oaxaca",
    creationDate: "1980",
    materials: ["Madera", "Pintura"],
    collectionDescription: "Figura tallada en madera representando personajes tradicionales.",
    conservationState: "Excelente",
    imageUrl: "/lovable-uploads/c771f879-e7cc-48bf-b085-f8f4790427dc.png",
    thumbnailUrl: "/lovable-uploads/c771f879-e7cc-48bf-b085-f8f4790427dc.png",
    collection: "Madera",
    author: "Maestros de Oaxaca"
  },
  {
    id: "6",
    inventoryNumber: "MAP-00006",
    commonName: "Máscara ceremonial",
    country: "Guatemala",
    locality: "Chichicastenango",
    creationDate: "1940",
    materials: ["Madera", "Pintura"],
    collectionDescription: "Máscara utilizada en ceremonias tradicionales.",
    conservationState: "Regular",
    imageUrl: "/lovable-uploads/81b1ee9b-1605-4d5b-8de6-0b4dbdf1083a.png",
    thumbnailUrl: "/lovable-uploads/81b1ee9b-1605-4d5b-8de6-0b4dbdf1083a.png",
    collection: "Madera",
    author: "Anónimo"
  },
  {
    id: "7",
    inventoryNumber: "MAP-00007",
    commonName: "Retablo ayacuchano",
    country: "Perú",
    locality: "Ayacucho",
    creationDate: "1975",
    materials: ["Madera", "Yeso", "Pintura"],
    collectionDescription: "Retablo tradicional peruano que representa escenas costumbristas.",
    conservationState: "Bueno",
    imageUrl: "/lovable-uploads/3a14f2c7-65ec-4b99-b9a4-fd8b0f0147f8.png",
    thumbnailUrl: "/lovable-uploads/3a14f2c7-65ec-4b99-b9a4-fd8b0f0147f8.png",
    collection: "Esculturas",
    author: "Familia Jiménez"
  },
  {
    id: "8",
    inventoryNumber: "MAP-00008",
    commonName: "Collar de plata",
    country: "Bolivia",
    locality: "La Paz",
    creationDate: "1920",
    materials: ["Plata", "Turquesa"],
    collectionDescription: "Joya ceremonial con técnicas tradicionales de orfebrería.",
    conservationState: "Excelente",
    imageUrl: "/lovable-uploads/404d34aa-fb21-42a2-b901-96cc27052fcf.png",
    thumbnailUrl: "/lovable-uploads/404d34aa-fb21-42a2-b901-96cc27052fcf.png",
    collection: "Metales",
    author: "Anónimo"
  },
  {
    id: "9",
    inventoryNumber: "MAP-00009",
    commonName: "Arpillera",
    country: "Chile",
    locality: "Santiago",
    creationDate: "1978",
    materials: ["Tela", "Hilo", "Lana"],
    collectionDescription: "Tapiz testimonial que narra escenas de la vida rural chilena.",
    conservationState: "Bueno",
    imageUrl: "/lovable-uploads/50101fa3-90f4-409a-a03e-b7972346c08a.png",
    thumbnailUrl: "/lovable-uploads/50101fa3-90f4-409a-a03e-b7972346c08a.png",
    collection: "Textil",
    author: "Anónimo"
  },
  {
    id: "10",
    inventoryNumber: "MAP-00010",
    commonName: "Quena",
    country: "Bolivia",
    locality: "Oruro",
    creationDate: "1990",
    materials: ["Caña", "Madera"],
    collectionDescription: "Instrumento de viento andino tradicional.",
    conservationState: "Bueno",
    imageUrl: "/lovable-uploads/08e46c22-e7dd-4595-8659-b2093b87bd64.png",
    thumbnailUrl: "/lovable-uploads/08e46c22-e7dd-4595-8659-b2093b87bd64.png",
    collection: "Instrumentos Musicales",
    author: "Artesanos de Oruro"
  },
  {
    id: "11",
    inventoryNumber: "MAP-00011",
    commonName: "Quena",
    country: "Bolivia",
    locality: "Oruro",
    creationDate: "1990",
    materials: ["Caña", "Madera"],
    collectionDescription: "Instrumento de viento andino tradicional.",
    conservationState: "Bueno",
    imageUrl: "/lovable-uploads/08e46c22-e7dd-4595-8659-b2093b87bd64.png",
    thumbnailUrl: "/lovable-uploads/08e46c22-e7dd-4595-8659-b2093b87bd64.png",
    collection: "Instrumentos Musicales",
    author: "Artesanos de Oruro"
  },
  {
    id: "12",
    inventoryNumber: "MAP-00012",
    commonName: "Chuspas",
    country: "Perú",
    locality: "Cusco",
    creationDate: "1980",
    materials: ["Lana", "Fibras naturales", "Tintes naturales"],
    collectionDescription: "Bolsas tradicionales para transportar hojas de coca.",
    conservationState: "Bueno",
    imageUrl: "/lovable-uploads/411acf14-16a3-4c5b-a4f7-13ca24f4a03b.png",
    thumbnailUrl: "/lovable-uploads/411acf14-16a3-4c5b-a4f7-13ca24f4a03b.png",
    collection: "Textil",
    author: "Comunidad de tejedores de Chinchero"
  },
];

// Generate more mock items for pagination testing
for (let i = 13; i <= 50; i++) {
  const randomCollection = mockCollections[Math.floor(Math.random() * mockCollections.length)];
  const randomCountry = mockCountries[Math.floor(Math.random() * mockCountries.length)];
  const randomMaterial = mockMaterials[Math.floor(Math.random() * mockMaterials.length)];
  const randomMaterial2 = mockMaterials[Math.floor(Math.random() * mockMaterials.length)];
  const randomAuthor = mockAuthors[Math.floor(Math.random() * mockAuthors.length)];
  const randomLocality = mockLocalities[Math.floor(Math.random() * mockLocalities.length)];
  
  mockItems.push({
    id: i.toString(),
    inventoryNumber: `MAP-${i.toString().padStart(5, '0')}`,
    commonName: `Pieza de colección ${i}`,
    country: randomCountry,
    locality: randomLocality,
    creationDate: (1900 + Math.floor(Math.random() * 120)).toString(),
    materials: [randomMaterial, randomMaterial2],
    collectionDescription: `Descripción de la pieza de colección ${i}`,
    conservationState: Math.random() > 0.5 ? "Bueno" : Math.random() > 0.5 ? "Regular" : "Excelente",
    imageUrl: `https://picsum.photos/seed/${i}/800/800`,
    thumbnailUrl: `https://picsum.photos/seed/${i}/300/300`,
    collection: randomCollection,
    author: randomAuthor
  });
}
