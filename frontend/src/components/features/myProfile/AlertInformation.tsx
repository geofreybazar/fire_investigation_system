import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

const AlertInformation = () => {
  return (
    <Alert className='items-start bg-muted/40' variant={"destructive"}>
      <InfoIcon className='mt-0.5 size-4 shrink-0' />

      <div>
        <AlertTitle>Account Information</AlertTitle>

        <AlertDescription>
          User information can only be updated by your respective office
          administrator.
        </AlertDescription>
      </div>
    </Alert>
  );
};

export default AlertInformation;
