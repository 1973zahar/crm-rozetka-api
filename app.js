"use strict";

const STORAGE_KEY = "arms-crm-v1";

const NAV = [
  ["dashboard", "Панель", "ПН"],
  ["sales", "Продажі", "ПР"],
  ["products", "Товари", "ТВ"],
  ["purchases", "Прихід", "ПХ"],
  ["serials", "Серії / ЄРЗ", "ЄР"],
  ["warehouse", "Склад", "СК"],
  ["b2b", "B2B кабінети", "B2"],
  ["clients", "Клієнти", "КЛ"],
  ["finance", "Фінанси", "ФН"],
  ["reports", "Звіти", "ЗВ"],
  ["marketplaces", "Маркетплейси", "МП"],
  ["integrations", "Інтеграції", "ІН"],
  ["settings", "Налаштування", "НЛ"],
  ["roles", "Ролі", "РЛ"]
];

const VARIANT_DICTIONARY_DEFINITIONS = [
  { key: "documentTypes", label: "Типи документів", legacyKey: "documentTypes" },
  { key: "purchaseDocumentTypes", label: "Типи документів приходу" },
  { key: "salesChannels", label: "Канали продажу" },
  { key: "delivery", label: "Служби доставки", legacyKey: "delivery" },
  { key: "deliveryPayers", label: "Платники доставки" },
  { key: "paymentModes", label: "Режими оплати продажу" },
  { key: "paymentSources", label: "Джерела оплати" },
  { key: "paymentTerms", label: "Умови оплат клієнтів" },
  { key: "clientTypes", label: "Типи клієнтів" },
  { key: "taxModes", label: "Податкові режими" },
  { key: "financeMethods", label: "Методи витрат" },
  { key: "b2bReportSources", label: "Джерела B2B звіту" },
  { key: "cashArticles", label: "Статті руху коштів", legacyKey: "cashArticles" },
  { key: "expenseArticles", label: "Статті витрат", legacyKey: "expenseArticles" },
  { key: "warehouseKinds", label: "Типи складів" }
];

const CATALOG_PARAMETER_DEFINITIONS = [
  { key: "productTypes", label: "Типи товарів", valueHint: "weapon / regular" },
  { key: "brands", label: "Бренди", productDictionaryKey: "brands" },
  { key: "categories", label: "Категорії", productDictionaryKey: "categories" },
  { key: "calibers", label: "Калібри", productDictionaryKey: "calibers" },
  { key: "catalogTags", label: "Акції / розпродаж", valueHint: "Акція / Розпродаж" }
];

const DEFAULT_VARIANT_DICTIONARIES = {
  documentTypes: ["Рахунок", "Видаткова накладна", "Реалізація", "Акт відповідального зберігання", "Повернення", "Переміщення"],
  purchaseDocumentTypes: ["Прибуткова накладна", "Імпорт BAS/BAF", "Акт приймання", "Коригування приходу"],
  salesChannels: ["Магазин", "Сайт", "Rozetka", "Prom", "Epicentr", "Allo", "B2B"],
  delivery: ["Нова пошта", "Укрпошта", "Міст", "Спецзв'язок Укрпошти"],
  deliveryPayers: ["Клієнт", "Компанія", "Маркетплейс"],
  paymentModes: ["Оплачено", "Попередня оплата часткова", "Відтермінування"],
  paymentSources: [
    { id: "payment-source-cash", name: "Готівкова каса", value: "cash" },
    { id: "payment-source-bank", name: "Банк", value: "bank" },
    { id: "payment-source-card", name: "Оплата карткою", value: "card" }
  ],
  paymentTerms: ["Попередня оплата", "Відтермінування 7 днів", "Відтермінування 14 днів", "Відтермінування 30 днів", "Оплата при продажу"],
  clientTypes: [
    { id: "client-type-b2b", name: "B2B", value: "B2B" },
    { id: "client-type-retail", name: "Роздріб", value: "Retail" },
    { id: "client-type-marketplace", name: "Маркетплейс", value: "Marketplace" }
  ],
  taxModes: ["ПДВ", "без ПДВ", "роздріб"],
  financeMethods: ["Каса", "Безготівка", "Банк API", "Конвертація"],
  b2bReportSources: ["Кабінет клієнта", "Звіт клієнта менеджеру", "Імпорт файлу"],
  cashArticles: ["Продаж товарів", "Передоплата B2B", "Повернення коштів", "Конвертація валюти", "Інкасація"],
  expenseArticles: ["Комісія маркетплейсу", "Логістика", "Оренда", "Зарплата", "Банківська комісія", "Закупівля товару"],
  warehouseKinds: [
    { id: "warehouse-own", name: "Основний", value: "own" },
    { id: "warehouse-retail", name: "Магазин", value: "retail" },
    { id: "warehouse-responsible", name: "Відповідальне зберігання", value: "responsible" }
  ]
};

const DEFAULT_CATALOG_PARAMETERS = {
  productTypes: [
    { id: "catalog-type-weapon", name: "Зброя", value: "weapon", active: true },
    { id: "catalog-type-regular", name: "Звичайний товар", value: "regular", active: true }
  ],
  brands: ["Delta Arms", "Nord Hunt", "Optix", "FieldLine"],
  categories: ["Зброя нарізна", "Зброя гладкоствольна", "Оптика", "Чохли та кейси", "Аксесуари"],
  calibers: ["5.56x45", "12/76", "9x19", ".308 Win", "без калібру"],
  catalogTags: ["Акція", "Розпродаж"]
};

const today = "2026-05-23";

const seedState = {
  currentView: "dashboard",
  currentEmployeeId: "emp-001",
  currentRole: "Адміністратор",
  currentManager: "Марія Шевчук",
  settings: {
    closedDay: "2026-05-21",
    baseCurrency: "UAH",
    rates: { UAH: 40.2, USD: 1, EUR: 0.92 },
    firms: [
      { id: "vat", name: "ТОВ Альфа Армс, ПДВ", vat: true },
      { id: "fop", name: "ФОП без ПДВ", vat: false }
    ],
    paymentTerminals: [
      { id: "term-vat-main", name: "POS Monobank · магазин", firmId: "vat", provider: "Mono" },
      { id: "term-vat-b2b", name: "POS ПриватБанк · B2B", firmId: "vat", provider: "ПриватБанк" },
      { id: "term-fop-main", name: "POS LiqPay · ФОП", firmId: "fop", provider: "LiqPay" }
    ],
    suppliers: [
      { id: "sup-delta", name: "Delta Arms", edrpou: "", phone: "", email: "" },
      { id: "sup-nord", name: "Nord Hunt", edrpou: "", phone: "", email: "" },
      { id: "sup-optix", name: "Optix", edrpou: "", phone: "", email: "" },
      { id: "sup-fieldline", name: "FieldLine", edrpou: "", phone: "", email: "" }
    ],
    productDictionaries: {
      categories: ["Зброя нарізна", "Зброя гладкоствольна", "Оптика", "Чохли та кейси", "Аксесуари"],
      units: ["шт", "компл", "упак"],
      brands: ["Delta Arms", "Nord Hunt", "Optix", "FieldLine"],
      models: ["Карабін AR-15 Civil", "Рушниця помпова Hunter 12", "Приціл коліматорний R-Point", "Чохол тактичний 120 см"],
      calibers: ["5.56x45", "12/76", "9x19", ".308 Win", "без калібру"],
      uktzed: ["9303300000", "9303201000", "9013109000", "4202921900"],
      supplierSkus: ["DA-AR15-CIV", "NH-PUMP-12", "OP-RPOINT", "FL-CASE-120"],
      internalCodes: ["WPN-AR15-001", "WPN-H12-002", "ACC-OPT-001", "ACC-BAG-120"]
    },
    catalogParameters: DEFAULT_CATALOG_PARAMETERS,
    delivery: ["Нова пошта", "Укрпошта", "Міст", "Спецзв'язок Укрпошти"],
    documentTypes: ["Рахунок", "Видаткова накладна", "Реалізація", "Акт відповідального зберігання", "Повернення", "Переміщення"],
    priceTypes: ["Роздріб", "B2B базова", "B2B дилер", "Маркетплейс", "Акційна"],
    cashArticles: ["Продаж товарів", "Передоплата B2B", "Повернення коштів", "Конвертація валюти", "Інкасація"],
    expenseArticles: ["Комісія маркетплейсу", "Логістика", "Оренда", "Зарплата", "Банківська комісія", "Закупівля товару"],
    variantDictionaries: DEFAULT_VARIANT_DICTIONARIES,
    numberPrefix: "INV",
    defaultDueDays: 14,
    vatRate: 20
  },
  roles: [
    {
      name: "Адміністратор",
      canEditClosedDay: true,
      canSellWeapon: true,
      canChangePrices: true,
      canExportAccounting: true,
      canApproveCredit: true,
      canManageUsers: true,
      canViewReports: true,
      canEditSettings: true,
      canPrint: true
    },
    {
      name: "Керівник продажів",
      canEditClosedDay: false,
      canSellWeapon: true,
      canChangePrices: true,
      canExportAccounting: true,
      canApproveCredit: true,
      canManageUsers: false,
      canViewReports: true,
      canEditSettings: false,
      canPrint: true
    },
    {
      name: "Менеджер магазину",
      canEditClosedDay: false,
      canSellWeapon: true,
      canChangePrices: false,
      canExportAccounting: false,
      canApproveCredit: false,
      canManageUsers: false,
      canViewReports: false,
      canEditSettings: false,
      canPrint: false
    },
    {
      name: "Зав склад",
      canEditClosedDay: false,
      canSellWeapon: true,
      canChangePrices: false,
      canExportAccounting: false,
      canApproveCredit: false,
      canManageUsers: false,
      canViewReports: true,
      canEditSettings: false,
      canPrint: true
    },
    {
      name: "Логіст",
      canEditClosedDay: false,
      canSellWeapon: false,
      canChangePrices: false,
      canExportAccounting: false,
      canApproveCredit: false,
      canManageUsers: false,
      canViewReports: false,
      canEditSettings: false,
      canPrint: true
    },
    {
      name: "B2B клієнт",
      canEditClosedDay: false,
      canSellWeapon: false,
      canChangePrices: false,
      canExportAccounting: false,
      canApproveCredit: false,
      canManageUsers: false,
      canViewReports: false,
      canEditSettings: false,
      canPrint: false
    }
  ],
  employees: [
    { id: "emp-001", name: "Марія Шевчук", roleName: "Адміністратор", department: "Адміністрація", phone: "+380671112233", email: "m.shevchuk@example.com", active: true },
    { id: "emp-002", name: "Олег Кравець", roleName: "Керівник продажів", department: "B2B", phone: "+380672224455", email: "o.kravets@example.com", active: true },
    { id: "emp-003", name: "Ірина Бойко", roleName: "Менеджер магазину", department: "Магазин", phone: "+380673336677", email: "i.boiko@example.com", active: true },
    { id: "emp-004", name: "Сергій Данилюк", roleName: "Зав склад", department: "Склад", phone: "+380674448899", email: "s.danyliuk@example.com", active: true },
    { id: "emp-005", name: "Наталія Литвин", roleName: "Логіст", department: "Логістика", phone: "+380675559900", email: "n.lytvyn@example.com", active: true }
  ],
  managers: ["Марія Шевчук", "Олег Кравець", "Ірина Бойко", "Сергій Данилюк", "Наталія Литвин"],
  clients: [
    {
      id: "c-001",
      name: "Магазин Тактик Про",
      type: "B2B",
      manager: "Марія Шевчук",
      paymentTerms: "Відтермінування 14 днів",
      creditLimitUAH: 450000,
      cabinetEnabled: true,
      portalLogin: "tactic",
      portalPassword: "tactic",
      edrpou: "40112233",
      phone: "+380501234567",
      email: "office@tactic-pro.ua",
      priceType: "B2B дилер",
      currency: "UAH",
      taxMode: "ПДВ",
      responsibleStorage: true,
      address: "Київ, вул. Складська, 12"
    },
    {
      id: "c-002",
      name: "Стрілецький Дім",
      type: "B2B",
      manager: "Олег Кравець",
      paymentTerms: "Попередня оплата",
      creditLimitUAH: 0,
      cabinetEnabled: true,
      portalLogin: "strilets",
      portalPassword: "strilets",
      edrpou: "30998877",
      phone: "+380631112233",
      email: "sales@striletskyi-dim.ua",
      priceType: "B2B базова",
      currency: "UAH",
      taxMode: "без ПДВ",
      responsibleStorage: true,
      address: "Львів, вул. Промислова, 4"
    },
    {
      id: "c-003",
      name: "Роздрібний покупець",
      type: "Retail",
      manager: "Ірина Бойко",
      paymentTerms: "Оплата при продажу",
      creditLimitUAH: 0,
      cabinetEnabled: false,
      edrpou: "",
      phone: "",
      email: "",
      priceType: "Роздріб",
      currency: "UAH",
      taxMode: "роздріб",
      responsibleStorage: false,
      address: ""
    }
  ],
  warehouses: [
    { id: "wh-main", name: "Центральний склад", kind: "own" },
    { id: "wh-store", name: "Магазин", kind: "retail" },
    { id: "wh-b2b", name: "Відповідальне зберігання", kind: "responsible" },
    { id: "wh-client-c-001", name: "Склад клієнта · Магазин Тактик Про", kind: "client_responsible", clientId: "c-001" },
    { id: "wh-client-c-002", name: "Склад клієнта · Стрілецький Дім", kind: "client_responsible", clientId: "c-002" }
  ],
  products: [
    {
      id: "p-100",
      type: "weapon",
      model: "Карабін AR-15 Civil",
      caliber: "5.56x45",
      brand: "Delta Arms",
      erzRequired: true,
      barcode: "4820001000019",
      supplierSku: "DA-AR15-CIV",
      internalCode: "WPN-AR15-001",
      uktzed: "9303300000",
      price: 86500,
      currency: "UAH",
      cost: 1620,
      costCurrency: "USD",
      category: "Зброя нарізна",
      unit: "шт",
      minStock: 2,
      leadTimeDays: 21,
      description: "Цивільний карабін із серійним обліком та ЄРЗ контролем.",
      photos: []
    },
    {
      id: "p-101",
      type: "weapon",
      model: "Рушниця помпова Hunter 12",
      caliber: "12/76",
      brand: "Nord Hunt",
      erzRequired: true,
      barcode: "4820001000026",
      supplierSku: "NH-PUMP-12",
      internalCode: "WPN-H12-002",
      uktzed: "9303201000",
      price: 31200,
      currency: "UAH",
      cost: 620,
      costCurrency: "EUR",
      category: "Зброя гладкоствольна",
      unit: "шт",
      minStock: 3,
      leadTimeDays: 18,
      description: "Помпова рушниця для цивільного ринку.",
      photos: []
    },
    {
      id: "p-200",
      type: "regular",
      model: "Приціл коліматорний R-Point",
      caliber: "",
      brand: "Optix",
      erzRequired: false,
      barcode: "4820002000018",
      supplierSku: "OP-RPOINT",
      internalCode: "ACC-OPT-001",
      uktzed: "9013109000",
      price: 5400,
      currency: "UAH",
      cost: 92,
      costCurrency: "USD",
      category: "Оптика",
      unit: "шт",
      minStock: 12,
      leadTimeDays: 14,
      catalogTag: "Акція",
      description: "Коліматорний приціл для роздрібного та B2B продажу.",
      photos: []
    },
    {
      id: "p-201",
      type: "regular",
      model: "Чохол тактичний 120 см",
      caliber: "",
      brand: "FieldLine",
      erzRequired: false,
      barcode: "4820002000025",
      supplierSku: "FL-CASE-120",
      internalCode: "ACC-BAG-120",
      uktzed: "4202921900",
      price: 2100,
      currency: "UAH",
      cost: 46,
      costCurrency: "EUR",
      category: "Чохли та кейси",
      unit: "шт",
      minStock: 15,
      leadTimeDays: 10,
      catalogTag: "Розпродаж",
      description: "Тканинний тактичний чохол 120 см.",
      photos: []
    }
  ],
  serials: [
    {
      id: "s-001",
      productId: "p-100",
      serial: "AR15-UA-24001",
      warehouseId: "wh-main",
      status: "available",
      erzStatus: "verified",
      actual: true,
      basSynced: true,
      purchaseId: "pin-240520-001",
      clientId: "",
      permitNumber: "",
      permitDate: ""
    },
    {
      id: "s-002",
      productId: "p-100",
      serial: "AR15-UA-24002",
      warehouseId: "wh-b2b",
      status: "responsible_storage",
      erzStatus: "verified",
      actual: true,
      basSynced: true,
      purchaseId: "pin-240520-001",
      clientId: "c-001",
      permitNumber: "",
      permitDate: ""
    },
    {
      id: "s-003",
      productId: "p-101",
      serial: "H12-UA-88015",
      warehouseId: "wh-store",
      status: "available",
      erzStatus: "pending",
      actual: true,
      basSynced: false,
      purchaseId: "pin-240521-002",
      clientId: "",
      permitNumber: "",
      permitDate: ""
    },
    {
      id: "s-004",
      productId: "p-100",
      serial: "AR15-UA-24003",
      warehouseId: "wh-client-c-001",
      status: "responsible_storage",
      erzStatus: "verified",
      actual: true,
      basSynced: true,
      purchaseId: "rs-240523-001",
      clientId: "c-001",
      permitNumber: "",
      permitDate: "",
      responsibleStorageDocId: "rs-240523-001"
    }
  ],
  stock: [
    { productId: "p-200", warehouseId: "wh-main", firmId: "vat", qty: 31 },
    { productId: "p-200", warehouseId: "wh-store", firmId: "vat", qty: 8 },
    { productId: "p-201", warehouseId: "wh-main", firmId: "fop", qty: 44 },
    { productId: "p-201", warehouseId: "wh-client-c-002", firmId: "vat", qty: 12, clientId: "c-002", responsibleStorageDocId: "rs-240522-002" }
  ],
  responsibleStorageDocs: [
    {
      id: "rs-240523-001",
      date: "2026-05-23",
      clientId: "c-001",
      warehouseId: "wh-client-c-001",
      productId: "p-100",
      qty: 1,
      serialIds: ["s-004"],
      manager: "Марія Шевчук",
      paymentDays: 14,
      status: "in_storage",
      ownership: "ours_until_client_sale",
      comment: "Передано на відповідальне зберігання, власність наша до продажу клієнтом."
    },
    {
      id: "rs-240522-002",
      date: "2026-05-22",
      clientId: "c-002",
      warehouseId: "wh-client-c-002",
      productId: "p-201",
      qty: 12,
      serialIds: [],
      manager: "Олег Кравець",
      paymentDays: 10,
      status: "in_storage",
      ownership: "ours_until_client_sale",
      comment: "Кількісний товар на складі клієнта."
    }
  ],
  b2bShipmentRequests: [
    {
      id: "req-240523-001",
      date: "2026-05-23",
      desiredDate: "2026-05-25",
      clientId: "c-001",
      productId: "p-200",
      qty: 2,
      status: "request_new",
      manager: "Марія Шевчук",
      comment: "Попередня заявка з B2B кабінету. Менеджер має підтвердити наявність, фірму, умови та відвантаження.",
      firmId: "",
      serialIds: [],
      price: "",
      currency: "",
      paymentDays: "",
      delivery: "",
      ttn: "",
      responsibleDocId: "",
      validation: []
    }
  ],
  purchases: [
    {
      id: "pin-240520-001",
      date: "2026-05-20",
      supplier: "Delta Arms",
      supplierDoc: "DA-8801",
      firmId: "vat",
      warehouseId: "wh-main",
      productId: "p-100",
      productType: "weapon",
      qty: 2,
      cost: 1620,
      currency: "USD",
      serials: ["AR15-UA-24001", "AR15-UA-24002"],
      accounting: true,
      basStatus: "exported",
      comment: "Імпортовано в BAS/BAF, серії актуальні"
    },
    {
      id: "pin-240521-002",
      date: "2026-05-21",
      supplier: "Nord Hunt",
      supplierDoc: "NH-772",
      firmId: "vat",
      warehouseId: "wh-store",
      productId: "p-101",
      productType: "weapon",
      qty: 1,
      cost: 620,
      currency: "EUR",
      serials: ["H12-UA-88015"],
      accounting: true,
      basStatus: "pending",
      comment: "Очікує підтвердження ЄРЗ та експорту BAS/BAF"
    }
  ],
  invoices: [
    {
      id: "inv-240521-001",
      date: "2026-05-21",
      firmId: "vat",
      channel: "B2B",
      clientId: "c-001",
      manager: "Марія Шевчук",
      currency: "UAH",
      total: 86500,
      paid: 30000,
      dueDate: "2026-06-04",
      accounting: true,
      locked: true,
      status: "partial",
      lines: [
        { productId: "p-100", qty: 1, price: 86500, serialId: "s-002", permitNumber: "ДЗ-450112", permitDate: "2026-05-19" }
      ],
      delivery: "Спецзв'язок Укрпошти",
      ttn: "SZ-009812"
    },
    {
      id: "inv-240522-002",
      date: "2026-05-22",
      firmId: "fop",
      channel: "Rozetka",
      clientId: "c-003",
      manager: "Ірина Бойко",
      currency: "UAH",
      total: 10800,
      paid: 10800,
      dueDate: "2026-05-22",
      accounting: false,
      locked: false,
      status: "paid",
      lines: [{ productId: "p-200", qty: 2, price: 5400, serialId: "", permitNumber: "", permitDate: "" }],
      delivery: "Нова пошта",
      ttn: "NP-590010222"
    }
  ],
  payments: [
    {
      id: "pay-001",
      invoiceId: "inv-240521-001",
      date: "2026-05-21",
      amount: 30000,
      currency: "UAH",
      rate: 1,
      method: "Безготівка",
      bankRef: "mono-88210"
    },
    {
      id: "pay-002",
      invoiceId: "inv-240522-002",
      date: "2026-05-22",
      amount: 10800,
      currency: "UAH",
      rate: 1,
      method: "Каса",
      bankRef: "cash-shift-47"
    }
  ],
  expenses: [
    { id: "exp-001", date: "2026-05-22", article: "Комісія маркетплейсу", amount: 648, currency: "UAH", method: "Безготівка", manager: "Ірина Бойко", supplier: "Rozetka", comment: "Комісія по замовленню NP-590010222" },
    { id: "exp-002", date: "2026-05-21", article: "Логістика", amount: 920, currency: "UAH", method: "Безготівка", manager: "Марія Шевчук", supplier: "Спецзв'язок Укрпошти", comment: "Доставка серійного товару" },
    { id: "exp-003", date: "2026-05-20", article: "Банківська комісія", amount: 18, currency: "USD", method: "Банк API", manager: "Олег Кравець", supplier: "Банк", comment: "SWIFT/еквайринг" }
  ],
  payables: [
    { id: "ap-001", supplier: "Delta Arms", manager: "Марія Шевчук", article: "Закупівля товару", amount: 3240, currency: "USD", dueDate: "2026-06-02", status: "open" },
    { id: "ap-002", supplier: "Optix", manager: "Олег Кравець", article: "Закупівля товару", amount: 1840, currency: "USD", dueDate: "2026-05-30", status: "open" },
    { id: "ap-003", supplier: "FieldLine", manager: "Ірина Бойко", article: "Закупівля товару", amount: 920, currency: "EUR", dueDate: "2026-06-08", status: "planned" }
  ],
  cashShifts: [
    { id: "shift-47", date: "2026-05-22", manager: "Ірина Бойко", expected: 10800, actual: 10800, closed: true },
    { id: "shift-48", date: "2026-05-23", manager: "Сергій Данилюк", expected: 0, actual: 0, closed: false }
  ],
  salesPlans: [
    { manager: "Марія Шевчук", period: "2026-05", plan: 320000, currency: "UAH" },
    { manager: "Олег Кравець", period: "2026-05", plan: 260000, currency: "UAH" },
    { manager: "Ірина Бойко", period: "2026-05", plan: 180000, currency: "UAH" }
  ],
  marketplaceStats: [
    { marketplace: "Rozetka", sku: "OP-RPOINT", productId: "p-200", price: 5400, sold: 2, commission: 648, logistics: 260, otherCosts: 80, cost: 92, costCurrency: "USD", currency: "UAH" },
    { marketplace: "Prom", sku: "FL-CASE-120", productId: "p-201", price: 2100, sold: 5, commission: 420, logistics: 350, otherCosts: 60, cost: 46, costCurrency: "EUR", currency: "UAH" },
    { marketplace: "Allo", sku: "OP-RPOINT", productId: "p-200", price: 5350, sold: 3, commission: 722, logistics: 390, otherCosts: 90, cost: 92, costCurrency: "USD", currency: "UAH" }
  ],
  marketplacePublications: [
    { id: "pub-001", marketplace: "Rozetka", productId: "p-200", sku: "OP-RPOINT-RZ", externalId: "rz-93001", title: "Приціл коліматорний R-Point", price: 5400, currency: "UAH", stockQty: 39, status: "published", photosStatus: "ok", lastSync: "2026-05-23 09:15", manager: "Ірина Бойко" },
    { id: "pub-002", marketplace: "Prom", productId: "p-201", sku: "FL-CASE-120-PR", externalId: "pr-12044", title: "Чохол тактичний 120 см", price: 2100, currency: "UAH", stockQty: 56, status: "needs_sync", photosStatus: "missing", lastSync: "2026-05-22 18:20", manager: "Олег Кравець" },
    { id: "pub-003", marketplace: "Allo", productId: "p-200", sku: "OP-RPOINT-AL", externalId: "al-55120", title: "Коліматорний приціл R-Point", price: 5350, currency: "UAH", stockQty: 39, status: "published", photosStatus: "ok", lastSync: "2026-05-23 08:40", manager: "Ірина Бойко" }
  ],
  marketplaceOrders: [
    {
      id: "mpo-001",
      marketplace: "Rozetka",
      externalOrderId: "RZ-20260523-101",
      date: "2026-05-23",
      status: "new_order",
      dates: { created: "2026-05-23", agreed: "", warehouse: "", delivery: "", delivered: "", paid: "" },
      warehouseStatus: "new",
      manager: "Ірина Бойко",
      productId: "p-200",
      sku: "OP-RPOINT-RZ",
      qty: 1,
      price: 5400,
      currency: "UAH",
      buyer: { name: "Олександр Клименко", phone: "+380501119900", email: "buyer101@example.com", edrpou: "", address: "Київ, відділення Нової пошти 12" },
      delivery: { service: "Нова пошта", city: "Київ", warehouse: "Відділення 12", ttn: "", status: "new", apiStatus: "Очікує ТТН", lastCheck: "" },
      payment: { method: "Післяплата маркетплейсу", status: "expected", amount: 5400, source: "RozetkaPay", apiStatus: "Очікує оплату", lastCheck: "", paidAt: "" },
      clientId: "",
      invoiceId: ""
    }
  ],
  reportBuilder: {
    reportId: "sales",
    from: "2026-05-01",
    to: "2026-05-23",
    columns: [],
    sortBy: "date",
    sortDir: "desc",
    groupBy: ""
  },
  periodFilters: {
    salesDocs: { from: "2026-05-01", to: "2026-05-23" },
    purchaseDocs: { from: "2026-05-01", to: "2026-05-23" },
    serialDocs: { from: "2026-05-01", to: "2026-05-23" },
    warehouseDocs: { from: "2026-05-01", to: "2026-05-23" },
    b2bDocs: { from: "2026-05-01", to: "2026-05-23" },
    financeDocs: { from: "2026-05-01", to: "2026-05-23" },
    marketplaceDocs: { from: "2026-05-01", to: "2026-05-23" },
    integrationDocs: { from: "2026-05-01", to: "2026-05-23" },
    clientPortal: { from: "2026-05-01", to: "2026-05-23" },
    clientCatalogHistory: { from: "2026-05-01", to: "2026-05-23" }
  },
  marketplaceOrderFilters: {
    from: "2026-05-01",
    to: "2026-05-23",
    status: "",
    marketplace: "",
    expanded: false
  },
  marketplacePublicationFilters: {
    search: "",
    expanded: false
  },
  b2bShipmentRequestFilters: {
    from: "2026-05-01",
    to: "2026-05-23",
    status: "",
    search: "",
    sortBy: "date",
    sortDir: "desc",
    expanded: false
  },
  b2bResponsibleStorageFilters: {
    from: "2026-05-01",
    to: "2026-05-23",
    clientId: "",
    productId: "",
    search: "",
    sortBy: "date",
    sortDir: "desc",
    expanded: false
  },
  rozetkaImportedOrderFilters: {
    from: "2026-05-01",
    to: "2026-05-23",
    status: "",
    sortBy: "date",
    sortDir: "desc",
    expanded: false
  },
  rozetkaInbound: {
    lastGoodsSync: "",
    lastOrdersSync: "",
    lastGoodsCount: 0,
    lastOrdersCount: 0,
    lastError: ""
  },
  inventoryFilters: {
    warehouseId: "",
    firmId: ""
  },
  integrations: [
    { id: "rozetka", name: "Rozetka", status: "token_needed", lastSync: "2026-05-22 18:10", scope: "товари, замовлення, залишки, ціни" },
    { id: "prom", name: "Prom", status: "ok", lastSync: "2026-05-23 09:15", scope: "товари, замовлення, залишки, ціни" },
    { id: "epicentr", name: "Epicentr", status: "mapping_needed", lastSync: "2026-05-21 16:45", scope: "товари, замовлення, залишки" },
    { id: "allo", name: "Allo", status: "ok", lastSync: "2026-05-23 08:40", scope: "товари, замовлення, залишки, ціни" },
    { id: "bas", name: "BAS/BAF", status: "ok", lastSync: "2026-05-23 07:10", scope: "позначені документи бухобліку" },
    { id: "bank", name: "Банки", status: "mapping_needed", lastSync: "2026-05-22 20:00", scope: "виписки, платежі, валюта" }
  ],
  audit: [
    { at: "2026-05-23 09:15", actor: "system", action: "Prom sync: оновлено 4 залишки та 2 ціни" },
    { at: "2026-05-22 18:10", actor: "system", action: "Rozetka sync: потрібне оновлення токена" },
    { at: "2026-05-22 12:25", actor: "Марія Шевчук", action: "Накладну inv-240521-001 позначено для BAS/BAF" }
  ]
};

const ROLE_BASIC_PERMISSIONS = [
  ["canEditClosedDay", "Закритий день"],
  ["canSellWeapon", "Продаж зброї"],
  ["canChangePrices", "Зміна цін"],
  ["canExportAccounting", "BAS/BAF"],
  ["canApproveCredit", "Кредит / відтермінування"],
  ["canManageUsers", "Працівники"],
  ["canViewReports", "Звіти"],
  ["canEditSettings", "Налаштування"],
  ["canPrint", "Друк документів і звітів"]
];

const ROLE_DOCUMENT_PERMISSIONS = [
  ["salesInvoice", "Продаж / накладна"],
  ["purchase", "Прихід"],
  ["responsibleShipment", "Відповідальне зберігання"],
  ["b2bShipmentRequest", "Заявка B2B на відвантаження"],
  ["b2bSaleReport", "Звіт продажу B2B"],
  ["payment", "Оплата"],
  ["expense", "Витрата"],
  ["payable", "Кредиторка"],
  ["productCard", "Картка товару"],
  ["productEdit", "Зміна картки товару"],
  ["clientCard", "Картка клієнта"],
  ["clientEdit", "Зміна картки клієнта"],
  ["serialCorrection", "Серійний облік"],
  ["marketplacePublication", "Публікація маркетплейсу"],
  ["marketplaceOrder", "Замовлення маркетплейсу"],
  ["marketplaceStatus", "Зміна статусу маркетплейсу"],
  ["deliveryTracking", "Відстеження доставки / ТТН"],
  ["paymentTracking", "Відстеження оплати"],
  ["settingsDocument", "Налаштування"]
];

const ROLE_POSTED_DOCUMENT_PERMISSIONS = [
  ["salesInvoice", "Проведена накладна продажу"],
  ["purchase", "Проведений прихід"],
  ["responsibleShipment", "Проведене відповідальне зберігання"],
  ["b2bSaleReport", "Проведений звіт продажу B2B"],
  ["payment", "Проведена оплата"],
  ["expense", "Проведена витрата"],
  ["payable", "Проведена кредиторка"],
  ["marketplaceOrder", "Проведене замовлення маркетплейсу"],
  ["serialCorrection", "Проведений серійний документ"]
];

const ROLE_FIELD_PERMISSIONS = [
  ["productRequisites", "Реквізити товару"],
  ["clientRequisites", "Реквізити клієнта"],
  ["date", "Дата документа"],
  ["client", "Клієнт"],
  ["product", "Товар / QR"],
  ["warehouse", "Склад"],
  ["price", "Ціна"],
  ["discount", "Знижка"],
  ["cost", "Собівартість"],
  ["serials", "Серійні номери"],
  ["permit", "Дозвіл покупця"],
  ["payment", "Оплата / каса / банк / курс"],
  ["due", "Відтермінування"],
  ["manager", "Менеджер"],
  ["accounting", "Бухоблік BAS/BAF"],
  ["marketplace", "Маркетплейс"],
  ["marketplaceStatus", "Статус маркетплейс-замовлення"],
  ["deliveryTracking", "ТТН / статус доставки"],
  ["paymentTracking", "Статус оплати маркетплейсу"]
];

const DEFAULT_PRICE_TYPES = [
  { id: "purchase", name: "Прихідна", kind: "cost", active: true, system: true },
  { id: "retail", name: "Роздрібна", kind: "sale", active: true, system: true },
  { id: "b2b", name: "B2B", kind: "sale", active: true, system: true }
];

let state = normalizeState(loadState());
let saleDraft = {
  clientId: "",
  priceType: "",
  lines: [{ productId: "p-200", qty: 1, serialIds: [], permitNumber: "", permitDate: "", barcode: "" }]
};
let purchaseDraft = {
  lines: []
};
let marketplacePublicationDraft = {
  lines: []
};
let b2bDraft = { shipmentProductId: "p-100", saleProductId: "p-100", saleClientId: "c-001", shipmentFirmId: "vat", saleFirmId: "vat" };
let clientPortalDraft = { productId: "", firmId: "", barcode: "", qty: 1, serialIds: [], permitNumber: "", permitDate: "" };
let paymentDraft = { source: "cash", kind: "invoice", clientId: "", invoiceId: "", firmId: "", terminalId: "", prro: "true" };
let authEmployeeId = sessionStorage.getItem("arms-crm-auth-employee-id") || "";
let authClientId = sessionStorage.getItem("arms-crm-auth-client-id") || "";
let authMode = sessionStorage.getItem("arms-crm-auth-mode") || (authClientId ? "client" : authEmployeeId ? "employee" : "");
let clientPortalView = sessionStorage.getItem("arms-crm-client-view") || "cabinet";
let clientCatalogFilters = loadClientCatalogFilters();
let sidebarCollapsed = localStorage.getItem("arms-crm-sidebar-collapsed") === "true";
let productImagesDraft = [];

const MARKETPLACE_IMAGE_TYPES = ["image/jpeg", "image/png"];
const MARKETPLACE_IMAGE_EXTENSIONS = ".jpg,.jpeg,.png";
const MAX_PRODUCT_PHOTOS = 6;
const MAX_PRODUCT_PHOTO_BYTES = 8 * 1024 * 1024;
const PRODUCT_PHOTO_MAX_SIDE = 1280;
const PRODUCT_PHOTO_JPEG_QUALITY = 0.82;

const MARKETPLACE_ORDER_STATUSES = [
  { id: "new_order", label: "новий", className: "marketplace-new" },
  { id: "agreed", label: "погоджено", className: "marketplace-agreed" },
  { id: "sent_to_warehouse", label: "передано на склад", className: "marketplace-warehouse" },
  { id: "sent_to_delivery", label: "передано на доставку", className: "marketplace-delivery" },
  { id: "delivered", label: "доставлено / вручено", className: "marketplace-delivered" },
  { id: "paid", label: "оплачено", className: "marketplace-paid" }
];
const MARKETPLACE_ORDER_STATUS_MAP = Object.fromEntries(MARKETPLACE_ORDER_STATUSES.map((item) => [item.id, item]));
const B2B_SHIPMENT_REQUEST_STATUSES = [
  { id: "request_new", label: "нова заявка" },
  { id: "request_review", label: "потребує виправлення" },
  { id: "request_approved", label: "підтверджено" },
  { id: "request_rejected", label: "відхилено" },
  { id: "request_cancelled", label: "скасовано клієнтом" }
];
const B2B_SHIPMENT_REQUEST_STATUS_MAP = Object.fromEntries(B2B_SHIPMENT_REQUEST_STATUSES.map((item) => [item.id, item]));
const ROZETKA_GOODS_SORT_OPTIONS = ["price_offer_id", "rz_item_id", "price", "price_old", "price_promo", "-price_offer_id", "-rz_item_id", "-price", "-price_old", "-price_promo"];
const ROZETKA_ORDER_SORT_OPTIONS = ["-id", "id", "-created", "created", "-changed", "changed", "-amount", "amount", "-status", "status", "-last_update_status", "last_update_status"];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const DECIMAL_FIELD_NAMES = new Set([
  "price",
  "cost",
  "paid",
  "amount",
  "rate",
  "discount",
  "creditLimitUAH"
]);

function slugId(value, prefix = "price") {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яіїєґ]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  return slug ? `${prefix}-${slug}` : uniqueId(prefix);
}

function normalizePriceTypes(priceTypes = []) {
  const source = Array.isArray(priceTypes) && priceTypes.length ? priceTypes : seedState.settings.priceTypes;
  const normalized = source.map((item) => {
    if (typeof item === "string") {
      const name = item.trim();
      const lower = name.toLowerCase();
      const mappedId = lower.includes("роздр") ? "retail" : lower === "b2b" ? "b2b" : slugId(name, "price");
      return { id: mappedId, name, kind: "sale", active: true, system: ["retail", "b2b"].includes(mappedId) };
    }
    const name = String(item.name || item.label || "").trim();
    const id = item.id || slugId(name, "price");
    return {
      id,
      name: name || id,
      kind: item.kind === "cost" ? "cost" : "sale",
      active: item.active !== false,
      system: item.system === true || ["purchase", "retail", "b2b"].includes(id)
    };
  });
  const byKey = new Map();
  [...DEFAULT_PRICE_TYPES, ...normalized].forEach((item) => {
    const key = item.id || slugId(item.name, "price");
    const previous = byKey.get(key) || {};
    byKey.set(key, { ...previous, ...item, id: key });
  });
  return Array.from(byKey.values());
}

function activeSalePriceTypes(includeInactiveSelected = "") {
  const selected = String(includeInactiveSelected || "");
  return (state.settings.priceTypes || [])
    .filter((item) => item.kind !== "cost" && (item.active !== false || item.id === selected || item.name === selected));
}

function priceTypeById(idOrName) {
  return (state.settings.priceTypes || []).find((item) => item.id === idOrName || item.name === idOrName);
}

function priceTypeName(idOrName) {
  return priceTypeById(idOrName)?.name || idOrName || "-";
}

function marketplacePriceTypeId() {
  return activeSalePriceTypes().find((item) => item.name.toLowerCase().includes("маркет") || item.id.toLowerCase().includes("market"))?.id || "retail";
}

function priceTypeOptions(selected = "") {
  return activeSalePriceTypes(selected).map((item) => option(item.id, item.name, item.id === selected || item.name === selected)).join("");
}

function normalizeProductPrices(product, priceTypes = []) {
  const prices = { ...(product.prices || {}) };
  const baseCurrency = product.currency || "UAH";
  const basePrice = parseDecimal(product.price, 0);
  priceTypes.filter((item) => item.kind !== "cost").forEach((item) => {
    const oldValue = prices[item.id] || prices[item.name] || {};
    prices[item.id] = {
      amount: parseDecimal(oldValue.amount ?? oldValue.price ?? basePrice, basePrice),
      currency: oldValue.currency || baseCurrency
    };
  });
  return prices;
}

function productSalePrice(product, priceTypeId = "") {
  const type = priceTypeById(priceTypeId) || activeSalePriceTypes()[0] || { id: "retail", name: "Роздрібна" };
  const prices = product.prices || {};
  const entry = prices[type.id] || prices[type.name] || {};
  return {
    priceTypeId: type.id,
    priceTypeName: type.name,
    amount: parseDecimal(entry.amount ?? product.price ?? 0, 0),
    currency: entry.currency || product.currency || "UAH"
  };
}

function productPriceInputs(product = {}) {
  return activeSalePriceTypes().map((item) => {
    const entry = (product.prices || {})[item.id] || {};
    const amount = entry.amount ?? product.price ?? 0;
    const currency = entry.currency || product.currency || "UAH";
    return `
      <label class="field"><span>${escapeHtml(item.name)}</span><input name="price_${escapeHtml(item.id)}" inputmode="decimal" data-field-lock="price" value="${escapeHtml(amount)}"></label>
      <label class="field"><span>Валюта ${escapeHtml(item.name)}</span><select name="currency_${escapeHtml(item.id)}" data-field-lock="price">${Object.keys(state.settings.rates).map((code) => option(code, code, code === currency)).join("")}</select></label>
    `;
  }).join("");
}

function productPriceSummary(product) {
  return activeSalePriceTypes().map((item) => {
    const entry = productSalePrice(product, item.id);
    return `<span class="pill info">${escapeHtml(item.name)}: ${formatMoney(entry.amount, entry.currency)}</span>`;
  }).join(" ") || formatMoney(product.price, product.currency);
}

function collectProductPrices(data, fallbackProduct = {}) {
  const prices = {};
  activeSalePriceTypes().forEach((item) => {
    const fallback = productSalePrice(fallbackProduct, item.id);
    prices[item.id] = {
      amount: data[`price_${item.id}`] === undefined ? fallback.amount : parseDecimal(data[`price_${item.id}`], fallback.amount),
      currency: data[`currency_${item.id}`] || fallback.currency || "UAH"
    };
  });
  return prices;
}

function normalizeVariantEntry(item, key, index = 0) {
  if (typeof item === "string") {
    return {
      id: slugId(item, key),
      name: item,
      value: item,
      parentId: "",
      active: true
    };
  }
  const name = String(item.name || item.label || item.value || "").trim();
  const value = String(item.value || name).trim();
  return {
    id: item.id || slugId(`${key}-${value || index}`, key),
    name: name || value || `${key} ${index + 1}`,
    value: value || name,
    parentId: item.parentId || "",
    active: item.active !== false
  };
}

function normalizeVariantDictionaries(settings = {}) {
  const loaded = settings.variantDictionaries || {};
  const result = {};
  VARIANT_DICTIONARY_DEFINITIONS.forEach((definition) => {
    const defaults = DEFAULT_VARIANT_DICTIONARIES[definition.key] || [];
    const legacyValues = definition.legacyKey ? (settings[definition.legacyKey] || []) : [];
    const merged = [...defaults, ...legacyValues, ...(loaded[definition.key] || [])].map((item, index) => normalizeVariantEntry(item, definition.key, index));
    const byKey = new Map();
    merged.forEach((entry) => {
      const uniqueKey = `${entry.parentId || ""}:${entry.value || entry.name}`.toLowerCase();
      byKey.set(uniqueKey, { ...(byKey.get(uniqueKey) || {}), ...entry });
    });
    result[definition.key] = Array.from(byKey.values());
  });
  return result;
}

function variantEntries(key, includeInactive = false, settings = state.settings) {
  const entries = (settings.variantDictionaries?.[key] || []).map((entry, index) => normalizeVariantEntry(entry, key, index));
  return entries
    .filter((entry) => includeInactive || entry.active !== false)
    .sort((first, second) => variantPathLabel(first, entries).localeCompare(variantPathLabel(second, entries), "uk"));
}

function variantPathLabel(entry, entries = []) {
  const source = entries.length ? entries : variantEntries("", true);
  const parent = source.find((item) => item.id === entry.parentId);
  return parent ? `${parent.name} / ${entry.name}` : entry.name;
}

function syncLegacyVariantDictionaries(settings = state.settings) {
  VARIANT_DICTIONARY_DEFINITIONS.forEach((definition) => {
    if (!definition.legacyKey) return;
    settings[definition.legacyKey] = variantEntries(definition.key, true, settings)
      .filter((entry) => entry.active !== false)
      .map((entry) => entry.value || entry.name);
  });
}

function variantOptions(key, selected = "", config = {}) {
  const entries = variantEntries(key, true);
  return entries
    .filter((entry) => config.includeInactive || entry.active !== false || entry.value === selected || entry.name === selected || entry.id === selected)
    .map((entry) => {
      const value = config.useId ? entry.id : (entry.value || entry.name);
      const label = `${entry.parentId ? "— " : ""}${variantPathLabel(entry, entries)}${entry.active === false ? " (вимкнено)" : ""}`;
      return option(value, label, selected === value || selected === entry.name || selected === entry.id);
    })
    .join("");
}

function variantLabel(key, value) {
  const entries = variantEntries(key, true);
  const entry = entries.find((item) => item.value === value || item.name === value || item.id === value);
  return entry ? variantPathLabel(entry, entries) : value || "-";
}

function defaultClientCatalogFilters() {
  return { type: "", brand: "", category: "", caliber: "", catalogTag: "", sort: "name" };
}

function loadClientCatalogFilters() {
  try {
    return { ...defaultClientCatalogFilters(), ...JSON.parse(sessionStorage.getItem("arms-crm-client-catalog-filters") || "{}") };
  } catch (error) {
    return defaultClientCatalogFilters();
  }
}

function saveClientCatalogFilters() {
  sessionStorage.setItem("arms-crm-client-catalog-filters", JSON.stringify(clientCatalogFilters));
}

function normalizeCatalogParameterEntry(item, key, index = 0) {
  if (typeof item === "string") {
    return {
      id: slugId(`${key}-${item}`, key),
      name: item,
      value: item,
      active: true
    };
  }
  const name = String(item.name || item.label || item.value || "").trim();
  const value = String(item.value || name).trim();
  return {
    id: item.id || slugId(`${key}-${value || index}`, key),
    name: name || value || `${key} ${index + 1}`,
    value: value || name,
    active: item.active !== false
  };
}

function normalizeCatalogParameters(settings = {}) {
  const loaded = settings.catalogParameters || {};
  const result = {};
  CATALOG_PARAMETER_DEFINITIONS.forEach((definition) => {
    const defaults = DEFAULT_CATALOG_PARAMETERS[definition.key] || [];
    const merged = [...defaults, ...(loaded[definition.key] || [])].map((item, index) => normalizeCatalogParameterEntry(item, definition.key, index));
    const byKey = new Map();
    merged.forEach((entry) => {
      const uniqueKey = String(entry.value || entry.name).trim().toLowerCase();
      byKey.set(uniqueKey, { ...(byKey.get(uniqueKey) || {}), ...entry });
    });
    result[definition.key] = Array.from(byKey.values());
  });
  return result;
}

function catalogParameterEntries(key, includeInactive = false, settings = state.settings) {
  const entries = (settings.catalogParameters?.[key] || []).map((entry, index) => normalizeCatalogParameterEntry(entry, key, index));
  return entries
    .filter((entry) => includeInactive || entry.active !== false)
    .sort((first, second) => first.name.localeCompare(second.name, "uk"));
}

function catalogParameterOptions(key, selected = "", allLabel = "Усі") {
  return [
    option("", allLabel, !selected),
    ...catalogParameterEntries(key, true)
      .filter((entry) => entry.active !== false || entry.value === selected)
      .map((entry) => option(entry.value, entry.name, entry.value === selected || entry.name === selected))
  ].join("");
}

function catalogTagOptions(selected = "") {
  return [
    option("", "Без акції / звичайний", !selected),
    ...catalogParameterEntries("catalogTags", true)
      .filter((entry) => entry.active !== false || entry.value === selected)
      .map((entry) => option(entry.value, entry.name, entry.value === selected || entry.name === selected))
  ].join("");
}

function addCatalogParameterEntry(key, name, value = "") {
  state.settings.catalogParameters = normalizeCatalogParameters(state.settings);
  state.settings.catalogParameters[key] = state.settings.catalogParameters[key] || [];
  const normalizedName = String(name || "").trim();
  const normalizedValue = String(value || normalizedName).trim();
  if (!normalizedName || !normalizedValue) return null;
  const existing = state.settings.catalogParameters[key].find((entry) => (
    String(entry.value || entry.name).trim().toLowerCase() === normalizedValue.toLowerCase()
  ));
  if (existing) {
    existing.name = normalizedName;
    existing.value = normalizedValue;
    existing.active = true;
    return existing;
  }
  const entry = normalizeCatalogParameterEntry({ id: uniqueId(key), name: normalizedName, value: normalizedValue }, key);
  state.settings.catalogParameters[key].push(entry);
  const definition = CATALOG_PARAMETER_DEFINITIONS.find((item) => item.key === key);
  if (definition?.productDictionaryKey) {
    state.settings.productDictionaries[definition.productDictionaryKey] = uniqueList([...(state.settings.productDictionaries[definition.productDictionaryKey] || []), normalizedValue]);
  }
  return entry;
}

function normalizeDecimalText(value) {
  const raw = String(value ?? "").trim().replace(/\s+/g, "").replaceAll("'", "");
  if (!raw) return "";
  const comma = raw.lastIndexOf(",");
  const dot = raw.lastIndexOf(".");
  if (comma >= 0 && dot >= 0) {
    const decimalIndex = Math.max(comma, dot);
    return `${raw.slice(0, decimalIndex).replace(/[.,]/g, "")}.${raw.slice(decimalIndex + 1)}`;
  }
  return raw.replace(",", ".");
}

function parseDecimal(value, fallback = 0) {
  const number = Number(normalizeDecimalText(value));
  return Number.isFinite(number) ? number : fallback;
}

function isDecimalFieldName(name) {
  const key = String(name || "");
  return DECIMAL_FIELD_NAMES.has(key) || /^[A-Z]{3}$/.test(key);
}

function prepareDecimalInputs(root = document) {
  $$("input", root).forEach((input) => {
    if (isDecimalFieldName(input.name)) {
      input.type = "text";
      input.inputMode = "decimal";
      input.dataset.decimal = "true";
      input.autocomplete = "off";
      input.title = "Можна вводити копійки/центи через кому або крапку";
    } else if (input.type === "number" && !input.step) {
      input.step = "1";
    }
  });
}

const FIELD_LOCKS = {
  date: ["date"],
  client: ["clientId", "clientName"],
  product: ["productId", "barcode"],
  warehouse: ["warehouseId"],
  price: ["price", "currency", "priceType"],
  discount: ["discount"],
  cost: ["cost", "costCurrency"],
  serials: ["serialIds", "serials"],
  permit: ["permitNumber", "permitDate"],
  payment: ["paid", "paymentMode", "paymentKind", "paymentSource", "clientId", "invoiceId", "firmId", "terminalId", "prro", "amount", "currency", "rate", "method", "bankRef"],
  due: ["dueDays", "paymentDays", "dueDate"],
  manager: ["manager"],
  accounting: ["accounting", "firmId"],
  marketplace: ["marketplace", "sku", "externalId"],
  marketplaceStatus: ["status"],
  deliveryTracking: ["ttn", "deliveryStatus"],
  paymentTracking: ["paymentStatus"],
  productRequisites: [],
  clientRequisites: []
};

function applyRoleFieldLocks(root = document) {
  Object.entries(FIELD_LOCKS).forEach(([fieldKey, names]) => {
    if (canEditField(fieldKey)) return;
    $$(`[data-field-lock="${fieldKey}"]`, root).forEach((element) => {
      element.disabled = true;
      element.title = "Поле заблоковане поточною роллю";
    });
    names.forEach((name) => {
      $$(`[name="${name}"]`, root).forEach((element) => {
        element.disabled = true;
        element.title = "Поле заблоковане поточною роллю";
      });
    });
  });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function uniqueList(values) {
  const seen = new Set();
  return values.reduce((list, value) => {
    const text = String(value ?? "").trim();
    const key = text.toLowerCase();
    if (!text || seen.has(key)) return list;
    seen.add(key);
    list.push(text);
    return list;
  }, []);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : clone(seedState);
  } catch (error) {
    console.warn("Cannot load state", error);
    return clone(seedState);
  }
}

function roleHasAdminAccess(roleItem) {
  return roleItem?.canManageUsers === true || roleItem?.name === "Адміністратор" || roleItem?.name === "РђРґРјС–РЅС–СЃС‚СЂР°С‚РѕСЂ";
}

function defaultRoleAccess(roleItem) {
  const admin = roleHasAdminAccess(roleItem);
  const warehouseLead = roleItem.name === "Зав склад";
  const logistic = roleItem.name === "Логіст";
  const views = Object.fromEntries(NAV.map(([id]) => {
    const allowed = admin
      || id === "dashboard"
      || (id === "reports" && roleItem.canViewReports)
      || (id === "settings" && roleItem.canEditSettings)
      || (id === "roles" && roleItem.canManageUsers)
      || (id === "finance" && (roleItem.canApproveCredit || roleItem.canViewReports))
      || (warehouseLead && ["purchases", "serials", "warehouse", "marketplaces", "reports"].includes(id))
      || (logistic && ["marketplaces", "integrations"].includes(id))
      || !["reports", "settings", "roles", "integrations"].includes(id);
    return [id, Boolean(allowed)];
  }));
  const documents = Object.fromEntries(ROLE_DOCUMENT_PERMISSIONS.map(([key]) => {
    const allowed = admin
      || ["salesInvoice", "purchase", "productCard", "productEdit", "clientCard", "clientEdit", "marketplacePublication"].includes(key)
      || (key === "marketplaceOrder" && (roleItem.canChangePrices || roleItem.canApproveCredit || warehouseLead || logistic))
      || (key === "marketplaceStatus" && (roleItem.canApproveCredit || warehouseLead || logistic))
      || (key === "deliveryTracking" && (warehouseLead || logistic))
      || (key === "paymentTracking" && roleItem.canApproveCredit)
      || (warehouseLead && ["purchase", "serialCorrection", "responsibleShipment", "b2bShipmentRequest"].includes(key))
      || (["payment", "payable", "b2bSaleReport", "responsibleShipment", "b2bShipmentRequest"].includes(key) && roleItem.canApproveCredit)
      || (key === "expense" && roleItem.canViewReports)
      || (key === "serialCorrection" && roleItem.canSellWeapon)
      || (key === "settingsDocument" && roleItem.canEditSettings);
    return [key, Boolean(allowed)];
  }));
  const posted = Object.fromEntries(ROLE_POSTED_DOCUMENT_PERMISSIONS.map(([key]) => {
    const allowed = admin
      || (roleItem.canEditClosedDay && ["salesInvoice", "purchase", "payment", "expense", "payable"].includes(key));
    return [key, Boolean(allowed)];
  }));
  const fields = Object.fromEntries(ROLE_FIELD_PERMISSIONS.map(([key]) => {
    const allowed = admin
      || !["price", "discount", "cost", "accounting", "permit", "serials", "payment", "due", "marketplace", "marketplaceStatus", "deliveryTracking", "paymentTracking"].includes(key)
      || (["price", "discount"].includes(key) && roleItem.canChangePrices)
      || (["permit", "serials"].includes(key) && roleItem.canSellWeapon)
      || (key === "accounting" && roleItem.canExportAccounting)
      || (["payment", "due"].includes(key) && roleItem.canApproveCredit)
      || (key === "marketplace" && (roleItem.canEditSettings || roleItem.canChangePrices || logistic))
      || (["marketplaceStatus", "deliveryTracking"].includes(key) && (warehouseLead || logistic))
      || (key === "paymentTracking" && roleItem.canApproveCredit);
    return [key, Boolean(allowed)];
  }));
  return { views, documents, posted, fields };
}

function normalizeRole(roleItem) {
  const base = {
    canEditClosedDay: false,
    canSellWeapon: false,
    canChangePrices: false,
    canExportAccounting: false,
    canApproveCredit: false,
    canManageUsers: false,
    canViewReports: false,
    canEditSettings: false,
    canPrint: false,
    ...roleItem
  };
  const defaults = defaultRoleAccess(base);
  base.access = {
    views: { ...defaults.views, ...(roleItem.access?.views || {}) },
    documents: { ...defaults.documents, ...(roleItem.access?.documents || {}) },
    posted: { ...defaults.posted, ...(roleItem.access?.posted || {}) },
    fields: { ...defaults.fields, ...(roleItem.access?.fields || {}) }
  };
  return base;
}

function defaultEmployeeLogin(employee, index) {
  if (employee.login) return employee.login;
  if (index === 0 || employee.roleName === "Адміністратор" || employee.roleName === "РђРґРјС–РЅС–СЃС‚СЂР°С‚РѕСЂ") return "admin";
  return employee.id || `emp-${String(index + 1).padStart(3, "0")}`;
}

function defaultClientLogin(client, index) {
  if (client.portalLogin) return client.portalLogin;
  if (client.id === "c-001") return "tactic";
  if (client.id === "c-002") return "strilets";
  if (client.edrpou) return client.edrpou;
  if (client.email) return client.email.split("@")[0];
  return client.id || `client-${String(index + 1).padStart(3, "0")}`;
}

function normalizeExchangeRates(rates) {
  const fallback = { UAH: 40.2, USD: 1, EUR: 0.92 };
  const next = { ...fallback, ...(rates || {}) };
  const uah = Number(next.UAH || 0);
  const usd = Number(next.USD || 0);
  const eur = Number(next.EUR || 0);
  if (uah === 1 && usd > 5 && eur > 5) {
    next.UAH = usd;
    next.USD = 1;
    next.EUR = usd / eur;
  }
  Object.keys(next).forEach((currency) => {
    const value = Number(next[currency]);
    next[currency] = Number.isFinite(value) && value > 0 ? value : (fallback[currency] || 1);
  });
  return next;
}

function rateUnits(currency, rates) {
  const value = Number((rates || {})[currency]);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function convertMoneyWithRates(amount, fromCurrency = "UAH", toCurrency = "UAH", rates = {}) {
  return Number(amount || 0) / rateUnits(fromCurrency, rates) * rateUnits(toCurrency, rates);
}

function uahRateWithRates(currency, rates = {}) {
  return convertMoneyWithRates(1, currency, "UAH", rates);
}

function paymentAmountInInvoiceCurrency(payment, invoiceCurrency, rates = {}) {
  const amount = Number(payment.amount || 0);
  const customRate = Number(payment.rate || 0);
  if (payment.rateMode === "uah-per-unit" && customRate > 0) {
    return convertMoneyWithRates(amount * customRate, "UAH", invoiceCurrency, rates);
  }
  return convertMoneyWithRates(amount, payment.currency, invoiceCurrency, rates);
}

function normalizePaymentRates(next) {
  (next.payments || []).forEach((payment) => {
    const invoice = (next.invoices || []).find((item) => item.id === payment.invoiceId);
    payment.clientId = payment.clientId || invoice?.clientId || "";
    payment.firmId = payment.firmId || invoice?.firmId || "";
    payment.source = payment.source || (payment.method === "Банк" || payment.method === "Безготівка" || payment.method === "Банк API" ? "bank" : "cash");
    payment.paymentKind = payment.paymentKind || (payment.invoiceId ? "invoice" : "advance");
    payment.advance = payment.advance === true || !payment.invoiceId;
    payment.terminalId = payment.terminalId || "";
    payment.prro = payment.prro === true;
    if (payment.rateMode) return;
    const rate = Number(payment.rate || 0);
    if (payment.currency === "UAH") {
      payment.rate = 1;
      payment.rateMode = "uah-per-unit";
    } else if (rate > 0 && Math.abs(rate - 1) > 0.0001) {
      payment.rateMode = "uah-per-unit";
    } else {
      payment.rate = uahRateWithRates(payment.currency, next.settings.rates);
      payment.rateMode = "settings";
    }
  });
}

function recalculateInvoicePayments(next) {
  (next.invoices || []).forEach((invoice) => {
    const payments = (next.payments || []).filter((payment) => payment.invoiceId === invoice.id);
    if (!payments.length) return;
    const paid = payments.reduce((sum, payment) => (
      sum + paymentAmountInInvoiceCurrency(payment, invoice.currency, next.settings.rates)
    ), 0);
    invoice.paid = Math.min(Number(invoice.total || 0), paid);
    invoice.status = invoicePostStatus(invoice);
  });
}

function normalizeMarketplaceOrder(order) {
  const date = order.date || order.dates?.created || today;
  const qty = Number(order.qty || 1);
  const price = parseDecimal(order.price, 0);
  let status = order.status || "new_order";
  if (status === "invoiced") status = "sent_to_warehouse";
  const paymentStatus = status === "paid" || order.payment?.status === "paid" ? "paid" : order.payment?.status || "expected";
  if (paymentStatus === "paid") status = "paid";

  const dates = {
    created: date,
    agreed: "",
    warehouse: "",
    delivery: "",
    delivered: "",
    paid: "",
    ...(order.dates || {})
  };
  if (["agreed", "sent_to_warehouse", "sent_to_delivery", "delivered", "paid"].includes(status) && !dates.agreed) dates.agreed = date;
  if (["sent_to_warehouse", "sent_to_delivery", "delivered", "paid"].includes(status) && !dates.warehouse) dates.warehouse = date;
  if (["sent_to_delivery", "delivered", "paid"].includes(status) && !dates.delivery) dates.delivery = date;
  if (["delivered", "paid"].includes(status) && !dates.delivered) dates.delivered = date;
  if (status === "paid" && !dates.paid) dates.paid = order.payment?.paidAt || today;

  const deliveryStatus = order.delivery?.status || (status === "delivered" || status === "paid" ? "delivered" : status === "sent_to_delivery" ? "sent_to_delivery" : "new");
  const payment = {
    method: "Маркетплейс",
    amount: price * qty,
    source: `${order.marketplace || "Marketplace"}Pay`,
    apiStatus: paymentStatus === "paid" ? "Оплата підтверджена API" : "Очікує підтягування оплати",
    lastCheck: "",
    paidAt: "",
    ...(order.payment || {}),
    status: paymentStatus
  };
  return {
    ...order,
    date,
    status,
    dates,
    warehouseStatus: order.warehouseStatus || (["sent_to_warehouse", "sent_to_delivery", "delivered", "paid"].includes(status) ? "reserved" : "new"),
    buyer: {
      name: "",
      phone: "",
      email: "",
      edrpou: "",
      address: "",
      ...(order.buyer || {})
    },
    delivery: {
      service: "",
      city: "",
      warehouse: "",
      ttn: "",
      status: deliveryStatus,
      apiStatus: deliveryStatus === "delivered" ? "Вручено отримувачу" : deliveryStatus === "sent_to_delivery" ? "У дорозі" : "Очікує ТТН",
      lastCheck: "",
      ...(order.delivery || {})
    },
    payment
  };
}

function normalizeState(loaded) {
  const next = { ...clone(seedState), ...loaded };
  next.settings = { ...clone(seedState.settings), ...(loaded.settings || {}) };
  next.settings.rates = normalizeExchangeRates(next.settings.rates);
  next.settings.priceTypes = normalizePriceTypes(next.settings.priceTypes);
  const loadedRoles = loaded.roles && loaded.roles.length ? loaded.roles : [];
  const roles = loadedRoles.length
    ? [...loadedRoles, ...seedState.roles.filter((seedRole) => !loadedRoles.some((loadedRole) => loadedRole.name === seedRole.name))]
    : seedState.roles;
  next.roles = roles.map(normalizeRole);
  const loadedEmployees = loaded.employees && loaded.employees.length ? loaded.employees : null;
  const generatedEmployees = (loaded.managers || seedState.managers).map((name, index) => ({
      id: `emp-${String(index + 1).padStart(3, "0")}`,
      name,
      roleName: index === 0 ? "Адміністратор" : "Менеджер магазину",
      department: index === 0 ? "Адміністрація" : "Продажі",
      phone: "",
      email: "",
      active: true
    }));
  const employees = loadedEmployees
    ? [...loadedEmployees, ...seedState.employees.filter((seedEmployee) => !loadedEmployees.some((employee) => employee.id === seedEmployee.id || employee.name === seedEmployee.name))]
    : generatedEmployees;
  next.employees = employees.map((employee, index) => ({
    department: "Продажі",
    phone: "",
    email: "",
    active: true,
    ...employee,
    roleName: employee.id === "emp-004" && employee.department === "Склад" && employee.roleName === "Менеджер магазину" ? "Зав склад" : employee.roleName,
    login: defaultEmployeeLogin(employee, index),
    password: employee.password || (index === 0 ? "admin" : "1234")
  }));
  next.currentEmployeeId = loaded.currentEmployeeId || next.employees[0]?.id || "emp-001";
  const activeEmployee = next.employees.find((employee) => employee.id === next.currentEmployeeId) || next.employees[0];
  next.currentManager = activeEmployee?.name || loaded.currentManager || "Адміністратор";
  next.currentRole = activeEmployee?.roleName || loaded.currentRole || "Адміністратор";
  next.managers = next.employees.filter((employee) => employee.active).map((employee) => employee.name);
  next.warehouses = (loaded.warehouses || seedState.warehouses).map((warehouse) => ({
    clientId: "",
    ...warehouse
  }));
  next.settings.suppliers = (loaded.settings?.suppliers && loaded.settings.suppliers.length)
    ? loaded.settings.suppliers.map((supplier) => ({ edrpou: "", phone: "", email: "", ...supplier }))
    : seedState.settings.suppliers;
  next.settings.paymentTerminals = (loaded.settings?.paymentTerminals && loaded.settings.paymentTerminals.length)
    ? loaded.settings.paymentTerminals.map((terminal) => ({ provider: "", firmId: next.settings.firms[0]?.id || "", ...terminal }))
    : seedState.settings.paymentTerminals;
  next.settings.productDictionaries = {
    ...clone(seedState.settings.productDictionaries),
    ...(loaded.settings?.productDictionaries || {})
  };
  next.settings.catalogParameters = normalizeCatalogParameters(next.settings);
  next.settings.variantDictionaries = normalizeVariantDictionaries(next.settings);
  syncLegacyVariantDictionaries(next.settings);
  next.clients = (loaded.clients || seedState.clients).map((client, index) => ({
    edrpou: "",
    phone: "",
    email: "",
    priceType: "Роздріб",
    currency: "UAH",
    taxMode: "без ПДВ",
    responsibleStorage: false,
    address: "",
    ...client
  })).map((client, index) => {
    const priceType = next.settings.priceTypes.find((item) => item.id === client.priceType || item.name === client.priceType);
    client.priceType = priceType?.id || next.settings.priceTypes.find((item) => item.kind !== "cost" && item.active !== false)?.id || client.priceType;
    client.portalLogin = defaultClientLogin(client, index);
    client.portalPassword = client.portalPassword || (client.id === "c-001" ? "tactic" : client.id === "c-002" ? "strilets" : "1234");
    return client;
  });
  next.products = (loaded.products || seedState.products).map((product) => ({
    category: product.type === "weapon" ? "Зброя" : "Аксесуари",
    unit: "шт",
    minStock: 0,
    leadTimeDays: 14,
    description: "",
    catalogTag: "",
    photos: [],
    ...product
  })).map((product) => {
    product.prices = normalizeProductPrices(product, next.settings.priceTypes);
    const retail = product.prices.retail || Object.values(product.prices)[0] || {};
    product.price = parseDecimal(retail.amount ?? product.price, 0);
    product.currency = retail.currency || product.currency || "UAH";
    return product;
  });
  seedProductDictionaries(next);
  syncCatalogParametersFromProducts(next);
  const purchaseRows = loaded.purchases || seedState.purchases;
  next.serials = (loaded.serials || seedState.serials).map((serial) => ({
    actual: true,
    basSynced: false,
    purchaseId: "",
    ...serial,
    firmId: serial.firmId || purchaseRows.find((purchase) => purchase.id === serial.purchaseId)?.firmId || "vat"
  }));
  const invoiceRows = loaded.invoices || seedState.invoices;
  next.invoices = invoiceRows.map((invoice) => {
    const normalized = {
      lines: [],
      deliveryPayer: "",
      pendingPaid: 0,
      requestIds: [],
      ...invoice,
      posted: invoice.posted === false ? false : true,
      storageShipment: invoice.storageShipment === true
    };
    if (normalized.posted !== false && normalized.status === "draft") {
      normalized.status = Number(normalized.paid || 0) > 0 ? "partial" : "payment_expected";
    }
    if (normalized.posted === false) {
      normalized.status = "draft";
      normalized.draftKey = normalized.draftKey || invoiceDraftKey(normalized);
    }
    return normalized;
  });
  next.invoices.forEach((invoice) => {
    (invoice.lines || []).forEach((line) => {
      if (!line.serialId) return;
      const serial = next.serials.find((item) => item.id === line.serialId);
      if (serial && invoice.posted !== false && invoice.status !== "cancelled") {
        serial.status = "sold";
        serial.clientId = invoice.clientId;
        serial.permitNumber = line.permitNumber || serial.permitNumber || "";
        serial.permitDate = line.permitDate || serial.permitDate || "";
      }
    });
  });
  next.expenses = loaded.expenses || seedState.expenses;
  next.payables = loaded.payables || seedState.payables;
  next.purchases = purchaseRows;
  next.stock = normalizeStockRows(loaded.stock || seedState.stock, next);
  next.responsibleStorageDocs = loaded.responsibleStorageDocs || seedState.responsibleStorageDocs;
  next.b2bShipmentRequests = (loaded.b2bShipmentRequests || seedState.b2bShipmentRequests || []).map((request, index) => ({
    id: request.id || `req-${String(index + 1).padStart(3, "0")}`,
    date: request.date || today,
    desiredDate: request.desiredDate || "",
    clientId: request.clientId || "",
    productId: request.productId || "",
    qty: Number(request.qty || 1),
    status: request.status || "request_new",
    manager: request.manager || "",
    comment: request.comment || "",
    firmId: request.firmId || "",
    warehouseId: request.warehouseId || "",
    serialIds: Array.isArray(request.serialIds) ? request.serialIds : [],
    price: request.price || "",
    currency: request.currency || "",
    paymentDays: request.paymentDays || "",
    delivery: request.delivery || "",
    ttn: request.ttn || "",
    responsibleDocId: request.responsibleDocId || "",
    validation: Array.isArray(request.validation) ? request.validation : []
  }));
  next.salesPlans = loaded.salesPlans || seedState.salesPlans;
  next.marketplaceStats = loaded.marketplaceStats || seedState.marketplaceStats;
  next.marketplacePublications = loaded.marketplacePublications || seedState.marketplacePublications;
  next.marketplaceOrders = (loaded.marketplaceOrders || seedState.marketplaceOrders).map(normalizeMarketplaceOrder);
  next.reportBuilder = { ...clone(seedState.reportBuilder), ...(loaded.reportBuilder || {}) };
  next.periodFilters = { ...clone(seedState.periodFilters), ...(loaded.periodFilters || {}) };
  next.marketplaceOrderFilters = { ...clone(seedState.marketplaceOrderFilters), ...(loaded.marketplaceOrderFilters || {}) };
  next.marketplacePublicationFilters = { ...clone(seedState.marketplacePublicationFilters), ...(loaded.marketplacePublicationFilters || {}) };
  next.b2bShipmentRequestFilters = { ...clone(seedState.b2bShipmentRequestFilters), ...(loaded.b2bShipmentRequestFilters || {}) };
  next.b2bResponsibleStorageFilters = { ...clone(seedState.b2bResponsibleStorageFilters), ...(loaded.b2bResponsibleStorageFilters || {}) };
  next.rozetkaImportedOrderFilters = { ...clone(seedState.rozetkaImportedOrderFilters), ...(loaded.rozetkaImportedOrderFilters || {}) };
  next.rozetkaInbound = { ...clone(seedState.rozetkaInbound), ...(loaded.rozetkaInbound || {}) };
  next.inventoryFilters = { ...clone(seedState.inventoryFilters), ...(loaded.inventoryFilters || {}) };
  normalizePaymentRates(next);
  recalculateInvoicePayments(next);
  return next;
}

function seedProductDictionaries(next) {
  const dictionaries = next.settings.productDictionaries;
  const map = {
    categories: "category",
    units: "unit",
    brands: "brand",
    models: "model",
    calibers: "caliber",
    uktzed: "uktzed",
    supplierSkus: "supplierSku",
    internalCodes: "internalCode"
  };
  Object.entries(map).forEach(([key, productField]) => {
    dictionaries[key] = uniqueList([...(dictionaries[key] || []), ...next.products.map((product) => product[productField]).filter(Boolean)]);
  });
}

function syncCatalogParametersFromProducts(next) {
  next.settings.catalogParameters = normalizeCatalogParameters(next.settings);
  [
    ["brands", "brand"],
    ["categories", "category"],
    ["calibers", "caliber"],
    ["catalogTags", "catalogTag"]
  ].forEach(([key, productField]) => {
    const existing = next.settings.catalogParameters[key] || [];
    const values = uniqueList([
      ...existing.map((entry) => entry.value || entry.name),
      ...next.products.map((product) => product[productField]).filter(Boolean)
    ]);
    next.settings.catalogParameters[key] = values.map((value, index) => {
      const previous = existing.find((entry) => String(entry.value || entry.name).trim().toLowerCase() === String(value).trim().toLowerCase());
      return previous || normalizeCatalogParameterEntry(value, key, index);
    });
  });
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Cannot save state", error);
  }
}

function byId(list, id) {
  return list.find((item) => item.id === id);
}

function productName(id) {
  const product = byId(state.products, id);
  return product ? `${product.brand} ${product.model}` : "Невідомий товар";
}

function clientName(id) {
  const client = byId(state.clients, id);
  return client ? client.name : "Невідомий клієнт";
}

function invoiceDebt(invoice) {
  return Math.max(Number(invoice?.total || 0) - Number(invoice?.paid || 0), 0);
}

function openPaymentInvoices() {
  return state.invoices.filter((invoice) => invoiceDebt(invoice) > 0);
}

function paymentClients(kind = "invoice") {
  if (kind === "advance") return state.clients;
  const clientIds = new Set(openPaymentInvoices().map((invoice) => invoice.clientId));
  return state.clients.filter((client) => clientIds.has(client.id));
}

function paymentSourceLabel(source) {
  if (source === "bank") return "Банк";
  if (source === "card") return "Картка";
  return "Готівкова каса";
}

function paymentMethodFromSource(source) {
  if (source === "bank") return "Банк";
  if (source === "card") return "Картка";
  return "Каса";
}

function paymentTerminalsForFirm(firmId = "") {
  const terminals = state.settings.paymentTerminals || [];
  return terminals.filter((terminal) => !firmId || terminal.firmId === firmId);
}

function terminalName(id) {
  const terminal = byId(state.settings.paymentTerminals || [], id);
  return terminal ? terminal.name : "-";
}

function resolvePaymentDraft() {
  const kind = paymentDraft.kind === "advance" ? "advance" : "invoice";
  const clients = paymentClients(kind);
  const source = ["cash", "bank", "card"].includes(paymentDraft.source) ? paymentDraft.source : "cash";
  const clientId = clients.some((client) => client.id === paymentDraft.clientId)
    ? paymentDraft.clientId
    : (clients[0]?.id || "");
  const invoices = openPaymentInvoices().filter((invoice) => !clientId || invoice.clientId === clientId);
  const invoiceId = kind === "advance" ? "" : invoices.some((invoice) => invoice.id === paymentDraft.invoiceId)
    ? paymentDraft.invoiceId
    : (invoices[0]?.id || "");
  const invoice = byId(state.invoices, invoiceId);
  const firmId = state.settings.firms.some((firm) => firm.id === paymentDraft.firmId)
    ? paymentDraft.firmId
    : (invoice?.firmId || state.settings.firms[0]?.id || "");
  const terminals = paymentTerminalsForFirm(firmId);
  const terminalId = terminals.some((terminal) => terminal.id === paymentDraft.terminalId)
    ? paymentDraft.terminalId
    : (terminals[0]?.id || "");
  const prro = paymentDraft.prro === "false" ? "false" : "true";
  return { source, kind, clientId, invoiceId, firmId, terminalId, prro };
}

function paymentInvoiceOptions(invoices, selectedId) {
  if (!invoices.length) return '<option value="">Немає накладних з боргом</option>';
  return invoices.map((invoice) => option(
    invoice.id,
    `${invoice.id} · борг ${formatMoney(invoiceDebt(invoice), invoice.currency)} · сума ${formatMoney(invoice.total, invoice.currency)}`,
    invoice.id === selectedId
  )).join("");
}

function warehouseName(id) {
  const warehouse = byId(state.warehouses, id);
  return warehouse ? warehouse.name : "Невідомий склад";
}

function firmName(id) {
  const firm = byId(state.settings.firms, id);
  return firm ? firm.name : "Невідома фірма";
}

function currentEmployee() {
  return state.employees.find((employee) => employee.id === state.currentEmployeeId) || state.employees[0];
}

function authenticatedEmployee() {
  return state.employees.find((employee) => employee.id === authEmployeeId && employee.active !== false);
}

function isAuthenticated() {
  return authMode === "employee" && Boolean(authenticatedEmployee());
}

function authenticatedClient() {
  return state.clients.find((client) => (
    client.id === authClientId
    && client.type === "B2B"
    && client.cabinetEnabled !== false
  ));
}

function isClientAuthenticated() {
  return authMode === "client" && Boolean(authenticatedClient());
}

function activateEmployeeSession(employee) {
  authEmployeeId = employee.id;
  authClientId = "";
  authMode = "employee";
  sessionStorage.setItem("arms-crm-auth-employee-id", employee.id);
  sessionStorage.removeItem("arms-crm-auth-client-id");
  sessionStorage.setItem("arms-crm-auth-mode", "employee");
  state.currentEmployeeId = employee.id;
  state.currentManager = employee.name;
  state.currentRole = employee.roleName;
}

function activateClientSession(client) {
  authClientId = client.id;
  authEmployeeId = "";
  authMode = "client";
  sessionStorage.setItem("arms-crm-auth-client-id", client.id);
  sessionStorage.removeItem("arms-crm-auth-employee-id");
  sessionStorage.setItem("arms-crm-auth-mode", "client");
}

function role() {
  const employee = currentEmployee();
  const roleName = employee?.roleName || state.currentRole;
  return state.roles.find((item) => item.name === roleName) || state.roles[0];
}

function isAdmin() {
  return role().canManageUsers === true || role().name === "Адміністратор";
}

function canAccessView(viewId) {
  return roleHasAdminAccess(role()) || role().access?.views?.[viewId] !== false || viewId === "dashboard";
}

function canCreateDocument(documentKey) {
  return roleHasAdminAccess(role()) || role().access?.documents?.[documentKey] !== false;
}

function canEditPostedDocument(documentKey) {
  return roleHasAdminAccess(role()) || role().access?.posted?.[documentKey] === true;
}

function canEditField(fieldKey) {
  return roleHasAdminAccess(role()) || role().access?.fields?.[fieldKey] !== false;
}

function canPrintDocuments() {
  if (isClientAuthenticated()) {
    const clientRole = state.roles.find((item) => item.name === "B2B клієнт");
    return clientRole?.canPrint === true;
  }
  return roleHasAdminAccess(role()) || role().canPrint === true;
}

function employeeOptions(selectedName = state.currentManager) {
  return state.employees
    .filter((employee) => employee.active)
    .map((employee) => option(employee.name, employee.name, employee.name === selectedName))
    .join("");
}

function supplierOptions(selectedId = "") {
  return [
    ...state.settings.suppliers.map((supplier) => option(supplier.id, supplier.name, supplier.id === selectedId || supplier.name === selectedId)),
    option("__new", "+ Новий постачальник")
  ].join("");
}

function supplierName(idOrName) {
  const supplier = state.settings.suppliers.find((item) => item.id === idOrName || item.name === idOrName);
  return supplier ? supplier.name : idOrName;
}

function dictionaryOptions(key, selected = "") {
  const values = uniqueList(state.settings.productDictionaries?.[key] || []);
  return [
    ...values.map((value) => option(value, value, value === selected)),
    option("__new", "+ Додати нове", selected === "__new")
  ].join("");
}

function dictionaryField(key, label, selectName, newName, config = {}) {
  const className = `field${config.wide ? " wide" : ""}`;
  const required = config.required === false ? "" : "required";
  const placeholder = config.placeholder || "заповніть, якщо обрано + Додати нове";
  return `
    <label class="${className}"><span>${escapeHtml(label)}</span><select name="${escapeHtml(selectName)}" ${required}>${dictionaryOptions(key, config.selected || "")}</select></label>
    <label class="${className}"><span>${escapeHtml(label)}: нове</span><input name="${escapeHtml(newName)}" placeholder="${escapeHtml(placeholder)}"></label>
  `;
}

function resolveDictionaryValue(key, selected, fresh, label, config = {}) {
  const value = String(selected === "__new" ? fresh : selected || "").trim();
  if (config.required !== false && !value) {
    throw new Error(`Заповніть поле "${label}".`);
  }
  if (!value) return "";
  state.settings.productDictionaries[key] = uniqueList([...(state.settings.productDictionaries[key] || []), value]);
  return value;
}

function findProductByCode(code) {
  const normalized = String(code || "").trim().toLowerCase();
  if (!normalized) return null;
  return state.products.find((product) => [product.barcode, product.qrCode, product.supplierSku, product.internalCode]
    .filter(Boolean)
    .some((value) => String(value).trim().toLowerCase() === normalized));
}

function normalizedText(value) {
  return String(value || "").trim().toLowerCase();
}

function invoiceUsesSerial(serialId, options = {}) {
  const includeDrafts = options.includeDrafts === true;
  const excludeInvoiceId = options.excludeInvoiceId || "";
  return state.invoices.some((invoice) => (
    invoice.id !== excludeInvoiceId
    && invoice.status !== "cancelled"
    && (includeDrafts || invoice.posted !== false)
    && invoice.lines.some((line) => line.serialId === serialId || (line.serialIds || []).includes(serialId))
  ));
}

function serialIsSold(serial) {
  return serial.status === "sold" || invoiceUsesSerial(serial.id);
}

function serialIsOnStock(serial) {
  return ["available", "responsible_storage"].includes(serial.status);
}

function serialMatchesProduct(serial, product) {
  if (!serial || !product) return false;
  return serial.productId === product.id;
}

function serialIsSelectable(serial) {
  return serialIsOnStock(serial) && !serialIsSold(serial) && serial.actual !== false && serial.erzStatus === "verified";
}

function serialMatchesStockContext(serial, { warehouseId = "", firmId = "", clientId = "" } = {}) {
  if (warehouseId && serial.warehouseId !== warehouseId) return false;
  if (firmId && (serial.firmId || "vat") !== firmId) return false;
  return (serial.clientId || "") === (clientId || "");
}

function serialStatusText(serial) {
  if (serialIsSold(serial)) return "продано";
  if (serial.actual === false) return "неактуальна";
  if (!serialIsOnStock(serial)) return serial.status || "не на складі";
  if (serial.erzStatus !== "verified") return "ЄРЗ очікує";
  return serial.status === "responsible_storage" ? "відп. зберігання" : "на складі";
}

function serialsForProduct(product) {
  return state.serials
    .filter((serial) => serialMatchesProduct(serial, product))
    .sort((first, second) => Number(serialIsSelectable(second)) - Number(serialIsSelectable(first)) || first.serial.localeCompare(second.serial, "uk"));
}

function serialOption(serial, selectedIds = [], context = {}) {
  const isSelectable = serialIsSelectable(serial) && serialMatchesStockContext(serial, context);
  const isSold = serialIsSold(serial);
  const linkedProduct = byId(state.products, serial.productId);
  const label = `${serial.serial} · ${linkedProduct?.model || "модель"} · ${warehouseName(serial.warehouseId)} · ${firmName(serial.firmId || "vat")} · ${serialStatusText(serial)}`;
  const className = isSelectable ? "serial-available" : isSold ? "serial-sold" : "serial-blocked";
  return `<option value="${escapeHtml(serial.id)}" ${selectedIds.includes(serial.id) ? "selected" : ""} ${isSelectable ? "" : "disabled"} class="${className}">${escapeHtml(label)}</option>`;
}

function validateScannedCode(code, product) {
  const normalized = String(code || "").trim();
  if (!normalized) return "QR або штрихкод обов'язковий.";
  if (!product.barcode && !product.qrCode) return "У картці товару немає QR/штрихкоду. Створіть його в товарі або внесіть у приході.";
  const allowed = [product.barcode, product.qrCode].filter(Boolean).map((value) => String(value).trim().toLowerCase());
  if (!allowed.includes(normalized.toLowerCase())) {
    return `QR/штрихкод не відповідає вибраній позиції ${product.brand} ${product.model}.`;
  }
  return "";
}

function generateEan13(prefix = "482") {
  const base = `${prefix}${String(Date.now()).slice(-8)}${Math.floor(Math.random() * 10)}`.slice(0, 12);
  const sum = base.split("").reduce((total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 1 : 3), 0);
  const checksum = (10 - (sum % 10)) % 10;
  return `${base}${checksum}`;
}

function fileToMarketplacePhoto(file) {
  if (!MARKETPLACE_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`Фото "${file.name}" має бути JPG/JPEG або PNG.`);
  }
  if (file.size > MAX_PRODUCT_PHOTO_BYTES) {
    throw new Error(`Фото "${file.name}" більше 8 МБ. Оберіть менший файл.`);
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      const scale = Math.min(1, PRODUCT_PHOTO_MAX_SIDE / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      context.fillStyle = "#fff";
      context.fillRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve({
        id: uniqueId("photo"),
        name: file.name,
        type: "image/jpeg",
        format: "JPG",
        originalType: file.type,
        originalSize: file.size,
        width,
        height,
        dataUrl: canvas.toDataURL("image/jpeg", PRODUCT_PHOTO_JPEG_QUALITY)
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Не вдалося прочитати фото "${file.name}".`));
    };
    image.src = url;
  });
}

async function handleProductPhotos(input) {
  const files = Array.from(input.files || []);
  if (!files.length) return;
  if (productImagesDraft.length + files.length > MAX_PRODUCT_PHOTOS) {
    input.value = "";
    alert(`Можна додати максимум ${MAX_PRODUCT_PHOTOS} фото до одного товару.`);
    return;
  }
  try {
    const photos = [];
    for (const file of files) {
      photos.push(await fileToMarketplacePhoto(file));
    }
    productImagesDraft = [...productImagesDraft, ...photos].slice(0, MAX_PRODUCT_PHOTOS);
    renderProductPhotoPreview(input.closest("form") || document);
  } catch (error) {
    alert(error.message);
  } finally {
    input.value = "";
  }
}

function renderProductPhotoPreview(root = document) {
  const preview = $("[data-product-photo-preview]", root) || $("#product-photo-preview");
  if (!preview) return;
  if (!productImagesDraft.length) {
    preview.innerHTML = '<div class="photo-empty">Фото ще не додані. Дозволено до 6 файлів JPG/JPEG або PNG.</div>';
    return;
  }
  preview.innerHTML = productImagesDraft.map((photo, index) => `
    <figure class="photo-thumb">
      <img src="${escapeHtml(photo.dataUrl)}" alt="${escapeHtml(photo.name)}">
      <figcaption>
        <strong>${index + 1}. ${escapeHtml(photo.name)}</strong>
        <span>${photo.format} · ${photo.width}×${photo.height}</span>
      </figcaption>
      <button class="icon-button danger photo-remove" type="button" data-remove-product-photo="${escapeHtml(photo.id)}" title="Видалити фото" aria-label="Видалити фото" ${canEditField("productRequisites") ? "" : "disabled"}>×</button>
    </figure>
  `).join("");
  }

  function rozetkaImageUrl(url) {
    const value = String(url || "").trim();
    if (!value || value.includes("no-image")) return "";
    return `/api/rozetka/image?url=${encodeURIComponent(value)}`;
  }

  function productPhotoSrc(photo) {
    if (!photo) return "";
    if (typeof photo === "string") return rozetkaImageUrl(photo);
    if (photo.dataUrl) return photo.dataUrl;
    if (photo.url) return rozetkaImageUrl(photo.url);
    return "";
  }

  function productPhotoName(photo, fallback = "Фото товару") {
    if (!photo || typeof photo === "string") return fallback;
    return photo.name || fallback;
  }

  function productPhotoThumbs(product) {
    const photos = (product.photos || []).filter((photo) => productPhotoSrc(photo));
    if (!photos.length) return '<span class="small muted">немає</span>';
    return `
      <div class="product-photo-stack">
        ${photos.slice(0, 3).map((photo) => `<img src="${escapeHtml(productPhotoSrc(photo))}" alt="${escapeHtml(productPhotoName(photo, product.model))}" loading="lazy">`).join("")}
        ${photos.length > 3 ? `<span class="photo-count">+${photos.length - 3}</span>` : ""}
      </div>
    `;
  }

  function productCatalogPhoto(product) {
    const photos = (product.photos || []).filter((photo) => productPhotoSrc(photo));
  if (photos.length) {
      return `
        <div class="catalog-photo">
          <img src="${escapeHtml(productPhotoSrc(photos[0]))}" alt="${escapeHtml(productPhotoName(photos[0], product.model))}" loading="lazy">
        </div>
        ${photos.length > 1 ? `
          <div class="catalog-photo-strip">
            ${photos.slice(1, 6).map((photo) => `<img src="${escapeHtml(productPhotoSrc(photo))}" alt="${escapeHtml(productPhotoName(photo, product.model))}" loading="lazy">`).join("")}
          </div>
        ` : ""}
      `;
  }
  const initials = `${String(product.brand || "AC").slice(0, 1)}${String(product.model || "CRM").slice(0, 1)}`.toUpperCase();
  return `<div class="catalog-photo catalog-photo-placeholder"><span>${escapeHtml(initials)}</span></div>`;
}

function productCatalogSpecs(product) {
  const rows = [
    ["Тип", product.type === "weapon" ? "Зброя" : "Звичайний товар"],
    ["Бренд", product.brand],
    ["Модель", product.model],
    ["Категорія", product.category],
    ["Одиниця", product.unit],
    ["Калібр", product.caliber],
    ["ЄРЗ", product.erzRequired ? "потрібна перевірка" : "не потрібна"],
    ["QR / штрихкод", product.barcode || product.qrCode],
    ["Артикул постач.", product.supplierSku],
    ["Внутр. код", product.internalCode],
    ["УКТЗЕД", product.uktzed],
    ["Каталог", product.catalogTag],
    ["SKU маркетплейсу", product.marketplaceSku]
  ];
  return rows
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim())
    .map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`)
    .join("");
}

function b2bCatalogPrice(product, client) {
  return productSalePrice(product, client.priceType);
}

function b2bCatalogPriceUah(product, client) {
  const price = b2bCatalogPrice(product, client);
  return uah(price.amount, price.currency);
}

function filterB2BCatalogProducts(products, client) {
  const filters = { ...defaultClientCatalogFilters(), ...clientCatalogFilters };
  const filtered = products.filter((product) => (
    (!filters.type || product.type === filters.type)
    && (!filters.brand || product.brand === filters.brand)
    && (!filters.category || product.category === filters.category)
    && (!filters.caliber || (product.caliber || "без калібру") === filters.caliber)
    && (!filters.catalogTag || product.catalogTag === filters.catalogTag)
  ));
  return filtered.sort((first, second) => {
    if (filters.sort === "price_asc" || filters.sort === "price_desc") {
      const priceDelta = b2bCatalogPriceUah(first, client) - b2bCatalogPriceUah(second, client);
      return filters.sort === "price_desc" ? -priceDelta : priceDelta;
    }
    return `${first.brand} ${first.model}`.localeCompare(`${second.brand} ${second.model}`, "uk");
  });
}

function renderB2BCatalogFilters(allProducts, products) {
  const filters = { ...defaultClientCatalogFilters(), ...clientCatalogFilters };
  return `
    <form class="catalog-filter-bar no-print" data-client-catalog-filters>
      <label class="field"><span>Тип</span><select name="type" data-client-catalog-filter>${catalogParameterOptions("productTypes", filters.type, "Усі типи")}</select></label>
      <label class="field"><span>Бренд</span><select name="brand" data-client-catalog-filter>${catalogParameterOptions("brands", filters.brand, "Усі бренди")}</select></label>
      <label class="field"><span>Категорія</span><select name="category" data-client-catalog-filter>${catalogParameterOptions("categories", filters.category, "Усі категорії")}</select></label>
      <label class="field"><span>Калібр</span><select name="caliber" data-client-catalog-filter>${catalogParameterOptions("calibers", filters.caliber, "Усі калібри")}</select></label>
      <label class="field"><span>Акція / розпродаж</span><select name="catalogTag" data-client-catalog-filter>${catalogParameterOptions("catalogTags", filters.catalogTag, "Усі позиції")}</select></label>
      <label class="field"><span>Сортування</span><select name="sort" data-client-catalog-filter>
        ${option("name", "За назвою", filters.sort === "name")}
        ${option("price_asc", "Від найдешевших", filters.sort === "price_asc")}
        ${option("price_desc", "Від найдорожчих", filters.sort === "price_desc")}
      </select></label>
      <button class="ghost" type="button" data-reset-client-catalog-filters>Скинути відбір</button>
      <span class="pill info">${products.length} із ${allProducts.length} позицій</span>
    </form>
  `;
}

function b2bShipmentRequestPrice(request, client) {
  const product = byId(state.products, request.productId);
  const fallback = product ? productSalePrice(product, client.priceType) : { amount: 0, currency: client.currency || "UAH" };
  const hasManagerPrice = request.price !== "" && request.price !== undefined && request.price !== null;
  return {
    amount: hasManagerPrice ? parseDecimal(request.price, fallback.amount) : fallback.amount,
    currency: request.currency || fallback.currency || client.currency || "UAH"
  };
}

function b2bShipmentRequestLineTotal(request, client) {
  const price = b2bShipmentRequestPrice(request, client);
  return {
    amount: Math.round(Number(request.qty || 0) * price.amount * 100) / 100,
    currency: price.currency
  };
}

function b2bShipmentRequestTotals(requests, client) {
  const totals = new Map();
  requests
    .filter((request) => !["request_rejected", "request_cancelled"].includes(request.status))
    .forEach((request) => {
      const total = b2bShipmentRequestLineTotal(request, client);
      totals.set(total.currency, Math.round(((totals.get(total.currency) || 0) + total.amount) * 100) / 100);
    });
  return totals;
}

function formatCurrencyTotals(totals, fallbackCurrency = "UAH") {
  const entries = Array.from(totals.entries()).filter(([, amount]) => Number(amount || 0) !== 0);
  if (!entries.length) return formatMoney(0, fallbackCurrency);
  return entries.map(([currency, amount]) => formatMoney(amount, currency)).join(" + ");
}

function canManageB2BClientRequest(request) {
  if (!request || ["request_approved", "request_rejected", "request_cancelled"].includes(request.status)) return false;
  if (isClientAuthenticated()) return request.clientId === authClientId && request.status === "request_draft";
  return canCreateDocument("b2bShipmentRequest");
}

function renderB2BRequestCatalogCard(product, client) {
  const price = productSalePrice(product, client.priceType);
  const openRequest = findOpenB2BShipmentRequest(client.id, product.id, today, ["request_draft"]);
  const openQty = openRequest ? Number(openRequest.qty || 0) : 0;
  return `
    <article class="catalog-card">
      <div class="catalog-media">
        ${productCatalogPhoto(product)}
        <div class="catalog-badges">
          <span class="pill ${product.type === "weapon" ? "danger" : "good"}">${product.type === "weapon" ? "зброя" : "товар"}</span>
          ${product.erzRequired ? '<span class="pill info">ЄРЗ</span>' : ""}
          ${product.catalogTag ? `<span class="pill warn">${escapeHtml(product.catalogTag)}</span>` : ""}
          ${product.photos?.length ? `<span class="pill good">${product.photos.length} фото</span>` : '<span class="pill warn">фото немає</span>'}
        </div>
      </div>
      <div class="catalog-card-body">
        <div class="catalog-title">
          <h3>${escapeHtml(product.brand)} ${escapeHtml(product.model)}</h3>
          <strong>${formatMoney(price.amount, price.currency)}</strong>
          <span>${escapeHtml(price.priceTypeName || priceTypeName(client.priceType))}</span>
        </div>
        <p class="catalog-description">${escapeHtml(product.description || product.category || "Опис ще не заповнений у картці товару.")}</p>
        <dl class="catalog-specs">${productCatalogSpecs(product)}</dl>
        <form class="catalog-request-form" data-action="create-b2b-shipment-request">
          <input type="hidden" name="clientId" value="${escapeHtml(client.id)}">
          <input type="hidden" name="manager" value="${escapeHtml(client.manager || "")}">
          <input type="hidden" name="date" value="${today}">
          <input type="hidden" name="productId" value="${escapeHtml(product.id)}">
          <label class="field"><span>Кількість</span><input name="qty" type="number" min="1" value="1"></label>
          <label class="field"><span>Бажана дата</span><input name="desiredDate" type="date" value="${today}"></label>
          ${openQty ? `<div class="catalog-open-request"><span class="pill warn">у кошику ${openQty} од.</span></div>` : ""}
          <label class="field catalog-comment"><span>Коментар</span><input name="comment" placeholder="побажання по доставці або умовах"></label>
          <button class="primary" type="submit">${openQty ? "Додати в кошик" : "У кошик"}</button>
        </form>
      </div>
    </article>
  `;
}

function renderClientB2BRequestRows(requests, client, config = {}) {
  const showActions = config.showActions === true;
  const emptyText = config.emptyText || "Заявок за вибраний період немає.";
  const colspan = showActions ? 10 : 9;
  return requests.map((request) => {
    const price = b2bShipmentRequestPrice(request, client);
    const lineTotal = b2bShipmentRequestLineTotal(request, client);
    const canEditRequest = showActions && canManageB2BClientRequest(request);
    return `
      <tr data-client-request-row="${escapeHtml(request.id)}">
        <td><strong>${escapeHtml(request.batchId || request.id)}</strong>${request.batchId ? `<br><span class="small muted">${escapeHtml(request.id)}</span>` : ""}</td>
        <td>${request.date}</td>
        <td>${productName(request.productId)}</td>
        <td>
          ${showActions
            ? `<input class="compact-input" data-client-request-qty="${escapeHtml(request.id)}" data-client-id="${escapeHtml(client.id)}" type="number" min="0" step="1" inputmode="numeric" value="${escapeHtml(request.qty)}" ${canEditRequest ? "" : "disabled"}>`
            : escapeHtml(request.qty)}
        </td>
        <td>${formatMoney(price.amount, price.currency)}</td>
        <td><strong data-client-request-line-total="${escapeHtml(request.id)}">${formatMoney(lineTotal.amount, lineTotal.currency)}</strong></td>
        <td>${request.desiredDate || "-"}</td>
        <td>${statusPill(request.status)}</td>
        <td>${escapeHtml(request.comment || "-")}</td>
        ${showActions ? `
          <td class="row-actions">
            <button class="danger" type="button" data-cancel-client-request="${escapeHtml(request.id)}" ${canEditRequest ? "" : "disabled"}>Відмінити</button>
          </td>
        ` : ""}
      </tr>
    `;
  }).join("") || `<tr><td colspan="${colspan}" class="muted">${escapeHtml(emptyText)}</td></tr>`;
}

function b2bRequestGroupId(request) {
  return request.batchId || request.id;
}

function b2bRequestStatusSummary(requests) {
  const statuses = uniqueList(requests.map((request) => request.status));
  return statuses.map((status) => statusPill(status)).join(" ");
}

function groupB2BClientRequests(requests, client) {
  const groups = new Map();
  requests.forEach((request) => {
    const groupId = b2bRequestGroupId(request);
    if (!groups.has(groupId)) {
      groups.set(groupId, {
        id: groupId,
        date: request.date,
        submittedAt: request.submittedAt || "",
        clientId: request.clientId,
        requests: []
      });
    }
    const group = groups.get(groupId);
    group.requests.push(request);
    if ((request.submittedAt || "") > (group.submittedAt || "")) group.submittedAt = request.submittedAt;
    if ((request.date || "") > (group.date || "")) group.date = request.date;
  });
  return Array.from(groups.values()).map((group) => {
    const totals = b2bShipmentRequestTotals(group.requests, client);
    const qty = group.requests.reduce((sum, request) => sum + Number(request.qty || 0), 0);
    return {
      ...group,
      qty,
      totals,
      positions: group.requests.length
    };
  }).sort((first, second) => (
    String(second.submittedAt || second.date).localeCompare(String(first.submittedAt || first.date), "uk")
  ));
}

function renderB2BClientRequestHistoryRows(groups, client) {
  return groups.map((group) => `
    <tr class="clickable-row" data-open-client-request-batch="${escapeHtml(group.id)}" data-client-id="${escapeHtml(client.id)}" title="Відкрити заявку для перегляду">
      <td><strong>${escapeHtml(group.id)}</strong><br><span class="small muted">${group.positions} поз.</span></td>
      <td>${escapeHtml(group.date || "-")}<br><span class="small muted">${escapeHtml(group.submittedAt || "час не зафіксовано")}</span></td>
      <td><strong>${group.qty}</strong></td>
      <td><strong>${formatCurrencyTotals(group.totals, client.currency || "UAH")}</strong></td>
      <td>${b2bRequestStatusSummary(group.requests)}</td>
    </tr>
  `).join("") || '<tr><td colspan="5" class="muted">За вибраний період підтверджених заявок немає.</td></tr>';
}

function renderB2BRequestCatalog(client, draftRequests, historyRequests, historyPeriod) {
  const allProducts = [...state.products];
  const products = filterB2BCatalogProducts(allProducts, client);
  const requestTotals = b2bShipmentRequestTotals(draftRequests, client);
  const hasDrafts = draftRequests.some((request) => Number(request.qty || 0) > 0 && request.status === "request_draft");
  const cartQty = draftRequests.reduce((sum, request) => sum + Number(request.qty || 0), 0);
  const historyGroups = groupB2BClientRequests(historyRequests, client);
  return `
    <button class="floating-cart-summary no-print" type="button" data-scroll-to-client-cart data-client-id="${escapeHtml(client.id)}">
      <span>Кошик</span>
      <strong data-floating-cart-qty="${escapeHtml(client.id)}">${cartQty} од.</strong>
      <em data-floating-cart-total="${escapeHtml(client.id)}">${formatCurrencyTotals(requestTotals, client.currency || "UAH")}</em>
    </button>
    <section class="panel section-band">
      <div class="split">
        <div>
          <h2>Прайс-каталог для заявки на відвантаження</h2>
          <p class="small muted">Прайс клієнта: ${escapeHtml(priceTypeName(client.priceType))}. Залишки, склади та серійні номери в цьому каталозі не показуються.</p>
        </div>
        <span class="pill info">${products.length} позицій</span>
      </div>
      ${renderB2BCatalogFilters(allProducts, products)}
      <div class="b2b-catalog-grid">
        ${products.map((product) => renderB2BRequestCatalogCard(product, client)).join("") || '<p class="notice warn">За вибраними параметрами товарів немає. Змініть відбір або скиньте фільтри.</p>'}
      </div>
      <h2 class="section-title" id="client-request-cart">Кошик</h2>
      <div class="table-wrap b2b-request-history">
        <table>
          <thead><tr><th>Позиція</th><th>Дата</th><th>Товар</th><th>К-сть</th><th>Ціна од.</th><th>Сума</th><th>Бажана дата</th><th>Статус</th><th>Коментар</th><th>Дії</th></tr></thead>
          <tbody>
            ${renderClientB2BRequestRows(draftRequests, client, { showActions: true, emptyText: "Кошик порожній. Натисніть “У кошик” біля потрібної позиції каталогу." })}
          </tbody>
        </table>
      </div>
      <div class="catalog-request-total">
        <span>Загальна сума кошика</span>
        <strong data-client-request-total="${escapeHtml(client.id)}">${formatCurrencyTotals(requestTotals, client.currency || "UAH")}</strong>
        <button class="primary" type="button" data-confirm-client-requests="${escapeHtml(client.id)}" ${hasDrafts ? "" : "disabled"}>Підтвердити заявку</button>
      </div>
      <p class="notice small">Після підтвердження кошик очиститься, а заявка потрапить менеджеру в основний B2B кабінет для перевірки наявності, умов відвантаження, серійних номерів і фінального проведення.</p>
    </section>

    <section class="panel section-band" data-print-area="clientCatalogHistory" data-print-title="Історія заявок B2B · ${escapeHtml(client.name)}">
      <h2>Історія заявок</h2>
      ${renderPeriodPrintControls("clientCatalogHistory", "Історія заявок", historyPeriod, historyGroups.length)}
      <div class="table-wrap b2b-request-history">
        <table>
          <thead><tr><th>Заявка</th><th>Дата</th><th>Кількість</th><th>Сума заявки</th><th>Статус</th></tr></thead>
          <tbody>
            ${renderB2BClientRequestHistoryRows(historyGroups, client)}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  `;
}

function selectedValues(select) {
  return select ? Array.from(select.selectedOptions).map((optionNode) => optionNode.value).filter(Boolean) : [];
}

function resolveSupplier(raw) {
  if (raw.supplierId === "__new") {
    const name = String(raw.newSupplier || "").trim();
    if (!name) throw new Error("Вкажіть назву нового постачальника.");
    let supplier = state.settings.suppliers.find((item) => item.name.toLowerCase() === name.toLowerCase());
    if (!supplier) {
      supplier = { id: uniqueId("sup"), name, edrpou: "", phone: "", email: "" };
      state.settings.suppliers.push(supplier);
    }
    return supplier.name;
  }
  if (raw.supplierId) return supplierName(raw.supplierId);
  const name = String(raw.supplier || "").trim();
  if (!name) throw new Error("Вкажіть постачальника.");
  if (!state.settings.suppliers.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
    state.settings.suppliers.push({ id: uniqueId("sup"), name, edrpou: "", phone: "", email: "" });
  }
  return name;
}

function isLocked(date, locked) {
  return locked || (!role().canEditClosedDay && date <= state.settings.closedDay);
}

function documentEditLocked(documentKey, document = {}) {
  return isLocked(document.date || document.dueDate || today, document.locked) && !canEditPostedDocument(documentKey);
}

function invoicePostedPermissionKey(invoice = {}) {
  return invoice.responsibleStorage ? "b2bSaleReport" : "salesInvoice";
}

function formatMoney(amount, currency = "UAH") {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(amount || 0));
}

function uah(amount, currency) {
  return convertMoneyWithRates(amount, currency, "UAH", state.settings.rates);
}

function convertMoney(amount, fromCurrency = "UAH", toCurrency = "UAH") {
  return convertMoneyWithRates(amount, fromCurrency, toCurrency, state.settings.rates);
}

function uahRate(currency) {
  return uahRateWithRates(currency, state.settings.rates);
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + Number(days || 0));
  return date.toISOString().slice(0, 10);
}

function periodFilter(key, fallbackFrom = "2026-05-01", fallbackTo = today) {
  const period = state.periodFilters?.[key] || {};
  return {
    from: period.from || fallbackFrom,
    to: period.to || fallbackTo
  };
}

function dateInPeriod(date, period) {
  if (!date) return true;
  return String(date) >= period.from && String(date) <= period.to;
}

function dateInOptionalPeriod(date, period) {
  if (!date) return true;
  const value = String(date);
  return (!period.from || value >= period.from) && (!period.to || value <= period.to);
}

function marketplaceOrderFilter() {
  const filter = state.marketplaceOrderFilters || {};
  return {
    from: filter.from || "",
    to: filter.to || "",
    status: filter.status || "",
    marketplace: filter.marketplace || "",
    expanded: Boolean(filter.expanded)
  };
}

function periodLabel(period) {
  return `${period.from} — ${period.to}`;
}

function renderPeriodPrintControls(key, title, period, resultCount = null) {
  return `
    <form class="period-toolbar no-print" data-period-filter="${escapeHtml(key)}">
      <input type="hidden" name="key" value="${escapeHtml(key)}">
      <label class="field compact"><span>Дата від</span><input name="from" type="date" value="${escapeHtml(period.from)}"></label>
      <label class="field compact"><span>Дата до</span><input name="to" type="date" value="${escapeHtml(period.to)}"></label>
      ${resultCount === null ? "" : `<span class="pill info">${resultCount} рядків</span>`}
      <button class="secondary" type="button" data-print-scope="${escapeHtml(key)}" ${canPrintDocuments() ? "" : "disabled"}>Друк</button>
      ${canPrintDocuments() ? "" : '<span class="notice warn small">Друк заборонено поточною роллю.</span>'}
    </form>
    <p class="small muted no-print">Період для “${escapeHtml(title)}”: ${escapeHtml(periodLabel(period))}</p>
  `;
}

function uniqueId(prefix) {
  return `${prefix}-${String(Date.now()).slice(-8)}-${Math.random().toString(36).slice(2, 6)}`;
}

function statusPill(status) {
  const map = {
    paid: ["good", "оплачено"],
    partial: ["warn", "частково"],
    overdue: ["danger", "прострочено"],
    draft: ["info", "чернетка"],
    cancelled: ["danger", "скасовано"],
    published: ["good", "опубліковано"],
    needs_sync: ["warn", "потрібен обмін"],
    hidden: ["info", "приховано"],
    moderation: ["warn", "модерація"],
    new_order: ["warn", "нове замовлення"],
    agreed: ["info", "узгоджено"],
    sent_to_warehouse: ["marketplace-warehouse", "передано на склад"],
    sent_to_delivery: ["marketplace-delivery", "передано на доставку"],
    delivered: ["marketplace-delivered", "доставлено / вручено"],
    invoiced: ["good", "накладна"],
    payment_expected: ["warn", "очікує оплати"],
    request_new: ["warn", "нова заявка"],
    request_draft: ["info", "чернетка клієнта"],
    request_review: ["danger", "потребує виправлення"],
    request_approved: ["good", "підтверджено"],
    request_rejected: ["danger", "відхилено"],
    request_cancelled: ["danger", "скасовано клієнтом"],
    in_storage: ["info", "на зберіганні"],
    reported_sale: ["warn", "звіт продажу"],
    ownership_transferred: ["good", "власність перейшла"],
    available: ["good", "в наявності"],
    responsible_storage: ["info", "відп. зберігання"],
    sold: ["danger", "продано"],
    verified: ["good", "ЄРЗ перевірено"],
    pending: ["warn", "ЄРЗ очікує"],
    ok: ["good", "активно"],
    open: ["warn", "відкрито"],
    planned: ["info", "план"],
    token_needed: ["danger", "потрібен токен"],
    mapping_needed: ["warn", "мапінг"],
    pending_export: ["warn", "BAS очікує"],
    pending_import: ["warn", "імпорт"],
    exported: ["good", "BAS експорт"],
    imported: ["good", "BAS імпорт"]
  };
  const [kind, label] = map[status] || ["info", status || "стан"];
  return `<span class="pill ${kind}">${label}</span>`;
}

function currentTimestamp() {
  return `${today} ${new Date().toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}`;
}

function marketplaceOrderStatusPill(status) {
  const item = MARKETPLACE_ORDER_STATUS_MAP[status] || MARKETPLACE_ORDER_STATUS_MAP.new_order;
  return `<span class="pill ${item.className}">${item.label}</span>`;
}

function marketplaceDeliveryStatusPill(status) {
  const map = {
    new: ["info", "очікує ТТН"],
    sent_to_warehouse: ["marketplace-warehouse", "на складі"],
    sent_to_delivery: ["marketplace-delivery", "у доставці"],
    delivered: ["marketplace-delivered", "вручено"]
  };
  const [kind, label] = map[status] || ["info", status || "доставка"];
  return `<span class="pill ${kind}">${label}</span>`;
}

function marketplacePaymentStatusPill(status) {
  const map = {
    expected: ["warn", "очікує"],
    pending: ["warn", "перевіряється"],
    paid: ["marketplace-paid", "оплачено"],
    failed: ["danger", "помилка"]
  };
  const [kind, label] = map[status] || ["info", status || "оплата"];
  return `<span class="pill ${kind}">${label}</span>`;
}

function canManageMarketplaceOrder() {
  return canCreateDocument("marketplaceOrder");
}

function canChangeMarketplaceOrderStatus() {
  return canCreateDocument("marketplaceStatus") && canEditField("marketplaceStatus");
}

function canTrackMarketplaceDelivery() {
  return canCreateDocument("deliveryTracking") && canEditField("deliveryTracking");
}

function canTrackMarketplacePayment() {
  return canCreateDocument("paymentTracking") && canEditField("paymentTracking");
}

function navCount(view) {
  if (view === "sales") return state.invoices.length;
  if (view === "products") return state.products.length;
  if (view === "purchases") return state.purchases.length;
  if (view === "clients") return state.clients.length;
  if (view === "serials") return state.serials.length;
  if (view === "finance") return state.invoices.filter((invoice) => invoice.total > invoice.paid).length;
  if (view === "b2b") return (state.b2bShipmentRequests || []).filter((request) => ["request_new", "request_review"].includes(request.status)).length || "";
  if (view === "reports") return "12";
  if (view === "marketplaces") return state.marketplaceOrders.filter((order) => order.status === "new_order").length || state.marketplacePublications.filter((item) => item.status !== "published").length;
  if (view === "integrations") return state.integrations.filter((item) => item.status !== "ok").length;
  if (view === "roles") return state.employees.length;
  return "";
}

function syncSidebarToggleButton() {
  const toggle = $("#sidebar-toggle");
  if (!toggle) return;
  toggle.setAttribute("aria-expanded", sidebarCollapsed ? "false" : "true");
  toggle.title = sidebarCollapsed ? "Розгорнути меню" : "Згорнути меню";
  toggle.setAttribute("aria-label", sidebarCollapsed ? "Розгорнути меню" : "Згорнути меню");
}

function renderShell() {
  document.body.classList.toggle("sidebar-collapsed", sidebarCollapsed);
  syncSidebarToggleButton();
  $("#export-json")?.removeAttribute("hidden");
  $("#reset-demo")?.removeAttribute("hidden");
  $("#nav").innerHTML = NAV.filter(([id]) => canAccessView(id)).map(([id, label, icon]) => `
    <button data-view="${id}" class="${state.currentView === id ? "active" : ""}" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}">
      <span class="nav-icon">${icon}</span>
      <span class="nav-label">${label}</span>
      <span class="nav-count">${navCount(id)}</span>
    </button>
  `).join("");

  const employee = currentEmployee();
  state.currentRole = employee?.roleName || state.currentRole;
  state.currentManager = employee?.name || state.currentManager;
  state.managers = state.employees.filter((item) => item.active).map((item) => item.name);
  $$(".toolbar .field.compact").forEach((element) => element.remove());
  if (!$("#user-badge")) {
    $(".toolbar")?.insertAdjacentHTML("afterbegin", '<div class="session-user" id="user-badge"></div><button class="secondary" id="logout-button" type="button">Змінити користувача</button>');
  }
  const badge = $("#user-badge");
  if (badge) {
    badge.innerHTML = `<strong>${escapeHtml(employee?.name || "-")}</strong><small>${escapeHtml(employee?.roleName || "-")}</small>`;
  }

  const navItem = NAV.find(([id]) => id === state.currentView);
  $("#page-title").textContent = navItem ? navItem[1] : "CRM";
}

function renderClientShell(client) {
  document.body.classList.toggle("sidebar-collapsed", sidebarCollapsed);
  syncSidebarToggleButton();
  $("#export-json")?.setAttribute("hidden", "hidden");
  $("#reset-demo")?.setAttribute("hidden", "hidden");
  const clientViews = [
    ["cabinet", "Мій кабінет", "B2", clientStorageRows(client.id).reduce((sum, row) => sum + row.qty, 0)],
    ["catalog", "Каталоги / прайси / акції", "КП", state.products.length]
  ];
  if (!clientViews.some(([id]) => id === clientPortalView)) clientPortalView = "cabinet";
  $("#nav").innerHTML = clientViews.map(([id, label, icon, count]) => `
    <button data-client-view="${id}" class="${clientPortalView === id ? "active" : ""}" type="button" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}">
      <span class="nav-icon">${icon}</span>
      <span class="nav-label">${label}</span>
      <span class="nav-count">${count || ""}</span>
    </button>
  `).join("");
  $$(".toolbar .field.compact").forEach((element) => element.remove());
  if (!$("#user-badge")) {
    $(".toolbar")?.insertAdjacentHTML("afterbegin", '<div class="session-user" id="user-badge"></div><button class="secondary" id="logout-button" type="button">Змінити користувача</button>');
  }
  const badge = $("#user-badge");
  if (badge) {
    badge.innerHTML = `<strong>${escapeHtml(client.name || "-")}</strong><small>B2B клієнт</small>`;
  }
  $("#page-title").textContent = clientViews.find(([id]) => id === clientPortalView)?.[1] || "B2B кабінет";
}

function option(value, label, selected = false) {
  return `<option value="${escapeHtml(value)}" ${selected ? "selected" : ""}>${escapeHtml(label)}</option>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fieldSuggestions(input) {
  const key = `${input.name || ""} ${input.placeholder || ""}`.toLowerCase();
  const all = [
    ...state.clients.map((client) => client.name),
    ...state.clients.map((client) => client.phone || ""),
    ...state.clients.map((client) => client.email || ""),
    ...state.products.map((product) => product.model),
    ...state.products.map((product) => product.brand),
    ...state.products.map((product) => product.barcode),
    ...state.products.map((product) => product.supplierSku),
    ...state.products.map((product) => product.internalCode),
    ...state.settings.suppliers.map((supplier) => supplier.name),
    ...state.warehouses.map((warehouse) => warehouse.name),
    ...state.managers,
    ...state.settings.cashArticles,
    ...state.settings.expenseArticles,
    ...state.settings.delivery,
    ...Object.values(state.settings.variantDictionaries || {}).flat().map((entry) => entry.name),
    ...state.serials.map((serial) => serial.serial),
    ...state.marketplacePublications.map((publication) => publication.sku),
    ...state.marketplaceOrders.map((order) => order.externalOrderId)
  ];
  if (key.includes("client") || key.includes("клієнт") || key.includes("покуп")) return uniqueList(state.clients.map((client) => client.name));
  if (key.includes("phone") || key.includes("тел")) return uniqueList(state.clients.map((client) => client.phone));
  if (key.includes("email")) return uniqueList(state.clients.map((client) => client.email));
  if (key.includes("supplier") || key.includes("постач")) return uniqueList(state.settings.suppliers.map((supplier) => supplier.name));
  if (key.includes("barcode") || key.includes("qr") || key.includes("штрих")) return uniqueList(state.products.map((product) => product.barcode));
  if (key.includes("sku") || key.includes("артикул")) return uniqueList([...state.products.map((product) => product.supplierSku), ...state.marketplacePublications.map((publication) => publication.sku)]);
  if (key.includes("code") || key.includes("код")) return uniqueList(state.products.map((product) => product.internalCode));
  if (key.includes("model") || key.includes("модель")) return uniqueList(state.products.map((product) => product.model));
  if (key.includes("brand") || key.includes("бренд")) return uniqueList(state.products.map((product) => product.brand));
  if (key.includes("manager") || key.includes("менедж")) return uniqueList(state.managers);
  return uniqueList(all).slice(0, 80);
}

function attachFieldSuggestions() {
  let host = $("#crm-suggestions");
  if (!host) {
    host = document.createElement("div");
    host.id = "crm-suggestions";
    document.body.appendChild(host);
  }
  const datalists = [];
  $$("input").forEach((input, index) => {
    if (["date", "number", "file", "checkbox", "radio", "password", "hidden"].includes(input.type) || input.disabled || input.readOnly) return;
    const values = fieldSuggestions(input);
    if (!values.length) return;
    const id = `crm-suggest-${index}`;
    input.setAttribute("list", id);
    datalists.push(`<datalist id="${id}">${values.map((value) => `<option value="${escapeHtml(value)}"></option>`).join("")}</datalist>`);
  });
  host.innerHTML = datalists.join("");
}

function renderLogin() {
  document.body.classList.add("auth-locked");
  $(".app-shell")?.setAttribute("aria-hidden", "true");
  let screen = $("#login-screen");
  if (!screen) {
    screen = document.createElement("main");
    screen.id = "login-screen";
    document.body.prepend(screen);
  }
  screen.innerHTML = `
    <section class="login-card">
      <div>
        <span class="brand-mark">AC</span>
        <h1>Вхід до Arms CRM</h1>
        <p class="muted">Працівники входять у CRM, B2B клієнти — у свій віддалений кабінет.</p>
      </div>
      <div class="login-options">
        <form class="form-grid" data-action="login">
          <h2>Працівник</h2>
          <label class="field full"><span>Логін</span><input name="login" autocomplete="username" required autofocus></label>
          <label class="field full"><span>Пароль</span><input name="password" type="password" autocomplete="current-password" required></label>
          <button class="primary" type="submit">Увійти в CRM</button>
        </form>
        <form class="form-grid" data-action="client-login">
          <h2>B2B клієнт</h2>
          <label class="field full"><span>Логін кабінету</span><input name="login" autocomplete="username" required></label>
          <label class="field full"><span>Пароль кабінету</span><input name="password" type="password" autocomplete="current-password" required></label>
          <button class="secondary" type="submit">Увійти в кабінет</button>
        </form>
      </div>
      <p class="notice small">Demo: адміністратор <strong>admin/admin</strong>, B2B кабінет Тактик Про <strong>tactic/tactic</strong>, Стрілецький Дім <strong>strilets/strilets</strong>.</p>
    </section>
  `;
}

function clearLoginScreen() {
  document.body.classList.remove("auth-locked");
  $(".app-shell")?.removeAttribute("aria-hidden");
  $("#login-screen")?.remove();
}

function render() {
  if (isClientAuthenticated()) {
    const client = authenticatedClient();
    clearLoginScreen();
    renderClientShell(client);
    $("#app").innerHTML = clientPortalView === "catalog" ? renderClientCatalogPage(client) : renderClientPortal(client);
    attachFieldSuggestions();
    prepareDecimalInputs($("#app"));
    saveState();
    return;
  }
  if (!isAuthenticated()) {
    authEmployeeId = "";
    authClientId = "";
    authMode = "";
    sessionStorage.removeItem("arms-crm-auth-employee-id");
    sessionStorage.removeItem("arms-crm-auth-client-id");
    sessionStorage.removeItem("arms-crm-auth-mode");
    renderLogin();
    saveState();
    return;
  }
  clearLoginScreen();
  activateEmployeeSession(authenticatedEmployee());
  if (!canAccessView(state.currentView)) state.currentView = "dashboard";
  renderShell();
  const viewMap = {
    dashboard: renderDashboard,
    sales: renderSales,
    products: renderProducts,
    purchases: renderPurchases,
    serials: renderSerials,
    warehouse: renderWarehouse,
    b2b: renderB2B,
    clients: renderClients,
    finance: renderFinance,
    reports: renderReports,
    marketplaces: renderMarketplaces,
    integrations: renderIntegrations,
    settings: renderSettings,
    roles: renderRoles
  };
  $("#app").innerHTML = (viewMap[state.currentView] || renderDashboard)();
  if (state.currentView === "products") renderProductPhotoPreview();
  attachFieldSuggestions();
  prepareDecimalInputs($("#app"));
  applyRoleFieldLocks($("#app"));
  saveState();
}

function totals() {
  const receivable = state.invoices.reduce((sum, invoice) => sum + Math.max(invoice.total - invoice.paid, 0), 0);
  const paid = state.payments.reduce((sum, payment) => sum + uah(payment.amount, payment.currency), 0);
  const stockValue = inventoryRows().reduce((sum, row) => sum + row.valueUAH, 0);
  const weaponAvailable = state.serials.filter((serial) => serial.status === "available").length;
  return { receivable, paid, stockValue, weaponAvailable };
}

function renderDashboard() {
  const t = totals();
  return `
    <section class="grid four section-band">
      <article class="card metric info"><span>Дебіторка</span><strong>${formatMoney(t.receivable)}</strong><small>Прив'язана до клієнтів, менеджерів та накладних.</small></article>
      <article class="card metric good"><span>Отримані оплати</span><strong>${formatMoney(t.paid)}</strong><small>Каса, банк, валютні платежі з курсом дня.</small></article>
      <article class="card metric warn"><span>Залишки у собівартості</span><strong>${formatMoney(t.stockValue)}</strong><small>Конвертація з валюти приходу у UAH.</small></article>
      <article class="card metric danger"><span>Серійні одиниці в наявності</span><strong>${t.weaponAvailable}</strong><small>Заборонено продаж зброї без серії та дозволу.</small></article>
    </section>

    <section class="grid two">
      <div class="panel">
        <div class="split">
          <h2>Контроль операцій</h2>
          <span class="pill info">Закритий день: ${state.settings.closedDay}</span>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Документ</th><th>Дата</th><th>Клієнт</th><th>Канал</th><th>Сума</th><th>Стан</th></tr></thead>
            <tbody>
              ${state.invoices.map((invoice) => `
                <tr>
                  <td><strong>${invoice.id}</strong><br><span class="small muted">${firmName(invoice.firmId)}</span></td>
                  <td>${invoice.date}</td>
                  <td>${clientName(invoice.clientId)}</td>
                  <td>${invoice.channel}</td>
                  <td>${formatMoney(invoice.total, invoice.currency)}<br><span class="small muted">борг ${formatMoney(invoice.total - invoice.paid, invoice.currency)}</span></td>
                  <td>${statusPill(invoice.status)} ${isLocked(invoice.date, invoice.locked) ? '<span class="pill danger">заблоковано</span>' : ""}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>

      <div class="panel">
        <h2>Журнал подій</h2>
        <div class="timeline">
          ${state.audit.slice(0, 8).map((item) => `
            <div class="timeline-item">
              <strong>${item.action}</strong>
              <span class="small muted">${item.at} · ${item.actor}</span>
            </div>
          `).join("")}
        </div>
      </div>
    </section>
  `;
}

function defaultSaleLine(productId = "") {
  const product = byId(state.products, productId) || state.products[0];
  const priceType = saleDraft.priceType || activeSalePriceTypes()[0]?.id || "";
  const salePrice = product ? productSalePrice(product, priceType) : { amount: 0, currency: "UAH" };
  return {
    productId: product?.id || "",
    barcode: product?.barcode || product?.qrCode || "",
    qty: 1,
    price: salePrice.amount,
    currency: salePrice.currency,
    discount: 0,
    serialIds: [],
    permitNumber: "",
    permitDate: ""
  };
}

function saleDraftLines() {
  const migratedLine = saleDraft.productId
    ? {
        productId: saleDraft.productId,
        barcode: saleDraft.barcode || "",
        qty: saleDraft.qty || 1,
        price: saleDraft.price,
        currency: saleDraft.currency,
        discount: saleDraft.discount || 0,
        serialIds: saleDraft.serialIds || [],
        permitNumber: saleDraft.permitNumber || "",
        permitDate: saleDraft.permitDate || ""
      }
    : null;
  const lines = Array.isArray(saleDraft.lines) && saleDraft.lines.length ? saleDraft.lines : [migratedLine || defaultSaleLine()];
  return lines.map((line) => ({ ...defaultSaleLine(line.productId), ...line, serialIds: line.serialIds || [] }));
}

function saleLinePrice(line, priceType) {
  const product = byId(state.products, line.productId) || state.products[0];
  const selectedPrice = product ? productSalePrice(product, priceType) : { amount: 0, currency: "UAH" };
  return {
    amount: line.price === undefined || line.price === "" ? selectedPrice.amount : line.price,
    currency: line.currency || selectedPrice.currency
  };
}

function renderSaleInvoiceLine(line, index, priceType, context = {}) {
  const product = byId(state.products, line.productId) || state.products[0];
  const price = saleLinePrice(line, priceType);
  const modelSerials = product?.type === "weapon" ? serialsForProduct(product) : [];
  const selectableSerials = modelSerials.filter((serial) => serialIsSelectable(serial) && serialMatchesStockContext(serial, context));
  const selectedSerialIds = line.serialIds || [];
  const serialOptions = product?.type !== "weapon"
    ? ""
    : modelSerials.length
      ? modelSerials.map((serial) => serialOption(serial, selectedSerialIds, context)).join("")
      : '<option disabled>Немає серій для цієї моделі.</option>';
  const serialHint = product?.type === "weapon"
    ? `<span class="small muted">доступно ${selectableSerials.length} з ${modelSerials.length}</span>`
    : '<span class="small muted">без серій</span>';
  return `
    <tr data-sale-line="${index}">
      <td>
        <input name="barcode" data-sale-line-index="${index}" data-sale-barcode value="${escapeHtml(line.barcode || product?.barcode || "")}" placeholder="QR / штрихкод">
      </td>
      <td class="line-product">
        <select name="productId" data-sale-line-index="${index}" data-sale-product>
          ${state.products.map((item) => option(item.id, `${item.type === "weapon" ? "Зброя" : "Товар"} · ${item.brand} ${item.model}`, item.id === product?.id)).join("")}
        </select>
        <span class="small muted">${product ? productCodes(product) : ""}</span>
      </td>
      <td><input name="qty" data-sale-line-index="${index}" inputmode="decimal" value="${escapeHtml(line.qty || 1)}"></td>
      <td><input name="price" data-sale-line-index="${index}" inputmode="decimal" data-field-lock="price" value="${escapeHtml(price.amount)}"></td>
      <td><select name="currency" data-sale-line-index="${index}" data-field-lock="price">${Object.keys(state.settings.rates).map((currency) => option(currency, currency, currency === price.currency)).join("")}</select></td>
      <td><input name="discount" data-sale-line-index="${index}" inputmode="decimal" data-field-lock="discount" value="${escapeHtml(line.discount || 0)}"></td>
      <td class="line-serials">
        <select class="serial-select" name="serialIds" data-sale-line-index="${index}" multiple ${product?.type === "weapon" ? "" : "disabled"}>${serialOptions}</select>
        ${serialHint}
      </td>
      <td>
        <input name="permitNumber" data-sale-line-index="${index}" value="${escapeHtml(line.permitNumber || "")}" ${product?.type === "weapon" ? "required" : "disabled"} placeholder="номер">
        <input name="permitDate" data-sale-line-index="${index}" type="date" value="${escapeHtml(line.permitDate || "")}" ${product?.type === "weapon" ? "required" : "disabled"}>
      </td>
      <td class="row-actions no-print">
        <button class="danger" type="button" data-remove-sale-line="${index}" ${saleDraftLines().length <= 1 ? "disabled" : ""}>Прибрати</button>
      </td>
    </tr>
  `;
}

function collectSaleLinesFromForm(form) {
  return Array.from(form.querySelectorAll("[data-sale-line]")).map((row) => ({
    productId: row.querySelector('[name="productId"]')?.value || "",
    barcode: row.querySelector('[name="barcode"]')?.value || "",
    qty: row.querySelector('[name="qty"]')?.value || 1,
    price: row.querySelector('[name="price"]')?.value || 0,
    currency: row.querySelector('[name="currency"]')?.value || "UAH",
    discount: row.querySelector('[name="discount"]')?.value || 0,
    serialIds: selectedValues(row.querySelector('[name="serialIds"]')),
    permitNumber: row.querySelector('[name="permitNumber"]')?.value || "",
    permitDate: row.querySelector('[name="permitDate"]')?.value || ""
  })).filter((line) => line.productId);
}

function updateSaleDraftFromForm(form) {
  const data = formData(form);
  saleDraft = {
    ...saleDraft,
    documentType: data.documentType,
    date: data.date,
    contract: data.contract,
    warehouseId: data.warehouseId,
    firmId: data.firmId,
    channel: data.channel,
    clientId: data.clientId,
    priceType: data.priceType,
    delivery: data.delivery,
    ttn: data.ttn,
    deliveryPayer: data.deliveryPayer,
    cashArticle: data.cashArticle,
    paymentMode: data.paymentMode,
    paid: data.paid,
    dueDays: data.dueDays,
    manager: data.manager,
    accounting: data.accounting,
    comment: data.comment,
    lines: collectSaleLinesFromForm(form)
  };
}

function renderSales() {
  const draftPeriod = periodFilter("salesDrafts");
  const docsPeriod = periodFilter("salesDocs");
  const draftInvoices = state.invoices.filter((invoice) => invoice.posted === false && invoice.status === "draft" && dateInPeriod(invoice.date, draftPeriod));
  const journalInvoices = state.invoices.filter((invoice) => !(invoice.posted === false && invoice.status === "draft") && dateInPeriod(invoice.date, docsPeriod));
  const selectedClient = byId(state.clients, saleDraft.clientId) || state.clients[0];
  const defaultPriceType = priceTypeById(saleDraft.priceType)?.id || priceTypeById(selectedClient?.priceType)?.id || activeSalePriceTypes()[0]?.id || "";
  const lines = saleDraftLines();
  const canSellWeapon = !lines.some((line) => byId(state.products, line.productId)?.type === "weapon") || role().canSellWeapon;
  return `
    <section class="section-band">
      <div class="panel invoice-panel">
        <div class="split">
          <h2>Нова накладна</h2>
          <span class="pill ${canSellWeapon ? "good" : "danger"}">${canSellWeapon ? "роль дозволяє продаж" : "роль блокує зброю"}</span>
        </div>
        <form class="stack" data-action="create-invoice">
          <div class="document-header-grid">
            <label class="field"><span>Тип документа</span><select name="documentType">${variantOptions("documentTypes", saleDraft.documentType || "Видаткова накладна")}</select></label>
            <label class="field"><span>Дата</span><input name="date" type="date" value="${escapeHtml(saleDraft.date || today)}"></label>
            <label class="field"><span>Договір</span><input name="contract" value="${escapeHtml(saleDraft.contract || "")}" placeholder="договір, рахунок, заявка"></label>
            <label class="field"><span>Склад</span><select name="warehouseId" data-sale-stock-context>${state.warehouses.map((warehouse) => option(warehouse.id, warehouse.name, warehouse.id === (saleDraft.warehouseId || "wh-store"))).join("")}</select></label>
            <label class="field"><span>Фірма</span><select name="firmId" data-sale-stock-context>${state.settings.firms.map((firm) => option(firm.id, firm.name, firm.id === (saleDraft.firmId || state.settings.firms[0]?.id || "vat"))).join("")}</select></label>
            <label class="field"><span>Канал</span><select name="channel">${variantOptions("salesChannels", saleDraft.channel || "Магазин")}</select></label>
            <label class="field"><span>Клієнт</span><select name="clientId" data-sale-client>${state.clients.map((client) => option(client.id, client.name, client.id === selectedClient?.id)).join("")}</select></label>
            <label class="field"><span>Прайс</span><select name="priceType" data-sale-price-type>${priceTypeOptions(defaultPriceType)}</select></label>
          </div>

          <div class="table-wrap invoice-lines">
            <table>
              <thead><tr><th>QR / штрихкод</th><th>Товар</th><th>К-сть</th><th>Ціна</th><th>Валюта</th><th>Знижка %</th><th>Серійні номери</th><th>Дозвіл</th><th>Дії</th></tr></thead>
              <tbody>${lines.map((line, index) => renderSaleInvoiceLine(line, index, defaultPriceType, { warehouseId: saleDraft.warehouseId || "wh-store", firmId: saleDraft.firmId || state.settings.firms[0]?.id || "vat", clientId: "" })).join("")}</tbody>
            </table>
          </div>

          <div class="inline-actions no-print">
            <button class="secondary" type="button" data-add-sale-line>Додати ще товар</button>
            <button class="ghost" type="button" data-view="purchases">Провести прихід серій</button>
          </div>

          <div class="document-footer-grid">
            <label class="field"><span>Доставка</span><select name="delivery">${variantOptions("delivery", saleDraft.delivery || "")}</select></label>
            <label class="field"><span>ТТН</span><input name="ttn" value="${escapeHtml(saleDraft.ttn || "")}" placeholder="номер накладної"></label>
            <label class="field"><span>Платник доставки</span><select name="deliveryPayer">${variantOptions("deliveryPayers", saleDraft.deliveryPayer || "Клієнт")}</select></label>
            <label class="field"><span>Стаття коштів</span><select name="cashArticle">${variantOptions("cashArticles", saleDraft.cashArticle || "")}</select></label>
            <label class="field"><span>Оплата</span><select name="paymentMode">${variantOptions("paymentModes", saleDraft.paymentMode || "Відтермінування")}</select></label>
            <label class="field"><span>Оплачено</span><input name="paid" inputmode="decimal" value="${escapeHtml(saleDraft.paid || 0)}"></label>
            <label class="field"><span>Відтермінування, днів</span><input name="dueDays" type="number" min="0" value="${escapeHtml(saleDraft.dueDays || state.settings.defaultDueDays)}"></label>
            <label class="field"><span>Відповідальний</span><select name="manager">${employeeOptions(saleDraft.manager || state.currentManager)}</select></label>
            <label class="field"><span>Бухоблік</span><select name="accounting">${option("true", "Позначити для BAS/BAF", saleDraft.accounting !== "false")}${option("false", "Не передавати", saleDraft.accounting === "false")}</select></label>
            <label class="field wide"><span>Коментар</span><textarea name="comment" placeholder="умови, резерв, примітки до документа">${escapeHtml(saleDraft.comment || "")}</textarea></label>
          </div>

          <button class="primary" type="submit">Створити накладну</button>
        </form>
        <p class="notice warn small">Для типу “Зброя” кількість у кожному рядку має дорівнювати кількості вибраних серій. Серії перевіряються по моделі, складу, актуальності, ЄРЗ і повторному продажу.</p>
      </div>
    </section>

    <section class="panel" data-print-area="salesDrafts" data-print-title="Чернетки накладних">
      <div class="split">
        <h2>Чернетки</h2>
        <span class="pill ${draftInvoices.length ? "warn" : "good"}">${draftInvoices.length} чернеток</span>
      </div>
      <p class="notice small">Чернетки не списують склад і не продають серійні номери. Після кнопки “Провести” документ переходить у журнал накладних.</p>
      ${renderPeriodPrintControls("salesDrafts", "Чернетки", draftPeriod, draftInvoices.length)}
      ${invoiceTable(draftInvoices, { emptyText: "Відкритих чернеток за вибраний період немає." })}
    </section>

    <section class="panel" data-print-area="salesDocs" data-print-title="Журнал накладних">
      <div class="split">
        <h2>Журнал накладних</h2>
      </div>
      ${renderPeriodPrintControls("salesDocs", "Журнал накладних", docsPeriod, journalInvoices.length)}
      ${invoiceTable(journalInvoices, { emptyText: "Проведених або скасованих накладних за вибраний період немає." })}
    </section>
  `;
}

function invoiceTable(invoices, options = {}) {
  const emptyText = options.emptyText || "Накладних за вибраний період немає.";
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Номер</th><th>Фірма</th><th>Клієнт</th><th>Менеджер</th><th>Канал</th><th>Сума / оплата</th><th>Доставка</th><th>Дії</th></tr></thead>
        <tbody>
          ${invoices.map((invoice) => `
            <tr>
              <td><strong>${invoice.id}</strong><br><span class="small muted">${invoice.date} · ${invoice.dueDate}</span></td>
              <td>${firmName(invoice.firmId)}<br>${invoice.accounting ? '<span class="pill info">BAS/BAF</span>' : '<span class="pill">упр. облік</span>'}</td>
              <td>${clientName(invoice.clientId)}</td>
              <td>${invoice.manager}</td>
              <td>${invoice.channel}</td>
              <td>${formatMoney(invoice.total, invoice.currency)}<br><span class="small muted">оплачено ${formatMoney(invoice.paid, invoice.currency)}</span><br>${statusPill(invoice.status)}${invoice.posted === false ? '<br><span class="pill info">не проведено</span>' : ""}</td>
              <td>${invoice.delivery}<br><span class="small muted">${invoice.ttn || "без ТТН"}</span></td>
              <td class="row-actions">
                <button class="primary" data-post-invoice-draft="${invoice.id}" ${invoice.posted === false && invoice.status === "draft" ? "" : "disabled"}>Провести</button>
                <button class="ghost" data-open-invoice="${invoice.id}">Деталі</button>
                <button class="secondary" data-edit-invoice="${invoice.id}" ${invoice.posted === false || canEditPostedDocument(invoicePostedPermissionKey(invoice)) ? "" : "disabled"}>Змінити</button>
                <button class="ghost" data-pay-invoice="${invoice.id}" ${invoice.storageShipment || invoice.posted === false || invoice.total <= invoice.paid ? "disabled" : ""}>Оплата</button>
                <button class="danger" data-lock-invoice="${invoice.id}" ${invoice.posted === false || isLocked(invoice.date, invoice.locked) ? "disabled" : ""}>Закрити</button>
                <button class="danger" data-cancel-invoice="${invoice.id}" ${invoice.status === "cancelled" ? "disabled" : ""}>Скасувати</button>
              </td>
            </tr>
          `).join("") || `<tr><td colspan="8" class="muted">${escapeHtml(emptyText)}</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
}

function renderProducts() {
  return `
    <section class="grid two section-band">
      <div class="panel">
        <h2>Додати товар</h2>
        <form class="form-grid" data-action="create-product">
          <label class="field"><span>Тип</span><select name="type"><option value="regular">Звичайний товар</option><option value="weapon">Зброя</option></select></label>
          ${dictionaryField("categories", "Категорія", "categoryValue", "newCategory", { placeholder: "нова категорія / група" })}
          ${dictionaryField("units", "Одиниця", "unitValue", "newUnit", { placeholder: "нова одиниця виміру" })}
          ${dictionaryField("brands", "Бренд", "brandValue", "newBrand", { placeholder: "новий бренд" })}
          ${dictionaryField("models", "Модель", "modelValue", "newModel", { wide: true, placeholder: "нова модель" })}
          ${dictionaryField("calibers", "Калібр", "caliberValue", "newCaliber", { required: false, selected: "без калібру", placeholder: "новий калібр для зброї" })}
          <label class="field"><span>ЄРЗ</span><select name="erzRequired"><option value="false">ні</option><option value="true">так</option></select></label>
          <div class="field wide">
            <span>Штрих / QR</span>
            <div class="input-action">
              <input name="barcode" data-product-barcode required placeholder="скануйте або створіть код">
              <button class="ghost" type="button" data-generate-product-barcode>Створити</button>
            </div>
          </div>
          ${dictionaryField("supplierSkus", "Артикул постач.", "supplierSkuValue", "newSupplierSku", { placeholder: "новий артикул постачальника" })}
          ${dictionaryField("internalCodes", "Внутр. код", "internalCodeValue", "newInternalCode", { placeholder: "новий внутрішній код" })}
          ${dictionaryField("uktzed", "УКТЗЕД", "uktzedValue", "newUktzed", { placeholder: "новий код УКТЗЕД" })}
          <label class="field"><span>Прихідна</span><input name="cost" data-field-lock="cost" value="0"></label>
          <label class="field"><span>Валюта приходу</span><select name="costCurrency" data-field-lock="cost">${Object.keys(state.settings.rates).map((currency) => option(currency, currency, currency === "USD")).join("")}</select></label>
          ${productPriceInputs({ price: 0, currency: "UAH", prices: {} })}
          <label class="field"><span>Мін. залишок</span><input name="minStock" type="number" min="0" value="0"></label>
          <label class="field"><span>Поставка, днів</span><input name="leadTimeDays" type="number" min="0" value="14"></label>
          <label class="field wide"><span>SKU маркетплейсу</span><input name="marketplaceSku" placeholder="Rozetka/Prom/Epicentr/Allo"></label>
          <label class="field"><span>Каталог / акція</span><select name="catalogTag">${catalogTagOptions("")}</select></label>
          <label class="field full"><span>Опис / характеристики</span><textarea name="description" placeholder="опис та характеристики для сайту і маркетплейсів"></textarea></label>
          <div class="field full">
            <span>Фото товару</span>
            <input type="file" name="photos" data-product-photos accept="${MARKETPLACE_IMAGE_EXTENSIONS}" multiple>
            <p class="notice small">До 6 фото з комп'ютера. Дозволені формати: JPG/JPEG або PNG. Для синхронізації фото оптимізуються у JPG з білим фоном.</p>
          </div>
          <div id="product-photo-preview" class="photo-preview full" data-product-photo-preview>
            <div class="photo-empty">Фото ще не додані. Дозволено до 6 файлів JPG/JPEG або PNG.</div>
          </div>
          <button class="primary" type="submit">Додати товар</button>
        </form>
      </div>
      <div class="panel">
        <h2>Правила структури</h2>
        <div class="stack">
          <p class="notice">Зброя: модель, калібр, бренд, ЄРЗ так/ні, QR/штрихкод, артикул постачальника, внутрішній код моделі, УКТЗЕД і обов'язковий серійний номер кожної одиниці.</p>
          <p class="notice">Звичайні товари: модель, бренд, QR/штрихкод, артикул постачальника, внутрішній код моделі, УКТЗЕД. Облік кількісний без серій.</p>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="split">
        <h2>Каталог</h2>
        <div class="segmented" data-filter-products>
          <button class="active" data-type="all">Усі</button>
          <button data-type="weapon">Зброя</button>
          <button data-type="regular">Звичайні</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Тип</th><th>Фото</th><th>Бренд / модель</th><th>Категорія</th><th>Калібр</th><th>Коди</th><th>Ціна</th><th>Собівартість</th><th>Залишок</th></tr></thead>
          <tbody id="products-body">${productRows(state.products)}</tbody>
        </table>
      </div>
    </section>
  `;
}

function productRows(products) {
  return products.map((product) => {
    const qty = product.type === "weapon"
      ? state.serials.filter((serial) => serial.productId === product.id && serial.status !== "sold").length
      : state.stock.filter((row) => row.productId === product.id).reduce((sum, row) => sum + row.qty, 0);
    return `
      <tr class="clickable-row" data-product-type="${product.type}" data-open-product="${escapeHtml(product.id)}" title="Відкрити картку товару">
        <td>${product.type === "weapon" ? '<span class="pill danger">зброя</span>' : '<span class="pill good">звичайний</span>'}<br>${product.erzRequired ? '<span class="pill info">ЄРЗ</span>' : ""}</td>
        <td>${productPhotoThumbs(product)}</td>
        <td><strong>${product.brand}</strong><br>${product.model}<br><span class="small muted">${product.description || ""}</span></td>
        <td>${product.category || "-"}<br><span class="small muted">мін: ${product.minStock || 0} · ${product.leadTimeDays || 0} дн.</span></td>
        <td>${product.caliber || "-"}</td>
        <td><span class="small muted">QR/штрих:</span> ${product.barcode}<br><span class="small muted">арт:</span> ${product.supplierSku}<br><span class="small muted">внутр:</span> ${product.internalCode}<br><span class="small muted">УКТЗЕД:</span> ${product.uktzed}</td>
        <td>${productPriceSummary(product)}</td>
        <td>${formatMoney(product.cost, product.costCurrency)}<br><span class="small muted">${formatMoney(uah(product.cost, product.costCurrency))}</span></td>
        <td><strong>${qty}</strong></td>
      </tr>
    `;
  }).join("");
}

function defaultPurchaseLine(productId = "") {
  const product = byId(state.products, productId) || state.products[0];
  return {
    productId: product?.id || "",
    barcode: product?.barcode || product?.qrCode || "",
    qty: 1,
    cost: product?.cost || 0,
    currency: product?.costCurrency || "UAH",
    erzStatus: "pending",
    actual: "true",
    serials: ""
  };
}

function purchaseDraftLines() {
  const lines = Array.isArray(purchaseDraft.lines) && purchaseDraft.lines.length
    ? purchaseDraft.lines
    : [defaultPurchaseLine()];
  return lines.map((line) => ({ ...defaultPurchaseLine(line.productId), ...line }));
}

function renderPurchaseLine(line, index) {
  const product = byId(state.products, line.productId) || state.products[0];
  return `
    <tr data-purchase-line="${index}">
      <td>
        <input name="barcode" data-purchase-line-index="${index}" data-purchase-barcode value="${escapeHtml(line.barcode || product?.barcode || "")}" placeholder="QR / штрихкод" required>
      </td>
      <td class="line-product">
        <select name="productId" data-purchase-line-index="${index}" data-purchase-product>
          ${state.products.map((item) => option(item.id, `${item.type === "weapon" ? "Зброя" : "Товар"} · ${item.brand} ${item.model}`, item.id === product?.id)).join("")}
        </select>
        <span class="small muted">${product ? productCodes(product) : ""}</span>
      </td>
      <td><input name="qty" data-purchase-line-index="${index}" type="number" min="1" value="${escapeHtml(line.qty || 1)}" required></td>
      <td><input name="cost" data-purchase-line-index="${index}" inputmode="decimal" value="${escapeHtml(line.cost ?? product?.cost ?? 0)}"></td>
      <td><select name="currency" data-purchase-line-index="${index}">${Object.keys(state.settings.rates).map((currency) => option(currency, currency, currency === (line.currency || product?.costCurrency || "UAH"))).join("")}</select></td>
      <td>
        <select name="erzStatus" data-purchase-line-index="${index}" ${product?.type === "weapon" ? "" : "disabled"}>
          ${option("pending", "Очікує", (line.erzStatus || "pending") === "pending")}
          ${option("verified", "Перевірено", line.erzStatus === "verified")}
        </select>
      </td>
      <td>
        <select name="actual" data-purchase-line-index="${index}" ${product?.type === "weapon" ? "" : "disabled"}>
          ${option("true", "актуальні", line.actual !== "false")}
          ${option("false", "неактуальні", line.actual === "false")}
        </select>
      </td>
      <td class="line-serials">
        <textarea name="serials" data-purchase-line-index="${index}" ${product?.type === "weapon" ? "required" : "disabled"} placeholder="для зброї: серії через Enter, кому або ;">${escapeHtml(line.serials || "")}</textarea>
        <span class="small muted">${product?.type === "weapon" ? "серій має бути рівно як кількість" : "без серій"}</span>
      </td>
      <td class="row-actions no-print">
        <button class="danger" type="button" data-remove-purchase-line="${index}" ${purchaseDraftLines().length <= 1 ? "disabled" : ""}>Прибрати</button>
      </td>
    </tr>
  `;
}

function collectPurchaseLinesFromForm(form) {
  return Array.from(form.querySelectorAll("[data-purchase-line]")).map((row) => ({
    productId: row.querySelector('[name="productId"]')?.value || "",
    barcode: row.querySelector('[name="barcode"]')?.value || "",
    qty: row.querySelector('[name="qty"]')?.value || 1,
    cost: normalizeDecimalText(row.querySelector('[name="cost"]')?.value || 0),
    currency: row.querySelector('[name="currency"]')?.value || "UAH",
    erzStatus: row.querySelector('[name="erzStatus"]')?.value || "pending",
    actual: row.querySelector('[name="actual"]')?.value || "true",
    serials: row.querySelector('[name="serials"]')?.value || ""
  })).filter((line) => line.productId);
}

function updatePurchaseDraftFromForm(form) {
  const data = formData(form);
  purchaseDraft = {
    ...purchaseDraft,
    documentType: data.documentType,
    date: data.date,
    firmId: data.firmId,
    warehouseId: data.warehouseId,
    supplierId: data.supplierId,
    newSupplier: data.newSupplier,
    supplierDoc: data.supplierDoc,
    accounting: data.accounting,
    comment: data.comment,
    lines: collectPurchaseLinesFromForm(form)
  };
}

function renderPurchases() {
  const docsPeriod = periodFilter("purchaseDocs");
  const filteredPurchases = state.purchases.filter((purchase) => dateInPeriod(purchase.date, docsPeriod));
  const weapons = state.products.filter((product) => product.type === "weapon");
  const pendingBas = state.purchases.filter((purchase) => purchase.accounting && purchase.basStatus !== "exported").length;
  const lines = purchaseDraftLines();
  return `
    <section class="grid two section-band">
      <div class="panel">
        <div class="split">
          <h2>Прихід товару</h2>
          <span class="pill danger">серії зброї = кількість</span>
        </div>
        <form class="stack" data-action="create-purchase">
          <div class="document-header-grid">
            <label class="field"><span>Тип документа</span><select name="documentType">${variantOptions("purchaseDocumentTypes", purchaseDraft.documentType || "Прибуткова накладна")}</select></label>
            <label class="field"><span>Дата</span><input name="date" type="date" value="${escapeHtml(purchaseDraft.date || today)}" required></label>
            <label class="field"><span>Фірма</span><select name="firmId">${state.settings.firms.map((firm) => option(firm.id, firm.name, firm.id === (purchaseDraft.firmId || state.settings.firms[0]?.id || "vat"))).join("")}</select></label>
            <label class="field"><span>Склад</span><select name="warehouseId">${state.warehouses.map((warehouse) => option(warehouse.id, warehouse.name, warehouse.id === (purchaseDraft.warehouseId || "wh-main"))).join("")}</select></label>
            <label class="field wide"><span>Постачальник</span><select name="supplierId">${supplierOptions(purchaseDraft.supplierId || "")}</select></label>
            <label class="field wide"><span>Новий постачальник</span><input name="newSupplier" value="${escapeHtml(purchaseDraft.newSupplier || "")}" placeholder="заповнити, якщо обрано + Новий постачальник"></label>
            <label class="field"><span>Документ постач.</span><input name="supplierDoc" required value="${escapeHtml(purchaseDraft.supplierDoc || "")}" placeholder="номер документа"></label>
            <label class="field"><span>Бухоблік</span><select name="accounting">${option("true", "Позначити для BAS/BAF", purchaseDraft.accounting !== "false")}${option("false", "Не передавати", purchaseDraft.accounting === "false")}</select></label>
          </div>

          <div class="table-wrap invoice-lines">
            <table>
              <thead><tr><th>QR / штрихкод</th><th>Позиція</th><th>К-сть</th><th>Ціна приходу</th><th>Валюта</th><th>ЄРЗ</th><th>Актуальність</th><th>Серійні номери</th><th>Дії</th></tr></thead>
              <tbody>${lines.map((line, index) => renderPurchaseLine(line, index)).join("")}</tbody>
            </table>
          </div>

          <div class="inline-actions no-print">
            <button class="secondary" type="button" data-add-purchase-line>Додати ще товар</button>
            <button class="ghost" type="button" data-view="products">Створити нову позицію</button>
          </div>

          <div class="document-footer-grid">
            <label class="field wide"><span>Коментар</span><textarea name="comment" placeholder="митна декларація, умови поставки, примітки">${escapeHtml(purchaseDraft.comment || "")}</textarea></label>
          </div>

          <button class="primary" type="submit">Провести прихід</button>
        </form>
        <p class="notice warn small">Якщо позиція має тип “Зброя”, документ не проведеться без серій. Система перевіряє, що кількість серій дорівнює кількості, серії не дублюються в документі та не існують у CRM.</p>
      </div>

      <div class="panel">
        <h2>BAS/BAF імпорт та експорт</h2>
        <div class="grid two section-band">
          <article class="card metric info"><span>До експорту BAS</span><strong>${pendingBas}</strong><small>Приходи, позначені для бухобліку.</small></article>
          <article class="card metric good"><span>Зброя в приходах</span><strong>${state.purchases.filter((purchase) => purchase.productType === "weapon").reduce((sum, purchase) => sum + purchase.qty, 0)}</strong><small>Кожна одиниця має серію.</small></article>
        </div>
        <div class="inline-actions section-band">
          <button class="secondary" data-export-bas-purchases>Експорт BAS/BAF JSON</button>
          <button class="ghost" data-bas-import-demo>Імпорт demo BAS</button>
        </div>
        <form class="form-grid" data-action="import-bas-purchases">
          <label class="field full"><span>Імпорт із BAS/BAF JSON</span><textarea name="basPayload" placeholder='{"purchases":[{"date":"2026-05-23","supplier":"BAS supplier","supplierDoc":"BAS-1","firmId":"vat","warehouseId":"wh-main","productId":"p-100","qty":1,"cost":1500,"currency":"USD","serials":["BAS-SERIAL-001"]}]}'></textarea></label>
          <button class="primary" type="submit">Імпортувати прихід</button>
        </form>
        <p class="notice small">Production-обмін із BAS/BAF має йти через API/обробку, але тут уже закладена структура: документи, позиції, серії, склад, фірма, валюта, ознака бухобліку.</p>
      </div>
    </section>

    <section class="panel section-band" data-print-area="purchaseDocs" data-print-title="Проведені приходи">
      <h2>Проведені приходи</h2>
      ${renderPeriodPrintControls("purchaseDocs", "Проведені приходи", docsPeriod, filteredPurchases.length)}
      <div class="table-wrap">
        <table>
          <thead><tr><th>Документ</th><th>Постачальник</th><th>Позиція</th><th>Склад</th><th>Кількість</th><th>Серії</th><th>Собівартість</th><th>BAS/BAF</th><th>Дії</th></tr></thead>
          <tbody>
            ${filteredPurchases.map((purchase) => `
              <tr>
                <td><strong>${purchase.id}</strong><br><span class="small muted">${purchase.date} · ${purchase.supplierDoc || "-"}</span></td>
                <td>${purchase.supplier}<br><span class="small muted">${firmName(purchase.firmId)}</span></td>
                <td>${productName(purchase.productId)}<br><span class="small muted">${purchase.productType === "weapon" ? "серійний облік" : "кількісний облік"}</span></td>
                <td>${warehouseName(purchase.warehouseId)}</td>
                <td>${purchase.qty}</td>
                <td>${purchase.serials?.length ? purchase.serials.map((serial) => `<span class="pill info">${serial}</span>`).join(" ") : "-"}</td>
                <td>${formatMoney(purchase.cost, purchase.currency)}<br><span class="small muted">${formatMoney(uah(purchase.cost, purchase.currency))} / од.</span></td>
                <td>${purchase.accounting ? statusPill(purchase.basStatus || "pending_export") : '<span class="pill">упр. облік</span>'}</td>
                <td class="row-actions">
                  <button class="ghost" data-edit-purchase="${purchase.id}" ${canEditPostedDocument("purchase") ? "" : "disabled"}>Змінити</button>
                  <button class="ghost" data-export-one-purchase="${purchase.id}">JSON</button>
                  <button class="secondary" data-mark-purchase-exported="${purchase.id}" ${purchase.basStatus === "exported" ? "disabled" : ""}>BAS ok</button>
                </td>
              </tr>
            `).join("") || '<tr><td colspan="9" class="muted">Немає приходів за вибраний період.</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel">
      <h2>Актуальні серії зброї з приходів</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Серія</th><th>Модель</th><th>Прихід</th><th>Склад</th><th>Актуальність</th><th>BAS</th><th>ЄРЗ</th></tr></thead>
          <tbody>
            ${state.serials.filter((serial) => weapons.some((product) => product.id === serial.productId)).map((serial) => `
              <tr>
                <td><strong>${serial.serial}</strong></td>
                <td>${productName(serial.productId)}</td>
                <td>${serial.purchaseId || "-"}</td>
                <td>${warehouseName(serial.warehouseId)}</td>
                <td>${serial.actual ? '<span class="pill good">актуальна</span>' : '<span class="pill danger">неактуальна</span>'}</td>
                <td>${serial.basSynced ? '<span class="pill good">BAS ok</span>' : '<span class="pill warn">BAS очікує</span>'}</td>
                <td>${statusPill(serial.erzStatus)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderSerials() {
  const docsPeriod = periodFilter("serialDocs");
  const weapons = state.products.filter((product) => product.type === "weapon");
  const filteredSerials = state.serials.filter((serial) => {
    const purchase = byId(state.purchases, serial.purchaseId);
    return dateInPeriod(purchase?.date || today, docsPeriod);
  });
  return `
    <section class="grid two section-band">
      <div class="panel">
        <h2>Ручне коригування серії</h2>
        <form class="form-grid" data-action="create-serial">
          <label class="field wide"><span>Модель зброї</span><select name="productId">${weapons.map((product) => option(product.id, `${product.brand} ${product.model}`)).join("")}</select></label>
          <label class="field"><span>Серійний номер</span><input name="serial" required></label>
          <label class="field"><span>Склад</span><select name="warehouseId">${state.warehouses.map((warehouse) => option(warehouse.id, warehouse.name)).join("")}</select></label>
          <label class="field"><span>Стан ЄРЗ</span><select name="erzStatus"><option value="pending">Очікує</option><option value="verified">Перевірено</option></select></label>
          <label class="field"><span>Статус</span><select name="status"><option value="available">В наявності</option><option value="responsible_storage">Відповідальне зберігання</option></select></label>
          <label class="field wide"><span>B2B клієнт зберігання</span><select name="clientId"><option value="">Немає</option>${state.clients.filter((client) => client.type === "B2B").map((client) => option(client.id, client.name)).join("")}</select></label>
          <button class="primary" type="submit">Додати серію</button>
        </form>
        <p class="notice warn small">Основний шлях для внесення серій зброї — розділ “Прихід”. Тут залишено ручне коригування для адміністративних виправлень.</p>
      </div>
      <div class="panel">
        <h2>Контроль серій</h2>
        <div class="grid two">
          <article class="card metric good"><span>ЄРЗ перевірено</span><strong>${state.serials.filter((serial) => serial.erzStatus === "verified").length}</strong><small>Дозволено до продажу за наявності дозволу покупця.</small></article>
          <article class="card metric warn"><span>Очікують ЄРЗ</span><strong>${state.serials.filter((serial) => serial.erzStatus === "pending").length}</strong><small>Продаж блокується до перевірки.</small></article>
        </div>
      </div>
    </section>

    <section class="panel" data-print-area="serialDocs" data-print-title="Серійний облік зброї">
      <h2>Серійний облік зброї</h2>
      ${renderPeriodPrintControls("serialDocs", "Серійний облік зброї", docsPeriod, filteredSerials.length)}
      <div class="table-wrap">
        <table>
          <thead><tr><th>Серія</th><th>Модель</th><th>Склад</th><th>Статус</th><th>ЄРЗ</th><th>Клієнт</th><th>Дозвіл</th><th>Дії</th></tr></thead>
          <tbody>
            ${filteredSerials.map((serial) => `
              <tr>
                <td><strong>${serial.serial}</strong></td>
                <td>${productName(serial.productId)}</td>
                <td>${warehouseName(serial.warehouseId)}</td>
                <td>${statusPill(serial.status)}</td>
                <td>${statusPill(serial.erzStatus)}</td>
                <td>${serial.clientId ? clientName(serial.clientId) : "-"}</td>
                <td>${serial.permitNumber ? `${serial.permitNumber}<br><span class="small muted">${serial.permitDate}</span>` : "-"}</td>
                <td class="row-actions">
                  <button class="ghost" data-verify-serial="${serial.id}" ${serial.erzStatus === "verified" ? "disabled" : ""}>ЄРЗ ok</button>
                  <button class="ghost" data-edit-serial="${serial.id}" ${canEditPostedDocument("serialCorrection") ? "" : "disabled"}>Змінити</button>
                </td>
              </tr>
            `).join("") || '<tr><td colspan="8" class="muted">Немає серій за вибраний період.</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function inventoryRows() {
  const rows = [];
  state.products.forEach((product) => {
    if (product.type === "weapon") {
      const grouped = state.serials
        .filter((serial) => serial.productId === product.id && serial.status !== "sold")
        .reduce((acc, serial) => {
          const key = `${serial.warehouseId}:${serial.clientId || ""}:${serial.firmId || "vat"}`;
          acc[key] = acc[key] || { product, warehouseId: serial.warehouseId, clientId: serial.clientId || "", firmId: serial.firmId || "vat", qty: 0 };
          acc[key].qty += 1;
          return acc;
        }, {});
      Object.values(grouped).forEach((row) => rows.push({ ...row, valueUAH: row.qty * uah(product.cost, product.costCurrency) }));
    } else {
      state.stock.filter((row) => row.productId === product.id).forEach((stockRow) => {
        rows.push({ product, ...stockRow, valueUAH: stockRow.qty * uah(product.cost, product.costCurrency) });
      });
    }
  });
  return rows;
}

function clientResponsibleWarehouse(clientId) {
  let warehouse = state.warehouses.find((item) => item.kind === "client_responsible" && item.clientId === clientId);
  if (!warehouse) {
    const client = byId(state.clients, clientId);
    warehouse = {
      id: uniqueId(`wh-client-${clientId}`),
      name: `Склад клієнта · ${client?.name || clientId}`,
      kind: "client_responsible",
      clientId
    };
    state.warehouses.push(warehouse);
  }
  return warehouse;
}

function isOwnStockRow(row) {
  const warehouse = byId(state.warehouses, row.warehouseId);
  return !row.clientId && !["client_responsible", "responsible"].includes(warehouse?.kind);
}

function inferFirmIdForStockRow(row, purchases = []) {
  if (row.firmId) return row.firmId;
  const matches = purchases.filter((purchase) => purchase.productId === row.productId && purchase.warehouseId === row.warehouseId);
  const firmIds = uniqueList(matches.map((purchase) => purchase.firmId).filter(Boolean));
  return firmIds.length === 1 ? firmIds[0] : "vat";
}

function normalizeStockRows(rows = [], next = { purchases: [] }) {
  const purchases = next.purchases || [];
  return rows.map((row) => ({
    ...row,
    firmId: inferFirmIdForStockRow(row, purchases)
  }));
}

function stockRowMatches(row, { warehouseId = "", firmId = "", clientId = "" } = {}) {
  if (warehouseId && row.warehouseId !== warehouseId) return false;
  if (firmId && (row.firmId || "vat") !== firmId) return false;
  return (row.clientId || "") === (clientId || "");
}

function ownStockPredicate({ warehouseId = "", firmId = "" } = {}) {
  return (row) => isOwnStockRow(row) && stockRowMatches(row, { warehouseId, firmId, clientId: "" });
}

function stockContextMessage(productId, qty, warehouseId = "", firmId = "") {
  const parts = [`Недостатньо залишку: ${productName(productId)}`, `потрібно ${qty} од.`];
  if (warehouseId) parts.push(`склад ${warehouseName(warehouseId)}`);
  if (firmId) parts.push(`фірма ${firmName(firmId)}`);
  return `${parts.join(" · ")}.`;
}

function stockQtyWhere(productId, predicate) {
  return state.stock
    .filter((row) => row.productId === productId && Number(row.qty || 0) > 0 && predicate(row))
    .reduce((sum, row) => sum + Number(row.qty || 0), 0);
}

function decrementStockWhere(productId, qty, predicate, errorMessage) {
  const amount = Number(qty || 0);
  if (stockQtyWhere(productId, predicate) < amount) {
    throw new Error(errorMessage || "Недостатньо залишку для списання.");
  }
  let remaining = amount;
  const rows = state.stock.filter((row) => row.productId === productId && Number(row.qty || 0) > 0 && predicate(row));
  for (const row of rows) {
    const take = Math.min(Number(row.qty || 0), remaining);
    row.qty -= take;
    remaining -= take;
    if (remaining <= 0) break;
  }
}

function ownAvailableSerialsForProduct(product) {
  return state.serials
    .filter((serial) => serialMatchesProduct(serial, product) && serial.status === "available" && !serial.clientId)
    .filter((serial) => !serialIsSold(serial) && serial.actual !== false)
    .sort((first, second) => first.serial.localeCompare(second.serial, "uk"));
}

function clientStorageSerials(clientId, productId = "", includeSold = false) {
  return state.serials
    .filter((serial) => serial.clientId === clientId)
    .filter((serial) => !productId || serial.productId === productId)
    .filter((serial) => includeSold || serial.status === "responsible_storage")
    .sort((first, second) => Number(first.status === "sold") - Number(second.status === "sold") || first.serial.localeCompare(second.serial, "uk"));
}

function b2bSerialOption(serial, selectedIds = [], mode = "sale") {
  const product = byId(state.products, serial.productId);
  const canSelect = mode === "shipment"
    ? serial.status === "available" && !serial.clientId && !serialIsSold(serial) && serial.actual !== false
    : serial.status === "responsible_storage" && serialIsSelectable(serial);
  const className = canSelect ? "serial-available" : serialIsSold(serial) ? "serial-sold" : "serial-blocked";
  const label = `${serial.serial} · ${product?.model || "модель"} · ${warehouseName(serial.warehouseId)} · ${firmName(serial.firmId || "vat")} · ${serialStatusText(serial)}`;
  return `<option value="${escapeHtml(serial.id)}" ${selectedIds.includes(serial.id) ? "selected" : ""} ${canSelect ? "" : "disabled"} class="${className}">${escapeHtml(label)}</option>`;
}

function responsibleDocSoldQty(doc) {
  if (doc.soldQty !== undefined) return Number(doc.soldQty || 0);
  return (doc.serialIds || []).filter((serialId) => {
    const serial = byId(state.serials, serialId);
    return serial ? serialIsSold(serial) : false;
  }).length;
}

function responsibleDocRemainingQty(doc) {
  return Math.max(Number(doc.qty || 0) - responsibleDocSoldQty(doc), 0);
}

function responsibleDocStatus(doc) {
  const sold = responsibleDocSoldQty(doc);
  if (responsibleDocRemainingQty(doc) <= 0 && Number(doc.qty || 0) > 0) return "ownership_transferred";
  if (sold > 0) return "reported_sale";
  return doc.status || "in_storage";
}

function ownershipLabel(doc) {
  return responsibleDocStatus(doc) === "ownership_transferred"
    ? "перейшла клієнту після продажу"
    : "наша до продажу клієнтом";
}

function responsibleStorageRows(clientId = "") {
  return state.responsibleStorageDocs
    .filter((doc) => !clientId || doc.clientId === clientId)
    .map((doc) => ({
      ...doc,
      client: byId(state.clients, doc.clientId),
      product: byId(state.products, doc.productId),
      warehouse: byId(state.warehouses, doc.warehouseId),
      soldQty: responsibleDocSoldQty(doc),
      remainingQty: responsibleDocRemainingQty(doc),
      derivedStatus: responsibleDocStatus(doc)
    }));
}

function b2bResponsibleStorageFilter() {
  const filter = state.b2bResponsibleStorageFilters || {};
  const sortBy = ["document", "date", "client", "product", "qty", "sold", "remaining", "serials", "paymentDays", "status"].includes(filter.sortBy)
    ? filter.sortBy
    : "date";
  return {
    from: filter.from || "",
    to: filter.to || "",
    clientId: filter.clientId || "",
    productId: filter.productId || "",
    search: filter.search || "",
    sortBy,
    sortDir: filter.sortDir === "asc" ? "asc" : "desc",
    expanded: Boolean(filter.expanded)
  };
}

function responsibleStorageStatusLabel(row) {
  return plainTextFromHtml(statusPill(row.derivedStatus || row.status)) || row.derivedStatus || row.status || "";
}

function responsibleStorageSerialText(row) {
  return (row.serialIds || []).map((serialId) => byId(state.serials, serialId)?.serial || serialId).join(" ");
}

function responsibleStorageSearchText(row) {
  return normalizeSearchText([
    row.id,
    row.date,
    row.manager,
    row.client?.name || clientName(row.clientId),
    row.warehouse?.name || warehouseName(row.warehouseId),
    productName(row.productId),
    productCodes(row.product),
    row.qty,
    row.soldQty,
    row.remainingQty,
    responsibleStorageSerialText(row),
    row.paymentDays || state.settings.defaultDueDays,
    responsibleStorageStatusLabel(row),
    ownershipLabel(row),
    row.comment
  ].filter(Boolean).join(" "));
}

function responsibleStorageMatchesSearch(row, filter) {
  const words = Array.isArray(filter) ? filter : searchWords(filter.search || filter);
  if (!words.length) return true;
  const haystack = responsibleStorageSearchText(row);
  return words.every((word) => haystack.includes(word));
}

function responsibleStorageSortValue(row, key) {
  const values = {
    document: `${row.id || ""} ${row.manager || ""}`,
    date: row.date || "",
    client: `${row.client?.name || clientName(row.clientId)} ${row.warehouse?.name || warehouseName(row.warehouseId)}`,
    product: `${productName(row.productId)} ${productCodes(row.product)}`,
    qty: Number(row.qty || 0),
    sold: Number(row.soldQty || 0),
    remaining: Number(row.remainingQty || 0),
    serials: responsibleStorageSerialText(row),
    paymentDays: Number(row.paymentDays || state.settings.defaultDueDays || 0),
    status: `${responsibleStorageStatusLabel(row)} ${ownershipLabel(row)}`
  };
  return values[key] ?? "";
}

function sortResponsibleStorageRows(rows, filter) {
  const direction = filter.sortDir === "asc" ? 1 : -1;
  return [...rows].sort((first, second) => {
    const result = compareSortValues(
      responsibleStorageSortValue(first, filter.sortBy),
      responsibleStorageSortValue(second, filter.sortBy)
    );
    if (result) return result * direction;
    return String(second.date || "").localeCompare(String(first.date || ""), "uk", { numeric: true, sensitivity: "base" });
  });
}

function b2bShipmentRequestRows(clientId = "") {
  return (state.b2bShipmentRequests || [])
    .filter((request) => (
      (!clientId || request.clientId === clientId)
      && (clientId || !["request_draft", "request_cancelled"].includes(request.status))
    ))
    .map((request) => ({
      ...request,
      client: byId(state.clients, request.clientId),
      product: byId(state.products, request.productId),
      issues: ["request_draft", "request_approved", "request_rejected", "request_cancelled"].includes(request.status) ? [] : b2bShipmentRequestIssues(request, { requireManagerFields: true })
    }));
}

function b2bShipmentRequestFilter() {
  const filter = state.b2bShipmentRequestFilters || {};
  const sortBy = ["date", "client", "product", "qty", "desiredDate", "status", "issues"].includes(filter.sortBy)
    ? filter.sortBy
    : "date";
  return {
    from: filter.from || "",
    to: filter.to || "",
    status: filter.status || "",
    search: filter.search || "",
    sortBy,
    sortDir: filter.sortDir === "asc" ? "asc" : "desc",
    expanded: Boolean(filter.expanded)
  };
}

function plainTextFromHtml(value) {
  return String(value ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function b2bShipmentRequestStatusLabel(status) {
  return B2B_SHIPMENT_REQUEST_STATUS_MAP[status]?.label || plainTextFromHtml(statusPill(status)) || status || "";
}

function b2bShipmentRequestIssueText(row) {
  return plainTextFromHtml(b2bShipmentRequestIssueHtml(row.issues || [], true));
}

function b2bShipmentRequestSearchText(row) {
  return normalizeSearchText([
    row.id,
    row.date,
    row.client?.name || clientName(row.clientId),
    row.manager,
    productName(row.productId),
    productCodes(row.product),
    row.qty,
    row.desiredDate,
    row.status,
    b2bShipmentRequestStatusLabel(row.status),
    row.responsibleDocId,
    b2bShipmentRequestIssueText(row),
    row.comment,
    row.delivery,
    row.ttn,
    row.firmId,
    row.warehouseId,
    row.currency,
    row.price
  ].filter(Boolean).join(" "));
}

function b2bShipmentRequestMatchesSearch(row, filter) {
  const words = Array.isArray(filter) ? filter : searchWords(filter.search || filter);
  if (!words.length) return true;
  const haystack = b2bShipmentRequestSearchText(row);
  return words.every((word) => haystack.includes(word));
}

function b2bShipmentRequestSortValue(row, key) {
  const values = {
    date: `${row.date || ""} ${row.id || ""}`,
    client: `${row.client?.name || clientName(row.clientId)} ${row.manager || ""}`,
    product: `${productName(row.productId)} ${productCodes(row.product)}`,
    qty: Number(row.qty || 0),
    desiredDate: row.desiredDate || "",
    status: b2bShipmentRequestStatusLabel(row.status),
    issues: b2bShipmentRequestIssueText(row)
  };
  return values[key] ?? "";
}

function sortB2BShipmentRequestRows(rows, filter) {
  const direction = filter.sortDir === "asc" ? 1 : -1;
  return [...rows].sort((first, second) => {
    const result = compareSortValues(
      b2bShipmentRequestSortValue(first, filter.sortBy),
      b2bShipmentRequestSortValue(second, filter.sortBy)
    );
    if (result) return result * direction;
    return String(second.date || "").localeCompare(String(first.date || ""), "uk", { numeric: true, sensitivity: "base" });
  });
}

function findOpenB2BShipmentRequest(clientId, productId, desiredDate = "", statuses = ["request_new", "request_review", "request_draft"]) {
  const normalizedDate = desiredDate || "";
  return (state.b2bShipmentRequests || []).find((request) => (
    request.clientId === clientId
    && request.productId === productId
    && (request.desiredDate || "") === normalizedDate
    && statuses.includes(request.status)
  ));
}

function b2bShipmentRequestIssues(request = {}, options = {}) {
  const issues = [];
  const client = byId(state.clients, request.clientId);
  const product = byId(state.products, request.productId);
  const qty = Number(request.qty || 0);
  const firmId = request.firmId || "";
  const warehouseId = request.warehouseId || "";
  const serialIds = Array.isArray(request.serialIds) ? request.serialIds : [];

  if (!client || client.type !== "B2B") issues.push("Оберіть чинного B2B клієнта для заявки.");
  if (!product) issues.push("Оберіть товар із каталогу CRM. Заявка не може перейти в накладну без картки товару.");
  if (qty <= 0) issues.push("Кількість у заявці має бути більшою за нуль.");
  if (!product || qty <= 0) return issues;

  if (options.requireManagerFields) {
    if (!firmId) issues.push("Менеджеру потрібно обрати фірму-власника, з якої буде відвантаження.");
    if (!warehouseId) issues.push("Менеджеру потрібно обрати склад, з якого буде відвантаження.");
    if (request.price === "" || request.price === undefined) issues.push("Менеджеру потрібно вказати ціну відвантаження.");
    if (!request.currency) issues.push("Менеджеру потрібно обрати валюту документа.");
    if (request.paymentDays === "" || request.paymentDays === undefined) issues.push("Менеджеру потрібно вказати термін оплати після продажу.");
  }

  if (!firmId || !warehouseId) return issues;

  if (product.type !== "weapon") {
    const available = stockQtyWhere(product.id, ownStockPredicate({ warehouseId, firmId }));
    if (available < qty) {
      issues.push(`${stockContextMessage(product.id, qty, warehouseId, firmId)} Доступно зараз: ${available} од.`);
    }
    return issues;
  }

  const availableSerials = ownAvailableSerialsForProduct(product)
    .filter((serial) => serialMatchesStockContext(serial, { warehouseId, firmId, clientId: "" }));
  const availableIds = new Set(availableSerials.map((serial) => serial.id));
  if (availableSerials.length < qty) {
    issues.push(`Недостатньо вільних серій для ${productName(product.id)} по фірмі ${firmName(firmId)} і складу ${warehouseName(warehouseId)}: доступно ${availableSerials.length}, потрібно ${qty}.`);
  }
  if (serialIds.length !== qty) {
    issues.push(`Для зброї кількість (${qty}) має дорівнювати кількості вибраних серій (${serialIds.length}).`);
  }
  const duplicates = duplicateValues(serialIds);
  if (duplicates.length) issues.push(`Серійний номер вибрано повторно: ${duplicates.join(", ")}.`);

  serialIds.forEach((serialId) => {
    const serial = byId(state.serials, serialId);
    if (!serial) {
      issues.push(`Серійний номер ${serialId} не знайдено в CRM.`);
      return;
    }
    if (!serialMatchesProduct(serial, product)) issues.push(`Серія ${serial.serial} належить іншій моделі, а не ${productName(product.id)}.`);
    if ((serial.firmId || "vat") !== firmId) issues.push(`Серія ${serial.serial} належить фірмі ${firmName(serial.firmId || "vat")}, а в заявці вибрано ${firmName(firmId)}.`);
    if (serial.warehouseId !== warehouseId) issues.push(`Серія ${serial.serial} лежить на складі ${warehouseName(serial.warehouseId)}, а в заявці вибрано ${warehouseName(warehouseId)}.`);
    if (serial.clientId) issues.push(`Серія ${serial.serial} вже закріплена за клієнтом ${clientName(serial.clientId)}.`);
    if (serial.status !== "available") issues.push(`Серія ${serial.serial} має статус "${serial.status}" і не є вільною для відвантаження.`);
    if (serialIsSold(serial)) issues.push(`Серія ${serial.serial} вже продана. Повторний вибір заблоковано.`);
    if (serial.actual === false) issues.push(`Серія ${serial.serial} неактуальна.`);
    if (!availableIds.has(serial.id)) issues.push(`Серія ${serial.serial} не проходить перевірку доступності для вибраної фірми та товару.`);
  });

  return uniqueList(issues);
}

function stockQtyText(qty) {
  return new Intl.NumberFormat("uk-UA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3
  }).format(Number(qty || 0));
}

function b2bRequestAvailabilityRows(product, requestedQty = 0) {
  if (!product) return [];
  const requested = Number(requestedQty || 0);
  const groups = new Map();
  const groupFor = (firmId = "vat", warehouseId = "") => {
    const normalizedFirmId = firmId || "vat";
    const key = `${normalizedFirmId}::${warehouseId}`;
    if (!groups.has(key)) {
      groups.set(key, {
        firmId: normalizedFirmId,
        warehouseId,
        qty: 0,
        serialIds: []
      });
    }
    return groups.get(key);
  };

  if (product.type === "weapon") {
    ownAvailableSerialsForProduct(product).forEach((serial) => {
      const warehouse = byId(state.warehouses, serial.warehouseId);
      if (!warehouse || ["client_responsible", "responsible"].includes(warehouse.kind)) return;
      const group = groupFor(serial.firmId || "vat", serial.warehouseId);
      group.qty += 1;
      group.serialIds.push(serial.id);
    });
  } else {
    state.stock.forEach((row) => {
      const qty = Number(row.qty || 0);
      if (row.productId !== product.id || qty <= 0 || !isOwnStockRow(row)) return;
      groupFor(row.firmId || "vat", row.warehouseId).qty += qty;
    });
  }

  return [...groups.values()]
    .map((row) => ({
      ...row,
      enough: requested > 0 ? row.qty >= requested : row.qty > 0
    }))
    .sort((first, second) => (
      Number(second.enough) - Number(first.enough)
      || second.qty - first.qty
      || firmName(first.firmId).localeCompare(firmName(second.firmId), "uk")
      || warehouseName(first.warehouseId).localeCompare(warehouseName(second.warehouseId), "uk")
    ));
}

function renderB2BRequestAvailability(product, qty, selectedFirmId = "", selectedWarehouseId = "") {
  const rows = b2bRequestAvailabilityRows(product, qty);
  const requested = Number(qty || 0);
  const productTitle = product ? productName(product.id) : "товар";
  const emptyText = product
    ? "Немає вільного залишку цього товару на наших складах. Менеджер має змінити товар, кількість або перевірити прихід."
    : "Оберіть товар, щоб побачити залишки по фірмах і складах.";

  if (!rows.length) {
    return `
      <section class="b2b-stock-advisor full">
        <div class="split">
          <div>
            <h3>Довідково: наявність по фірмах і складах</h3>
            <p class="small muted">Товар: ${escapeHtml(productTitle)}. Потрібно: ${stockQtyText(requested)} од.</p>
          </div>
        </div>
        <p class="notice warn small">${escapeHtml(emptyText)}</p>
      </section>
    `;
  }

  return `
    <section class="b2b-stock-advisor full">
      <div class="split">
        <div>
          <h3>Довідково: наявність по фірмах і складах</h3>
          <p class="small muted">Товар: ${escapeHtml(productTitle)}. Це тільки підказка для менеджера, клієнт ці залишки не бачить.</p>
        </div>
        <span class="pill info">потрібно ${stockQtyText(requested)} од.</span>
      </div>
      <div class="table-wrap compact-table">
        <table>
          <thead>
            <tr><th>Фірма</th><th>Склад</th><th>Доступно</th><th>Покриття</th><th>Серії / примітка</th><th>Дія</th></tr>
          </thead>
          <tbody>
            ${rows.map((row) => {
              const isCurrent = row.firmId === selectedFirmId && row.warehouseId === selectedWarehouseId;
              const details = product?.type === "weapon"
                ? `${serialBadges(row.serialIds.slice(0, 12))}${row.serialIds.length > 12 ? ` <span class="small muted">+${row.serialIds.length - 12}</span>` : ""}`
                : '<span class="small muted">Звичайний товар. Серійні номери не потрібні.</span>';
              const action = isCurrent
                ? '<span class="pill info">обрано</span>'
                : `<button class="secondary" type="button" data-fill-b2b-request-stock data-firm-id="${escapeHtml(row.firmId)}" data-warehouse-id="${escapeHtml(row.warehouseId)}">Вибрати</button>`;
              return `
                <tr class="${isCurrent ? "selected-context" : ""}">
                  <td>${escapeHtml(firmName(row.firmId))}</td>
                  <td>${escapeHtml(warehouseName(row.warehouseId))}</td>
                  <td><strong>${stockQtyText(row.qty)} од.</strong></td>
                  <td><span class="${row.enough ? "stock-enough" : "stock-short"}">${row.enough ? "вистачає" : "не вистачає"}</span></td>
                  <td>${details}</td>
                  <td>${action}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function b2bShipmentRequestIssueHtml(issues = [], compact = false) {
  if (!issues.length) return '<p class="notice good small">Перевірка пройдена. Заявку можна перетворити на накладну відвантаження.</p>';
  const list = (compact ? issues.slice(0, 2) : issues).map((issue) => `<li>${escapeHtml(issue)}</li>`).join("");
  const more = compact && issues.length > 2 ? `<li>Ще ${issues.length - 2} помилок відкрийте в підготовці заявки.</li>` : "";
  return `<div class="notice danger small request-errors"><strong>Потрібно виправити менеджеру:</strong><ul>${list}${more}</ul></div>`;
}

function clientStorageRows(clientId) {
  return inventoryRows().filter((row) => row.clientId === clientId);
}

function inventoryRowMatchesFilter(row, filter = state.inventoryFilters || {}) {
  if (filter.warehouseId && row.warehouseId !== filter.warehouseId) return false;
  if (filter.firmId && (row.firmId || "vat") !== filter.firmId) return false;
  return true;
}

function filteredInventoryRows() {
  return inventoryRows().filter((row) => inventoryRowMatchesFilter(row));
}

function renderInventoryFilters(filter, totalRows, filteredRows) {
  return `
    <form class="period-toolbar no-print" data-inventory-filter>
      <label>
        <span>Склад</span>
        <select name="warehouseId">
          <option value="">Всі склади</option>
          ${state.warehouses.map((warehouse) => option(warehouse.id, warehouse.name, warehouse.id === filter.warehouseId)).join("")}
        </select>
      </label>
      <label>
        <span>Фірма</span>
        <select name="firmId">
          <option value="">Всі фірми</option>
          ${state.settings.firms.map((firm) => option(firm.id, firm.name, firm.id === filter.firmId)).join("")}
        </select>
      </label>
      <span class="pill info">Показано ${filteredRows} з ${totalRows}</span>
    </form>
  `;
}

function serialBadges(serialIds = []) {
  if (!serialIds.length) return "-";
  return serialIds.map((serialId) => {
    const serial = byId(state.serials, serialId);
    if (!serial) return "";
    const kind = serial.status === "sold" ? "danger" : serial.status === "responsible_storage" ? "info" : "good";
    return `<span class="pill ${kind}">${escapeHtml(serial.serial)}</span>`;
  }).filter(Boolean).join(" ");
}

function productCodes(product) {
  return [product?.barcode, product?.qrCode].filter(Boolean).join(" / ") || "-";
}

function safeFilePart(value) {
  return String(value || "report").replace(/[^a-zA-Z0-9А-Яа-яІіЇїЄєҐґ_-]+/g, "-").replace(/-+/g, "-").slice(0, 80);
}

function renderWarehouse() {
  const docsPeriod = periodFilter("warehouseDocs");
  const inventoryFilter = state.inventoryFilters || {};
  const allRows = inventoryRows();
  const rows = allRows.filter((row) => inventoryRowMatchesFilter(row, inventoryFilter));
  const visibleWarehouses = inventoryFilter.warehouseId
    ? state.warehouses.filter((warehouse) => warehouse.id === inventoryFilter.warehouseId)
    : state.warehouses;
  return `
    <section class="grid three section-band">
      ${visibleWarehouses.map((warehouse) => {
        const whRows = rows.filter((row) => row.warehouseId === warehouse.id);
        const qty = whRows.reduce((sum, row) => sum + row.qty, 0);
        const value = whRows.reduce((sum, row) => sum + row.valueUAH, 0);
        return `<article class="card metric ${warehouse.kind === "responsible" ? "info" : "good"}"><span>${warehouse.name}</span><strong>${qty} од.</strong><small>${formatMoney(value)} в обліковій валюті</small></article>`;
      }).join("")}
    </section>

    <section class="panel section-band" data-print-area="warehouseDocs" data-print-title="Інвентаризація та залишки">
      <div class="split">
        <h2>Інвентаризація та залишки</h2>
        <button class="secondary" data-create-inventory-report>Сформувати звіт</button>
      </div>
      ${renderPeriodPrintControls("warehouseDocs", "Інвентаризація та залишки", docsPeriod, rows.length)}
      ${renderInventoryFilters(inventoryFilter, allRows.length, rows.length)}
      <div class="table-wrap">
        <table>
          <thead><tr><th>Товар</th><th>Тип</th><th>Фірма</th><th>Склад</th><th>B2B власник</th><th>Кількість</th><th>Валюта приходу</th><th>Собівартість UAH</th></tr></thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                <td><strong>${row.product.brand}</strong><br>${row.product.model}</td>
                <td>${row.product.type === "weapon" ? "серійний" : "кількісний"}</td>
                <td>${firmName(row.firmId || "vat")}</td>
                <td>${warehouseName(row.warehouseId)}</td>
                <td>${row.clientId ? clientName(row.clientId) : "-"}</td>
                <td>${row.qty}</td>
                <td>${formatMoney(row.product.cost, row.product.costCurrency)}</td>
                <td>${formatMoney(row.valueUAH)}</td>
              </tr>
            `).join("") || '<tr><td colspan="8" class="muted">Немає залишків за вибраним складом або фірмою.</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderB2BLegacy() {
  return `
    <section class="grid three section-band">
      ${state.clients.filter((client) => client.type === "B2B").map((client) => {
        const receivable = state.invoices.filter((invoice) => invoice.clientId === client.id && isDebtInvoice(invoice)).reduce((sum, invoice) => sum + invoice.total - invoice.paid, 0);
        const storageQty = inventoryRows().filter((row) => row.clientId === client.id).reduce((sum, row) => sum + row.qty, 0);
        return `
          <article class="card stack">
            <div class="split">
              <div>
                <strong>${client.name}</strong>
                <p class="small muted">${client.manager} · ${client.paymentTerms}</p>
              </div>
              ${client.cabinetEnabled ? '<span class="pill good">кабінет</span>' : '<span class="pill">немає</span>'}
            </div>
            <div class="grid two">
              <div><span class="small muted">Дебіторка</span><br><strong>${formatMoney(receivable)}</strong></div>
              <div><span class="small muted">Відп. зберігання</span><br><strong>${storageQty} од.</strong></div>
            </div>
            <button class="secondary" data-open-cabinet="${client.id}">Відкрити кабінет</button>
          </article>
        `;
      }).join("")}
    </section>

    <section class="panel">
      <h2>Кабінет B2B клієнта</h2>
      <p class="notice">Клієнт може бачити власний залишок на відповідальному зберіганні, вести роздрібні продажі через наш інтерфейс, отримувати інвентаризаційний звіт та звіт проплат. Для зброї в кабінеті можна лише резервувати одиницю, продаж підтверджує менеджер із правом продажу зброї.</p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Клієнт</th><th>Ліміт</th><th>Умови</th><th>Накладні</th><th>Проплати</th><th>Менеджер</th></tr></thead>
          <tbody>
            ${state.clients.filter((client) => client.type === "B2B").map((client) => {
              const invoices = state.invoices.filter((invoice) => invoice.clientId === client.id && isDebtInvoice(invoice));
              const paid = invoices.reduce((sum, invoice) => sum + invoice.paid, 0);
              return `
                <tr>
                  <td><strong>${client.name}</strong></td>
                  <td>${formatMoney(client.creditLimitUAH)}</td>
                  <td>${client.paymentTerms}</td>
                  <td>${invoices.length}</td>
                  <td>${formatMoney(paid)}</td>
                  <td>${client.manager}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderB2BShipmentRequestFilters(filter, resultCount, totalCount) {
  return `
    <form class="period-toolbar marketplace-filter no-print" data-action="filter-b2b-shipment-requests" data-b2b-shipment-request-filter>
      <label class="field compact"><span>Дата створення від</span><input name="from" type="date" value="${escapeHtml(filter.from)}"></label>
      <label class="field compact"><span>Дата створення до</span><input name="to" type="date" value="${escapeHtml(filter.to)}"></label>
      <label class="field compact"><span>Статус виконання</span><select name="status">
        <option value="">Всі статуси</option>
        ${B2B_SHIPMENT_REQUEST_STATUSES.map((item) => option(item.id, item.label, item.id === filter.status)).join("")}
      </select></label>
      <label class="field wide"><span>Пошук у списку</span><input name="search" data-b2b-shipment-request-search value="${escapeHtml(filter.search)}" placeholder="клієнт, товар, код, заявка, статус, менеджер"></label>
      <span class="pill info" data-b2b-shipment-request-result-count>${resultCount} із ${totalCount} заявок</span>
      <button class="ghost" type="button" data-reset-b2b-shipment-request-filter>Скинути</button>
    </form>
  `;
}

function renderB2BShipmentRequestSortHeader(key, label, filter) {
  const active = filter.sortBy === key;
  const direction = active && filter.sortDir === "asc" ? "ascending" : active ? "descending" : "none";
  const indicator = active ? (filter.sortDir === "asc" ? "↑" : "↓") : "↕";
  return `
    <th aria-sort="${direction}">
      <button class="table-sort ${active ? "active" : ""}" type="button" data-b2b-shipment-request-sort="${escapeHtml(key)}">
        <span>${escapeHtml(label)}</span><span class="sort-indicator" aria-hidden="true">${indicator}</span>
      </button>
    </th>
  `;
}

function renderB2BShipmentRequestRow(row, visible = true) {
  return `
    <tr data-b2b-shipment-request-row data-b2b-request-search-text="${escapeHtml(b2bShipmentRequestSearchText(row))}" ${visible ? "" : 'style="display: none;"'}>
      <td><strong>${escapeHtml(row.id)}</strong><br><span class="small muted">${escapeHtml(row.date)}</span></td>
      <td>${escapeHtml(row.client?.name || clientName(row.clientId))}<br><span class="small muted">${escapeHtml(row.manager || "-")}</span></td>
      <td>${escapeHtml(productName(row.productId))}<br><span class="small muted">${escapeHtml(productCodes(row.product))}</span></td>
      <td>${escapeHtml(row.qty)}</td>
      <td>${escapeHtml(row.desiredDate || "-")}</td>
      <td>${statusPill(row.status)}${row.responsibleDocId ? `<br><span class="small muted">${escapeHtml(row.responsibleDocId)}</span>` : ""}</td>
      <td>${b2bShipmentRequestIssueHtml(row.issues, true)}</td>
      <td class="row-actions">
        <button class="secondary" data-open-b2b-shipment-request="${escapeHtml(row.id)}" ${["request_approved", "request_rejected", "request_cancelled"].includes(row.status) ? "disabled" : ""}>Підготувати</button>
        <button class="ghost danger" data-reject-b2b-shipment-request="${escapeHtml(row.id)}" ${["request_approved", "request_rejected", "request_cancelled"].includes(row.status) ? "disabled" : ""}>Відхилити</button>
      </td>
    </tr>
  `;
}

function applyB2BShipmentRequestSearch(root = document) {
  const input = root.querySelector("[data-b2b-shipment-request-search]");
  const details = root.querySelector("[data-b2b-shipment-requests-dropdown]");
  if (!input || !details) return;
  const words = searchWords(input.value);
  const rows = Array.from(details.querySelectorAll("[data-b2b-shipment-request-row]"));
  let visibleCount = 0;
  rows.forEach((row) => {
    const haystack = row.dataset.b2bRequestSearchText || "";
    const visible = words.every((word) => haystack.includes(word));
    row.style.display = visible ? "" : "none";
    if (visible) visibleCount += 1;
  });
  const emptyRow = details.querySelector("[data-b2b-shipment-request-empty]");
  if (emptyRow) emptyRow.style.display = visibleCount ? "none" : "";
  const resultCount = root.querySelector("[data-b2b-shipment-request-result-count]");
  if (resultCount) resultCount.textContent = `${visibleCount} із ${rows.length} заявок`;
  const summaryCount = details.querySelector("[data-b2b-shipment-request-summary-count]");
  if (summaryCount) summaryCount.textContent = `${visibleCount} рядків`;
  if (words.length) details.open = true;
  updateDropdownHint(details);
}

function renderResponsibleStorageFilters(filter, resultCount, totalCount, rows) {
  const clientIds = uniqueList(rows.map((row) => row.clientId).filter(Boolean));
  const productIds = uniqueList(rows.map((row) => row.productId).filter(Boolean));
  return `
    <form class="period-toolbar marketplace-filter no-print" data-action="filter-b2b-responsible-storage" data-b2b-responsible-storage-filter>
      <label class="field compact"><span>Дата створення від</span><input name="from" type="date" value="${escapeHtml(filter.from)}"></label>
      <label class="field compact"><span>Дата створення до</span><input name="to" type="date" value="${escapeHtml(filter.to)}"></label>
      <label class="field compact"><span>Клієнт</span><select name="clientId">
        <option value="">Всі клієнти</option>
        ${clientIds.map((clientId) => option(clientId, clientName(clientId), clientId === filter.clientId)).join("")}
      </select></label>
      <label class="field wide"><span>Товар</span><select name="productId">
        <option value="">Всі товари</option>
        ${productIds.map((productId) => option(productId, productName(productId), productId === filter.productId)).join("")}
      </select></label>
      <label class="field wide"><span>Пошук у списку</span><input name="search" data-b2b-responsible-storage-search value="${escapeHtml(filter.search)}" placeholder="документ, клієнт, товар, серія, склад, статус"></label>
      <span class="pill info" data-b2b-responsible-storage-result-count>${resultCount} із ${totalCount} рядків</span>
      <button class="secondary" type="button" data-print-scope="b2bDocs" ${canPrintDocuments() ? "" : "disabled"}>Друк</button>
      <button class="ghost" type="button" data-reset-b2b-responsible-storage-filter>Скинути</button>
    </form>
  `;
}

function renderResponsibleStorageSortHeader(key, label, filter) {
  const active = filter.sortBy === key;
  const direction = active && filter.sortDir === "asc" ? "ascending" : active ? "descending" : "none";
  const indicator = active ? (filter.sortDir === "asc" ? "↑" : "↓") : "↕";
  return `
    <th aria-sort="${direction}">
      <button class="table-sort ${active ? "active" : ""}" type="button" data-b2b-responsible-storage-sort="${escapeHtml(key)}">
        <span>${escapeHtml(label)}</span><span class="sort-indicator" aria-hidden="true">${indicator}</span>
      </button>
    </th>
  `;
}

function renderResponsibleStorageRow(row, visible = true) {
  return `
    <tr data-b2b-responsible-storage-row data-b2b-storage-search-text="${escapeHtml(responsibleStorageSearchText(row))}" ${visible ? "" : 'style="display: none;"'}>
      <td><strong>${escapeHtml(row.id)}</strong><br><span class="small muted">${escapeHtml(row.manager || "-")}</span></td>
      <td>${escapeHtml(row.date)}</td>
      <td><strong>${escapeHtml(row.client?.name || clientName(row.clientId))}</strong><br><span class="small muted">${escapeHtml(row.warehouse?.name || warehouseName(row.warehouseId))}</span></td>
      <td>${escapeHtml(productName(row.productId))}<br><span class="small muted">${escapeHtml(productCodes(row.product))}</span></td>
      <td>${escapeHtml(row.qty)}</td>
      <td>${escapeHtml(row.soldQty)}</td>
      <td><strong>${escapeHtml(row.remainingQty)}</strong></td>
      <td>${serialBadges(row.serialIds)}</td>
      <td>${escapeHtml(row.paymentDays || state.settings.defaultDueDays)} днів</td>
      <td>${statusPill(row.derivedStatus)}<br><span class="small muted">${escapeHtml(ownershipLabel(row))}</span></td>
      <td class="row-actions no-print"><button class="ghost" data-edit-responsible-doc="${escapeHtml(row.id)}" ${canEditPostedDocument("responsibleShipment") ? "" : "disabled"}>Змінити</button></td>
    </tr>
  `;
}

function applyResponsibleStorageSearch(root = document) {
  const input = root.querySelector("[data-b2b-responsible-storage-search]");
  const details = root.querySelector("[data-b2b-responsible-storage-dropdown]");
  if (!input || !details) return;
  const words = searchWords(input.value);
  const rows = Array.from(details.querySelectorAll("[data-b2b-responsible-storage-row]"));
  let visibleCount = 0;
  rows.forEach((row) => {
    const haystack = row.dataset.b2bStorageSearchText || "";
    const visible = words.every((word) => haystack.includes(word));
    row.style.display = visible ? "" : "none";
    if (visible) visibleCount += 1;
  });
  const emptyRow = details.querySelector("[data-b2b-responsible-storage-empty]");
  if (emptyRow) emptyRow.style.display = visibleCount ? "none" : "";
  const resultCount = root.querySelector("[data-b2b-responsible-storage-result-count]");
  if (resultCount) resultCount.textContent = `${visibleCount} із ${rows.length} рядків`;
  const summaryCount = details.querySelector("[data-b2b-responsible-storage-summary-count]");
  if (summaryCount) summaryCount.textContent = `${visibleCount} рядків`;
  if (words.length) details.open = true;
  updateDropdownHint(details);
}

function renderB2B() {
  const docsPeriod = periodFilter("b2bDocs");
  const shipmentRequestFilter = b2bShipmentRequestFilter();
  const responsibleStorageFilter = b2bResponsibleStorageFilter();
  const b2bClients = state.clients.filter((client) => client.type === "B2B");
  const shipmentProduct = byId(state.products, b2bDraft.shipmentProductId) || state.products[0];
  const saleClient = byId(state.clients, b2bDraft.saleClientId) || b2bClients[0];
  const saleProduct = byId(state.products, b2bDraft.saleProductId) || shipmentProduct || state.products[0];
  const shipmentFirmId = b2bDraft.shipmentFirmId || state.settings.firms[0]?.id || "vat";
  const saleFirmId = b2bDraft.saleFirmId || shipmentFirmId;
  const shipmentSerials = shipmentProduct?.type === "weapon" ? ownAvailableSerialsForProduct(shipmentProduct).filter((serial) => serialMatchesStockContext(serial, { firmId: shipmentFirmId, clientId: "" })) : [];
  const saleSerials = saleProduct?.type === "weapon" && saleClient ? clientStorageSerials(saleClient.id, saleProduct.id, true).filter((serial) => !saleFirmId || (serial.firmId || "vat") === saleFirmId) : [];
  const responsibleRows = responsibleStorageRows();
  const responsibleDateEntityRows = sortResponsibleStorageRows(
    responsibleRows.filter((row) => (
      dateInOptionalPeriod(row.date, responsibleStorageFilter)
      && (!responsibleStorageFilter.clientId || row.clientId === responsibleStorageFilter.clientId)
      && (!responsibleStorageFilter.productId || row.productId === responsibleStorageFilter.productId)
    )),
    responsibleStorageFilter
  );
  const responsibleStorageWords = searchWords(responsibleStorageFilter.search);
  const filteredResponsibleRows = responsibleDateEntityRows.filter((row) => responsibleStorageMatchesSearch(row, responsibleStorageWords));
  const responsibleStorageEmptyText = responsibleDateEntityRows.length ? "Документів за введеними словами немає." : "Документів відповідального зберігання за вибраними відборами немає.";
  const shipmentRequestRows = b2bShipmentRequestRows();
  const shipmentRequestDateStatusRows = sortB2BShipmentRequestRows(
    shipmentRequestRows.filter((row) => dateInOptionalPeriod(row.date, shipmentRequestFilter) && (!shipmentRequestFilter.status || row.status === shipmentRequestFilter.status)),
    shipmentRequestFilter
  );
  const shipmentRequestWords = searchWords(shipmentRequestFilter.search);
  const filteredShipmentRequestRows = shipmentRequestDateStatusRows.filter((row) => b2bShipmentRequestMatchesSearch(row, shipmentRequestWords));
  const shipmentRequestEmptyText = shipmentRequestDateStatusRows.length ? "Заявок B2B за введеними словами немає." : "Заявок B2B на відвантаження за вибраними відборами немає.";
  const pendingShipmentRequests = shipmentRequestRows.filter((row) => ["request_new", "request_review"].includes(row.status)).length;
  const openStorageQty = responsibleRows.reduce((sum, row) => sum + row.remainingQty, 0);
  const b2bDebt = state.invoices
    .filter((invoice) => b2bClients.some((client) => client.id === invoice.clientId))
    .reduce((sum, invoice) => sum + invoice.total - invoice.paid, 0);
  const clientSaleStockQty = saleClient && saleProduct
    ? saleProduct.type === "weapon"
      ? clientStorageSerials(saleClient.id, saleProduct.id).filter((serial) => serialIsSelectable(serial) && (serial.firmId || "vat") === saleFirmId).length
      : stockQtyWhere(saleProduct.id, (row) => row.clientId === saleClient.id && (row.firmId || "vat") === saleFirmId)
    : 0;
  const shipmentAvailableQty = shipmentProduct
    ? shipmentProduct.type === "weapon"
      ? shipmentSerials.length
      : stockQtyWhere(shipmentProduct.id, ownStockPredicate({ firmId: shipmentFirmId }))
    : 0;
  const b2bSalePrice = productSalePrice(saleProduct, saleClient?.priceType || "b2b");

  return `
    <section class="grid four section-band">
      <article class="card metric info"><span>B2B клієнти</span><strong>${b2bClients.length}</strong><small>Кабінети, прайси, умови оплати.</small></article>
      <article class="card metric warn"><span>На відповідальному зберіганні</span><strong>${openStorageQty} од.</strong><small>Товар ще наш, але лежить на складах клієнтів.</small></article>
      <article class="card metric good"><span>Документи зберігання</span><strong>${state.responsibleStorageDocs.length}</strong><small>Передачі на склади клієнтів із датами та менеджерами.</small></article>
      <article class="card metric danger"><span>Дебіторка B2B</span><strong>${formatMoney(b2bDebt)}</strong><small>Виникає тільки після продажу клієнтом.</small></article>
    </section>

    <section class="panel section-band">
      <div class="split">
        <h2>Заявки B2B клієнтів на відвантаження</h2>
        <span class="pill ${pendingShipmentRequests ? "warn" : "good"}">${pendingShipmentRequests} потребують рішення</span>
      </div>
      <p class="notice small">Клієнт бачить тільки форму попередньої заявки. Наявність, склад, фірму, серійні номери, ціну, валюту та умови відвантаження виправляє і підтверджує менеджер.</p>
      ${renderB2BShipmentRequestFilters(shipmentRequestFilter, filteredShipmentRequestRows.length, shipmentRequestDateStatusRows.length)}
      <details class="order-dropdown" data-b2b-shipment-requests-dropdown ${shipmentRequestFilter.expanded ? "open" : ""}>
        <summary>
          <span>
            <strong>Список замовлень</strong>
            <small>${shipmentRequestFilter.expanded ? "Натисніть, щоб згорнути список." : "Натисніть, щоб розгорнути список."}</small>
          </span>
          <span class="pill info" data-b2b-shipment-request-summary-count>${filteredShipmentRequestRows.length} рядків</span>
        </summary>
        <div class="table-wrap">
          <table>
            <thead><tr>
              ${renderB2BShipmentRequestSortHeader("date", "Дата", shipmentRequestFilter)}
              ${renderB2BShipmentRequestSortHeader("client", "Клієнт", shipmentRequestFilter)}
              ${renderB2BShipmentRequestSortHeader("product", "Товар", shipmentRequestFilter)}
              ${renderB2BShipmentRequestSortHeader("qty", "К-сть", shipmentRequestFilter)}
              ${renderB2BShipmentRequestSortHeader("desiredDate", "Бажана дата", shipmentRequestFilter)}
              ${renderB2BShipmentRequestSortHeader("status", "Статус", shipmentRequestFilter)}
              ${renderB2BShipmentRequestSortHeader("issues", "Перевірка", shipmentRequestFilter)}
              <th>Дії</th>
            </tr></thead>
            <tbody>
              ${shipmentRequestDateStatusRows.map((row) => renderB2BShipmentRequestRow(row, b2bShipmentRequestMatchesSearch(row, shipmentRequestWords))).join("")}
              <tr data-b2b-shipment-request-empty ${filteredShipmentRequestRows.length ? 'style="display: none;"' : ""}><td colspan="8" class="muted">${shipmentRequestEmptyText}</td></tr>
            </tbody>
          </table>
        </div>
      </details>
    </section>

    <section class="grid two section-band">
      <div class="panel">
        <h2>Відвантаження на відповідальне зберігання</h2>
        <form class="form-grid" data-action="create-responsible-shipment">
          <label class="field"><span>Дата передачі</span><input name="date" type="date" value="${today}"></label>
          <label class="field"><span>B2B клієнт</span><select name="clientId">${b2bClients.map((client) => option(client.id, client.name, client.id === saleClient?.id)).join("")}</select></label>
          <label class="field"><span>Фірма-власник</span><select name="firmId" data-b2b-shipment-firm>${state.settings.firms.map((firm) => option(firm.id, firm.name, firm.id === shipmentFirmId)).join("")}</select></label>
          <label class="field"><span>QR / штрихкод</span><input name="barcode" data-b2b-shipment-barcode required value="${escapeHtml(b2bDraft.shipmentBarcode || shipmentProduct?.barcode || shipmentProduct?.qrCode || "")}" placeholder="скан товару"></label>
          <label class="field wide"><span>Товар</span><select name="productId" data-b2b-shipment-product>${state.products.map((product) => option(product.id, `${product.type === "weapon" ? "Зброя" : "Товар"} · ${product.brand} ${product.model}`, product.id === shipmentProduct?.id)).join("")}</select></label>
          <label class="field"><span>Кількість</span><input name="qty" type="number" min="1" value="${shipmentProduct?.type === "weapon" ? Math.min(1, shipmentSerials.length || 1) : 1}"></label>
          <label class="field"><span>Термін оплати після продажу, днів</span><input name="paymentDays" type="number" min="0" value="${state.settings.defaultDueDays}"></label>
          <label class="field full"><span>Серійні номери для передачі</span><select class="serial-select" name="serialIds" multiple ${shipmentProduct?.type === "weapon" ? "" : "disabled"}>
            ${shipmentProduct?.type === "weapon"
              ? shipmentSerials.length
                ? shipmentSerials.map((serial) => b2bSerialOption(serial, [], "shipment")).join("")
                : '<option disabled>Немає вільних серій цієї моделі на наших складах.</option>'
              : ""}
          </select></label>
          <label class="field"><span>Відповідальний менеджер</span><select name="manager">${employeeOptions()}</select></label>
          <label class="field full"><span>Коментар</span><textarea name="comment" placeholder="договір, умови зберігання, примітки"></textarea></label>
          <button class="primary" type="submit">Передати на склад клієнта</button>
        </form>
        <p class="notice small">Доступно для передачі по вибраному товару: <strong>${shipmentAvailableQty}</strong>. Для зброї кількість має дорівнювати кількості вибраних серій.</p>
      </div>

      <div class="panel">
        <h2>Звіт продажу клієнтом</h2>
        <form class="form-grid" data-action="create-b2b-client-sale">
          <label class="field"><span>Дата продажу</span><input name="date" type="date" value="${today}"></label>
          <label class="field"><span>B2B клієнт</span><select name="clientId" data-b2b-sale-client>${b2bClients.map((client) => option(client.id, client.name, client.id === saleClient?.id)).join("")}</select></label>
          <label class="field"><span>Фірма-власник</span><select name="firmId" data-b2b-sale-firm>${state.settings.firms.map((firm) => option(firm.id, firm.name, firm.id === saleFirmId)).join("")}</select></label>
          <label class="field"><span>QR / штрихкод</span><input name="barcode" data-b2b-sale-barcode required value="${escapeHtml(b2bDraft.saleBarcode || saleProduct?.barcode || saleProduct?.qrCode || "")}" placeholder="скан товару"></label>
          <label class="field wide"><span>Товар зі складу клієнта</span><select name="productId" data-b2b-sale-product>${state.products.map((product) => option(product.id, `${product.type === "weapon" ? "Зброя" : "Товар"} · ${product.brand} ${product.model}`, product.id === saleProduct?.id)).join("")}</select></label>
          <label class="field"><span>Кількість продано</span><input name="qty" type="number" min="1" value="${saleProduct?.type === "weapon" ? Math.min(1, clientSaleStockQty || 1) : 1}"></label>
          <label class="field"><span>Ціна продажу</span><input name="price" inputmode="decimal" data-field-lock="price" value="${b2bSalePrice.amount}"></label>
          <label class="field"><span>Валюта</span><select name="currency" data-field-lock="price">${Object.keys(state.settings.rates).map((currency) => option(currency, currency, currency === b2bSalePrice.currency)).join("")}</select></label>
          <label class="field"><span>Термін оплати, днів</span><input name="paymentDays" type="number" min="0" value="${state.settings.defaultDueDays}"></label>
          <label class="field"><span>Джерело звіту</span><select name="reportSource">${variantOptions("b2bReportSources", "Кабінет клієнта")}</select></label>
          <label class="field full"><span>Серійні номери, продані клієнтом</span><select class="serial-select" name="serialIds" multiple ${saleProduct?.type === "weapon" ? "" : "disabled"}>
            ${saleProduct?.type === "weapon"
              ? saleSerials.length
                ? saleSerials.map((serial) => b2bSerialOption(serial, [], "sale")).join("")
                : '<option disabled>Немає серій цієї моделі на відповідальному зберіганні цього клієнта.</option>'
              : ""}
          </select></label>
          <label class="field"><span>Номер дозволу покупця</span><input name="permitNumber" ${saleProduct?.type === "weapon" ? "required" : "disabled"} placeholder="для зброї"></label>
          <label class="field"><span>Дата видачі дозволу</span><input name="permitDate" type="date" ${saleProduct?.type === "weapon" ? "required" : "disabled"}></label>
          <label class="field"><span>Менеджер</span><select name="manager">${employeeOptions()}</select></label>
          <label class="field full"><span>Коментар</span><textarea name="comment" placeholder="номер звіту клієнта, кінцевий покупець, примітки"></textarea></label>
          <button class="primary" type="submit">Списати продаж клієнта</button>
        </form>
        <p class="notice small">Доступно на складі вибраного клієнта: <strong>${clientSaleStockQty}</strong>. Після проведення створюється накладна і дебіторка з датою оплати.</p>
      </div>
    </section>

    <section class="panel section-band" data-print-area="b2bDocs" data-print-title="B2B відповідальне зберігання">
      <div class="split">
        <h2>Звіт по відповідальному зберіганню</h2>
        <span class="pill info">власність наша до продажу клієнтом</span>
      </div>
      ${renderResponsibleStorageFilters(responsibleStorageFilter, filteredResponsibleRows.length, responsibleDateEntityRows.length, responsibleRows)}
      <details class="order-dropdown" data-b2b-responsible-storage-dropdown ${responsibleStorageFilter.expanded ? "open" : ""}>
        <summary>
          <span>
            <strong>Список замовлень</strong>
            <small>${responsibleStorageFilter.expanded ? "Натисніть, щоб згорнути список." : "Натисніть, щоб розгорнути список."}</small>
          </span>
          <span class="pill info" data-b2b-responsible-storage-summary-count>${filteredResponsibleRows.length} рядків</span>
        </summary>
        <div class="table-wrap">
          <table>
            <thead><tr>
              ${renderResponsibleStorageSortHeader("document", "Документ", responsibleStorageFilter)}
              ${renderResponsibleStorageSortHeader("date", "Дата", responsibleStorageFilter)}
              ${renderResponsibleStorageSortHeader("client", "Клієнт / склад", responsibleStorageFilter)}
              ${renderResponsibleStorageSortHeader("product", "Товар", responsibleStorageFilter)}
              ${renderResponsibleStorageSortHeader("qty", "Передано", responsibleStorageFilter)}
              ${renderResponsibleStorageSortHeader("sold", "Продано", responsibleStorageFilter)}
              ${renderResponsibleStorageSortHeader("remaining", "Залишок", responsibleStorageFilter)}
              ${renderResponsibleStorageSortHeader("serials", "Серії", responsibleStorageFilter)}
              ${renderResponsibleStorageSortHeader("paymentDays", "Оплата після продажу", responsibleStorageFilter)}
              ${renderResponsibleStorageSortHeader("status", "Статус", responsibleStorageFilter)}
              <th>Дії</th>
            </tr></thead>
            <tbody>
              ${responsibleDateEntityRows.map((row) => renderResponsibleStorageRow(row, responsibleStorageMatchesSearch(row, responsibleStorageWords))).join("")}
              <tr data-b2b-responsible-storage-empty ${filteredResponsibleRows.length ? 'style="display: none;"' : ""}><td colspan="11" class="muted">${responsibleStorageEmptyText}</td></tr>
            </tbody>
          </table>
        </div>
      </details>
    </section>

    <section class="panel">
      <h2>Кабінети клієнтів</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Клієнт</th><th>Ліміт</th><th>Умови</th><th>На зберіганні</th><th>Дебіторка</th><th>Менеджер</th><th>Дії</th></tr></thead>
          <tbody>
            ${b2bClients.map((client) => {
              const invoices = state.invoices.filter((invoice) => invoice.clientId === client.id && isDebtInvoice(invoice));
              const debt = invoices.reduce((sum, invoice) => sum + invoice.total - invoice.paid, 0);
              const storageQty = clientStorageRows(client.id).reduce((sum, row) => sum + row.qty, 0);
              return `
                <tr>
                  <td><strong>${client.name}</strong><br><span class="small muted">${client.edrpou || "без ЄДРПОУ"} · ${client.address || "адреса не внесена"}</span></td>
                  <td>${formatMoney(client.creditLimitUAH)}</td>
                  <td>${client.paymentTerms}</td>
                  <td>${storageQty} од.</td>
                  <td>${formatMoney(debt)}</td>
                  <td>${client.manager}</td>
                  <td><button class="secondary" data-open-cabinet="${client.id}">Відкрити кабінет</button></td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderClientPortal(client) {
  const docsPeriod = periodFilter("clientPortal");
  const rows = clientStorageRows(client.id);
  const docs = responsibleStorageRows(client.id).filter((doc) => dateInPeriod(doc.date, docsPeriod));
  const invoices = state.invoices.filter((invoice) => invoice.clientId === client.id && isDebtInvoice(invoice) && dateInPeriod(invoice.date, docsPeriod));
  const paymentDebt = invoices.reduce((sum, invoice) => sum + invoice.total - invoice.paid, 0);
  const serialRows = clientStorageSerials(client.id, "", true);
  const products = uniqueList(rows.map((row) => row.product?.id || row.productId))
    .map((productId) => byId(state.products, productId))
    .filter(Boolean);
  const saleProduct = products.find((product) => product.id === clientPortalDraft.productId) || products[0];
  const saleFirmOptions = uniqueList(rows
    .filter((row) => (row.product?.id || row.productId) === saleProduct?.id)
    .map((row) => row.firmId || "vat"))
    .filter(Boolean);
  const portalFirmId = saleFirmOptions.includes(clientPortalDraft.firmId)
    ? clientPortalDraft.firmId
    : (saleFirmOptions[0] || state.settings.firms[0]?.id || "vat");
  const salePrice = saleProduct ? productSalePrice(saleProduct, client.priceType) : { amount: 0, currency: client.currency || "UAH" };
  const availableQty = saleProduct
    ? saleProduct.type === "weapon"
      ? clientStorageSerials(client.id, saleProduct.id).filter((serial) => serialIsSelectable(serial) && (serial.firmId || "vat") === portalFirmId).length
      : stockQtyWhere(saleProduct.id, (row) => row.clientId === client.id && (row.firmId || "vat") === portalFirmId)
    : 0;
  const saleSerials = saleProduct?.type === "weapon" ? clientStorageSerials(client.id, saleProduct.id, true).filter((serial) => (serial.firmId || "vat") === portalFirmId) : [];
  const qtyValue = clientPortalDraft.qty || (saleProduct?.type === "weapon" ? Math.min(1, availableQty || 1) : 1);
  const saleDisabled = saleProduct ? "" : "disabled";

  return `
    <section class="panel no-print">
      <h2>Період і друк кабінету</h2>
      ${renderPeriodPrintControls("clientPortal", "B2B кабінет клієнта", docsPeriod, rows.length + docs.length + invoices.length)}
      <p class="small muted">${canPrintDocuments() ? "Друк дозволено роллю B2B клієнта." : "Друк B2B кабінету зараз заборонено роллю B2B клієнта."}</p>
    </section>
    <div data-print-area="clientPortal" data-print-title="B2B кабінет · ${escapeHtml(client.name)}">
    <section class="grid three section-band">
      <article class="card metric warn"><span>На зберіганні</span><strong>${rows.reduce((sum, row) => sum + row.qty, 0)} од.</strong><small>Товар залишається власністю нашої компанії до вашого продажу.</small></article>
      <article class="card metric danger"><span>До оплати</span><strong>${formatMoney(paymentDebt)}</strong><small>Борг після поданих звітів продажу.</small></article>
      <article class="card metric info"><span>Документи</span><strong>${docs.length}</strong><small>Передачі на ваш склад відповідального зберігання.</small></article>
    </section>

    <section class="grid two section-band">
      <div class="panel">
        <h2>Подати продаж зі свого складу</h2>
        <form class="form-grid" data-action="create-client-portal-sale">
          <input type="hidden" name="clientId" value="${escapeHtml(client.id)}">
          <input type="hidden" name="manager" value="${escapeHtml(client.manager || "")}">
          <input type="hidden" name="reportSource" value="Кабінет клієнта">
          <label class="field"><span>Дата продажу</span><input name="date" type="date" value="${today}" ${saleDisabled}></label>
          <label class="field"><span>Фірма-власник</span><select name="firmId" data-client-portal-firm ${saleDisabled}>
            ${saleFirmOptions.map((firmId) => option(firmId, firmName(firmId), firmId === portalFirmId)).join("")}
          </select></label>
          <label class="field"><span>QR / штрихкод</span><input name="barcode" data-client-portal-barcode required value="${escapeHtml(clientPortalDraft.barcode || saleProduct?.barcode || saleProduct?.qrCode || "")}" ${saleDisabled}></label>
          <label class="field wide"><span>Товар зі складу</span><select name="productId" data-client-portal-product ${saleDisabled}>
            ${products.map((product) => option(product.id, `${product.type === "weapon" ? "Зброя" : "Товар"} · ${product.brand} ${product.model}`, product.id === saleProduct?.id)).join("")}
          </select></label>
          <label class="field"><span>Кількість продано</span><input name="qty" type="number" min="1" value="${qtyValue}" ${saleDisabled}></label>
          <label class="field"><span>Ціна вашого прайсу</span><input name="price" inputmode="decimal" value="${salePrice.amount}" readonly></label>
          <label class="field"><span>Валюта</span><select name="currency" disabled>${Object.keys(state.settings.rates).map((currency) => option(currency, currency, currency === salePrice.currency)).join("")}</select><input type="hidden" name="currency" value="${escapeHtml(salePrice.currency)}"></label>
          <label class="field"><span>Термін оплати, днів</span><input name="paymentDays" type="number" min="0" value="${state.settings.defaultDueDays}" readonly></label>
          <label class="field full"><span>Серійні номери, продані клієнтом</span><select class="serial-select" name="serialIds" multiple ${saleProduct?.type === "weapon" ? "" : "disabled"}>
            ${saleProduct?.type === "weapon"
              ? saleSerials.length
                ? saleSerials.map((serial) => b2bSerialOption(serial, clientPortalDraft.serialIds || [], "sale")).join("")
                : '<option disabled>Немає серій цієї моделі на вашому складі.</option>'
              : ""}
          </select></label>
          <label class="field"><span>Номер дозволу покупця</span><input name="permitNumber" value="${escapeHtml(clientPortalDraft.permitNumber || "")}" ${saleProduct?.type === "weapon" ? "required" : "disabled"}></label>
          <label class="field"><span>Дата видачі дозволу</span><input name="permitDate" type="date" value="${escapeHtml(clientPortalDraft.permitDate || "")}" ${saleProduct?.type === "weapon" ? "required" : "disabled"}></label>
          <label class="field full"><span>Коментар</span><textarea name="comment" placeholder="кінцевий покупець, номер вашого звіту, примітки" ${saleDisabled}></textarea></label>
          <button class="primary" type="submit" ${saleDisabled}>Подати звіт продажу</button>
        </form>
        <p class="notice small">Доступно для продажу по вибраному товару: <strong>${availableQty}</strong>. Серійні номери іншої моделі, продані або без перевірки ЄРЗ заблоковані.</p>
      </div>

      <div class="panel">
        <div class="split">
          <h2>Звіти кабінету</h2>
          <span class="pill info">${priceTypeName(client.priceType)}</span>
        </div>
        <div class="inline-actions">
          <button class="secondary" data-export-b2b-report="stock" data-client-id="${client.id}">Залишки JSON</button>
          <button class="secondary" data-export-b2b-report="payments" data-client-id="${client.id}">Оплати JSON</button>
          <button class="secondary" data-export-b2b-report="inventory" data-client-id="${client.id}">Інвентаризація JSON</button>
        </div>
        <p class="notice small">У звітах доступні тільки ваші залишки, серійні номери, документи відповідального зберігання та оплати.</p>
      </div>
    </section>

    <section class="panel section-band">
      <h2>Що відвантажено на відповідальне зберігання</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Документ</th><th>Дата</th><th>Товар</th><th>Передано</th><th>Продано</th><th>Залишок</th><th>Серії</th><th>Оплата</th><th>Статус</th></tr></thead>
          <tbody>
            ${docs.map((row) => `
              <tr>
                <td><strong>${row.id}</strong><br><span class="small muted">${escapeHtml(row.manager || "-")}</span></td>
                <td>${row.date}</td>
                <td>${productName(row.productId)}<br><span class="small muted">${productCodes(row.product)}</span></td>
                <td>${row.qty}</td>
                <td>${row.soldQty}</td>
                <td><strong>${row.remainingQty}</strong></td>
                <td>${serialBadges(row.serialIds)}</td>
                <td>${row.paymentDays || state.settings.defaultDueDays} днів після продажу</td>
                <td>${statusPill(row.derivedStatus)}<br><span class="small muted">${ownershipLabel(row)}</span></td>
              </tr>
            `).join("") || '<tr><td colspan="9" class="muted">Передач на відповідальне зберігання ще немає.</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>

    <section class="grid two section-band">
      <div class="panel">
        <h2>Залишки та інвентаризація</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Товар</th><th>QR / штрихкод</th><th>Склад</th><th>Кількість</th><th>Серійні номери зброї</th></tr></thead>
            <tbody>
              ${rows.map((row) => {
                const serials = row.product.type === "weapon"
                  ? clientStorageSerials(client.id, row.product.id).map((serial) => serial.id)
                  : [];
                return `
                  <tr>
                    <td><strong>${row.product.brand}</strong><br>${row.product.model}</td>
                    <td>${productCodes(row.product)}</td>
                    <td>${warehouseName(row.warehouseId)}</td>
                    <td>${row.qty}</td>
                    <td>${serialBadges(serials)}</td>
                  </tr>
                `;
              }).join("") || '<tr><td colspan="5" class="muted">Немає залишків на вашому складі.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <div class="panel">
        <h2>Оплати та дебіторка</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Накладна</th><th>Дата</th><th>Сума</th><th>Оплачено</th><th>Борг</th><th>Оплатити до</th><th>Стан</th></tr></thead>
            <tbody>
              ${invoices.map((invoice) => `
                <tr>
                  <td><strong>${invoice.id}</strong><br><span class="small muted">${invoice.channel}</span></td>
                  <td>${invoice.date}</td>
                  <td>${formatMoney(invoice.total, invoice.currency)}</td>
                  <td>${formatMoney(invoice.paid, invoice.currency)}</td>
                  <td>${formatMoney(invoice.total - invoice.paid, invoice.currency)}</td>
                  <td>${invoice.dueDate || "-"}</td>
                  <td>${statusPill(invoice.status)}</td>
                </tr>
              `).join("") || '<tr><td colspan="7" class="muted">Накладних і оплат ще немає.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="panel">
      <h2>Серійні номери в кабінеті</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Серія</th><th>Товар</th><th>Склад</th><th>Стан</th><th>ЄРЗ</th><th>Дозвіл</th></tr></thead>
          <tbody>
            ${serialRows.map((serial) => `
              <tr>
                <td><strong>${serial.serial}</strong></td>
                <td>${productName(serial.productId)}</td>
                <td>${warehouseName(serial.warehouseId)}</td>
                <td>${statusPill(serial.status)}</td>
                <td>${statusPill(serial.erzStatus)}</td>
                <td>${serial.permitNumber ? `${escapeHtml(serial.permitNumber)}<br><span class="small muted">${serial.permitDate || "-"}</span>` : "-"}</td>
              </tr>
            `).join("") || '<tr><td colspan="6" class="muted">Серійних товарів у кабінеті немає.</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>
    </div>
  `;
}

function renderClientCatalogPage(client) {
  const historyPeriod = periodFilter("clientCatalogHistory");
  const requestRows = b2bShipmentRequestRows(client.id);
  const draftRequests = requestRows.filter((request) => request.status === "request_draft");
  const historyRequests = requestRows.filter((request) => !["request_draft", "request_cancelled"].includes(request.status) && dateInPeriod(request.date, historyPeriod));
  return `
    <section class="panel no-print">
      <div class="split">
        <div>
          <h2>Каталоги, прайси, акції</h2>
          <p class="small muted">Окремий розділ для вибору товарів і попередніх заявок на відвантаження. Залишки, склади та серійні номери тут не відкриваються клієнту.</p>
        </div>
        <span class="pill info">${escapeHtml(priceTypeName(client.priceType))}</span>
      </div>
    </section>
    <div data-print-area="clientCatalog" data-print-title="Каталоги, прайси, акції · ${escapeHtml(client.name)}">
      ${renderB2BRequestCatalog(client, draftRequests, historyRequests, historyPeriod)}
    </div>
  `;
}

function renderClients() {
  return `
    <section class="grid two section-band">
      <div class="panel">
        <h2>Новий клієнт</h2>
        <form class="form-grid" data-action="create-client">
          <label class="field wide"><span>Назва</span><input name="name" required placeholder="юридична або торгова назва"></label>
          <label class="field"><span>Тип</span><select name="type">${variantOptions("clientTypes", "B2B")}</select></label>
          <label class="field"><span>ЄДРПОУ / ІПН</span><input name="edrpou"></label>
          <label class="field"><span>Телефон</span><input name="phone"></label>
          <label class="field"><span>Email</span><input name="email" type="email"></label>
          <label class="field"><span>Менеджер</span><select name="manager">${employeeOptions()}</select></label>
          <label class="field"><span>Умови оплат</span><select name="paymentTerms">${variantOptions("paymentTerms", "Відтермінування 14 днів")}</select></label>
          <label class="field"><span>Кредитний ліміт</span><input name="creditLimitUAH" inputmode="decimal" value="0"></label>
          <label class="field"><span>Валюта</span><select name="currency">${Object.keys(state.settings.rates).map((currency) => option(currency, currency, currency === "UAH")).join("")}</select></label>
          <label class="field"><span>Прайс</span><select name="priceType">${priceTypeOptions("retail")}</select></label>
          <label class="field"><span>Податки</span><select name="taxMode">${variantOptions("taxModes", "без ПДВ")}</select></label>
          <label class="field"><span>Кабінет</span><select name="cabinetEnabled"><option value="true">увімкнути</option><option value="false">не створювати</option></select></label>
          <label class="field"><span>Логін кабінету</span><input name="portalLogin" placeholder="для B2B входу"></label>
          <label class="field"><span>Пароль кабінету</span><input name="portalPassword" type="text" placeholder="для B2B входу"></label>
          <label class="field"><span>Відп. зберігання</span><select name="responsibleStorage"><option value="true">так</option><option value="false">ні</option></select></label>
          <label class="field full"><span>Адреса / доставка</span><textarea name="address" placeholder="адреса, контакт складу, правила відвантаження"></textarea></label>
          <button class="primary" type="submit">Створити клієнта</button>
        </form>
      </div>
      <div class="panel">
        <h2>Контроль клієнтів</h2>
        <div class="grid two">
          <article class="card metric info"><span>B2B клієнти</span><strong>${state.clients.filter((client) => client.type === "B2B").length}</strong><small>Із кабінетами, прайсами та умовами оплат.</small></article>
          <article class="card metric warn"><span>Кредитний ліміт</span><strong>${formatMoney(state.clients.reduce((sum, client) => sum + Number(client.creditLimitUAH || 0), 0))}</strong><small>Контроль відтермінування й дебіторки.</small></article>
        </div>
        <p class="notice small">Клієнтські картки вже містять менеджера, прайс, податковий режим, валюту, кредитний ліміт, кабінет і ознаку відповідального зберігання.</p>
      </div>
    </section>

    <section class="panel">
      <h2>Клієнти</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Клієнт</th><th>Тип</th><th>Контакти</th><th>Менеджер</th><th>Умови</th><th>Прайс / податки</th><th>Кабінет</th></tr></thead>
          <tbody>
            ${state.clients.map((client) => `
              <tr class="clickable-row" data-open-client="${escapeHtml(client.id)}" title="Відкрити картку клієнта">
                <td><strong>${client.name}</strong><br><span class="small muted">${client.edrpou || "без ЄДРПОУ"} · ${client.address || "адреса не внесена"}</span></td>
                <td>${client.type}</td>
                <td>${client.phone || "-"}<br><span class="small muted">${client.email || "-"}</span></td>
                <td>${client.manager}</td>
                <td>${client.paymentTerms}<br><span class="small muted">ліміт ${formatMoney(client.creditLimitUAH, client.currency || "UAH")}</span></td>
                <td>${priceTypeName(client.priceType)}<br><span class="small muted">${client.taxMode || "-"}</span></td>
                <td>${client.cabinetEnabled ? '<span class="pill good">кабінет</span>' : '<span class="pill">немає</span>'} ${client.responsibleStorage ? '<span class="pill info">зберігання</span>' : ""}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderSettings() {
  const canEdit = role().canEditSettings || isAdmin();
  const disabled = canEdit ? "" : "disabled";
  return `
    <section class="grid three section-band">
      <article class="card metric info"><span>Фірми</span><strong>${state.settings.firms.length}</strong><small>ПДВ / без ПДВ, окремий бухоблік.</small></article>
      <article class="card metric good"><span>Склади</span><strong>${state.warehouses.length}</strong><small>Магазин, основний, відповідальне зберігання.</small></article>
      <article class="card metric warn"><span>Статті руху коштів</span><strong>${state.settings.cashArticles.length + state.settings.expenseArticles.length}</strong><small>Для фінансових звітів та витрат.</small></article>
      <article class="card metric info"><span>Термінали</span><strong>${state.settings.paymentTerminals.length}</strong><small>Для оплат карткою з прив'язкою до фірми.</small></article>
      <article class="card metric good"><span>Прайси</span><strong>${activeSalePriceTypes().length}</strong><small>Активні типи цін у картці товару.</small></article>
      <article class="card metric info"><span>Довідники документів</span><strong>${Object.values(state.settings.variantDictionaries || {}).flat().length}</strong><small>Ієрархічні списки для вибору в документах.</small></article>
      <article class="card metric warn"><span>Параметри каталогу</span><strong>${Object.values(state.settings.catalogParameters || {}).flat().length}</strong><small>Фільтри B2B прайсів: тип, бренд, категорія, калібр, акції.</small></article>
    </section>

    <section class="grid two section-band">
      <div class="panel">
        <h2>Додати склад</h2>
        <form class="form-grid" data-action="create-warehouse">
          <label class="field wide"><span>Назва</span><input name="name" required></label>
          <label class="field"><span>Тип</span><select name="kind">${variantOptions("warehouseKinds", "own")}</select></label>
          <button class="primary" type="submit" ${disabled}>Додати</button>
        </form>
        <p class="notice ${canEdit ? "" : "warn"} small">${canEdit ? "Поточна роль може змінювати налаштування." : "Налаштування змінює лише адміністратор."}</p>
      </div>
      <div class="panel">
        <h2>Курси та параметри</h2>
        <form class="form-grid" data-action="update-rates">
          ${Object.entries(state.settings.rates).map(([currency, rate]) => `
            <label class="field"><span>${currency}</span><input name="${currency}" type="text" inputmode="decimal" value="${rate}" ${disabled}></label>
          `).join("")}
          <button class="primary" type="submit" ${disabled}>Оновити</button>
        </form>
      </div>
    </section>

    <section class="panel section-band">
      <h2>Довідники документів</h2>
      <form class="form-grid" data-action="create-variant-dictionary-item">
        <label class="field"><span>Довідник</span><select name="dictionaryKey" ${disabled}>${VARIANT_DICTIONARY_DEFINITIONS.map((item) => option(item.key, item.label)).join("")}</select></label>
        <label class="field"><span>Батьківський пункт</span><input name="parentName" placeholder="необов'язково, для ієрархії" ${disabled}></label>
        <label class="field"><span>Новий пункт</span><input name="name" required ${disabled}></label>
        <label class="field"><span>Системне значення</span><input name="value" placeholder="можна залишити порожнім" ${disabled}></label>
        <button class="primary" type="submit" ${disabled}>Додати у довідник</button>
      </form>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Довідник</th><th>Пункти</th></tr></thead>
          <tbody>
            ${VARIANT_DICTIONARY_DEFINITIONS.map((definition) => {
              const entries = variantEntries(definition.key, true);
              return `
                <tr>
                  <td><strong>${escapeHtml(definition.label)}</strong></td>
                  <td>${entries.map((entry) => `<span class="pill ${entry.parentId ? "info" : "good"}">${escapeHtml(variantPathLabel(entry, entries))}</span>`).join(" ")}</td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
      <p class="notice small">Якщо вказати батьківський пункт, новий варіант стане дочірнім: наприклад "Доставка / Нова пошта / Кур'єр". Документи беруть варіанти саме з цих довідників.</p>
    </section>

    <section class="panel section-band">
      <h2>Параметри каталогу B2B</h2>
      <form class="form-grid" data-action="create-catalog-parameter">
        <label class="field"><span>Каталог</span><select name="parameterKey" ${disabled}>${CATALOG_PARAMETER_DEFINITIONS.map((item) => option(item.key, item.label)).join("")}</select></label>
        <label class="field"><span>Назва</span><input name="name" required placeholder="назва для списку" ${disabled}></label>
        <label class="field"><span>Значення</span><input name="value" placeholder="для типів: weapon або regular" ${disabled}></label>
        <button class="primary" type="submit" ${disabled}>Додати параметр</button>
      </form>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Параметр</th><th>Значення для відбору</th></tr></thead>
          <tbody>
            ${CATALOG_PARAMETER_DEFINITIONS.map((definition) => `
              <tr>
                <td><strong>${escapeHtml(definition.label)}</strong><br><span class="small muted">${escapeHtml(definition.valueHint || "значення = назва")}</span></td>
                <td>${catalogParameterEntries(definition.key, true).map((entry) => `<span class="pill ${entry.active === false ? "warn" : "info"}">${escapeHtml(entry.name)}${entry.value !== entry.name ? ` · ${escapeHtml(entry.value)}` : ""}</span>`).join(" ")}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      <p class="notice small">Ці довідники використовуються у верхньому відборі B2B каталогу. Бренди, категорії та калібри також синхронізуються з картками товарів.</p>
    </section>

    <section class="panel section-band">
      <h2>Типи прайсів</h2>
      <form class="form-grid" data-action="create-price-type">
        <label class="field wide"><span>Новий прайс</span><input name="name" required placeholder="Опт / VIP / маркетплейс" ${disabled}></label>
        <button class="primary" type="submit" ${disabled}>Додати прайс</button>
      </form>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Прайс</th><th>Тип</th><th>Статус</th><th>Дії</th></tr></thead>
          <tbody>
            ${state.settings.priceTypes.map((item) => `
              <tr>
                <td><strong>${escapeHtml(item.name)}</strong><br><span class="small muted">${escapeHtml(item.id)}</span></td>
                <td>${item.kind === "cost" ? "прихідна / собівартість" : "ціна продажу"}</td>
                <td>${item.active === false ? '<span class="pill warn">вимкнено</span>' : '<span class="pill good">активний</span>'}</td>
                <td><button class="secondary" type="button" data-toggle-price-type="${escapeHtml(item.id)}" ${disabled || item.kind === "cost" ? "disabled" : ""}>${item.active === false ? "Увімкнути" : "Вимкнути"}</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      <p class="notice small">“Прихідна” ціна ведеться як собівартість. Активні прайси продажу автоматично з'являються в картці товару і в договорах/картках клієнтів. Доступ до зміни цін керується роллю через право “Ціна”, до прихідної ціни - через право “Собівартість”.</p>
    </section>

    <section class="grid two section-band">
      <div class="panel">
        <h2>Платіжні термінали</h2>
        <form class="form-grid" data-action="create-payment-terminal">
          <label class="field wide"><span>Назва термінала</span><input name="name" required placeholder="POS Monobank · магазин" ${disabled}></label>
          <label class="field"><span>Провайдер</span><input name="provider" placeholder="Mono / ПриватБанк / LiqPay" ${disabled}></label>
          <label class="field"><span>Фірма</span><select name="firmId" ${disabled}>${state.settings.firms.map((firm) => option(firm.id, firm.name)).join("")}</select></label>
          <button class="primary" type="submit" ${disabled}>Додати термінал</button>
        </form>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Термінал</th><th>Фірма</th><th>Провайдер</th></tr></thead>
            <tbody>
              ${state.settings.paymentTerminals.map((terminal) => `
                <tr>
                  <td>${escapeHtml(terminal.name)}</td>
                  <td>${firmName(terminal.firmId)}</td>
                  <td>${escapeHtml(terminal.provider || "-")}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
      <div class="panel">
        <h2>Правила оплат</h2>
        <p class="notice small">Оплата карткою вимагає термінал і фірму зарахування. Готівка має ознаку ПРРО. Аванс можна внести без накладної, але з обов'язковим клієнтом, валютою і фірмою.</p>
      </div>
    </section>

    <section class="grid two">
      <div class="panel">
        <h2>Статті руху коштів</h2>
        <form class="form-grid" data-action="create-cash-article">
          <label class="field wide"><span>Нова стаття</span><input name="article" required ${disabled}></label>
          <button class="primary" type="submit" ${disabled}>Додати</button>
        </form>
        <div class="inline-actions">${state.settings.cashArticles.map((item) => `<span class="pill info">${item}</span>`).join("")}</div>
      </div>
      <div class="panel">
        <h2>Статті витрат</h2>
        <form class="form-grid" data-action="create-expense-article">
          <label class="field wide"><span>Нова стаття</span><input name="article" required ${disabled}></label>
          <button class="primary" type="submit" ${disabled}>Додати</button>
        </form>
        <div class="inline-actions">${state.settings.expenseArticles.map((item) => `<span class="pill warn">${item}</span>`).join("")}</div>
      </div>
    </section>
  `;
}

function cashMovementRows() {
  const inflow = state.payments.map((payment) => {
    const invoice = state.invoices.find((item) => item.id === payment.invoiceId);
    const client = byId(state.clients, payment.clientId || invoice?.clientId);
    return {
      date: payment.date,
      article: payment.advance ? "Аванс клієнта" : (invoice?.cashArticle || "Продаж товарів"),
      method: paymentSourceLabel(payment.source || "cash"),
      currency: payment.currency,
      inflow: payment.amount,
      outflow: 0,
      manager: invoice?.manager || client?.manager || "-"
    };
  });
  const outflow = state.expenses.map((expense) => ({
    date: expense.date,
    article: expense.article,
    method: expense.method,
    currency: expense.currency,
    inflow: 0,
    outflow: expense.amount,
    manager: expense.manager
  }));
  return [...inflow, ...outflow].sort((a, b) => b.date.localeCompare(a.date));
}

function salesReportRows() {
  const grouped = {};
  state.invoices.forEach((invoice) => {
    invoice.lines.forEach((line) => {
      const product = byId(state.products, line.productId);
      const key = `${line.productId}:${invoice.clientId}:${invoice.manager}`;
      grouped[key] = grouped[key] || { invoiceId: invoice.id, date: invoice.date, product, client: clientName(invoice.clientId), manager: invoice.manager, qty: 0, revenue: 0, cost: 0 };
      grouped[key].qty += Number(line.qty || 0);
      grouped[key].revenue += Number(line.qty || 0) * Number(line.price || 0);
      grouped[key].cost += Number(line.qty || 0) * uah(product?.cost || 0, product?.costCurrency || "UAH");
    });
  });
  return Object.values(grouped);
}

function stockAnalysisRows() {
  return state.products.map((product) => {
    const ending = inventoryRows().filter((row) => row.product.id === product.id).reduce((sum, row) => sum + row.qty, 0);
    const sold = state.invoices.flatMap((invoice) => invoice.lines).filter((line) => line.productId === product.id).reduce((sum, line) => sum + Number(line.qty || 0), 0);
    const receipt = Math.max(Number(product.minStock || 0) + sold - ending, 0);
    const beginning = ending + sold - receipt;
    const monthlySales = Math.max(sold, product.type === "weapon" ? 1 : 4);
    const months = monthlySales ? ending / monthlySales : 0;
    const rop = Math.ceil(monthlySales / 30 * Number(product.leadTimeDays || 14));
    const recommended = Math.max(rop + Number(product.minStock || 0) - ending, 0);
    const status = ending <= rop ? "Замовити" : ending <= Number(product.minStock || 0) ? "Низький" : "ОК";
    return { product, beginning, receipt, sold, ending, monthlySales, months, status, rop, recommended };
  });
}

function reportDefinitions() {
  const arRows = state.invoices.filter((invoice) => invoice.total > invoice.paid).map((invoice) => ({
    date: invoice.dueDate,
    client: clientName(invoice.clientId),
    manager: invoice.manager,
    currency: invoice.currency,
    debt: invoice.total - invoice.paid,
    invoice: invoice.id
  }));
  const stockRows = inventoryRows().map((row) => ({
    date: today,
    product: `${row.product.brand} ${row.product.model}`,
    warehouse: warehouseName(row.warehouseId),
    qty: row.qty,
    value: row.valueUAH,
    owner: row.clientId ? clientName(row.clientId) : "-"
  }));
  const marketplaceRows = state.marketplaceStats.map((row) => {
    const revenue = row.price * row.sold;
    const cost = uah(row.cost, row.costCurrency) * row.sold;
    const profit = revenue - cost - row.commission - row.logistics - row.otherCosts;
    return {
      date: today,
      marketplace: row.marketplace,
      sku: row.sku,
      price: row.price,
      sold: row.sold,
      revenue,
      commission: row.commission,
      logistics: row.logistics,
      otherCosts: row.otherCosts,
      cost,
      profit,
      profitUnit: row.sold ? profit / row.sold : 0,
      margin: revenue ? Math.round(profit / revenue * 1000) / 10 : 0
    };
  });
  return {
    cash: {
      title: "Рух коштів",
      rows: cashMovementRows(),
      columns: [
        ["date", "Дата"],
        ["article", "Стаття"],
        ["method", "Метод"],
        ["currency", "Валюта"],
        ["inflow", "Надходження", (value, row) => value ? formatMoney(value, row.currency) : "-"],
        ["outflow", "Витрати", (value, row) => value ? formatMoney(value, row.currency) : "-"],
        ["manager", "Менеджер"]
      ]
    },
    expenses: {
      title: "Розшифровка витрат",
      rows: state.expenses,
      columns: [
        ["date", "Дата"],
        ["article", "Стаття"],
        ["supplier", "Постачальник"],
        ["amount", "Сума", (value, row) => formatMoney(value, row.currency)],
        ["currency", "Валюта"],
        ["method", "Метод"],
        ["manager", "Менеджер"],
        ["comment", "Коментар"]
      ]
    },
    ar: {
      title: "Дебіторська заборгованість",
      rows: arRows,
      columns: [
        ["date", "Дата оплати"],
        ["client", "Клієнт"],
        ["manager", "Менеджер"],
        ["currency", "Валюта"],
        ["debt", "Борг", (value, row) => formatMoney(value, row.currency)],
        ["invoice", "Накладна"]
      ]
    },
    warehouse: {
      title: "Відомість по товарах на складах",
      rows: stockRows,
      columns: [
        ["product", "Товар"],
        ["warehouse", "Склад"],
        ["qty", "Кількість"],
        ["value", "Вартість", (value) => formatMoney(value)],
        ["owner", "Власник"]
      ]
    },
    sales: {
      title: "Звіт з продажу",
      rows: salesReportRows().map((row) => ({
        date: row.date || today,
        product: `${row.product?.brand || ""} ${row.product?.model || ""}`.trim(),
        client: row.client,
        manager: row.manager,
        qty: row.qty,
        revenue: row.revenue,
        cost: row.cost,
        markup: row.revenue - row.cost
      })),
      columns: [
        ["date", "Дата"],
        ["product", "Товар"],
        ["client", "Клієнт"],
        ["manager", "Менеджер"],
        ["qty", "Кількість"],
        ["revenue", "Вартість", (value) => formatMoney(value)],
        ["cost", "Собівартість", (value) => formatMoney(value)],
        ["markup", "Націнка", (value) => formatMoney(value)]
      ]
    },
    stock: {
      title: "Аналіз товарних запасів",
      rows: stockAnalysisRows().map((row) => ({ date: today, product: `${row.product.brand} ${row.product.model}`, ...row })),
      columns: [
        ["product", "Товар"],
        ["beginning", "Залишок на початок"],
        ["receipt", "Прихід"],
        ["sold", "Продаж"],
        ["ending", "Залишок кінцевий"],
        ["monthlySales", "Продаж/міс"],
        ["months", "Запас, міс", (value) => Number(value || 0).toFixed(1)],
        ["status", "Статус"],
        ["rop", "ROP"],
        ["recommended", "Рекоменд. замовлення"]
      ]
    },
    marketplaces: {
      title: "Аналітика маркетплейсів",
      rows: marketplaceRows,
      columns: [
        ["marketplace", "Маркетплейс"],
        ["sku", "SKU"],
        ["price", "Ціна", (value) => formatMoney(value)],
        ["sold", "Продано"],
        ["revenue", "Сума", (value) => formatMoney(value)],
        ["commission", "Комісія", (value) => formatMoney(value)],
        ["logistics", "Логістика", (value) => formatMoney(value)],
        ["otherCosts", "Інші витрати", (value) => formatMoney(value)],
        ["cost", "Собівартість", (value) => formatMoney(value)],
        ["profit", "Прибуток", (value) => formatMoney(value)],
        ["profitUnit", "Прибуток/шт", (value) => formatMoney(value)],
        ["margin", "Маржа %", (value) => `${value}%`]
      ]
    }
  };
}

function renderReportBuilder() {
  const reports = reportDefinitions();
  const config = state.reportBuilder;
  const report = reports[config.reportId] || reports.sales;
  const selectedColumns = config.columns?.length ? config.columns.filter((key) => report.columns.some(([columnKey]) => columnKey === key)) : report.columns.map(([key]) => key);
  const visibleColumns = selectedColumns.length ? selectedColumns : report.columns.map(([key]) => key);
  const columns = report.columns.filter(([key]) => visibleColumns.includes(key));
  const from = config.from || "2026-05-01";
  const to = config.to || today;
  const filtered = report.rows.filter((row) => !row.date || (row.date >= from && row.date <= to));
  const sortColumn = config.sortBy || columns[0]?.[0] || "date";
  const sorted = [...filtered].sort((a, b) => {
    const first = a[sortColumn] ?? "";
    const second = b[sortColumn] ?? "";
    const result = typeof first === "number" && typeof second === "number"
      ? first - second
      : String(first).localeCompare(String(second), "uk", { numeric: true });
    return config.sortDir === "asc" ? result : -result;
  });
  const groupColumn = config.groupBy;
  const bodyRows = [];
  let currentGroup = "";
  sorted.forEach((row) => {
    const groupValue = groupColumn ? String(row[groupColumn] ?? "-") : "";
    if (groupColumn && groupValue !== currentGroup) {
      currentGroup = groupValue;
      bodyRows.push(`<tr class="group-row"><td colspan="${columns.length}">${escapeHtml(report.columns.find(([key]) => key === groupColumn)?.[1] || groupColumn)}: ${escapeHtml(groupValue)}</td></tr>`);
    }
    bodyRows.push(`<tr>${columns.map(([key, , renderValue]) => `<td>${renderValue ? renderValue(row[key], row) : escapeHtml(row[key] ?? "-")}</td>`).join("")}</tr>`);
  });

  return `
    <section class="panel section-band">
      <div class="split">
        <h2>Конструктор звітів</h2>
        <span class="pill info">${filtered.length} рядків</span>
      </div>
      <form class="form-grid report-builder" data-report-builder>
        <label class="field"><span>Звіт</span><select name="reportId">${Object.entries(reports).map(([id, item]) => option(id, item.title, id === config.reportId)).join("")}</select></label>
        <label class="field"><span>Дата з</span><input name="from" type="date" value="${from}"></label>
        <label class="field"><span>Дата по</span><input name="to" type="date" value="${to}"></label>
        <label class="field"><span>Сортувати по</span><select name="sortBy">${report.columns.map(([key, label]) => option(key, label, key === sortColumn)).join("")}</select></label>
        <label class="field"><span>Напрям</span><select name="sortDir">${option("asc", "від меншого / А-Я", config.sortDir === "asc")}${option("desc", "від більшого / Я-А", config.sortDir !== "asc")}</select></label>
        <label class="field"><span>Групування</span><select name="groupBy">${option("", "без групування", !groupColumn)}${report.columns.map(([key, label]) => option(key, label, key === groupColumn)).join("")}</select></label>
        <label class="field full"><span>Стовпці</span><select name="columns" multiple>${report.columns.map(([key, label]) => option(key, label, visibleColumns.includes(key))).join("")}</select></label>
      </form>
      <div class="table-wrap">
        <table>
          <thead><tr>${columns.map(([, label]) => `<th>${escapeHtml(label)}</th>`).join("")}</tr></thead>
          <tbody>${bodyRows.join("") || `<tr><td colspan="${columns.length || 1}">Немає даних за вибраний період.</td></tr>`}</tbody>
        </table>
      </div>
    </section>
  `;
}

function renderReports() {
  if (!(role().canViewReports || isAdmin())) {
    return `<section class="panel"><h2>Звіти</h2><p class="notice warn">Поточна роль не має доступу до блоку звітів. Доступ відкриває адміністратор у ролях працівників.</p></section>`;
  }
  const reportsPeriod = { from: state.reportBuilder.from || "2026-05-01", to: state.reportBuilder.to || today };
  const cashRows = cashMovementRows().filter((row) => dateInPeriod(row.date, reportsPeriod));
  const salesRows = salesReportRows().filter((row) => dateInPeriod(row.date, reportsPeriod));
  const stockRows = inventoryRows();
  const arRows = state.invoices.filter((invoice) => invoice.total > invoice.paid && dateInPeriod(invoice.dueDate || invoice.date, reportsPeriod));
  const expenseRows = state.expenses.filter((expense) => dateInPeriod(expense.date, reportsPeriod));
  const payableRows = state.payables.filter((item) => dateInPeriod(item.dueDate || item.date, reportsPeriod));
  const balanceAssets = stockRows.reduce((sum, row) => sum + row.valueUAH, 0) + arRows.reduce((sum, invoice) => sum + uah(invoice.total - invoice.paid, invoice.currency), 0);
  const balanceLiabilities = payableRows.reduce((sum, item) => sum + uah(item.amount, item.currency), 0);

  return `
    <section class="panel no-print">
      <div class="split">
        <h2>Період і друк звітів</h2>
        <button class="secondary" type="button" data-print-scope="reports" ${canPrintDocuments() ? "" : "disabled"}>Друк всіх звітів</button>
      </div>
      <p class="small muted">Звіти нижче формуються за періодом конструктора: ${periodLabel(reportsPeriod)}. Право друку задається у ролях.</p>
    </section>

    <div data-print-area="reports" data-print-title="Звіти CRM · ${periodLabel(reportsPeriod)}">
      ${renderReportBuilder()}

    <section class="grid four section-band">
      <article class="card metric info"><span>Активи</span><strong>${formatMoney(balanceAssets)}</strong><small>Залишки + дебіторка.</small></article>
      <article class="card metric warn"><span>Зобов'язання</span><strong>${formatMoney(balanceLiabilities)}</strong><small>Кредиторка у валюті обліку.</small></article>
      <article class="card metric good"><span>Продажі</span><strong>${formatMoney(salesRows.reduce((sum, row) => sum + row.revenue, 0))}</strong><small>Кількість, вартість, націнка.</small></article>
      <article class="card metric danger"><span>Товарні ризики</span><strong>${stockAnalysisRows().filter((row) => row.status !== "ОК").length}</strong><small>Позиції нижче ROP або мін. залишку.</small></article>
    </section>

    <section class="panel section-band">
      <h2>Рух коштів</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>Дата</th><th>Стаття</th><th>Метод</th><th>Валюта</th><th>Надходження</th><th>Витрати</th><th>Менеджер</th></tr></thead>
        <tbody>${cashRows.map((row) => `<tr><td>${row.date}</td><td>${row.article}</td><td>${row.method}</td><td>${row.currency}</td><td>${row.inflow ? formatMoney(row.inflow, row.currency) : "-"}</td><td>${row.outflow ? formatMoney(row.outflow, row.currency) : "-"}</td><td>${row.manager}</td></tr>`).join("")}</tbody>
      </table></div>
    </section>

    <section class="grid two section-band">
      <div class="panel">
        <h2>Розшифровка витрат</h2>
        <div class="table-wrap"><table>
          <thead><tr><th>Дата</th><th>Стаття</th><th>Постачальник</th><th>Сума</th><th>Метод</th><th>Коментар</th></tr></thead>
          <tbody>${expenseRows.map((expense) => `<tr><td>${expense.date}</td><td>${expense.article}</td><td>${expense.supplier}</td><td>${formatMoney(expense.amount, expense.currency)}</td><td>${expense.method}</td><td>${expense.comment}</td></tr>`).join("")}</tbody>
        </table></div>
      </div>
      <div class="panel">
        <h2>Графік оплат</h2>
        <div class="table-wrap"><table>
          <thead><tr><th>Дата</th><th>Клієнт</th><th>Накладна</th><th>Борг</th><th>Менеджер</th></tr></thead>
          <tbody>${arRows.map((invoice) => `<tr><td>${invoice.dueDate}</td><td>${clientName(invoice.clientId)}</td><td>${invoice.id}</td><td>${formatMoney(invoice.total - invoice.paid, invoice.currency)}</td><td>${invoice.manager}</td></tr>`).join("")}</tbody>
        </table></div>
      </div>
    </section>

    <section class="grid two section-band">
      <div class="panel">
        <h2>Баланс</h2>
        <div class="table-wrap"><table>
          <thead><tr><th>Показник</th><th>Сума</th></tr></thead>
          <tbody>
            <tr><td>Товарні залишки</td><td>${formatMoney(stockRows.reduce((sum, row) => sum + row.valueUAH, 0))}</td></tr>
            <tr><td>Дебіторська заборгованість</td><td>${formatMoney(arRows.reduce((sum, invoice) => sum + uah(invoice.total - invoice.paid, invoice.currency), 0))}</td></tr>
            <tr><td>Кредиторська заборгованість</td><td>${formatMoney(balanceLiabilities)}</td></tr>
            <tr><td><strong>Чистий баланс</strong></td><td><strong>${formatMoney(balanceAssets - balanceLiabilities)}</strong></td></tr>
          </tbody>
        </table></div>
      </div>
      <div class="panel">
        <h2>Дебіторка клієнтів та менеджерів</h2>
        <div class="table-wrap"><table>
          <thead><tr><th>Клієнт</th><th>Менеджер</th><th>Валюта</th><th>Борг</th><th>Накладна</th></tr></thead>
          <tbody>${arRows.map((invoice) => `<tr><td>${clientName(invoice.clientId)}</td><td>${invoice.manager}</td><td>${invoice.currency}</td><td>${formatMoney(invoice.total - invoice.paid, invoice.currency)}</td><td>${invoice.id}</td></tr>`).join("")}</tbody>
        </table></div>
      </div>
    </section>

    <section class="grid two section-band">
      <div class="panel">
        <h2>Кредиторська заборгованість</h2>
        <div class="table-wrap"><table>
          <thead><tr><th>Постачальник</th><th>Стаття</th><th>Менеджер</th><th>Сума</th><th>Дата</th><th>Статус</th></tr></thead>
          <tbody>${payableRows.map((item) => `<tr><td>${item.supplier}</td><td>${item.article}</td><td>${item.manager}</td><td>${formatMoney(item.amount, item.currency)}</td><td>${item.dueDate}</td><td>${statusPill(item.status)}</td></tr>`).join("")}</tbody>
        </table></div>
      </div>
      <div class="panel">
        <h2>Відомість по складах</h2>
        <div class="table-wrap"><table>
          <thead><tr><th>Товар</th><th>Склад</th><th>Кількість</th><th>Вартість</th><th>Власник</th></tr></thead>
          <tbody>${stockRows.map((row) => `<tr><td>${row.product.brand} ${row.product.model}</td><td>${warehouseName(row.warehouseId)}</td><td>${row.qty}</td><td>${formatMoney(row.valueUAH)}</td><td>${row.clientId ? clientName(row.clientId) : "-"}</td></tr>`).join("")}</tbody>
        </table></div>
      </div>
    </section>

    <section class="panel section-band">
      <h2>Звіт з продажу</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>Товар</th><th>Клієнт</th><th>Менеджер</th><th>Кількість</th><th>Вартість</th><th>Собівартість</th><th>Націнка</th><th>План-факт</th></tr></thead>
        <tbody>${salesRows.map((row) => {
          const plan = state.salesPlans.find((item) => item.manager === row.manager)?.plan || 0;
          const fact = plan ? Math.round(row.revenue / plan * 100) : 0;
          return `<tr><td>${row.product?.brand || ""} ${row.product?.model || ""}</td><td>${row.client}</td><td>${row.manager}</td><td>${row.qty}</td><td>${formatMoney(row.revenue)}</td><td>${formatMoney(row.cost)}</td><td>${formatMoney(row.revenue - row.cost)}</td><td>${fact}%</td></tr>`;
        }).join("")}</tbody>
      </table></div>
    </section>

    <section class="panel section-band">
      <h2>Аналіз товарних запасів</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>Товар</th><th>Залишок на початок</th><th>Прихід</th><th>Продаж</th><th>Залишок кінцевий</th><th>Продаж/міс</th><th>Запас, міс</th><th>Статус</th><th>ROP</th><th>Рекоменд. замовлення</th></tr></thead>
        <tbody>${stockAnalysisRows().map((row) => `<tr><td>${row.product.brand} ${row.product.model}</td><td>${row.beginning}</td><td>${row.receipt}</td><td>${row.sold}</td><td>${row.ending}</td><td>${row.monthlySales}</td><td>${row.months.toFixed(1)}</td><td>${row.status === "ОК" ? '<span class="pill good">ОК</span>' : '<span class="pill warn">' + row.status + '</span>'}</td><td>${row.rop}</td><td>${row.recommended}</td></tr>`).join("")}</tbody>
      </table></div>
    </section>

    <section class="panel">
      <h2>Аналітика маркетплейсів</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>Маркетплейс</th><th>SKU</th><th>Ціна</th><th>Продано</th><th>Сума</th><th>Комісія</th><th>Логістика</th><th>Інші витрати</th><th>Собівартість</th><th>Прибуток</th><th>Прибуток/шт</th><th>Маржа %</th></tr></thead>
        <tbody>${state.marketplaceStats.map((row) => {
          const revenue = row.price * row.sold;
          const cost = uah(row.cost, row.costCurrency) * row.sold;
          const profit = revenue - cost - row.commission - row.logistics - row.otherCosts;
          const margin = revenue ? Math.round(profit / revenue * 1000) / 10 : 0;
          return `<tr><td>${row.marketplace}</td><td>${row.sku}</td><td>${formatMoney(row.price, row.currency)}</td><td>${row.sold}</td><td>${formatMoney(revenue, row.currency)}</td><td>${formatMoney(row.commission, row.currency)}</td><td>${formatMoney(row.logistics, row.currency)}</td><td>${formatMoney(row.otherCosts, row.currency)}</td><td>${formatMoney(cost)}</td><td>${formatMoney(profit)}</td><td>${formatMoney(profit / row.sold)}</td><td>${margin}%</td></tr>`;
        }).join("")}</tbody>
      </table></div>
    </section>
    </div>
  `;
}

function renderFinance() {
  const docsPeriod = periodFilter("financeDocs");
  paymentDraft = resolvePaymentDraft();
  const debtorClients = paymentClients(paymentDraft.kind);
  const clientInvoices = openPaymentInvoices().filter((invoice) => !paymentDraft.clientId || invoice.clientId === paymentDraft.clientId);
  const selectedInvoice = byId(state.invoices, paymentDraft.invoiceId);
  const selectedCurrency = selectedInvoice?.currency || byId(state.clients, paymentDraft.clientId)?.currency || "UAH";
  const paymentCanSubmit = paymentDraft.kind === "advance" ? Boolean(paymentDraft.clientId) : Boolean(selectedInvoice);
  const firmOptions = state.settings.firms.map((firm) => option(firm.id, firm.name, firm.id === paymentDraft.firmId)).join("");
  const terminalOptions = paymentTerminalsForFirm(paymentDraft.firmId).map((terminal) => option(terminal.id, `${terminal.name} · ${firmName(terminal.firmId)}`, terminal.id === paymentDraft.terminalId)).join("");
  const receivableByManager = state.managers.map((manager) => ({
    manager,
    amount: state.invoices
      .filter((invoice) => invoice.manager === manager)
      .reduce((sum, invoice) => sum + Math.max(invoice.total - invoice.paid, 0), 0)
  }));
  const filteredPayments = state.payments.filter((payment) => dateInPeriod(payment.date, docsPeriod));
  const filteredCashShifts = state.cashShifts.filter((shift) => dateInPeriod(shift.date, docsPeriod));
  const filteredExpenses = state.expenses.filter((expense) => dateInPeriod(expense.date, docsPeriod));
  const filteredPayables = state.payables.filter((item) => dateInPeriod(item.dueDate || item.date || today, docsPeriod));
  return `
    <section class="grid two section-band">
      <div class="panel">
        <h2>Внести оплату</h2>
        <form class="form-grid" data-action="create-payment">
          <label class="field"><span>Джерело оплати</span><select name="paymentSource" data-payment-source>${variantOptions("paymentSources", paymentDraft.source)}</select></label>
          <label class="field"><span>Тип внесення</span><select name="paymentKind" data-payment-kind>${option("invoice", "До накладної", paymentDraft.kind === "invoice")}${option("advance", "Аванс клієнта", paymentDraft.kind === "advance")}</select></label>
          <label class="field wide"><span>Клієнт</span><select name="clientId" data-payment-client ${debtorClients.length ? "" : "disabled"}>${debtorClients.length ? debtorClients.map((client) => {
            const debt = openPaymentInvoices().filter((invoice) => invoice.clientId === client.id).reduce((sum, invoice) => sum + uah(invoiceDebt(invoice), invoice.currency), 0);
            const debtLabel = debt > 0 ? ` · борг ${formatMoney(debt)}` : " · аванс";
            return option(client.id, `${client.name}${debtLabel}`, client.id === paymentDraft.clientId);
          }).join("") : '<option value="">Немає клієнтів</option>'}</select></label>
          <label class="field full"><span>Накладна клієнта</span><select name="invoiceId" data-payment-invoice ${paymentDraft.kind === "invoice" && clientInvoices.length ? "" : "disabled"}>${paymentDraft.kind === "advance" ? '<option value="">Аванс без прив’язки до накладної</option>' : paymentInvoiceOptions(clientInvoices, paymentDraft.invoiceId)}</select></label>
          <label class="field wide"><span>Фірма зарахування</span><select name="firmId" data-payment-firm>${firmOptions}</select></label>
          ${paymentDraft.source === "card" ? `<label class="field wide"><span>Термінал</span><select name="terminalId" data-payment-terminal ${terminalOptions ? "" : "disabled"}>${terminalOptions || '<option value="">Немає термінала для фірми</option>'}</select></label>` : '<input type="hidden" name="terminalId" value="">'}
          ${paymentDraft.source === "cash" ? `<label class="field"><span>ПРРО</span><select name="prro" data-payment-prro>${option("true", "Проводити ПРРО", paymentDraft.prro === "true")}${option("false", "Не проводити ПРРО", paymentDraft.prro === "false")}</select></label>` : '<input type="hidden" name="prro" value="false">'}
          <label class="field"><span>Дата</span><input name="date" type="date" value="${today}"></label>
          <label class="field"><span>Сума</span><input name="amount" inputmode="decimal" value="0"></label>
          <label class="field"><span>Валюта</span><select name="currency">${Object.keys(state.settings.rates).map((currency) => option(currency, currency, currency === selectedCurrency)).join("")}</select></label>
          <label class="field"><span>Курс до UAH</span><input name="rate" type="text" inputmode="decimal" placeholder="автоматично"></label>
          <label class="field wide"><span>Референс</span><input name="bankRef" placeholder="${paymentDraft.source === "bank" ? "банк / IBAN / виписка" : paymentDraft.source === "card" ? "RRN / чек термінала / еквайринг" : "номер касового ордера / зміна"}"></label>
          <div class="table-wrap full">
            <table>
              <thead><tr><th>Накладна</th><th>Дата</th><th>Сума</th><th>Оплачено</th><th>Борг</th><th>До оплати</th></tr></thead>
              <tbody>
                ${clientInvoices.length ? clientInvoices.map((invoice) => `
                  <tr>
                    <td><strong>${invoice.id}</strong><br><span class="small muted">${invoice.channel} · ${invoice.manager}</span></td>
                    <td>${invoice.date}</td>
                    <td>${formatMoney(invoice.total, invoice.currency)}</td>
                    <td>${formatMoney(invoice.paid, invoice.currency)}</td>
                    <td><strong>${formatMoney(invoiceDebt(invoice), invoice.currency)}</strong></td>
                    <td>${invoice.dueDate || "-"}</td>
                  </tr>
                `).join("") : '<tr><td colspan="6">У вибраного клієнта немає накладних з боргом.</td></tr>'}
              </tbody>
            </table>
          </div>
          <button class="primary" type="submit" ${paymentCanSubmit ? "" : "disabled"}>${paymentDraft.kind === "advance" ? "Внести аванс" : "Прив'язати оплату"}</button>
        </form>
      </div>
      <div class="panel">
        <h2>Дебіторка менеджерів</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Менеджер</th><th>Дебіторка</th><th>Клієнти</th></tr></thead>
            <tbody>
              ${receivableByManager.map((row) => `
                <tr>
                  <td>${row.manager}</td>
                  <td>${formatMoney(row.amount)}</td>
                  <td>${state.clients.filter((client) => client.manager === row.manager).length}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="grid two section-band">
      <div class="panel">
        <h2>Внести витрату</h2>
        <form class="form-grid" data-action="create-expense">
          <label class="field"><span>Дата</span><input name="date" type="date" value="${today}"></label>
          <label class="field"><span>Стаття</span><select name="article">${variantOptions("expenseArticles")}</select></label>
          <label class="field"><span>Сума</span><input name="amount" inputmode="decimal" value="0"></label>
          <label class="field"><span>Валюта</span><select name="currency">${Object.keys(state.settings.rates).map((currency) => option(currency, currency)).join("")}</select></label>
          <label class="field"><span>Метод</span><select name="method">${variantOptions("financeMethods")}</select></label>
          <label class="field"><span>Постачальник</span><input name="supplier" placeholder="контрагент"></label>
          <label class="field"><span>Менеджер</span><select name="manager">${employeeOptions()}</select></label>
          <label class="field wide"><span>Коментар</span><input name="comment" placeholder="призначення витрати"></label>
          <button class="primary" type="submit">Додати витрату</button>
        </form>
      </div>
      <div class="panel">
        <h2>Створити кредиторку</h2>
        <form class="form-grid" data-action="create-payable">
          <label class="field wide"><span>Постачальник</span><input name="supplier" required></label>
          <label class="field"><span>Стаття</span><select name="article">${variantOptions("expenseArticles")}</select></label>
          <label class="field"><span>Сума</span><input name="amount" inputmode="decimal" value="0"></label>
          <label class="field"><span>Валюта</span><select name="currency">${Object.keys(state.settings.rates).map((currency) => option(currency, currency)).join("")}</select></label>
          <label class="field"><span>Дата оплати</span><input name="dueDate" type="date" value="${today}"></label>
          <label class="field"><span>Менеджер</span><select name="manager">${employeeOptions()}</select></label>
          <button class="primary" type="submit">Додати борг</button>
        </form>
      </div>
    </section>

    <section class="panel section-band no-print">
      <h2>Період фінансових документів</h2>
      ${renderPeriodPrintControls("financeDocs", "Оплати та звірка каси", docsPeriod, filteredPayments.length + filteredCashShifts.length)}
    </section>

    <section class="grid two" data-print-area="financeDocs" data-print-title="Фінансові документи">
      <div class="panel">
        <h2>Оплати</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Дата</th><th>Клієнт</th><th>Накладна</th><th>Сума</th><th>UAH екв.</th><th>Джерело</th><th>Фірма / термінал</th><th>Референс</th><th>Дії</th></tr></thead>
            <tbody>
              ${filteredPayments.map((payment) => `
                <tr>
                  <td>${payment.date}</td>
                  <td>${clientName(payment.clientId || byId(state.invoices, payment.invoiceId)?.clientId)}</td>
                  <td>${payment.advance ? '<span class="pill info">аванс</span>' : payment.invoiceId}</td>
                  <td>${formatMoney(payment.amount, payment.currency)}</td>
                  <td>${formatMoney(payment.amount * payment.rate)}</td>
                  <td>${paymentSourceLabel(payment.source || (payment.method === "Банк" ? "bank" : "cash"))}<br><span class="small muted">${payment.prro ? "ПРРО" : payment.source === "cash" ? "без ПРРО" : payment.method}</span></td>
                  <td>${payment.firmId ? firmName(payment.firmId) : "-"}<br><span class="small muted">${payment.terminalId ? terminalName(payment.terminalId) : "-"}</span></td>
                  <td>${payment.bankRef || "-"}</td>
                  <td class="row-actions no-print"><button class="ghost" data-edit-payment="${payment.id}" ${canEditPostedDocument("payment") ? "" : "disabled"}>Змінити</button></td>
                </tr>
              `).join("") || '<tr><td colspan="9" class="muted">Немає оплат за вибраний період.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
      <div class="panel">
        <h2>Звірка каси</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Зміна</th><th>Менеджер</th><th>Очікувано</th><th>Факт</th><th>Різниця</th><th>Стан</th></tr></thead>
            <tbody>
              ${filteredCashShifts.map((shift) => `
                <tr>
                  <td>${shift.date}</td>
                  <td>${shift.manager}</td>
                  <td>${formatMoney(shift.expected)}</td>
                  <td>${formatMoney(shift.actual)}</td>
                  <td>${formatMoney(shift.actual - shift.expected)}</td>
                  <td>${shift.closed ? '<span class="pill good">закрито</span>' : '<span class="pill warn">відкрита</span>'}</td>
                </tr>
              `).join("") || '<tr><td colspan="6" class="muted">Немає касових змін за вибраний період.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
      <div class="panel">
        <h2>Витрати</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Дата</th><th>Стаття</th><th>Сума</th><th>Метод</th><th>Постачальник</th><th>Менеджер</th><th>Дії</th></tr></thead>
            <tbody>
              ${filteredExpenses.map((expense) => `
                <tr>
                  <td>${expense.date}</td>
                  <td>${expense.article}</td>
                  <td>${formatMoney(expense.amount, expense.currency)}</td>
                  <td>${expense.method}</td>
                  <td>${expense.supplier || "-"}</td>
                  <td>${expense.manager || "-"}</td>
                  <td class="row-actions no-print"><button class="ghost" data-edit-expense="${expense.id}" ${canEditPostedDocument("expense") ? "" : "disabled"}>Змінити</button></td>
                </tr>
              `).join("") || '<tr><td colspan="7" class="muted">Немає витрат за вибраний період.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
      <div class="panel">
        <h2>Кредиторка</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Дата оплати</th><th>Постачальник</th><th>Стаття</th><th>Сума</th><th>Менеджер</th><th>Стан</th><th>Дії</th></tr></thead>
            <tbody>
              ${filteredPayables.map((payable) => `
                <tr>
                  <td>${payable.dueDate || "-"}</td>
                  <td>${payable.supplier}</td>
                  <td>${payable.article}</td>
                  <td>${formatMoney(payable.amount, payable.currency)}</td>
                  <td>${payable.manager || "-"}</td>
                  <td>${statusPill(payable.status || "open")}</td>
                  <td class="row-actions no-print"><button class="ghost" data-edit-payable="${payable.id}" ${canEditPostedDocument("payable") ? "" : "disabled"}>Змінити</button></td>
                </tr>
              `).join("") || '<tr><td colspan="7" class="muted">Немає кредиторки за вибраний період.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}

function marketplaceNames() {
  return state.integrations
    .filter((integration) => ["rozetka", "prom", "epicentr", "allo"].includes(integration.id))
    .map((integration) => integration.name);
}

function productAvailableQty(productId, warehouseId = "", firmId = "") {
  const product = byId(state.products, productId);
  if (!product) return 0;
  if (product.type === "weapon") {
    return serialsForProduct(product)
      .filter(serialIsSelectable)
      .filter((serial) => (!warehouseId || serial.warehouseId === warehouseId) && (!firmId || (serial.firmId || "vat") === firmId))
      .length;
  }
  return stockQtyWhere(productId, ownStockPredicate({ warehouseId, firmId }));
}

function publicationPayload(publication) {
  const product = byId(state.products, publication.productId);
  return {
    marketplace: publication.marketplace,
    sku: publication.sku,
    externalId: publication.externalId,
    title: publication.title,
    product: product ? {
      id: product.id,
      type: product.type,
      brand: product.brand,
      model: product.model,
      category: product.category,
      barcode: product.barcode,
      supplierSku: product.supplierSku,
      internalCode: product.internalCode,
      uktzed: product.uktzed,
      description: product.description,
      photos: (product.photos || []).map((photo) => ({ name: photo.name, type: photo.type, width: photo.width, height: photo.height, dataUrl: photo.dataUrl }))
    } : null,
    price: publication.price,
    currency: publication.currency,
    stockQty: publication.stockQty,
    status: publication.status
  };
}

function marketplaceOrderMatchesFilter(order, filter) {
  return dateInOptionalPeriod(order.date, filter)
    && (!filter.status || order.status === filter.status)
    && (!filter.marketplace || order.marketplace === filter.marketplace);
}

function marketplacePublicationFilter() {
  const filter = state.marketplacePublicationFilters || {};
  return {
    search: filter.search || "",
    expanded: Boolean(filter.expanded)
  };
}

function normalizeSearchText(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\s+/g, " ")
    .trim();
}

function searchWords(value) {
  return normalizeSearchText(value).split(" ").filter(Boolean);
}

function marketplacePublicationSearchText(publication) {
  const product = byId(state.products, publication.productId);
  const crmQty = productAvailableQty(publication.productId);
  return normalizeSearchText([
    publication.marketplace,
    publication.sku,
    publication.externalId,
    publication.title,
    publication.price,
    publication.currency,
    publication.stockQty,
    crmQty,
    publication.manager,
    publication.status,
    statusPill(publication.status).replace(/<[^>]+>/g, " "),
    publication.lastSync,
    product?.brand,
    product?.model,
    product?.category,
    product?.supplierSku,
    product?.internalCode,
    product?.barcode,
    product?.marketplaceSku
  ].filter(Boolean).join(" "));
}

function marketplacePublicationMatchesSearch(publication, filter) {
  const words = Array.isArray(filter) ? filter : searchWords(filter.search || filter);
  if (!words.length) return true;
  const haystack = marketplacePublicationSearchText(publication);
  return words.every((word) => haystack.includes(word));
}

function rozetkaImportedOrderFilter() {
  const filter = state.rozetkaImportedOrderFilters || {};
  const sortBy = ["date", "externalOrderId", "buyer", "product", "total", "delivery", "payment", "status"].includes(filter.sortBy)
    ? filter.sortBy
    : "date";
  return {
    from: filter.from || "",
    to: filter.to || "",
    status: filter.status || "",
    sortBy,
    sortDir: filter.sortDir === "asc" ? "asc" : "desc",
    expanded: Boolean(filter.expanded)
  };
}

function rozetkaImportedOrderTotal(order) {
  return Number(order.payment?.amount || (Number(order.qty || 1) * Number(order.price || 0)));
}

function rozetkaImportedOrderProductLabel(order) {
  const product = byId(state.products, order.productId);
  return product ? `${product.brand} ${product.model}` : order.sku || "Товар Rozetka";
}

function rozetkaImportedOrderSortValue(order, key) {
  const buyer = marketplaceOrderBuyer(order);
  const delivery = order.delivery || {};
  const payment = order.payment || {};
  const status = MARKETPLACE_ORDER_STATUS_MAP[order.status]?.label || order.status || "";
  const values = {
    date: order.date || "",
    externalOrderId: order.externalOrderId || "",
    buyer: buyer.name || "",
    product: rozetkaImportedOrderProductLabel(order),
    total: rozetkaImportedOrderTotal(order),
    delivery: `${delivery.status || ""} ${delivery.ttn || ""} ${delivery.service || ""}`,
    payment: `${payment.status || ""} ${payment.apiStatus || ""} ${payment.source || payment.method || ""}`,
    status
  };
  return values[key] ?? "";
}

function compareSortValues(first, second) {
  if (typeof first === "number" && typeof second === "number") return first - second;
  return String(first ?? "").localeCompare(String(second ?? ""), "uk", { numeric: true, sensitivity: "base" });
}

function sortRozetkaImportedOrders(orders, filter) {
  const direction = filter.sortDir === "asc" ? 1 : -1;
  return [...orders].sort((first, second) => {
    const result = compareSortValues(
      rozetkaImportedOrderSortValue(first, filter.sortBy),
      rozetkaImportedOrderSortValue(second, filter.sortBy)
    );
    if (result) return result * direction;
    return String(second.rozetka?.importedAt || second.date || "").localeCompare(
      String(first.rozetka?.importedAt || first.date || ""),
      "uk",
      { numeric: true, sensitivity: "base" }
    );
  });
}

function marketplaceOrderOptions(selectedId = "") {
  return state.marketplaceOrders.map((order) => option(
    order.id,
    `${order.date} · ${order.marketplace} · ${order.externalOrderId} · ${MARKETPLACE_ORDER_STATUS_MAP[order.status]?.label || order.status}`,
    order.id === selectedId
  )).join("");
}

function renderMarketplaceOrderFilters(names, filter, resultCount) {
  return `
    <form class="period-toolbar marketplace-filter no-print" data-marketplace-order-filter>
      <label class="field compact"><span>Дата від</span><input name="from" type="date" value="${escapeHtml(filter.from)}"></label>
      <label class="field compact"><span>Дата до</span><input name="to" type="date" value="${escapeHtml(filter.to)}"></label>
      <label class="field compact"><span>Статус</span><select name="status">
        <option value="">Всі статуси</option>
        ${MARKETPLACE_ORDER_STATUSES.map((item) => option(item.id, item.label, item.id === filter.status)).join("")}
      </select></label>
      <label class="field compact"><span>Маркетплейс</span><select name="marketplace">
        <option value="">Всі маркетплейси</option>
        ${names.map((name) => option(name, name, name === filter.marketplace)).join("")}
      </select></label>
      <span class="pill info">${resultCount} замовлень</span>
      <button class="secondary" type="button" data-print-scope="marketplaceDocs" ${canPrintDocuments() ? "" : "disabled"}>Друк</button>
      <button class="ghost" type="button" data-reset-marketplace-order-filter>Скинути</button>
    </form>
  `;
}

function defaultMarketplacePublicationLine(productId = "") {
  const product = byId(state.products, productId) || state.products[0];
  const price = product ? productSalePrice(product, marketplacePriceTypeId()) : { amount: 0, currency: "UAH" };
  return {
    marketplace: marketplaceNames()[0] || "",
    productId: product?.id || "",
    sku: product?.supplierSku || product?.internalCode || "",
    externalId: "",
    title: product ? `${product.brand} ${product.model}` : "",
    price: price.amount || product?.price || 0,
    currency: price.currency || product?.currency || "UAH",
    manager: state.currentManager
  };
}

function marketplacePublicationDraftLines() {
  const lines = Array.isArray(marketplacePublicationDraft.lines) && marketplacePublicationDraft.lines.length
    ? marketplacePublicationDraft.lines
    : [defaultMarketplacePublicationLine()];
  return lines.map((line) => ({ ...defaultMarketplacePublicationLine(line.productId), ...line }));
}

function renderMarketplacePublicationLine(line, index, names) {
  const product = byId(state.products, line.productId) || state.products[0];
  return `
    <tr data-marketplace-publication-line="${index}">
      <td>
        <select name="marketplace" data-marketplace-publication-line-index="${index}">
          ${names.map((name) => option(name, name, name === (line.marketplace || names[0]))).join("")}
        </select>
      </td>
      <td class="line-product">
        <select name="productId" data-marketplace-publication-line-index="${index}" data-marketplace-publication-product>
          ${state.products.map((item) => option(item.id, `${item.brand} ${item.model}`, item.id === product?.id)).join("")}
        </select>
        <span class="small muted">${product ? productCodes(product) : ""}</span>
      </td>
      <td><input name="sku" data-marketplace-publication-line-index="${index}" value="${escapeHtml(line.sku || "")}" required placeholder="SKU"></td>
      <td><input name="externalId" data-marketplace-publication-line-index="${index}" value="${escapeHtml(line.externalId || "")}" placeholder="id каналу"></td>
      <td class="line-product"><input name="title" data-marketplace-publication-line-index="${index}" value="${escapeHtml(line.title || "")}" required placeholder="назва публікації"></td>
      <td><input name="price" data-marketplace-publication-line-index="${index}" inputmode="decimal" value="${escapeHtml(line.price ?? 0)}"></td>
      <td><select name="currency" data-marketplace-publication-line-index="${index}">${Object.keys(state.settings.rates).map((currency) => option(currency, currency, currency === (line.currency || "UAH"))).join("")}</select></td>
      <td><select name="manager" data-marketplace-publication-line-index="${index}">${employeeOptions(line.manager || state.currentManager)}</select></td>
      <td class="row-actions no-print">
        <button class="danger" type="button" data-remove-marketplace-publication-line="${index}" ${marketplacePublicationDraftLines().length <= 1 ? "disabled" : ""}>Прибрати</button>
      </td>
    </tr>
  `;
}

function collectMarketplacePublicationLinesFromForm(form) {
  return Array.from(form.querySelectorAll("[data-marketplace-publication-line]")).map((row) => ({
    marketplace: row.querySelector('[name="marketplace"]')?.value || "",
    productId: row.querySelector('[name="productId"]')?.value || "",
    sku: row.querySelector('[name="sku"]')?.value || "",
    externalId: row.querySelector('[name="externalId"]')?.value || "",
    title: row.querySelector('[name="title"]')?.value || "",
    price: normalizeDecimalText(row.querySelector('[name="price"]')?.value || 0),
    currency: row.querySelector('[name="currency"]')?.value || "UAH",
    manager: row.querySelector('[name="manager"]')?.value || state.currentManager
  })).filter((line) => line.productId || line.sku || line.title);
}

function updateMarketplacePublicationDraftFromForm(form) {
  marketplacePublicationDraft = {
    ...marketplacePublicationDraft,
    lines: collectMarketplacePublicationLinesFromForm(form)
  };
}

function rozetkaInboundState() {
  if (!state.rozetkaInbound) state.rozetkaInbound = clone(seedState.rozetkaInbound);
  return state.rozetkaInbound;
}

function queryFromForm(form, keys) {
  const data = formData(form);
  const params = new URLSearchParams();
  keys.forEach((key) => {
    const value = data[key];
    if (value !== undefined && String(value).trim() !== "") {
      params.set(key, value);
    }
  });
  return params;
}

async function fetchRozetkaInbound(form, path, keys) {
  const params = queryFromForm(form, keys);
  const response = await fetch(`${path}${params.toString() ? `?${params.toString()}` : ""}`, {
    headers: { Accept: "application/json" }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false || payload.ok === false) {
    throw new Error(payload.error || payload?.errors?.message || `HTTP ${response.status}`);
  }
  return payload;
}

function rozetkaItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content?.items)) return payload.content.items;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function rozetkaOrders(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content?.orders)) return payload.content.orders;
  if (Array.isArray(payload?.orders)) return payload.orders;
  return [];
}

function textFromHtml(value) {
  const html = String(value || "").trim();
  if (!html) return "";
  const element = document.createElement("div");
  element.innerHTML = html;
  return (element.textContent || element.innerText || "").replace(/\s+/g, " ").trim();
}

function uniqueCode(prefix, value, field, existingId = "") {
  const raw = String(value || Date.now()).trim().replace(/\s+/g, "-");
  const base = `${prefix}-${raw}`.replace(/[^a-zA-Z0-9а-яА-ЯіїєґІЇЄҐ_-]/g, "-").replace(/-+/g, "-");
  let candidate = base;
  let index = 2;
  while (state.products.some((product) => product.id !== existingId && String(product[field] || "").toLowerCase() === candidate.toLowerCase())) {
    candidate = `${base}-${index}`;
    index += 1;
  }
  return candidate;
}

function rozetkaCategoryName(item) {
  return item?.price_category?.title_ua || item?.price_category?.title || item?.rz_category?.title_ua || item?.rz_category?.title || item?.catalog_category?.name_ua || item?.catalog_category?.name || "Rozetka";
}

function rozetkaBrandName(item) {
  return item?.price_producer_name || item?.rz_producer?.title || item?.sync_source_producer?.title || "Rozetka";
}

function findProductForRozetkaGoods(item) {
  const keys = [item?.rz_item_id, item?.item_id, item?.id, item?.price_offer_id, item?.article]
    .filter((value) => value !== undefined && value !== null && String(value).trim() !== "")
    .map((value) => String(value).trim().toLowerCase());
  return state.products.find((product) => {
    const rozetka = product.rozetka || {};
    const productKeys = [rozetka.rz_item_id, rozetka.item_id, rozetka.price_offer_id, rozetka.article, product.marketplaceSku, product.supplierSku, product.internalCode, product.barcode]
      .filter((value) => value !== undefined && value !== null && String(value).trim() !== "")
      .map((value) => String(value).trim().toLowerCase());
    return productKeys.some((key) => keys.includes(key));
  }) || null;
}

function upsertRozetkaProduct(item) {
  const existing = findProductForRozetkaGoods(item);
  const name = String(item.name_ua || item.name || item.name_ru || item.price_offer_id || item.article || "Rozetka товар").trim();
  const brand = rozetkaBrandName(item);
  const category = rozetkaCategoryName(item);
  const sku = String(item.article || item.price_offer_id || item.item_id || "").trim();
  const marketplaceSku = String(item.price_offer_id || item.article || item.item_id || "").trim();
  const itemId = item.item_id ?? item.id ?? null;
  const internalCode = existing?.internalCode || uniqueCode("RZ", itemId || item.price_offer_id || sku, "internalCode", existing?.id);
  const barcode = existing?.barcode || uniqueCode("RZB", item.article || item.price_offer_id || itemId, "barcode", existing?.id);
  const description = textFromHtml(item.description_ua || item.description || item.docket_ua || item.docket || "");
  const price = parseDecimal(item.price ?? item.price_promo ?? item.price_old ?? existing?.price, existing?.price || 0);
  const photoUrls = [...new Set([...(Array.isArray(item.photo) ? item.photo : []), ...(Array.isArray(item.photo_preview) ? item.photo_preview : [item.photo_preview])]
    .filter(Boolean)
    .map((url) => String(url).trim())
    .filter((url) => /^https?:\/\//i.test(url) && !url.includes("no-image")))];
  const photos = photoUrls.slice(0, MAX_PRODUCT_PHOTOS).map((url, index) => ({
    id: `rz-photo-${itemId || item.price_offer_id || item.article || Date.now()}-${index + 1}`,
    name: `${name} ${index + 1}`,
    type: "remote",
    url,
    dataUrl: rozetkaImageUrl(url)
  }));
  const rozetka = {
    ...(existing?.rozetka || {}),
    importedAt: currentTimestamp(),
    source: "goods/new",
    rz_item_id: item.rz_item_id ?? null,
      item_id: itemId,
      price_offer_id: item.price_offer_id ?? null,
      market_id: item.market_id ?? null,
      sync_source_id: item.sync_source_id ?? null,
      article: item.article ?? null,
    available: item.available ?? null,
    available_title: item.available_title ?? null,
    upload_status: item.upload_status ?? null,
    upload_status_title: item.upload_status_title ?? null,
    item_active: item.item_active ?? null,
    rz_sell_status: item.rz_sell_status ?? null,
      stock_quantity: item.stock_quantity ?? null,
      catalog_id: item.catalog_id ?? null,
      duplicate_mark: item.duplicate_mark ?? null,
    category,
    producer: brand,
    raw: item
  };

  if (existing) {
    existing.marketplaceSku = marketplaceSku || existing.marketplaceSku;
    existing.supplierSku = sku || existing.supplierSku;
    existing.price = price || existing.price;
    existing.currency = "UAH";
    existing.category = existing.rozetka ? category : existing.category || category;
    existing.brand = existing.rozetka ? brand : existing.brand || brand;
      existing.model = existing.rozetka ? name : existing.model || name;
      existing.description = description || existing.description || "";
      if (photos.length) existing.photos = photos;
      existing.rozetka = rozetka;
    return { product: existing, mode: "updated" };
  }

  const product = {
    id: uniqueId("p"),
    type: "regular",
    model: name,
    caliber: "",
    brand,
    erzRequired: false,
    barcode,
    supplierSku: sku || marketplaceSku || internalCode,
    internalCode,
    uktzed: "",
    price,
    currency: "UAH",
    cost: 0,
    costCurrency: "UAH",
    category,
    unit: "шт",
    minStock: 0,
    leadTimeDays: 14,
    catalogTag: "Rozetka",
    marketplaceSku,
    description,
    photos,
    rozetka
  };
  state.products.unshift(product);
  return { product, mode: "created" };
}

function upsertRozetkaPublication(item, product) {
  const sku = String(item.price_offer_id || item.article || item.item_id || item.id || product.marketplaceSku || product.supplierSku || "").trim();
  const externalId = String(item.rz_item_id || item.item_id || item.id || sku).trim();
  const existing = state.marketplacePublications.find((publication) => publication.marketplace === "Rozetka" && (
    (externalId && publication.externalId === externalId) || (sku && publication.sku === sku)
  ));
  const payload = {
    marketplace: "Rozetka",
    productId: product.id,
    sku,
    externalId,
    title: item.name_ua || item.name || product.model,
    price: parseDecimal(item.price ?? item.price_promo ?? item.price_old, product.price || 0),
    currency: "UAH",
    stockQty: Number(item.stock_quantity || 0),
    status: item.upload_status === 0 ? "needs_sync" : "published",
    photosStatus: Array.isArray(item.photo) && item.photo.length ? "ok" : "missing",
    lastSync: currentTimestamp(),
    manager: existing?.manager || state.currentManager,
    rozetka: product.rozetka
  };
  if (existing) {
    Object.assign(existing, payload, { id: existing.id });
    return "updated";
  }
  state.marketplacePublications.unshift({ id: uniqueId("pub"), ...payload });
  return "created";
}

function findProductForRozetkaPurchase(purchase) {
  const itemId = purchase?.item_id;
  const sku = purchase?.item?.price_offer_id || purchase?.price_offer_id || purchase?.article;
  return state.products.find((product) => {
    const rozetka = product.rozetka || {};
    return [rozetka.item_id, rozetka.price_offer_id, rozetka.article, product.marketplaceSku, product.supplierSku]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase())
      .some((value) => value === String(itemId || "").toLowerCase() || value === String(sku || "").toLowerCase());
  }) || null;
}

function productFromRozetkaPurchase(purchase) {
  const pseudoItem = {
    item_id: purchase?.item_id,
    price_offer_id: purchase?.item?.price_offer_id || purchase?.price_offer_id || purchase?.item_id,
    article: purchase?.item?.article || purchase?.article || purchase?.item_id,
    name: purchase?.item_name || purchase?.item?.name,
    name_ua: purchase?.item_name || purchase?.item?.name_ua,
    price: purchase?.price_with_discount || purchase?.price,
    stock_quantity: 0,
    available: 1,
    upload_status: null,
    rz_producer: purchase?.item?.rz_producer,
    price_producer_name: purchase?.item?.producer || purchase?.item?.price_producer_name,
    price_category: purchase?.item?.price_category,
    rz_category: purchase?.item?.rz_category,
    raw_purchase: purchase
  };
  return upsertRozetkaProduct(pseudoItem).product;
}

function rozetkaOrderBuyer(order) {
  const delivery = order.delivery || {};
  const nameFromValue = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
    return String(value.full_name || value.name || [value.last_name, value.first_name, value.second_name].filter(Boolean).join(" ") || "").replace(/\s+/g, " ").trim();
  };
  const name = nameFromValue(delivery.recipient_title)
    || [delivery.recipient_last_name, delivery.recipient_first_name, delivery.recipient_second_name].filter(Boolean).join(" ").replace(/\s+/g, " ").trim()
    || nameFromValue(order.recipient_title)
    || nameFromValue(order.user_title)
    || nameFromValue(order.user?.title)
    || nameFromValue(order.user?.contact_fio)
    || nameFromValue(order.user?.name)
    || "Покупець Rozetka";
  const city = delivery.city?.title || delivery.city_name || delivery.place || "";
  const address = [
    city,
    delivery.delivery_service_name || delivery.warehouse?.title || delivery.warehouse_name || "",
    delivery.place_street,
    delivery.place_house,
    delivery.place_flat ? `кв. ${delivery.place_flat}` : "",
    delivery.place_number
  ].filter(Boolean).join(", ");
  return {
    name,
    phone: delivery.recipient_phone || order.user_phone || order.recipient_phone || order.user?.phone || "",
    email: delivery.email || order.user?.email || "",
    edrpou: "",
    address
  };
}

function isRozetkaBuyerPlaceholder(name) {
  const normalized = String(name || "").trim().toLowerCase();
  return !normalized || normalized === "rozetka" || normalized === "розетка" || normalized === "покупець rozetka" || normalized === "покупець розетка";
}

function marketplaceOrderBuyer(order) {
  const current = order.buyer || {};
  if (order.marketplace !== "Rozetka" || !order.rozetka?.raw) return current;
  const fromRaw = rozetkaOrderBuyer(order.rozetka.raw);
  const buyer = {
    ...current,
    name: isRozetkaBuyerPlaceholder(current.name) ? fromRaw.name : current.name,
    phone: current.phone || fromRaw.phone,
    email: current.email || fromRaw.email,
    edrpou: current.edrpou || fromRaw.edrpou,
    address: current.address || fromRaw.address
  };
  order.buyer = buyer;
  return buyer;
}

function rozetkaOrderCrmStatus(order) {
  if (Number(order.status_group) === 2) return "delivered";
  if (order.ttn || order.delivery?.ttn || order.carrier?.carrier_track_num) return "sent_to_delivery";
  return "new_order";
}

function rozetkaOrderPaymentStatus(order) {
  const statusName = String(order.status_payment?.name || order.payment_status || "").toLowerCase();
  if (order.is_payed || ["paid", "payed", "success", "completed"].includes(statusName)) return "paid";
  if (["cancelled", "failed", "error"].includes(statusName)) return "failed";
  return statusName ? "pending" : "expected";
}

function upsertRozetkaOrder(order) {
  const purchases = Array.isArray(order.purchases) ? order.purchases : [];
  const firstPurchase = purchases[0] || {};
  const product = findProductForRozetkaPurchase(firstPurchase) || productFromRozetkaPurchase(firstPurchase);
  const qty = Number(order.total_quantity || firstPurchase.quantity || purchases.reduce((sum, purchase) => sum + Number(purchase.quantity || 0), 0) || 1);
  const price = parseDecimal(firstPurchase.price_with_discount ?? firstPurchase.price ?? (Number(order.amount || 0) / Math.max(qty, 1)), 0);
  const externalOrderId = `RZ-${order.id}`;
  const existing = state.marketplaceOrders.find((item) => item.marketplace === "Rozetka" && item.externalOrderId === externalOrderId);
  const paymentStatus = rozetkaOrderPaymentStatus(order);
  const deliveryTtn = order.ttn || order.delivery?.ttn || order.carrier?.carrier_track_num || "";
  const payload = normalizeMarketplaceOrder({
    id: existing?.id || uniqueId("mpo"),
    marketplace: "Rozetka",
    externalOrderId,
    date: String(order.created || today).slice(0, 10),
    status: rozetkaOrderCrmStatus(order),
    dates: {
      created: String(order.created || today).slice(0, 10),
      agreed: "",
      warehouse: "",
      delivery: deliveryTtn ? today : "",
      delivered: Number(order.status_group) === 2 ? today : "",
      paid: paymentStatus === "paid" ? today : ""
    },
    warehouseStatus: "new",
    manager: existing?.manager || state.currentManager,
    productId: product?.id || "",
    sku: String(firstPurchase.item_id || product?.marketplaceSku || product?.supplierSku || ""),
    qty,
    price,
    currency: "UAH",
    buyer: rozetkaOrderBuyer(order),
    delivery: {
      service: order.delivery_service?.title || order.delivery?.delivery_service?.title || order.delivery?.type?.title || "Rozetka Delivery",
      city: order.delivery?.city?.title || order.delivery?.city_name || "",
      warehouse: order.delivery?.warehouse?.title || order.delivery?.warehouse_name || order.delivery?.address || "",
      ttn: deliveryTtn,
      status: Number(order.status_group) === 2 ? "delivered" : deliveryTtn ? "sent_to_delivery" : "new",
      apiStatus: order.status_data?.title || order.last_update_status || "Отримано з Rozetka API",
      lastCheck: currentTimestamp()
    },
    payment: {
      method: order.payment_type_name || order.payment_type_title || order.payment?.type_name || "RozetkaPay",
      status: paymentStatus,
      amount: parseDecimal(order.cost_with_discount ?? order.amount_with_discount ?? order.cost ?? order.amount, price * qty),
      source: "Rozetka",
      apiStatus: order.status_payment?.title || order.payment_status || "Отримано з Rozetka API",
      lastCheck: currentTimestamp(),
      paidAt: paymentStatus === "paid" ? today : ""
    },
    clientId: existing?.clientId || "",
    invoiceId: existing?.invoiceId || "",
    rozetka: {
      importedAt: currentTimestamp(),
      id: order.id,
      status: order.status,
      status_group: order.status_group,
      status_title: order.status_data?.title || "",
      purchases,
      raw: order
    }
  });

  if (existing) {
    Object.assign(existing, payload, { id: existing.id, clientId: existing.clientId || payload.clientId, invoiceId: existing.invoiceId || payload.invoiceId });
    return "updated";
  }
  state.marketplaceOrders.unshift(payload);
  return "created";
}

function markRozetkaIntegration(status = "ok") {
  const integration = state.integrations.find((item) => item.id === "rozetka");
  if (!integration) return;
  integration.status = status;
  integration.lastSync = currentTimestamp();
}

function finalizeRozetkaImport() {
  seedProductDictionaries(state);
  syncCatalogParametersFromProducts(state);
  markRozetkaIntegration("ok");
}

function renderRozetkaInboundPanel() {
  const settings = rozetkaInboundState();
  return `
    <section class="panel section-band no-print" data-rozetka-inbound-panel>
      <h2>Rozetka API · отримання товарів і замовлень</h2>
      <div class="grid three">
        <article class="card metric info"><span>Режим</span><strong>read-only</strong><small>CRM тільки отримує дані з Rozetka.</small></article>
        <article class="card metric good"><span>Товари</span><strong>${settings.lastGoodsCount || 0}</strong><small>${escapeHtml(settings.lastGoodsSync || "ще не запускали")}</small></article>
        <article class="card metric warn"><span>Замовлення</span><strong>${settings.lastOrdersCount || 0}</strong><small>${escapeHtml(settings.lastOrdersSync || "ще не запускали")}</small></article>
      </div>
      ${settings.lastError ? `<p class="notice danger small">${escapeHtml(settings.lastError)}</p>` : ""}
      <div class="grid two">
          <form class="api-box" data-action="rozetka-import-goods">
            <h3>Товари Rozetka → каталог CRM</h3>
            <div class="form-grid">
              <label class="field"><span>Джерело</span><select name="source">${option("items", "усі активні товари", true)}${option("goods_new", "нові товари / goods_new")}</select></label>
              <label class="field"><span>Активність</span><select name="item_active">${option("1", "активні", true)}${option("0", "неактивні")}</select></label>
              <label class="field"><span>ID джерела goods_new</span><input name="sync_source_id" inputmode="numeric" placeholder="28581"></label>
              <label class="field"><span>Пошук</span><input name="find_by_text" placeholder="назва або ID"></label>
              <label class="field"><span>Артикул</span><input name="article" placeholder="09497"></label>
              <label class="field"><span>Наявність</span><select name="available"><option value="">0 і 1</option>${option("1", "є в наявності")}${option("0", "немає")}</select></label>
              <label class="field"><span>Сторінка</span><input name="page" inputmode="numeric" value="1"></label>
              <label class="field"><span>Рядків goods_new</span><input name="pageSize" inputmode="numeric" value="100"></label>
              <label class="field"><span>Макс. сторінок</span><input name="maxPages" inputmode="numeric" value="250"></label>
              <label class="field"><span>Сортування</span><select name="sort"><option value="">за замовчуванням</option>${ROZETKA_GOODS_SORT_OPTIONS.map((value) => option(value, value)).join("")}</select></label>
            </div>
          <button class="primary" type="submit">Отримати товари</button>
          <p class="small muted">Картка товару + публікація Rozetka. Повний JSON зберігається у полі rozetka.raw.</p>
        </form>
        <form class="api-box" data-action="rozetka-import-orders">
          <h3>Замовлення Rozetka → CRM</h3>
          <div class="form-grid">
            <label class="field"><span>Дата від</span><input name="created_from" type="date"></label>
            <label class="field"><span>Дата до</span><input name="created_to" type="date"></label>
            <label class="field"><span>Тип</span><select name="types"><option value="1">всі</option>${option("2", "в обробці")}${option("4", "нові")}${option("5", "доставляються")}${option("3", "успішні")}${option("6", "неуспішні")}</select></label>
            <label class="field"><span>Статус</span><input name="status" inputmode="numeric" placeholder="ID статусу"></label>
            <label class="field"><span>Сторінка</span><input name="page" inputmode="numeric" value="1"></label>
            <label class="field"><span>Макс. сторінок</span><input name="maxPages" inputmode="numeric" value="1"></label>
            <label class="field"><span>Деталей</span><input name="maxDetails" inputmode="numeric" value="20"></label>
            <label class="field"><span>Сортування</span><select name="sort">${ROZETKA_ORDER_SORT_OPTIONS.map((value) => option(value, value, value === "-id")).join("")}</select></label>
          </div>
          <button class="primary" type="submit">Отримати замовлення</button>
          <p class="small muted">Після /orders/search CRM підтягує /orders/{id}; повний JSON зберігається у order.rozetka.raw.</p>
        </form>
      </div>
    </section>
  `;
}

function renderRozetkaImportedOrderFilters(filter, resultCount, totalCount) {
  return `
    <form class="period-toolbar marketplace-filter no-print" data-rozetka-imported-order-filter>
      <label class="field compact"><span>Дата від</span><input name="from" type="date" value="${escapeHtml(filter.from)}"></label>
      <label class="field compact"><span>Дата до</span><input name="to" type="date" value="${escapeHtml(filter.to)}"></label>
      <label class="field compact"><span>Статус виконання</span><select name="status">
        <option value="">Всі статуси</option>
        ${MARKETPLACE_ORDER_STATUSES.map((item) => option(item.id, item.label, item.id === filter.status)).join("")}
      </select></label>
      <span class="pill info">${resultCount} із ${totalCount} замовлень</span>
      <button class="ghost" type="button" data-reset-rozetka-imported-order-filter>Скинути</button>
    </form>
  `;
}

function rozetkaImportedOrderSortHeader(key, label, filter) {
  const active = filter.sortBy === key;
  const direction = active && filter.sortDir === "asc" ? "ascending" : active ? "descending" : "none";
  const indicator = active ? (filter.sortDir === "asc" ? "↑" : "↓") : "↕";
  return `
    <th aria-sort="${direction}">
      <button class="table-sort ${active ? "active" : ""}" type="button" data-rozetka-order-sort="${escapeHtml(key)}">
        <span>${escapeHtml(label)}</span><span class="sort-indicator" aria-hidden="true">${indicator}</span>
      </button>
    </th>
  `;
}

function renderRozetkaImportedOrderRow(order) {
  const buyer = marketplaceOrderBuyer(order);
  const productLabel = rozetkaImportedOrderProductLabel(order);
  const orderTotal = rozetkaImportedOrderTotal(order);
  const canOrder = canManageMarketplaceOrder();
  return `
    <tr>
      <td><strong>${escapeHtml(order.date || "")}</strong><br><span class="small muted">${escapeHtml(order.rozetka?.importedAt || order.dates?.created || "")}</span></td>
      <td><strong>${escapeHtml(order.externalOrderId || "")}</strong><br><span class="small muted">${escapeHtml(String(order.rozetka?.id || ""))}</span></td>
      <td>${escapeHtml(buyer.name || "Покупець Rozetka")}<br><span class="small muted">${escapeHtml(buyer.phone || "-")}</span></td>
      <td>${escapeHtml(productLabel)}<br><span class="small muted">${escapeHtml(String(order.qty || 1))} од. · ${escapeHtml(order.sku || "")}</span></td>
      <td>${formatMoney(orderTotal, order.currency || "UAH")}</td>
      <td>${marketplaceDeliveryStatusPill(order.delivery?.status || "new")}<br><span class="small muted">${escapeHtml(order.delivery?.ttn || "ТТН немає")}</span></td>
      <td>${marketplacePaymentStatusPill(order.payment?.status || "expected")}<br><span class="small muted">${escapeHtml(order.payment?.apiStatus || "")}</span></td>
      <td>${marketplaceOrderStatusPill(order.status)}</td>
      <td class="row-actions no-print">
        <button class="ghost" data-edit-marketplace-order="${escapeHtml(order.id)}" ${canEditPostedDocument("marketplaceOrder") ? "" : "disabled"}>Відкрити</button>
        <button class="ghost" data-create-client-from-order="${escapeHtml(order.id)}" ${canOrder ? "" : "disabled"}>Клієнт</button>
        <button class="secondary" data-invoice-marketplace-order="${escapeHtml(order.id)}" ${canOrder && order.status !== "new_order" && !order.invoiceId ? "" : "disabled"}>Накладна</button>
      </td>
    </tr>
  `;
}

function renderRozetkaImportedOrdersPanel() {
  const filter = rozetkaImportedOrderFilter();
  const orders = state.marketplaceOrders.filter((order) => order.marketplace === "Rozetka");
  const filteredOrders = sortRozetkaImportedOrders(
    orders.filter((order) => dateInOptionalPeriod(order.date, filter) && (!filter.status || order.status === filter.status)),
    filter
  );
  const emptyText = orders.length
    ? "Немає замовлень Rozetka за вибраними відборами."
    : "Натисніть “Отримати замовлення”, щоб імпортувати замовлення Rozetka.";
  return `
    <section class="panel section-band" id="rozetka-orders" data-rozetka-orders-list>
      <div class="split">
        <h2>Імпортовані замовлення Rozetka</h2>
        <span class="pill good">${orders.length} у CRM</span>
      </div>
      ${renderRozetkaImportedOrderFilters(filter, filteredOrders.length, orders.length)}
      <details class="order-dropdown" data-rozetka-imported-orders-dropdown ${filter.expanded ? "open" : ""}>
        <summary>
          <span>
            <strong>Список імпортованих замовлень</strong>
            <small>${filter.expanded ? "Натисніть, щоб згорнути список." : "Натисніть, щоб розгорнути список."}</small>
          </span>
          <span class="pill info">${filteredOrders.length} рядків</span>
        </summary>
        <div class="table-wrap">
          <table>
            <thead><tr>
              ${rozetkaImportedOrderSortHeader("date", "Дата", filter)}
              ${rozetkaImportedOrderSortHeader("externalOrderId", "ID Rozetka", filter)}
              ${rozetkaImportedOrderSortHeader("buyer", "Покупець", filter)}
              ${rozetkaImportedOrderSortHeader("product", "Товар", filter)}
              ${rozetkaImportedOrderSortHeader("total", "Сума", filter)}
              ${rozetkaImportedOrderSortHeader("delivery", "Доставка", filter)}
              ${rozetkaImportedOrderSortHeader("payment", "Оплата", filter)}
              ${rozetkaImportedOrderSortHeader("status", "Статус CRM", filter)}
              <th>Дії</th>
            </tr></thead>
            <tbody>
              ${filteredOrders.map(renderRozetkaImportedOrderRow).join("") || `<tr><td colspan="9" class="muted">${emptyText}</td></tr>`}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  `;
}

async function importRozetkaGoodsToCatalog(form) {
  const settings = rozetkaInboundState();
  const button = form.querySelector('button[type="submit"]');
  const previousText = button?.textContent || "";
  if (button) {
    button.disabled = true;
    button.textContent = "Отримання...";
  }
  try {
    const source = formData(form).source || "items";
    const endpoint = source === "goods_new" ? "/api/rozetka/goods/new/all" : "/api/rozetka/items/search/all";
    const fields = source === "goods_new"
      ? ["sync_source_id", "find_by_text", "article", "available", "page", "pageSize", "maxPages", "sort"]
      : ["item_active", "find_by_text", "article", "page", "maxPages", "sort"];
    const payload = await fetchRozetkaInbound(form, endpoint, fields);
    const items = rozetkaItems(payload);
    const totals = { created: 0, updated: 0, publicationsCreated: 0, publicationsUpdated: 0 };
    items.forEach((item) => {
      const result = upsertRozetkaProduct(item);
      totals[result.mode] += 1;
      const publicationMode = upsertRozetkaPublication(item, result.product);
      if (publicationMode === "created") totals.publicationsCreated += 1;
      if (publicationMode === "updated") totals.publicationsUpdated += 1;
    });
    finalizeRozetkaImport();
    settings.lastGoodsSync = currentTimestamp();
    settings.lastGoodsCount = items.length;
    settings.lastError = "";
    addAudit(`Rozetka API: товари в каталог — створено ${totals.created}, оновлено ${totals.updated}, публікацій створено ${totals.publicationsCreated}, оновлено ${totals.publicationsUpdated}`, "system");
    render();
  } catch (error) {
    settings.lastError = `Товари: ${error.message}`;
    markRozetkaIntegration("token_needed");
    addAudit(`Rozetka API: помилка імпорту товарів — ${error.message}`, "system");
    alert(`Rozetka товари: ${error.message}`);
    render();
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = previousText;
    }
  }
}

async function importRozetkaOrdersToCrm(form) {
  const settings = rozetkaInboundState();
  const button = form.querySelector('button[type="submit"]');
  const previousText = button?.textContent || "";
  if (button) {
    button.disabled = true;
    button.textContent = "Отримання...";
  }
  try {
    const payload = await fetchRozetkaInbound(form, "/api/rozetka/orders/import", ["created_from", "created_to", "types", "status", "page", "maxPages", "maxDetails", "sort"]);
    const orders = rozetkaOrders(payload);
    const totals = orders.reduce((acc, order) => {
      const result = upsertRozetkaOrder(order);
      acc[result] = (acc[result] || 0) + 1;
      return acc;
    }, { created: 0, updated: 0 });
    finalizeRozetkaImport();
    settings.lastOrdersSync = currentTimestamp();
    settings.lastOrdersCount = orders.length;
    settings.lastError = "";
    state.rozetkaImportedOrderFilters = {
      ...rozetkaImportedOrderFilter(),
      expanded: true
    };
    addAudit(`Rozetka API: замовлення — створено ${totals.created || 0}, оновлено ${totals.updated || 0}`, "system");
    render();
    setTimeout(() => document.querySelector("[data-rozetka-orders-list]")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  } catch (error) {
    settings.lastError = `Замовлення: ${error.message}`;
    markRozetkaIntegration("token_needed");
    addAudit(`Rozetka API: помилка імпорту замовлень — ${error.message}`, "system");
    alert(`Rozetka замовлення: ${error.message}`);
    render();
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = previousText;
    }
  }
}

function renderMarketplaceExchangePanel(names, firstOrderId) {
  return `
    <section class="panel section-band">
      <h2>Обмін даними</h2>
      <div class="stack">
        <div class="row-actions">
          ${names.map((name) => `<button class="secondary" data-export-marketplace="${escapeHtml(name)}">Експорт ${escapeHtml(name)}</button>`).join("")}
        </div>
        <div class="row-actions">
          <button class="ghost" data-sync-marketplace-stocks>Оновити залишки</button>
          <button class="ghost" data-sync-marketplace-prices>Оновити ціни по курсу</button>
          <button class="ghost" data-import-marketplace-orders>Імпорт demo замовлення</button>
        </div>
        <div class="api-box" data-marketplace-api-panel>
          <h3>API замовлень</h3>
          <label class="field full"><span>Замовлення для перевірки ТТН / оплати</span><select name="orderId">${marketplaceOrderOptions(firstOrderId)}</select></label>
          <div class="row-actions">
            <button class="ghost" data-track-selected-marketplace-delivery ${canTrackMarketplaceDelivery() && state.marketplaceOrders.length ? "" : "disabled"}>Перевірити ТТН через API</button>
            <button class="ghost" data-track-selected-marketplace-payment ${canTrackMarketplacePayment() && state.marketplaceOrders.length ? "" : "disabled"}>Підтягнути оплату через API</button>
          </div>
          <p class="small muted">API-дії працюють по вибраному замовленню: доставка перевіряється за ТТН, оплата підтверджується з маркетплейсу або поштового сервісу.</p>
        </div>
        <form class="form-grid" data-action="import-marketplace-catalog">
          <label class="field full"><span>Імпорт JSON з маркетплейсу</span><textarea name="payload" placeholder='{"publications":[{"marketplace":"Prom","sku":"...","productId":"p-200","price":5400}]}'></textarea></label>
          <button class="primary" type="submit">Імпортувати публікації</button>
        </form>
      </div>
    </section>
  `;
}

function renderMarketplacePublicationSearch(filter, resultCount, totalCount) {
  return `
    <div class="period-toolbar marketplace-filter no-print" data-marketplace-publication-filter>
      <label class="field wide"><span>Пошук у списку</span><input name="search" data-marketplace-publication-search value="${escapeHtml(filter.search)}" placeholder="слова з товару, SKU, ID, маркетплейсу, менеджера"></label>
      <span class="pill info" data-marketplace-publication-result-count>${resultCount} із ${totalCount} публікацій</span>
      <button class="ghost" type="button" data-reset-marketplace-publication-search ${filter.search ? "" : "disabled"}>Скинути</button>
    </div>
  `;
}

function renderMarketplacePublicationRow(publication, visible = true) {
  const product = byId(state.products, publication.productId);
  const crmQty = productAvailableQty(publication.productId);
  return `
    <tr data-marketplace-publication-row data-publication-search-text="${escapeHtml(marketplacePublicationSearchText(publication))}" ${visible ? "" : 'style="display: none;"'}>
      <td>${escapeHtml(publication.marketplace)}<br><span class="small muted">${escapeHtml(publication.lastSync || "не синхронізовано")}</span></td>
      <td><strong>${escapeHtml(publication.sku)}</strong><br><span class="small muted">${escapeHtml(publication.externalId || "без зовн. ID")}</span></td>
      <td>${escapeHtml(product ? `${product.brand} ${product.model}` : "Товар не знайдено")}<br><span class="small muted">${escapeHtml(publication.title)}</span></td>
      <td>${product?.photos?.length ? `<span class="pill good">${product.photos.length} фото</span>` : '<span class="pill warn">немає фото</span>'}</td>
      <td>${formatMoney(publication.price, publication.currency)}</td>
      <td>${crmQty} / ${escapeHtml(publication.stockQty)}</td>
      <td>${escapeHtml(publication.manager)}</td>
      <td>${statusPill(publication.status)}</td>
      <td class="row-actions no-print">
        <button class="ghost" data-edit-publication="${escapeHtml(publication.id)}">Редагувати</button>
        <button class="secondary" data-sync-publication="${escapeHtml(publication.id)}">Синхр.</button>
      </td>
    </tr>
  `;
}

function updateDropdownHint(details) {
  const hint = details?.querySelector("summary small");
  if (hint) hint.textContent = details.open ? "Натисніть, щоб згорнути список." : "Натисніть, щоб розгорнути список.";
}

function applyMarketplacePublicationSearch(root = document) {
  const input = root.querySelector("[data-marketplace-publication-search]");
  const details = root.querySelector("[data-marketplace-publications-dropdown]");
  if (!input || !details) return;
  const words = searchWords(input.value);
  const rows = Array.from(details.querySelectorAll("[data-marketplace-publication-row]"));
  let visibleCount = 0;
  rows.forEach((row) => {
    const haystack = row.dataset.publicationSearchText || "";
    const visible = words.every((word) => haystack.includes(word));
    row.style.display = visible ? "" : "none";
    if (visible) visibleCount += 1;
  });
  const emptyRow = details.querySelector("[data-marketplace-publication-empty]");
  if (emptyRow) emptyRow.style.display = visibleCount ? "none" : "";
  const resultCount = root.querySelector("[data-marketplace-publication-result-count]");
  if (resultCount) resultCount.textContent = `${visibleCount} із ${rows.length} публікацій`;
  const summaryCount = details.querySelector("[data-marketplace-publication-summary-count]");
  if (summaryCount) summaryCount.textContent = `${visibleCount} рядків`;
  const resetButton = root.querySelector("[data-reset-marketplace-publication-search]");
  if (resetButton) resetButton.disabled = !input.value.trim();
  if (words.length) details.open = true;
  updateDropdownHint(details);
}

function renderMarketplaces() {
  const docsPeriod = periodFilter("marketplaceDocs");
  const orderFilter = marketplaceOrderFilter();
  const publicationFilter = marketplacePublicationFilter();
  const names = marketplaceNames();
  const publicationLines = marketplacePublicationDraftLines();
  const newOrders = state.marketplaceOrders.filter((order) => order.status === "new_order").length;
  const needsSync = state.marketplacePublications.filter((publication) => publication.status !== "published").length;
  const periodPublications = state.marketplacePublications.filter((publication) => dateInPeriod(String(publication.lastSync || today).slice(0, 10), docsPeriod));
  const publicationWords = searchWords(publicationFilter.search);
  const filteredPublications = periodPublications.filter((publication) => marketplacePublicationMatchesSearch(publication, publicationWords));
  const publicationEmptyText = periodPublications.length ? "Немає публікацій за введеними словами." : "Немає публікацій за вибраний період.";
  const filteredOrders = state.marketplaceOrders.filter((order) => marketplaceOrderMatchesFilter(order, orderFilter));
  const firstOrderId = state.marketplaceOrders[0]?.id || "";
  return `
    <section class="grid four section-band">
      <article class="card metric info"><span>Публікації</span><strong>${state.marketplacePublications.length}</strong><small>Окремі SKU, ціни, фото та статуси для кожного маркетплейсу.</small></article>
      <article class="card metric warn"><span>Потребують обміну</span><strong>${needsSync}</strong><small>Товари, ціни або залишки не синхронізовані.</small></article>
      <article class="card metric danger"><span>Нові замовлення</span><strong>${newOrders}</strong><small>Після імпорту менеджер отримує подію у журналі.</small></article>
      <article class="card metric good"><span>Канали</span><strong>${names.length}</strong><small>Rozetka, Prom, Epicentr, Allo.</small></article>
    </section>

    ${renderRozetkaInboundPanel()}
    ${renderRozetkaImportedOrdersPanel()}

    <section class="panel section-band">
        <h2>Створити публікацію</h2>
        <form class="stack" data-action="create-marketplace-publication">
          <div class="table-wrap invoice-lines">
            <table>
              <thead><tr><th>Маркетплейс</th><th>Товар</th><th>SKU каналу</th><th>Зовн. ID</th><th>Назва публікації</th><th>Ціна</th><th>Валюта</th><th>Менеджер</th><th>Дії</th></tr></thead>
              <tbody>${publicationLines.map((line, index) => renderMarketplacePublicationLine(line, index, names)).join("")}</tbody>
            </table>
          </div>
          <div class="inline-actions no-print">
            <button class="secondary" type="button" data-add-marketplace-publication-line>Додати ще</button>
          </div>
          <button class="primary" type="submit">Додати публікації</button>
        </form>
    </section>

    <section class="panel section-band no-print">
      <h2>Період публікацій маркетплейсів</h2>
      ${renderPeriodPrintControls("marketplaceDocs", "Публікації маркетплейсів", docsPeriod, filteredPublications.length)}
    </section>

    <section class="panel section-band" data-print-area="marketplaceDocs" data-print-title="Маркетплейси · список публікацій">
      <h2>Список публікацій</h2>
      ${renderMarketplacePublicationSearch(publicationFilter, filteredPublications.length, periodPublications.length)}
      <details class="order-dropdown publication-dropdown" data-marketplace-publications-dropdown ${publicationFilter.expanded ? "open" : ""}>
        <summary>
          <span>
            <strong>Список публікацій маркетплейсів</strong>
            <small>${publicationFilter.expanded ? "Натисніть, щоб згорнути список." : "Натисніть, щоб розгорнути список."}</small>
          </span>
          <span class="pill info" data-marketplace-publication-summary-count>${filteredPublications.length} рядків</span>
        </summary>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Маркетплейс</th><th>SKU / зовн. ID</th><th>Товар</th><th>Фото</th><th>Ціна</th><th>Залишок CRM / канал</th><th>Менеджер</th><th>Статус</th><th>Дії</th></tr></thead>
            <tbody>
              ${periodPublications.map((publication) => renderMarketplacePublicationRow(publication, marketplacePublicationMatchesSearch(publication, publicationWords))).join("")}
              <tr data-marketplace-publication-empty ${filteredPublications.length ? 'style="display: none;"' : ""}><td colspan="9" class="muted">${publicationEmptyText}</td></tr>
            </tbody>
          </table>
        </div>
      </details>
    </section>

    <section class="panel section-band" data-print-area="marketplaceOrders" data-print-title="Маркетплейси · замовлення">
      <h2>Замовлення маркетплейсів</h2>
      <div class="status-legend no-print">
        ${MARKETPLACE_ORDER_STATUSES.map((item) => `<span class="pill ${item.className}">${item.label}</span>`).join("")}
      </div>
      ${renderMarketplaceOrderFilters(names, orderFilter, filteredOrders.length)}
      <details class="order-dropdown" data-marketplace-orders-dropdown ${orderFilter.expanded ? "open" : ""}>
        <summary>
          <span>
            <strong>Список замовлень маркетплейсів</strong>
            <small>${orderFilter.expanded ? "Натисніть, щоб згорнути список." : "Натисніть, щоб розгорнути список."}</small>
          </span>
          <span class="pill info">${filteredOrders.length} рядків</span>
        </summary>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Дата</th><th>Маркетплейс</th><th>Замовлення</th><th>Покупець</th><th>Товар</th><th>Доставка / ТТН</th><th>Оплата</th><th>Менеджер</th><th>Статус</th><th>Дії</th></tr></thead>
            <tbody>
            ${filteredOrders.map((order) => {
              const product = byId(state.products, order.productId);
              const buyer = marketplaceOrderBuyer(order);
              const orderTotal = Number(order.qty || 1) * Number(order.price || 0);
              const canOrder = canManageMarketplaceOrder();
              const canStatus = canChangeMarketplaceOrderStatus();
              const canDelivery = canTrackMarketplaceDelivery();
              const canPayment = canTrackMarketplacePayment();
              return `
                <tr>
                  <td>
                    <strong>${order.date}</strong>
                    <br><span class="small muted">створено: ${order.dates?.created || order.date}</span>
                    ${order.dates?.agreed ? `<br><span class="small muted">погоджено: ${order.dates.agreed}</span>` : ""}
                    ${order.dates?.delivery ? `<br><span class="small muted">доставка: ${order.dates.delivery}</span>` : ""}
                  </td>
                  <td><strong>${order.marketplace}</strong><br><span class="small muted">${order.sku}</span></td>
                  <td><strong>${order.externalOrderId}</strong><br><span class="small muted">${order.invoiceId ? `накладна ${order.invoiceId}` : "накладну ще не створено"}</span></td>
                  <td>${buyer.name}<br><span class="small muted">${buyer.phone || "-"} · ${order.clientId ? clientName(order.clientId) : "клієнт ще не створений"}</span></td>
                  <td>${product ? `${product.brand} ${product.model}` : order.sku}<br><span class="small muted">${order.qty} од. × ${formatMoney(order.price, order.currency)}</span></td>
                  <td>
                    ${marketplaceDeliveryStatusPill(order.delivery.status)}
                    <br><strong>${order.delivery.ttn || "ТТН не внесено"}</strong>
                    <br><span class="small muted">${order.delivery.service || "-"} · ${order.delivery.city || ""} ${order.delivery.warehouse || ""}</span>
                    <br><span class="small muted">${order.delivery.apiStatus || "API не перевірявся"}</span>
                  </td>
                  <td>
                    ${marketplacePaymentStatusPill(order.payment.status)}
                    <br>${formatMoney(order.payment.amount || orderTotal, order.currency)}
                    <br><span class="small muted">${order.payment.source || order.payment.method || "-"}</span>
                    <br><span class="small muted">${order.payment.apiStatus || "API не перевірявся"}</span>
                  </td>
                  <td>${order.manager}</td>
                  <td>${marketplaceOrderStatusPill(order.status)}</td>
                  <td class="row-actions no-print">
                    <button class="ghost" data-edit-marketplace-order="${order.id}" ${canEditPostedDocument("marketplaceOrder") ? "" : "disabled"}>Змінити</button>
                    <button class="ghost" data-notify-marketplace-order="${order.id}" ${canOrder ? "" : "disabled"}>Повідомити</button>
                    <button class="ghost" data-create-client-from-order="${order.id}" ${canOrder ? "" : "disabled"}>Клієнт</button>
                    <button class="ghost" data-agree-marketplace-order="${order.id}" ${canStatus && order.status === "new_order" ? "" : "disabled"}>Узгоджено</button>
                    <button class="ghost" data-marketplace-to-warehouse="${order.id}" ${canStatus && ["agreed", "sent_to_warehouse"].includes(order.status) ? "" : "disabled"}>На склад</button>
                    <button class="secondary" data-invoice-marketplace-order="${order.id}" ${canOrder && order.status !== "new_order" && !order.invoiceId ? "" : "disabled"}>Накладна</button>
                    <button class="secondary" data-marketplace-to-delivery="${order.id}" ${canDelivery && ["sent_to_warehouse", "sent_to_delivery"].includes(order.status) ? "" : "disabled"}>На доставку</button>
                  </td>
                </tr>
              `;
            }).join("") || '<tr><td colspan="10" class="muted">Немає замовлень за вибраними відборами.</td></tr>'}
          </tbody>
        </table>
      </div>
    </section>
    ${renderMarketplaceExchangePanel(names, firstOrderId)}
  `;
}

function renderIntegrations() {
  const docsPeriod = periodFilter("integrationDocs");
  const accountingDocs = state.invoices.filter((invoice) => invoice.accounting && dateInPeriod(invoice.date, docsPeriod));
  return `
    <section class="grid three section-band">
      ${state.integrations.map((integration) => `
        <article class="card stack">
          <div class="split">
            <strong>${integration.name}</strong>
            ${statusPill(integration.status)}
          </div>
          <p class="small muted">${integration.scope}</p>
          <span class="small">Останній обмін: ${integration.lastSync}</span>
          <button class="secondary" data-sync="${integration.id}">Запустити обмін</button>
        </article>
      `).join("")}
    </section>

    <section class="panel section-band no-print">
      <h2>Період документів інтеграцій</h2>
      ${renderPeriodPrintControls("integrationDocs", "BAS/BAF документи", docsPeriod, accountingDocs.length)}
    </section>

    <section class="grid two">
      <div class="panel">
        <h2>Двосторонній API обмін</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Об'єкт</th><th>CRM → канал</th><th>Канал → CRM</th><th>Ключ синхронізації</th></tr></thead>
            <tbody>
              <tr><td>Товари</td><td>назва, опис, фото, характеристики, УКТЗЕД</td><td>помилки модерації, зовнішні ID</td><td>internalCode + marketplaceSku</td></tr>
              <tr><td>Замовлення</td><td>статус, ТТН, відміни</td><td>нові замовлення, клієнт, доставка</td><td>externalOrderId</td></tr>
              <tr><td>Залишки</td><td>доступна кількість без резервів</td><td>резерви каналів</td><td>productId + warehouseId</td></tr>
              <tr><td>Ціни</td><td>прайс, акції, валюта</td><td>помилки прийому</td><td>priceListId + productId</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="panel" data-print-area="integrationDocs" data-print-title="BAS/BAF документи">
        <h2>BAS/BAF документи</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Документ</th><th>Фірма</th><th>Сума</th><th>Статус</th></tr></thead>
            <tbody>
              ${accountingDocs.map((invoice) => `
                <tr>
                  <td>${invoice.id}</td>
                  <td>${firmName(invoice.firmId)}</td>
                  <td>${formatMoney(invoice.total, invoice.currency)}</td>
                  <td><span class="pill info">готовий до обміну</span></td>
                </tr>
              `).join("") || '<tr><td colspan="4" class="muted">Немає документів BAS/BAF за вибраний період.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}

function renderRolesLegacy() {
  const canManage = isAdmin();
  const disabled = canManage ? "" : "disabled";
  return `
    <section class="grid two section-band">
      <div class="panel">
        <h2>Працівники та доступи</h2>
        <form class="form-grid" data-action="create-employee">
          <label class="field wide"><span>ПІБ</span><input name="name" required ${disabled}></label>
          <label class="field"><span>Роль</span><select name="roleName" ${disabled}>${state.roles.map((item) => option(item.name, item.name)).join("")}</select></label>
          <label class="field"><span>Відділ</span><input name="department" value="Продажі" ${disabled}></label>
          <label class="field"><span>Телефон</span><input name="phone" ${disabled}></label>
          <label class="field"><span>Email</span><input name="email" type="email" ${disabled}></label>
          <button class="primary" type="submit" ${disabled}>Додати працівника</button>
        </form>
        <p class="notice ${canManage ? "" : "warn"} small">${canManage ? "Поточний користувач має права адміністратора." : "Зміна ролей і внесення працівників доступні тільки адміністратору."}</p>
      </div>
      <div class="panel">
        <h2>Закриття дня</h2>
        <form class="form-grid" data-action="update-closed-day">
          <label class="field"><span>Дата блокування</span><input name="closedDay" type="date" value="${state.settings.closedDay}"></label>
          <button class="primary" type="submit" ${role().canEditClosedDay ? "" : "disabled"}>Оновити</button>
        </form>
        <p class="notice ${role().canEditClosedDay ? "" : "warn"} small">Поточна роль: ${state.currentRole}. ${role().canEditClosedDay ? "Може змінювати закриті дні." : "Не може змінювати документи до закритої дати."}</p>
      </div>
    </section>

    <section class="panel section-band">
      <h2>Працівники</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Працівник</th><th>Відділ</th><th>Контакти</th><th>Роль</th><th>Стан</th></tr></thead>
          <tbody>
            ${state.employees.map((employee) => `
              <tr>
                <td><strong>${employee.name}</strong>${employee.id === state.currentEmployeeId ? '<br><span class="pill info">активний користувач</span>' : ""}</td>
                <td>${employee.department || "-"}</td>
                <td>${employee.phone || "-"}<br><span class="small muted">${employee.email || "-"}</span></td>
                <td><select data-employee-role="${employee.id}" ${disabled}>${state.roles.map((item) => option(item.name, item.name, item.name === employee.roleName)).join("")}</select></td>
                <td>${employee.active ? '<span class="pill good">активний</span>' : '<span class="pill danger">вимкнено</span>'}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>

    <section class="grid two">
      <div class="panel">
        <h2>Матриця ролей</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Роль</th><th>Закритий день</th><th>Зброя</th><th>Ціни</th><th>BAS/BAF</th><th>Кредит</th><th>Працівники</th><th>Звіти</th><th>Налаштування</th></tr></thead>
            <tbody>
              ${state.roles.map((item) => `
                <tr>
                  <td><strong>${item.name}</strong></td>
                  <td>${boolPill(item.canEditClosedDay)}</td>
                  <td>${boolPill(item.canSellWeapon)}</td>
                  <td>${boolPill(item.canChangePrices)}</td>
                  <td>${boolPill(item.canExportAccounting)}</td>
                  <td>${boolPill(item.canApproveCredit)}</td>
                  <td>${boolPill(item.canManageUsers)}</td>
                  <td>${boolPill(item.canViewReports)}</td>
                  <td>${boolPill(item.canEditSettings)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
      <div class="panel">
        <h2>Заборони продажу зброї</h2>
        <p class="notice danger">Система не дозволяє продаж типу “Зброя” без серійного номера, дублювання серій, продаж неперевіреної ЄРЗ одиниці, або проведення без номера дозволу на покупку та дати видачі.</p>
        <p class="notice warn">Редагування ролей та створення працівників заблоковані для всіх ролей, крім адміністратора.</p>
      </div>
    </section>
  `;
}

function permissionCheckbox(roleItem, group, key, checked, disabled) {
  return `<input type="checkbox" data-role-permission="${escapeHtml(key)}" data-role-group="${escapeHtml(group)}" data-role-name="${escapeHtml(roleItem.name)}" ${checked ? "checked" : ""} ${disabled}>`;
}

function renderPermissionMatrix(title, group, definitions, disabled) {
  return `
    <div class="panel">
      <h2>${title}</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Роль</th>${definitions.map(([, label]) => `<th>${escapeHtml(label)}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${state.roles.map((roleItem) => `
              <tr>
                <td><strong>${escapeHtml(roleItem.name)}</strong></td>
                ${definitions.map(([key]) => {
                  const checked = group === "basic" ? roleItem[key] === true : roleItem.access?.[group]?.[key] !== false;
                  return `<td>${permissionCheckbox(roleItem, group, key, checked, disabled)}</td>`;
                }).join("")}
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderRoles() {
  const canManage = isAdmin();
  const disabled = canManage ? "" : "disabled";
  return `
    <section class="grid two section-band">
      <div class="panel">
        <h2>Додати працівника</h2>
        <form class="form-grid" data-action="create-employee">
          <label class="field wide"><span>ПІБ</span><input name="name" required ${disabled}></label>
          <label class="field"><span>Роль</span><select name="roleName" ${disabled}>${state.roles.map((item) => option(item.name, item.name)).join("")}</select></label>
          <label class="field"><span>Відділ</span><input name="department" value="Продажі" ${disabled}></label>
          <label class="field"><span>Телефон</span><input name="phone" ${disabled}></label>
          <label class="field"><span>Email</span><input name="email" type="email" ${disabled}></label>
          <label class="field"><span>Логін</span><input name="login" required ${disabled}></label>
          <label class="field"><span>Пароль</span><input name="password" type="text" required ${disabled}></label>
          <button class="primary" type="submit" ${disabled}>Додати працівника</button>
        </form>
        <p class="notice ${canManage ? "" : "warn"} small">${canManage ? "Адміністратор може створювати працівників, змінювати логіни, паролі та ролі." : "Працівників і ролі змінює тільки адміністратор."}</p>
      </div>
      <div class="panel">
        <h2>Закриття дня</h2>
        <form class="form-grid" data-action="update-closed-day">
          <label class="field"><span>Дата блокування</span><input name="closedDay" type="date" value="${state.settings.closedDay}"></label>
          <button class="primary" type="submit" ${role().canEditClosedDay ? "" : "disabled"}>Оновити</button>
        </form>
        <p class="notice ${role().canEditClosedDay ? "" : "warn"} small">Поточна роль: ${escapeHtml(state.currentRole)}.</p>
      </div>
    </section>

    <section class="panel section-band">
      <h2>Працівники</h2>
      <div class="table-wrap">
        <table>
          <thead><tr><th>ПІБ</th><th>Відділ</th><th>Контакти</th><th>Логін / пароль</th><th>Роль</th><th>Стан</th><th>Дії</th></tr></thead>
          <tbody>
            ${state.employees.map((employee) => `
              <tr data-employee-row="${escapeHtml(employee.id)}">
                <td><input name="name" value="${escapeHtml(employee.name)}" ${disabled}>${employee.id === state.currentEmployeeId ? '<br><span class="pill info">активний користувач</span>' : ""}</td>
                <td><input name="department" value="${escapeHtml(employee.department || "")}" ${disabled}></td>
                <td>
                  <input name="phone" value="${escapeHtml(employee.phone || "")}" placeholder="телефон" ${disabled}>
                  <input name="email" type="email" value="${escapeHtml(employee.email || "")}" placeholder="email" ${disabled}>
                </td>
                <td>
                  <input name="login" value="${escapeHtml(employee.login || "")}" ${disabled}>
                  <input name="password" type="text" value="${escapeHtml(employee.password || "")}" ${disabled}>
                </td>
                <td><select name="roleName" ${disabled}>${state.roles.map((item) => option(item.name, item.name, item.name === employee.roleName)).join("")}</select></td>
                <td><select name="active" ${disabled}>${option("true", "Активний", employee.active !== false)}${option("false", "Вимкнено", employee.active === false)}</select></td>
                <td><button class="secondary" type="button" data-save-employee="${escapeHtml(employee.id)}" ${disabled}>Зберегти</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>

    <section class="section-band">
      ${renderPermissionMatrix("Базові права ролей", "basic", ROLE_BASIC_PERMISSIONS, disabled)}
    </section>

    <section class="section-band">
      ${renderPermissionMatrix("Доступ до модулів", "views", NAV.map(([id, label]) => [id, label]), disabled)}
    </section>

    <section class="section-band">
      ${renderPermissionMatrix("Дозволи на створення документів", "documents", ROLE_DOCUMENT_PERMISSIONS, disabled)}
    </section>

    <section class="section-band">
      ${renderPermissionMatrix("Дозволи на зміну проведених документів", "posted", ROLE_POSTED_DOCUMENT_PERMISSIONS, disabled)}
    </section>

    <section>
      ${renderPermissionMatrix("Дозволи на поля документів", "fields", ROLE_FIELD_PERMISSIONS, disabled)}
    </section>
  `;
}

function boolPill(value) {
  return value ? '<span class="pill good">так</span>' : '<span class="pill danger">ні</span>';
}

function formData(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  Object.keys(data).forEach((key) => {
    if (isDecimalFieldName(key)) data[key] = normalizeDecimalText(data[key]);
  });
  return data;
}

function loginUser(form) {
  const data = formData(form);
  const login = String(data.login || "").trim().toLowerCase();
  const password = String(data.password || "");
  const employee = state.employees.find((item) => item.active !== false && String(item.login || "").trim().toLowerCase() === login && String(item.password || "") === password);
  if (!employee) {
    alert("Невірний логін або пароль.");
    return;
  }
  activateEmployeeSession(employee);
  addAudit(`Вхід користувача ${employee.name}`, "system");
  render();
}

function loginClient(form) {
  const data = formData(form);
  const login = String(data.login || "").trim().toLowerCase();
  const password = String(data.password || "");
  const client = state.clients.find((item) => (
    item.type === "B2B"
    && item.cabinetEnabled !== false
    && String(item.portalLogin || "").trim().toLowerCase() === login
    && String(item.portalPassword || "") === password
  ));
  if (!client) {
    alert("Невірний логін або пароль B2B кабінету.");
    return;
  }
  activateClientSession(client);
  clientPortalDraft = { productId: "", firmId: "", barcode: "", qty: 1, serialIds: [], permitNumber: "", permitDate: "" };
  addAudit(`Вхід B2B клієнта ${client.name}`, "B2B кабінет");
  render();
}

function logoutUser() {
  const employee = currentEmployee();
  const client = authenticatedClient();
  sessionStorage.removeItem("arms-crm-auth-employee-id");
  sessionStorage.removeItem("arms-crm-auth-client-id");
  sessionStorage.removeItem("arms-crm-auth-mode");
  authEmployeeId = "";
  authClientId = "";
  authMode = "";
  addAudit(`Вихід користувача ${client?.name || employee?.name || "-"}`, "system");
  render();
}

function addAudit(action, actor = state.currentManager) {
  state.audit.unshift({
    at: `${today} ${new Date().toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}`,
    actor,
    action
  });
}

function validateInvoice(data, product, serialIds = []) {
  const codeError = validateScannedCode(data.barcode, product);
  if (codeError) return codeError;
  const qty = Math.max(parseDecimal(data.qty || 1, 1), 1);
  if (product.type !== "weapon") {
    const available = stockQtyWhere(product.id, ownStockPredicate({ warehouseId: data.warehouseId, firmId: data.firmId }));
    if (available < qty) return stockContextMessage(product.id, qty, data.warehouseId, data.firmId);
    return "";
  }
  if (!role().canSellWeapon) return "Поточна роль не має права продавати зброю.";
  if (!serialIds.length) return "Для зброї потрібно вибрати серійні номери.";
  if (serialIds.length !== qty) return `Кількість (${qty}) має дорівнювати кількості вибраних серій (${serialIds.length}).`;
  const duplicates = duplicateValues(serialIds);
  if (duplicates.length) return "Одна й та сама серія вибрана більше одного разу.";
  if (!data.permitNumber || !data.permitDate) return "Потрібно внести номер дозволу на покупку та дату його видачі.";
  for (const serialId of serialIds) {
    const serial = byId(state.serials, serialId);
    if (!serial) return "Серійний номер не знайдено.";
    if (!serialMatchesProduct(serial, product)) return `Серія ${serial.serial} не належить вибраній моделі.`;
    if (serialIsSold(serial)) return `Серія ${serial.serial} вже продана. Повторний продаж заблоковано.`;
    if (!serialMatchesStockContext(serial, { warehouseId: data.warehouseId, firmId: data.firmId, clientId: "" })) return `Серія ${serial.serial} не належить вибраній фірмі/складу документа.`;
    if (serial.status !== "available" || !serialIsOnStock(serial)) return `Серія ${serial.serial} не є доступною на нашому складі.`;
    if (serial.actual === false) return `Серія ${serial.serial} неактуальна.`;
    if (serial.erzStatus !== "verified") return `ЄРЗ для серії ${serial.serial} не перевірено.`;
  }
  return "";
}

function roundMoney(amount) {
  return Math.round(Number(amount || 0) * 100) / 100;
}

function invoiceLineAmount(line, targetCurrency = line.currency || "UAH") {
  const amount = Number(line.qty || 0) * Number(line.price || 0) * (1 - Number(line.discount || 0) / 100);
  return convertMoneyWithRates(roundMoney(amount), line.currency || targetCurrency, targetCurrency, state.settings.rates);
}

function invoiceTotalsFromLines(lines = []) {
  const currencies = uniqueList(lines.map((line) => line.currency || "UAH"));
  const currency = currencies.length === 1 ? currencies[0] : state.settings.baseCurrency || "UAH";
  const total = roundMoney(lines.reduce((sum, line) => sum + invoiceLineAmount(line, currency), 0));
  return { currency, total };
}

function invoicePostStatus(invoice) {
  if (invoice.storageShipment && invoice.posted !== false) return "in_storage";
  if (Number(invoice.paid || 0) >= Number(invoice.total || 0)) return "paid";
  if (Number(invoice.paid || 0) > 0) return "partial";
  return invoice.posted === false ? "draft" : "payment_expected";
}

function isDebtInvoice(invoice = {}) {
  return invoice.status !== "cancelled" && invoice.storageShipment !== true;
}

function recalculateInvoiceTotals(invoice) {
  const totals = invoiceTotalsFromLines(invoice.lines || []);
  invoice.currency = totals.currency;
  invoice.total = totals.total;
  invoice.paid = Math.min(Number(invoice.paid || 0), invoice.total);
  invoice.pendingPaid = Math.min(Number(invoice.pendingPaid || 0), invoice.total);
  invoice.status = invoicePostStatus(invoice);
  return invoice;
}

function invoiceDraftKey(data = {}) {
  return [
    data.draftKind || (data.responsibleStorage ? "responsibleShipment" : "sales"),
    data.manager || "",
    data.clientId || "",
    data.date || today,
    data.firmId || "",
    data.warehouseId || data.sourceWarehouseId || ""
  ].join("|");
}

function findOpenInvoiceDraft(data = {}) {
  const key = invoiceDraftKey(data);
  return (state.invoices || []).find((invoice) => (
    invoice.status === "draft"
    && invoice.posted === false
    && (invoice.draftKey || invoiceDraftKey(invoice)) === key
  ));
}

function invoiceLineMergeKey(line) {
  if (line.serialId) return `serial|${line.serialId}`;
  return [
    "regular",
    line.productId || "",
    Number(line.price || 0),
    line.currency || "",
    Number(line.discount || 0),
    line.permitNumber || "",
    line.permitDate || ""
  ].join("|");
}

function appendLinesToInvoiceDraft(invoice, lines = []) {
  lines.forEach((line) => {
    const key = invoiceLineMergeKey(line);
    const existing = (invoice.lines || []).find((item) => invoiceLineMergeKey(item) === key);
    if (existing && !line.serialId) {
      existing.qty = roundMoney(Number(existing.qty || 0) + Number(line.qty || 0));
      return;
    }
    if (existing && line.serialId) return;
    invoice.lines.push(line);
  });
  invoice.updatedAt = currentTimestamp();
  return recalculateInvoiceTotals(invoice);
}

function invoiceLinesFromPrepared(preparedLines = []) {
  return preparedLines.flatMap((line) => {
    const product = line.product || byId(state.products, line.productId);
    if (!product) return [];
    if (product.type === "weapon") {
      return (line.serialIds || []).map((serialId) => {
        const serial = byId(state.serials, serialId);
        return {
          productId: product.id,
          qty: 1,
          price: Number(line.price || 0),
          currency: line.currency || product.currency || "UAH",
          discount: Number(line.discount || 0),
          serialId,
          previousSerialStatus: serial?.status || "available",
          permitNumber: line.permitNumber || "",
          permitDate: line.permitDate || "",
          sourceRequestId: line.requestId || ""
        };
      });
    }
    return [{
      productId: product.id,
      qty: Number(line.qty || 0),
      price: Number(line.price || 0),
      currency: line.currency || product.currency || "UAH",
      discount: Number(line.discount || 0),
      serialId: "",
      permitNumber: line.permitNumber || "",
      permitDate: line.permitDate || "",
      sourceRequestId: line.requestId || ""
    }];
  });
}

function invoiceDueDateFromData(data = {}) {
  const date = data.date || today;
  const paymentMode = String(data.paymentMode || "").toLowerCase();
  const days = data.paymentDays === "" || data.paymentDays === undefined
    ? data.dueDays
    : data.paymentDays;
  const isDeferred = paymentMode.includes("відтер") || (!paymentMode && Number(days || 0) > 0);
  return isDeferred ? addDays(date, days || state.settings.defaultDueDays) : date;
}

function createOrAppendInvoiceDraft(data = {}, preparedLines = [], options = {}) {
  const lines = invoiceLinesFromPrepared(preparedLines);
  if (!lines.length) throw new Error("У чернетці немає товарних рядків.");
  const base = {
    ...data,
    date: data.date || today,
    firmId: data.firmId || state.settings.firms[0]?.id || "vat",
    warehouseId: data.warehouseId || data.sourceWarehouseId || "wh-store",
    manager: data.manager || state.currentManager,
    draftKind: options.draftKind || data.draftKind || (data.responsibleStorage ? "responsibleShipment" : "sales"),
    responsibleStorage: options.responsibleStorage === true || data.responsibleStorage === true
  };
  const requestIds = uniqueList([...(options.requestIds || []), ...(data.requestIds || []), ...lines.map((line) => line.sourceRequestId).filter(Boolean)]);
  const existing = findOpenInvoiceDraft(base);
  if (existing) {
    appendLinesToInvoiceDraft(existing, lines);
    existing.requestIds = uniqueList([...(existing.requestIds || []), ...requestIds]);
    existing.delivery = data.delivery || existing.delivery;
    existing.deliveryPayer = data.deliveryPayer || existing.deliveryPayer;
    existing.ttn = data.ttn || existing.ttn;
    existing.comment = uniqueList([existing.comment || "", data.comment || ""].filter(Boolean)).join(" · ");
    existing.pendingPaid = Math.min(Number(existing.pendingPaid || 0) + Number(data.pendingPaid || data.paid || 0), existing.total);
    existing.dueDate = invoiceDueDateFromData({ ...data, date: existing.date });
    return { invoice: existing, created: false };
  }

  const totals = invoiceTotalsFromLines(lines);
  const invoice = {
    id: uniqueId("inv"),
    date: base.date,
    documentType: data.documentType || (base.responsibleStorage ? "Накладна відвантаження B2B" : "Видаткова накладна"),
    contract: data.contract || (base.responsibleStorage ? "B2B відповідальне зберігання" : ""),
    warehouseId: base.warehouseId,
    sourceWarehouseId: base.warehouseId,
    firmId: base.firmId,
    channel: data.channel || (base.responsibleStorage ? "B2B відповідальне зберігання" : ""),
    clientId: data.clientId || "",
    manager: base.manager,
    priceType: data.priceType || "",
    currency: totals.currency,
    total: totals.total,
    paid: 0,
    pendingPaid: Math.min(Number(data.pendingPaid || data.paid || 0), totals.total),
    discount: 0,
    dueDate: invoiceDueDateFromData(data),
    cashArticle: data.cashArticle || "",
    accounting: data.accounting === true || data.accounting === "true",
    locked: false,
    status: "draft",
    posted: false,
    draftKey: invoiceDraftKey(base),
    draftKind: base.draftKind,
    responsibleStorage: base.responsibleStorage,
    storageShipment: base.draftKind === "responsibleShipment",
    paymentDays: data.paymentDays === "" || data.paymentDays === undefined ? data.dueDays : data.paymentDays,
    requestIds,
    lines,
    delivery: data.delivery || "",
    deliveryPayer: data.deliveryPayer || "",
    ttn: data.ttn || "",
    comment: data.comment || "",
    createdAt: currentTimestamp()
  };
  state.invoices.unshift(invoice);
  return { invoice, created: true };
}

function validateInvoiceDraftPosting(invoice) {
  if (!invoice || invoice.posted !== false || invoice.status !== "draft") return "Це не відкрита чернетка.";
  const warehouseId = invoice.warehouseId || invoice.sourceWarehouseId || "";
  const firmId = invoice.firmId || "vat";
  const client = byId(state.clients, invoice.clientId);
  const groupedRegular = {};
  for (const line of invoice.lines || []) {
    const product = byId(state.products, line.productId);
    if (!product) return `Товар ${line.productId} не знайдено.`;
    if (product.type !== "weapon") {
      groupedRegular[product.id] = (groupedRegular[product.id] || 0) + Number(line.qty || 0);
      continue;
    }
    const serial = byId(state.serials, line.serialId);
    if (!serial) return `Серійний номер ${line.serialId} не знайдено.`;
    if (!serialMatchesProduct(serial, product)) return `Серія ${serial.serial} належить іншій моделі.`;
    if (invoiceUsesSerial(serial.id, { excludeInvoiceId: invoice.id })) return `Серія ${serial.serial} вже використана в проведеній накладній.`;
    if (!serialMatchesStockContext(serial, { warehouseId, firmId, clientId: "" })) return `Серія ${serial.serial} не належить вибраній фірмі/складу чернетки.`;
    if (serial.status !== "available") return `Серія ${serial.serial} не є вільною для відвантаження.`;
    if (serial.actual === false) return `Серія ${serial.serial} неактуальна.`;
    if (!invoice.responsibleStorage && (!line.permitNumber || !line.permitDate)) return `Для серії ${serial.serial} потрібні номер дозволу і дата видачі.`;
    if (!invoice.responsibleStorage && serial.erzStatus !== "verified") return `ЄРЗ для серії ${serial.serial} не перевірено.`;
  }
  for (const [productId, qty] of Object.entries(groupedRegular)) {
    const available = stockQtyWhere(productId, ownStockPredicate({ warehouseId, firmId }));
    if (available < qty) return `${stockContextMessage(productId, qty, warehouseId, firmId)} Доступно зараз: ${available} од.`;
  }
  if (invoice.responsibleStorage && (!client || client.type !== "B2B")) return "Для відвантаження на відповідальне зберігання потрібен B2B клієнт.";
  return "";
}

function postSalesInvoiceDraft(invoice) {
  (invoice.lines || []).forEach((line) => {
    const product = byId(state.products, line.productId);
    if (line.serialId) {
      const serial = byId(state.serials, line.serialId);
      serial.status = "sold";
      serial.clientId = invoice.clientId;
      serial.permitNumber = line.permitNumber;
      serial.permitDate = line.permitDate;
    } else if (product?.type !== "weapon") {
      decrementStock(line.productId, line.qty, invoice.warehouseId || invoice.sourceWarehouseId || "", invoice.firmId || "vat");
    }
  });
  const paid = Math.min(Number(invoice.pendingPaid || 0), Number(invoice.total || 0));
  if (paid > 0) {
    invoice.paid = paid;
    state.payments.unshift({
      id: uniqueId("pay"),
      invoiceId: invoice.id,
      date: today,
      amount: paid,
      currency: invoice.currency,
      rate: uahRate(invoice.currency),
      rateMode: "settings",
      paymentKind: "invoice",
      advance: false,
      clientId: invoice.clientId,
      firmId: invoice.firmId,
      source: "bank",
      terminalId: "",
      prro: false,
      method: "Оплата з чернетки",
      bankRef: "invoice-draft"
    });
  }
}

function postResponsibleInvoiceDraft(invoice) {
  const client = byId(state.clients, invoice.clientId);
  const groups = {};
  (invoice.lines || []).forEach((line) => {
    if (!groups[line.productId]) groups[line.productId] = [];
    groups[line.productId].push(line);
  });
  const docIds = [];
  Object.entries(groups).forEach(([productId, lines]) => {
    const product = byId(state.products, productId);
    if (!product) return;
    const qty = lines.reduce((sum, line) => sum + Number(line.qty || 0), 0);
    const serialIds = lines.map((line) => line.serialId).filter(Boolean);
    const firstLine = lines[0] || {};
    const doc = applyResponsibleShipmentDoc({
      date: invoice.date,
      firmId: invoice.firmId,
      sourceWarehouseId: invoice.warehouseId || invoice.sourceWarehouseId || "",
      qty,
      price: firstLine.price,
      currency: firstLine.currency || invoice.currency,
      paymentDays: invoice.paymentDays || state.settings.defaultDueDays,
      delivery: invoice.delivery,
      ttn: invoice.ttn,
      manager: invoice.manager,
      comment: invoice.comment,
      requestId: uniqueList(lines.map((line) => line.sourceRequestId).filter(Boolean)).join(", "),
      barcode: product.barcode || product.qrCode || ""
    }, product, client, serialIds);
    doc.sourceWarehouseId = invoice.warehouseId || invoice.sourceWarehouseId || "";
    doc.invoiceDraftId = invoice.id;
    docIds.push(doc.id);
  });
  invoice.responsibleDocIds = uniqueList([...(invoice.responsibleDocIds || []), ...docIds]);
}

function postInvoiceDraft(id) {
  const invoice = byId(state.invoices, id);
  if (!invoice) return alert("Чернетку накладної не знайдено.");
  if (invoice.posted !== false || invoice.status !== "draft") return alert("Цю накладну вже проведено або скасовано.");
  const documentKey = invoice.responsibleStorage ? "responsibleShipment" : "salesInvoice";
  if (!canCreateDocument(documentKey)) return alert("Поточна роль не має права проводити цей вид документа.");
  const validation = validateInvoiceDraftPosting(invoice);
  if (validation) return alert(validation);
  if (!confirm(`Провести чернетку ${invoice.id} на ${formatMoney(invoice.total, invoice.currency)}? Після проведення буде списано залишки/серійні номери.`)) return;
  try {
    if (invoice.responsibleStorage) postResponsibleInvoiceDraft(invoice);
    else postSalesInvoiceDraft(invoice);
    invoice.posted = true;
    invoice.postedAt = currentTimestamp();
    invoice.status = invoicePostStatus(invoice);
    invoice.draftKey = "";
    addAudit(`Проведено чернетку накладної ${invoice.id} на ${formatMoney(invoice.total, invoice.currency)}`);
    render();
  } catch (error) {
    alert(error.message);
  }
}

function createInvoice(form) {
  if (!canCreateDocument("salesInvoice")) return alert("Поточна роль не має права створювати накладні продажу.");
  const data = formData(form);
  data.firmId = data.firmId || state.settings.firms[0]?.id || "vat";
  data.warehouseId = data.warehouseId || "wh-store";
  const draftLines = collectSaleLinesFromForm(form);
  if (!draftLines.length) return alert("Додайте хоча б один товар у накладну.");
  const allSerialIds = draftLines.flatMap((line) => line.serialIds || []);
  const duplicatedSerials = duplicateValues(allSerialIds);
  if (duplicatedSerials.length) return alert("Одна й та сама серія вибрана більше одного разу в накладній.");

  const preparedLines = [];
  for (const [index, rawLine] of draftLines.entries()) {
    const product = byId(state.products, rawLine.productId);
    if (!product) return alert(`Рядок ${index + 1}: товар не знайдено.`);
    const serialIds = product.type === "weapon" ? rawLine.serialIds : [];
    const validation = validateInvoice({ ...rawLine, warehouseId: data.warehouseId, firmId: data.firmId }, product, serialIds);
    if (validation) {
      alert(`Рядок ${index + 1}: ${validation}`);
      return;
    }
    const qty = Math.max(parseDecimal(rawLine.qty || 1, 1), 1);
    const price = parseDecimal(rawLine.price || productSalePrice(product, data.priceType).amount, product.price || 0);
    const discount = Math.min(Math.max(parseDecimal(rawLine.discount || 0), 0), 100);
    const currency = rawLine.currency || productSalePrice(product, data.priceType).currency || product.currency || "UAH";
    const lineTotal = Math.round(qty * price * (1 - discount / 100) * 100) / 100;
    preparedLines.push({ ...rawLine, product, serialIds, qty, price, discount, currency, lineTotal });
  }

  const regularDemand = preparedLines
    .filter((line) => line.product.type !== "weapon")
    .reduce((acc, line) => {
      acc[line.product.id] = (acc[line.product.id] || 0) + Number(line.qty || 0);
      return acc;
    }, {});
  for (const [productId, qty] of Object.entries(regularDemand)) {
    const available = stockQtyWhere(productId, ownStockPredicate({ warehouseId: data.warehouseId, firmId: data.firmId }));
    if (available < qty) return alert(stockContextMessage(productId, qty, data.warehouseId, data.firmId));
  }

  const draft = createOrAppendInvoiceDraft({
    ...data,
    pendingPaid: parseDecimal(data.paid || 0),
    draftKind: "sales",
    responsibleStorage: false
  }, preparedLines, { draftKind: "sales" });
  addAudit(`${draft.created ? "Створено чернетку накладної" : "Додано рядки до чернетки накладної"} ${draft.invoice.id}: ${formatMoney(draft.invoice.total, draft.invoice.currency)} · ${firmName(draft.invoice.firmId)} · ${warehouseName(draft.invoice.warehouseId)}`);
  saleDraft = { clientId: data.clientId, priceType: data.priceType, lines: [defaultSaleLine(preparedLines[0]?.product.id)] };
  render();
  return;

  const uniqueCurrencies = uniqueList(preparedLines.map((line) => line.currency));
  const invoiceCurrency = uniqueCurrencies.length === 1 ? uniqueCurrencies[0] : state.settings.baseCurrency || "UAH";
  const total = Math.round(preparedLines.reduce((sum, line) => sum + convertMoneyWithRates(line.lineTotal, line.currency, invoiceCurrency, state.settings.rates), 0) * 100) / 100;
  const paid = Math.min(parseDecimal(data.paid || 0), total);
  const paymentMode = String(data.paymentMode || "");
  const isDeferred = paymentMode.toLowerCase().includes("відтер");
  const isCashPaid = paymentMode.toLowerCase().includes("оплачено");
  const invoice = {
    id: `inv-${String(Date.now()).slice(-8)}`,
    date: data.date || today,
    documentType: data.documentType,
    contract: data.contract,
    warehouseId: data.warehouseId,
    firmId: data.firmId,
    channel: data.channel,
    clientId: data.clientId,
    manager: data.manager || state.currentManager,
    priceType: data.priceType,
    currency: invoiceCurrency,
    total,
    paid,
    discount: 0,
    dueDate: isDeferred ? addDays(data.date || today, data.dueDays || state.settings.defaultDueDays) : (data.date || today),
    cashArticle: data.cashArticle,
    accounting: data.accounting === "true",
    locked: false,
    status: paid >= total ? "paid" : paid > 0 ? "partial" : "draft",
    lines: preparedLines.flatMap((line) => line.product.type === "weapon"
      ? line.serialIds.map((serialId) => {
          const serial = byId(state.serials, serialId);
          return { productId: line.product.id, qty: 1, price: line.price, currency: line.currency, discount: line.discount, serialId, previousSerialStatus: serial?.status || "available", permitNumber: line.permitNumber || "", permitDate: line.permitDate || "" };
        })
      : [{ productId: line.product.id, qty: line.qty, price: line.price, currency: line.currency, discount: line.discount, serialId: "", permitNumber: "", permitDate: "" }]),
    delivery: data.delivery,
    deliveryPayer: data.deliveryPayer,
    ttn: data.ttn,
    comment: data.comment
  };

  preparedLines.forEach((line) => {
    if (line.product.type === "weapon") {
      line.serialIds.forEach((serialId) => {
        const serial = byId(state.serials, serialId);
        serial.status = "sold";
        serial.clientId = data.clientId;
        serial.permitNumber = line.permitNumber;
        serial.permitDate = line.permitDate;
      });
    } else {
      decrementStock(line.product.id, line.qty, data.warehouseId, data.firmId);
    }
  });

  if (paid > 0) {
    state.payments.unshift({
      id: `pay-${String(Date.now()).slice(-6)}`,
      invoiceId: invoice.id,
      date: today,
      amount: paid,
      currency: invoiceCurrency,
      rate: uahRate(invoiceCurrency),
      rateMode: "settings",
      paymentKind: "invoice",
      advance: false,
      clientId: invoice.clientId,
      firmId: invoice.firmId,
      source: isCashPaid ? "cash" : "bank",
      terminalId: "",
      prro: isCashPaid,
      method: isCashPaid ? "Каса" : "Безготівка",
      bankRef: "sale-form"
    });
  }

  state.invoices.unshift(invoice);
  addAudit(`Створено накладну ${invoice.id} на ${formatMoney(total, invoiceCurrency)}`);
  saleDraft = { clientId: data.clientId, priceType: data.priceType, lines: [defaultSaleLine(preparedLines[0]?.product.id)] };
  render();
}

function validateResponsibleShipment(data, product, client, serialIds) {
  if (!client || client.type !== "B2B") return "Оберіть B2B клієнта.";
  const codeError = validateScannedCode(data.barcode, product);
  if (codeError) return codeError;
  const qty = Number(data.qty || 0);
  const sourceWarehouseId = data.sourceWarehouseId || data.warehouseId || "";
  if (qty <= 0) return "Кількість передачі має бути більшою за нуль.";
  if (product.type !== "weapon") {
    if (stockQtyWhere(product.id, ownStockPredicate({ warehouseId: sourceWarehouseId, firmId: data.firmId })) < qty) return stockContextMessage(product.id, qty, sourceWarehouseId, data.firmId);
    return "";
  }
  if (serialIds.length !== qty) return `Для зброї кількість (${qty}) має дорівнювати кількості вибраних серій (${serialIds.length}).`;
  const duplicates = duplicateValues(serialIds);
  if (duplicates.length) return "Одна й та сама серія вибрана більше одного разу.";
  for (const serialId of serialIds) {
    const serial = byId(state.serials, serialId);
    if (!serial) return "Серійний номер не знайдено.";
    if (!serialMatchesProduct(serial, product)) return `Серія ${serial.serial} не належить вибраному товару.`;
    if (!serialMatchesStockContext(serial, { warehouseId: sourceWarehouseId, firmId: data.firmId, clientId: "" })) return `Серія ${serial.serial} не належить вибраній фірмі/складу для передачі.`;
    if (serial.clientId) return `Серія ${serial.serial} уже прив'язана до клієнта ${clientName(serial.clientId)}.`;
    if (serial.status !== "available") return `Серія ${serial.serial} не є вільною для передачі.`;
    if (serialIsSold(serial)) return `Серія ${serial.serial} уже продана.`;
    if (serial.actual === false) return `Серія ${serial.serial} неактуальна.`;
  }
  return "";
}

function applyResponsibleShipmentDoc(data, product, client, serialIds) {
  const qty = Number(data.qty || 0);
  const sourceWarehouseId = data.sourceWarehouseId || data.warehouseId || "";
  const warehouse = clientResponsibleWarehouse(client.id);
  const doc = {
    id: uniqueId("rs"),
    date: data.date || today,
    clientId: client.id,
    warehouseId: warehouse.id,
    sourceWarehouseId,
    firmId: data.firmId || "vat",
    productId: product.id,
    qty,
    serialIds,
    manager: data.manager || state.currentManager,
    paymentDays: Number(data.paymentDays || state.settings.defaultDueDays),
    price: data.price === "" || data.price === undefined ? "" : parseDecimal(data.price, 0),
    currency: data.currency || client.currency || product.currency || "UAH",
    delivery: data.delivery || "",
    ttn: data.ttn || "",
    requestId: data.requestId || "",
    status: "in_storage",
    ownership: "ours_until_client_sale",
    barcode: data.barcode || product.barcode || product.qrCode || "",
    soldQty: 0,
    invoiceIds: [],
    comment: data.comment || ""
  };

  if (product.type === "weapon") {
    serialIds.forEach((serialId) => {
      const serial = byId(state.serials, serialId);
      serial.status = "responsible_storage";
      serial.clientId = client.id;
      serial.warehouseId = warehouse.id;
      serial.responsibleStorageDocId = doc.id;
    });
  } else {
    decrementStockWhere(product.id, qty, ownStockPredicate({ warehouseId: sourceWarehouseId, firmId: data.firmId }), stockContextMessage(product.id, qty, sourceWarehouseId, data.firmId));
    incrementStock(product.id, warehouse.id, qty, client.id, data.firmId || "vat");
  }

  state.responsibleStorageDocs.unshift(doc);
  return doc;
}

function createResponsibleShipment(form) {
  if (!canCreateDocument("responsibleShipment")) return alert("Поточна роль не має права створювати передачу на відповідальне зберігання.");
  try {
    const data = formData(form);
    data.firmId = data.firmId || state.settings.firms[0]?.id || "vat";
    const client = byId(state.clients, data.clientId);
    const product = byId(state.products, data.productId);
    if (!product) throw new Error("Товар не знайдено.");
    const qty = Number(data.qty || 0);
    const serialIds = product.type === "weapon" ? selectedValues(form.elements.serialIds) : [];
    const validation = validateResponsibleShipment(data, product, client, serialIds);
    if (validation) throw new Error(validation);

    const doc = applyResponsibleShipmentDoc(data, product, client, serialIds);
    b2bDraft = { ...b2bDraft, saleClientId: client.id, saleProductId: product.id, shipmentProductId: product.id, shipmentFirmId: data.firmId || "vat", saleFirmId: data.firmId || b2bDraft.saleFirmId || "vat", shipmentBarcode: product.barcode || "", saleBarcode: product.barcode || "" };
    addAudit(`Передано на відповідальне зберігання ${doc.id}: ${productName(product.id)} · ${qty} од. · ${client.name}`);
    render();
  } catch (error) {
    alert(error.message);
  }
}

function createB2BShipmentRequest(form) {
  try {
    const data = formData(form);
    const portalClient = isClientAuthenticated() ? authenticatedClient() : null;
    if (!portalClient && !canCreateDocument("b2bShipmentRequest")) {
      return alert("Поточна роль не має права створювати заявки B2B на відвантаження.");
    }
    if (portalClient && data.clientId !== portalClient.id) {
      throw new Error("B2B клієнт може створювати заявку тільки від свого кабінету.");
    }
    const client = portalClient || byId(state.clients, data.clientId);
    const product = byId(state.products, data.productId);
    const qty = Number(data.qty || 0);
    if (!client || client.type !== "B2B") throw new Error("Оберіть B2B клієнта для заявки.");
    if (!product) throw new Error("Оберіть товар із каталогу CRM.");
    if (qty <= 0) throw new Error("Кількість у заявці має бути більшою за нуль.");

    const desiredDate = data.desiredDate || "";
    const draftStatus = portalClient ? "request_draft" : "request_new";
    const mergeStatuses = portalClient ? ["request_draft"] : ["request_new", "request_review"];
    const existingRequest = findOpenB2BShipmentRequest(client.id, product.id, desiredDate, mergeStatuses);
    if (existingRequest) {
      existingRequest.qty = Number(existingRequest.qty || 0) + qty;
      existingRequest.date = data.date || existingRequest.date || today;
      existingRequest.desiredDate = desiredDate;
      existingRequest.manager = data.manager || existingRequest.manager || client.manager || state.currentManager;
      existingRequest.validation = [];
      if (data.comment) {
        existingRequest.comment = existingRequest.comment
          ? uniqueList([existingRequest.comment, data.comment]).join(" · ")
          : data.comment;
      }
      addAudit(`B2B клієнт додав кількість до заявки ${existingRequest.id}: ${client.name} · ${productName(product.id)} · +${qty} од., разом ${existingRequest.qty} од.`, portalClient ? "B2B кабінет" : state.currentManager);
      render();
      return;
    }

    const request = {
      id: uniqueId("req"),
      date: data.date || today,
      desiredDate,
      clientId: client.id,
      productId: product.id,
      qty,
      status: draftStatus,
      manager: data.manager || client.manager || state.currentManager,
      comment: data.comment || "",
      firmId: "",
      warehouseId: "",
      serialIds: [],
      price: "",
      currency: "",
      paymentDays: "",
      delivery: "",
      ttn: "",
      responsibleDocId: "",
      validation: []
    };
    state.b2bShipmentRequests.unshift(request);
    addAudit(`${portalClient ? "B2B клієнт додав позицію в чернетку заявки" : "Створено заявку B2B на відвантаження"} ${request.id}: ${client.name} · ${productName(product.id)} · ${qty} од.`, portalClient ? "B2B кабінет" : state.currentManager);
    render();
  } catch (error) {
    alert(error.message);
  }
}

function collectB2BShipmentRequestForm(form) {
  const data = formData(form);
  const product = byId(state.products, data.productId);
  return {
    requestId: data.requestId || "",
    date: data.date || today,
    desiredDate: data.desiredDate || "",
    clientId: data.clientId || "",
    productId: data.productId || "",
    qty: Number(data.qty || 0),
    firmId: data.firmId || "",
    warehouseId: data.warehouseId || "",
    price: data.price === "" || data.price === undefined ? "" : parseDecimal(data.price, 0),
    currency: data.currency || "",
    paymentDays: data.paymentDays === "" || data.paymentDays === undefined ? "" : Number(data.paymentDays),
    delivery: data.delivery || "",
    ttn: data.ttn || "",
    manager: data.manager || state.currentManager,
    comment: data.comment || "",
    serialIds: product?.type === "weapon" ? selectedValues(form.elements.serialIds) : []
  };
}

function updateB2BShipmentRequestDraftFromForm(form) {
  const data = collectB2BShipmentRequestForm(form);
  const request = byId(state.b2bShipmentRequests, data.requestId);
  if (!request) return null;
  Object.assign(request, data, {
    id: request.id,
    status: request.status === "request_approved" ? "request_approved" : "request_review",
    validation: b2bShipmentRequestIssues(data, { requireManagerFields: true })
  });
  return request;
}

function openB2BShipmentRequest(id) {
  if (!canCreateDocument("b2bShipmentRequest") && !canCreateDocument("responsibleShipment")) {
    return alert("Поточна роль не має права готувати заявки B2B на відвантаження.");
  }
  const request = byId(state.b2bShipmentRequests || [], id);
  if (!request) return alert("Заявку B2B на відвантаження не знайдено.");
  const b2bClients = state.clients.filter((client) => client.type === "B2B");
  const client = byId(state.clients, request.clientId) || b2bClients[0];
  const product = byId(state.products, request.productId) || state.products[0];
  const firmId = request.firmId || state.settings.firms[0]?.id || "vat";
  const warehouseId = request.warehouseId || b2bDraft.shipmentWarehouseId || "wh-main";
  const priceInfo = product ? productSalePrice(product, client?.priceType || "b2b") : { amount: 0, currency: client?.currency || "UAH" };
  const price = request.price === "" || request.price === undefined ? priceInfo.amount : request.price;
  const currency = request.currency || priceInfo.currency || client?.currency || "UAH";
  const paymentDays = request.paymentDays === "" || request.paymentDays === undefined ? state.settings.defaultDueDays : request.paymentDays;
  const qty = Number(request.qty || 1);
  const selectedSerialIds = Array.isArray(request.serialIds) ? request.serialIds : [];
  const availableSerials = product?.type === "weapon"
    ? ownAvailableSerialsForProduct(product).filter((serial) => serialMatchesStockContext(serial, { warehouseId, firmId, clientId: "" }))
    : [];
  const selectedSerials = selectedSerialIds.map((serialId) => byId(state.serials, serialId)).filter(Boolean);
  const serialOptionsSource = [
    ...availableSerials,
    ...selectedSerials.filter((serial) => !availableSerials.some((item) => item.id === serial.id))
  ];
  const formSnapshot = {
    ...request,
    clientId: client?.id || "",
    productId: product?.id || "",
    firmId,
    warehouseId,
    qty,
    price,
    currency,
    paymentDays,
    serialIds: selectedSerialIds
  };
  const issues = b2bShipmentRequestIssues(formSnapshot, { requireManagerFields: true });
  document.querySelector(".modal-backdrop")?.remove();
  openModal(`Підготовка заявки ${request.id}`, `
    <form class="form-grid" data-action="approve-b2b-shipment-request">
      <input type="hidden" name="requestId" value="${escapeHtml(request.id)}">
      <label class="field"><span>Дата заявки</span><input name="date" type="date" value="${escapeHtml(request.date || today)}"></label>
      <label class="field"><span>Бажана дата відвантаження</span><input name="desiredDate" type="date" value="${escapeHtml(request.desiredDate || "")}"></label>
      <label class="field wide"><span>B2B клієнт</span><select name="clientId" data-b2b-request-rebuild>${b2bClients.map((item) => option(item.id, item.name, item.id === client?.id)).join("")}</select></label>
      <label class="field wide"><span>Товар</span><select name="productId" data-b2b-request-rebuild>${state.products.map((item) => option(item.id, `${item.type === "weapon" ? "Зброя" : "Товар"} · ${item.brand} ${item.model}`, item.id === product?.id)).join("")}</select></label>
      <label class="field"><span>Кількість</span><input name="qty" type="number" min="1" value="${qty}" data-b2b-request-rebuild></label>
      <label class="field"><span>Фірма-власник</span><select name="firmId" data-b2b-request-rebuild>${state.settings.firms.map((firm) => option(firm.id, firm.name, firm.id === firmId)).join("")}</select></label>
      <label class="field"><span>Склад відвантаження</span><select name="warehouseId" data-b2b-request-rebuild>${state.warehouses.filter((warehouse) => warehouse.kind !== "client_responsible").map((warehouse) => option(warehouse.id, warehouse.name, warehouse.id === warehouseId)).join("")}</select></label>
      ${renderB2BRequestAvailability(product, qty, firmId, warehouseId)}
      <label class="field"><span>Ціна відвантаження</span><input name="price" inputmode="decimal" value="${escapeHtml(price)}"></label>
      <label class="field"><span>Валюта</span><select name="currency">${Object.keys(state.settings.rates).map((code) => option(code, code, code === currency)).join("")}</select></label>
      <label class="field"><span>Термін оплати після продажу, днів</span><input name="paymentDays" type="number" min="0" value="${escapeHtml(paymentDays)}"></label>
      <label class="field"><span>Доставка</span><select name="delivery">${variantOptions("delivery", request.delivery || state.settings.delivery[0] || "")}</select></label>
      <label class="field"><span>ТТН</span><input name="ttn" value="${escapeHtml(request.ttn || "")}" placeholder="можна заповнити пізніше"></label>
      ${product?.type === "weapon" ? `
        <label class="field full"><span>Серійні номери для відвантаження</span><select class="serial-select" name="serialIds" multiple>
          ${serialOptionsSource.length
            ? serialOptionsSource.map((serial) => b2bSerialOption(serial, selectedSerialIds, "shipment")).join("")
            : '<option disabled>Немає вільних серій цієї моделі по вибраній фірмі.</option>'}
        </select></label>
      ` : '<p class="notice info small full">Для звичайного товару менеджер перевіряє залишок по вибраній фірмі. Серійні номери не потрібні.</p>'}
      <label class="field"><span>Менеджер</span><select name="manager">${employeeOptions(request.manager || client?.manager || state.currentManager)}</select></label>
      <label class="field full"><span>Коментар</span><textarea name="comment">${escapeHtml(request.comment || "")}</textarea></label>
      <div class="full">${b2bShipmentRequestIssueHtml(issues)}</div>
      <button class="primary" type="submit">Створити накладну відвантаження</button>
    </form>
  `);
}

function approveB2BShipmentRequest(form) {
  if (!canCreateDocument("b2bShipmentRequest") || !canCreateDocument("responsibleShipment")) {
    return alert("Поточна роль не має права підтверджувати B2B заявки та створювати відвантаження.");
  }
  try {
    const request = updateB2BShipmentRequestDraftFromForm(form);
    if (!request) throw new Error("Заявку B2B на відвантаження не знайдено.");
    const client = byId(state.clients, request.clientId);
    const product = byId(state.products, request.productId);
    const issues = b2bShipmentRequestIssues(request, { requireManagerFields: true });
    if (issues.length) {
      request.status = "request_review";
      request.validation = issues;
      openB2BShipmentRequest(request.id);
      return;
    }
    const qty = Number(request.qty || 0);
    const price = parseDecimal(request.price, productSalePrice(product, client.priceType || "b2b").amount);
    const currency = request.currency || productSalePrice(product, client.priceType || "b2b").currency || client.currency || product.currency || "UAH";
    const draft = createOrAppendInvoiceDraft({
      date: today,
      documentType: "Накладна відвантаження B2B",
      contract: "B2B відповідальне зберігання",
      warehouseId: request.warehouseId || "wh-main",
      firmId: request.firmId || state.settings.firms[0]?.id || "vat",
      channel: "B2B відповідальне зберігання",
      clientId: client.id,
      manager: request.manager || client.manager || state.currentManager,
      priceType: client.priceType || "b2b",
      paymentMode: "Відтермінування",
      paymentDays: request.paymentDays || state.settings.defaultDueDays,
      cashArticle: "Продаж товарів",
      accounting: true,
      responsibleStorage: true,
      draftKind: "responsibleShipment",
      delivery: request.delivery || "Склад клієнта",
      deliveryPayer: "Клієнт",
      ttn: request.ttn || "",
      comment: request.comment || "",
      requestIds: [request.id]
    }, [{
      product,
      productId: product.id,
      qty,
      price,
      discount: 0,
      currency,
      serialIds: product.type === "weapon" ? request.serialIds || [] : [],
      requestId: request.id
    }], { draftKind: "responsibleShipment", responsibleStorage: true, requestIds: [request.id] });
    request.status = "request_approved";
    request.responsibleDocId = draft.invoice.id;
    request.invoiceDraftId = draft.invoice.id;
    request.validation = [];
    b2bDraft = { ...b2bDraft, saleClientId: client.id, saleProductId: product.id, shipmentProductId: product.id, shipmentFirmId: request.firmId || "vat", shipmentWarehouseId: request.warehouseId || "wh-main", saleFirmId: request.firmId || b2bDraft.saleFirmId || "vat", shipmentBarcode: product.barcode || "", saleBarcode: product.barcode || "" };
    addAudit(`${draft.created ? "Створено чернетку відвантаження" : "Додано заявку до чернетки відвантаження"} ${draft.invoice.id} з B2B заявки ${request.id}: ${client.name} · ${productName(product.id)} · ${request.qty} од. · ${firmName(draft.invoice.firmId)} · ${warehouseName(draft.invoice.warehouseId)}`);
    document.querySelector(".modal-backdrop")?.remove();
    render();
  } catch (error) {
    alert(error.message);
  }
}

function rejectB2BShipmentRequest(id) {
  if (!canCreateDocument("b2bShipmentRequest")) return alert("Поточна роль не має права змінювати заявки B2B.");
  const request = byId(state.b2bShipmentRequests || [], id);
  if (!request) return;
  request.status = "request_rejected";
  request.validation = [];
  addAudit(`Заявку B2B ${request.id} відхилено`, state.currentManager);
  render();
}

function syncClientB2BCartUi(clientId) {
  const client = byId(state.clients, clientId);
  if (!client) return;
  const drafts = (state.b2bShipmentRequests || []).filter((request) => (
    request.clientId === client.id
    && request.status === "request_draft"
    && Number(request.qty || 0) > 0
  ));
  drafts.forEach((request) => {
    const lineTotal = b2bShipmentRequestLineTotal(request, client);
    const lineNode = $(`[data-client-request-line-total="${CSS.escape(request.id)}"]`);
    if (lineNode) lineNode.textContent = formatMoney(lineTotal.amount, lineTotal.currency);
  });
  const totals = b2bShipmentRequestTotals(drafts, client);
  const totalText = formatCurrencyTotals(totals, client.currency || "UAH");
  const qty = drafts.reduce((sum, request) => sum + Number(request.qty || 0), 0);
  $$(`[data-client-request-total="${CSS.escape(client.id)}"]`).forEach((node) => {
    node.textContent = totalText;
  });
  $$(`[data-floating-cart-total="${CSS.escape(client.id)}"]`).forEach((node) => {
    node.textContent = totalText;
  });
  $$(`[data-floating-cart-qty="${CSS.escape(client.id)}"]`).forEach((node) => {
    node.textContent = `${qty} од.`;
  });
}

function updateClientB2BShipmentRequestQty(id, rawQty, options = {}) {
  const request = byId(state.b2bShipmentRequests || [], id);
  if (!request) return alert("Заявку B2B не знайдено.");
  if (!canManageB2BClientRequest(request)) return alert("Цю заявку вже не можна змінювати.");
  const normalized = normalizeDecimalText(rawQty);
  if (!normalized) return alert("Вкажіть кількість.");
  const qty = parseDecimal(normalized, 0);
  if (qty <= 0) {
    cancelClientB2BShipmentRequest(id, true, { zeroQty: true });
    return;
  }
  request.qty = qty;
  request.status = request.status === "request_draft" ? "request_draft" : request.status === "request_review" ? "request_review" : "request_new";
  request.validation = [];
  syncClientB2BCartUi(request.clientId);
  if (options.silent) return true;
  addAudit(`Змінено кількість у заявці B2B ${request.id}: ${productName(request.productId)} · ${qty} од.`, isClientAuthenticated() ? "B2B кабінет" : state.currentManager);
  render();
  return true;
}

function cancelClientB2BShipmentRequest(id, ask = true, options = {}) {
  const request = byId(state.b2bShipmentRequests || [], id);
  if (!request) return false;
  if (!canManageB2BClientRequest(request)) {
    alert("Цю заявку вже не можна відмінити.");
    return false;
  }
  const message = options.zeroQty
    ? "Кількість 0 означає видалення позиції із заявки. Ви впевнені?"
    : "Відмінити цю позицію заявки?";
  if (ask && !confirm(message)) return false;
  request.qty = 0;
  request.status = "request_cancelled";
  request.validation = [];
  addAudit(`Позицію заявки B2B ${request.id} скасовано: ${productName(request.productId)}`, isClientAuthenticated() ? "B2B кабінет" : state.currentManager);
  render();
  return true;
}

function confirmClientB2BShipmentRequests(clientId) {
  const client = byId(state.clients, clientId);
  if (!client || client.type !== "B2B") return alert("B2B клієнта не знайдено.");
  if (isClientAuthenticated() && client.id !== authClientId) return alert("Можна підтвердити тільки заявку свого кабінету.");
  const drafts = (state.b2bShipmentRequests || []).filter((request) => (
    request.clientId === client.id
    && request.status === "request_draft"
    && Number(request.qty || 0) > 0
  ));
  if (!drafts.length) return alert("У чернетці немає позицій для підтвердження.");
  const totals = b2bShipmentRequestTotals(drafts, client);
  const linesText = drafts
    .map((request) => {
      const total = b2bShipmentRequestLineTotal(request, client);
      return `${productName(request.productId)} · ${request.qty} од. · ${formatMoney(total.amount, total.currency)}`;
    })
    .join("\n");
  const totalText = formatCurrencyTotals(totals, client.currency || "UAH");
  if (!confirm(`Підтвердити заявку на відвантаження?\n\n${linesText}\n\nРазом: ${totalText}\n\nПісля підтвердження заявка потрапить менеджеру B2B для опрацювання.`)) return;
  const batchId = uniqueId("b2b-request");
  const submittedAt = `${today} ${new Date().toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}`;
  drafts.forEach((request) => {
    request.status = "request_new";
    request.date = today;
    request.batchId = batchId;
    request.submittedAt = submittedAt;
    request.validation = [];
  });
  addAudit(`B2B клієнт підтвердив заявку ${batchId}: ${client.name} · ${drafts.length} позицій · ${totalText}`, isClientAuthenticated() ? "B2B кабінет" : state.currentManager);
  render();
}

function openClientRequestBatch(batchId, clientId = "") {
  const client = byId(state.clients, clientId) || authenticatedClient();
  if (!client) return alert("Клієнта для заявки не знайдено.");
  if (isClientAuthenticated() && client.id !== authClientId) return alert("B2B кабінет може переглядати тільки власні заявки.");
  const requests = b2bShipmentRequestRows(client.id)
    .filter((request) => b2bRequestGroupId(request) === batchId && request.status !== "request_draft");
  if (!requests.length) return alert("Заявку не знайдено або вона ще не підтверджена.");
  const totals = b2bShipmentRequestTotals(requests, client);
  const qty = requests.reduce((sum, request) => sum + Number(request.qty || 0), 0);
  const submittedAt = requests.find((request) => request.submittedAt)?.submittedAt || "";
  openModal(`Заявка ${batchId}`, `
    <section class="grid three compact-metrics">
      <article class="card metric info"><span>Дата</span><strong>${escapeHtml(requests[0]?.date || "-")}</strong><small>${escapeHtml(submittedAt || "час не зафіксовано")}</small></article>
      <article class="card metric good"><span>Кількість</span><strong>${qty}</strong><small>${requests.length} позицій</small></article>
      <article class="card metric warn"><span>Сума</span><strong>${formatCurrencyTotals(totals, client.currency || "UAH")}</strong><small>${escapeHtml(client.name)}</small></article>
    </section>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Товар</th><th>К-сть</th><th>Ціна од.</th><th>Сума</th><th>Бажана дата</th><th>Статус</th><th>Коментар</th></tr></thead>
        <tbody>
          ${requests.map((request) => {
            const price = b2bShipmentRequestPrice(request, client);
            const total = b2bShipmentRequestLineTotal(request, client);
            return `
              <tr>
                <td>${productName(request.productId)}</td>
                <td>${escapeHtml(request.qty)}</td>
                <td>${formatMoney(price.amount, price.currency)}</td>
                <td><strong>${formatMoney(total.amount, total.currency)}</strong></td>
                <td>${escapeHtml(request.desiredDate || "-")}</td>
                <td>${statusPill(request.status)}</td>
                <td>${escapeHtml(request.comment || "-")}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `);
}

function editResponsibleStorageDoc(id) {
  const doc = byId(state.responsibleStorageDocs, id);
  if (!doc) return;
  if (!canEditPostedDocument("responsibleShipment")) return alert("Поточна роль не має права змінювати проведене відповідальне зберігання.");
  openModal(`Зміна відповідального зберігання ${doc.id}`, `
    <form class="form-grid" data-action="update-responsible-doc">
      <input type="hidden" name="id" value="${escapeHtml(doc.id)}">
      <label class="field"><span>Дата</span><input name="date" type="date" value="${escapeHtml(doc.date || today)}"></label>
      <label class="field"><span>Менеджер</span><select name="manager">${employeeOptions(doc.manager)}</select></label>
      <label class="field"><span>Оплата після продажу, днів</span><input name="paymentDays" type="number" min="0" value="${doc.paymentDays || state.settings.defaultDueDays}"></label>
      <label class="field"><span>QR / штрихкод</span><input name="barcode" value="${escapeHtml(doc.barcode || "")}"></label>
      <label class="field full"><span>Коментар</span><textarea name="comment">${escapeHtml(doc.comment || "")}</textarea></label>
      <p class="notice warn small full">Клієнт, товар, кількість і серії в проведеній передачі змінюються тільки коригуючим документом, щоб залишки клієнта та серії не роз'їхались.</p>
      <button class="primary" type="submit">Зберегти зміни зберігання</button>
    </form>
  `);
}

function updateResponsibleStorageDoc(form) {
  const data = formData(form);
  const doc = byId(state.responsibleStorageDocs, data.id);
  if (!doc) return alert("Документ відповідального зберігання не знайдено.");
  if (!canEditPostedDocument("responsibleShipment")) return alert("Поточна роль не має права змінювати проведене відповідальне зберігання.");
  doc.date = data.date || doc.date;
  doc.manager = data.manager || doc.manager;
  doc.paymentDays = Number(data.paymentDays || state.settings.defaultDueDays);
  doc.barcode = data.barcode || doc.barcode || "";
  doc.comment = data.comment || "";
  doc.status = responsibleDocStatus(doc);
  addAudit(`Змінено проведене відповідальне зберігання ${doc.id}`);
  document.querySelector(".modal-backdrop")?.remove();
  render();
}

function validateB2BClientSale(data, product, client, serialIds, options = {}) {
  if (!client || client.type !== "B2B") return "Оберіть B2B клієнта.";
  const codeError = validateScannedCode(data.barcode, product);
  if (codeError) return codeError;
  const qty = Number(data.qty || 0);
  if (qty <= 0) return "Кількість продажу має бути більшою за нуль.";
  if (product.type !== "weapon") {
    if (stockQtyWhere(product.id, (row) => row.clientId === client.id && (row.firmId || "vat") === (data.firmId || "vat")) < qty) return "Недостатньо залишку на відповідальному зберіганні цього клієнта для вибраної фірми.";
    return "";
  }
  if (!options.clientPortal && !role().canSellWeapon) return "Поточна роль не має права підтверджувати продаж зброї.";
  if (!data.permitNumber || !data.permitDate) return "Для зброї потрібно внести номер дозволу покупця та дату його видачі.";
  if (serialIds.length !== qty) return `Кількість (${qty}) має дорівнювати кількості вибраних серій (${serialIds.length}).`;
  const duplicates = duplicateValues(serialIds);
  if (duplicates.length) return "Одна й та сама серія вибрана більше одного разу.";
  for (const serialId of serialIds) {
    const serial = byId(state.serials, serialId);
    if (!serial) return "Серійний номер не знайдено.";
    if (!serialMatchesProduct(serial, product)) return `Серія ${serial.serial} не належить вибраній моделі.`;
    if (!serialMatchesStockContext(serial, { firmId: data.firmId || "vat", clientId: client.id })) return `Серія ${serial.serial} не належить вибраній фірмі/клієнту.`;
    if (serial.clientId !== client.id) return `Серія ${serial.serial} належить іншому клієнту.`;
    if (serial.status !== "responsible_storage") return `Серія ${serial.serial} не перебуває на відповідальному зберіганні цього клієнта.`;
    if (serialIsSold(serial)) return `Серія ${serial.serial} уже продана. Повторний продаж заблоковано.`;
    if (serial.actual === false) return `Серія ${serial.serial} неактуальна.`;
    if (serial.erzStatus !== "verified") return `ЄРЗ для серії ${serial.serial} не перевірено.`;
  }
  return "";
}

function applyResponsibleStorageSale(clientId, productId, qty, serialIds, invoiceId, firmId = "") {
  let remaining = Number(qty || 0);
  const docs = state.responsibleStorageDocs
    .filter((doc) => doc.clientId === clientId && doc.productId === productId)
    .filter((doc) => !firmId || (doc.firmId || "vat") === firmId)
    .sort((first, second) => String(first.date).localeCompare(String(second.date)));

  if (serialIds.length) {
    docs.forEach((doc) => {
      const soldFromDoc = (doc.serialIds || []).filter((serialId) => serialIds.includes(serialId)).length;
      if (!soldFromDoc) return;
      doc.soldQty = Math.min(Number(doc.qty || 0), Number(doc.soldQty || 0) + soldFromDoc);
      doc.invoiceIds = uniqueList([...(doc.invoiceIds || []), invoiceId]);
      doc.status = responsibleDocStatus(doc);
      doc.ownership = doc.status === "ownership_transferred" ? "transferred_to_client" : "ours_until_client_sale";
    });
    return;
  }

  for (const doc of docs) {
    const available = responsibleDocRemainingQty(doc);
    if (available <= 0) continue;
    const take = Math.min(available, remaining);
    doc.soldQty = Number(doc.soldQty || 0) + take;
    doc.invoiceIds = uniqueList([...(doc.invoiceIds || []), invoiceId]);
    doc.status = responsibleDocStatus(doc);
    doc.ownership = doc.status === "ownership_transferred" ? "transferred_to_client" : "ours_until_client_sale";
    remaining -= take;
    if (remaining <= 0) break;
  }
}

function createB2BClientSale(form, options = {}) {
  if (!options.clientPortal && !canCreateDocument("b2bSaleReport")) return alert("Поточна роль не має права створювати звіт продажу B2B.");
  try {
    const data = formData(form);
    data.firmId = data.firmId || state.settings.firms[0]?.id || "vat";
    const portalClient = options.clientPortal ? authenticatedClient() : null;
    if (options.clientPortal && (!portalClient || data.clientId !== portalClient.id)) {
      throw new Error("B2B кабінет може подавати продаж тільки по своєму клієнту.");
    }
    const client = byId(state.clients, data.clientId);
    const product = byId(state.products, data.productId);
    if (!product) throw new Error("Товар не знайдено.");
    const qty = Number(data.qty || 0);
    const serialIds = product.type === "weapon" ? selectedValues(form.elements.serialIds) : [];
    const validation = validateB2BClientSale(data, product, client, serialIds, options);
    if (validation) throw new Error(validation);

    const price = parseDecimal(data.price || productSalePrice(product, client.priceType).amount, product.price || 0);
    const total = Math.round(qty * price * 100) / 100;
    const warehouse = clientResponsibleWarehouse(client.id);
    const invoice = {
      id: `inv-${String(Date.now()).slice(-8)}`,
      date: data.date || today,
      documentType: "Звіт реалізації B2B / перехід власності",
      contract: data.reportSource || "B2B відповідальне зберігання",
      warehouseId: warehouse.id,
      firmId: data.firmId || "vat",
      channel: "B2B відповідальне зберігання",
      clientId: client.id,
      manager: data.manager || state.currentManager,
      priceType: priceTypeById(client.priceType)?.id || "b2b",
      currency: data.currency || product.currency || "UAH",
      total,
      paid: 0,
      discount: 0,
      dueDate: addDays(data.date || today, data.paymentDays || state.settings.defaultDueDays),
      cashArticle: "Продаж товарів",
      accounting: true,
      locked: false,
      status: "draft",
      responsibleStorage: true,
      paymentDays: Number(data.paymentDays || state.settings.defaultDueDays),
      lines: product.type === "weapon"
        ? serialIds.map((serialId) => ({ productId: product.id, qty: 1, price, serialId, previousSerialStatus: "responsible_storage", permitNumber: data.permitNumber || "", permitDate: data.permitDate || "" }))
        : [{ productId: product.id, qty, price, serialId: "", permitNumber: "", permitDate: "" }],
      delivery: "Склад клієнта",
      deliveryPayer: "Клієнт",
      ttn: "",
      comment: data.comment || ""
    };

    if (product.type === "weapon") {
      serialIds.forEach((serialId) => {
        const serial = byId(state.serials, serialId);
        serial.status = "sold";
        serial.permitNumber = data.permitNumber;
        serial.permitDate = data.permitDate;
        serial.ownershipTransferredAt = data.date || today;
      });
    } else {
      decrementStockWhere(product.id, qty, (row) => row.clientId === client.id && (row.firmId || "vat") === (data.firmId || "vat"), "Недостатньо залишку на складі цього B2B клієнта для вибраної фірми.");
    }

    state.invoices.unshift(invoice);
    applyResponsibleStorageSale(client.id, product.id, qty, serialIds, invoice.id, invoice.firmId);
    b2bDraft = { ...b2bDraft, saleClientId: client.id, saleProductId: product.id, saleFirmId: data.firmId || "vat", saleBarcode: product.barcode || "" };
    addAudit(`${options.clientPortal ? "B2B клієнт подав продаж" : "Проведено продаж клієнта зі зберігання"}: ${invoice.id} · ${client.name} · ${formatMoney(total, invoice.currency)}`, options.clientPortal ? "B2B кабінет" : state.currentManager);
    if (options.clientPortal) {
      clientPortalDraft = { productId: product.id, firmId: data.firmId || "", barcode: product.barcode || "", qty: 1, serialIds: [], permitNumber: "", permitDate: "" };
    }
    render();
  } catch (error) {
    alert(error.message);
  }
}

function rollbackResponsibleStorageSale(invoice) {
  if (!invoice?.responsibleStorage) return;
  const grouped = invoice.lines.reduce((acc, line) => {
    acc[line.productId] = (acc[line.productId] || 0) + Number(line.qty || 1);
    return acc;
  }, {});

  Object.entries(grouped).forEach(([productId, qty]) => {
    let remaining = qty;
    const docs = state.responsibleStorageDocs
      .filter((doc) => doc.clientId === invoice.clientId && doc.productId === productId && (doc.invoiceIds || []).includes(invoice.id))
      .filter((doc) => (doc.firmId || "vat") === (invoice.firmId || "vat"))
      .sort((first, second) => String(second.date).localeCompare(String(first.date)));
    for (const doc of docs) {
      const take = Math.min(Number(doc.soldQty || 0), remaining);
      doc.soldQty = Math.max(Number(doc.soldQty || 0) - take, 0);
      doc.invoiceIds = (doc.invoiceIds || []).filter((docInvoiceId) => docInvoiceId !== invoice.id);
      doc.status = responsibleDocStatus(doc);
      doc.ownership = doc.status === "ownership_transferred" ? "transferred_to_client" : "ours_until_client_sale";
      remaining -= take;
      if (remaining <= 0) break;
    }
  });
}

function rollbackStorageShipmentInvoice(invoice) {
  const docs = state.responsibleStorageDocs.filter((doc) => doc.invoiceDraftId === invoice.id);
  if (docs.some((doc) => Number(doc.soldQty || 0) > 0)) {
    throw new Error("Не можна скасувати відвантаження на відповідальне зберігання, бо клієнт уже подав продаж по цьому товару.");
  }
  docs.forEach((doc) => {
    const sourceWarehouseId = doc.sourceWarehouseId || invoice.warehouseId || invoice.sourceWarehouseId || "";
    const product = byId(state.products, doc.productId);
    if (product?.type === "weapon") {
      (doc.serialIds || []).forEach((serialId) => {
        const serial = byId(state.serials, serialId);
        if (!serial) return;
        serial.status = "available";
        serial.clientId = "";
        serial.warehouseId = sourceWarehouseId || serial.warehouseId;
        serial.responsibleStorageDocId = "";
      });
    } else {
      decrementStockWhere(doc.productId, doc.qty, (row) => (
        row.warehouseId === doc.warehouseId
        && (row.clientId || "") === doc.clientId
        && (row.firmId || "vat") === (doc.firmId || "vat")
      ), "Недостатньо залишку на складі клієнта для скасування відвантаження.");
      incrementStock(doc.productId, sourceWarehouseId, doc.qty, "", doc.firmId || "vat");
    }
  });
  state.responsibleStorageDocs = state.responsibleStorageDocs.filter((doc) => doc.invoiceDraftId !== invoice.id);
}

function cancelInvoice(id) {
  const invoice = byId(state.invoices, id);
  if (!invoice || invoice.status === "cancelled") return;
  if (invoice.posted === false) {
    if (!confirm(`Скасувати чернетку накладної ${invoice.id}? Рух складу не змінюватиметься, бо документ ще не проведений.`)) return;
    invoice.status = "cancelled";
    invoice.locked = true;
    addAudit(`Скасовано чернетку накладної ${invoice.id}`);
    render();
    return;
  }
  if (invoice.storageShipment) {
    if (documentEditLocked("responsibleShipment", invoice)) return alert("Відвантаження заблоковане. Для скасування потрібне право зміни проведеного документа.");
    if (!confirm(`Скасувати відвантаження на відповідальне зберігання ${invoice.id} і повернути товар на наш склад?`)) return;
    try {
      rollbackStorageShipmentInvoice(invoice);
      invoice.status = "cancelled";
      invoice.locked = true;
      invoice.paid = 0;
      addAudit(`Скасовано відвантаження на відповідальне зберігання ${invoice.id}, товар повернено на наш склад`);
      render();
    } catch (error) {
      alert(error.message);
    }
    return;
  }
  if (documentEditLocked(invoicePostedPermissionKey(invoice), invoice)) return alert("Накладна заблокована. Для скасування потрібне право зміни цього виду проведеного документа.");
  if (!confirm(`Скасувати накладну ${invoice.id} і повернути її серійні номери/залишки на склад?`)) return;

  rollbackResponsibleStorageSale(invoice);
  invoice.lines.forEach((line) => {
    const product = byId(state.products, line.productId);
    if (line.serialId) {
      const serial = byId(state.serials, line.serialId);
      if (serial) {
        if (invoice.responsibleStorage) {
          serial.status = "responsible_storage";
          serial.clientId = invoice.clientId;
          serial.warehouseId = invoice.warehouseId || serial.warehouseId;
        } else {
          serial.status = line.previousSerialStatus || "available";
          if (serial.clientId === invoice.clientId) serial.clientId = "";
        }
        if (serial.permitNumber === line.permitNumber) serial.permitNumber = "";
        if (serial.permitDate === line.permitDate) serial.permitDate = "";
      }
    } else if (product?.type !== "weapon") {
      if (invoice.responsibleStorage) {
        incrementStock(line.productId, invoice.warehouseId || clientResponsibleWarehouse(invoice.clientId).id, line.qty || 0, invoice.clientId, invoice.firmId || "vat");
      } else {
        incrementStock(line.productId, invoice.warehouseId || "wh-main", line.qty || 0, "", invoice.firmId || "vat");
      }
    }
  });

  invoice.status = "cancelled";
  invoice.locked = true;
  invoice.paid = 0;
  addAudit(`Скасовано накладну ${invoice.id}, серії/залишки повернено`);
  render();
}

function decrementStock(productId, qty, warehouseId = "", firmId = "", clientId = "") {
  decrementStockWhere(
    productId,
    qty,
    (row) => stockRowMatches(row, { warehouseId, firmId, clientId }),
    stockContextMessage(productId, qty, warehouseId, firmId)
  );
}

function incrementStock(productId, warehouseId, qty, clientId = "", firmId = "vat") {
  let row = state.stock.find((item) => item.productId === productId && item.warehouseId === warehouseId && (item.clientId || "") === clientId && (item.firmId || "vat") === firmId);
  if (!row) {
    row = { productId, warehouseId, qty: 0, firmId };
    if (clientId) row.clientId = clientId;
    state.stock.push(row);
  }
  row.qty += Number(qty || 0);
}

function parseSerialLines(text) {
  return String(text || "")
    .split(/[\n,;]+/)
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
}

function duplicateValues(values) {
  const seen = new Set();
  const duplicates = new Set();
  values.forEach((value) => {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  });
  return [...duplicates];
}

function validateWeaponRequisites(product) {
  const missing = [];
  if (!product.model) missing.push("модель");
  if (!product.caliber) missing.push("калібр");
  if (!product.brand) missing.push("бренд");
  if (!product.barcode) missing.push("QR/штрихкод");
  if (!product.supplierSku) missing.push("артикул постачальника");
  if (!product.internalCode) missing.push("внутрішній код");
  if (!product.uktzed) missing.push("УКТЗЕД");
  return missing;
}

function buildPurchase(raw, source = "manual") {
  const product = byId(state.products, raw.productId);
  if (!product) throw new Error("Позиція приходу не знайдена.");
  const qty = Number(raw.qty || 0);
  if (qty <= 0) throw new Error("Кількість приходу має бути більшою за нуль.");
  const supplier = resolveSupplier(raw);
  if (!raw.supplierDoc) throw new Error("Вкажіть документ постачальника.");
  if (!raw.warehouseId) throw new Error("Вкажіть склад приходу.");
  const scannedCode = String(raw.barcode || raw.qrCode || "").trim();
  if (!scannedCode && !product.barcode && !product.qrCode) throw new Error("QR або штрихкод обов'язковий у приході або картці товару.");
  if (scannedCode && state.products.some((item) => item.id !== product.id && item.barcode && String(item.barcode).trim().toLowerCase() === scannedCode.toLowerCase())) {
    throw new Error("Такий QR/штрихкод уже прив'язаний до іншого товару.");
  }
  if (scannedCode && product.barcode && scannedCode.toLowerCase() !== String(product.barcode).trim().toLowerCase()) {
    throw new Error(`QR/штрихкод приходу не відповідає вибраній позиції ${product.brand} ${product.model}.`);
  }

  const serials = Array.isArray(raw.serials) ? raw.serials.map((item) => String(item).trim().toUpperCase()).filter(Boolean) : parseSerialLines(raw.serials);
  if (product.type === "weapon") {
    const missing = validateWeaponRequisites(product);
    if (missing.length) throw new Error(`У картці зброї не заповнено: ${missing.join(", ")}.`);
    if (serials.length !== qty) throw new Error(`Для зброї кількість серій (${serials.length}) має дорівнювати кількості приходу (${qty}).`);
    const duplicates = duplicateValues(serials);
    if (duplicates.length) throw new Error(`Дублювання серій у документі: ${duplicates.join(", ")}.`);
    const existing = serials.filter((serial) => state.serials.some((item) => item.serial.toUpperCase() === serial));
    if (existing.length) throw new Error(`Такі серії вже існують у CRM: ${existing.join(", ")}.`);
  }

  return {
    id: raw.id || uniqueId("pin"),
    date: raw.date || today,
    documentType: raw.documentType || (source === "bas" ? "Імпорт BAS/BAF" : "Прибуткова накладна"),
    supplier,
    supplierDoc: raw.supplierDoc,
    firmId: raw.firmId || "vat",
    warehouseId: raw.warehouseId,
    productId: product.id,
    productType: product.type,
    qty,
    cost: Number(raw.cost || product.cost || 0),
    currency: raw.currency || product.costCurrency || "UAH",
    barcode: scannedCode || product.barcode || product.qrCode,
    serials: product.type === "weapon" ? serials : [],
    accounting: raw.accounting !== false && raw.accounting !== "false",
    basStatus: source === "bas" ? "imported" : (raw.accounting === false || raw.accounting === "false" ? "management" : "pending_export"),
    comment: raw.comment || ""
  };
}

function applyPurchase(purchase, options = {}) {
  const product = byId(state.products, purchase.productId);
  product.cost = purchase.cost;
  product.costCurrency = purchase.currency;
  if (!product.barcode && purchase.barcode) {
    product.barcode = purchase.barcode;
  }

  if (product.type === "weapon") {
    purchase.serials.forEach((serial, index) => {
      state.serials.unshift({
        id: uniqueId(`s-${index}`),
        productId: product.id,
        serial,
        warehouseId: purchase.warehouseId,
        firmId: purchase.firmId || "vat",
        status: "available",
        erzStatus: options.erzStatus || "pending",
        actual: options.actual !== false,
        basSynced: purchase.basStatus === "imported" || purchase.basStatus === "exported",
        purchaseId: purchase.id,
        clientId: "",
        permitNumber: "",
        permitDate: ""
      });
    });
  } else {
    incrementStock(product.id, purchase.warehouseId, purchase.qty, "", purchase.firmId || "vat");
  }

  state.purchases.unshift(purchase);
}

function createPurchase(form) {
  if (!canCreateDocument("purchase")) return alert("Поточна роль не має права створювати прихід.");
  try {
    const data = formData(form);
    const draftLines = collectPurchaseLinesFromForm(form);
    if (!draftLines.length) throw new Error("Додайте хоча б один товар у прихід.");
    const allSerials = draftLines.flatMap((line) => parseSerialLines(line.serials));
    const duplicatedSerials = duplicateValues(allSerials);
    if (duplicatedSerials.length) throw new Error(`Дублювання серій у документі приходу: ${duplicatedSerials.join(", ")}.`);
    const purchases = draftLines.map((line, index) => {
      try {
        return {
          purchase: buildPurchase({ ...data, ...line }, "manual"),
          options: {
            erzStatus: line.erzStatus,
            actual: line.actual === "true"
          }
        };
      } catch (error) {
        throw new Error(`Рядок ${index + 1}: ${error.message}`);
      }
    });
    purchases.forEach(({ purchase, options }) => applyPurchase(purchase, options));
    const totalQty = purchases.reduce((sum, item) => sum + Number(item.purchase.qty || 0), 0);
    addAudit(`Проведено прихід ${data.supplierDoc || purchases[0]?.purchase.id}: ${purchases.length} позицій · ${totalQty} од.`);
    purchaseDraft = { ...purchaseDraft, lines: [defaultPurchaseLine()] };
    render();
  } catch (error) {
    alert(error.message);
  }
}

function editPurchaseDocument(id) {
  const purchase = byId(state.purchases, id);
  if (!purchase) return;
  if (!canEditPostedDocument("purchase")) return alert("Поточна роль не має права змінювати проведені приходи.");
  openModal(`Зміна приходу ${purchase.id}`, `
    <form class="form-grid" data-action="update-purchase">
      <input type="hidden" name="id" value="${escapeHtml(purchase.id)}">
      <label class="field"><span>Дата</span><input name="date" type="date" value="${escapeHtml(purchase.date)}"></label>
      <label class="field"><span>Тип документа</span><select name="documentType">${variantOptions("purchaseDocumentTypes", purchase.documentType)}</select></label>
      <label class="field"><span>Фірма</span><select name="firmId">${state.settings.firms.map((firm) => option(firm.id, firm.name, firm.id === purchase.firmId)).join("")}</select></label>
      <label class="field"><span>Склад</span><select name="warehouseId">${state.warehouses.map((warehouse) => option(warehouse.id, warehouse.name, warehouse.id === purchase.warehouseId)).join("")}</select></label>
      <label class="field wide"><span>Постачальник</span><input name="supplier" value="${escapeHtml(purchase.supplier || "")}"></label>
      <label class="field"><span>Документ постач.</span><input name="supplierDoc" value="${escapeHtml(purchase.supplierDoc || "")}"></label>
      <label class="field"><span>Ціна приходу</span><input name="cost" inputmode="decimal" value="${escapeHtml(purchase.cost)}"></label>
      <label class="field"><span>Валюта</span><select name="currency">${Object.keys(state.settings.rates).map((currency) => option(currency, currency, currency === purchase.currency)).join("")}</select></label>
      <label class="field"><span>BAS/BAF</span><select name="accounting">${option("true", "Позначити для BAS/BAF", purchase.accounting === true)}${option("false", "Не передавати", purchase.accounting !== true)}</select></label>
      <label class="field"><span>Статус BAS</span><select name="basStatus">${["pending_export", "exported", "imported", "management"].map((status) => option(status, MARKETPLACE_ORDER_STATUS_MAP[status]?.label || status, status === purchase.basStatus)).join("")}</select></label>
      <label class="field full"><span>Коментар</span><textarea name="comment">${escapeHtml(purchase.comment || "")}</textarea></label>
      <p class="notice warn small full">Позиція, кількість і серії змінюються тільки коригуванням, щоб зберегти унікальність серій та складський рух.</p>
      <button class="primary" type="submit">Зберегти зміни приходу</button>
    </form>
  `);
}

function updatePurchaseDocument(form) {
  const data = formData(form);
  const purchase = byId(state.purchases, data.id);
  if (!purchase) return alert("Прихід не знайдено.");
  if (!canEditPostedDocument("purchase")) return alert("Поточна роль не має права змінювати проведені приходи.");
  const product = byId(state.products, purchase.productId);
  const oldWarehouseId = purchase.warehouseId;
  const newWarehouseId = data.warehouseId || oldWarehouseId;
  const oldFirmId = purchase.firmId || "vat";
  const newFirmId = data.firmId || oldFirmId;
  if (oldWarehouseId !== newWarehouseId || oldFirmId !== newFirmId) {
    if (product?.type === "weapon") {
      state.serials.filter((serial) => serial.purchaseId === purchase.id).forEach((serial) => {
        serial.warehouseId = newWarehouseId;
        serial.firmId = newFirmId;
      });
    } else {
      const oldRow = state.stock.find((row) => row.productId === purchase.productId && row.warehouseId === oldWarehouseId && !row.clientId && (row.firmId || "vat") === oldFirmId);
      if (!oldRow || Number(oldRow.qty || 0) < Number(purchase.qty || 0)) {
        return alert("Неможливо змінити фірму або склад приходу: частина товару вже списана або переміщена. Зробіть коригувальний документ.");
      }
      oldRow.qty -= Number(purchase.qty || 0);
      incrementStock(purchase.productId, newWarehouseId, purchase.qty, "", newFirmId);
    }
  }
  purchase.date = data.date || purchase.date;
  purchase.documentType = data.documentType;
  purchase.firmId = newFirmId;
  purchase.warehouseId = newWarehouseId;
  purchase.supplier = data.supplier;
  purchase.supplierDoc = data.supplierDoc;
  purchase.cost = parseDecimal(data.cost, purchase.cost);
  purchase.currency = data.currency;
  purchase.accounting = data.accounting === "true";
  purchase.basStatus = data.basStatus;
  purchase.comment = data.comment;
  if (product) {
    product.cost = purchase.cost;
    product.costCurrency = purchase.currency;
  }
  addAudit(`Змінено проведений прихід ${purchase.id}`);
  document.querySelector(".modal-backdrop")?.remove();
  render();
}

function createProduct(form) {
  if (!canCreateDocument("productCard")) return alert("Поточна роль не має права створювати картку товару.");
  try {
    const data = formData(form);
    const barcode = String(data.barcode || "").trim();
    if (!barcode) throw new Error("QR або штрихкод обов'язковий для створення товару.");
    if (state.products.some((product) => product.barcode && String(product.barcode).trim().toLowerCase() === barcode.toLowerCase())) {
      throw new Error("Такий QR/штрихкод уже використовується в іншому товарі.");
    }

    const type = data.type;
    let caliber = resolveDictionaryValue("calibers", data.caliberValue, data.newCaliber, "Калібр", { required: type === "weapon" });
    if (type === "weapon" && (!caliber || caliber === "без калібру")) {
      throw new Error("Для товару типу “Зброя” потрібно вказати калібр.");
    }
    if (type !== "weapon" && caliber === "без калібру") caliber = "";
    const internalCode = resolveDictionaryValue("internalCodes", data.internalCodeValue, data.newInternalCode, "Внутрішній код");
    if (state.products.some((product) => normalizedText(product.internalCode) === normalizedText(internalCode))) {
      throw new Error("Такий внутрішній код уже використовується в іншій картці товару. Для нової моделі створіть новий внутрішній код.");
    }

    const product = {
      id: `p-${String(Date.now()).slice(-6)}`,
      type,
      model: resolveDictionaryValue("models", data.modelValue, data.newModel, "Модель"),
      caliber,
      brand: resolveDictionaryValue("brands", data.brandValue, data.newBrand, "Бренд"),
      category: resolveDictionaryValue("categories", data.categoryValue, data.newCategory, "Категорія"),
      unit: resolveDictionaryValue("units", data.unitValue, data.newUnit, "Одиниця"),
      erzRequired: data.erzRequired === "true",
      barcode,
      supplierSku: resolveDictionaryValue("supplierSkus", data.supplierSkuValue, data.newSupplierSku, "Артикул постачальника"),
      internalCode,
      uktzed: resolveDictionaryValue("uktzed", data.uktzedValue, data.newUktzed, "УКТЗЕД"),
      price: Number(data.price || 0),
      currency: data.currency,
      cost: Number(data.cost || 0),
      costCurrency: data.costCurrency,
      minStock: Number(data.minStock || 0),
      leadTimeDays: Number(data.leadTimeDays || 0),
      marketplaceSku: data.marketplaceSku,
      description: data.description,
      photos: clone(productImagesDraft)
    };
    state.products.unshift(product);
    if (product.type === "regular") {
      state.stock.unshift({ productId: product.id, warehouseId: "wh-main", qty: 0 });
    }
    productImagesDraft = [];
    addAudit(`Додано товар ${product.brand} ${product.model}`);
    render();
  } catch (error) {
    alert(error.message);
  }
}

function createClient(form) {
  if (!canCreateDocument("clientCard")) return alert("Поточна роль не має права створювати клієнта.");
  const data = formData(form);
  state.clients.unshift({
    id: `c-${String(Date.now()).slice(-6)}`,
    name: data.name,
    type: data.type,
    edrpou: data.edrpou,
    phone: data.phone,
    email: data.email,
    manager: data.manager,
    paymentTerms: data.paymentTerms,
    creditLimitUAH: Number(data.creditLimitUAH || 0),
    currency: data.currency,
    priceType: data.priceType,
    taxMode: data.taxMode,
    cabinetEnabled: data.cabinetEnabled === "true",
    responsibleStorage: data.responsibleStorage === "true",
    address: data.address
  });
  addAudit(`Додано клієнта ${data.name}`);
  render();
}

function productPayloadFromForm(data, existingId = "") {
  const existingProduct = existingId ? byId(state.products, existingId) : {};
  const barcode = String(data.barcode || "").trim();
  if (!barcode) throw new Error("QR або штрихкод обов'язковий для картки товару.");
  if (state.products.some((product) => product.id !== existingId && product.barcode && String(product.barcode).trim().toLowerCase() === barcode.toLowerCase())) {
    throw new Error("Такий QR/штрихкод уже використовується в іншому товарі.");
  }

  const type = data.type;
  let caliber = resolveDictionaryValue("calibers", data.caliberValue, data.newCaliber, "Калібр", { required: type === "weapon" });
  if (type === "weapon" && (!caliber || caliber === "без калібру")) {
    throw new Error("Для товару типу “Зброя” потрібно вказати калібр.");
  }
  if (type !== "weapon" && caliber === "без калібру") caliber = "";

  const internalCode = resolveDictionaryValue("internalCodes", data.internalCodeValue, data.newInternalCode, "Внутрішній код");
  if (state.products.some((product) => product.id !== existingId && normalizedText(product.internalCode) === normalizedText(internalCode))) {
    throw new Error("Такий внутрішній код уже використовується в іншій картці товару.");
  }
  const prices = collectProductPrices(data, existingProduct);
  const retail = prices.retail || Object.values(prices)[0] || { amount: 0, currency: "UAH" };

  return {
    type,
    model: resolveDictionaryValue("models", data.modelValue, data.newModel, "Модель"),
    caliber,
    brand: resolveDictionaryValue("brands", data.brandValue, data.newBrand, "Бренд"),
    category: resolveDictionaryValue("categories", data.categoryValue, data.newCategory, "Категорія"),
    unit: resolveDictionaryValue("units", data.unitValue, data.newUnit, "Одиниця"),
    erzRequired: data.erzRequired === "true",
    barcode,
    supplierSku: resolveDictionaryValue("supplierSkus", data.supplierSkuValue, data.newSupplierSku, "Артикул постачальника"),
    internalCode,
    uktzed: resolveDictionaryValue("uktzed", data.uktzedValue, data.newUktzed, "УКТЗЕД"),
    price: parseDecimal(retail.amount, 0),
    currency: retail.currency || "UAH",
    prices,
    cost: data.cost === undefined ? parseDecimal(existingProduct.cost, 0) : parseDecimal(data.cost, 0),
    costCurrency: data.costCurrency || existingProduct.costCurrency || "UAH",
    minStock: Number(data.minStock || 0),
    leadTimeDays: Number(data.leadTimeDays || 0),
    marketplaceSku: data.marketplaceSku,
    catalogTag: data.catalogTag || "",
    description: data.description,
    photos: clone(productImagesDraft)
  };
}

function ensureRegularProductStock(product) {
  if (product.type !== "regular") return;
  if (!state.stock.some((row) => row.productId === product.id)) {
    state.stock.unshift({ productId: product.id, warehouseId: "wh-main", qty: 0 });
  }
}

function createProductCard(form) {
  if (!canCreateDocument("productCard")) return alert("Поточна роль не має права створювати картку товару.");
  if (!canEditField("productRequisites")) return alert("Поточна роль не має права заповнювати реквізити товару.");
  try {
    const product = {
      id: `p-${String(Date.now()).slice(-6)}`,
      ...productPayloadFromForm(formData(form))
    };
    state.products.unshift(product);
    ensureRegularProductStock(product);
    seedProductDictionaries(state);
    syncCatalogParametersFromProducts(state);
    productImagesDraft = [];
    addAudit(`Додано товар ${product.brand} ${product.model}`);
    render();
  } catch (error) {
    alert(error.message);
  }
}

function productEditorForm(product) {
  return `
    <form class="form-grid" data-action="update-product">
      <input type="hidden" name="id" value="${escapeHtml(product.id)}">
      <label class="field"><span>Тип</span><select name="type">${option("regular", "Звичайний товар", product.type === "regular")}${option("weapon", "Зброя", product.type === "weapon")}</select></label>
      ${dictionaryField("categories", "Категорія", "categoryValue", "newCategory", { selected: product.category || "", placeholder: "нова категорія / група" })}
      ${dictionaryField("units", "Одиниця", "unitValue", "newUnit", { selected: product.unit || "", placeholder: "нова одиниця виміру" })}
      ${dictionaryField("brands", "Бренд", "brandValue", "newBrand", { selected: product.brand || "", placeholder: "новий бренд" })}
      ${dictionaryField("models", "Модель", "modelValue", "newModel", { selected: product.model || "", wide: true, placeholder: "нова модель" })}
      ${dictionaryField("calibers", "Калібр", "caliberValue", "newCaliber", { selected: product.caliber || "без калібру", required: false, placeholder: "новий калібр для зброї" })}
      <label class="field"><span>ЄРЗ</span><select name="erzRequired">${option("false", "ні", !product.erzRequired)}${option("true", "так", product.erzRequired)}</select></label>
      <div class="field wide">
        <span>Штрих / QR</span>
        <div class="input-action">
          <input name="barcode" data-product-barcode required value="${escapeHtml(product.barcode || "")}" placeholder="скануйте або створіть код">
          <button class="ghost" type="button" data-generate-product-barcode>Створити</button>
        </div>
      </div>
      ${dictionaryField("supplierSkus", "Артикул постач.", "supplierSkuValue", "newSupplierSku", { selected: product.supplierSku || "", placeholder: "новий артикул постачальника" })}
      ${dictionaryField("internalCodes", "Внутр. код", "internalCodeValue", "newInternalCode", { selected: product.internalCode || "", placeholder: "новий внутрішній код" })}
      ${dictionaryField("uktzed", "УКТЗЕД", "uktzedValue", "newUktzed", { selected: product.uktzed || "", placeholder: "новий код УКТЗЕД" })}
      <label class="field"><span>Прихідна</span><input name="cost" data-field-lock="cost" value="${escapeHtml(product.cost || 0)}"></label>
      <label class="field"><span>Валюта приходу</span><select name="costCurrency" data-field-lock="cost">${Object.keys(state.settings.rates).map((currency) => option(currency, currency, currency === product.costCurrency)).join("")}</select></label>
      ${productPriceInputs(product)}
      <label class="field"><span>Мін. залишок</span><input name="minStock" type="number" min="0" value="${escapeHtml(product.minStock || 0)}"></label>
      <label class="field"><span>Поставка, днів</span><input name="leadTimeDays" type="number" min="0" value="${escapeHtml(product.leadTimeDays || 0)}"></label>
      <label class="field wide"><span>SKU маркетплейсу</span><input name="marketplaceSku" value="${escapeHtml(product.marketplaceSku || "")}" placeholder="Rozetka/Prom/Epicentr/Allo"></label>
      <label class="field"><span>Каталог / акція</span><select name="catalogTag">${catalogTagOptions(product.catalogTag || "")}</select></label>
      <label class="field full"><span>Опис / характеристики</span><textarea name="description">${escapeHtml(product.description || "")}</textarea></label>
      <div class="field full">
        <span>Фото товару</span>
        <input type="file" name="photos" data-product-photos accept="${MARKETPLACE_IMAGE_EXTENSIONS}" multiple>
        <p class="notice small">До 6 фото з комп'ютера. Дозволені формати: JPG/JPEG або PNG.</p>
      </div>
      <div class="photo-preview full" data-product-photo-preview></div>
      <button class="primary" type="submit">Зберегти картку товару</button>
    </form>
  `;
}

function openProductCard(id) {
  const product = byId(state.products, id);
  if (!product) return;
  productImagesDraft = clone(product.photos || []);
  const qty = product.type === "weapon"
    ? state.serials.filter((serial) => serial.productId === product.id && serial.status !== "sold").length
    : state.stock.filter((row) => row.productId === product.id).reduce((sum, row) => sum + Number(row.qty || 0), 0);
  const modal = openModal(`Картка товару · ${product.brand} ${product.model}`, `
    <section class="grid three compact-metrics">
      <article class="card metric info"><span>ID</span><strong>${escapeHtml(product.internalCode || product.id)}</strong><small>${escapeHtml(product.supplierSku || "артикул не внесено")}</small></article>
      <article class="card metric good"><span>Залишок</span><strong>${qty}</strong><small>${product.type === "weapon" ? "серійні одиниці" : "кількісний облік"}</small></article>
      <article class="card metric warn"><span>Маркетплейси</span><strong>${state.marketplacePublications.filter((item) => item.productId === product.id).length}</strong><small>публікацій по SKU</small></article>
    </section>
    ${productEditorForm(product)}
  `);
  renderProductPhotoPreview(modal);
  if (!canCreateDocument("productEdit")) {
    setFormReadOnly(modal.querySelector('[data-action="update-product"]'), "Поточна роль може переглядати картку товару, але не може змінювати її реквізити.");
  } else if (!canEditField("productRequisites")) {
    setFormReadOnly(modal.querySelector('[data-action="update-product"]'), "Поточна роль не має права змінювати реквізити товару.");
  }
}

function updateProductCard(form) {
  if (!canCreateDocument("productEdit")) return alert("Поточна роль не має права змінювати картку товару.");
  if (!canEditField("productRequisites")) return alert("Поточна роль не має права змінювати реквізити товару.");
  try {
    const data = formData(form);
    const product = byId(state.products, data.id);
    if (!product) throw new Error("Товар не знайдено.");
    Object.assign(product, productPayloadFromForm(data, product.id));
    ensureRegularProductStock(product);
    seedProductDictionaries(state);
    syncCatalogParametersFromProducts(state);
    productImagesDraft = [];
    addAudit(`Оновлено картку товару ${product.brand} ${product.model}`);
    form.closest(".modal-backdrop")?.remove();
    render();
  } catch (error) {
    alert(error.message);
  }
}

function clientPayloadFromForm(data) {
  const name = String(data.name || "").trim();
  if (!name) throw new Error("Вкажіть назву клієнта.");
  return {
    name,
    type: data.type,
    edrpou: data.edrpou,
    phone: data.phone,
    email: data.email,
    manager: data.manager,
    paymentTerms: data.paymentTerms,
    creditLimitUAH: Number(data.creditLimitUAH || 0),
    currency: data.currency,
    priceType: data.priceType,
    taxMode: data.taxMode,
    cabinetEnabled: data.cabinetEnabled === "true",
    portalLogin: String(data.portalLogin || "").trim(),
    portalPassword: String(data.portalPassword || "").trim(),
    responsibleStorage: data.responsibleStorage === "true",
    address: data.address
  };
}

function ensureClientPortalLoginUnique(login, excludeClientId = "") {
  const normalized = String(login || "").trim().toLowerCase();
  if (!normalized) return;
  if (state.clients.some((client) => client.id !== excludeClientId && String(client.portalLogin || "").trim().toLowerCase() === normalized)) {
    throw new Error("Такий логін B2B кабінету вже використовується іншим клієнтом.");
  }
}

function createClientCard(form) {
  if (!canCreateDocument("clientCard")) return alert("Поточна роль не має права створювати клієнта.");
  if (!canEditField("clientRequisites")) return alert("Поточна роль не має права заповнювати реквізити клієнта.");
  try {
    const data = clientPayloadFromForm(formData(form));
    const id = `c-${String(Date.now()).slice(-6)}`;
    data.portalLogin = data.portalLogin || defaultClientLogin({ ...data, id }, state.clients.length);
    data.portalPassword = data.portalPassword || "1234";
    ensureClientPortalLoginUnique(data.portalLogin);
    state.clients.unshift({ id, ...data });
    addAudit(`Додано клієнта ${data.name}`);
    render();
  } catch (error) {
    alert(error.message);
  }
}

function clientEditorForm(client) {
  return `
    <form class="form-grid" data-action="update-client">
      <input type="hidden" name="id" value="${escapeHtml(client.id)}">
      <label class="field wide"><span>Назва</span><input name="name" required value="${escapeHtml(client.name || "")}"></label>
      <label class="field"><span>Тип</span><select name="type">${variantOptions("clientTypes", client.type)}</select></label>
      <label class="field"><span>ЄДРПОУ / ІПН</span><input name="edrpou" value="${escapeHtml(client.edrpou || "")}"></label>
      <label class="field"><span>Телефон</span><input name="phone" value="${escapeHtml(client.phone || "")}"></label>
      <label class="field"><span>Email</span><input name="email" type="email" value="${escapeHtml(client.email || "")}"></label>
      <label class="field"><span>Менеджер</span><select name="manager">${employeeOptions(client.manager)}</select></label>
      <label class="field"><span>Умови оплат</span><select name="paymentTerms">${variantOptions("paymentTerms", client.paymentTerms)}</select></label>
      <label class="field"><span>Кредитний ліміт</span><input name="creditLimitUAH" value="${escapeHtml(client.creditLimitUAH || 0)}"></label>
      <label class="field"><span>Валюта</span><select name="currency">${Object.keys(state.settings.rates).map((currency) => option(currency, currency, currency === (client.currency || "UAH"))).join("")}</select></label>
      <label class="field"><span>Прайс</span><select name="priceType">${priceTypeOptions(client.priceType)}</select></label>
      <label class="field"><span>Податки</span><select name="taxMode">${variantOptions("taxModes", client.taxMode)}</select></label>
      <label class="field"><span>Кабінет</span><select name="cabinetEnabled">${option("true", "увімкнути", client.cabinetEnabled === true)}${option("false", "не створювати", client.cabinetEnabled !== true)}</select></label>
      <label class="field"><span>Логін кабінету</span><input name="portalLogin" value="${escapeHtml(client.portalLogin || "")}"></label>
      <label class="field"><span>Пароль кабінету</span><input name="portalPassword" type="text" value="${escapeHtml(client.portalPassword || "")}"></label>
      <label class="field"><span>Відп. зберігання</span><select name="responsibleStorage">${option("true", "так", client.responsibleStorage === true)}${option("false", "ні", client.responsibleStorage !== true)}</select></label>
      <label class="field full"><span>Адреса / доставка</span><textarea name="address">${escapeHtml(client.address || "")}</textarea></label>
      <button class="primary" type="submit">Зберегти картку клієнта</button>
    </form>
  `;
}

function openClientCard(id) {
  const client = byId(state.clients, id);
  if (!client) return;
  const invoices = state.invoices.filter((invoice) => invoice.clientId === client.id && isDebtInvoice(invoice));
  const debt = invoices.reduce((sum, invoice) => sum + Math.max(invoice.total - invoice.paid, 0), 0);
  const storageQty = clientStorageRows(client.id).reduce((sum, row) => sum + row.qty, 0);
  const modal = openModal(`Картка клієнта · ${client.name}`, `
    <section class="grid three compact-metrics">
      <article class="card metric info"><span>Дебіторка</span><strong>${formatMoney(debt, client.currency || "UAH")}</strong><small>${invoices.length} накладних</small></article>
      <article class="card metric good"><span>Відп. зберігання</span><strong>${storageQty}</strong><small>одиниць на складах клієнта</small></article>
      <article class="card metric warn"><span>Кабінет</span><strong>${client.cabinetEnabled ? "так" : "ні"}</strong><small>${client.responsibleStorage ? "є відповідальне зберігання" : "без зберігання"}</small></article>
    </section>
    ${clientEditorForm(client)}
  `);
  if (!canCreateDocument("clientEdit")) {
    setFormReadOnly(modal.querySelector('[data-action="update-client"]'), "Поточна роль може переглядати картку клієнта, але не може змінювати її реквізити.");
  } else if (!canEditField("clientRequisites")) {
    setFormReadOnly(modal.querySelector('[data-action="update-client"]'), "Поточна роль не має права змінювати реквізити клієнта.");
  }
}

function updateClientCard(form) {
  if (!canCreateDocument("clientEdit")) return alert("Поточна роль не має права змінювати картку клієнта.");
  if (!canEditField("clientRequisites")) return alert("Поточна роль не має права змінювати реквізити клієнта.");
  try {
    const data = formData(form);
    const client = byId(state.clients, data.id);
    if (!client) throw new Error("Клієнта не знайдено.");
    const payload = clientPayloadFromForm(data);
    payload.portalLogin = payload.portalLogin || defaultClientLogin({ ...payload, id: client.id }, 0);
    payload.portalPassword = payload.portalPassword || "1234";
    ensureClientPortalLoginUnique(payload.portalLogin, client.id);
    Object.assign(client, payload);
    state.warehouses
      .filter((warehouse) => warehouse.kind === "client_responsible" && warehouse.clientId === client.id)
      .forEach((warehouse) => {
        warehouse.name = `Склад клієнта · ${client.name}`;
      });
    addAudit(`Оновлено картку клієнта ${client.name}`);
    form.closest(".modal-backdrop")?.remove();
    render();
  } catch (error) {
    alert(error.message);
  }
}

function createEmployee(form) {
  if (!isAdmin()) return alert("Працівників може додавати тільки адміністратор.");
  const data = formData(form);
  const login = String(data.login || "").trim();
  if (!login || !data.password) return alert("Вкажіть логін і пароль працівника.");
  if (state.employees.some((employee) => String(employee.login || "").trim().toLowerCase() === login.toLowerCase())) {
    return alert("Такий логін уже використовується іншим працівником.");
  }
  state.employees.unshift({
    id: `emp-${String(Date.now()).slice(-6)}`,
    name: data.name,
    roleName: data.roleName,
    department: data.department,
    phone: data.phone,
    email: data.email,
    login,
    password: data.password,
    active: true
  });
  state.managers = state.employees.filter((employee) => employee.active).map((employee) => employee.name);
  addAudit(`Додано працівника ${data.name} з роллю ${data.roleName}`);
  render();
}

function rowToForm(row) {
  const form = document.createElement("form");
  $$("input, select, textarea", row).forEach((element) => {
    if (!element.name) return;
    const input = document.createElement("input");
    input.name = element.name;
    input.value = element.value;
    form.appendChild(input);
  });
  return form;
}

function saveEmployee(id) {
  if (!isAdmin()) return alert("Дані працівників може змінювати тільки адміністратор.");
  const row = document.querySelector(`[data-employee-row="${CSS.escape(id)}"]`);
  const employee = byId(state.employees, id);
  if (!row || !employee) return;
  const data = Object.fromEntries(new FormData(rowToForm(row)).entries());
  const login = String(data.login || "").trim();
  if (!login || !data.password) return alert("Логін і пароль працівника обов'язкові.");
  if (state.employees.some((item) => item.id !== id && String(item.login || "").trim().toLowerCase() === login.toLowerCase())) {
    return alert("Такий логін уже використовується іншим працівником.");
  }
  employee.name = data.name;
  employee.department = data.department;
  employee.phone = data.phone;
  employee.email = data.email;
  employee.login = login;
  employee.password = data.password;
  employee.roleName = data.roleName;
  employee.active = data.active === "true";
  if (employee.id === state.currentEmployeeId) {
    state.currentManager = employee.name;
    state.currentRole = employee.roleName;
  }
  state.managers = state.employees.filter((item) => item.active).map((item) => item.name);
  addAudit(`Оновлено працівника ${employee.name}`);
  render();
}

function updateRolePermission(target) {
  if (!isAdmin()) {
    alert("Права ролей може змінювати тільки адміністратор.");
    render();
    return;
  }
  const roleItem = state.roles.find((item) => item.name === target.dataset.roleName);
  if (!roleItem) return;
  const group = target.dataset.roleGroup;
  const key = target.dataset.rolePermission;
  if (roleItem.name === state.currentRole && group === "basic" && key === "canManageUsers" && !target.checked) {
    alert("Не можна забрати права адміністратора у поточної активної ролі. Спочатку увійдіть під іншим адміністратором.");
    render();
    return;
  }
  if (group === "basic") {
    roleItem[key] = target.checked;
  } else {
    roleItem.access = roleItem.access || { views: {}, documents: {}, posted: {}, fields: {} };
    roleItem.access[group] = roleItem.access[group] || {};
    roleItem.access[group][key] = target.checked;
  }
  if (roleItem.name === state.currentRole && !canAccessView(state.currentView)) state.currentView = "dashboard";
  addAudit(`Оновлено право ролі ${roleItem.name}: ${key} = ${target.checked ? "так" : "ні"}`);
  render();
}

function createWarehouse(form) {
  if (!(role().canEditSettings || isAdmin())) return alert("Склади може змінювати тільки адміністратор.");
  const data = formData(form);
  state.warehouses.push({
    id: `wh-${String(Date.now()).slice(-6)}`,
    name: data.name,
    kind: data.kind
  });
  addAudit(`Додано склад ${data.name}`);
  render();
}

function createCashArticle(form) {
  if (!(role().canEditSettings || isAdmin())) return alert("Статті може змінювати тільки адміністратор.");
  const data = formData(form);
  if (!state.settings.cashArticles.includes(data.article)) {
    state.settings.cashArticles.push(data.article);
  }
  addVariantDictionaryEntry("cashArticles", data.article);
  addAudit(`Додано статтю коштів ${data.article}`);
  render();
}

function createExpenseArticle(form) {
  if (!(role().canEditSettings || isAdmin())) return alert("Статті може змінювати тільки адміністратор.");
  const data = formData(form);
  if (!state.settings.expenseArticles.includes(data.article)) {
    state.settings.expenseArticles.push(data.article);
  }
  addVariantDictionaryEntry("expenseArticles", data.article);
  addAudit(`Додано статтю витрат ${data.article}`);
  render();
}

function addVariantDictionaryEntry(key, name, value = "", parentName = "") {
  state.settings.variantDictionaries = state.settings.variantDictionaries || normalizeVariantDictionaries(state.settings);
  state.settings.variantDictionaries[key] = state.settings.variantDictionaries[key] || [];
  const entries = state.settings.variantDictionaries[key];
  const normalizedName = String(name || "").trim();
  if (!normalizedName) return null;
  let parentId = "";
  const normalizedParent = String(parentName || "").trim();
  if (normalizedParent) {
    let parent = entries.find((entry) => !entry.parentId && entry.name.toLowerCase() === normalizedParent.toLowerCase());
    if (!parent) {
      parent = normalizeVariantEntry({ id: uniqueId(key), name: normalizedParent, value: normalizedParent, parentId: "" }, key);
      entries.push(parent);
    }
    parentId = parent.id;
  }
  const entryValue = String(value || normalizedName).trim();
  const duplicate = entries.find((entry) => (
    (entry.parentId || "") === parentId
    && String(entry.value || entry.name).trim().toLowerCase() === entryValue.toLowerCase()
  ));
  if (duplicate) {
    duplicate.active = true;
    return duplicate;
  }
  const entry = normalizeVariantEntry({ id: uniqueId(key), name: normalizedName, value: entryValue, parentId }, key);
  entries.push(entry);
  syncLegacyVariantDictionaries();
  return entry;
}

function createVariantDictionaryItem(form) {
  if (!(role().canEditSettings || isAdmin())) return alert("Довідники може змінювати тільки адміністратор.");
  const data = formData(form);
  const definition = VARIANT_DICTIONARY_DEFINITIONS.find((item) => item.key === data.dictionaryKey);
  if (!definition) return alert("Оберіть довідник.");
  const entry = addVariantDictionaryEntry(definition.key, data.name, data.value, data.parentName);
  if (!entry) return alert("Вкажіть назву пункту довідника.");
  addAudit(`Додано пункт довідника ${definition.label}: ${variantLabel(definition.key, entry.value)}`);
  render();
}

function createCatalogParameter(form) {
  if (!(role().canEditSettings || isAdmin())) return alert("Параметри каталогу може змінювати тільки адміністратор.");
  const data = formData(form);
  const definition = CATALOG_PARAMETER_DEFINITIONS.find((item) => item.key === data.parameterKey);
  if (!definition) return alert("Оберіть каталог параметрів.");
  const name = String(data.name || "").trim();
  const value = String(data.value || name).trim();
  if (!name) return alert("Вкажіть назву параметра.");
  if (!value) return alert("Вкажіть значення параметра.");
  const entry = addCatalogParameterEntry(definition.key, name, value);
  if (!entry) return alert("Не вдалося додати параметр.");
  addAudit(`Додано параметр каталогу ${definition.label}: ${entry.name}`);
  render();
}

function createPaymentTerminal(form) {
  if (!(role().canEditSettings || isAdmin())) return alert("Платіжні термінали може змінювати тільки адміністратор.");
  const data = formData(form);
  const name = String(data.name || "").trim();
  if (!name) return alert("Вкажіть назву термінала.");
  if (!byId(state.settings.firms, data.firmId)) return alert("Оберіть фірму для термінала.");
  const duplicate = (state.settings.paymentTerminals || []).some((terminal) => (
    terminal.name.trim().toLowerCase() === name.toLowerCase() && terminal.firmId === data.firmId
  ));
  if (duplicate) return alert("Такий термінал уже є для вибраної фірми.");
  state.settings.paymentTerminals.push({
    id: uniqueId("term"),
    name,
    firmId: data.firmId,
    provider: String(data.provider || "").trim()
  });
  addAudit(`Додано платіжний термінал ${name} для ${firmName(data.firmId)}`);
  render();
}

function createPriceType(form) {
  if (!(role().canEditSettings || isAdmin())) return alert("Прайси може змінювати тільки адміністратор.");
  const data = formData(form);
  const name = String(data.name || "").trim();
  if (!name) return alert("Вкажіть назву прайса.");
  if (state.settings.priceTypes.some((item) => item.name.trim().toLowerCase() === name.toLowerCase())) {
    return alert("Такий прайс уже існує.");
  }
  const priceType = { id: slugId(name, "price"), name, kind: "sale", active: true, system: false };
  state.settings.priceTypes.push(priceType);
  state.products.forEach((product) => {
    product.prices = normalizeProductPrices(product, state.settings.priceTypes);
  });
  addAudit(`Додано прайс ${name}`);
  render();
}

function togglePriceType(id) {
  if (!(role().canEditSettings || isAdmin())) return alert("Прайси може змінювати тільки адміністратор.");
  const priceType = state.settings.priceTypes.find((item) => item.id === id);
  if (!priceType || priceType.kind === "cost") return;
  priceType.active = priceType.active === false;
  const activeSaleCount = state.settings.priceTypes.filter((item) => item.kind !== "cost" && item.active !== false).length;
  if (!activeSaleCount) {
    priceType.active = true;
    return alert("Має залишитись хоча б один активний прайс продажу.");
  }
  addAudit(`${priceType.active ? "Увімкнено" : "Вимкнено"} прайс ${priceType.name}`);
  render();
}

function createSerial(form) {
  if (!canCreateDocument("serialCorrection")) return alert("Поточна роль не має права змінювати серійний облік.");
  const data = formData(form);
  const normalized = data.serial.trim().toUpperCase();
  if (!normalized) return alert("Вкажіть серійний номер.");
  if (state.serials.some((serial) => serial.serial.toUpperCase() === normalized)) {
    return alert("Дублювання серійного номера заборонено.");
  }
  state.serials.unshift({
    id: `s-${String(Date.now()).slice(-6)}`,
    productId: data.productId,
    serial: normalized,
    warehouseId: data.warehouseId,
    status: data.status,
    erzStatus: data.erzStatus,
    actual: true,
    basSynced: false,
    purchaseId: "manual",
    clientId: data.clientId,
    permitNumber: "",
    permitDate: ""
  });
  addAudit(`Додано серійну одиницю ${normalized}`);
  render();
}

function editSerialDocument(id) {
  const serial = byId(state.serials, id);
  if (!serial) return;
  if (!canEditPostedDocument("serialCorrection")) return alert("Поточна роль не має права змінювати проведені серійні документи.");
  const weaponOptions = state.products
    .filter((product) => product.type === "weapon")
    .map((product) => option(product.id, `${product.brand} ${product.model}`, product.id === serial.productId))
    .join("");
  openModal(`Зміна серії ${serial.serial}`, `
    <form class="form-grid" data-action="update-serial">
      <input type="hidden" name="id" value="${escapeHtml(serial.id)}">
      <label class="field wide"><span>Модель зброї</span><select name="productId">${weaponOptions}</select></label>
      <label class="field"><span>Серійний номер</span><input name="serial" value="${escapeHtml(serial.serial)}" required></label>
      <label class="field"><span>Склад</span><select name="warehouseId">${state.warehouses.map((warehouse) => option(warehouse.id, warehouse.name, warehouse.id === serial.warehouseId)).join("")}</select></label>
      <label class="field"><span>Статус</span><select name="status">${["available", "responsible_storage", "sold"].map((status) => option(status, statusPill(status).replace(/<[^>]+>/g, ""), status === serial.status)).join("")}</select></label>
      <label class="field"><span>ЄРЗ</span><select name="erzStatus">${["pending", "verified"].map((status) => option(status, statusPill(status).replace(/<[^>]+>/g, ""), status === serial.erzStatus)).join("")}</select></label>
      <label class="field"><span>Актуальність</span><select name="actual">${option("true", "актуальна", serial.actual !== false)}${option("false", "неактуальна", serial.actual === false)}</select></label>
      <label class="field wide"><span>B2B клієнт</span><select name="clientId"><option value="">Немає</option>${state.clients.filter((client) => client.type === "B2B").map((client) => option(client.id, client.name, client.id === serial.clientId)).join("")}</select></label>
      <label class="field"><span>Номер дозволу</span><input name="permitNumber" value="${escapeHtml(serial.permitNumber || "")}"></label>
      <label class="field"><span>Дата дозволу</span><input name="permitDate" type="date" value="${escapeHtml(serial.permitDate || "")}"></label>
      <p class="notice warn small full">Зміна серії перевіряє унікальність номера. Для зброї на відповідальному зберіганні має бути вказаний B2B клієнт.</p>
      <button class="primary" type="submit">Зберегти серійний документ</button>
    </form>
  `);
}

function updateSerialDocument(form) {
  const data = formData(form);
  const serial = byId(state.serials, data.id);
  if (!serial) return alert("Серію не знайдено.");
  if (!canEditPostedDocument("serialCorrection")) return alert("Поточна роль не має права змінювати проведені серійні документи.");
  const normalized = String(data.serial || "").trim().toUpperCase();
  if (!normalized) return alert("Вкажіть серійний номер.");
  if (state.serials.some((item) => item.id !== serial.id && item.serial.toUpperCase() === normalized)) return alert("Дублювання серійного номера заборонено.");
  if (data.status === "responsible_storage" && !data.clientId) return alert("Для статусу відповідального зберігання потрібно вибрати B2B клієнта.");
  serial.productId = data.productId;
  serial.serial = normalized;
  serial.warehouseId = data.warehouseId;
  serial.status = data.status;
  serial.erzStatus = data.erzStatus;
  serial.actual = data.actual === "true";
  serial.clientId = data.clientId || "";
  serial.permitNumber = data.permitNumber || "";
  serial.permitDate = data.permitDate || "";
  addAudit(`Змінено серійний документ ${serial.serial}`);
  document.querySelector(".modal-backdrop")?.remove();
  render();
}

function createPayment(form) {
  if (!canCreateDocument("payment")) return alert("Поточна роль не має права вносити оплати.");
  if (!canEditField("payment")) return alert("Поточна роль не має права змінювати поля оплати.");
  const data = formData(form);
  const isAdvance = data.paymentKind === "advance";
  const client = byId(state.clients, data.clientId);
  if (!client) return alert("Клієнта не знайдено.");
  const invoice = byId(state.invoices, data.invoiceId);
  if (!isAdvance && !invoice) return alert("Накладна не знайдена.");
  if (!isAdvance && invoice.clientId !== data.clientId) {
    return alert("Обрана накладна не належить вибраному клієнту.");
  }
  if (!isAdvance && isLocked(invoice.date, invoice.locked) && !role().canEditClosedDay && !canEditPostedDocument(invoicePostedPermissionKey(invoice)) && !canEditPostedDocument("payment")) {
    return alert("Документ заблоковано закритим днем.");
  }
  const debt = isAdvance ? 0 : invoiceDebt(invoice);
  if (!isAdvance && debt <= 0) return alert("По вибраній накладній немає боргу.");
  if (data.paymentSource === "card" && !data.terminalId) return alert("Для оплати карткою потрібно вибрати термінал.");
  const amount = Number(data.amount || 0);
  if (amount <= 0) return alert("Сума оплати має бути більшою за нуль.");
  const customRate = Number(data.rate || 0);
  const rate = customRate > 0 ? customRate : uahRate(data.currency);
  const paidInInvoiceCurrency = !isAdvance && customRate > 0
    ? convertMoney(amount * customRate, "UAH", invoice.currency)
    : (!isAdvance ? convertMoney(amount, data.currency, invoice.currency) : 0);
  state.payments.unshift({
    id: `pay-${String(Date.now()).slice(-6)}`,
    invoiceId: isAdvance ? "" : invoice.id,
    date: data.date,
    amount,
    currency: data.currency,
    rate,
    rateMode: customRate > 0 ? "uah-per-unit" : "settings",
    method: paymentMethodFromSource(data.paymentSource),
    source: data.paymentSource,
    paymentKind: data.paymentKind,
    advance: isAdvance,
    clientId: client.id,
    firmId: data.firmId,
    terminalId: data.paymentSource === "card" ? data.terminalId : "",
    prro: data.paymentSource === "cash" ? data.prro === "true" : false,
    bankRef: data.bankRef
  });
  if (!isAdvance) {
    invoice.paid = Math.min(invoice.total, invoice.paid + paidInInvoiceCurrency);
    invoice.status = invoice.paid >= invoice.total ? "paid" : "partial";
  }
  paymentDraft = {
    source: data.paymentSource || "cash",
    kind: data.paymentKind || "invoice",
    clientId: client.id,
    invoiceId: isAdvance ? "" : invoice.id,
    firmId: data.firmId,
    terminalId: data.terminalId || "",
    prro: data.prro || "true"
  };
  addAudit(`${isAdvance ? "Аванс" : "Оплату"} ${formatMoney(amount, data.currency)} ${isAdvance ? `внесено від ${client.name}` : `прив'язано до ${invoice.id}`}`);
  render();
}

function createExpense(form) {
  if (!canCreateDocument("expense")) return alert("Поточна роль не має права створювати витрати.");
  const data = formData(form);
  const amount = Number(data.amount || 0);
  if (amount <= 0) return alert("Сума витрати має бути більшою за нуль.");
  state.expenses.unshift({
    id: `exp-${String(Date.now()).slice(-6)}`,
    date: data.date,
    article: data.article,
    amount,
    currency: data.currency,
    method: data.method,
    manager: data.manager,
    supplier: data.supplier,
    comment: data.comment
  });
  addAudit(`Додано витрату ${formatMoney(amount, data.currency)} за статтею ${data.article}`);
  render();
}

function createPayable(form) {
  if (!canCreateDocument("payable")) return alert("Поточна роль не має права створювати кредиторку.");
  const data = formData(form);
  const amount = Number(data.amount || 0);
  if (amount <= 0) return alert("Сума кредиторки має бути більшою за нуль.");
  state.payables.unshift({
    id: `ap-${String(Date.now()).slice(-6)}`,
    supplier: data.supplier,
    manager: data.manager,
    article: data.article,
    amount,
    currency: data.currency,
    dueDate: data.dueDate,
    status: "open"
  });
  addAudit(`Додано кредиторку ${data.supplier} на ${formatMoney(amount, data.currency)}`);
  render();
}

function editPaymentDocument(id) {
  const payment = byId(state.payments, id);
  if (!payment) return;
  if (!canEditPostedDocument("payment")) return alert("Поточна роль не має права змінювати проведені оплати.");
  const firmOptions = state.settings.firms.map((firm) => option(firm.id, firm.name, firm.id === payment.firmId)).join("");
  const terminalOptions = state.settings.paymentTerminals.map((terminal) => option(terminal.id, `${terminal.name} · ${firmName(terminal.firmId)}`, terminal.id === payment.terminalId)).join("");
  openModal(`Зміна оплати ${payment.id}`, `
    <form class="form-grid" data-action="update-payment">
      <input type="hidden" name="id" value="${escapeHtml(payment.id)}">
      <label class="field"><span>Дата</span><input name="date" type="date" value="${escapeHtml(payment.date)}"></label>
      <label class="field"><span>Сума</span><input name="amount" inputmode="decimal" value="${escapeHtml(payment.amount)}"></label>
      <label class="field"><span>Валюта</span><select name="currency">${Object.keys(state.settings.rates).map((currency) => option(currency, currency, currency === payment.currency)).join("")}</select></label>
      <label class="field"><span>Курс до UAH</span><input name="rate" inputmode="decimal" value="${escapeHtml(payment.rate || "")}"></label>
      <label class="field"><span>Джерело</span><select name="source">${variantOptions("paymentSources", payment.source)}</select></label>
      <label class="field"><span>Фірма</span><select name="firmId">${firmOptions}</select></label>
      <label class="field wide"><span>Термінал</span><select name="terminalId"><option value="">Без термінала</option>${terminalOptions}</select></label>
      <label class="field"><span>ПРРО</span><select name="prro">${option("true", "Проводити ПРРО", payment.prro === true)}${option("false", "Без ПРРО", payment.prro !== true)}</select></label>
      <label class="field wide"><span>Референс</span><input name="bankRef" value="${escapeHtml(payment.bankRef || "")}"></label>
      <button class="primary" type="submit">Зберегти оплату</button>
    </form>
  `);
}

function updatePaymentDocument(form) {
  const data = formData(form);
  const payment = byId(state.payments, data.id);
  if (!payment) return alert("Оплату не знайдено.");
  if (!canEditPostedDocument("payment")) return alert("Поточна роль не має права змінювати проведені оплати.");
  payment.date = data.date || payment.date;
  payment.amount = parseDecimal(data.amount, payment.amount);
  payment.currency = data.currency;
  payment.rate = parseDecimal(data.rate, uahRate(data.currency));
  payment.rateMode = data.rate ? "uah-per-unit" : "settings";
  payment.source = data.source;
  payment.method = paymentMethodFromSource(data.source);
  payment.firmId = data.firmId;
  payment.terminalId = data.source === "card" ? data.terminalId : "";
  payment.prro = data.source === "cash" ? data.prro === "true" : false;
  payment.bankRef = data.bankRef;
  recalculateInvoicePayments(state);
  addAudit(`Змінено проведену оплату ${payment.id}`);
  document.querySelector(".modal-backdrop")?.remove();
  render();
}

function editExpenseDocument(id) {
  const expense = byId(state.expenses, id);
  if (!expense) return;
  if (!canEditPostedDocument("expense")) return alert("Поточна роль не має права змінювати проведені витрати.");
  openModal(`Зміна витрати ${expense.id}`, `
    <form class="form-grid" data-action="update-expense">
      <input type="hidden" name="id" value="${escapeHtml(expense.id)}">
      <label class="field"><span>Дата</span><input name="date" type="date" value="${escapeHtml(expense.date)}"></label>
      <label class="field"><span>Стаття</span><select name="article">${variantOptions("expenseArticles", expense.article)}</select></label>
      <label class="field"><span>Сума</span><input name="amount" inputmode="decimal" value="${escapeHtml(expense.amount)}"></label>
      <label class="field"><span>Валюта</span><select name="currency">${Object.keys(state.settings.rates).map((currency) => option(currency, currency, currency === expense.currency)).join("")}</select></label>
      <label class="field"><span>Метод</span><select name="method">${variantOptions("financeMethods", expense.method)}</select></label>
      <label class="field"><span>Постачальник</span><input name="supplier" value="${escapeHtml(expense.supplier || "")}"></label>
      <label class="field"><span>Менеджер</span><select name="manager">${employeeOptions(expense.manager)}</select></label>
      <label class="field wide"><span>Коментар</span><input name="comment" value="${escapeHtml(expense.comment || "")}"></label>
      <button class="primary" type="submit">Зберегти витрату</button>
    </form>
  `);
}

function updateExpenseDocument(form) {
  const data = formData(form);
  const expense = byId(state.expenses, data.id);
  if (!expense) return alert("Витрату не знайдено.");
  if (!canEditPostedDocument("expense")) return alert("Поточна роль не має права змінювати проведені витрати.");
  expense.date = data.date;
  expense.article = data.article;
  expense.amount = parseDecimal(data.amount, expense.amount);
  expense.currency = data.currency;
  expense.method = data.method;
  expense.supplier = data.supplier;
  expense.manager = data.manager;
  expense.comment = data.comment;
  addAudit(`Змінено проведену витрату ${expense.id}`);
  document.querySelector(".modal-backdrop")?.remove();
  render();
}

function editPayableDocument(id) {
  const payable = byId(state.payables, id);
  if (!payable) return;
  if (!canEditPostedDocument("payable")) return alert("Поточна роль не має права змінювати проведену кредиторку.");
  openModal(`Зміна кредиторки ${payable.id}`, `
    <form class="form-grid" data-action="update-payable">
      <input type="hidden" name="id" value="${escapeHtml(payable.id)}">
      <label class="field wide"><span>Постачальник</span><input name="supplier" value="${escapeHtml(payable.supplier || "")}"></label>
      <label class="field"><span>Стаття</span><select name="article">${variantOptions("expenseArticles", payable.article)}</select></label>
      <label class="field"><span>Сума</span><input name="amount" inputmode="decimal" value="${escapeHtml(payable.amount)}"></label>
      <label class="field"><span>Валюта</span><select name="currency">${Object.keys(state.settings.rates).map((currency) => option(currency, currency, currency === payable.currency)).join("")}</select></label>
      <label class="field"><span>Дата оплати</span><input name="dueDate" type="date" value="${escapeHtml(payable.dueDate || today)}"></label>
      <label class="field"><span>Менеджер</span><select name="manager">${employeeOptions(payable.manager)}</select></label>
      <label class="field"><span>Стан</span><select name="status">${option("open", "Відкрито", payable.status === "open")}${option("paid", "Оплачено", payable.status === "paid")}${option("cancelled", "Скасовано", payable.status === "cancelled")}</select></label>
      <button class="primary" type="submit">Зберегти кредиторку</button>
    </form>
  `);
}

function updatePayableDocument(form) {
  const data = formData(form);
  const payable = byId(state.payables, data.id);
  if (!payable) return alert("Кредиторку не знайдено.");
  if (!canEditPostedDocument("payable")) return alert("Поточна роль не має права змінювати проведену кредиторку.");
  payable.supplier = data.supplier;
  payable.article = data.article;
  payable.amount = parseDecimal(data.amount, payable.amount);
  payable.currency = data.currency;
  payable.dueDate = data.dueDate;
  payable.manager = data.manager;
  payable.status = data.status;
  addAudit(`Змінено проведену кредиторку ${payable.id}`);
  document.querySelector(".modal-backdrop")?.remove();
  render();
}

function createMarketplacePublication(form) {
  if (!canCreateDocument("marketplacePublication")) return alert("Поточна роль не має права створювати публікації маркетплейсу.");
  try {
    const lines = collectMarketplacePublicationLinesFromForm(form);
    if (!lines.length) throw new Error("Додайте хоча б одну публікацію.");
    const keys = lines.map((line) => `${line.marketplace}::${String(line.sku || "").trim().toLowerCase()}`);
    const duplicatedKeys = duplicateValues(keys).filter((key) => !key.endsWith("::"));
    if (duplicatedKeys.length) {
      throw new Error(`Дублювання SKU у формі: ${duplicatedKeys.map((key) => key.replace("::", " · ")).join(", ")}.`);
    }
    const publications = lines.map((line, index) => {
      const product = byId(state.products, line.productId);
      if (!product) throw new Error(`Рядок ${index + 1}: товар не знайдено.`);
      if (!line.marketplace) throw new Error(`Рядок ${index + 1}: оберіть маркетплейс.`);
      if (!String(line.sku || "").trim()) throw new Error(`Рядок ${index + 1}: вкажіть SKU.`);
      if (state.marketplacePublications.some((publication) => publication.marketplace === line.marketplace && publication.sku.toLowerCase() === line.sku.toLowerCase())) {
        throw new Error(`Рядок ${index + 1}: SKU ${line.sku} вже існує на ${line.marketplace}.`);
      }
      const price = productSalePrice(product, marketplacePriceTypeId());
      return {
        id: uniqueId("pub"),
        marketplace: line.marketplace,
        productId: line.productId,
        sku: line.sku,
        externalId: line.externalId,
        title: line.title || `${product.brand} ${product.model}`,
        price: parseDecimal(line.price || price.amount, product.price || 0),
        currency: line.currency || price.currency || product.currency || "UAH",
        stockQty: productAvailableQty(product.id),
        status: "needs_sync",
        photosStatus: product.photos?.length ? "ok" : "missing",
        lastSync: "",
        manager: line.manager || state.currentManager
      };
    });
    state.marketplacePublications.unshift(...publications);
    addAudit(`Створено публікацій маркетплейсів: ${publications.length}`);
    marketplacePublicationDraft = { lines: [defaultMarketplacePublicationLine()] };
    render();
  } catch (error) {
    alert(error.message);
  }
}

function updateMarketplacePublication(form) {
  const data = formData(form);
  const publication = byId(state.marketplacePublications, data.id);
  if (!publication) return alert("Публікацію не знайдено.");
  publication.marketplace = data.marketplace;
  publication.productId = data.productId;
  publication.sku = data.sku;
  publication.externalId = data.externalId;
  publication.title = data.title;
  publication.price = parseDecimal(data.price, 0);
  publication.currency = data.currency;
  publication.manager = data.manager;
  publication.status = "needs_sync";
  addAudit(`Оновлено публікацію ${publication.marketplace} · ${publication.sku}`);
  document.querySelector(".modal-backdrop")?.remove();
  render();
}

function editPublication(id) {
  const publication = byId(state.marketplacePublications, id);
  if (!publication) return;
  openModal(`Редагування публікації ${publication.sku}`, `
    <form class="form-grid" data-action="update-marketplace-publication">
      <input type="hidden" name="id" value="${escapeHtml(publication.id)}">
      <label class="field"><span>Маркетплейс</span><select name="marketplace">${marketplaceNames().map((name) => option(name, name, name === publication.marketplace)).join("")}</select></label>
      <label class="field wide"><span>Товар</span><select name="productId">${state.products.map((product) => option(product.id, `${product.brand} ${product.model}`, product.id === publication.productId)).join("")}</select></label>
      <label class="field"><span>SKU</span><input name="sku" value="${escapeHtml(publication.sku)}" required></label>
      <label class="field"><span>Зовнішній ID</span><input name="externalId" value="${escapeHtml(publication.externalId || "")}"></label>
      <label class="field wide"><span>Назва</span><input name="title" value="${escapeHtml(publication.title)}" required></label>
      <label class="field"><span>Ціна</span><input name="price" inputmode="decimal" value="${publication.price}"></label>
      <label class="field"><span>Валюта</span><select name="currency">${Object.keys(state.settings.rates).map((currency) => option(currency, currency, currency === publication.currency)).join("")}</select></label>
      <label class="field"><span>Менеджер</span><select name="manager">${employeeOptions(publication.manager)}</select></label>
      <button class="primary" type="submit">Зберегти</button>
    </form>
  `);
  attachFieldSuggestions();
}

function syncPublication(id) {
  const publication = byId(state.marketplacePublications, id);
  if (!publication) return;
  const product = byId(state.products, publication.productId);
  publication.stockQty = productAvailableQty(publication.productId);
  publication.photosStatus = product?.photos?.length ? "ok" : "missing";
  publication.status = "published";
  publication.lastSync = `${today} ${new Date().toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}`;
  addAudit(`${publication.marketplace}: синхронізовано публікацію ${publication.sku}`, "system");
  render();
}

function syncMarketplaceStocks() {
  state.marketplacePublications.forEach((publication) => {
    publication.stockQty = productAvailableQty(publication.productId);
    publication.status = "needs_sync";
  });
  addAudit("Оновлено залишки для відправки на маркетплейси", "system");
  render();
}

function syncMarketplacePrices() {
  state.marketplacePublications.forEach((publication) => {
    const product = byId(state.products, publication.productId);
    if (!product) return;
    const price = productSalePrice(product, marketplacePriceTypeId());
    publication.price = Math.round(uah(price.amount, price.currency));
    publication.currency = "UAH";
    publication.status = "needs_sync";
  });
  addAudit("Оновлено ціни публікацій по поточному курсу CRM", state.currentManager);
  render();
}

function exportMarketplaceCatalog(marketplace) {
  const payload = {
    exportedAt: `${today} ${new Date().toLocaleTimeString("uk-UA")}`,
    marketplace,
    publications: state.marketplacePublications
      .filter((publication) => publication.marketplace === marketplace)
      .map(publicationPayload)
  };
  downloadJson(`marketplace-${marketplace}-${today}.json`, payload);
}

function importMarketplaceCatalog(form) {
  try {
    const data = formData(form);
    const payload = JSON.parse(data.payload || "{}");
    const rows = Array.isArray(payload) ? payload : payload.publications;
    if (!Array.isArray(rows)) throw new Error("JSON має містити масив publications.");
    rows.forEach((row) => {
      const existing = state.marketplacePublications.find((publication) => publication.marketplace === row.marketplace && publication.sku === row.sku);
      if (existing) {
        Object.assign(existing, { ...row, status: "needs_sync" });
      } else {
        state.marketplacePublications.unshift({
          id: uniqueId("pub"),
          marketplace: row.marketplace,
          productId: row.productId,
          sku: row.sku,
          externalId: row.externalId || "",
          title: row.title || row.sku,
          price: Number(row.price || 0),
          currency: row.currency || "UAH",
          stockQty: Number(row.stockQty || 0),
          status: row.status || "needs_sync",
          photosStatus: row.photosStatus || "unknown",
          lastSync: "",
          manager: row.manager || state.currentManager
        });
      }
    });
    addAudit(`Імпортовано публікацій маркетплейсів: ${rows.length}`, "system");
    render();
  } catch (error) {
    alert(`Помилка імпорту публікацій: ${error.message}`);
  }
}

function importDemoMarketplaceOrder() {
  const publication = state.marketplacePublications[0];
  if (!publication) return alert("Спочатку створіть публікацію.");
  const stamp = String(Date.now()).slice(-5);
  state.marketplaceOrders.unshift({
    id: uniqueId("mpo"),
    marketplace: publication.marketplace,
    externalOrderId: `${publication.marketplace.slice(0, 2).toUpperCase()}-${today.replaceAll("-", "")}-${stamp}`,
    date: today,
    status: "new_order",
    dates: { created: today, agreed: "", warehouse: "", delivery: "", delivered: "", paid: "" },
    warehouseStatus: "new",
    manager: publication.manager || state.currentManager,
    productId: publication.productId,
    sku: publication.sku,
    qty: 1,
    price: publication.price,
    currency: publication.currency,
    buyer: { name: `Покупець ${stamp}`, phone: `+38050${stamp}00`, email: `buyer${stamp}@example.com`, edrpou: "", address: "Нова пошта, відділення уточнюється" },
    delivery: { service: "Нова пошта", city: "Київ", warehouse: "відділення уточнюється", ttn: "", status: "new", apiStatus: "Очікує ТТН", lastCheck: "" },
    payment: { method: "Маркетплейс", status: "expected", amount: publication.price, source: `${publication.marketplace}Pay`, apiStatus: "Очікує оплату", lastCheck: "", paidAt: "" },
    clientId: "",
    invoiceId: ""
  });
  addAudit(`${publication.marketplace}: нове замовлення передано менеджеру ${publication.manager || state.currentManager}`, "system");
  render();
}

function ensureClientFromMarketplaceOrder(order) {
  const buyer = marketplaceOrderBuyer(order);
  let client = state.clients.find((item) => item.phone && item.phone === buyer.phone) || state.clients.find((item) => item.email && item.email === buyer.email);
  if (!client) {
    client = {
      id: uniqueId("c"),
      name: buyer.name,
      type: "Retail",
      manager: order.manager,
      paymentTerms: "Оплата через маркетплейс",
      creditLimitUAH: 0,
      cabinetEnabled: false,
      edrpou: buyer.edrpou || "",
      phone: buyer.phone || "",
      email: buyer.email || "",
      priceType: "Маркетплейс",
      currency: order.currency,
      taxMode: "роздріб",
      responsibleStorage: false,
      address: buyer.address || ""
    };
    state.clients.unshift(client);
  }
  order.clientId = client.id;
  return client;
}

function notifyMarketplaceOrder(id) {
  if (!canManageMarketplaceOrder()) return alert("Поточна роль не має права працювати із замовленнями маркетплейсу.");
  const order = byId(state.marketplaceOrders, id);
  if (!order) return;
  order.notifiedAt = currentTimestamp();
  addAudit(`Менеджера ${order.manager} повідомлено про замовлення ${order.externalOrderId}`, "system");
  render();
}

function createClientFromOrder(id) {
  if (!canManageMarketplaceOrder()) return alert("Поточна роль не має права створювати клієнта із замовлення маркетплейсу.");
  const order = byId(state.marketplaceOrders, id);
  if (!order) return;
  const client = ensureClientFromMarketplaceOrder(order);
  addAudit(`Створено/оновлено клієнта ${client.name} із замовлення ${order.externalOrderId}`);
  render();
}

function editMarketplaceOrderDocument(id) {
  const order = byId(state.marketplaceOrders, id);
  if (!order) return;
  if (!canEditPostedDocument("marketplaceOrder")) return alert("Поточна роль не має права змінювати проведені замовлення маркетплейсів.");
  const delivery = order.delivery || {};
  const payment = order.payment || {};
  const dates = { created: order.date || today, agreed: "", warehouse: "", delivery: "", delivered: "", paid: "", ...(order.dates || {}) };
  openModal(`Зміна замовлення ${order.externalOrderId}`, `
    <form class="form-grid" data-action="update-marketplace-order">
      <input type="hidden" name="id" value="${escapeHtml(order.id)}">
      <label class="field"><span>Дата замовлення</span><input name="date" type="date" value="${escapeHtml(order.date || today)}"></label>
      <label class="field"><span>Маркетплейс</span><select name="marketplace">${marketplaceNames().map((name) => option(name, name, name === order.marketplace)).join("")}</select></label>
      <label class="field"><span>Статус</span><select name="status">${MARKETPLACE_ORDER_STATUSES.map((item) => option(item.id, item.label, item.id === order.status)).join("")}</select></label>
      <label class="field"><span>Менеджер</span><select name="manager">${employeeOptions(order.manager)}</select></label>
      <label class="field wide"><span>Товар</span><select name="productId">${state.products.map((product) => option(product.id, `${product.brand} ${product.model}`, product.id === order.productId)).join("")}</select></label>
      <label class="field"><span>SKU</span><input name="sku" value="${escapeHtml(order.sku || "")}"></label>
      <label class="field"><span>Кількість</span><input name="qty" type="number" min="1" value="${order.qty || 1}"></label>
      <label class="field"><span>Ціна</span><input name="price" inputmode="decimal" value="${escapeHtml(order.price || 0)}"></label>
      <label class="field"><span>Валюта</span><select name="currency">${Object.keys(state.settings.rates).map((currency) => option(currency, currency, currency === order.currency)).join("")}</select></label>
      <label class="field"><span>Покупець</span><input name="buyerName" value="${escapeHtml(order.buyer?.name || "")}"></label>
      <label class="field"><span>Телефон</span><input name="buyerPhone" value="${escapeHtml(order.buyer?.phone || "")}"></label>
      <label class="field"><span>Email</span><input name="buyerEmail" value="${escapeHtml(order.buyer?.email || "")}"></label>
      <label class="field"><span>ЄДРПОУ / ІПН</span><input name="buyerEdrpou" value="${escapeHtml(order.buyer?.edrpou || "")}"></label>
      <label class="field full"><span>Адреса покупця</span><input name="buyerAddress" value="${escapeHtml(order.buyer?.address || "")}"></label>
      <label class="field"><span>Служба доставки</span><select name="deliveryService">${variantOptions("delivery", delivery.service)}</select></label>
      <label class="field"><span>Місто</span><input name="deliveryCity" value="${escapeHtml(delivery.city || "")}"></label>
      <label class="field"><span>Відділення</span><input name="deliveryWarehouse" value="${escapeHtml(delivery.warehouse || "")}"></label>
      <label class="field"><span>ТТН</span><input name="deliveryTtn" value="${escapeHtml(delivery.ttn || "")}"></label>
      <label class="field"><span>Статус доставки</span><select name="deliveryStatus">${["new", "sent_to_warehouse", "sent_to_delivery", "delivered"].map((status) => option(status, marketplaceDeliveryStatusPill(status).replace(/<[^>]+>/g, ""), status === delivery.status)).join("")}</select></label>
      <label class="field"><span>Статус оплати</span><select name="paymentStatus">${["expected", "pending", "paid", "failed"].map((status) => option(status, marketplacePaymentStatusPill(status).replace(/<[^>]+>/g, ""), status === payment.status)).join("")}</select></label>
      <label class="field"><span>Сума оплати</span><input name="paymentAmount" inputmode="decimal" value="${escapeHtml(payment.amount || order.qty * order.price || 0)}"></label>
      <label class="field"><span>Джерело оплати</span><input name="paymentSource" value="${escapeHtml(payment.source || "")}"></label>
      <label class="field"><span>Метод оплати</span><input name="paymentMethod" value="${escapeHtml(payment.method || "")}"></label>
      <label class="field"><span>Створено</span><input name="createdDate" type="date" value="${escapeHtml(dates.created || "")}"></label>
      <label class="field"><span>Погоджено</span><input name="agreedDate" type="date" value="${escapeHtml(dates.agreed || "")}"></label>
      <label class="field"><span>На склад</span><input name="warehouseDate" type="date" value="${escapeHtml(dates.warehouse || "")}"></label>
      <label class="field"><span>На доставку</span><input name="deliveryDate" type="date" value="${escapeHtml(dates.delivery || "")}"></label>
      <label class="field"><span>Вручено</span><input name="deliveredDate" type="date" value="${escapeHtml(dates.delivered || "")}"></label>
      <label class="field"><span>Оплачено</span><input name="paidDate" type="date" value="${escapeHtml(dates.paid || payment.paidAt || "")}"></label>
      <p class="notice warn small full">Якщо накладна вже створена, зміна товару, кількості або ціни у замовленні не змінює проведену накладну. Для цього використовуйте зміну накладної або коригування.</p>
      <button class="primary" type="submit">Зберегти замовлення</button>
    </form>
  `);
}

function updateMarketplaceOrderDocument(form) {
  const data = formData(form);
  const order = byId(state.marketplaceOrders, data.id);
  if (!order) return alert("Замовлення маркетплейсу не знайдено.");
  if (!canEditPostedDocument("marketplaceOrder")) return alert("Поточна роль не має права змінювати проведені замовлення маркетплейсів.");
  order.date = data.date || order.date;
  order.marketplace = data.marketplace;
  order.status = data.status;
  order.manager = data.manager;
  order.productId = data.productId;
  order.sku = data.sku;
  order.qty = Number(data.qty || 1);
  order.price = Number(data.price || 0);
  order.currency = data.currency;
  order.buyer = {
    name: data.buyerName || "",
    phone: data.buyerPhone || "",
    email: data.buyerEmail || "",
    edrpou: data.buyerEdrpou || "",
    address: data.buyerAddress || ""
  };
  order.delivery = {
    ...(order.delivery || {}),
    service: data.deliveryService,
    city: data.deliveryCity || "",
    warehouse: data.deliveryWarehouse || "",
    ttn: data.deliveryTtn || "",
    status: data.deliveryStatus,
    apiStatus: order.delivery?.apiStatus || "Змінено менеджером"
  };
  order.payment = {
    ...(order.payment || {}),
    status: data.paymentStatus,
    amount: Number(data.paymentAmount || 0),
    source: data.paymentSource || "",
    method: data.paymentMethod || "",
    paidAt: data.paidDate || order.payment?.paidAt || ""
  };
  order.dates = {
    created: data.createdDate || order.date,
    agreed: data.agreedDate || "",
    warehouse: data.warehouseDate || "",
    delivery: data.deliveryDate || "",
    delivered: data.deliveredDate || "",
    paid: data.paidDate || ""
  };
  if (order.status === "paid" && order.payment.status !== "paid") order.payment.status = "paid";
  if (order.payment.status === "paid" && !order.dates.paid) order.dates.paid = today;
  addAudit(`Змінено замовлення маркетплейсу ${order.externalOrderId}`);
  document.querySelector(".modal-backdrop")?.remove();
  render();
}

function agreeMarketplaceOrder(id) {
  if (!canChangeMarketplaceOrderStatus()) return alert("Поточна роль не має права змінювати статус замовлення маркетплейсу.");
  const order = byId(state.marketplaceOrders, id);
  if (!order) return;
  ensureClientFromMarketplaceOrder(order);
  order.status = "agreed";
  order.dates = { created: order.date || today, agreed: today, warehouse: "", delivery: "", delivered: "", paid: "", ...(order.dates || {}), agreed: today };
  addAudit(`Замовлення ${order.externalOrderId} узгоджено з покупцем`);
  render();
}

function sendMarketplaceOrderToWarehouse(id) {
  if (!canChangeMarketplaceOrderStatus()) return alert("Поточна роль не має права передавати замовлення на склад.");
  const order = byId(state.marketplaceOrders, id);
  if (!order) return;
  if (order.status === "new_order") return alert("Спочатку погодьте замовлення з покупцем.");
  order.status = "sent_to_warehouse";
  order.warehouseStatus = "reserved";
  order.dates = { created: order.date || today, agreed: order.dates?.agreed || today, warehouse: today, delivery: "", delivered: "", paid: order.dates?.paid || "", ...(order.dates || {}), warehouse: today };
  order.delivery.status = order.delivery.status === "delivered" ? "delivered" : "sent_to_warehouse";
  order.delivery.apiStatus = "Замовлення передано на склад для комплектації";
  addAudit(`Замовлення ${order.externalOrderId} передано на склад`);
  render();
}

function marketplaceTtnPrefix(service = "") {
  if (service.includes("Нова")) return "NP";
  if (service.includes("Укр")) return "UP";
  if (service.includes("Міст")) return "ME";
  if (service.includes("Спец")) return "SZ";
  return "TTN";
}

function generateMarketplaceTtn(order) {
  return `${marketplaceTtnPrefix(order.delivery?.service)}-${today.replaceAll("-", "")}-${String(Date.now()).slice(-6)}`;
}

function sendMarketplaceOrderToDelivery(id) {
  if (!canTrackMarketplaceDelivery()) return alert("Поточна роль не має права передавати замовлення в доставку.");
  const order = byId(state.marketplaceOrders, id);
  if (!order) return;
  if (order.status === "new_order") return alert("Спочатку погодьте замовлення.");
  order.status = "sent_to_delivery";
  order.delivery.status = "sent_to_delivery";
  order.delivery.ttn = order.delivery.ttn || generateMarketplaceTtn(order);
  order.delivery.apiStatus = "Передано перевізнику, очікує перший скан";
  order.delivery.lastCheck = currentTimestamp();
  order.dates = { created: order.date || today, agreed: order.dates?.agreed || today, warehouse: order.dates?.warehouse || today, delivery: today, delivered: "", paid: order.dates?.paid || "", ...(order.dates || {}), delivery: today };
  addAudit(`Замовлення ${order.externalOrderId} передано на доставку, ТТН ${order.delivery.ttn}`, "system");
  render();
}

function trackMarketplaceDelivery(id) {
  if (!canTrackMarketplaceDelivery()) return alert("Поточна роль не має права відстежувати доставку.");
  const order = byId(state.marketplaceOrders, id);
  if (!order) return;
  if (!order.delivery.ttn) return alert("Для API-відстеження потрібно внести або створити ТТН.");
  order.delivery.lastCheck = currentTimestamp();
  if (order.delivery.status === "delivered") {
    order.delivery.apiStatus = "Вручено отримувачу, статус підтверджено API";
  } else {
    order.delivery.status = "delivered";
    order.delivery.apiStatus = "Вручено отримувачу, статус підтверджено API";
    order.dates = { created: order.date || today, agreed: order.dates?.agreed || today, warehouse: order.dates?.warehouse || today, delivery: order.dates?.delivery || today, delivered: today, paid: order.dates?.paid || "", ...(order.dates || {}), delivered: today };
    if (order.status !== "paid") order.status = "delivered";
  }
  addAudit(`API доставки підтвердив вручення ${order.externalOrderId} за ТТН ${order.delivery.ttn}`, "system");
  render();
}

function createInvoiceFromMarketplaceOrder(id) {
  if (!canManageMarketplaceOrder()) return alert("Поточна роль не має права створювати накладну із замовлення маркетплейсу.");
  const order = byId(state.marketplaceOrders, id);
  if (!order) return;
  if (order.invoiceId) return alert("Накладна вже створена.");
  if (!["agreed", "sent_to_warehouse", "sent_to_delivery", "delivered", "paid"].includes(order.status)) return alert("Спочатку узгодьте асортимент, доставку та оплату з покупцем.");
  const product = byId(state.products, order.productId);
  if (!product) return alert("Товар не знайдено.");
  if (product.type === "weapon") return alert("Для зброї автоматична накладна з маркетплейсу заблокована: потрібно вибрати серії та внести дозвіл покупця у продажі.");
  const invoiceWarehouseId = "wh-main";
  const invoiceFirmId = "fop";
  if (productAvailableQty(product.id, invoiceWarehouseId, invoiceFirmId) < Number(order.qty || 1)) return alert(`Недостатньо залишку для створення накладної: ${productName(product.id)} · ${warehouseName(invoiceWarehouseId)} · ${firmName(invoiceFirmId)}.`);
  const client = ensureClientFromMarketplaceOrder(order);
  const total = Number(order.qty || 1) * Number(order.price || 0);
  const invoice = {
    id: `inv-${String(Date.now()).slice(-8)}`,
    date: today,
    documentType: "Видаткова накладна",
    contract: order.externalOrderId,
    warehouseId: invoiceWarehouseId,
    firmId: invoiceFirmId,
    channel: order.marketplace,
    clientId: client.id,
    manager: order.manager,
    priceType: "Маркетплейс",
    currency: order.currency,
    total,
    paid: order.payment.status === "paid" ? total : 0,
    discount: 0,
    dueDate: today,
    cashArticle: "Продаж товарів",
    accounting: false,
    locked: false,
    status: order.payment.status === "paid" ? "paid" : "draft",
    lines: [{ productId: product.id, qty: Number(order.qty || 1), price: Number(order.price || 0), currency: order.currency, serialId: "", permitNumber: "", permitDate: "" }],
    delivery: order.delivery.service,
    deliveryPayer: "Маркетплейс",
    ttn: order.delivery.ttn,
    comment: `Маркетплейс ${order.marketplace}, замовлення ${order.externalOrderId}`
  };
  decrementStock(product.id, order.qty, invoiceWarehouseId, invoiceFirmId);
  state.invoices.unshift(invoice);
  order.invoiceId = invoice.id;
  if (order.status === "agreed") order.status = "sent_to_warehouse";
  order.warehouseStatus = "reserved";
  order.dates = { created: order.date || today, agreed: order.dates?.agreed || today, warehouse: order.dates?.warehouse || today, delivery: order.dates?.delivery || "", delivered: order.dates?.delivered || "", paid: order.dates?.paid || "", ...(order.dates || {}) };
  if (order.payment.status === "paid") addMarketplacePaymentIfMissing(order, invoice);
  addAudit(`Створено накладну ${invoice.id} з маркетплейс-замовлення ${order.externalOrderId}`);
  render();
}

function addMarketplacePaymentIfMissing(order, invoice) {
  if (state.payments.some((payment) => payment.invoiceId === invoice.id && payment.bankRef === order.payment.source)) return;
  state.payments.unshift({
    id: `pay-${String(Date.now()).slice(-6)}`,
    invoiceId: invoice.id,
    date: today,
    amount: invoice.total,
    currency: invoice.currency,
    rate: uahRate(invoice.currency),
    rateMode: "settings",
    paymentKind: "invoice",
    advance: false,
    clientId: invoice.clientId,
    firmId: invoice.firmId,
    source: "bank",
    terminalId: "",
    prro: false,
    method: "Маркетплейс / поштовий сервіс",
    bankRef: order.payment.source
  });
}

function pullMarketplacePayment(id) {
  if (!canTrackMarketplacePayment()) return alert("Поточна роль не має права підтягувати оплату маркетплейсу.");
  const order = byId(state.marketplaceOrders, id);
  if (!order) return;
  order.payment.status = "paid";
  order.payment.apiStatus = "Оплата підтверджена API маркетплейсу або поштового сервісу";
  order.payment.lastCheck = currentTimestamp();
  order.payment.paidAt = today;
  order.dates = { created: order.date || today, agreed: order.dates?.agreed || "", warehouse: order.dates?.warehouse || "", delivery: order.dates?.delivery || "", delivered: order.dates?.delivered || "", paid: today, ...(order.dates || {}), paid: today };
  order.status = "paid";
  if (order.invoiceId) {
    const invoice = byId(state.invoices, order.invoiceId);
    if (invoice && invoice.paid < invoice.total) {
      invoice.paid = invoice.total;
      invoice.status = "paid";
      addMarketplacePaymentIfMissing(order, invoice);
    }
  }
  addAudit(`Підтягнуто оплату по маркетплейс-замовленню ${order.externalOrderId}`, "system");
  render();
}

function trackMarketplacePayment(id) {
  pullMarketplacePayment(id);
}

function updateRates(form) {
  if (!(role().canEditSettings || isAdmin())) return alert("Курси та налаштування може змінювати тільки адміністратор.");
  const data = formData(form);
  const rates = {};
  Object.keys(state.settings.rates).forEach((currency) => {
    rates[currency] = Number(data[currency] || state.settings.rates[currency]);
  });
  state.settings.rates = normalizeExchangeRates(rates);
  addAudit("Оновлено курси валют");
  render();
}

function updateClosedDay(form) {
  if (!role().canEditClosedDay) return alert("Поточна роль не може змінювати закритий день.");
  const data = formData(form);
  state.settings.closedDay = data.closedDay;
  addAudit(`Закритий день змінено на ${data.closedDay}`);
  render();
}

function openInvoice(id) {
  const invoice = byId(state.invoices, id);
  if (!invoice) return;
  const lines = invoice.lines.map((line) => {
    const serial = line.serialId ? byId(state.serials, line.serialId) : null;
    return `
      <tr>
        <td>${productName(line.productId)}</td>
        <td>${line.qty}</td>
        <td>${formatMoney(line.price, line.currency || invoice.currency)}${line.discount ? `<br><span class="small muted">знижка ${line.discount}%</span>` : ""}</td>
        <td>${serial ? serial.serial : "-"}</td>
        <td>${line.permitNumber || "-"} ${line.permitDate ? `<br><span class="small muted">${line.permitDate}</span>` : ""}</td>
      </tr>
    `;
  }).join("");
  openModal(`Накладна ${invoice.id}`, `
    <div class="stack" data-print-area="invoice-${escapeHtml(invoice.id)}" data-print-title="Накладна ${escapeHtml(invoice.id)}">
      <div class="inline-actions no-print">
        <button class="secondary" type="button" data-print-scope="invoice-${escapeHtml(invoice.id)}" ${canPrintDocuments() ? "" : "disabled"}>Друк накладної</button>
      </div>
      <p><strong>${clientName(invoice.clientId)}</strong><br><span class="muted">${firmName(invoice.firmId)} · ${invoice.channel} · ${invoice.manager}</span></p>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Товар</th><th>К-сть</th><th>Ціна</th><th>Серія</th><th>Дозвіл</th></tr></thead>
          <tbody>${lines}</tbody>
        </table>
      </div>
      <p class="notice">Сума: <strong>${formatMoney(invoice.total, invoice.currency)}</strong>. Оплачено: <strong>${formatMoney(invoice.paid, invoice.currency)}</strong>. Доставка: ${invoice.delivery}, ${invoice.ttn || "ТТН не внесено"}.</p>
    </div>
  `);
}

function editInvoiceDocument(id) {
  const invoice = byId(state.invoices, id);
  if (!invoice) return;
  const documentKey = invoicePostedPermissionKey(invoice);
  if (invoice.posted !== false && !canEditPostedDocument(documentKey)) return alert("Поточна роль не має права змінювати цей вид проведеного документа.");
  openModal(`Зміна накладної ${invoice.id}`, `
    <form class="form-grid" data-action="update-invoice">
      <input type="hidden" name="id" value="${escapeHtml(invoice.id)}">
      <label class="field"><span>Дата</span><input name="date" type="date" value="${escapeHtml(invoice.date)}"></label>
      <label class="field"><span>Тип документа</span><select name="documentType">${variantOptions("documentTypes", invoice.documentType)}</select></label>
      <label class="field"><span>Договір / підстава</span><input name="contract" value="${escapeHtml(invoice.contract || "")}"></label>
      <label class="field"><span>Фірма</span><select name="firmId">${state.settings.firms.map((firm) => option(firm.id, firm.name, firm.id === invoice.firmId)).join("")}</select></label>
      <label class="field"><span>Канал</span><select name="channel">${variantOptions("salesChannels", invoice.channel)}</select></label>
      <label class="field wide"><span>Клієнт</span><select name="clientId">${state.clients.map((client) => option(client.id, client.name, client.id === invoice.clientId)).join("")}</select></label>
      <label class="field"><span>Менеджер</span><select name="manager">${employeeOptions(invoice.manager)}</select></label>
      <label class="field"><span>Дата оплати до</span><input name="dueDate" type="date" value="${escapeHtml(invoice.dueDate || invoice.date)}"></label>
      <label class="field"><span>Доставка</span><select name="delivery">${variantOptions("delivery", invoice.delivery)}</select></label>
      <label class="field"><span>ТТН</span><input name="ttn" value="${escapeHtml(invoice.ttn || "")}"></label>
      <label class="field"><span>Платник доставки</span><select name="deliveryPayer">${variantOptions("deliveryPayers", invoice.deliveryPayer)}</select></label>
      <label class="field"><span>Бухоблік</span><select name="accounting">${option("true", "Позначити для BAS/BAF", invoice.accounting === true)}${option("false", "Не передавати", invoice.accounting !== true)}</select></label>
      <label class="field"><span>Блокування</span><select name="locked">${option("true", "Заблоковано", invoice.locked === true)}${option("false", "Відкрито для змін", invoice.locked !== true)}</select></label>
      <label class="field full"><span>Коментар</span><textarea name="comment">${escapeHtml(invoice.comment || "")}</textarea></label>
      <p class="notice warn small full">Товарні рядки, серії та кількість змінюються коригуючим документом, щоб не зламати складський облік.</p>
      <button class="primary" type="submit">Зберегти зміни накладної</button>
    </form>
  `);
}

function updateInvoiceDocument(form) {
  const data = formData(form);
  const invoice = byId(state.invoices, data.id);
  if (!invoice) return alert("Накладну не знайдено.");
  const documentKey = invoicePostedPermissionKey(invoice);
  if (invoice.posted !== false && !canEditPostedDocument(documentKey)) return alert("Поточна роль не має права змінювати цей вид проведеного документа.");
  if (invoice.posted !== false && data.firmId !== invoice.firmId) return alert("Фірму проведеної накладної не можна змінити без коригувального документа, бо вона вже прив'язана до списання залишків.");
  const previousClientId = invoice.clientId;
  invoice.date = data.date || invoice.date;
  invoice.documentType = data.documentType;
  invoice.contract = data.contract;
  invoice.firmId = data.firmId;
  invoice.channel = data.channel;
  invoice.clientId = data.clientId;
  invoice.manager = data.manager;
  invoice.dueDate = data.dueDate || invoice.dueDate;
  invoice.delivery = data.delivery;
  invoice.ttn = data.ttn;
  invoice.deliveryPayer = data.deliveryPayer;
  invoice.accounting = data.accounting === "true";
  invoice.locked = data.locked === "true";
  invoice.comment = data.comment;
  if (previousClientId !== invoice.clientId) {
    state.payments.filter((payment) => payment.invoiceId === invoice.id).forEach((payment) => {
      payment.clientId = invoice.clientId;
    });
  }
  addAudit(`Змінено проведену накладну ${invoice.id}`);
  document.querySelector(".modal-backdrop")?.remove();
  render();
}

function openCabinetLegacy(id) {
  const client = byId(state.clients, id);
  const rows = inventoryRows().filter((row) => row.clientId === id);
  const invoices = state.invoices.filter((invoice) => invoice.clientId === id && isDebtInvoice(invoice));
  openModal(`B2B кабінет · ${client.name}`, `
    <div class="grid two">
      <div class="card">
        <h3>Відповідальне зберігання</h3>
        ${rows.length ? rows.map((row) => `<p><strong>${row.product.brand} ${row.product.model}</strong><br><span class="muted">${row.qty} од. · ${warehouseName(row.warehouseId)}</span></p>`).join("") : '<p class="muted">Немає залишків.</p>'}
      </div>
      <div class="card">
        <h3>Проплати</h3>
        ${invoices.map((invoice) => `<p><strong>${invoice.id}</strong><br><span class="muted">${formatMoney(invoice.paid, invoice.currency)} з ${formatMoney(invoice.total, invoice.currency)}</span></p>`).join("") || '<p class="muted">Немає накладних.</p>'}
      </div>
    </div>
    <p class="notice">У production-версії цей кабінет матиме окремий вхід клієнта, обмеження видимості даних, роздрібний інтерфейс продажу та підтвердження менеджером.</p>
  `);
}

function openCabinet(id) {
  const client = byId(state.clients, id);
  if (!client) return;
  const rows = clientStorageRows(id);
  const docs = responsibleStorageRows(id);
  const invoices = state.invoices.filter((invoice) => invoice.clientId === id && isDebtInvoice(invoice));
  const paymentDebt = invoices.reduce((sum, invoice) => sum + invoice.total - invoice.paid, 0);
  const serialRows = clientStorageSerials(id, "", true);
  openModal(`B2B кабінет · ${client.name}`, `
    <div class="stack" data-print-area="b2b-cabinet-${escapeHtml(client.id)}" data-print-title="B2B кабінет · ${escapeHtml(client.name)}">
      <div class="inline-actions no-print">
        <button class="secondary" type="button" data-print-scope="b2b-cabinet-${escapeHtml(client.id)}" ${canPrintDocuments() ? "" : "disabled"}>Друк кабінету</button>
        <button class="secondary" data-export-b2b-report="stock" data-client-id="${client.id}">Звіт залишків JSON</button>
        <button class="secondary" data-export-b2b-report="payments" data-client-id="${client.id}">Звіт оплат JSON</button>
        <button class="secondary" data-export-b2b-report="inventory" data-client-id="${client.id}">Інвентаризація JSON</button>
      </div>
      <div class="grid three">
        <article class="card metric warn"><span>На зберіганні</span><strong>${rows.reduce((sum, row) => sum + row.qty, 0)} од.</strong><small>Товар залишається нашим до продажу клієнтом.</small></article>
        <article class="card metric danger"><span>До оплати</span><strong>${formatMoney(paymentDebt)}</strong><small>Борг після звітів продажу клієнтом.</small></article>
        <article class="card metric info"><span>Документи</span><strong>${docs.length}</strong><small>Передачі на склад клієнта.</small></article>
      </div>

      <section class="panel">
        <h3>Що відвантажено на відповідальне зберігання</h3>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Документ</th><th>Дата</th><th>Товар</th><th>Передано</th><th>Продано</th><th>Залишок</th><th>Серії</th><th>Оплата</th><th>Статус</th></tr></thead>
            <tbody>
              ${docs.map((row) => `
                <tr>
                  <td><strong>${row.id}</strong><br><span class="small muted">${escapeHtml(row.manager || "-")}</span></td>
                  <td>${row.date}</td>
                  <td>${productName(row.productId)}<br><span class="small muted">${productCodes(row.product)}</span></td>
                  <td>${row.qty}</td>
                  <td>${row.soldQty}</td>
                  <td><strong>${row.remainingQty}</strong></td>
                  <td>${serialBadges(row.serialIds)}</td>
                  <td>${row.paymentDays || state.settings.defaultDueDays} днів після продажу</td>
                  <td>${statusPill(row.derivedStatus)}<br><span class="small muted">${ownershipLabel(row)}</span></td>
                </tr>
              `).join("") || '<tr><td colspan="9" class="muted">Передач на відповідальне зберігання ще немає.</td></tr>'}
            </tbody>
          </table>
        </div>
      </section>

      <section class="panel">
        <h3>Залишки клієнта та інвентаризація</h3>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Товар</th><th>QR / штрихкод</th><th>Склад</th><th>Кількість</th><th>Собівартість</th><th>Серійні номери зброї</th></tr></thead>
            <tbody>
              ${rows.map((row) => {
                const serials = row.product.type === "weapon"
                  ? clientStorageSerials(id, row.product.id).map((serial) => serial.id)
                  : [];
                return `
                  <tr>
                    <td><strong>${row.product.brand}</strong><br>${row.product.model}</td>
                    <td>${productCodes(row.product)}</td>
                    <td>${warehouseName(row.warehouseId)}</td>
                    <td>${row.qty}</td>
                    <td>${formatMoney(row.valueUAH)}</td>
                    <td>${serialBadges(serials)}</td>
                  </tr>
                `;
              }).join("") || '<tr><td colspan="6" class="muted">Немає залишків на складі клієнта.</td></tr>'}
            </tbody>
          </table>
        </div>
        <p class="notice small">Для інвентаризації зброя перевіряється за серійними номерами, звичайні товари — по QR або штрихкодах.</p>
      </section>

      <section class="panel">
        <h3>Оплати та дебіторка</h3>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Накладна</th><th>Дата</th><th>Сума</th><th>Оплачено</th><th>Борг</th><th>Оплатити до</th><th>Стан</th></tr></thead>
            <tbody>
              ${invoices.map((invoice) => `
                <tr>
                  <td><strong>${invoice.id}</strong><br><span class="small muted">${invoice.channel}</span></td>
                  <td>${invoice.date}</td>
                  <td>${formatMoney(invoice.total, invoice.currency)}</td>
                  <td>${formatMoney(invoice.paid, invoice.currency)}</td>
                  <td>${formatMoney(invoice.total - invoice.paid, invoice.currency)}</td>
                  <td>${invoice.dueDate || "-"}</td>
                  <td>${statusPill(invoice.status)}</td>
                </tr>
              `).join("") || '<tr><td colspan="7" class="muted">Накладних і оплат ще немає.</td></tr>'}
            </tbody>
          </table>
        </div>
      </section>

      <section class="panel">
        <h3>Серійні номери в кабінеті</h3>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Серія</th><th>Товар</th><th>Склад</th><th>Стан</th><th>ЄРЗ</th><th>Дозвіл</th></tr></thead>
            <tbody>
              ${serialRows.map((serial) => `
                <tr>
                  <td><strong>${serial.serial}</strong></td>
                  <td>${productName(serial.productId)}</td>
                  <td>${warehouseName(serial.warehouseId)}</td>
                  <td>${statusPill(serial.status)}</td>
                  <td>${statusPill(serial.erzStatus)}</td>
                  <td>${serial.permitNumber ? `${escapeHtml(serial.permitNumber)}<br><span class="small muted">${serial.permitDate || "-"}</span>` : "-"}</td>
                </tr>
              `).join("") || '<tr><td colspan="6" class="muted">Серійних товарів у кабінеті немає.</td></tr>'}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `);
}

function openPayment(id) {
  const invoice = byId(state.invoices, id);
  paymentDraft = {
    ...paymentDraft,
    kind: "invoice",
    clientId: invoice?.clientId || "",
    invoiceId: id,
    firmId: invoice?.firmId || paymentDraft.firmId || ""
  };
  state.currentView = "finance";
  render();
}

function openModal(title, body) {
  const template = $("#modal-template").content.cloneNode(true);
  $(".modal-head h2", template).textContent = title;
  $(".modal-body", template).innerHTML = body;
  document.body.appendChild(template);
  const modal = document.body.lastElementChild;
  prepareDecimalInputs(modal);
  applyRoleFieldLocks(modal);
  attachFieldSuggestions();
  return modal;
}

function setFormReadOnly(form, message) {
  if (!form) return;
  $$("input, select, textarea, button", form).forEach((element) => {
    element.disabled = true;
  });
  if (message) {
    form.insertAdjacentHTML("afterbegin", `<p class="notice warn full">${escapeHtml(message)}</p>`);
  }
}

function exportB2BReport(clientId, type) {
  const portalClient = authenticatedClient();
  if (isClientAuthenticated() && portalClient?.id !== clientId) {
    alert("Кабінет клієнта може експортувати тільки власні звіти.");
    return;
  }
  const client = byId(state.clients, clientId);
  if (!client) return;
  let payload;
  if (type === "payments") {
    payload = state.invoices
      .filter((invoice) => invoice.clientId === clientId)
      .map((invoice) => ({
        invoiceId: invoice.id,
        date: invoice.date,
        dueDate: invoice.dueDate,
        channel: invoice.channel,
        total: invoice.total,
        paid: invoice.paid,
        debt: invoice.total - invoice.paid,
        currency: invoice.currency,
        status: invoice.status
      }));
  } else if (type === "inventory") {
    payload = clientStorageRows(clientId).map((row) => ({
      productId: row.product.id,
      product: `${row.product.brand} ${row.product.model}`,
      type: row.product.type,
      warehouse: warehouseName(row.warehouseId),
      qty: row.qty,
      barcode: row.product.barcode || "",
      qrCode: row.product.qrCode || "",
      serials: row.product.type === "weapon" ? clientStorageSerials(clientId, row.product.id).map((serial) => serial.serial) : [],
      valueUAH: row.valueUAH
    }));
  } else {
    payload = responsibleStorageRows(clientId).map((row) => ({
      documentId: row.id,
      date: row.date,
      productId: row.productId,
      product: productName(row.productId),
      barcode: row.product?.barcode || "",
      qty: row.qty,
      soldQty: row.soldQty,
      remainingQty: row.remainingQty,
      serials: (row.serialIds || []).map((serialId) => byId(state.serials, serialId)?.serial).filter(Boolean),
      paymentDays: row.paymentDays,
      status: row.derivedStatus,
      ownership: ownershipLabel(row)
    }));
  }
  downloadJson(`b2b-${type}-${safeFilePart(client.name)}-${today}.json`, {
    client: { id: client.id, name: client.name, edrpou: client.edrpou || "" },
    reportType: type,
    generatedAt: `${today} ${new Date().toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}`,
    rows: payload
  });
}

function exportJson() {
  if (isClientAuthenticated()) {
    alert("B2B кабінет не має доступу до повного експорту CRM.");
    return;
  }
  downloadJson(`arms-crm-export-${today}.json`, state);
}

function printScope(key) {
  if (!canPrintDocuments()) return alert("Поточна роль не має права друку документів та звітів.");
  const scope = document.querySelector(`[data-print-area="${key}"]`);
  if (!scope) return alert("Не знайдено область для друку.");
  const title = scope.dataset.printTitle || "Arms CRM";
  const styleHref = document.querySelector('link[rel="stylesheet"]')?.href || "";
  const printWindow = window.open("", "_blank", "width=1200,height=800");
  if (!printWindow) {
    alert("Браузер заблокував вікно друку. Дозвольте спливаючі вікна або повторіть друк.");
    return;
  }
  printWindow.document.write(`
    <!doctype html>
    <html lang="uk">
      <head>
        <meta charset="utf-8">
        <title>${escapeHtml(title)}</title>
        ${styleHref ? `<link rel="stylesheet" href="${styleHref}">` : ""}
      </head>
      <body class="print-document">
        <main class="content">
          <section class="panel">
            <h1>${escapeHtml(title)}</h1>
            ${scope.innerHTML}
          </section>
        </main>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 250);
}

function downloadJson(filename, value) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function basPurchasePayload(purchases) {
  return {
    exportedAt: `${today}T00:00:00+03:00`,
    source: "Arms CRM",
    target: "BAS/BAF",
    purchases: purchases.map((purchase) => {
      const product = byId(state.products, purchase.productId);
      return {
        id: purchase.id,
        date: purchase.date,
        documentType: purchase.documentType,
        supplier: purchase.supplier,
        supplierDoc: purchase.supplierDoc,
        firmId: purchase.firmId,
        warehouseId: purchase.warehouseId,
        productId: purchase.productId,
        internalCode: product?.internalCode,
        barcode: purchase.barcode || product?.barcode,
        productType: purchase.productType,
        qty: purchase.qty,
        cost: purchase.cost,
        currency: purchase.currency,
        serials: purchase.serials || [],
        uktzed: product?.uktzed,
        accounting: purchase.accounting
      };
    })
  };
}

function exportBasPurchases(purchaseIds = null) {
  const purchases = state.purchases.filter((purchase) => {
    if (purchaseIds) return purchaseIds.includes(purchase.id);
    return purchase.accounting;
  });
  if (!purchases.length) return alert("Немає приходів для BAS/BAF експорту.");
  downloadJson(`bas-baf-purchases-${today}.json`, basPurchasePayload(purchases));
  addAudit(`Сформовано BAS/BAF експорт приходів: ${purchases.length}`);
}

function markPurchaseExported(id) {
  const purchase = byId(state.purchases, id);
  if (!purchase) return;
  purchase.basStatus = "exported";
  state.serials
    .filter((serial) => serial.purchaseId === purchase.id)
    .forEach((serial) => {
      serial.basSynced = true;
    });
  addAudit(`Прихід ${purchase.id} підтверджено як експортований у BAS/BAF`);
  render();
}

function importBasPurchases(form) {
  try {
    const data = formData(form);
    const payload = JSON.parse(data.basPayload || "{}");
    const rows = Array.isArray(payload) ? payload : payload.purchases;
    if (!Array.isArray(rows) || !rows.length) throw new Error("JSON має містити масив purchases.");
    rows.forEach((row) => {
      const internalCodeMatches = row.productId ? [] : state.products.filter((product) => product.internalCode === row.internalCode);
      if (!row.productId && internalCodeMatches.length > 1) {
        throw new Error(`BAS/BAF не може однозначно знайти товар за внутрішнім кодом ${row.internalCode}: знайдено ${internalCodeMatches.length} карток.`);
      }
      const purchase = buildPurchase({
        ...row,
        accounting: true,
        productId: row.productId || internalCodeMatches[0]?.id
      }, "bas");
      applyPurchase(purchase, {
        erzStatus: row.erzStatus || "pending",
        actual: row.actual !== false
      });
    });
    addAudit(`Імпортовано BAS/BAF приходів: ${rows.length}`, "system");
    render();
  } catch (error) {
    alert(`Помилка імпорту BAS/BAF: ${error.message}`);
  }
}

document.addEventListener("click", (event) => {
  const productRow = event.target.closest("[data-open-product]");
  if (productRow && !event.target.closest("button, a, input, select, textarea, label")) {
    openProductCard(productRow.dataset.openProduct);
    return;
  }
  const clientRow = event.target.closest("[data-open-client]");
  if (clientRow && !event.target.closest("button, a, input, select, textarea, label")) {
    openClientCard(clientRow.dataset.openClient);
    return;
  }
  const requestBatchRow = event.target.closest("[data-open-client-request-batch]");
  if (requestBatchRow && !event.target.closest("button, a, input, select, textarea, label")) {
    openClientRequestBatch(requestBatchRow.dataset.openClientRequestBatch, requestBatchRow.dataset.clientId);
    return;
  }

  const target = event.target.closest("button");
  if (!target) return;

  if (target.id === "sidebar-toggle") {
    sidebarCollapsed = !sidebarCollapsed;
    localStorage.setItem("arms-crm-sidebar-collapsed", sidebarCollapsed ? "true" : "false");
    document.body.classList.toggle("sidebar-collapsed", sidebarCollapsed);
    syncSidebarToggleButton();
    return;
  }
  if (target.id === "logout-button") {
    logoutUser();
    return;
  }
  if (target.dataset.clientView) {
    clientPortalView = target.dataset.clientView === "catalog" ? "catalog" : "cabinet";
    sessionStorage.setItem("arms-crm-client-view", clientPortalView);
    render();
    return;
  }
  if (target.dataset.resetClientCatalogFilters !== undefined) {
    clientCatalogFilters = defaultClientCatalogFilters();
    saveClientCatalogFilters();
    render();
    return;
  }
  if (target.dataset.updateClientRequest) {
    const input = document.querySelector(`[data-client-request-qty="${CSS.escape(target.dataset.updateClientRequest)}"]`);
    updateClientB2BShipmentRequestQty(target.dataset.updateClientRequest, input?.value);
    return;
  }
  if (target.dataset.cancelClientRequest) {
    cancelClientB2BShipmentRequest(target.dataset.cancelClientRequest, true);
    return;
  }
  if (target.dataset.confirmClientRequests) {
    confirmClientB2BShipmentRequests(target.dataset.confirmClientRequests);
    return;
  }
  if (target.dataset.scrollToClientCart !== undefined) {
    const cart = $("#client-request-cart");
    cart?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (target.dataset.saveEmployee) {
    saveEmployee(target.dataset.saveEmployee);
    return;
  }
  if (target.dataset.togglePriceType) {
    togglePriceType(target.dataset.togglePriceType);
    return;
  }
  if (target.dataset.view) {
    if (!canAccessView(target.dataset.view)) return alert("Поточна роль не має доступу до цього розділу.");
    state.currentView = target.dataset.view;
    render();
  }
  if (target.dataset.quickProduct) {
    saleDraft.lines = [defaultSaleLine(target.dataset.quickProduct)];
    state.currentView = "sales";
    render();
  }
  if (target.dataset.addSaleLine !== undefined) {
    const form = target.closest('[data-action="create-invoice"]');
    if (form) updateSaleDraftFromForm(form);
    saleDraft.lines = [...saleDraftLines(), defaultSaleLine()];
    render();
    return;
  }
  if (target.dataset.removeSaleLine !== undefined) {
    const form = target.closest('[data-action="create-invoice"]');
    if (form) updateSaleDraftFromForm(form);
    const index = Number(target.dataset.removeSaleLine);
    const lines = saleDraftLines().filter((_, lineIndex) => lineIndex !== index);
    saleDraft.lines = lines.length ? lines : [defaultSaleLine()];
    render();
    return;
  }
  if (target.dataset.addPurchaseLine !== undefined) {
    const form = target.closest('[data-action="create-purchase"]');
    if (form) updatePurchaseDraftFromForm(form);
    purchaseDraft.lines = [...purchaseDraftLines(), defaultPurchaseLine()];
    render();
    return;
  }
  if (target.dataset.removePurchaseLine !== undefined) {
    const form = target.closest('[data-action="create-purchase"]');
    if (form) updatePurchaseDraftFromForm(form);
    const index = Number(target.dataset.removePurchaseLine);
    const lines = purchaseDraftLines().filter((_, lineIndex) => lineIndex !== index);
    purchaseDraft.lines = lines.length ? lines : [defaultPurchaseLine()];
    render();
    return;
  }
  if (target.dataset.addMarketplacePublicationLine !== undefined) {
    const form = target.closest('[data-action="create-marketplace-publication"]');
    if (form) updateMarketplacePublicationDraftFromForm(form);
    marketplacePublicationDraft.lines = [...marketplacePublicationDraftLines(), defaultMarketplacePublicationLine()];
    render();
    return;
  }
  if (target.dataset.removeMarketplacePublicationLine !== undefined) {
    const form = target.closest('[data-action="create-marketplace-publication"]');
    if (form) updateMarketplacePublicationDraftFromForm(form);
    const index = Number(target.dataset.removeMarketplacePublicationLine);
    const lines = marketplacePublicationDraftLines().filter((_, lineIndex) => lineIndex !== index);
    marketplacePublicationDraft.lines = lines.length ? lines : [defaultMarketplacePublicationLine()];
    render();
    return;
  }
  if (target.dataset.generateProductBarcode !== undefined) {
    const form = target.closest('[data-action="create-product"], [data-action="update-product"]');
    const barcodeInput = form?.elements.barcode;
    if (barcodeInput) barcodeInput.value = generateEan13();
  }
  if (target.dataset.removeProductPhoto) {
    productImagesDraft = productImagesDraft.filter((photo) => photo.id !== target.dataset.removeProductPhoto);
    renderProductPhotoPreview(target.closest("form") || document);
  }
  if (target.dataset.exportMarketplace) exportMarketplaceCatalog(target.dataset.exportMarketplace);
  if (target.dataset.syncMarketplaceStocks !== undefined) syncMarketplaceStocks();
  if (target.dataset.syncMarketplacePrices !== undefined) syncMarketplacePrices();
  if (target.dataset.importMarketplaceOrders !== undefined) importDemoMarketplaceOrder();
  if (target.dataset.editPublication) editPublication(target.dataset.editPublication);
  if (target.dataset.syncPublication) syncPublication(target.dataset.syncPublication);
  if (target.dataset.editMarketplaceOrder) editMarketplaceOrderDocument(target.dataset.editMarketplaceOrder);
  if (target.dataset.notifyMarketplaceOrder) notifyMarketplaceOrder(target.dataset.notifyMarketplaceOrder);
  if (target.dataset.createClientFromOrder) createClientFromOrder(target.dataset.createClientFromOrder);
  if (target.dataset.agreeMarketplaceOrder) agreeMarketplaceOrder(target.dataset.agreeMarketplaceOrder);
  if (target.dataset.marketplaceToWarehouse) sendMarketplaceOrderToWarehouse(target.dataset.marketplaceToWarehouse);
  if (target.dataset.invoiceMarketplaceOrder) createInvoiceFromMarketplaceOrder(target.dataset.invoiceMarketplaceOrder);
  if (target.dataset.marketplaceToDelivery) sendMarketplaceOrderToDelivery(target.dataset.marketplaceToDelivery);
  if (target.dataset.trackSelectedMarketplaceDelivery !== undefined) {
    const orderId = target.closest("[data-marketplace-api-panel]")?.querySelector('[name="orderId"]')?.value;
    if (!orderId) return alert("Оберіть замовлення для API-перевірки доставки.");
    trackMarketplaceDelivery(orderId);
    return;
  }
  if (target.dataset.trackSelectedMarketplacePayment !== undefined) {
    const orderId = target.closest("[data-marketplace-api-panel]")?.querySelector('[name="orderId"]')?.value;
    if (!orderId) return alert("Оберіть замовлення для API-перевірки оплати.");
    trackMarketplacePayment(orderId);
    return;
  }
  if (target.dataset.trackMarketplaceDelivery) trackMarketplaceDelivery(target.dataset.trackMarketplaceDelivery);
  if (target.dataset.trackMarketplacePayment) trackMarketplacePayment(target.dataset.trackMarketplacePayment);
  if (target.dataset.pullMarketplacePayment) pullMarketplacePayment(target.dataset.pullMarketplacePayment);
  if (target.dataset.resetMarketplaceOrderFilter !== undefined) {
    state.marketplaceOrderFilters = { from: "", to: "", status: "", marketplace: "", expanded: true };
    render();
    return;
  }
  if (target.dataset.resetMarketplacePublicationSearch !== undefined) {
    state.marketplacePublicationFilters = { search: "", expanded: true };
    render();
    return;
  }
  if (target.dataset.resetB2bShipmentRequestFilter !== undefined) {
    state.b2bShipmentRequestFilters = { from: "", to: "", status: "", search: "", sortBy: "date", sortDir: "desc", expanded: true };
    render();
    return;
  }
  if (target.dataset.b2bShipmentRequestSort) {
    const current = b2bShipmentRequestFilter();
    const sortBy = target.dataset.b2bShipmentRequestSort;
    state.b2bShipmentRequestFilters = {
      ...current,
      sortBy,
      sortDir: current.sortBy === sortBy && current.sortDir === "asc" ? "desc" : "asc",
      expanded: true
    };
    render();
    return;
  }
  if (target.dataset.resetB2bResponsibleStorageFilter !== undefined) {
    state.b2bResponsibleStorageFilters = { from: "", to: "", clientId: "", productId: "", search: "", sortBy: "date", sortDir: "desc", expanded: true };
    render();
    return;
  }
  if (target.dataset.b2bResponsibleStorageSort) {
    const current = b2bResponsibleStorageFilter();
    const sortBy = target.dataset.b2bResponsibleStorageSort;
    state.b2bResponsibleStorageFilters = {
      ...current,
      sortBy,
      sortDir: current.sortBy === sortBy && current.sortDir === "asc" ? "desc" : "asc",
      expanded: true
    };
    render();
    return;
  }
  if (target.dataset.resetRozetkaImportedOrderFilter !== undefined) {
    state.rozetkaImportedOrderFilters = { ...clone(seedState.rozetkaImportedOrderFilters), expanded: true };
    render();
    return;
  }
  if (target.dataset.rozetkaOrderSort) {
    const current = rozetkaImportedOrderFilter();
    const sortBy = target.dataset.rozetkaOrderSort;
    state.rozetkaImportedOrderFilters = {
      ...current,
      sortBy,
      sortDir: current.sortBy === sortBy && current.sortDir === "asc" ? "desc" : "asc",
      expanded: true
    };
    render();
    return;
  }
  if (target.dataset.postInvoiceDraft) postInvoiceDraft(target.dataset.postInvoiceDraft);
  if (target.dataset.openInvoice) openInvoice(target.dataset.openInvoice);
  if (target.dataset.editInvoice) editInvoiceDocument(target.dataset.editInvoice);
  if (target.dataset.editPurchase) editPurchaseDocument(target.dataset.editPurchase);
  if (target.dataset.editPayment) editPaymentDocument(target.dataset.editPayment);
  if (target.dataset.editExpense) editExpenseDocument(target.dataset.editExpense);
  if (target.dataset.editPayable) editPayableDocument(target.dataset.editPayable);
  if (target.dataset.editResponsibleDoc) editResponsibleStorageDoc(target.dataset.editResponsibleDoc);
  if (target.dataset.openB2bShipmentRequest) openB2BShipmentRequest(target.dataset.openB2bShipmentRequest);
  if (target.dataset.fillB2bRequestStock !== undefined) {
    const form = target.closest('[data-action="approve-b2b-shipment-request"]');
    if (!form) return;
    if (form.elements.firmId) form.elements.firmId.value = target.dataset.firmId || "";
    if (form.elements.warehouseId) form.elements.warehouseId.value = target.dataset.warehouseId || "";
    const request = updateB2BShipmentRequestDraftFromForm(form);
    if (request) openB2BShipmentRequest(request.id);
    return;
  }
  if (target.dataset.rejectB2bShipmentRequest) rejectB2BShipmentRequest(target.dataset.rejectB2bShipmentRequest);
  if (target.dataset.editSerial) editSerialDocument(target.dataset.editSerial);
  if (target.dataset.openCabinet) openCabinet(target.dataset.openCabinet);
  if (target.dataset.exportB2bReport) exportB2BReport(target.dataset.clientId, target.dataset.exportB2bReport);
  if (target.dataset.payInvoice) openPayment(target.dataset.payInvoice);
  if (target.dataset.cancelInvoice) cancelInvoice(target.dataset.cancelInvoice);
  if (target.dataset.lockInvoice) {
    const invoice = byId(state.invoices, target.dataset.lockInvoice);
    invoice.locked = true;
    addAudit(`Накладну ${invoice.id} закрито від редагування`);
    render();
  }
  if (target.dataset.verifySerial) {
    const serial = byId(state.serials, target.dataset.verifySerial);
    serial.erzStatus = "verified";
    addAudit(`ЄРЗ підтверджено для серії ${serial.serial}`);
    render();
  }
  if (target.dataset.sync) {
    const integration = byId(state.integrations, target.dataset.sync);
    integration.status = "ok";
    integration.lastSync = `${today} ${new Date().toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}`;
    addAudit(`${integration.name}: виконано ручний двосторонній обмін`, "system");
    render();
  }
  if (target.dataset.exportBasPurchases !== undefined) {
    exportBasPurchases();
  }
  if (target.dataset.exportOnePurchase) {
    exportBasPurchases([target.dataset.exportOnePurchase]);
  }
  if (target.dataset.markPurchaseExported) {
    markPurchaseExported(target.dataset.markPurchaseExported);
  }
  if (target.dataset.basImportDemo !== undefined) {
    const demo = {
      purchases: [
        {
          date: today,
          supplier: "BAS demo supplier",
          supplierDoc: `BAS-${String(Date.now()).slice(-5)}`,
          firmId: "vat",
          warehouseId: "wh-main",
          productId: "p-100",
          qty: 1,
          cost: 1500,
          currency: "USD",
          serials: [`BAS-DEMO-${String(Date.now()).slice(-5)}`],
          erzStatus: "pending",
          actual: true
        }
      ]
    };
    const form = $('[data-action="import-bas-purchases"]');
    const textarea = form?.querySelector('[name="basPayload"]');
    if (textarea) textarea.value = JSON.stringify(demo, null, 2);
  }
  if (target.dataset.type) {
    $$(".segmented button").forEach((button) => button.classList.toggle("active", button === target));
    const type = target.dataset.type;
    $("#products-body").innerHTML = productRows(type === "all" ? state.products : state.products.filter((product) => product.type === type));
  }
  if (target.dataset.createInventoryReport !== undefined) {
    const rows = filteredInventoryRows();
    const filter = state.inventoryFilters || {};
    const value = formatMoney(rows.reduce((sum, row) => sum + row.valueUAH, 0));
    const filterText = [
      filter.warehouseId ? `склад: ${warehouseName(filter.warehouseId)}` : "всі склади",
      filter.firmId ? `фірма: ${firmName(filter.firmId)}` : "всі фірми"
    ].join(" · ");
    openModal("Інвентаризаційний звіт", `<p class="notice">Сформовано на ${today}. Відбір: ${escapeHtml(filterText)}. Загальна вартість залишків: <strong>${value}</strong>. Рядків у звіті: ${rows.length}.</p>`);
  }
  if (target.dataset.printScope) {
    printScope(target.dataset.printScope);
    return;
  }
  if (target.id === "export-json") exportJson();
  if (target.id === "reset-demo") {
    if (isClientAuthenticated()) return alert("B2B кабінет не може скидати demo-дані CRM.");
    if (confirm("Скинути локальні demo-дані?")) {
      state = normalizeState(clone(seedState));
      saleDraft = { clientId: "", priceType: "", lines: [defaultSaleLine("p-200")] };
      purchaseDraft = { lines: [defaultPurchaseLine()] };
      marketplacePublicationDraft = { lines: [defaultMarketplacePublicationLine()] };
      b2bDraft = { shipmentProductId: "p-100", saleProductId: "p-100", saleClientId: "c-001", shipmentFirmId: "vat", saleFirmId: "vat" };
      clientPortalDraft = { productId: "", firmId: "", barcode: "", qty: 1, serialIds: [], permitNumber: "", permitDate: "" };
      paymentDraft = { source: "cash", kind: "invoice", clientId: "", invoiceId: "", firmId: "", terminalId: "", prro: "true" };
      productImagesDraft = [];
      render();
    }
  }
  if (target.dataset.closeModal !== undefined) {
    const backdrop = target.closest(".modal-backdrop");
    if (backdrop?.querySelector('[data-action="update-product"]')) productImagesDraft = [];
    backdrop?.remove();
  }
});

document.addEventListener("toggle", (event) => {
  if (event.target.matches?.("[data-rozetka-imported-orders-dropdown]")) {
    state.rozetkaImportedOrderFilters = {
      ...rozetkaImportedOrderFilter(),
      expanded: event.target.open
    };
    updateDropdownHint(event.target);
    saveState();
    return;
  }
  if (event.target.matches?.("[data-marketplace-publications-dropdown]")) {
    state.marketplacePublicationFilters = {
      ...marketplacePublicationFilter(),
      expanded: event.target.open
    };
    updateDropdownHint(event.target);
    saveState();
    return;
  }
  if (event.target.matches?.("[data-marketplace-orders-dropdown]")) {
    state.marketplaceOrderFilters = {
      ...marketplaceOrderFilter(),
      expanded: event.target.open
    };
    updateDropdownHint(event.target);
    saveState();
    return;
  }
  if (event.target.matches?.("[data-b2b-shipment-requests-dropdown]")) {
    state.b2bShipmentRequestFilters = {
      ...b2bShipmentRequestFilter(),
      expanded: event.target.open
    };
    updateDropdownHint(event.target);
    saveState();
    return;
  }
  if (event.target.matches?.("[data-b2b-responsible-storage-dropdown]")) {
    state.b2bResponsibleStorageFilters = {
      ...b2bResponsibleStorageFilter(),
      expanded: event.target.open
    };
    updateDropdownHint(event.target);
    saveState();
  }
}, true);

document.addEventListener("change", (event) => {
  if (event.target.matches("[data-product-photos]")) {
    handleProductPhotos(event.target);
  }
  const periodForm = event.target.closest("[data-period-filter]");
  if (periodForm) {
    const data = formData(periodForm);
    const key = data.key || periodForm.dataset.periodFilter;
    state.periodFilters[key] = {
      from: data.from || "2026-05-01",
      to: data.to || today
    };
    render();
    return;
  }
  const marketplaceOrderFilterForm = event.target.closest("[data-marketplace-order-filter]");
  if (marketplaceOrderFilterForm) {
    const data = formData(marketplaceOrderFilterForm);
    const current = marketplaceOrderFilter();
    state.marketplaceOrderFilters = {
      ...current,
      from: data.from || "",
      to: data.to || "",
      status: data.status || "",
      marketplace: data.marketplace || "",
      expanded: true
    };
    render();
    return;
  }
  const b2bShipmentRequestFilterForm = event.target.closest("[data-b2b-shipment-request-filter]");
  if (b2bShipmentRequestFilterForm && !event.target.matches("[data-b2b-shipment-request-search]")) {
    const data = formData(b2bShipmentRequestFilterForm);
    const current = b2bShipmentRequestFilter();
    state.b2bShipmentRequestFilters = {
      ...current,
      from: data.from || "",
      to: data.to || "",
      status: data.status || "",
      expanded: true
    };
    render();
    return;
  }
  const responsibleStorageFilterForm = event.target.closest("[data-b2b-responsible-storage-filter]");
  if (responsibleStorageFilterForm && !event.target.matches("[data-b2b-responsible-storage-search]")) {
    const data = formData(responsibleStorageFilterForm);
    const current = b2bResponsibleStorageFilter();
    state.b2bResponsibleStorageFilters = {
      ...current,
      from: data.from || "",
      to: data.to || "",
      clientId: data.clientId || "",
      productId: data.productId || "",
      expanded: true
    };
    render();
    return;
  }
  const rozetkaImportedOrderFilterForm = event.target.closest("[data-rozetka-imported-order-filter]");
  if (rozetkaImportedOrderFilterForm) {
    const data = formData(rozetkaImportedOrderFilterForm);
    const current = rozetkaImportedOrderFilter();
    state.rozetkaImportedOrderFilters = {
      ...current,
      from: data.from || "",
      to: data.to || "",
      status: data.status || "",
      expanded: true
    };
    render();
    return;
  }
  const inventoryFilterForm = event.target.closest("[data-inventory-filter]");
  if (inventoryFilterForm) {
    const data = formData(inventoryFilterForm);
    state.inventoryFilters = {
      warehouseId: data.warehouseId || "",
      firmId: data.firmId || ""
    };
    render();
    return;
  }
  const clientCatalogFilterForm = event.target.closest("[data-client-catalog-filters]");
  if (clientCatalogFilterForm) {
    const data = formData(clientCatalogFilterForm);
    clientCatalogFilters = {
      type: data.type || "",
      brand: data.brand || "",
      category: data.category || "",
      caliber: data.caliber || "",
      catalogTag: data.catalogTag || "",
      sort: data.sort || "name"
    };
    saveClientCatalogFilters();
    render();
    return;
  }
  if (event.target.matches("[data-client-request-qty]")) {
    const normalized = normalizeDecimalText(event.target.value);
    const id = event.target.dataset.clientRequestQty;
    if (normalized && parseDecimal(normalized, 0) <= 0) {
      const request = byId(state.b2bShipmentRequests || [], id);
      const cancelled = cancelClientB2BShipmentRequest(id, true, { zeroQty: true });
      if (!cancelled && request) event.target.value = request.qty;
      return;
    }
    updateClientB2BShipmentRequestQty(id, event.target.value);
    return;
  }
  if (event.target.matches("[data-payment-source], [data-payment-kind], [data-payment-client], [data-payment-invoice], [data-payment-firm], [data-payment-terminal], [data-payment-prro]")) {
    const form = event.target.closest('[data-action="create-payment"]');
    const data = form ? formData(form) : {};
    paymentDraft = {
      source: data.paymentSource || paymentDraft.source || "cash",
      kind: data.paymentKind || paymentDraft.kind || "invoice",
      clientId: data.clientId || "",
      invoiceId: data.invoiceId || "",
      firmId: data.firmId || "",
      terminalId: data.terminalId || "",
      prro: data.prro || "true"
    };
    render();
    return;
  }
  const reportBuilder = event.target.closest("[data-report-builder]");
  if (reportBuilder) {
    const data = formData(reportBuilder);
    state.reportBuilder = {
      reportId: data.reportId || state.reportBuilder.reportId,
      from: data.from || "2026-05-01",
      to: data.to || today,
      columns: selectedValues(reportBuilder.elements.columns),
      sortBy: data.sortBy || "date",
      sortDir: data.sortDir || "desc",
      groupBy: data.groupBy || ""
    };
    render();
    return;
  }
  if (event.target.id === "role-select") {
    render();
  }
  if (event.target.id === "manager-select") {
    render();
  }
  if (event.target.dataset.rolePermission) {
    updateRolePermission(event.target);
    return;
  }
  if (event.target.dataset.employeeRole) {
    if (!isAdmin()) {
      alert("Ролі працівників змінює тільки адміністратор.");
      render();
      return;
    }
    const employee = byId(state.employees, event.target.dataset.employeeRole);
    if (employee) {
      employee.roleName = event.target.value;
      if (employee.id === state.currentEmployeeId) {
        state.currentRole = employee.roleName;
      }
      addAudit(`Роль працівника ${employee.name} змінено на ${employee.roleName}`);
      render();
    }
  }
  if (event.target.matches("[data-sale-product]")) {
    const form = event.target.closest('[data-action="create-invoice"]');
    if (form) updateSaleDraftFromForm(form);
    const index = Number(event.target.dataset.saleLineIndex || 0);
    const product = byId(state.products, event.target.value);
    const price = product ? productSalePrice(product, saleDraft.priceType) : { amount: 0, currency: "UAH" };
    saleDraft.lines[index] = {
      ...(saleDraft.lines[index] || defaultSaleLine()),
      productId: event.target.value,
      barcode: product?.barcode || product?.qrCode || "",
      price: price.amount,
      currency: price.currency,
      serialIds: [],
      permitNumber: "",
      permitDate: ""
    };
    render();
  }
  if (event.target.matches("[data-sale-stock-context]")) {
    const form = event.target.closest('[data-action="create-invoice"]');
    if (form) updateSaleDraftFromForm(form);
    saleDraft.lines = saleDraftLines().map((line) => ({ ...line, serialIds: [] }));
    render();
    return;
  }
  if (event.target.matches("[data-sale-client]")) {
    const form = event.target.closest('[data-action="create-invoice"]');
    if (form) updateSaleDraftFromForm(form);
    const client = byId(state.clients, event.target.value);
    saleDraft.clientId = event.target.value;
    saleDraft.priceType = priceTypeById(client?.priceType)?.id || saleDraft.priceType || activeSalePriceTypes()[0]?.id || "";
    render();
  }
  if (event.target.matches("[data-sale-price-type]")) {
    const form = event.target.closest('[data-action="create-invoice"]');
    if (form) updateSaleDraftFromForm(form);
    saleDraft.priceType = event.target.value;
    saleDraft.lines = saleDraftLines().map((line) => {
      const product = byId(state.products, line.productId);
      const price = product ? productSalePrice(product, saleDraft.priceType) : { amount: line.price || 0, currency: line.currency || "UAH" };
      return { ...line, price: price.amount, currency: price.currency };
    });
    render();
  }
  if (event.target.matches("[data-sale-barcode]")) {
    const form = event.target.closest('[data-action="create-invoice"]');
    if (form) updateSaleDraftFromForm(form);
    const product = findProductByCode(event.target.value);
    const index = Number(event.target.dataset.saleLineIndex || 0);
    saleDraft.lines[index] = { ...(saleDraft.lines[index] || defaultSaleLine()), barcode: event.target.value };
    if (product) {
      const price = productSalePrice(product, saleDraft.priceType);
      saleDraft.lines[index] = { ...saleDraft.lines[index], productId: product.id, price: price.amount, currency: price.currency, serialIds: [] };
      render();
    }
  }
  if (event.target.matches("[data-purchase-product]")) {
    const form = event.target.closest('[data-action="create-purchase"]');
    if (form) updatePurchaseDraftFromForm(form);
    const index = Number(event.target.dataset.purchaseLineIndex || 0);
    const product = byId(state.products, event.target.value);
    const lines = purchaseDraftLines();
    lines[index] = {
      ...(lines[index] || defaultPurchaseLine()),
      productId: event.target.value,
      barcode: product?.barcode || product?.qrCode || "",
      cost: product?.cost || 0,
      currency: product?.costCurrency || "UAH",
      erzStatus: "pending",
      actual: "true",
      serials: ""
    };
    purchaseDraft.lines = lines;
    render();
    return;
  }
  if (event.target.matches("[data-purchase-barcode]")) {
    const form = event.target.closest('[data-action="create-purchase"]');
    if (form) updatePurchaseDraftFromForm(form);
    const product = findProductByCode(event.target.value);
    const index = Number(event.target.dataset.purchaseLineIndex || 0);
    const lines = purchaseDraftLines();
    lines[index] = {
      ...(lines[index] || defaultPurchaseLine()),
      barcode: event.target.value
    };
    if (product) {
      lines[index] = {
        ...lines[index],
        productId: product.id,
        cost: product.cost || 0,
        currency: product.costCurrency || "UAH",
        erzStatus: "pending",
        actual: "true",
        serials: ""
      };
      purchaseDraft.lines = lines;
      render();
      return;
    }
    purchaseDraft.lines = lines;
    return;
  }
  if (event.target.matches("[data-marketplace-publication-product]")) {
    const form = event.target.closest('[data-action="create-marketplace-publication"]');
    if (form) updateMarketplacePublicationDraftFromForm(form);
    const index = Number(event.target.dataset.marketplacePublicationLineIndex || 0);
    const product = byId(state.products, event.target.value);
    const price = product ? productSalePrice(product, marketplacePriceTypeId()) : { amount: 0, currency: "UAH" };
    const lines = marketplacePublicationDraftLines();
    lines[index] = {
      ...(lines[index] || defaultMarketplacePublicationLine()),
      productId: event.target.value,
      sku: product?.supplierSku || product?.internalCode || "",
      title: product ? `${product.brand} ${product.model}` : "",
      price: price.amount || product?.price || 0,
      currency: price.currency || product?.currency || "UAH"
    };
    marketplacePublicationDraft.lines = lines;
    render();
    return;
  }
  if (event.target.matches("[data-b2b-shipment-product]")) {
    const product = byId(state.products, event.target.value);
    b2bDraft = { ...b2bDraft, shipmentProductId: event.target.value, shipmentBarcode: product?.barcode || product?.qrCode || "" };
    render();
  }
  if (event.target.matches("[data-b2b-shipment-firm]")) {
    b2bDraft = { ...b2bDraft, shipmentFirmId: event.target.value };
    render();
  }
  if (event.target.matches("[data-b2b-shipment-barcode]")) {
    const product = findProductByCode(event.target.value);
    b2bDraft = { ...b2bDraft, shipmentBarcode: event.target.value };
    if (product) {
      b2bDraft.shipmentProductId = product.id;
      render();
    }
  }
  if (event.target.matches("[data-b2b-sale-client]")) {
    b2bDraft = { ...b2bDraft, saleClientId: event.target.value };
    render();
  }
  if (event.target.matches("[data-b2b-sale-product]")) {
    const product = byId(state.products, event.target.value);
    b2bDraft = { ...b2bDraft, saleProductId: event.target.value, saleBarcode: product?.barcode || product?.qrCode || "" };
    render();
  }
  if (event.target.matches("[data-b2b-sale-firm]")) {
    b2bDraft = { ...b2bDraft, saleFirmId: event.target.value };
    render();
  }
  if (event.target.matches("[data-b2b-sale-barcode]")) {
    const product = findProductByCode(event.target.value);
    b2bDraft = { ...b2bDraft, saleBarcode: event.target.value };
    if (product) {
      b2bDraft.saleProductId = product.id;
      render();
    }
  }
  if (event.target.matches("[data-b2b-request-rebuild]")) {
    const form = event.target.closest('[data-action="approve-b2b-shipment-request"]');
    const request = form ? updateB2BShipmentRequestDraftFromForm(form) : null;
    if (request) openB2BShipmentRequest(request.id);
    return;
  }
  if (event.target.matches("[data-client-portal-product]")) {
    const product = byId(state.products, event.target.value);
    clientPortalDraft = { ...clientPortalDraft, productId: event.target.value, barcode: product?.barcode || product?.qrCode || "", serialIds: [], firmId: "" };
    render();
  }
  if (event.target.matches("[data-client-portal-firm]")) {
    clientPortalDraft = { ...clientPortalDraft, firmId: event.target.value, serialIds: [] };
    render();
  }
  if (event.target.matches("[data-client-portal-barcode]")) {
    const product = findProductByCode(event.target.value);
    clientPortalDraft = { ...clientPortalDraft, barcode: event.target.value };
    if (product && clientStorageRows(authenticatedClient()?.id || "").some((row) => (row.product?.id || row.productId) === product.id)) {
      clientPortalDraft.productId = product.id;
      clientPortalDraft.serialIds = [];
      render();
    }
  }
  const saleForm = event.target.closest('[data-action="create-invoice"]');
  if (saleForm && !event.target.matches("[data-sale-product]")) {
    updateSaleDraftFromForm(saleForm);
  }
  const purchaseForm = event.target.closest('[data-action="create-purchase"]');
  if (purchaseForm && !event.target.matches("[data-purchase-product], [data-purchase-barcode]")) {
    updatePurchaseDraftFromForm(purchaseForm);
  }
  const marketplacePublicationForm = event.target.closest('[data-action="create-marketplace-publication"]');
  if (marketplacePublicationForm && !event.target.matches("[data-marketplace-publication-product]")) {
    updateMarketplacePublicationDraftFromForm(marketplacePublicationForm);
  }
  const portalForm = event.target.closest('[data-action="create-client-portal-sale"]');
  if (portalForm && !event.target.matches("[data-client-portal-product]")) {
    const data = formData(portalForm);
    clientPortalDraft = {
      productId: data.productId,
      firmId: data.firmId,
      barcode: data.barcode,
      qty: data.qty,
      serialIds: selectedValues(portalForm.elements.serialIds),
      permitNumber: data.permitNumber,
      permitDate: data.permitDate
    };
  }
});

document.addEventListener("input", (event) => {
  if (event.target.matches("[data-b2b-responsible-storage-search]")) {
    const details = document.querySelector("[data-b2b-responsible-storage-dropdown]");
    state.b2bResponsibleStorageFilters = {
      ...b2bResponsibleStorageFilter(),
      search: event.target.value,
      expanded: details?.open || Boolean(event.target.value.trim())
    };
    applyResponsibleStorageSearch();
    saveState();
    return;
  }
  if (event.target.matches("[data-b2b-shipment-request-search]")) {
    const details = document.querySelector("[data-b2b-shipment-requests-dropdown]");
    state.b2bShipmentRequestFilters = {
      ...b2bShipmentRequestFilter(),
      search: event.target.value,
      expanded: details?.open || Boolean(event.target.value.trim())
    };
    applyB2BShipmentRequestSearch();
    saveState();
    return;
  }
  if (event.target.matches("[data-marketplace-publication-search]")) {
    const details = document.querySelector("[data-marketplace-publications-dropdown]");
    state.marketplacePublicationFilters = {
      ...marketplacePublicationFilter(),
      search: event.target.value,
      expanded: details?.open || Boolean(event.target.value.trim())
    };
    applyMarketplacePublicationSearch();
    saveState();
    return;
  }
  if (event.target.matches("[data-client-request-qty]")) {
    const normalized = normalizeDecimalText(event.target.value);
    if (normalized && parseDecimal(normalized, 0) > 0) {
      updateClientB2BShipmentRequestQty(event.target.dataset.clientRequestQty, event.target.value, { silent: true });
    }
    return;
  }
  const form = event.target.closest('[data-action="create-invoice"]');
  if (form) {
    updateSaleDraftFromForm(form);
    return;
  }
  const purchaseForm = event.target.closest('[data-action="create-purchase"]');
  if (purchaseForm) {
    updatePurchaseDraftFromForm(purchaseForm);
    return;
  }
  const marketplacePublicationForm = event.target.closest('[data-action="create-marketplace-publication"]');
  if (marketplacePublicationForm) {
    updateMarketplacePublicationDraftFromForm(marketplacePublicationForm);
    return;
  }
  const portalForm = event.target.closest('[data-action="create-client-portal-sale"]');
  if (!portalForm) return;
  const data = formData(portalForm);
  clientPortalDraft = {
    productId: data.productId,
    firmId: data.firmId,
    barcode: data.barcode,
    qty: data.qty,
    serialIds: selectedValues(portalForm.elements.serialIds),
    permitNumber: data.permitNumber,
    permitDate: data.permitDate
  };
});

document.addEventListener("keydown", (event) => {
  if (!event.target.matches("[data-client-request-qty]") || event.key !== "Enter") return;
  event.preventDefault();
  updateClientB2BShipmentRequestQty(event.target.dataset.clientRequestQty, event.target.value);
});

document.addEventListener("submit", (event) => {
  const form = event.target.closest("form[data-action]");
  if (!form) return;
  event.preventDefault();
  const action = form.dataset.action;
  if (action === "login") {
    loginUser(form);
    return;
  }
  if (action === "client-login") {
    loginClient(form);
    return;
  }
  if (action === "create-invoice") createInvoice(form);
  if (action === "update-invoice") updateInvoiceDocument(form);
  if (action === "create-responsible-shipment") createResponsibleShipment(form);
  if (action === "create-b2b-shipment-request") createB2BShipmentRequest(form);
  if (action === "approve-b2b-shipment-request") approveB2BShipmentRequest(form);
  if (action === "update-responsible-doc") updateResponsibleStorageDoc(form);
  if (action === "create-b2b-client-sale") createB2BClientSale(form);
  if (action === "create-client-portal-sale") createB2BClientSale(form, { clientPortal: true });
  if (action === "create-purchase") createPurchase(form);
  if (action === "update-purchase") updatePurchaseDocument(form);
  if (action === "create-product") createProductCard(form);
  if (action === "update-product") updateProductCard(form);
  if (action === "create-client") createClientCard(form);
  if (action === "update-client") updateClientCard(form);
  if (action === "create-employee") createEmployee(form);
  if (action === "create-warehouse") createWarehouse(form);
  if (action === "create-variant-dictionary-item") createVariantDictionaryItem(form);
  if (action === "create-catalog-parameter") createCatalogParameter(form);
  if (action === "create-cash-article") createCashArticle(form);
  if (action === "create-expense-article") createExpenseArticle(form);
  if (action === "create-payment-terminal") createPaymentTerminal(form);
  if (action === "create-price-type") createPriceType(form);
  if (action === "create-serial") createSerial(form);
  if (action === "update-serial") updateSerialDocument(form);
  if (action === "create-payment") createPayment(form);
  if (action === "update-payment") updatePaymentDocument(form);
  if (action === "create-expense") createExpense(form);
  if (action === "update-expense") updateExpenseDocument(form);
  if (action === "create-payable") createPayable(form);
  if (action === "update-payable") updatePayableDocument(form);
  if (action === "create-marketplace-publication") createMarketplacePublication(form);
  if (action === "update-marketplace-publication") updateMarketplacePublication(form);
  if (action === "update-marketplace-order") updateMarketplaceOrderDocument(form);
  if (action === "rozetka-import-goods") importRozetkaGoodsToCatalog(form);
  if (action === "rozetka-import-orders") importRozetkaOrdersToCrm(form);
  if (action === "import-marketplace-catalog") importMarketplaceCatalog(form);
  if (action === "import-bas-purchases") importBasPurchases(form);
  if (action === "update-rates") updateRates(form);
  if (action === "update-closed-day") updateClosedDay(form);
});

render();
