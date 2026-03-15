import { Link } from "react-router-dom";
import { SERVICES } from "@/lib/data";
import { SERVICE_ICONS } from "@/lib/icons";
import { Clock } from "lucide-react";

const ServicesPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">
            Woreda Services
          </h1>
          <p className="text-muted-foreground text-lg">
            Browse available government services and join a queue digitally
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {SERVICES.map((service) => {
            const Icon = SERVICE_ICONS[service.icon];
            return (
              <div key={service.id} className="civic-card flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {service.name}
                  </h2>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground mb-6">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">
                    Avg. {service.average_service_time_minutes} min per person
                  </span>
                </div>

                <Link
                  to={`/service/${service.id}`}
                  className="mt-auto inline-flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  View Details
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;
