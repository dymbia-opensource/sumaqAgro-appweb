import { computed, inject, Injectable, Signal, signal } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap, throwError } from 'rxjs';
import { CurrentSessionService } from '../../iam/application/current-session.service';
import { Money } from '../../shared/domain/model/money';
import { FileDownloader } from '../../shared/infrastructure/file-downloader';
import { ApplyCouponCommand } from '../domain/model/commands/apply-coupon.command';
import { CancelSubscriptionCommand } from '../domain/model/commands/cancel-subscription.command';
import { SelectSubscriptionPlanCommand } from '../domain/model/commands/select-subscription-plan.command';
import { SubmitPaymentCommand } from '../domain/model/commands/submit-payment.command';
import { BillingCycle } from '../domain/model/entities/billing-cycle';
import { Payment } from '../domain/model/entities/payment.entity';
import { PaymentStatus } from '../domain/model/entities/payment-status';
import { PlanCode } from '../domain/model/entities/plan-code';
import { Plan } from '../domain/model/entities/plan.entity';
import { Subscription } from '../domain/model/entities/subscription.entity';
import { SubscriptionsApi } from '../infrastructure/subscriptions-api';

export type PaymentResult = PaymentStatus.COMPLETED | PaymentStatus.REJECTED;

/** Promotional code accepted for the current checkout. */
export interface AppliedCoupon {
  code: string;
  discountPercent: number;
}

/**
 * Holds the Subscriptions and Payments state and coordinates its behavior.
 *
 * @remarks
 * The views send commands and read signals. Every change is applied to a copy
 * of the subscription; the shown state is only updated when the API confirms.
 * Other contexts (Field Management, IAM) read this store, never its API.
 * Policies P1 and P2 belong to the backend; they are simulated here until the
 * RESTful API exists.
 */
@Injectable({ providedIn: 'root' })
export class SubscriptionsStore {
  private readonly subscriptionsApi = inject(SubscriptionsApi);
  private readonly session = inject(CurrentSessionService);
  private readonly fileDownloader = inject(FileDownloader);

  // Store state
  private readonly plansSignal = signal<Plan[]>([]);
  private readonly subscriptionSignal = signal<Subscription | null>(null);
  private readonly paymentsSignal = signal<Payment[]>([]);
  private readonly billingCycleSignal = signal<BillingCycle>(BillingCycle.MONTHLY);
  private readonly selectedPlanSignal = signal<Plan | null>(null);
  private readonly couponSignal = signal<AppliedCoupon | null>(null);
  private readonly paymentResultSignal = signal<PaymentResult | null>(null);

  // UI state
  private readonly loadingSignal = signal(false);
  private readonly processingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  /** Plans of the catalog. */
  readonly plans: Signal<Plan[]> = this.plansSignal.asReadonly();


  readonly subscription: Signal<Subscription | null> = this.subscriptionSignal.asReadonly();

  readonly payments: Signal<Payment[]> = this.paymentsSignal.asReadonly();

  readonly billingCycle: Signal<BillingCycle> = this.billingCycleSignal.asReadonly();

  readonly selectedPlan: Signal<Plan | null> = this.selectedPlanSignal.asReadonly();

  readonly coupon: Signal<AppliedCoupon | null> = this.couponSignal.asReadonly();

  readonly paymentResult: Signal<PaymentResult | null> = this.paymentResultSignal.asReadonly();

  readonly loading = this.loadingSignal.asReadonly();

  readonly processing = this.processingSignal.asReadonly();

  readonly error = this.errorSignal.asReadonly();

  readonly currentUserId = computed(() => this.session.activeUser()?.id ?? null);

  /** Free plan of the catalog. */
  readonly seedPlan = computed(
    () => this.plansSignal().find((plan) => plan.code === PlanCode.SEED) ?? null,
  );

  /** Plan the user can use now: the paid plan while it has access, otherwise Seed. */
  readonly currentPlan = computed<Plan | null>(() => {
    const subscription = this.subscriptionSignal();
    return subscription?.hasAccess() ? subscription.plan : this.seedPlan();
  });

  readonly plotQuota = computed(() => this.currentPlan()?.plotQuota ?? 0);
  readonly plotQuotaReady = computed(() => this.currentPlan() !== null);

  /** Amount of the selected plan for the chosen cycle, with the coupon discount. */
  readonly checkoutAmount = computed<Money | null>(() => {
    const plan = this.selectedPlanSignal();
    if (!plan) return null;
    const price = plan.priceFor(this.billingCycleSignal());
    const discount = this.couponSignal()?.discountPercent ?? 0;
    const discounted = Math.round(price.amount * (1 - discount / 100) * 100) / 100;
    return new Money(discounted, price.currency);
  });

