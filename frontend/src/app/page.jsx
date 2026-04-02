"use client"
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
    Rocket
} from "lucide-react";
import {ImageWithFallback} from "../utils/Image";
import Link from "next/link";

const HomePage = ({ onGetStarted }) => {
    const features = [
        {
            icon: Sparkles,
            title: "Génération de contenu IA",
            description: "Créez des articles de blog et posts réseaux sociaux optimisés SEO en quelques secondes grâce à l'intelligence artificielle avancée."
        },
        {
            icon: TrendingUp,
            title: "Optimisation SEO",
            description: "Boostez votre visibilité en ligne avec des contenus optimisés pour les moteurs de recherche et adaptés à votre audience."
        },
        {
            icon: Database,
            title: "Intégration Notion",
            description: "Synchronisez automatiquement vos contenus avec Notion via API. Importez et exportez vos données en toute simplicité."
        },
        {
            icon: Clock,
            title: "Historique & Suivi",
            description: "Suivez toutes vos publications, analysez vos performances et gardez un historique complet de vos contenus."
        },
        {
            icon: Share2,
            title: "Multi-plateformes",
            description: "Publiez simultanément sur vos réseaux sociaux et votre blog. Gagnez du temps avec une seule interface."
        },
        {
            icon: BarChart3,
            title: "Statistiques détaillées",
            description: "Visualisez vos performances avec un dashboard complet : vues, engagement, croissance et bien plus encore."
        }
    ];

    const benefits = [
        "Gagnez jusqu'à 10h par semaine sur la création de contenu",
        "Augmentez votre trafic organique de 300%",
        "Créez du contenu de qualité professionnelle sans compétences en rédaction",
        "Maintenez une présence constante sur vos canaux de communication"
    ];

    const testimonials = [
        {
            name: "Sophie Martin",
            role: "Responsable Marketing",
            company: "TechStart",
            content: "Cet outil a révolutionné notre stratégie de contenu. Nous publions 3x plus avec la même équipe !",
            rating: 5
        },
        {
            name: "Thomas Dubois",
            role: "CEO",
            company: "GrowthLab",
            content: "L'intégration avec Notion est parfaite. Notre workflow est maintenant ultra-fluide et notre SEO s'améliore chaque mois.",
            rating: 5
        },
        {
            name: "Marie Laurent",
            role: "Content Manager",
            company: "Digital Agency",
            content: "La qualité du contenu généré est impressionnante. C'est comme avoir un rédacteur SEO expert disponible 24/7.",
            rating: 5
        }
    ];

    const pricingPlans = [
        {
            name: "Starter",
            price: "29€",
            period: "/mois",
            description: "Parfait pour commencer",
            features: [
                "10 articles par mois",
                "50 posts réseaux sociaux",
                "Intégration Notion",
                "Dashboard basique",
                "Support email"
            ],
            highlighted: false
        },
        {
            name: "Professional",
            price: "79€",
            period: "/mois",
            description: "Pour les professionnels exigeants",
            features: [
                "50 articles par mois",
                "200 posts réseaux sociaux",
                "Intégration Notion avancée",
                "Dashboard complet + Analytics",
                "Support prioritaire",
                "Curation de ressources",
                "Export multi-formats"
            ],
            highlighted: true
        },
        {
            name: "Enterprise",
            price: "199€",
            period: "/mois",
            description: "Solution complète pour entreprises",
            features: [
                "Articles illimités",
                "Posts illimités",
                "Multi-comptes & équipes",
                "API personnalisée",
                "Support dédié 24/7",
                "Formation personnalisée",
                "Fonctionnalités sur-mesure"
            ],
            highlighted: false
        }
    ];

    const stats = [
        { value: "10K+", label: "Contenus générés" },
        { value: "500+", label: "Utilisateurs actifs" },
        { value: "98%", label: "Satisfaction client" },
        { value: "24/7", label: "Disponibilité" }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
            {/* Navigation */}
            <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-8 h-8 text-blue-600" />
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SEO Content AI
              </span>
                        </div>
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
                                Fonctionnalités
                            </a>
                            <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
                                Tarifs
                            </a>
                            <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">
                                Témoignages
                            </a>
                            <Link href="/auth" variant="outline">
                                Connexion
                            </Link>
                            <Button onClick={onGetStarted}>
                                Commencer
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            <section className="relative overflow-hidden pt-20 pb-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                                <Rocket className="w-3 h-3 mr-1" />
                                Boosté par l'IA
                            </Badge>
                            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                                Créez du contenu SEO
                                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {" "}en quelques secondes
                </span>
                            </h1>
                            <p className="text-xl text-gray-600 leading-relaxed">
                                Générez automatiquement des articles de blog et posts réseaux sociaux optimisés SEO.
                                Synchronisez avec Notion et suivez vos performances en temps réel.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700" onClick={onGetStarted}>
                                    Commencer gratuitement
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                                <Button size="lg" variant="outline" className="gap-2">
                                    <FileText className="w-4 h-4" />
                                    Voir une démo
                                </Button>
                            </div>
                            <div className="flex items-center gap-8 pt-4">
                                {stats.map((stat, index) => (
                                    <div key={index} className="text-center">
                                        <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                                        <div className="text-sm text-gray-600">{stat.label}</div>
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
            <section id="features" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <Badge className="mb-4 bg-purple-100 text-purple-700 hover:bg-purple-100">
                            Fonctionnalités
                        </Badge>
                        <h2 className="text-4xl font-bold mb-4">
                            Tout ce dont vous avez besoin pour réussir
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Une plateforme complète pour gérer votre stratégie de contenu de A à Z
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <Card key={index} className="border-2 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
                                <CardHeader>
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                                        <feature.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="text-base">
                                        {feature.description}
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
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
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                <Zap className="w-3 h-3 mr-1" />
                                Avantages
                            </Badge>
                            <h2 className="text-4xl font-bold">
                                Transformez votre stratégie de contenu
                            </h2>
                            <p className="text-lg text-gray-600">
                                Rejoignez des centaines d'entreprises qui ont révolutionné leur création de contenu avec notre plateforme.
                            </p>
                            <ul className="space-y-4">
                                {benefits.map((benefit, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                                        <span className="text-lg text-gray-700">{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                            <Button size="lg" className="gap-2 bg-green-600 hover:bg-green-700" onClick={onGetStarted}>
                                Essayer maintenant
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <Badge className="mb-4 bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                            <Users className="w-3 h-3 mr-1" />
                            Témoignages
                        </Badge>
                        <h2 className="text-4xl font-bold mb-4">
                            Ils nous font confiance
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Découvrez comment nos clients transforment leur création de contenu
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <Card key={index} className="border-2 hover:shadow-xl transition-all duration-300">
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
                                        <div className="font-semibold text-gray-900">{testimonial.name}</div>
                                        <div className="text-sm text-gray-600">
                                            {testimonial.role} chez {testimonial.company}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-20 bg-gradient-to-b from-gray-50 to-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100">
                            Tarifs
                        </Badge>
                        <h2 className="text-4xl font-bold mb-4">
                            Des prix adaptés à tous les besoins
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Choisissez le plan qui correspond à vos ambitions. Changez à tout moment.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {pricingPlans.map((plan, index) => (
                            <Card
                                key={index}
                                className={`relative ${
                                    plan.highlighted
                                        ? 'border-4 border-blue-600 shadow-2xl scale-105'
                                        : 'border-2'
                                }`}
                            >
                                {plan.highlighted && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                        <Badge className="bg-blue-600 text-white hover:bg-blue-600">
                                            ⭐ Plus populaire
                                        </Badge>
                                    </div>
                                )}
                                <CardHeader>
                                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                    <CardDescription>{plan.description}</CardDescription>
                                    <div className="mt-4">
                                        <span className="text-4xl font-bold">{plan.price}</span>
                                        <span className="text-gray-600">{plan.period}</span>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3 mb-6">
                                        {plan.features.map((feature, featureIndex) => (
                                            <li key={featureIndex} className="flex items-start gap-2">
                                                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                                <span className="text-gray-700">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Button
                                        className={`w-full ${
                                            plan.highlighted
                                                ? 'bg-blue-600 hover:bg-blue-700'
                                                : ''
                                        }`}
                                        variant={plan.highlighted ? 'default' : 'outline'}
                                        size="lg"
                                        onClick={onGetStarted}
                                    >
                                        {plan.highlighted ? 'Commencer maintenant' : 'Choisir ce plan'}
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
                    <h2 className="text-4xl font-bold mb-6">
                        Prêt à transformer votre création de contenu ?
                    </h2>
                    <p className="text-xl mb-8 text-blue-100">
                        Rejoignez des centaines de professionnels qui utilisent notre plateforme pour créer du contenu exceptionnel.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 gap-2" onClick={onGetStarted}>
                            Démarrer gratuitement
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                        <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                            Planifier une démo
                        </Button>
                    </div>
                    <p className="mt-6 text-blue-100">
                        ✨ Aucune carte bancaire requise • 14 jours d'essai gratuit
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-300 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles className="w-6 h-6 text-blue-500" />
                                <span className="font-bold text-white">SEO Content AI</span>
                            </div>
                            <p className="text-sm">
                                La plateforme tout-en-un pour créer du contenu SEO exceptionnel avec l'IA.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-white mb-4">Produit</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">Fonctionnalités</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Tarifs</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Intégrations</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-white mb-4">Ressources</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Guides</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-white mb-4">Entreprise</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">À propos</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Mentions légales</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Confidentialité</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-8 text-center text-sm">
                        <p>&copy; 2026 SEO Content AI. Tous droits réservés.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;