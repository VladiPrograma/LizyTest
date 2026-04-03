export type PaymentCategoryTone =
  | "restaurant"
  | "services"
  | "transport"
  | "software"
  | "office";

export type PaymentDirection = "incoming" | "outgoing";

export type PaymentEntry = {
  id: string;
  displayDate: string;
  business: string;
  description: string;
  category: string;
  categoryTone: PaymentCategoryTone;
  amount: number;
  direction: PaymentDirection;
  periodMonth: "Abril" | "Marzo";
  periodYear: "2026";
  statusLabel?: string;
};

export const paymentEntries: PaymentEntry[] = [
  {
    id: "payment-1",
    displayDate: "2 Abr 2026",
    business: "Restaurante El Jardín",
    description: "Cena de equipo - abril 2026",
    category: "Restaurantes",
    categoryTone: "restaurant",
    amount: 1250,
    direction: "outgoing",
    periodMonth: "Abril",
    periodYear: "2026",
  },
  {
    id: "payment-2",
    displayDate: "28 Mar 2026",
    business: "Acme Corp",
    description: "Pago de factura #2024-089",
    category: "Servicios",
    categoryTone: "services",
    amount: 3480,
    direction: "incoming",
    periodMonth: "Abril",
    periodYear: "2026",
  },
  {
    id: "payment-3",
    displayDate: "25 Mar 2026",
    business: "Uber Spain",
    description: "Trayecto oficina - aeropuerto",
    category: "Transporte",
    categoryTone: "transport",
    amount: 32.5,
    direction: "outgoing",
    periodMonth: "Abril",
    periodYear: "2026",
  },
  {
    id: "payment-4",
    displayDate: "20 Mar 2026",
    business: "Notion Labs Inc.",
    description: "Suscripción mensual - Team Plan",
    category: "Software",
    categoryTone: "software",
    amount: 96,
    direction: "outgoing",
    periodMonth: "Abril",
    periodYear: "2026",
  },
  {
    id: "payment-5",
    displayDate: "15 Mar 2026",
    business: "Amazon Business",
    description: "Material de oficina - Q1",
    category: "Oficina",
    categoryTone: "office",
    amount: 245.8,
    direction: "outgoing",
    periodMonth: "Abril",
    periodYear: "2026",
  },
  {
    id: "payment-6",
    displayDate: "10 Mar 2026",
    business: "Freelance Studio",
    description: "Diseño UI/UX - proyecto web",
    category: "Servicios",
    categoryTone: "services",
    amount: 5480,
    direction: "incoming",
    periodMonth: "Abril",
    periodYear: "2026",
    statusLabel: "Pendiente de procesar",
  },
  {
    id: "payment-7",
    displayDate: "8 Mar 2026",
    business: "Iberdrola",
    description: "Factura de electricidad - estudio",
    category: "Servicios",
    categoryTone: "services",
    amount: 142,
    direction: "outgoing",
    periodMonth: "Abril",
    periodYear: "2026",
  },
  {
    id: "payment-8",
    displayDate: "6 Mar 2026",
    business: "Agencia Tributaria",
    description: "Liquidación trimestral - Q1",
    category: "Servicios",
    categoryTone: "services",
    amount: 3063.7,
    direction: "outgoing",
    periodMonth: "Abril",
    periodYear: "2026",
  },
  {
    id: "payment-9",
    displayDate: "24 Feb 2026",
    business: "Metro de Madrid",
    description: "Recargas corporativas",
    category: "Transporte",
    categoryTone: "transport",
    amount: 124,
    direction: "outgoing",
    periodMonth: "Marzo",
    periodYear: "2026",
  },
  {
    id: "payment-10",
    displayDate: "18 Feb 2026",
    business: "Stripe",
    description: "Cobro clientes recurrentes",
    category: "Servicios",
    categoryTone: "services",
    amount: 1840,
    direction: "incoming",
    periodMonth: "Marzo",
    periodYear: "2026",
  },
];

export const yearOptions = ["2026"] as const;
export const monthOptions = ["Abril", "Marzo"] as const;
export const rowsPerPageOptions = [6, 10] as const;

export const sidebarSections = [
  {
    title: "Navegación",
    items: [
      { label: "Dashboard" },
      { label: "Historial de pagos", href: "/dashboard/payments-history", active: true },
      { label: "Pagos por categoría" },
      { label: "Pagos por empresa" },
      { label: "Pagos pendientes" },
      { label: "Gastos variables" },
      { label: "Deudas" },
    ],
  },
  {
    title: "Configuración",
    items: [{ label: "Usuario" }, { label: "Cuenta" }, { label: "Cerrar sesión" }],
  },
] as const;

export const mortgageSummary = {
  amountLabel: "850,00 EUR / mes",
  meta: "Cuota fija - 22 de cada mes - Banco Santander",
  badge: "Activa",
  progressLabel: "Progreso total",
  progressDetail: "96 / 360 cuotas (26,7%)",
  remaining: "264 cuotas restantes - ~22 años al ritmo actual",
};

export const fixedExpenses = {
  amountLabel: "2.850,00 EUR / mes",
  meta: "46% de tus gastos mensuales son recurrentes.",
  items: [
    { label: "Hipoteca", amount: "850 EUR", tone: "housing" },
    { label: "Internet + Móvil", amount: "85 EUR", tone: "software" },
    { label: "Seguros", amount: "320 EUR", tone: "services" },
  ],
};

export const variableExpenses = {
  subtitle: "Tendencias detectadas en gastos recurrentes no fijos.",
  items: [
    { label: "Electricidad", amount: "142 EUR", detail: "+10% vs marzo - pico estacional", trend: "up" },
    { label: "Agua", amount: "38 EUR", detail: "-5% vs marzo - estable", trend: "down" },
  ],
};