  // Actions

  /** Loads the plans of the catalog. */
  loadPlans = (): void => {
    this.startLoading();
    this.subscriptionsApi.getPlans().subscribe({
      next: (plans) => {
        this.plansSignal.set(plans);
        this.loadingSignal.set(false);
      },
      error: (error) => this.fail(error, 'subscriptions.errors.load-plans'),
    });
  };

  /**
   * Loads the subscription of a user and its payments.
   *
   * @remarks
   * Temporary, until the backend exists: it simulates P1 (a user without
   * subscription gets the Seed plan) and the renewal job (a cancelled plan
   * that reached its end date goes back to Seed).
   * @param userId - Owner of the subscription.
   */
  loadMySubscription = (userId: number): void => {
    this.startLoading();
    forkJoin({
      plans: this.subscriptionsApi.getPlans(),
      subscription: this.subscriptionsApi.getSubscriptionByUserId(userId),
    })
      .pipe(
        switchMap(({ plans, subscription }) =>
          this.ensureSubscription(userId, plans, subscription).pipe(
            switchMap((ready) =>
              this.subscriptionsApi
                .getPayments(ready.id as number)
                .pipe(map((payments) => ({ plans, ready, payments }))),
            ),
          ),
        ),
      )
      .subscribe({
        next: ({ plans, ready, payments }) => {
          this.plansSignal.set(plans);
          this.subscriptionSignal.set(ready);
          this.paymentsSignal.set(this.newestFirst(payments));
          this.loadingSignal.set(false);
        },
        error: (error) => this.fail(error, 'subscriptions.errors.load-subscription'),
      });
  };

  /**
   * Chooses a plan and a cycle to go to the payment.
   * Choosing the free plan clears the selection: there is nothing to pay.
   * @param command - Plan and billing cycle chosen by the user.
   */
  selectPlan = (command: SelectSubscriptionPlanCommand): void => {
    const plan = this.plansSignal().find((candidate) => candidate.code === command.planCode);
    if (!plan || command.userId !== this.currentUserId()) {
      this.errorSignal.set('subscriptions.errors.select-plan');
      return;
    }
    this.errorSignal.set(null);
    this.paymentResultSignal.set(null);
    this.couponSignal.set(null);
    this.billingCycleSignal.set(command.billingCycle);
    this.selectedPlanSignal.set(plan.isFree() ? null : plan);
  };

  /** Switches the catalog between monthly and annual prices. */
  toggleBillingCycle = (): void =>
    this.billingCycleSignal.update((cycle) =>
      cycle === BillingCycle.MONTHLY ? BillingCycle.ANNUAL : BillingCycle.MONTHLY,
    );

  /**
   * Applies a promotional code to the amount to pay.
   * @param command - Code typed by the user.
   */
  applyCoupon = (command: ApplyCouponCommand): void => {
    if (!this.selectedPlanSignal()) return;
    this.errorSignal.set(null);
    this.subscriptionsApi.getCouponDiscount(command.couponCode).subscribe({
      next: (discountPercent) => {
        if (discountPercent === null) {
          this.couponSignal.set(null);
          this.errorSignal.set('subscriptions.errors.invalid-coupon');
          return;
        }
        this.couponSignal.set({ code: command.couponCode.trim().toUpperCase(), discountPercent });
      },
      error: (error) => this.fail(error, 'subscriptions.errors.invalid-coupon'),
    });
  };

  /**
   * Sends the payment of the selected plan.
   *
   * @remarks
   * A rejected payment is saved in the history but does not change the
   * subscription. The card number never arrives here, only its token.
   * Temporary, until the backend exists: it simulates P2 (a completed payment
   * activates the plan) because Niubiz confirms it on the server.
   * @param command - Subscription, card token and amount.
   */
  submitPayment = (command: SubmitPaymentCommand): void => {
    const subscription = this.subscriptionSignal();
    const plan = this.selectedPlanSignal();
    if (!subscription || !plan || this.processingSignal()) return;
    if (command.subscriptionId !== subscription.id) return;

    this.processingSignal.set(true);
    this.errorSignal.set(null);
    const payment = new Payment({
      id: 0,
      subscriptionId: command.subscriptionId,
      amount: command.amount,
      transactionToken: `demo-tx-${Date.now()}`,
      status: command.simulatedStatus ?? PaymentStatus.COMPLETED,
      paidAt: new Date(),
    });

    this.subscriptionsApi
      .createPayment(payment)
      .pipe(
        switchMap((saved) => {
          if (!saved.isCompleted()) return of({ saved, activated: null });
          const updated = subscription.copy();
          updated.changePlan(plan, this.billingCycleSignal(), new Date());
          return this.subscriptionsApi
            .updateSubscription(updated)
            .pipe(map((activated) => ({ saved, activated })));
        }),
      )
      .subscribe({
        next: ({ saved, activated }) => {
          this.paymentsSignal.update((payments) => [saved, ...payments]);
          if (activated) {
            activated.plan = plan;
            this.subscriptionSignal.set(activated);
            this.selectedPlanSignal.set(null);
            this.couponSignal.set(null);
          }
          this.paymentResultSignal.set(
            saved.isCompleted() ? PaymentStatus.COMPLETED : PaymentStatus.REJECTED,
          );
          this.processingSignal.set(false);
        },
        error: (error) => {
          this.processingSignal.set(false);
          this.fail(error, 'subscriptions.errors.payment');
        },
      });
  };

