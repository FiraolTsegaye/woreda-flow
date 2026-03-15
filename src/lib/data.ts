export interface Service {
  id: string;
  name: string;
  prefix: string;
  icon: string;
  required_documents: string[];
  average_service_time_minutes: number;
}

export interface QueueEntry {
  id: string;
  service_id: string;
  queue_number: string;
  status: "waiting" | "serving" | "done";
  created_at: number;
}

export const SERVICES: Service[] = [
  {
    id: "id-renewal",
    name: "ID Renewal",
    prefix: "A",
    icon: "id-card",
    required_documents: ["Old ID", "2 Passport Photos", "Kebele Letter"],
    average_service_time_minutes: 6,
  },
  {
    id: "birth-certificate",
    name: "Birth Certificate",
    prefix: "B",
    icon: "baby",
    required_documents: ["Parent ID", "Hospital Birth Record", "Kebele Letter", "2 Passport Photos"],
    average_service_time_minutes: 8,
  },
  {
    id: "residence-registration",
    name: "Residence Registration",
    prefix: "R",
    icon: "home",
    required_documents: ["Valid ID", "Lease Agreement or House Ownership Document", "Kebele Letter", "Utility Bill"],
    average_service_time_minutes: 10,
  },
  {
    id: "business-license",
    name: "Business License",
    prefix: "C",
    icon: "briefcase",
    required_documents: ["Valid ID", "TIN Certificate", "Business Plan", "Lease Agreement", "2 Passport Photos"],
    average_service_time_minutes: 15,
  },
  {
    id: "marriage-certificate",
    name: "Marriage Certificate",
    prefix: "M",
    icon: "heart",
    required_documents: ["Both Spouse IDs", "2 Witnesses with ID", "Kebele Letter", "4 Passport Photos"],
    average_service_time_minutes: 12,
  },
];
