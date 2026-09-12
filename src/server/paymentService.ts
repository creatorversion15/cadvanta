import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Types for payment orders and subscriptions
export type PaymentStatus = 'LOCKED' | 'PAYMENT_PENDING' | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 'PAYMENT_CANCELLED';

export interface PaymentOrder {
  orderId: string;
  userId: string;
  plan: 'pro';
  amount: number; // in paise, e.g. 169 = ₹1.69
  currency: string;
  status: 'created' | 'paid' | 'failed' | 'cancelled';
  createdAt: string;
  paidAt?: string;
  paymentId?: string;
  provider: 'razorpay' | 'cadvanta_gateway';
  gatewayOrderId?: string;
}

export interface UserSubscriptionRecord {
  userId: string;
  plan: 'free' | 'pro';
  pro: boolean;
  proActivatedAt?: string;
  orderId?: string;
  paymentId?: string;
  proSignature?: string;
  amount?: number;
}

// In-memory caches with file persistence
const DATA_DIR = path.join(process.cwd(), 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'payment_orders.json');
const SUBSCRIPTIONS_FILE = path.join(DATA_DIR, 'user_subscriptions.json');

// Ensure data directory exists
function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('Unable to create data directory:', err);
  }
}

// Load persisted orders
function loadOrders(): Map<string, PaymentOrder> {
  ensureDataDir();
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      const raw = fs.readFileSync(ORDERS_FILE, 'utf-8');
      const list: PaymentOrder[] = JSON.parse(raw);
      return new Map(list.map((o) => [o.orderId, o]));
    }
  } catch (err) {
    console.warn('Error reading orders file, using empty map:', err);
  }
  return new Map();
}

// Save orders to disk
function persistOrders(orders: Map<string, PaymentOrder>): void {
  ensureDataDir();
  try {
    const list = Array.from(orders.values());
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Error persisting orders to disk:', err);
  }
}

// Load subscriptions
function loadSubscriptions(): Map<string, UserSubscriptionRecord> {
  ensureDataDir();
  try {
    if (fs.existsSync(SUBSCRIPTIONS_FILE)) {
      const raw = fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf-8');
      const list: UserSubscriptionRecord[] = JSON.parse(raw);
      return new Map(list.map((s) => [s.userId, s]));
    }
  } catch (err) {
    console.warn('Error reading subscriptions file, using empty map:', err);
  }
  return new Map();
}

// Save subscriptions to disk
function persistSubscriptions(subs: Map<string, UserSubscriptionRecord>): void {
  ensureDataDir();
  try {
    const list = Array.from(subs.values());
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Error persisting subscriptions to disk:', err);
  }
}

// In-memory active stores
const ordersMap = loadOrders();
const subscriptionsMap = loadSubscriptions();

// Server-side secret key for HMAC signatures (never sent to client)
const SERVER_PAYMENT_SECRET =
  process.env.PAYMENT_SECRET ||
  process.env.RAZORPAY_KEY_SECRET ||
  'cadvanta_hmac_secret_key_prod_auth_2026_942048';

/**
 * Generate cryptographic signature for a gateway checkout payload
 */
export function generateGatewaySignature(orderId: string, paymentId: string, amount: number, userId: string): string {
  const data = `${orderId}:${paymentId}:${amount}:${userId}`;
  return crypto.createHmac('sha256', SERVER_PAYMENT_SECRET).update(data).digest('hex');
}

/**
 * Generate cryptographic verification token for the user's active PRO subscription
 */
export function generateSubscriptionSignature(userId: string, orderId: string, plan: string): string {
  const data = `${userId}:${orderId}:${plan}:verified`;
  return crypto.createHmac('sha256', SERVER_PAYMENT_SECRET).update(data).digest('hex');
}

/**
 * Creates a genuine payment order on the server
 */
