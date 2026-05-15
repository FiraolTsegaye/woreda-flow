import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { SERVICES } from "@/lib/data";
import { SERVICE_ICONS } from "@/lib/icons";
import { useSupabaseQueue } from "@/hooks/use-supabase-queue";
import { Clock, FileText, ArrowLeft } from "lucide-react";

const ServiceDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { joinQueue } = useSupabaseQueue();
  const service = SERVICES.find((s) => s.id === id);

  if (!service) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground text-xl">Service not found</p>
      </div>
    );
  }

  const Icon = SERVICE_ICONS[service.icon];

  const handleJoinQueue = async () => {
    await joinQueue(service.id);
    navigate("/queue");
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "GovernmentService",
    name: service.name,
    serviceType: service.name,
    provider: { "@type": "GovernmentOrganization", name: "Woreda Office" },
    areaServed: { "@type": "Country", name: "Ethiopia" },
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{`${service.name} — Required Documents & Queue | Woreda-Wait`}</title>
        <meta name="description" content={`Apply for ${service.name} at your Woreda. Required documents: ${service.required_documents.join(", ")}. Average service time ${service.average_service_time_minutes} minutes.`} />
        <link rel="canonical" href={`/service/${service.id}`} />
        <meta property="og:title" content={`${service.name} — Woreda-Wait`} />
        <meta property="og:description" content={`Required documents and digital queue for ${service.name}.`} />
        <meta property="og:url" content={`/service/${service.id}`} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <button
          onClick={() => navigate("/services")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Services
        </button>

        <div className="civic-card">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{service.name}</h1>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <Clock className="w-4 h-4" />
                <span>Avg. {service.average_service_time_minutes} min per person</span>
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Required Documents
            </h2>
            <ul className="space-y-3">
              {service.required_documents.map((doc, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-foreground">{doc}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={handleJoinQueue}
            className="mt-8 w-full rounded-lg bg-primary py-3.5 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Join Queue
          </button>
        </div>
      </main>
    </div>
  );
};

export default ServiceDetailPage;
