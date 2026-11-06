import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Action = {
  label: string;
  onClick: () => void;
};

interface AlertDialogComponent {
  open: boolean;
  setOpen: (isOpen: boolean) => void;
  title: string;
  description: string;
  action: Action;
}

const AlertDialogComponent = ({
  open,
  setOpen,
  title,
  description,
  action,
}: AlertDialogComponent) => {
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction key={action.label} onClick={action.onClick}>
            {action.label}
          </AlertDialogAction>

          <AlertDialogCancel>Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AlertDialogComponent;
