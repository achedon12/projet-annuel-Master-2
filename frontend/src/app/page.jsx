"use client";
import { Button } from "@/components/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/Card";
import { Badge } from "@/components/Badge";
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
} from "lucide-react";
import { ImageWithFallback } from "../utils/Image";
import Link from "next/link";
import { useTranslation } from "@/hooks/useI18n";

const HomePage = ({ onGetStarted }) => {
    const { t } = useTranslation();

    const features = [
        { icon: Sparkles, key: "ai" },
        { icon: TrendingUp, key: "seo" },
        { icon: Database, key: "notion" },
        { icon: Clock, key: "history" },
        { icon: Share2, key: "multi" },
        { icon: BarChart3, key: "stats" },
    ];

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
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-slate-950 dark:to-slate-900">
            {/* Navigation */}
            <nav className="border-b dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-8 h-8 text-blue-600" />
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                {t("brand")}
                            </span>
                        </div>
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition-colors">
                                {t("nav.features")}
                            </a>
                            <a href="#pricing" className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition-colors">
                                {t("nav.pricing")}
                            </a>
                            <a href="#testimonials" className="text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition-colors">
                                {t("nav.testimonials")}
                            </a>
                            <Link href="/auth" variant="outline">
                                {t("nav.login")}
                            </Link>
                            <Button onClick={onGetStarted}>{t("nav.start")}</Button>
                        </div>
                    </div>
                </div>
            </nav>

            <section className="relative overflow-hidden pt-20 pb-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-950">
                                <Rocket className="w-3 h-3 mr-1" />
                                {t("home.hero.badge")}
                            </Badge>
                            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                                {t("home.hero.title1")}
                                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    {t("home.hero.title2")}
                                </span>
                            </h1>
                            <p className="text-xl text-gray-600 dark:text-slate-400 leading-relaxed">
                                {t("home.hero.description")}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={onGetStarted}>
                                    {t("home.hero.ctaPrimary")}
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                                <Button size="lg" variant="outline" className="gap-2">
                                    <FileText className="w-4 h-4" />
                                    {t("home.hero.ctaSecondary")}
                                </Button>
                            </div>
                            <div className="flex items-center gap-8 pt-4">
                                {stats.map((stat, index) => (
                                    <div key={index} className="text-center">
                                        <div className="text-2xl font-bold text-gray-900 dark:text-slate-100">{stat.value}</div>
                                        <div className="text-sm text-gray-600 dark:text-slate-400">{t(stat.labelKey)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-purple-600/20 rounded-3xl blur-3xl"></div>
                            <ImageWithFallback
                                src="https://images.unsplash.com/photo-1676287571987-2f98ced3e6c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhaSUyMGNvbnRlbnQlMjB3cml0aW5nJTIwbWFya2V0aW5nfGVufDF8fHx8MTc3NTEzMzk3M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                                alt="AI Content Creation"
                                className="relative rounded-2xl shadow-2xl w-full object-cover"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-white dark:bg-slate-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <Badge className="mb-4 bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-950 dark:text-purple-300 dark:hover:bg-purple-950">
                            {t("home.features.badge")}
                        </Badge>
                        <h2 className="text-4xl font-bold mb-4">{t("home.features.title")}</h2>
                        <p className="text-xl text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">
                            {t("home.features.subtitle")}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => {
                            const Icon = feature.icon;
                            return (
                                <Card
                                    key={index}
                                    className="border-2 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:shadow-lg transition-all duration-300"
                                >
                                    <CardHeader>
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                                            <Icon className="w-6 h-6 text-white" />
                                        </div>
                                        <CardTitle className="text-xl">
                                            {t(`home.features.items.${feature.key}.title`)}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription className="text-base">
                                            {t(`home.features.items.${feature.key}.description`)}
                                        </CardDescription>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-900 dark:to-slate-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="relative">
                            <ImageWithFallback
                                src="https://images.unsplash.com/photo-1686061594225-3e92c0cd51b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZW8lMjBhbmFseXRpY3MlMjBkYXNoYm9hcmR8ZW58MXx8fHwxNzc1MTMzOTc0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                                alt="Analytics Dashboard"
                                className="rounded-2xl shadow-2xl w-full object-cover"
                            />
                        </div>
                        <div className="space-y-6">
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-950 dark:text-green-300 dark:hover:bg-green-950">
                                <Zap className="w-3 h-3 mr-1" />
                                {t("home.benefits.badge")}
                            </Badge>
                            <h2 className="text-4xl font-bold">{t("home.benefits.title")}</h2>
                            <p className="text-lg text-gray-600 dark:text-slate-400">{t("home.benefits.subtitle")}</p>
                            <ul className="space-y-4">
                                {benefits.map((benefit, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                                        <span className="text-lg text-gray-700 dark:text-slate-300">{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                            <Button size="lg" className="gap-2 bg-green-600 hover:bg-green-700" onClick={onGetStarted}>
                                {t("home.benefits.cta")}
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="py-20 bg-white dark:bg-slate-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <Badge className="mb-4 bg-yellow-100 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-950 dark:text-yellow-300 dark:hover:bg-yellow-950">
                            <Users className="w-3 h-3 mr-1" />
                            {t("home.testimonials.badge")}
                        </Badge>
                        <h2 className="text-4xl font-bold mb-4">{t("home.testimonials.title")}</h2>
                        <p className="text-xl text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">
                            {t("home.testimonials.subtitle")}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial) => (
                            <Card key={testimonial.key} className="border-2 dark:border-slate-800 hover:shadow-xl transition-all duration-300">
                                <CardHeader>
                                    <div className="flex gap-1 mb-3">
                                        {[...Array(testimonial.rating)].map((_, i) => (
                                            <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                        ))}
                                    </div>
                                    <CardDescription className="text-base italic">
                                        "{testimonial.content}"
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div>
                                        <div className="font-semibold text-gray-900 dark:text-slate-100">{testimonial.name}</div>
                                        <div className="text-sm text-gray-600 dark:text-slate-400">
                                            {t("home.testimonials.roleAt", {
                                                role: testimonial.role,
                                                company: testimonial.company,
                                            })}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-slate-950 dark:to-slate-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:hover:bg-blue-950">
                            {t("home.pricing.badge")}
                        </Badge>
                        <h2 className="text-4xl font-bold mb-4">{t("home.pricing.title")}</h2>
                        <p className="text-xl text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">
                            {t("home.pricing.subtitle")}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {pricingPlans.map((plan) => (
                            <Card
                                key={plan.key}
                                className={`relative ${
                                    plan.highlighted
                                        ? "border-4 border-blue-600 shadow-2xl scale-105"
                                        : "border-2"
                                }`}
                            >
                                {plan.highlighted && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <Badge className="bg-blue-600 text-white hover:bg-blue-600">
                                            {t("home.pricing.popular")}
                                        </Badge>
                                    </div>
                                )}
                                <CardHeader>
                                    <CardTitle className="text-2xl">
                                        {t(`home.pricing.plans.${plan.key}.name`)}
                                    </CardTitle>
                                    <CardDescription>
                                        {t(`home.pricing.plans.${plan.key}.description`)}
                                    </CardDescription>
                                    <div className="mt-4">
                                        <span className="text-4xl font-bold">
                                            {t(`home.pricing.plans.${plan.key}.price`)}
                                        </span>
                                        <span className="text-gray-600 dark:text-slate-400">{t("home.pricing.period")}</span>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3 mb-6">
                                        {plan.features.map((featureKey) => (
                                            <li key={featureKey} className="flex items-start gap-2">
                                                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                                <span className="text-gray-700 dark:text-slate-300">
                                                    {t(`home.pricing.plans.${plan.key}.features.${featureKey}`)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Button
                                        className={`w-full ${
                                            plan.highlighted ? "bg-blue-600 hover:bg-blue-700" : ""
                                        }`}
                                        variant={plan.highlighted ? "default" : "outline"}
                                        size="lg"
                                        onClick={onGetStarted}
                                    >
                                        {plan.highlighted
                                            ? t("home.pricing.ctaPopular")
                                            : t("home.pricing.ctaNormal")}
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl font-bold mb-6">{t("home.cta.title")}</h2>
                    <p className="text-xl mb-8 text-blue-100">{t("home.cta.subtitle")}</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 gap-2" onClick={onGetStarted}>
                            {t("home.cta.ctaPrimary")}
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                        <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                            {t("home.cta.ctaSecondary")}
                        </Button>
                    </div>
                    <p className="mt-6 text-blue-100">{t("home.cta.note")}</p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-300 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles className="w-6 h-6 text-blue-500" />
                                <span className="font-bold text-white">{t("brand")}</span>
                            </div>
                            <p className="text-sm">{t("home.footer.tagline")}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-white mb-4">{t("home.footer.productCol")}</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">{t("home.footer.product.features")}</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">{t("home.footer.product.pricing")}</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">{t("home.footer.product.integrations")}</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">{t("home.footer.product.api")}</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-white mb-4">{t("home.footer.resourcesCol")}</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">{t("home.footer.resources.docs")}</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">{t("home.footer.resources.blog")}</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">{t("home.footer.resources.guides")}</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">{t("home.footer.resources.support")}</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-white mb-4">{t("home.footer.companyCol")}</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">{t("home.footer.company.about")}</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">{t("home.footer.company.contact")}</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">{t("home.footer.company.legal")}</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">{t("home.footer.company.privacy")}</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-8 text-center text-sm">
                        <p>{t("home.footer.copyright")}</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;
