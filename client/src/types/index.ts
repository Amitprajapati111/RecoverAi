export interface User {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'ANALYST' | 'SUPPORT' | 'VIEWER';
  merchantId?: string;
}

export interface Merchant {
  id: string;
  businessName: string;
  email: string;
  phone?: string;
  currency: string;
  timezone: string;
  razorpayEnvironment: 'test' | 'live';
  razorpayKeyId?: string;
  recoverySettings?: {
    enabled: boolean;
    maxAttempts: number;
    cooldownMinutes: number;
    requireApprovalAboveAmount: number;
    minimumRecoveryProbability: number;
  };
  notificationSettings?: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  featureFlags?: {
    enableAI: boolean;
    enableAutoRecovery: boolean;
    enablePaymentLinks: boolean;
    enableNotifications: boolean;
    enableHinglish: boolean;
  };
}

export interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  totalRevenue: number;
  averageOrderValue: number;
  recoveryScore: number;
  customerSegment: 'NEW' | 'REGULAR' | 'LOYAL' | 'HIGH_VALUE' | 'AT_RISK' | 'DORMANT';
  createdAt: string;
}

export interface Payment {
  _id: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  amount: number;
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  method?: string;
  failureReason?: string;
  failureCode?: string;
  failureType?: string;
  customerId?: Customer;
  createdAt: string;
  failedAt?: string;
}

export interface RecoveryCase {
  _id: string;
  paymentId: Payment;
  customerId?: Customer;
  amountAtRisk: number;
  recoveryProbability: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'NEW' | 'ANALYZING' | 'RECOVERABLE' | 'NOT_RECOVERABLE' | 'IN_RECOVERY' | 'RECOVERED' | 'EXHAUSTED' | 'ESCALATED' | 'STOPPED';
  currentStage: string;
  recommendedAction?: string;
  selectedAction?: string;
  reasoning?: string;
  attemptCount: number;
  maxAttempts: number;
  recoveredAmount?: number;
  requiresHumanApproval: boolean;
  isSimulated?: boolean;
  createdAt: string;
}

export interface AiDecision {
  _id: string;
  recoveryCaseId: RecoveryCase;
  model: string;
  confidence: number;
  reasoning: string;
  decision: {
    recoverable: boolean;
    recoveryProbability: number;
    riskLevel: string;
    priority: string;
    recommendedAction: string;
    delayMinutes: number;
    maxAttempts: number;
    reason: string;
    decisionFactors: string[];
    requiresHumanApproval: boolean;
    stopConditions: string[];
  };
  policyResult: {
    approved: boolean;
    blockedReason?: string;
    requiresApproval?: boolean;
  };
  latencyMs: number;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  actorType: 'USER' | 'AI' | 'SYSTEM' | 'RAZORPAY';
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: any;
  after?: any;
  reason?: string;
  createdAt: string;
}

export interface DashboardKPIs {
  revenueAtRisk: number;
  recoverableRevenue: number;
  recoveredRevenue: number;
  recoveryRate: number;
  failedPayments: number;
  totalPayments: number;
  successfulPayments: number;
  aiActions: number;
  humanEscalations: number;
  periodDays: number;
}
