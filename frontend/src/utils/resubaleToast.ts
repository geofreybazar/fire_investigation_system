import { toast } from "@/components/ui/toast";

interface showToastProps {
  title: string;
  description: string;
  priority?: "low" | "high";
  type: string;
}

export const showToast = ({
  title,
  description,
  type,
  priority,
}: showToastProps) => {
  toast.add({
    title,
    type,
    description,
    priority,
  });
};
