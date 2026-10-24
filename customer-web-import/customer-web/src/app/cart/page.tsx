"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import Shell from "../../components/Shell";
import {
  useCart,
  changeQty,
  removeLine,
  groupByRestaurant,
  cartSubtotalOf,
  cartDeliveryFeeOf,
  cartCountOf,
} from "../../lib/cart";
import {
  MAX_QTY,
  MAX_NAME,
  MAX_ADDRESS,
  MAX_INSTRUCTIONS,
  TAX_RATE,
  type PaymentMethod,
  normalizeCode,
  normalizeMobile,
  validateName,
  validateMobile,
  validateAddress,
  validateInstructions,
  validateCartLines,
  validatePayment,
  validateCouponCode,
} from "../../lib/checkoutValidation";
import { useOffers, computeOffer } from "../../lib/offers";
import { createOrder, type OrderPayload } from "../../lib/orders";
import styles from "./cart.module.css";

type FieldKey = "name" | "mobile" | "address" | "instructions" | "payment";

const FIELD_ORDER: FieldKey[] = ["name", "mobile", "address", "instructions", "payment"];
const FREE_DELIVERY_MIN = 249; // Keep in sync with deliveryFeeFor in lib/cart.ts

const PAYMENT_OPTIONS: { id: PaymentMethod; title: string; desc: string; icon: string }[] = [
  { id: "upi", title: "UPI", desc: "Pay with any UPI app", icon: "⚡" },
  { id: "card", title: "Credit or debit card", desc: "Visa, Mastercard, RuPay", icon: "💳" },
  { id: "cod", title: "Cash on delivery", desc: "Pay when your food arrives", icon: "₹" },
];

const noopSubscribe = () => () => {};
const fmt = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

