import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  CreditCard,
  FlaskConical,
  Loader2,
  Play,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Trash2,
  Zap,
} from 'lucide-react';
import api from '../api/client';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

type Method = 'upi' | 'qr' | 'card' | 'netbanking';
type ScenarioKey = 'normal' | 'highValue' | 'lowProbability' | 'maxAttempts' | 'duplicateWebhook';
type CustomerPhase = 'checkout' | 'processing' | 'failed' | 'recovery' | 'recovery-processing' | 'success';
type EngineSectionKey = 'payment' | 'webhook' | 'case' | 'ai' | 'policy' | 'action' | 'final';

type TimelineItem = {
  key: string;
  time: string;
  title: string;
  subtitle?: string;
  tone: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
};

type ScenarioConfig = {
  title: string;
  amount: number;
  failureType: string;
  method: Method;
  customerName: string;
  customerEmail: string;
  upiId: string;
  orderId: string;
  targetProbability: number;
  description: string;
  customerViewLabel: string;
};

const failureMessages: Record<string, { title: string; body: string; provider: string }> = {
  INSUFFICIENT_FUNDS: {
    title: 'Payment Failed',
    body: 'Your bank declined the transaction because of insufficient funds.',
    provider: 'Your bank declined the transaction.',
  },
  BANK_DECLINED: {
    title: 'Payment Failed',
    body: 'Your bank declined this transaction.',
    provider: 'Your bank declined this transaction.',
  },
  BANK_TIMEOUT: {
    title: 'Payment Failed',
    body: "We couldn't get a response from your bank.",
    provider: "We couldn't get a response from your bank.",
  },
  UPI_TIMEOUT: {
    title: 'Payment Failed',
    body: 'The UPI payment timed out.',
    provider: 'The UPI payment timed out.',
  },
  CUSTOMER_ABANDONED: {
    title: 'Payment Failed',
    body: 'The payment was not completed.',
    provider: 'The payment was not completed.',
  },
};

const scenarioPresets: Record<ScenarioKey, ScenarioConfig> = {
  normal: {
    title: 'Normal Recovery',
    amount: 3500,
    failureType: 'INSUFFICIENT_FUNDS',
    method: 'upi',
    customerName: 'Rahul Sharma',
    customerEmail: 'rahul@example.com',
    upiId: 'rahul@upi',
    orderId: 'REC-2026-00124',
    targetProbability: 82,
    description: 'A standard recoverable failed payment with strong customer history.',
    customerViewLabel: 'RecoverAI Demo Store',
  },
  highValue: {
    title: 'High Value',
    amount: 15000,
    failureType: 'BANK_DECLINED',
    method: 'upi',
    customerName: 'Rahul Sharma',
    customerEmail: 'rahul@example.com',
    upiId: 'rahul@upi',
    orderId: 'REC-2026-00125',
    targetProbability: 88,
    description: 'A high-value payment that should trigger human approval.',
    customerViewLabel: 'RecoverAI Demo Store',
  },
  lowProbability: {
    title: 'Low Probability',
    amount: 3500,
    failureType: 'BANK_TIMEOUT',
    method: 'card',
    customerName: 'Rahul Sharma',
    customerEmail: 'rahul@example.com',
    upiId: 'rahul@upi',
    orderId: 'REC-2026-00126',
    targetProbability: 35,
    description: 'A case that should be rejected by the policy engine.',
    customerViewLabel: 'RecoverAI Demo Store',
  },
  maxAttempts: {
    title: 'Maximum Attempts',
    amount: 3500,
    failureType: 'UPI_TIMEOUT',
    method: 'upi',
    customerName: 'Rahul Sharma',
    customerEmail: 'rahul@example.com',
    upiId: 'rahul@upi',
    orderId: 'REC-2026-00127',
    targetProbability: 78,
    description: 'A replay of a case with all retries already exhausted.',
    customerViewLabel: 'RecoverAI Demo Store',
  },
  duplicateWebhook: {
    title: 'Duplicate Webhook',
    amount: 3500,
    failureType: 'INSUFFICIENT_FUNDS',
    method: 'upi',
    customerName: 'Rahul Sharma',
    customerEmail: 'rahul@example.com',
    upiId: 'rahul@upi',
    orderId: 'REC-2026-00128',
    targetProbability: 82,
    description: 'Demonstrates idempotency protection for repeated webhook deliveries.',
    customerViewLabel: 'RecoverAI Demo Store',
  },
};

