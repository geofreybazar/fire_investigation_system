import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { cn } from "cn";

type DialogComponentProps = {
  open: boolean;
  buttonLabel?: string;
  dialogTitle: string;
  dialogDescription: string;
  modalOnChange: (isOpen: boolean) => void;
  classname?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?:
    | "link"
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "destructive";
  trigger?: React.ReactElement;
};

const NoButtonDialogComponent = ({
  open,
  dialogTitle,
  dialogDescription,
  modalOnChange,
  classname,
  children,
  trigger,
}: DialogComponentProps) => {
  return (
    <Dialog open={open} onOpenChange={modalOnChange}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className={cn(`${classname}`)}>
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

export default NoButtonDialogComponent;