export default function CartPage() {
  const router = useRouter();
  const cart = useCart();
  const lines = cart?.lines ?? [];
  const groups = groupByRestaurant(cart);
  const subtotal = cartSubtotalOf(cart);
  const deliveryBase = cartDeliveryFeeOf(cart);
  const count = cartCountOf(cart);

  const { offers, status: offersStatus } = useOffers();
  const offerList = Object.values(offers);

  const [name, setName] = useState("Purvi");
  const [mobile, setMobile] = useState("9876543210");
  const [address, setAddress] = useState("12, Green Park Society, Adajan, Surat 395009");
  const [instructions, setInstructions] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("upi");

  const [codeInput, setCodeInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [couponMsg, setCouponMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const couponProblem = appliedCode ? validateCouponCode(appliedCode, subtotal, offers) : null;
  const activeOffer = appliedCode && !couponProblem ? offers[appliedCode] : null;
  const offerEffect = computeOffer(activeOffer ?? null, subtotal, deliveryBase);
  const discount = Math.min(offerEffect.discount, subtotal);
  const delivery = offerEffect.freeDelivery ? 0 : deliveryBase;
  const tax = Math.round((subtotal - discount) * TAX_RATE);
  const toPay = subtotal - discount + delivery + tax;

  const fieldErrors: Record<FieldKey, string | null> = {
    name: validateName(name),
    mobile: validateMobile(mobile),
    address: validateAddress(address),
    instructions: validateInstructions(instructions),
    payment: validatePayment(payment, toPay),
  };
  const cartError = validateCartLines(lines);
  const hasErrors = FIELD_ORDER.some((k) => fieldErrors[k] !== null);

  const showError = (k: FieldKey) => (touched[k] || submitAttempted) && fieldErrors[k] !== null;
  const isValid = (k: FieldKey) => !!touched[k] && fieldErrors[k] === null;
  const errorFor = (k: FieldKey) => (showError(k) ? fieldErrors[k] : null);
  const inputClass = (k: FieldKey) =>
    `${styles.input} ${showError(k) ? styles.invalid : isValid(k) ? styles.valid : ""}`;

  function touch(k: FieldKey) {
    setTouched((t) => ({ ...t, [k]: true }));
  }

  function applyCoupon() {
    if (offersStatus !== "ready") {
      setCouponMsg({ text: "Offers are still loading. Try again in a moment.", ok: false });
      return;
    }
    const code = normalizeCode(codeInput);
    const problem = validateCouponCode(code, subtotal, offers);
    if (problem) {
      setCouponMsg({ text: problem, ok: false });
      return;
    }
    setAppliedCode(code);
    setCouponMsg({ text: `${code} applied: ${offers[code].title}`, ok: true });
  }

  function removeCoupon() {
    setAppliedCode(null);
    setCouponMsg(null);
    setCodeInput("");
  }

  function decrease(id: string, itemName: string, qty: number) {
    if (qty <= 1 && !window.confirm(`Remove ${itemName} from your cart?`)) return;
    changeQty(id, -1);
  }

  function buildPayload(restaurantId: string, groupLines: { id: string; qty: number }[]): OrderPayload {
    return {
      restaurantId,
      customer: { name: name.trim(), mobile: normalizeMobile(mobile) },
      deliveryAddress: address.trim(),
      instructions: instructions.trim(),
      paymentMethod: payment,
      offerCode: appliedCode && !couponProblem ? appliedCode : null,
      items: groupLines.map((l) => ({ dishId: l.id, qty: l.qty })),
    };
  }

  async function placeOrder() {
    setSubmitAttempted(true);
    setSubmitError(null);
    if (cartError || submitting) return;

    const firstBad = FIELD_ORDER.find((k) => fieldErrors[k] !== null);
    if (firstBad) {
      document.getElementById(`field-${firstBad}`)?.focus();
      return;
    }

    setSubmitting(true);
    const placedIds: string[] = [];
    setRedirecting(true);

    try {
      for (const g of groups) {
        const id = await createOrder(buildPayload(g.restaurantId, g.lines));
        placedIds.push(id);
        // Remove only the lines that were ordered, so a partial failure keeps the rest.
        for (const l of g.lines) removeLine(l.id);
      }
      // Replace the history entry so Back never returns to the cart.
      router.replace(`/orders?placed=${encodeURIComponent(placedIds.join(","))}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setSubmitError(
        placedIds.length > 0
          ? `${placedIds.length} order(s) were placed, but the rest failed: ${message}`
          : message
      );
      setRedirecting(false);
      setSubmitting(false);
    }
  }

  // Wait for the saved cart to load from localStorage, so "empty" doesn't flash on refresh.
  const cartReady = useSyncExternalStore(noopSubscribe, () => true, () => false);

  if (!cartReady) {
    return (
      <Shell hideFooter>
        <div className={styles.wrap}>
          <p className={styles.muted}>Loading your cart…</p>
        </div>
      </Shell>
    );
  }

  // Keep showing this after the order is sent, so the empty cart never appears before the redirect.
  if (redirecting) {
    return (
      <Shell hideFooter>
        <div className={styles.wrap}>
          <section className={styles.success}>
            <div className={styles.successIcon}>✓</div>
            <h2 className={styles.successTitle}>Order placed</h2>
            <p className={styles.muted}>Taking you to My orders…</p>
          </section>
        </div>
      </Shell>
    );
  }

  if (groups.length === 0) {

    return (
      <Shell hideFooter>
        <div className={styles.wrap}>
          <section className={styles.empty}>
            <div className={styles.emptyIcon}>🍽️</div>
            <h2 className={styles.emptyTitle}>Your cart is empty</h2>
            <p className={styles.muted}>Pick a restaurant and add a few dishes. They will show up here.</p>
            <Link href="/menu" className={styles.primaryBtn}>Browse restaurants</Link>
          </section>
        </div>
      </Shell>
    );
  }

  const remainingForFree = groups.length === 1 && deliveryBase > 0 ? FREE_DELIVERY_MIN - subtotal : 0;
  const freeProgress = Math.min(100, Math.round((subtotal / FREE_DELIVERY_MIN) * 100));
  const placeDisabled = !!cartError || submitting;

  return (
    <Shell hideFooter>
      <div className={styles.wrap}>
        <header className={styles.header}>
          <Link href="/menu" className={styles.back}>← Back to menu</Link>
          <h1 className={styles.title}>
            Your cart <span className={styles.countBadge}>{count}</span>
          </h1>
          <p className={styles.sub}>
            From <strong>{groups.map((g) => g.restaurantName).join(", ")}</strong>
          </p>
        </header>

        {remainingForFree > 0 && (
          <div className={styles.freeBar}>
            <div className={styles.freeText}>
              Add <strong>{fmt(remainingForFree)}</strong> more for free delivery
            </div>
            <div className={styles.freeTrack}>
              <div className={styles.freeFill} style={{ width: `${freeProgress}%` }} />
            </div>
          </div>
        )}

        <div className={styles.layout}>
          <div className={styles.left}>
            <section className={styles.card}>
              <h3 className={styles.cardTitle}>Your items</h3>
              {cartError && submitAttempted && <p className={styles.errorBox}>{cartError}</p>}

              {groups.map((g) => (
                <div key={g.restaurantId}>
                  {groups.length > 1 && <div className={styles.groupName}>{g.restaurantName}</div>}
                  {g.lines.map((l) => (
                    <div key={l.id} className={styles.item}>
                      <div className={styles.thumb} aria-hidden="true">{l.name.charAt(0).toUpperCase()}</div>
                      <div className={styles.itemInfo}>
                        <div className={styles.itemName}>{l.name}</div>
                        <div className={styles.muted}>{fmt(l.price)} each</div>
                        <button className={styles.remove} onClick={() => removeLine(l.id)} disabled={submitting}>
                          Remove
                        </button>
                      </div>
                      <div className={styles.qtyCol}>
                        <div className={styles.qty}>
                          <button
                            onClick={() => decrease(l.id, l.name, l.qty)}
                            aria-label={`Decrease ${l.name}`}
                            disabled={submitting}
                          >
                            −
                          </button>
                          <span aria-live="polite">{l.qty}</span>
                          <button
                            onClick={() => changeQty(l.id, 1)}
                            disabled={l.qty >= MAX_QTY || submitting}
                            aria-label={`Increase ${l.name}`}
                          >
                            +
                          </button>
                        </div>
                        <div className={styles.itemPrice}>{fmt(l.price * l.qty)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              <label className={styles.label} htmlFor="field-instructions">Cooking instructions (optional)</label>
              <textarea
                id="field-instructions"
                className={inputClass("instructions") + " " + styles.textarea}
                placeholder="Less spicy, no onion, extra napkins"
                value={instructions}
                maxLength={MAX_INSTRUCTIONS + 20}
                onChange={(e) => setInstructions(e.target.value)}
                onBlur={() => touch("instructions")}
                aria-invalid={showError("instructions")}
                disabled={submitting}
              />
              <div className={styles.hintRow}>
                {errorFor("instructions") ? <span className={styles.error}>{errorFor("instructions")}</span> : <span />}
                <span className={styles.counter}>{instructions.length}/{MAX_INSTRUCTIONS}</span>
              </div>
            </section>

            <section className={styles.card}>
              <h3 className={styles.cardTitle}>Delivery details</h3>
              <div className={styles.twoCol}>
                <div>
                  <label className={styles.label} htmlFor="field-name">Name</label>
                  <input
                    id="field-name"
                    className={inputClass("name")}
                    value={name}
                    maxLength={MAX_NAME + 10}
                    autoComplete="name"
                    onChange={(e) => setName(e.target.value)}
                    onBlur={() => touch("name")}
                    aria-invalid={showError("name")}
                    disabled={submitting}
                  />
                  {errorFor("name") && <p className={styles.error}>{errorFor("name")}</p>}
                </div>
                <div>
                  <label className={styles.label} htmlFor="field-mobile">Mobile number</label>
                  <input
                    id="field-mobile"
                    className={inputClass("mobile")}
                    value={mobile}
                    type="tel"
                    inputMode="numeric"
                    maxLength={16}
                    autoComplete="tel"
                    placeholder="10-digit number"
                    onChange={(e) => setMobile(e.target.value)}
                    onBlur={() => touch("mobile")}
                    aria-invalid={showError("mobile")}
                    disabled={submitting}
                  />
                  {errorFor("mobile") && <p className={styles.error}>{errorFor("mobile")}</p>}
                </div>
              </div>

              <label className={styles.label} htmlFor="field-address">Delivery address</label>
              <textarea
                id="field-address"
                className={inputClass("address") + " " + styles.textarea}
                placeholder="House no., society, area, city, pincode"
                value={address}
                maxLength={MAX_ADDRESS}
                autoComplete="street-address"
                onChange={(e) => setAddress(e.target.value)}
                onBlur={() => touch("address")}
                aria-invalid={showError("address")}
                disabled={submitting}
              />
              <div className={styles.hintRow}>
                {errorFor("address") ? <span className={styles.error}>{errorFor("address")}</span> : <span />}
                <span className={styles.counter}>{address.length}/{MAX_ADDRESS}</span>
              </div>
            </section>

            <section className={styles.card}>
              <h3 className={styles.cardTitle}>Payment</h3>
              <div className={styles.payGrid}>
                {PAYMENT_OPTIONS.map((p, i) => (
                  <label
                    key={p.id}
                    className={`${styles.payOption} ${payment === p.id ? styles.payActive : ""}`}
                  >
                    <input
                      id={i === 0 ? "field-payment" : undefined}
                      type="radio"
                      name="payment"
                      className={styles.radio}
                      checked={payment === p.id}
                      disabled={submitting}
                      onChange={() => {
                        setPayment(p.id);
                        touch("payment");
                      }}
                    />
                    <span className={styles.payIcon} aria-hidden="true">{p.icon}</span>
                    <span>
                      <span className={styles.itemName}>{p.title}</span>
                      <span className={styles.muted}>{p.desc}</span>
                    </span>
                  </label>
                ))}
              </div>
              {errorFor("payment") && <p className={styles.error}>{errorFor("payment")}</p>}
            </section>
          </div>

          <aside className={styles.right}>
            <section className={styles.card}>
              <h3 className={styles.cardTitle}>Offers</h3>
              <div className={styles.couponRow}>
                <input
                  className={styles.input + " " + styles.couponInput}
                  placeholder="ENTER CODE"
                  value={codeInput}
                  maxLength={20}
                  autoComplete="off"
                  disabled={offersStatus !== "ready" || submitting}
                  onChange={(e) => setCodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                />
                <button
                  className={styles.ghostBtn}
                  onClick={applyCoupon}
                  disabled={offersStatus !== "ready" || submitting}
                >
                  Apply
                </button>
              </div>

              {offersStatus === "loading" && <p className={styles.muted}>Loading offers…</p>}
              {offersStatus === "error" && (
                <p className={styles.notice}>Couldn&apos;t load offers. You can still place your order.</p>
              )}
              {couponMsg && <p className={couponMsg.ok ? styles.ok : styles.error}>{couponMsg.text}</p>}
              {appliedCode && couponProblem && (
                <p className={styles.notice}>{appliedCode} no longer applies. {couponProblem}</p>
              )}
              {appliedCode && (
                <button className={styles.linkBtn} onClick={removeCoupon} disabled={submitting}>
                  Remove code
                </button>
              )}

              {offersStatus === "ready" && offerList.length === 0 && (
                <p className={styles.muted}>No offers available right now.</p>
              )}
              <div className={styles.chips}>
                {offerList.map((o) => (
                  <button
                    key={o.code}
                    className={styles.chip}
                    title={o.title}
                    onClick={() => setCodeInput(o.code)}
                    disabled={submitting}
                  >
                    {o.code}
                  </button>
                ))}
              </div>
            </section>

            <section className={styles.card}>
              <h3 className={styles.cardTitle}>Bill summary</h3>
              <div className={styles.row}><span>Item total</span><span>{fmt(subtotal)}</span></div>
              {discount > 0 && (
                <div className={styles.row}>
                  <span>Discount</span>
                  <span className={styles.ok}>−{fmt(discount)}</span>
                </div>
              )}
              <div className={styles.row}>
                <span>Delivery fee</span>
                <span>{delivery === 0 ? <span className={styles.ok}>Free</span> : fmt(delivery)}</span>
              </div>
              <div className={styles.row}><span>Taxes and charges</span><span>{fmt(tax)}</span></div>
              <div className={`${styles.row} ${styles.total}`}>
                <span>To pay</span>
                <span>{fmt(toPay)}</span>
              </div>

              <button className={styles.checkout} onClick={placeOrder} disabled={placeDisabled}>
                {submitting ? "Placing order…" : `Place order · ${fmt(toPay)}`}
              </button>
              {submitError && <p className={styles.errorBox}>{submitError}</p>}
              {submitAttempted && hasErrors && !submitError && (
                <p className={styles.errorBox}>Fix the highlighted fields to place your order.</p>
              )}
              <p className={styles.fine}>🔒 Secure checkout. Final amount is confirmed by the server.</p>
            </section>
          </aside>
        </div>

        <div className={styles.mobileBar}>
          <div>
            <div className={styles.mobileLabel}>To pay</div>
            <div className={styles.mobileTotal}>{fmt(toPay)}</div>
          </div>
          <button className={styles.mobileBtn} onClick={placeOrder} disabled={placeDisabled}>
            {submitting ? "Placing…" : "Place order"}
          </button>
        </div>
      </div>
    </Shell>
  );
}