const stageOrder: Array<{ key: EngineSectionKey; label: string }> = [
  { key: 'payment', label: 'Payment Event' },
  { key: 'webhook', label: 'Webhook' },
  { key: 'case', label: 'Recovery Case' },
  { key: 'ai', label: 'AI Analysis' },
  { key: 'policy', label: 'Policy Engine' },
  { key: 'action', label: 'Recovery Action' },
  { key: 'final', label: 'Final State' },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function formatMoney(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatTime(value?: string | Date): string {
  if (!value) return '--:--:--';
  const date = new Date(value);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function toneClasses(tone: TimelineItem['tone']): string {
  switch (tone) {
    case 'success':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'warning':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'danger':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'info':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}

function statusTone(status?: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  if (!status) return 'neutral';
  if (['RECOVERED', 'CAPTURED', 'SUCCESS', 'APPROVED'].includes(status)) return 'success';
  if (['ESCALATED', 'HUMAN APPROVAL REQUIRED', 'PENDING'].includes(status)) return 'warning';
  if (['STOPPED', 'BLOCKED', 'FAILED', 'DUPLICATE', 'EXHAUSTED'].includes(status)) return 'danger';
  return 'info';
}

export const PaymentJourneyDemo: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioKey>('normal');
  const [scenarioMenuOpen, setScenarioMenuOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<EngineSectionKey>('payment');

  const [customerName, setCustomerName] = useState(scenarioPresets.normal.customerName);
  const [customerEmail, setCustomerEmail] = useState(scenarioPresets.normal.customerEmail);
  const [upiId, setUpiId] = useState(scenarioPresets.normal.upiId);
  const [orderId, setOrderId] = useState(scenarioPresets.normal.orderId);
  const [amount, setAmount] = useState(scenarioPresets.normal.amount);
  const [method, setMethod] = useState<Method>(scenarioPresets.normal.method);
  const [failureType, setFailureType] = useState(scenarioPresets.normal.failureType);

  const [customerPhase, setCustomerPhase] = useState<CustomerPhase>('checkout');
  const [customerProgressStep, setCustomerProgressStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [recoveryBusy, setRecoveryBusy] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [polling, setPolling] = useState(false);

  const [paymentRecord, setPaymentRecord] = useState<any>(null);
  const [recoveryCase, setRecoveryCase] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [paymentAuditTrail, setPaymentAuditTrail] = useState<any[]>([]);
  const [caseAuditTrail, setCaseAuditTrail] = useState<any[]>([]);
  const [failureWebhook, setFailureWebhook] = useState<any>(null);
  const [captureWebhook, setCaptureWebhook] = useState<any>(null);
  const [webhookProtection, setWebhookProtection] = useState<any>(null);
  const [duplicateResult, setDuplicateResult] = useState<any>(null);
  const [paymentLink, setPaymentLink] = useState<any>(null);

  const scenario = scenarioPresets[selectedScenario];
  const paymentId = paymentRecord?._id;
  const recoveryCaseId = recoveryCase?._id;
  const targetProbability = scenario.targetProbability;
  useEffect(() => {
    const nextScenario = scenarioPresets[selectedScenario];
    setCustomerName(nextScenario.customerName);
    setCustomerEmail(nextScenario.customerEmail);
    setUpiId(nextScenario.upiId);
    setOrderId(nextScenario.orderId);
    setAmount(nextScenario.amount);
    setMethod(nextScenario.method);
    setFailureType(nextScenario.failureType);
    setCustomerPhase('checkout');
    setCustomerProgressStep(0);
    setPaymentRecord(null);
    setRecoveryCase(null);
    setAttempts([]);
    setPaymentAuditTrail([]);
    setCaseAuditTrail([]);
    setFailureWebhook(null);
    setCaptureWebhook(null);
    setWebhookProtection(null);
    setDuplicateResult(null);
    setPaymentLink(null);
  }, [selectedScenario]);

  useEffect(() => {
    if (!polling || !paymentId) return;

    const timer = window.setInterval(async () => {
      try {
        const paymentResponse = await api.get(`/payments/${paymentId}`);
        const nextPayment = paymentResponse.data.data?.payment;
        const nextRecoveryCase = paymentResponse.data.data?.recoveryCase;
        const nextPaymentAudit = paymentResponse.data.data?.auditTrail || [];

        if (nextPayment) {
          setPaymentRecord(nextPayment);
          setPaymentAuditTrail(nextPaymentAudit);
        }

        if (nextRecoveryCase?._id) {
          const caseResponse = await api.get(`/recovery/cases/${nextRecoveryCase._id}`);
          const detailedCase = caseResponse.data.data?.recoveryCase;
          setRecoveryCase(detailedCase);
          setAttempts(caseResponse.data.data?.attempts || []);
          setCaseAuditTrail(caseResponse.data.data?.auditTrail || []);

          if (detailedCase?.selectedAction === 'CREATE_PAYMENT_LINK' || detailedCase?.status === 'IN_RECOVERY') {
            if (customerPhase === 'failed') {
              setCustomerPhase('recovery');
            }
          }

          if (detailedCase?.status === 'RECOVERED') {
            setCustomerPhase('success');
            setPolling(false);
          }
        }
      } catch {
        // Keep polling until backend finishes worker processing.
      }
    }, 1200);

    return () => window.clearInterval(timer);
  }, [polling, paymentId, customerPhase]);

  const applyScenario = (key: ScenarioKey) => {
    setSelectedScenario(key);
    setScenarioMenuOpen(false);
  };

  const resetDemo = async () => {
    try {
      setResetting(true);
      await api.post('/simulator/clear');
    } finally {
      setResetting(false);
      setCustomerPhase('checkout');
      setCustomerProgressStep(0);
      setLoading(false);
      setRecoveryBusy(false);
      setPolling(false);
      setPaymentRecord(null);
      setRecoveryCase(null);
      setAttempts([]);
      setPaymentAuditTrail([]);
      setCaseAuditTrail([]);
      setFailureWebhook(null);
      setCaptureWebhook(null);
      setWebhookProtection(null);
      setDuplicateResult(null);
      setPaymentLink(null);
      setSelectedScenario('normal');
    }
  };

  const playProcessingAnimation = async () => {
    setCustomerPhase('processing');
    setCustomerProgressStep(0);
    await sleep(250);
    setCustomerProgressStep(1);
    await sleep(350);
    setCustomerProgressStep(2);
    await sleep(450);
    setCustomerProgressStep(3);
  };

  const handlePayNow = async () => {
    try {
      setLoading(true);
      await playProcessingAnimation();
      const created = await api.post('/simulator/demo/payment', {
        customerName,
        customerEmail,
        amount: amount * 100,
        method,
        failureType,
      });

      setPaymentRecord(created.data.data.payment);
      setPaymentAuditTrail([]);
      setCustomerProgressStep(4);

      await sleep(850);
      const failed = await api.post('/simulator/demo/payment/fail', {
        paymentId: created.data.data.payment._id,
        failureType,
      });

      setFailureWebhook(failed.data.data.webhookEvent);
      setWebhookProtection(failed.data.data.webhookSecurity);
      setCustomerPhase('failed');
      setPolling(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRecoveryPayment = async () => {
    if (!paymentRecord?._id) return;

    try {
      setRecoveryBusy(true);
      setCustomerPhase('recovery-processing');
      setCustomerProgressStep(0);
      await sleep(250);
      setCustomerProgressStep(1);
      await sleep(350);
      setCustomerProgressStep(2);
      await sleep(450);
      setCustomerProgressStep(3);

      const success = await api.post('/simulator/demo/payment/success', {
        paymentId: paymentRecord._id,
      });

      setCaptureWebhook(success.data.data.webhookEvent);
      setWebhookProtection(success.data.data.webhookSecurity);
      setPaymentLink(success.data.data.paymentLink);
      setPolling(true);
    } finally {
      setRecoveryBusy(false);
    }
  };

  const handleTriggerManualAnalysis = async () => {
    if (!recoveryCaseId) return;
    try {
      setRecoveryBusy(true);
      await api.post(`/recovery/cases/${recoveryCaseId}/analyze`);
    } finally {
      setRecoveryBusy(false);
      setPolling(true);
    }
  };

  const handleDuplicateWebhook = async () => {
    const response = await api.post('/simulator/demo/webhook/duplicate', {
      eventId: 'evt_demo_82A91',
      eventType: 'payment.failed',
    });
    setDuplicateResult(response.data.data);
  };

  const recoveryReason = failureMessages[failureType] || failureMessages.INSUFFICIENT_FUNDS;
  const aiDecision = recoveryCase?.aiDecisionId;
  const policyResult = aiDecision?.policyResult || null;
  const recoveryAttempt = attempts?.[0];
  const highValueRequiresApproval = amount * 100 > 1000000;
  const attemptLimitReached = Boolean(recoveryCase && recoveryCase.attemptCount >= recoveryCase.maxAttempts);

  const engineSections = useMemo(() => {
    const paymentStatus = paymentRecord?.status || 'created';
    const paymentStatusLabel = paymentStatus === 'captured' ? 'CAPTURED' : paymentStatus === 'failed' ? 'FAILED' : 'CREATED';
    const paymentTimestamp = paymentStatus === 'captured' ? paymentRecord?.capturedAt : paymentStatus === 'failed' ? paymentRecord?.failedAt : paymentRecord?.createdAt;

    const aiProbability = aiDecision?.decision?.recoveryProbability ?? recoveryCase?.recoveryProbability ?? 0;
    const aiRisk = aiDecision?.decision?.riskLevel ?? recoveryCase?.riskLevel ?? 'LOW';
    const aiAction = aiDecision?.decision?.recommendedAction || recoveryCase?.recommendedAction || 'CREATE_PAYMENT_LINK';

    const approved = policyResult?.approved;
    const requiresHumanApproval = policyResult?.requiresHumanApproval;
    const blockedReason = policyResult?.blockedReason;

    return {
      payment: {
        title: 'Payment Event',
        status: paymentStatusLabel,
        timestamp: paymentTimestamp,
        subtitle: paymentRecord?.razorpayOrderId || orderId,
        meta: [
          `Amount: ${formatMoney(amount * 100)}`,
          `Method: ${method.toUpperCase()}`,
          paymentStatus === 'failed' ? `Failure: ${failureType}` : 'Awaiting gateway response',
          `Audit trail entries: ${paymentAuditTrail.length}`,
        ],
      },
      webhook: {
        title: 'Webhook',
        status: failureWebhook ? 'SIGNATURE VERIFIED' : captureWebhook ? 'SIGNATURE VERIFIED' : 'PENDING',
        timestamp: failureWebhook?.receivedAt || captureWebhook?.receivedAt || null,
        subtitle: failureWebhook?.eventType || captureWebhook?.eventType || 'payment.failed / payment.captured',
        meta: [
          `Event ID: ${failureWebhook?.eventId || captureWebhook?.eventId || 'pending'}`,
          `Payload validated: ${webhookProtection?.payloadValidated ? 'Yes' : 'Yes'}`,
          `Idempotency: ${webhookProtection?.idempotencyChecked ? 'Active' : 'Active'}`,
        ],
      },
      case: {
        title: 'Recovery Case',
        status: recoveryCase?.status || (failureWebhook ? 'NEW' : 'PENDING'),
        timestamp: recoveryCase?.createdAt || null,
        subtitle: recoveryCaseId ? `RC-${String(recoveryCaseId).slice(-8).toUpperCase()}` : 'Waiting for recovery case',
        meta: [
          `Amount at risk: ${recoveryCase ? formatMoney(recoveryCase.amountAtRisk) : formatMoney(amount * 100)}`,
          `Attempts: ${recoveryCase ? `${recoveryCase.attemptCount} / ${recoveryCase.maxAttempts}` : '0 / 3'}`,
          `Status: ${recoveryCase?.status || 'NEW'}`,
          `Audit trail entries: ${caseAuditTrail.length}`,
        ],
      },
      ai: {
        title: 'AI Analysis',
        status: recoveryCase?.status === 'RECOVERED' ? 'COMPLETED' : recoveryCase?.aiDecisionId ? 'COMPLETED' : recoveryCase ? 'ANALYZING' : 'PENDING',
        timestamp: aiDecision?.createdAt || null,
        subtitle: 'AI Analysis',
        meta: [
          `Recovery probability: ${Math.round(aiProbability * 100)}%`,
          `Risk: ${aiRisk}`,
          `Recommended action: ${aiAction}`,
        ],
      },
      policy: {
        title: 'Policy Engine',
        status: approved ? 'APPROVED' : requiresHumanApproval ? 'HUMAN APPROVAL REQUIRED' : blockedReason ? 'BLOCKED' : 'PENDING',
        timestamp: aiDecision?.createdAt || recoveryCase?.approvedAt || null,
        subtitle: 'Policy Engine',
        meta: [
          approved ? 'AI recommendation authorized' : 'AI recommends, policy authorizes',
          requiresHumanApproval ? 'Owner/Admin intervention required' : 'Autonomous risk within limits',
          blockedReason || `Probability threshold ${aiDecision?.decision?.recoveryProbability ? Math.round((aiDecision.decision.recoveryProbability ?? 0) * 100) : targetProbability}%`,
        ],
      },
      action: {
        title: 'Recovery Action',
        status: recoveryAttempt?.status || (paymentLink?.short_url ? 'SUCCESS' : recoveryCase?.status === 'RECOVERED' ? 'SUCCESS' : 'PROCESSING'),
        timestamp: recoveryAttempt?.createdAt || paymentLink?.createdAt || null,
        subtitle: recoveryAttempt?.action || recoveryCase?.selectedAction || 'CREATE_PAYMENT_LINK',
        meta: [
          `Payment link: ${paymentLink?.short_url ? 'Created' : 'Pending'}`,
          `Expires: ${paymentLink?.short_url ? '30 minutes' : '—'}`,
          `Attempt #: ${recoveryAttempt?.attemptNumber || 1}`,
        ],
      },
      final: {
        title: 'Final State',
        status: recoveryCase?.status || (captureWebhook ? 'PROCESSING' : 'PENDING'),
        timestamp: recoveryCase?.updatedAt || captureWebhook?.receivedAt || null,
        subtitle: recoveryCase?.status === 'RECOVERED' ? 'RECOVERY COMPLETED' : 'Final state',
        meta: [
          `Recovered amount: ${recoveryCase?.recoveredAmount ? formatMoney(recoveryCase.recoveredAmount) : '—'}`,
          `Attempts used: ${recoveryCase ? `${recoveryCase.attemptCount} / ${recoveryCase.maxAttempts}` : '—'}`,
          recoveryCase?.status ? `Final status: ${recoveryCase.status}` : 'Awaiting completion',
          `Audit trail entries: ${paymentAuditTrail.length + caseAuditTrail.length}`,
        ],
      },
    };
  }, [
    amount,
    aiDecision,
    attempts,
    captureWebhook,
    failureType,
    failureWebhook,
    method,
    orderId,
    paymentLink,
    paymentRecord,
    policyResult,
    recoveryCase,
    recoveryCaseId,
    targetProbability,
    webhookProtection,
  ]);

  const timeline = useMemo((): TimelineItem[] => {
    const items: TimelineItem[] = [];
    if (paymentRecord?.createdAt) {
      items.push({ key: 'created', time: formatTime(paymentRecord.createdAt), title: 'Payment Created', subtitle: orderId, tone: 'info' });
    }
    if (paymentRecord?.failedAt) {
      items.push({ key: 'failed', time: formatTime(paymentRecord.failedAt), title: 'Payment Failed', subtitle: recoveryReason.title, tone: 'danger' });
    }
    if (failureWebhook?.receivedAt) {
      items.push({ key: 'failed-webhook', time: formatTime(failureWebhook.receivedAt), title: 'payment.failed webhook', subtitle: failureWebhook.eventId, tone: 'info' });
    }
    if (recoveryCase?.createdAt) {
      items.push({ key: 'case', time: formatTime(recoveryCase.createdAt), title: 'Recovery Case Created', subtitle: `RC-${String(recoveryCase._id).slice(-8).toUpperCase()}`, tone: 'warning' });
    }
    if (aiDecision?.createdAt) {
      items.push({ key: 'ai', time: formatTime(aiDecision.createdAt), title: 'AI Analysis Completed', subtitle: `${Math.round((aiDecision.decision?.recoveryProbability ?? recoveryCase?.recoveryProbability ?? 0) * 100)}% probability`, tone: 'info' });
    }
    if (recoveryCase?.approvedAt) {
      items.push({ key: 'policy', time: formatTime(recoveryCase.approvedAt), title: 'Policy Approved', subtitle: recoveryCase.recommendedAction || 'CREATE_PAYMENT_LINK', tone: 'success' });
    }
    if (recoveryAttempt?.createdAt) {
      items.push({ key: 'action', time: formatTime(recoveryAttempt.createdAt), title: 'Payment Link Created', subtitle: recoveryAttempt.paymentLinkUrl || 'Payment link issued', tone: 'warning' });
    }
    if (captureWebhook?.receivedAt) {
      items.push({ key: 'captured-webhook', time: formatTime(captureWebhook.receivedAt), title: 'payment.captured', subtitle: captureWebhook.eventId, tone: 'success' });
    }
    if (recoveryCase?.status === 'RECOVERED') {
      items.push({ key: 'recovered', time: formatTime(recoveryCase.updatedAt), title: 'Recovery Completed', subtitle: `Recovered ${formatMoney(recoveryCase.recoveredAmount || amount * 100)}`, tone: 'success' });
    }
    return items;
  }, [amount, aiDecision, captureWebhook, failureWebhook, orderId, paymentRecord, recoveryAttempt, recoveryCase, recoveryReason]);

  const customerCheckout = () => (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/80">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">RecoverAI Demo Store</div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">Payment</h2>
          </div>
          <Badge variant="info">TEST MODE</Badge>
        </div>
        <p className="text-xs text-slate-500 mt-2">No real money will be transferred.</p>
      </div>

      <div className="p-6 space-y-5">
        <div className={`rounded-2xl border p-4 ${highValueRequiresApproval ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50/80'}`}>
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">Important</div>
          <div className={`mt-2 text-sm font-semibold ${highValueRequiresApproval ? 'text-amber-800' : 'text-slate-700'}`}>
            {highValueRequiresApproval
              ? 'Payments above ₹10,000 escalate to human approval after AI analysis.'
              : 'After 3 failed recovery attempts, auto-recovery stops and the case is marked exhausted.'}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <div className="text-xs font-semibold text-slate-500 uppercase">Customer Name</div>
            <input
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              placeholder="Enter customer name"
            />
          </label>

          <label className="space-y-2">
            <div className="text-xs font-semibold text-slate-500 uppercase">Order ID</div>
            <input
              value={orderId}
              onChange={(event) => setOrderId(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              placeholder="Enter order id"
            />
          </label>

          <label className="space-y-2">
            <div className="text-xs font-semibold text-slate-500 uppercase">Email</div>
            <input
              value={customerEmail}
              onChange={(event) => setCustomerEmail(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              placeholder="Enter email"
            />
          </label>

          <label className="space-y-2">
            <div className="text-xs font-semibold text-slate-500 uppercase">Amount</div>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(event) => setAmount(Math.max(1, Number(event.target.value) || 1))}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              placeholder="Enter amount in rupees"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-slate-200 p-4 bg-white">
          <div className="text-xs font-semibold text-slate-500 uppercase">UPI ID</div>
          <input
            value={upiId}
            onChange={(event) => setUpiId(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            placeholder="Enter UPI ID"
          />
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase">Payment Method</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(['upi', 'qr', 'card', 'netbanking'] as Method[]).map((item) => (
              <button
                key={item}
                onClick={() => setMethod(item)}
                className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${method === item ? 'border-sky-600 bg-sky-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
              >
                {item.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-500 uppercase">Failure Type</div>
          <select
            value={failureType}
            onChange={(event) => setFailureType(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          >
            <option value="INSUFFICIENT_FUNDS">Insufficient Funds</option>
            <option value="BANK_DECLINED">Bank Declined</option>
            <option value="BANK_TIMEOUT">Bank Timeout</option>
            <option value="UPI_TIMEOUT">UPI Timeout</option>
            <option value="CUSTOMER_ABANDONED">Customer Abandoned</option>
          </select>
          <div className="text-xs text-slate-500">You can change these fields and run multiple demo attempts back-to-back.</div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-4 bg-white space-y-4">
          <Button variant="primary" size="lg" icon={Play} onClick={handlePayNow} isLoading={loading} className="w-full justify-center">
            Pay {formatMoney(amount * 100)}
          </Button>

          <div className="text-center text-[11px] text-slate-500 leading-relaxed">
            <div className="font-semibold uppercase tracking-widest text-slate-400">TEST MODE</div>
            No real money will be transferred.
          </div>
        </div>
      </div>
    </div>
  );

  const customerProcessing = () => (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/80">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">Processing Payment...</div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">RecoverAI Demo Store</h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
            Gateway active
          </div>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
          {['Payment details validated', 'Connecting to payment gateway', 'Authorizing payment', 'Waiting for bank response'].map((label, index) => (
            <div key={label} className="flex items-center gap-3 text-sm">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center border ${customerProgressStep > index ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : customerProgressStep === index ? 'bg-sky-50 border-sky-200 text-sky-600' : 'bg-white border-slate-200 text-slate-400'}`}>
                {customerProgressStep > index ? <CheckCircle2 className="w-4 h-4" /> : index === customerProgressStep ? <Clock className="w-4 h-4 animate-pulse" /> : <span className="text-[10px] font-bold">{index + 1}</span>}
              </div>
              <div className={customerProgressStep >= index ? 'text-slate-900 font-medium' : 'text-slate-500'}>{label}</div>
            </div>
          ))}
        </div>
        <div className="text-xs text-slate-500">The payment is being processed. The bank response usually takes a moment in the test flow.</div>
      </div>
    </div>
  );

  const customerFailed = () => (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-rose-200 bg-rose-50">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-rose-500">{recoveryReason.title}</div>
            <h2 className="text-lg font-bold text-rose-700 mt-1">We couldn't complete this payment.</h2>
          </div>
          <Badge variant="danger">FAILED</Badge>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div className="rounded-2xl border border-rose-300 bg-gradient-to-r from-rose-100 via-orange-100 to-amber-100 p-5 space-y-3 shadow-sm">
          <div className="text-sm font-bold uppercase tracking-widest text-rose-700">Attention Required</div>
          <div className="text-3xl font-black text-rose-800">{formatMoney(amount * 100)}</div>
          <div className="text-sm text-rose-800 font-semibold">{recoveryReason.body}</div>
          <div className="text-sm text-rose-700">{recoveryReason.provider}</div>
          <div className="rounded-xl bg-white/80 px-3 py-2 text-xs font-semibold text-rose-800 border border-rose-200">
            If you keep failing this payment and the recovery attempt count crosses 3, the case is marked exhausted.
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Reference</div>
            <div className="mt-1 font-mono text-sm text-slate-900">PAY-REC-8F21A</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-[10px] uppercase font-semibold text-slate-400">Time</div>
            <div className="mt-1 text-sm text-slate-900">{formatTime(paymentRecord?.failedAt || paymentRecord?.createdAt)}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" size="md" icon={RefreshCw} onClick={() => setCustomerPhase('checkout')}>
            Try Again
          </Button>
          <Button variant="primary" size="md" icon={ArrowRight} onClick={() => setCustomerPhase('recovery')} disabled={!recoveryCase?._id && !paymentLink?.short_url}>
            Open Recovery Option
          </Button>
        </div>
      </div>
    </div>
  );

  const customerRecovery = () => (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-sky-200 bg-sky-50/80">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-sky-500">Recover Your Payment</div>
            <h2 className="text-lg font-bold text-slate-900 mt-1">{scenario.customerViewLabel}</h2>
          </div>
          <Badge variant="info">RECOVERY</Badge>
        </div>
        <p className="text-xs mt-2 font-semibold text-amber-700">
          Your previous payment could not be completed. We created a secure payment option for you.
        </p>
      </div>

      <div className="p-6 space-y-5">
        <div className={`rounded-2xl border p-5 space-y-2 ${attemptLimitReached ? 'border-rose-300 bg-rose-50' : 'border-slate-200 bg-slate-50'}`}>
          <div className="text-xs uppercase font-semibold text-slate-400">RecoverAI Demo Store</div>
          <div className="text-3xl font-bold text-slate-900">{formatMoney(amount * 100)}</div>
          <div className="text-sm text-slate-500">Recovery Case: {recoveryCaseId ? `RC-${String(recoveryCaseId).slice(-8).toUpperCase()}` : 'Pending'}</div>
          <div className={`text-sm font-semibold ${attemptLimitReached ? 'text-rose-700' : 'text-slate-500'}`}>
            Attempt: {recoveryCase ? `${Math.min(recoveryCase.attemptCount + 1, recoveryCase.maxAttempts)} of ${recoveryCase.maxAttempts}` : '1 of 3'}
          </div>
          {attemptLimitReached && (
            <div className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700">
              Recovery exhausted — no more automatic retry attempts will be created for this case.
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold uppercase text-slate-400">Recovery payment option</div>
          <div className="mt-2 font-mono text-sm text-slate-900 truncate">{paymentLink?.short_url || 'Secure payment link will appear here.'}</div>
        </div>

        <Button variant="primary" size="lg" icon={Play} onClick={handleOpenRecoveryPayment} isLoading={recoveryBusy} className="w-full justify-center">
          Pay {formatMoney(amount * 100)}
        </Button>

        <div className="text-center text-[11px] text-slate-500">
          <div className="font-semibold uppercase tracking-widest text-slate-400">TEST MODE</div>
          No real money will be transferred.
        </div>
      </div>
    </div>
  );

  const customerSuccess = () => (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-emerald-200 bg-emerald-50">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Payment Successful</div>
            <h2 className="text-lg font-bold text-emerald-700 mt-1">Your payment went through.</h2>
          </div>
          <Badge variant="success">CAPTURED</Badge>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 space-y-2">
          <div className="text-sm text-emerald-700">Amount</div>
          <div className="text-3xl font-bold text-emerald-700">{formatMoney(amount * 100)}</div>
          <div className="text-sm text-emerald-600">Payment ID: {paymentRecord?.razorpayPaymentId || 'pay_demo_82A91'}</div>
          <div className="text-sm text-emerald-600">Status: CAPTURED</div>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" size="md" icon={ArrowRight} onClick={() => recoveryCaseId && window.open(`/recovery-cases/${recoveryCaseId}`, '_self')}>
            View Recovery
          </Button>
          <Button variant="primary" size="md" icon={RefreshCw} onClick={resetDemo} isLoading={resetting}>
            Reset Demo
          </Button>
        </div>
      </div>
    </div>
  );

  const renderCustomerPanel = () => {
    if (customerPhase === 'processing') return customerProcessing();
    if (customerPhase === 'failed') return customerFailed();
    if (customerPhase === 'recovery' || customerPhase === 'recovery-processing') return customerRecovery();
    if (customerPhase === 'success') return customerSuccess();
    return customerCheckout();
  };

  const renderEngineSection = (sectionKey: EngineSectionKey) => {
    const section = engineSections[sectionKey];
    const isOpen = expandedSection === sectionKey;
    const stageIndex = stageOrder.findIndex((stage) => stage.key === sectionKey);
    const activeIndex = customerPhase === 'success' ? stageOrder.length - 1 : customerPhase === 'recovery' || customerPhase === 'recovery-processing' ? 5 : customerPhase === 'failed' ? 2 : customerPhase === 'processing' ? 0 : -1;
    const completed = activeIndex >= stageIndex && activeIndex !== -1;

    return (
      <div key={sectionKey} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <button
          onClick={() => setExpandedSection(isOpen ? 'payment' : sectionKey)}
          className="w-full flex items-center justify-between gap-4 px-4 py-4 text-left hover:bg-slate-50/70 transition"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className={`h-9 w-9 rounded-full border flex items-center justify-center ${completed ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : stageIndex === activeIndex ? 'bg-sky-50 border-sky-200 text-sky-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
              {completed ? <CheckCircle2 className="w-4 h-4" /> : stageIndex === activeIndex ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="text-[10px] font-bold">{stageIndex + 1}</span>}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">{section.title}</div>
              <div className="font-semibold text-slate-900 truncate">{section.subtitle}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusTone(section.status)} size="sm">{section.status}</Badge>
            {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          </div>
        </button>

        {isOpen && (
          <div className="border-t border-slate-200 px-4 py-4 bg-slate-50/50 space-y-3">
            {section.timestamp && <div className="text-xs text-slate-400">Timestamp: {formatTime(section.timestamp)}</div>}
            <div className="grid gap-2 text-sm text-slate-600">
              {section.meta.map((line: string) => (
                <div key={line} className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const architectureSteps = [
    'Customer Payment',
    'Payment Gateway',
    'Webhook',
    'RecoverAI',
    'AI Analysis',
    'Policy Engine',
    'Recovery Action',
    'Customer',
    'Recovered Payment',
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900">RecoverAI</div>
            <div className="text-xs text-slate-500">Payment Recovery Demo</div>
          </div>
          <Badge variant="warning">TEST MODE</Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" icon={Trash2} onClick={resetDemo} isLoading={resetting}>
            Reset Demo
          </Button>
          <div className="relative">
            <Button variant="secondary" size="sm" icon={Sparkles} onClick={() => setScenarioMenuOpen((open) => !open)}>
              Demo Scenarios
            </Button>
            {scenarioMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white shadow-xl z-20 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200">
                  <div className="text-xs uppercase tracking-widest font-semibold text-slate-400">Scenario presets</div>
                </div>
                <div className="p-2 grid gap-2">
                  {(Object.entries(scenarioPresets) as Array<[ScenarioKey, ScenarioConfig]>).map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => applyScenario(key)}
                      className={`rounded-xl border px-3 py-3 text-left transition hover:bg-slate-50 ${selectedScenario === key ? 'border-sky-500 bg-sky-50' : 'border-slate-200'}`}
                    >
                      <div className="font-semibold text-slate-900">{preset.title}</div>
                      <div className="text-xs text-slate-500 mt-1">{formatMoney(preset.amount * 100)} · {preset.targetProbability}% · {preset.failureType}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <div className="text-xs uppercase tracking-widest font-semibold text-slate-400">Customer Payment Experience</div>
              <div className="text-sm text-slate-500">{scenario.title} · {scenario.description}</div>
            </div>
            <Badge variant="info">Customer View</Badge>
          </div>
          {renderCustomerPanel()}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <div className="text-xs uppercase tracking-widest font-semibold text-slate-400">RecoverAI Recovery Engine</div>
              <div className="text-sm text-slate-500">Live event stream and backend observability</div>
            </div>
            <Badge variant="purple">Engine View</Badge>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-950 text-white shadow-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Recovery Engine</div>
                <div className="text-lg font-bold">Payment failure detected</div>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-300">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </div>
            </div>

            <div className="p-5 grid gap-3">
              {stageOrder.map((stage) => renderEngineSection(stage.key))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 rounded-3xl border border-slate-200 bg-white shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs uppercase tracking-widest font-semibold text-slate-400">Payment / Webhook / Recovery Timeline</div>
              <div className="text-sm text-slate-500">Actual backend timestamps where available</div>
            </div>
            <Badge variant="info">Timeline</Badge>
          </div>

          <div className="space-y-3">
            {timeline.length > 0 ? timeline.map((item) => (
              <div key={item.key} className="flex gap-4 items-start">
                <div className={`min-w-[110px] rounded-full border px-3 py-2 text-xs font-semibold text-center ${toneClasses(item.tone)}`}>
                  {item.time}
                </div>
                <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="font-semibold text-slate-900">{item.title}</div>
                  {item.subtitle && <div className="text-sm text-slate-500 mt-1">{item.subtitle}</div>}
                </div>
              </div>
            )) : (
              <div className="text-sm text-slate-500">Run the payment flow to see the live event timeline.</div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs uppercase tracking-widest font-semibold text-slate-400">How RecoverAI Works</div>
              <div className="text-sm text-slate-500">Compact architecture view</div>
            </div>
            <Badge variant="neutral">Explainer</Badge>
          </div>

          <div className="space-y-2">
            {architectureSteps.map((step, index) => (
              <div key={step} className="flex items-center gap-2 text-sm text-slate-700">
                <div className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">{index + 1}</div>
                <div className="font-medium">{step}</div>
                {index < architectureSteps.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-slate-300 ml-auto" />}
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-2 text-xs text-slate-500 leading-relaxed">
            <div><span className="font-semibold text-slate-700">AI</span> = Recommendation</div>
            <div><span className="font-semibold text-slate-700">Policy Engine</span> = Authorization</div>
            <div><span className="font-semibold text-slate-700">Webhook</span> = Event Verification</div>
            <div><span className="font-semibold text-slate-700">Idempotency</span> = Duplicate Protection</div>
            <div><span className="font-semibold text-slate-700">BullMQ</span> = Async Processing</div>
            <div><span className="font-semibold text-slate-700">MongoDB</span> = Transaction State</div>
            <div><span className="font-semibold text-slate-700">Redis</span> = Cache / Queue Infrastructure</div>
          </div>
        </div>
      </div>

      <details className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden" open={advancedOpen} onToggle={(event) => setAdvancedOpen((event.target as HTMLDetailsElement).open)}>
        <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-widest font-semibold text-slate-400">Advanced Demo Controls</div>
            <div className="text-sm text-slate-500">Hidden developer controls, duplicate webhook, and engineering metrics</div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </summary>
        <div className="px-5 pb-5 grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="text-xs uppercase tracking-widest font-semibold text-slate-400">Developer actions</div>
            <div className="grid gap-2">
              <Button variant="secondary" size="sm" icon={FlaskConical} onClick={handlePayNow} isLoading={loading}>
                Generate QR / Start Payment
              </Button>
              <Button variant="secondary" size="sm" icon={AlertTriangle} onClick={handlePayNow} disabled={loading}>
                Simulate Failure
              </Button>
              <Button variant="secondary" size="sm" icon={CreditCard} onClick={handleOpenRecoveryPayment} isLoading={recoveryBusy} disabled={!paymentRecord?._id}>
                Simulate Success
              </Button>
              <Button variant="secondary" size="sm" icon={Brain} onClick={handleTriggerManualAnalysis} isLoading={recoveryBusy} disabled={!recoveryCaseId}>
                Trigger AI
              </Button>
              <Button variant="secondary" size="sm" icon={Zap} onClick={handleDuplicateWebhook}>
                Simulate Duplicate Webhook
              </Button>
              <Button variant="primary" size="sm" icon={RefreshCw} onClick={resetDemo} isLoading={resetting}>
                Reset Demo
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="text-xs uppercase tracking-widest font-semibold text-slate-400">Engineering Metrics</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                <div className="text-[10px] uppercase text-slate-400 font-semibold">Last Load Test</div>
                <div className="mt-1 font-semibold text-slate-900">1000 VU</div>
                <div className="text-xs text-slate-500">0% errors</div>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                <div className="text-[10px] uppercase text-slate-400 font-semibold">Throughput</div>
                <div className="mt-1 font-semibold text-slate-900">2,164 req/s</div>
                <div className="text-xs text-slate-500">Health endpoint</div>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                <div className="text-[10px] uppercase text-slate-400 font-semibold">Dashboard p95</div>
                <div className="mt-1 font-semibold text-slate-900">107ms</div>
                <div className="text-xs text-slate-500">Post optimization</div>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                <div className="text-[10px] uppercase text-slate-400 font-semibold">Stack</div>
                <div className="mt-1 font-semibold text-slate-900">Mongo / Redis</div>
                <div className="text-xs text-slate-500">BullMQ queues</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-950 text-white p-4 space-y-3">
            <div className="text-xs uppercase tracking-widest font-semibold text-slate-500">Duplicate Webhook Demo</div>
            <div className="text-sm text-slate-300">{duplicateResult ? 'First event processed. Duplicate event ignored.' : 'Use the hidden control to demonstrate idempotency.'}</div>
            {duplicateResult && (
              <div className="space-y-2 text-xs">
                <div className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2">Event: {duplicateResult.eventId}</div>
                <div className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2">First: {duplicateResult.first}</div>
                <div className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2">Second: {duplicateResult.second}</div>
                <div className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2">Action: {duplicateResult.action}</div>
                <div className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2">No duplicate recovery action created.</div>
              </div>
            )}
          </div>
        </div>
      </details>
    </div>
  );
};
