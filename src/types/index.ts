export type ApiResponse<T> = {
  status: number;
  message: string;
  data: T;
};

export type ImageRef = {
  _id: string;
  url: string;
  name?: string;
  alt?: string;
};

export type Category = {
  _id: string;
  categoryName: string;
  slug: string;
  description?: string;
  level?: number;
  image?: ImageRef | null;
};

export type Brand = {
  _id: string;
  brandName: string;
  image?: ImageRef | null;
};

export type Attribute = {
  _id: string;
  name: string;
  values: string[];
  status: 'active' | 'inactive';
};

export type Variant = {
  _id: string;
  productId: string;
  sku: string;
  attributes: { name: string; value: string }[];
  price: number;
  buyPrice?: number;
  stock: number;
  status: 'active' | 'inactive';
  image?: ImageRef | null;
};

export type DashboardAnalytics = {
  period: 'week' | 'month' | 'year';
  income: number;
  expense: number;
  profit: number;
  productCost: number;
  staffExpense: number;
  manualExpense: number;
  runningOffers: number;
  activeCoupons: number;
  totalUsers: number;
  totalStaff: number;
  salesChart: { label: string; sales: number; orders: number }[];
};

export type ExpenseTypeRecord = {
  _id: string;
  name: string;
  isActive: boolean;
};

export type ExpenseRecord = {
  _id: string;
  typeId: ExpenseTypeRecord | string;
  description: string;
  amount: number;
  imageId?: { _id: string; url: string; alt?: string; name?: string } | string;
  expenseDate?: string;
  createdAt?: string;
  createdBy?: { name?: string; email?: string } | string;
};

export type ProductOfferType = 'none' | 'percent' | 'fixed';

export type Product = {
  _id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  status: 'draft' | 'active' | 'inactive';
  brand?: Brand | null;
  category?: Category | null;
  thumbnail?: ImageRef | null;
  gallery?: ImageRef[];
  attributes?: Attribute[];
  minPrice?: number | null;
  maxPrice?: number | null;
  totalStock?: number;
  averageRating?: number;
  variants?: Variant[];
  seoTitle?: string;
  seoDescription?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: ImageRef | null;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  offerType?: ProductOfferType;
  offerValue?: number;
  createdAt?: string;
};

export type ProductListResult = {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type AuthUser = {
  userId: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'MANAGER' | 'SELLER';
  name: string;
};

export type AuthResult = {
  accessToken: string;
  token: AuthUser;
};

export type CartLine = {
  _id: string;
  productId: Product | string;
  variantId?: Variant | string;
  quantity: number;
  isSelected: boolean;
};

export type Cart = {
  _id: string;
  userId: string;
  items: CartLine[];
};

export type CheckoutPreview = {
  currency: string;
  lines: {
    lineId: string;
    productId: string;
    variantId: string;
    quantity: number;
    unitPrice: number;
    isSelected: boolean;
  }[];
  itemsSubtotal: number;
  coupon: { discountAmount: number } | null;
  totalAmount: number;
};

export type Address = {
  _id: string;
  name: string;
  phone: string;
  country: string;
  state: string;
  city: string;
  thana?: string;
  localLocation?: string;
  isDefault?: boolean;
};

export type OrderFulfillmentStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'return_requested'
  | 'returned';

export type OrderReturnReason =
  | 'wrong_item'
  | 'damaged'
  | 'defective'
  | 'not_as_described'
  | 'changed_mind'
  | 'other';

export type OrderLineItem = {
  productId?: { _id: string; title?: string; slug?: string } | string;
  variantId?: { _id: string; sku?: string; price?: number } | string;
  productTitle: string;
  productSlug?: string;
  sku?: string;
  unitPrice: number;
  quantity: number;
  lineSubtotal: number;
};

export type Order = {
  _id: string;
  orderNumber: string;
  status: OrderFulfillmentStatus | string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: number;
  itemsSubtotal?: number;
  couponDiscountAmount?: number;
  couponCode?: string;
  currency?: string;
  channel?: string;
  deliveryMode?: string;
  createdAt?: string;
  updatedAt?: string;
  items?: OrderLineItem[];
  addressSnapshot?: {
    name: string;
    phone: string;
    country: string;
    state: string;
    city: string;
    thana: string;
    localLocation: string;
  };
  guestContact?: { name: string; phone: string };
  userId?: { name?: string; email?: string; phone?: string } | string;
  placedByAdminId?: { name?: string; email?: string } | string;
  adminNotes?: string;
  statusHistory?: OrderStatusHistoryEntry[];
  returnRequest?: {
    reason: OrderReturnReason;
    description: string;
    requestedAt?: string;
  };
};

export type OrderStatusHistoryEntry = {
  from: OrderFulfillmentStatus | string;
  to: OrderFulfillmentStatus | string;
  comment?: string;
  changedBy?: { name?: string; email?: string } | string;
  changedAt?: string;
};

export type Coupon = {
  _id: string;
  code: string;
  discountType: 'fixed' | 'percent';
  discountValue: number;
  currency?: string;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  expiresAt?: string;
  usageLimit?: number;
  usedCount?: number;
  isActive: boolean;
  productIds?: Array<{ _id: string; title: string; slug?: string } | string>;
};

export type UserProfileImage = {
  _id: string;
  url: string;
  alt?: string;
  name?: string;
};

export type UserProfile = {
  _id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'MANAGER' | 'SELLER';
  phone?: string;
  monthlySalary?: number;
  profileImage?: UserProfileImage | string;
  nid?: string;
};

export type StaffPayrollBonusType = 'fixed' | 'percent';

export type StaffPayroll = {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    role: string;
    monthlySalary?: number;
  };
  year: number;
  month: number;
  monthlySalary: number;
  presentDays: number;
  workingDaysInMonth: number;
  calculatedPay: number;
  bonusType?: StaffPayrollBonusType;
  bonusValue?: number;
  bonusAmount: number;
  totalPay: number;
  workRating?: number;
  notes?: string;
  createdAt?: string;
};

export type StaffPayrollProfile = {
  staff: UserProfile;
  records: StaffPayroll[];
  averageRating: number | null;
  totalEarned: number;
  totalBonus: number;
};

export type StaffPayrollHistory = {
  staff: UserProfile;
  records: Omit<StaffPayroll, 'userId'>[];
};

export type StaffSettings = {
  workingDaysPerMonth: number;
};

export type OrderSettings = {
  loggedInCheckout: boolean;
  guestQuickOrder: boolean;
  couponScope: 'all_products' | 'specific_products';
};

export type Collection = {
  _id: string;
  name: string;
  slug: string;
  banner?: ImageRef | null;
  products?: Product[];
  showBannerOnHome: boolean;
  sortOrder?: number;
  isActive?: boolean;
};

export type HeroStyle = 'split_one' | 'split_two' | 'slider_only';

export type HeroLinkedProduct = {
  _id: string;
  title: string;
  slug: string;
  status?: string;
};

export type HeroSlide = {
  image: ImageRef | null;
  product: HeroLinkedProduct | null;
};

export type HeroSideItem = {
  image: ImageRef | null;
  product: HeroLinkedProduct | null;
};

export type HomeHeroSettings = {
  style: HeroStyle;
  isActive: boolean;
  slides: HeroSlide[];
  sideItems: HeroSideItem[];
};

export type BrandingSettings = {
  siteName: string;
  logo: ImageRef | null;
};
