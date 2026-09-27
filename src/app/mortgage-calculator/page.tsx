"use client";

import { useMemo, useState } from "react";
import { FaCalculator, FaInfoCircle } from "react-icons/fa";

type MortgageResult = {
  principal: number;
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  numberOfPayments: number;
};

const DEFAULT_DOWN_PAYMENT_PERCENT = "20";
const LOAN_TERMS = [30, 25, 20, 15, 10, 5];
const CURRENCY_FORMATTER = new Intl.NumberFormat("en-KE", {
  maximumFractionDigits: 0,
});

const parseNonNegativeNumber = (value: string) => {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const formatCurrency = (value: number) =>
  `KES ${CURRENCY_FORMATTER.format(value)}`;

const calculateMonthlyPayment = (
  principal: number,
  annualInterestRate: number,
  numberOfPayments: number
) => {
  if (annualInterestRate === 0) {
    return principal / numberOfPayments;
  }

  const monthlyRate = annualInterestRate / 100 / 12;
  const compoundRate = Math.pow(1 + monthlyRate, numberOfPayments);

  return (principal * monthlyRate * compoundRate) / (compoundRate - 1);
};

export default function MortgageCalculator() {
  const [propertyPrice, setPropertyPrice] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [loanTerm, setLoanTerm] = useState("30");
  const [downPayment, setDownPayment] = useState("");
  const [downPaymentPercent, setDownPaymentPercent] = useState(
    DEFAULT_DOWN_PAYMENT_PERCENT
  );

  const price = parseNonNegativeNumber(propertyPrice) ?? 0;
  const downPaymentAmount = parseNonNegativeNumber(downPayment) ?? 0;
  const annualRate = parseNonNegativeNumber(interestRate);
  const termYears = parseNonNegativeNumber(loanTerm) ?? 0;
  const principal = Math.max(price - downPaymentAmount, 0);
  const numberOfPayments = termYears * 12;

  const result = useMemo<MortgageResult | null>(() => {
    if (
      price <= 0 ||
      principal <= 0 ||
      annualRate === null ||
      numberOfPayments <= 0
    ) {
      return null;
    }

    const monthlyPayment = calculateMonthlyPayment(
      principal,
      annualRate,
      numberOfPayments
    );
    const totalPayment = monthlyPayment * numberOfPayments;

    return {
      principal,
      monthlyPayment,
      totalPayment,
      totalInterest: Math.max(totalPayment - principal, 0),
      numberOfPayments,
    };
  }, [annualRate, numberOfPayments, price, principal]);

  const validationMessage = useMemo(() => {
    if (!propertyPrice) {
      return "Enter a property price to estimate monthly repayments.";
    }

    if (parseNonNegativeNumber(propertyPrice) === null || price <= 0) {
      return "Property price must be a number greater than zero.";
    }

    if (downPayment && parseNonNegativeNumber(downPayment) === null) {
      return "Down payment must be a valid non-negative number.";
    }

    if (downPaymentAmount >= price) {
      return "Down payment must be less than the property price.";
    }

    if (!interestRate) {
      return "Enter an annual interest rate. Use 0 for an interest-free loan.";
    }

    if (annualRate === null) {
      return "Annual interest rate must be a valid non-negative number.";
    }

    return "";
  }, [annualRate, downPayment, downPaymentAmount, interestRate, price, propertyPrice]);

  const handlePropertyPriceChange = (value: string) => {
    setPropertyPrice(value);

    const nextPrice = parseNonNegativeNumber(value) ?? 0;
    const percent = parseNonNegativeNumber(downPaymentPercent) ?? 0;

    if (nextPrice > 0 && percent >= 0) {
      setDownPayment(((nextPrice * percent) / 100).toFixed(0));
    }
  };

  const handleDownPaymentChange = (value: string) => {
    setDownPayment(value);

    const amount = parseNonNegativeNumber(value) ?? 0;

    if (price > 0) {
      setDownPaymentPercent(((amount / price) * 100).toFixed(2));
    }
  };

  const handleDownPaymentPercentChange = (value: string) => {
    setDownPaymentPercent(value);

    const percent = parseNonNegativeNumber(value) ?? 0;

    if (price > 0) {
      setDownPayment(((price * percent) / 100).toFixed(0));
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h1 className="flex items-center justify-center gap-3 text-3xl font-bold text-gray-900">
              <FaCalculator className="text-[#468AD1]" />
              Mortgage Calculator
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600">
              Estimate your monthly mortgage repayments, total interest, and
              financed amount for a property purchase in Kenya.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <form className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label
                    htmlFor="property-price"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Property Price (KES)
                  </label>
                  <input
                    id="property-price"
                    type="number"
                    min="0"
                    inputMode="decimal"
                    value={propertyPrice}
                    onChange={(event) =>
                      handlePropertyPriceChange(event.target.value)
                    }
                    placeholder="e.g. 12000000"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-[#514f63] focus:border-[#468AD1] focus:outline-none focus:ring-1 focus:ring-[#468AD1]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="down-payment"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Down Payment (KES)
                  </label>
                  <input
                    id="down-payment"
                    type="number"
                    min="0"
                    inputMode="decimal"
                    value={downPayment}
                    onChange={(event) =>
                      handleDownPaymentChange(event.target.value)
                    }
                    placeholder="e.g. 2400000"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-[#514f63] focus:border-[#468AD1] focus:outline-none focus:ring-1 focus:ring-[#468AD1]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="down-payment-percent"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Down Payment (%)
                  </label>
                  <div className="relative">
                    <input
                      id="down-payment-percent"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      inputMode="decimal"
                      value={downPaymentPercent}
                      onChange={(event) =>
                        handleDownPaymentPercentChange(event.target.value)
                      }
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 pr-10 text-[#514f63] focus:border-[#468AD1] focus:outline-none focus:ring-1 focus:ring-[#468AD1]"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-500">
                      %
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="interest-rate"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Annual Interest Rate (%)
                  </label>
                  <input
                    id="interest-rate"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={interestRate}
                    onChange={(event) => setInterestRate(event.target.value)}
                    placeholder="e.g. 13.5"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-[#514f63] focus:border-[#468AD1] focus:outline-none focus:ring-1 focus:ring-[#468AD1]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="loan-term"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Loan Term
                  </label>
                  <select
                    id="loan-term"
                    value={loanTerm}
                    onChange={(event) => setLoanTerm(event.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-[#514f63] focus:border-[#468AD1] focus:outline-none focus:ring-1 focus:ring-[#468AD1]"
                  >
                    {LOAN_TERMS.map((term) => (
                      <option key={term} value={term}>
                        {term} years
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 rounded-lg bg-[#468AD1]/10 p-4 text-sm text-[#514f63]">
                <div className="flex items-start gap-2">
                  <FaInfoCircle className="mt-0.5 shrink-0 text-[#468AD1]" />
                  <p>
                    Results update as you type and are estimates only. They do
                    not include bank fees, insurance, legal costs, or taxes.
                  </p>
                </div>
              </div>
            </form>

            <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
              <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-gray-900">
                <FaInfoCircle className="text-[#468AD1]" />
                Mortgage Details
              </h2>

              {result ? (
                <div className="space-y-5">
                  <div className="rounded-lg bg-gray-50 p-5">
                    <p className="text-sm text-gray-600">Monthly Payment</p>
                    <p className="mt-1 text-3xl font-bold text-[#514f63]">
                      {formatCurrency(result.monthlyPayment)}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-sm text-gray-600">Loan Amount</p>
                      <p className="mt-1 text-lg font-semibold text-[#514f63]">
                        {formatCurrency(result.principal)}
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-sm text-gray-600">Total Interest</p>
                      <p className="mt-1 text-lg font-semibold text-[#514f63]">
                        {formatCurrency(result.totalInterest)}
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-sm text-gray-600">Total Payment</p>
                      <p className="mt-1 text-lg font-semibold text-[#514f63]">
                        {formatCurrency(result.totalPayment)}
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-sm text-gray-600">Repayments</p>
                      <p className="mt-1 text-lg font-semibold text-[#514f63]">
                        {result.numberOfPayments} months
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-gray-50 p-5 text-sm text-gray-600">
                  {validationMessage}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