  /**
   * Stops the renewal; the access stays until the end date.
   * @param command - Subscription to cancel.
   */
  cancelSubscription = (command: CancelSubscriptionCommand): void => {
    const subscription = this.subscriptionSignal();
    if (!subscription || subscription.id !== command.subscriptionId || this.processingSignal()) {
      return;
    }
    const cancelled = subscription.copy();
    try {
      cancelled.cancel();
    } catch (error) {
      this.fail(error, 'subscriptions.errors.cancel');
      return;
    }
    this.processingSignal.set(true);
    this.errorSignal.set(null);
    this.subscriptionsApi.updateSubscription(cancelled).subscribe({
      next: (saved) => {
        saved.plan = subscription.plan;
        this.subscriptionSignal.set(saved);
        this.processingSignal.set(false);
      },
      error: (error) => {
        this.processingSignal.set(false);
        this.fail(error, 'subscriptions.errors.cancel');
      },
    });
  };

  /**
   * Downloads the receipt of a payment.
   * @param paymentId - Payment of the receipt.
   */
  downloadReceipt = (paymentId: number): void => {
    const payment = this.paymentsSignal().find((candidate) => candidate.id === paymentId);
    if (!payment) {
      this.errorSignal.set('subscriptions.errors.receipt');
      return;
    }
    const planName = this.subscriptionSignal()?.plan?.name ?? '';
    this.fileDownloader.save(this.subscriptionsApi.buildReceipt(payment, planName));
  };

  /** Clears the checkout (selected plan, coupon and result) when the user leaves it. */
  resetCheckout = (): void => {
    this.selectedPlanSignal.set(null);
    this.couponSignal.set(null);
    this.paymentResultSignal.set(null);
    this.errorSignal.set(null);
  };

  // Private helpers

  /** Returns the subscription ready to use, creating or renewing it when it is missing or expired. */
  private ensureSubscription(
    userId: number,
    plans: Plan[],
    subscription: Subscription | null,
  ): Observable<Subscription> {
    const seed = plans.find((plan) => plan.code === PlanCode.SEED);
    if (!seed) return throwError(() => new Error('subscriptions.errors.no-seed-plan'));

    if (!subscription) {
      return this.subscriptionsApi
        .createSubscription(Subscription.seedFor(userId, seed, new Date()))
        .pipe(map((created) => this.withPlan(created, plans)));
    }
    if (subscription.isExpired()) {
      const renewed = subscription.copy();
      renewed.changePlan(seed, BillingCycle.MONTHLY, new Date());
      return this.subscriptionsApi
        .updateSubscription(renewed)
        .pipe(map((saved) => this.withPlan(saved, plans)));
    }
    return of(this.withPlan(subscription, plans));
  }

  /** Completes the plan of a subscription from the catalog. */
  private withPlan(subscription: Subscription, plans: Plan[]): Subscription {
    subscription.plan = plans.find((plan) => plan.id === subscription.planId) ?? null;
    return subscription;
  }

  private newestFirst(payments: Payment[]): Payment[] {
    return [...payments].sort((a, b) => b.paidAt.getTime() - a.paidAt.getTime());
  }

  private startLoading(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
  }

  /**
   * Normalizes an error into an i18n key to show it in the view.
   * @param error - Source error.
   * @param fallbackKey - i18n key of the failed operation.
   */
  private fail(error: unknown, fallbackKey: string): void {
    console.error(error);
    const isKey = error instanceof Error && error.message.startsWith('subscriptions.');
    const key = isKey ? (error as Error).message : fallbackKey;
    this.errorSignal.set(key);
    this.loadingSignal.set(false);
  }
}