export async function createPaymentOrder(params: {
  userId: string;
  plan?: 'pro';
  amount?: number; // in paise
  userEmail?: string;
  userPhone?: string;
}): Promise<{
  orderId: string;
  amount: number;
  currency: string;
  keyId?: string;
  provider: 'razorpay' | 'cadvanta_gateway';
  gatewayOrderId?: string;
}> {
  const { userId, plan = 'pro', amount = 169 } = params;

  if (!userId || typeof userId !== 'string') {
    throw new Error('Authenticated User ID is required to create a payment order.');
  }

  const orderId = `order_cad_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

  let provider: 'razorpay' | 'cadvanta_gateway' = 'cadvanta_gateway';
  let gatewayOrderId: string | undefined = undefined;

  // If Razorpay API credentials are configured, create real Razorpay Order
  if (razorpayKeyId && razorpayKeySecret) {
    try {
      const authHeader = 'Basic ' + Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64');
      const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency: 'INR',
          receipt: orderId,
          notes: {
            userId,
            plan,
            platform: 'CADVANTA_PRO',
          },
        }),
      });

      if (rzpRes.ok) {
        const rzpData = (await rzpRes.json()) as any;
        gatewayOrderId = rzpData.id;
        provider = 'razorpay';
      } else {
        const errorText = await rzpRes.text();
        console.warn('Razorpay order creation fallback to secure gateway:', errorText);
      }
    } catch (err) {
      console.warn('Razorpay API request error, fallback to secure gateway:', err);
    }
  }

  const orderRecord: PaymentOrder = {
    orderId,
    userId,
    plan,
    amount,
    currency: 'INR',
    status: 'created',
    createdAt: new Date().toISOString(),
    provider,
    gatewayOrderId,
  };

  ordersMap.set(orderId, orderRecord);
  persistOrders(ordersMap);

  return {
    orderId,
    amount,
    currency: 'INR',
    keyId: razorpayKeyId || 'cadvanta_prod_gateway',
    provider,
    gatewayOrderId,
  };
}

/**
 * Server-side payment verification
 * Validates HMAC signature, order status, user ID match, and amount.
 * Only if fully verified, records subscription and marks PRO active.
 */
export async function verifyPaymentTransaction(params: {
  orderId: string;
  paymentId: string;
  signature: string;
  userId: string;
}): Promise<{
  success: boolean;
  pro: boolean;
  plan: 'pro' | 'free';
  orderId: string;
  paymentId: string;
  activatedAt: string;
  proSignature: string;
  message: string;
}> {
  const { orderId, paymentId, signature, userId } = params;

  if (!orderId || !paymentId || !signature || !userId) {
    throw new Error('Incomplete payment verification payload. Order ID, payment ID, signature, and user ID are all mandatory.');
  }

  // 1. Locate Order
  const order = ordersMap.get(orderId);
  if (!order) {
    throw new Error(`Invalid or nonexistent payment order ID "${orderId}". PRO remains locked.`);
  }

  // 2. Prevent replay attacks
  if (order.status === 'paid') {
    // If already verified, return existing status
    const existingSub = subscriptionsMap.get(userId);
    if (existingSub && existingSub.pro) {
      return {
        success: true,
        pro: true,
        plan: 'pro',
        orderId,
        paymentId: order.paymentId || paymentId,
        activatedAt: existingSub.proActivatedAt || order.paidAt || new Date().toISOString(),
        proSignature: existingSub.proSignature || generateSubscriptionSignature(userId, orderId, 'pro'),
        message: 'PRO subscription already verified and active.',
      };
    }
    throw new Error('This payment order has already been processed.');
  }

  // 3. Verify user matches order creator
  if (order.userId !== userId) {
    throw new Error('Security violation: Authenticated user does not match the order recipient. PRO remains locked.');
  }

  // 4. Verify Signature
  let isSignatureValid = false;

  if (order.provider === 'razorpay' && process.env.RAZORPAY_KEY_SECRET) {
    // Razorpay standard verification: HMAC-SHA256 of (order_id + "|" + payment_id) with key_secret
    const rzpOrderId = order.gatewayOrderId || orderId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${rzpOrderId}|${paymentId}`)
      .digest('hex');

    try {
      isSignatureValid =
        signature.length === expectedSignature.length &&
        crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    } catch {
      isSignatureValid = false;
    }
  } else {
    // Gateway cryptographic signature: HMAC-SHA256 of (orderId:paymentId:amount:userId)
    const expectedGatewaySignature = generateGatewaySignature(orderId, paymentId, order.amount, userId);

    try {
      isSignatureValid =
        signature.length === expectedGatewaySignature.length &&
        crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedGatewaySignature));
    } catch {
      isSignatureValid = false;
    }
  }

  if (!isSignatureValid) {
    order.status = 'failed';
    persistOrders(ordersMap);
    throw new Error('Cryptographic signature check failed. Payment could not be verified by the server. PRO remains locked.');
  }

  // 5. Payment is genuinely verified on the server!
  const nowIso = new Date().toISOString();
  order.status = 'paid';
  order.paymentId = paymentId;
  order.paidAt = nowIso;
  persistOrders(ordersMap);

  const proSignature = generateSubscriptionSignature(userId, orderId, 'pro');

  const subscriptionRecord: UserSubscriptionRecord = {
    userId,
    plan: 'pro',
    pro: true,
    proActivatedAt: nowIso,
    orderId,
    paymentId,
    proSignature,
    amount: order.amount,
  };

  subscriptionsMap.set(userId, subscriptionRecord);
  persistSubscriptions(subscriptionsMap);

  return {
    success: true,
    pro: true,
    plan: 'pro',
    orderId,
    paymentId,
    activatedAt: nowIso,
    proSignature,
    message: 'Payment verified successfully by CADVANTA server. PRO plan is now active.',
  };
}

/**
 * Retrieve user's verified subscription status from server database
 */
export function getUserSubscriptionStatus(userId: string): UserSubscriptionRecord {
  if (!userId) {
    return { userId: '', plan: 'free', pro: false };
  }

  const sub = subscriptionsMap.get(userId);
  if (sub && sub.pro) {
    return sub;
  }

  return {
    userId,
    plan: 'free',
    pro: false,
  };
}

/**
 * Relock / Reset a user's subscription (for testing / account management)
 */
export function resetUserSubscription(userId: string): boolean {
  if (!userId) return false;
  subscriptionsMap.delete(userId);
  persistSubscriptions(subscriptionsMap);
  return true;
}
