import { cn } from "cn";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui//dialog";
import { Button } from "../ui/button";

type DialogComponentProps = {
  open: boolean;
  buttonLabel?: string;
  dialogTitle: string;
  dialogDescription: string;
  modalOnChange: (isOpen: boolean) => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?:
    | "link"
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "destructive";
  classname?: string;
};

const DialogComponent = ({
  open,
  buttonLabel,
  dialogTitle,
  dialogDescription,
  modalOnChange,
  children,
  icon,
  variant,
  classname,
}: DialogComponentProps) => {
  return (
    <Dialog open={open} onOpenChange={modalOnChange}>
      <DialogTrigger
        render={
          <Button variant={variant}>
            {icon}
            {buttonLabel}
          </Button>
        }
      />
      <DialogContent className={cn(`w-full ${classname}`)}>
        <DialogHeader>
          <DialogTitle className='text-xl font-semibold'>
            {dialogTitle}
          </DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default DialogComponent;
