"use client";
import { Button } from "@/components/Button";
import {
    Sparkles,
    Zap,
    TrendingUp,
    FileText,
    Share2,
    Database,
    Clock,
    CheckCircle2,
    ArrowRight,
    Star,
    Users,
    BarChart3,
    Rocket,
    PenTool,
} from "lucide-react";
import { ImageWithFallback } from "../utils/Image";
import Link from "next/link";
import { useTranslation } from "@/hooks/useI18n";

const HomePage = ({ onGetStarted }) => {
    const { t } = useTranslation();

    const features = [
        { icon: Sparkles, key: "ai", tone: "emerald" },
        { icon: TrendingUp, key: "seo", tone: "amber" },
        { icon: Database, key: "notion", tone: "slate" },
        { icon: Clock, key: "history", tone: "violet" },
        { icon: Share2, key: "multi", tone: "blue" },
        { icon: BarChart3, key: "stats", tone: "emerald" },
    ];

    const TONE_MAP = {
        emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
        amber: "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
        slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
        violet: "bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
        blue: "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    };

    const benefits = [
        t("home.benefits.items.time"),
        t("home.benefits.items.traffic"),
        t("home.benefits.items.quality"),
        t("home.benefits.items.presence"),
    ];

    const testimonials = ["sophie", "thomas", "marie"].map((k) => ({
        key: k,
        name: t(`home.testimonials.items.${k}.name`),
        role: t(`home.testimonials.items.${k}.role`),
        company: t(`home.testimonials.items.${k}.company`),
        content: t(`home.testimonials.items.${k}.content`),
        rating: 5,
    }));

    const pricingPlans = [
        {
            key: "starter",
            features: ["articles", "social", "notion", "dashboard", "support"],
            highlighted: false,
        },
        {
            key: "pro",
            features: ["articles", "social", "notion", "dashboard", "support", "curation", "export"],
            highlighted: true,
        },
        {
            key: "enterprise",
            features: ["articles", "social", "teams", "api", "support", "training", "custom"],
            highlighted: false,
        },
    ];

    const stats = [
        { value: "10K+", labelKey: "home.stats.contents" },
        { value: "500+", labelKey: "home.stats.users" },
        { value: "98%", labelKey: "home.stats.satisfaction" },
        { value: "24/7", labelKey: "home.stats.availability" },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <Link href="/" className="flex items-center gap-2.5">
                            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                                <PenTool className="h-4.5 w-4.5" />
                            </span>
                            <span className="text-base font-semibold tracking-tight">{t("brand")}</span>
                        </Link>
                        <div className="hidden md:flex items-center gap-6">
                            <a href="#features" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                                {t("nav.features")}
                            </a>
                            <a href="#pricing" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                                {t("nav.pricing")}
                            </a>
                            <a href="#testimonials" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                                {t("nav.testimonials")}
                            </a>
                            <Link
                                href="/auth"
                                className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                            >
                                {t("nav.login")}
                            </Link>
                            <Button asChild className="rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">
                                <Link href="/auth">{t("nav.start")}</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="relative overflow-hidden">
                <div
                    aria-hidden
                    className="pointer-events-none absolute -top-32 right-0 h-[28rem] w-[28rem] rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-900/20"
                />
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 md:pt-24 pb-20 md:pb-28">
                    <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
                        <div className="space-y-7">
                            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                                <Rocket className="h-3.5 w-3.5" />
                                {t("home.hero.badge")}
                            </span>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.1] tracking-tight">
                                {t("home.hero.title1")}
                                <span className="text-emerald-600 dark:text-emerald-400">{t("home.hero.title2")}</span>
                            </h1>
                            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                                {t("home.hero.description")}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button asChild size="lg" className="rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 gap-2">
                                    <Link href="/auth" onClick={onGetStarted}>
                                        {t("home.hero.ctaPrimary")}
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="rounded-lg border-slate-200 dark:border-slate-800 gap-2"
                                >
                                    <FileText className="h-4 w-4" />
                                    {t("home.hero.ctaSecondary")}
                                </Button>
                            </div>
                            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-200 dark:border-slate-800">
                                {stats.map((stat, index) => (
                                    <div key={index}>
                                        <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                            {t(stat.labelKey)}
                                        </dt>
                                        <dd className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                            {stat.value}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                        <div className="relative">
                            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-emerald-200/40 to-transparent blur-2xl dark:from-emerald-900/20" />
                            <div className="relative overflow-hidden rounded-2xl border border-slate-200 shadow-xl dark:border-slate-800">
                                <ImageWithFallback
                                    src="https://images.unsplash.com/photo-1676287571987-2f98ced3e6c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhaSUyMGNvbnRlbnQlMjB3cml0aW5nJTIwbWFya2V0aW5nfGVufDF8fHx8MTc3NTEzMzk3M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                                    alt="AI Content Creation"
                                    className="w-full object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30 py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <p className="text-xs font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                            {t("home.features.badge")}
                        </p>
                        <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">
                            {t("home.features.title")}
                        </h2>
                        <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">
                            {t("home.features.subtitle")}
                        </p>
                    </div>

                    <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <article
                                    key={index}
                                    className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-900/40"
                                >
                                    <span className={`mb-4 grid h-11 w-11 place-items-center rounded-xl transition group-hover:scale-105 ${TONE_MAP[feature.tone]}`}>
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                        {t(`home.features.items.${feature.key}.title`)}
                                    </h3>
                                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                        {t(`home.features.items.${feature.key}.description`)}
                                    </p>
                                </article>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Benefits */}
            <section className="py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
                        <div className="relative">
                            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-emerald-200/40 to-transparent blur-2xl dark:from-emerald-900/20" />
                            <div className="relative overflow-hidden rounded-2xl border border-slate-200 shadow-xl dark:border-slate-800">
                                <ImageWithFallback
                                    src="https://images.unsplash.com/photo-1686061594225-3e92c0cd51b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZW8lMjBhbmFseXRpY3MlMjBkYXNoYm9hcmR8ZW58MXx8fHwxNzc1MTMzOTc0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                                    alt="Analytics Dashboard"
                                    className="w-full object-cover"
                                />
                            </div>
                        </div>
                        <div className="space-y-6">
                            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                                <Zap className="h-3.5 w-3.5" />
                                {t("home.benefits.badge")}
                            </span>
                            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">{t("home.benefits.title")}</h2>
                            <p className="text-lg text-slate-600 dark:text-slate-400">{t("home.benefits.subtitle")}</p>
                            <ul className="space-y-3">
                                {benefits.map((benefit, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                        </span>
                                        <span className="text-base text-slate-700 dark:text-slate-300">{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                            <Button asChild size="lg" className="rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 gap-2">
                                <Link href="/auth" onClick={onGetStarted}>
                                    {t("home.benefits.cta")}
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section id="testimonials" className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30 py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                            <Users className="h-3.5 w-3.5" />
                            {t("home.testimonials.badge")}
                        </span>
                        <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">{t("home.testimonials.title")}</h2>
                        <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">{t("home.testimonials.subtitle")}</p>
                    </div>

                    <div className="mt-14 grid gap-5 md:grid-cols-3">
                        {testimonials.map((testimonial) => (
                            <article
                                key={testimonial.key}
                                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                            >
                                <div className="flex gap-0.5">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                                    ))}
                                </div>
                                <p className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                    {testimonial.content}
                                </p>
                                <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        {testimonial.name}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {t("home.testimonials.roleAt", {
                                            role: testimonial.role,
                                            company: testimonial.company,
                                        })}
                                    </p>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section id="pricing" className="py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <p className="text-xs font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                            {t("home.pricing.badge")}
                        </p>
                        <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">{t("home.pricing.title")}</h2>
                        <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">{t("home.pricing.subtitle")}</p>
                    </div>

                    <div className="mt-14 grid gap-6 md:grid-cols-3 lg:gap-8 max-w-6xl mx-auto">
                        {pricingPlans.map((plan) => (
                            <article
                                key={plan.key}
                                className={`relative flex flex-col rounded-2xl border bg-white p-7 shadow-sm transition hover:shadow-lg dark:bg-slate-900 ${
                                    plan.highlighted
                                        ? "border-emerald-500 ring-1 ring-emerald-500/30 lg:scale-[1.03]"
                                        : "border-slate-200 dark:border-slate-800"
                                }`}
                            >
                                {plan.highlighted && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                                        {t("home.pricing.popular")}
                                    </span>
                                )}
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                                    {t(`home.pricing.plans.${plan.key}.name`)}
                                </h3>
                                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                                    {t(`home.pricing.plans.${plan.key}.description`)}
                                </p>
                                <div className="mt-5">
                                    <span className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                                        {t(`home.pricing.plans.${plan.key}.price`)}
                                    </span>
                                    <span className="text-sm text-slate-500 dark:text-slate-400">
                                        {t("home.pricing.period")}
                                    </span>
                                </div>
                                <ul className="mt-6 space-y-2.5 flex-1">
                                    {plan.features.map((featureKey) => (
                                        <li key={featureKey} className="flex items-start gap-2.5 text-sm">
                                            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                                            <span className="text-slate-700 dark:text-slate-300">
                                                {t(`home.pricing.plans.${plan.key}.features.${featureKey}`)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    asChild
                                    size="lg"
                                    className={`mt-7 w-full rounded-lg ${
                                        plan.highlighted
                                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                            : ""
                                    }`}
                                    variant={plan.highlighted ? "default" : "outline"}
                                >
                                    <Link href="/auth" onClick={onGetStarted}>
                                        {plan.highlighted
                                            ? t("home.pricing.ctaPopular")
                                            : t("home.pricing.ctaNormal")}
                                    </Link>
                                </Button>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="border-t border-slate-200 dark:border-slate-800 py-20">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-8 py-14 text-center text-white shadow-xl dark:bg-slate-950 dark:ring-1 dark:ring-slate-800">
                        <div
                            aria-hidden
                            className="pointer-events-none absolute -top-32 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-500/30 blur-3xl"
                        />
                        <div className="relative">
                            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">{t("home.cta.title")}</h2>
                            <p className="mt-3 text-base text-slate-300 max-w-2xl mx-auto">{t("home.cta.subtitle")}</p>
                            <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
                                <Button asChild size="lg" className="rounded-lg bg-emerald-500 text-white hover:bg-emerald-400 gap-2">
                                    <Link href="/auth" onClick={onGetStarted}>
                                        {t("home.cta.ctaPrimary")}
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="rounded-lg border-slate-700 text-white hover:bg-slate-800"
                                >
                                    {t("home.cta.ctaSecondary")}
                                </Button>
                            </div>
                            <p className="mt-5 text-xs text-slate-400">{t("home.cta.note")}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-white py-14 dark:border-slate-800 dark:bg-slate-900/30">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-8 md:grid-cols-4 mb-10">
                        <div>
                            <Link href="/" className="flex items-center gap-2.5 mb-3">
                                <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                                    <PenTool className="h-4.5 w-4.5" />
                                </span>
                                <span className="font-semibold tracking-tight text-slate-900 dark:text-slate-100">{t("brand")}</span>
                            </Link>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{t("home.footer.tagline")}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 text-sm">{t("home.footer.productCol")}</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">{t("home.footer.product.features")}</a></li>
                                <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">{t("home.footer.product.pricing")}</a></li>
                                <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">{t("home.footer.product.integrations")}</a></li>
                                <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">{t("home.footer.product.api")}</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 text-sm">{t("home.footer.resourcesCol")}</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">{t("home.footer.resources.docs")}</a></li>
                                <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">{t("home.footer.resources.blog")}</a></li>
                                <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">{t("home.footer.resources.guides")}</a></li>
                                <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">{t("home.footer.resources.support")}</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3 text-sm">{t("home.footer.companyCol")}</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">{t("home.footer.company.about")}</a></li>
                                <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">{t("home.footer.company.contact")}</a></li>
                                <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">{t("home.footer.company.legal")}</a></li>
                                <li><a href="#" className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">{t("home.footer.company.privacy")}</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-200 dark:border-slate-800 pt-6 text-center text-xs text-slate-500 dark:text-slate-400">
                        <p>{t("home.footer.copyright")}</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;
